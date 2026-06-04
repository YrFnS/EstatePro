import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-openrouter-key");
    const model = req.headers.get("x-openrouter-model") || "google/gemini-2.0-flash-001";

    if (!apiKey) {
      return NextResponse.json(
        { reply: "AI is not configured. Please set up your OpenRouter API key in Settings." },
        { status: 401 }
      );
    }

    const { messages, propertyId } = await req.json();

    const systemPrompt = `You are EstatePro AI Assistant, a helpful and knowledgeable real estate advisor. You help users with:
- Finding properties that match their needs
- Answering questions about neighborhoods, pricing, and market trends
- Providing mortgage and financing guidance
- Explaining the buying/renting process
- Giving tips on property investment

Be concise, professional, and helpful. If asked about specific properties, suggest they browse the Properties page. If they want valuation, suggest the Valuation tool. Always respond in the same language the user writes in (English or Arabic).

${propertyId ? `The user is currently viewing a property. Help them with questions about this specific property.` : ""}`;

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const completion = await callOpenRouter(chatMessages, { apiKey, model });
    const reply = completion.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { reply: "I'm currently unavailable. Please try again in a moment." },
      { status: 500 }
    );
  }
}
