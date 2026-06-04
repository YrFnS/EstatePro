import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, propertyId } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    const inquiry = await db.inquiry.create({
      data: {
        name,
        email,
        phone: phone || null,
        message,
        propertyId: propertyId || null,
      },
    });

    return NextResponse.json({ success: true, id: inquiry.id });
  } catch (error) {
    console.error("Error saving inquiry:", error);
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 });
  }
}
