import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "A prompt is required. Example: 'modern apartment interior'" },
        { status: 400 }
      );
    }

    // Enhance the prompt for real estate property images
    const enhancedPrompt = `Professional real estate photography, ${prompt.trim()}, high quality, well-lit, interior design, architectural photography style, 4k resolution`;

    const zai = new ZAI();
    const response = await zai.images.generate({
      prompt: enhancedPrompt,
      size: "1024x1024",
    });

    // The SDK returns image data; we need to convert to base64 data URL
    if (response && response.data && response.data.length > 0) {
      const imageData = response.data[0];

      // If the response contains a URL, use it directly
      if (imageData.url) {
        return NextResponse.json({ imageUrl: imageData.url });
      }

      // If the response contains base64 data, format as data URL
      if (imageData.b64_json) {
        const dataUrl = `data:image/png;base64,${imageData.b64_json}`;
        return NextResponse.json({ imageUrl: dataUrl });
      }
    }

    // Fallback: return error if no image was generated
    return NextResponse.json(
      { error: "Failed to generate image. Please try again." },
      { status: 500 }
    );
  } catch (error) {
    console.error("Property image generation error:", error);
    return NextResponse.json(
      { error: "Image generation failed. Please try again later." },
      { status: 500 }
    );
  }
}
