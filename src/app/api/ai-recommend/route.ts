import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callOpenRouter } from "@/lib/openrouter";
import { db } from "@/lib/db";
import { buildPropertyWhere } from "@/lib/property-filters";
import { checkRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  minBudget: z.union([z.number(), z.string()]).optional(),
  maxBudget: z.union([z.number(), z.string()]).optional(),
  propertyType: z.string().trim().max(50).optional(),
  preferredArea: z.string().trim().max(200).optional(),
  minBedrooms: z.union([z.number(), z.string()]).optional(),
  minBathrooms: z.union([z.number(), z.string()]).optional(),
  lifestylePreferences: z.array(z.string().trim().max(100)).max(20).optional(),
  additionalNotes: z.string().trim().max(2_000).optional(),
});

function positiveNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request, "ai-recommend", {
    limit: 20,
    windowMs: 10 * 60 * 1_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many recommendation requests", recommendations: [] },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const apiKey = request.headers.get("x-openrouter-key");
    const model =
      request.headers.get("x-openrouter-model") ||
      "google/gemini-2.0-flash-001";

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OpenRouter API key not configured",
          recommendations: [],
        },
        { status: 401 }
      );
    }

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid recommendation preferences", recommendations: [] },
        { status: 400 }
      );
    }

    const preferences = parsed.data;
    const searchParams = new URLSearchParams();
    const minBudget = positiveNumber(preferences.minBudget);
    const maxBudget = positiveNumber(preferences.maxBudget);
    const minBedrooms = positiveNumber(preferences.minBedrooms);
    const minBathrooms = positiveNumber(preferences.minBathrooms);

    if (minBudget) searchParams.set("minPrice", String(minBudget));
    if (maxBudget) searchParams.set("maxPrice", String(maxBudget));
    if (
      preferences.propertyType &&
      preferences.propertyType !== "any"
    ) {
      searchParams.set("type", preferences.propertyType);
    }
    if (
      preferences.preferredArea &&
      preferences.preferredArea !== "any"
    ) {
      searchParams.set("search", preferences.preferredArea);
    }
    if (minBedrooms) {
      searchParams.set("bedrooms", String(Math.floor(minBedrooms)));
    }
    if (minBathrooms) {
      searchParams.set("bathrooms", String(Math.floor(minBathrooms)));
    }

    const properties = await db.property.findMany({
      where: buildPropertyWhere(searchParams),
      take: 20,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      include: {
        agent: {
          select: { id: true, nameEn: true, nameAr: true },
        },
        media: {
          where: { type: "image" },
          orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
          take: 4,
        },
      },
    });

    if (!properties.length) {
      return NextResponse.json({
        recommendations: [],
        message: "No properties found matching your criteria",
      });
    }

    const propertiesData = properties.map((property) => ({
      id: property.id,
      title: property.titleEn,
      type: property.type,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      location: property.locationEn,
      city: property.cityEn,
      features: property.features,
      status: property.status,
      yearBuilt: property.yearBuilt,
      featured: property.featured,
    }));

    const prompt = `You are an expert real-estate advisor. Rank the five strongest matches from the supplied published listings.

User preferences:
${JSON.stringify(
      {
        ...preferences,
        minBudget: minBudget || "any",
        maxBudget: maxBudget || "any",
        minBedrooms: minBedrooms || "any",
        minBathrooms: minBathrooms || "any",
      },
      null,
      2
    )}

Available published properties:
${JSON.stringify(propertiesData, null, 2)}

Return valid JSON only:
{"recommendations":[{"id":"property_id","matchScore":85,"reasoning":"Two or three concise sentences."}]}

Sort by matchScore descending. Use only IDs from the supplied list and include only scores of 30 or higher.`;

    const completion = await callOpenRouter(
      [
        {
          role: "system",
          content:
            "You are a real-estate recommendation engine. Return valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      { apiKey, model }
    );

    const content = completion.choices?.[0]?.message?.content || "";
    let recommendationsInput: Array<{
      id: string;
      matchScore: number;
      reasoning: string;
    }> = [];
    try {
      const match = content.match(/\{[\s\S]*\}/);
      const value = match ? JSON.parse(match[0]) : {};
      if (Array.isArray(value.recommendations)) {
        recommendationsInput = value.recommendations;
      }
    } catch {
      recommendationsInput = [];
    }

    const recommendations = recommendationsInput
      .slice(0, 5)
      .map((recommendation) => {
        const property = properties.find(
          (item) => item.id === recommendation.id
        );
        if (!property) return null;
        return {
          property,
          matchScore: Math.max(
            0,
            Math.min(100, Number(recommendation.matchScore) || 50)
          ),
          reasoning:
            typeof recommendation.reasoning === "string"
              ? recommendation.reasoning.slice(0, 1_000)
              : "This property matches your general preferences.",
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      recommendations,
      totalAnalyzed: properties.length,
    });
  } catch (error) {
    console.error("Error in AI recommendation:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations", recommendations: [] },
      { status: 500 }
    );
  }
}
