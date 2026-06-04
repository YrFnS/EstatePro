import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const bedrooms = searchParams.get("bedrooms");
    const bathrooms = searchParams.get("bathrooms");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minArea = searchParams.get("minArea");
    const maxArea = searchParams.get("maxArea");
    const agentId = searchParams.get("agentId");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "9");
    const skip = (page - 1) * limit;

    const where: any = {};

    const { db } = await import("@/lib/db");

    if (featured === "true") where.featured = true;
    if (agentId) where.agentId = agentId;
    if (status && status !== "all") where.status = status;
    if (type && type !== "all") where.type = type;
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms) };
    if (bathrooms) where.bathrooms = { gte: parseInt(bathrooms) };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (minArea || maxArea) {
      where.area = {};
      if (minArea) where.area.gte = parseFloat(minArea);
      if (maxArea) where.area.lte = parseFloat(maxArea);
    }
    if (search) {
      where.OR = [
        { titleEn: { contains: search } },
        { titleAr: { contains: search } },
        { locationEn: { contains: search } },
        { locationAr: { contains: search } },
        { cityEn: { contains: search } },
        { cityAr: { contains: search } },
      ];
    }

    const orderBy: any = {};
    switch (sort) {
      case "priceLow":
        orderBy.price = "asc";
        break;
      case "priceHigh":
        orderBy.price = "desc";
        break;
      case "largest":
        orderBy.area = "desc";
        break;
      default:
        orderBy.createdAt = "desc";
    }

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          agent: {
            select: {
              id: true,
              nameEn: true,
              nameAr: true,
              titleEn: true,
              titleAr: true,
              email: true,
              phone: true,
              image: true,
              rating: true,
            },
          },
        },
      }),
      db.property.count({ where }),
    ]);

    return NextResponse.json({
      properties,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json({ properties: [], total: 0, totalPages: 0, currentPage: 1, fallback: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "titleEn", "titleAr", "descriptionEn", "descriptionAr",
      "price", "type", "status", "bedrooms", "bathrooms", "area",
      "locationEn", "locationAr", "addressEn", "addressAr",
      "cityEn", "cityAr",
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = body[field];
      return value === undefined || value === null || value === "";
    });

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (typeof body.price !== "number" || body.price <= 0) {
      return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
    }
    if (typeof body.bedrooms !== "number" || body.bedrooms < 0) {
      return NextResponse.json({ error: "Bedrooms must be a non-negative number" }, { status: 400 });
    }
    if (typeof body.bathrooms !== "number" || body.bathrooms < 0) {
      return NextResponse.json({ error: "Bathrooms must be a non-negative number" }, { status: 400 });
    }
    if (typeof body.area !== "number" || body.area <= 0) {
      return NextResponse.json({ error: "Area must be a positive number" }, { status: 400 });
    }

    // Validate status and type
    if (!["sale", "rent"].includes(body.status)) {
      return NextResponse.json({ error: "Status must be 'sale' or 'rent'" }, { status: 400 });
    }
    const validTypes = ["apartment", "villa", "house", "condo", "townhouse", "penthouse"];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json({ error: `Type must be one of: ${validTypes.join(", ")}` }, { status: 400 });
    }

    const { db } = await import("@/lib/db");

    const property = await db.property.create({
      data: {
        titleEn: body.titleEn,
        titleAr: body.titleAr,
        descriptionEn: body.descriptionEn,
        descriptionAr: body.descriptionAr,
        price: body.price,
        type: body.type,
        status: body.status,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        area: body.area,
        locationEn: body.locationEn,
        locationAr: body.locationAr,
        addressEn: body.addressEn,
        addressAr: body.addressAr,
        cityEn: body.cityEn,
        cityAr: body.cityAr,
        images: body.images || "",
        features: body.features || "",
        yearBuilt: body.yearBuilt || null,
        parking: body.parking || 0,
        featured: false,
        badge: null,
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json({ property: null, fallback: true });
  }
}
