// OpenRouter API utility - uses user's API key and model preference

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
}

export const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

// Suggested models on OpenRouter - users can type any model ID they want
export const SUGGESTED_MODELS = [
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", provider: "Google" },
  { id: "google/gemini-2.5-pro-preview", name: "Gemini 2.5 Pro", provider: "Google" },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", provider: "Anthropic" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", provider: "Meta" },
  { id: "meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B", provider: "Meta" },
  { id: "mistralai/mistral-small-3.1-24b-instruct", name: "Mistral Small 3.1", provider: "Mistral" },
  { id: "deepseek/deepseek-chat-v3-0324", name: "DeepSeek V3", provider: "DeepSeek" },
  { id: "qwen/qwen3-235b-a22b", name: "Qwen3 235B", provider: "Qwen" },
  { id: "x-ai/grok-3-mini-beta", name: "Grok 3 Mini", provider: "xAI" },
] as const;

// Backward compatibility alias
export const AVAILABLE_MODELS = SUGGESTED_MODELS;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
}

/**
 * Call OpenRouter Chat Completions API
 */
export async function callOpenRouter(
  messages: ChatMessage[],
  config: OpenRouterConfig,
  options?: { temperature?: number; max_tokens?: number }
): Promise<ChatCompletionResponse> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://estatepro.app",
      "X-Title": "EstatePro",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  return response.json();
}
