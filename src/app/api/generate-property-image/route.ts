import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request, "property-image", {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many image requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt || prompt.length > 1_000) {
      return NextResponse.json(
        { error: "A prompt between 1 and 1,000 characters is required." },
        { status: 400 }
      );
    }

    const enhancedPrompt = `Professional real estate photography, ${prompt}, high quality, well-lit, interior design, architectural photography style, 4k resolution`;
    const zai = await ZAI.create();
    const response = await zai.images.generate({
      prompt: enhancedPrompt,
      size: "1024x1024",
    });

    const imageData = response?.data?.[0];
    if (imageData?.url) {
      return NextResponse.json({ imageUrl: imageData.url });
    }
    if (imageData?.b64_json) {
      return NextResponse.json({
        imageUrl: `data:image/png;base64,${imageData.b64_json}`,
      });
    }

    return NextResponse.json(
      { error: "The image provider did not return an image." },
      { status: 502 }
    );
  } catch (error) {
    console.error("Property image generation error:", error);
    return NextResponse.json(
      { error: "Image generation failed. Please try again later." },
      { status: 500 }
    );
  }
}
