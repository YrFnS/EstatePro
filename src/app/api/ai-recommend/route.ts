import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-openrouter-key");
    const model = request.headers.get("x-openrouter-model") || "google/gemini-2.0-flash-001";

    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured", recommendations: [] }, { status: 401 });
    }

    const body = await request.json();
    const {
      minBudget,
      maxBudget,
      propertyType,
      preferredArea,
      minBedrooms,
      minBathrooms,
      lifestylePreferences,
      additionalNotes,
    } = body;

    // Fetch properties from database
    const { db } = await import("@/lib/db");

    const where: Record<string, unknown> = {};

    if (minBudget || maxBudget) {
      where.price = {};
      if (minBudget) (where.price as Record<string, unknown>).gte = Number(minBudget);
      if (maxBudget) (where.price as Record<string, unknown>).lte = Number(maxBudget);
    }

    if (propertyType && propertyType !== "any") {
      where.type = propertyType;
    }

    if (minBedrooms) {
      where.bedrooms = { gte: Number(minBedrooms) };
    }

    if (minBathrooms) {
      where.bathrooms = { gte: Number(minBathrooms) };
    }

    if (preferredArea && preferredArea !== "any") {
      where.OR = [
        { locationEn: { contains: preferredArea } },
        { locationAr: { contains: preferredArea } },
        { cityEn: { contains: preferredArea } },
        { cityAr: { contains: preferredArea } },
      ];
    }

    const properties = await db.property.findMany({
      where,
      take: 20,
      orderBy: { featured: "desc" },
      include: {
        agent: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
          },
        },
      },
    });

    if (properties.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: "No properties found matching your criteria",
      });
    }

    const propertiesData = properties.map((p) => ({
      id: p.id,
      title: p.titleEn,
      type: p.type,
      price: p.price,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      area: p.area,
      location: p.locationEn,
      city: p.cityEn,
      features: p.features,
      status: p.status,
      yearBuilt: p.yearBuilt,
      featured: p.featured,
    }));

    const userPrefs = {
      minBudget: minBudget || "any",
      maxBudget: maxBudget || "any",
      propertyType: propertyType || "any",
      preferredArea: preferredArea || "any",
      minBedrooms: minBedrooms || "any",
      minBathrooms: minBathrooms || "any",
      lifestylePreferences: lifestylePreferences || [],
      additionalNotes: additionalNotes || "",
    };

    const prompt = `You are an expert real estate AI advisor. Analyze the user's preferences and recommend the top 5 best matching properties from the available list.

User Preferences:
${JSON.stringify(userPrefs, null, 2)}

Available Properties:
${JSON.stringify(propertiesData, null, 2)}

For each recommended property, provide:
1. The property id
2. A match score (0-100%) based on how well it matches ALL user preferences
3. A brief "why this matches" explanation (2-3 sentences) highlighting how it fits the user's budget, type, location, lifestyle preferences, and other criteria

IMPORTANT: Respond with valid JSON only, no additional text. Format:
{
  "recommendations": [
    {
      "id": "property_id",
      "matchScore": 85,
      "reasoning": "This property matches because..."
    }
  ]
}

Sort recommendations by matchScore from highest to lowest. Only include properties with a matchScore of at least 30.`;

    const completion = await callOpenRouter(
      [
        { role: "system", content: "You are a real estate AI advisor that analyzes property data and user preferences to provide personalized recommendations. Always respond with valid JSON." },
        { role: "user", content: prompt },
      ],
      { apiKey, model }
    );

    const content = completion.choices?.[0]?.message?.content || "";

    let aiResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      aiResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : { recommendations: [] };
    } catch {
      aiResponse = { recommendations: [] };
    }

    // Merge AI analysis with property data
    const recommendations = (aiResponse.recommendations || [])
      .slice(0, 5)
      .map((rec: { id: string; matchScore: number; reasoning: string }) => {
        const property = properties.find((p) => p.id === rec.id);
        if (!property) return null;
        return {
          property,
          matchScore: rec.matchScore || 50,
          reasoning: rec.reasoning || "This property matches your general preferences.",
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
