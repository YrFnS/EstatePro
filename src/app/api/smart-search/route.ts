import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

export interface SmartSearchParams {
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string;
  bathrooms?: string;
  location?: string;
  status?: string;
  minArea?: number;
  maxArea?: number;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-openrouter-key");
    const model = req.headers.get("x-openrouter-model") || "google/gemini-2.0-flash-001";

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured. Please set up your API key in Settings.", params: {} },
        { status: 401 }
      );
    }

    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required", params: {} },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a real estate search query parser. Your job is to extract structured search parameters from natural language queries about properties.

You must extract the following fields if mentioned or implied in the query:
- propertyType: The type of property (e.g., "apartment", "villa", "house", "condo", "townhouse", "penthouse", "studio", "loft", "land", "commercial")
- minPrice: Minimum price as a number (no commas, no currency symbols)
- maxPrice: Maximum price as a number (no commas, no currency symbols)
- bedrooms: Minimum bedrooms as a string like "3+" meaning 3 or more. If they say "3 bedroom", use "3+". If they say "3-4 bedrooms", use "3+".
- bathrooms: Minimum bathrooms as a string like "2+"
- location: The location, neighborhood, city, or area mentioned (e.g., "Manhattan", "Downtown", "Waterfront")
- status: "sale" if they want to buy, "rent" if they want to rent. Default to "sale" if unclear.
- minArea: Minimum area in sqft as a number
- maxArea: Maximum area in sqft as a number

IMPORTANT RULES:
- Convert "$500K" to 500000, "$1.2M" to 1200000, "under $500K" means maxPrice: 500000
- "3-bed" or "3 bedroom" means bedrooms: "3+"
- "near downtown" means location: "downtown"
- "for rent" means status: "rent"
- "for sale" or "to buy" means status: "sale"
- Only include fields that are mentioned or clearly implied in the query
- Do NOT make up values that aren't in the query
- Always respond with valid JSON only, no additional text

Example inputs and outputs:
Input: "3 bedroom apartment in Manhattan under 800000 for rent"
Output: {"propertyType":"apartment","maxPrice":800000,"bedrooms":"3+","location":"Manhattan","status":"rent"}

Input: "5-bed homes near downtown under $500K"
Output: {"propertyType":"house","maxPrice":500000,"bedrooms":"5+","location":"downtown","status":"sale"}

Input: "spacious villa with pool over 2000 sqft between 300K and 600K"
Output: {"propertyType":"villa","minPrice":300000,"maxPrice":600000,"minArea":2000,"status":"sale"}`;

    const completion = await callOpenRouter(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Parse this real estate search query: "${query.trim()}"` },
      ],
      { apiKey, model },
      { temperature: 0.1, max_tokens: 512 }
    );

    const content = completion.choices?.[0]?.message?.content || "";

    let params: SmartSearchParams;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      params = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      params = {};
    }

    // Clean up and validate the parsed params
    const cleanParams: SmartSearchParams = {};

    if (params.propertyType && typeof params.propertyType === "string") {
      const validTypes = ["apartment", "villa", "house", "condo", "townhouse", "penthouse", "studio", "loft", "land", "commercial"];
      const normalizedType = params.propertyType.toLowerCase().trim();
      if (validTypes.includes(normalizedType)) {
        cleanParams.propertyType = normalizedType;
      }
    }

    if (params.minPrice && typeof params.minPrice === "number" && params.minPrice > 0) {
      cleanParams.minPrice = params.minPrice;
    }

    if (params.maxPrice && typeof params.maxPrice === "number" && params.maxPrice > 0) {
      cleanParams.maxPrice = params.maxPrice;
    }

    if (params.bedrooms && typeof params.bedrooms === "string" && /^\d+\+?$/.test(params.bedrooms)) {
      cleanParams.bedrooms = params.bedrooms.endsWith("+") ? params.bedrooms : `${params.bedrooms}+`;
    } else if (typeof params.bedrooms === "number" && params.bedrooms > 0) {
      cleanParams.bedrooms = `${params.bedrooms}+`;
    }

    if (params.bathrooms && typeof params.bathrooms === "string" && /^\d+\+?$/.test(params.bathrooms)) {
      cleanParams.bathrooms = params.bathrooms.endsWith("+") ? params.bathrooms : `${params.bathrooms}+`;
    } else if (typeof params.bathrooms === "number" && params.bathrooms > 0) {
      cleanParams.bathrooms = `${params.bathrooms}+`;
    }

    if (params.location && typeof params.location === "string") {
      cleanParams.location = params.location.trim();
    }

    if (params.status && ["sale", "rent"].includes(params.status)) {
      cleanParams.status = params.status;
    }

    if (params.minArea && typeof params.minArea === "number" && params.minArea > 0) {
      cleanParams.minArea = params.minArea;
    }

    if (params.maxArea && typeof params.maxArea === "number" && params.maxArea > 0) {
      cleanParams.maxArea = params.maxArea;
    }

    return NextResponse.json({ params: cleanParams, query: query.trim() });
  } catch (error) {
    console.error("Smart search API error:", error);
    return NextResponse.json(
      { error: "Failed to parse search query", params: {} },
      { status: 500 }
    );
  }
}
