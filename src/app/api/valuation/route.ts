import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-openrouter-key");
    const model = request.headers.get("x-openrouter-model") || "google/gemini-2.0-flash-001";

    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 401 });
    }

    const body = await request.json();
    const {
      address,
      propertyType,
      size,
      bedrooms,
      bathrooms,
      yearBuilt,
      features,
    } = body;

    if (!propertyType || !size || !bedrooms || !bathrooms) {
      return NextResponse.json(
        { error: "Missing required fields: propertyType, size, bedrooms, bathrooms" },
        { status: 400 }
      );
    }

    // Fetch comparable properties from database for market analysis
    const { db } = await import("@/lib/db");

    const comparableProperties = await db.property.findMany({
      where: {
        type: propertyType,
        area: { gte: Number(size) * 0.5, lte: Number(size) * 2 },
        bedrooms: { gte: Math.max(1, Number(bedrooms) - 2), lte: Number(bedrooms) + 2 },
      },
      take: 20,
      orderBy: { price: "desc" },
    });

    const avgCompPrice =
      comparableProperties.length > 0
        ? comparableProperties.reduce((sum, p) => sum + p.price, 0) / comparableProperties.length
        : 500000;

    const compData = comparableProperties.slice(0, 5).map((p) => ({
      price: p.price,
      area: p.area,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      location: p.locationEn,
      yearBuilt: p.yearBuilt,
      features: p.features,
    }));

    const propertyDetails = {
      address: address || "Not provided",
      propertyType,
      size: Number(size),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      yearBuilt: yearBuilt ? Number(yearBuilt) : null,
      features: features || [],
    };

    const prompt = `You are an expert real estate appraiser AI. Estimate the market value of the following property based on its details and comparable sales data.

Property Details:
${JSON.stringify(propertyDetails, null, 2)}

Comparable Properties in the Area (recent listings):
${JSON.stringify(compData, null, 2)}

Average comparable price: $${Math.round(avgCompPrice).toLocaleString()}

Provide a realistic property valuation with the following details. Be realistic and data-driven in your estimates.

IMPORTANT: Respond with valid JSON only, no additional text. Format:
{
  "estimatedValue": 650000,
  "confidenceLow": 580000,
  "confidenceHigh": 720000,
  "marketTrend": "appreciating",
  "investmentScore": 75,
  "positiveFactors": ["Great location", "Modern features", "Growing area"],
  "negativeFactors": ["Older construction", "Limited parking"],
  "scoreBreakdown": {
    "locationQuality": 80,
    "propertyCondition": 70,
    "marketDemand": 85,
    "futurePotential": 78
  },
  "valueBreakdown": {
    "baseValue": 600000,
    "featureBonus": 30000,
    "locationAdjustment": 15000,
    "marketAdjustment": 5000
  },
  "neighborhoodAvg": 620000,
  "cityAvg": 580000
}

Market trend must be one of: "appreciating", "stable", "depreciating"
Investment score must be between 1-100
All monetary values should be realistic based on the comparable data provided.`;

    const completion = await callOpenRouter(
      [
        { role: "system", content: "You are a professional real estate appraiser AI that provides accurate property valuations based on market data. Always respond with valid JSON." },
        { role: "user", content: prompt },
      ],
      { apiKey, model }
    );

    const content = completion.choices?.[0]?.message?.content || "";

    let valuation;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      valuation = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      valuation = null;
    }

    // Fallback if AI parsing fails
    if (!valuation || !valuation.estimatedValue) {
      const baseValue = Math.round(avgCompPrice);
      const featureCount = Array.isArray(features) ? features.length : 0;
      const featureBonus = featureCount * 15000;
      const estimatedValue = baseValue + featureBonus;
      const range = Math.round(estimatedValue * 0.12);

      valuation = {
        estimatedValue,
        confidenceLow: estimatedValue - range,
        confidenceHigh: estimatedValue + range,
        marketTrend: "stable",
        investmentScore: 65,
        positiveFactors: features.slice(0, 3) || ["Good property condition"],
        negativeFactors: ["Limited comparable data"],
        scoreBreakdown: {
          locationQuality: 65,
          propertyCondition: 70,
          marketDemand: 60,
          futurePotential: 65,
        },
        valueBreakdown: {
          baseValue,
          featureBonus,
          locationAdjustment: 0,
          marketAdjustment: 0,
        },
        neighborhoodAvg: Math.round(avgCompPrice * 0.95),
        cityAvg: Math.round(avgCompPrice * 0.9),
      };
    }

    return NextResponse.json({
      valuation,
      comparableCount: comparableProperties.length,
    });
  } catch (error) {
    console.error("Error in property valuation:", error);
    return NextResponse.json({
      valuation: {
        estimatedValue: 500000,
        confidenceLow: 440000,
        confidenceHigh: 560000,
        marketTrend: "stable",
        investmentScore: 50,
        positiveFactors: ["Data unavailable"],
        negativeFactors: ["Database unavailable - using fallback estimate"],
        scoreBreakdown: {
          locationQuality: 50,
          propertyCondition: 50,
          marketDemand: 50,
          futurePotential: 50,
        },
        valueBreakdown: {
          baseValue: 500000,
          featureBonus: 0,
          locationAdjustment: 0,
          marketAdjustment: 0,
        },
        neighborhoodAvg: 475000,
        cityAvg: 450000,
      },
      comparableCount: 0,
      fallback: true,
    });
  }
}
