import type { LanguageModel } from "ai";
import { createXai } from "@ai-sdk/xai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export interface TutorModel {
  model: LanguageModel;
  provider: "xai" | "groq" | "openai-compatible" | "gateway";
  modelId: string;
}

/**
 * Picks a provider from environment variables. Whichever key you have works:
 *   XAI_API_KEY                      → xAI Grok (default grok-4-1-fast-reasoning)
 *   GROQ_API_KEY                     → Groq (default openai/gpt-oss-120b)
 *   OPENAI_COMPATIBLE_BASE_URL + OPENAI_COMPATIBLE_API_KEY (+ AI_MODEL)
 *   AI_GATEWAY_API_KEY + AI_MODEL="provider/model" → Vercel AI Gateway
 * AI_MODEL overrides the default model id for any provider.
 */
export function getTutorModel(): TutorModel | null {
  const override = process.env.AI_MODEL?.trim();

  if (process.env.XAI_API_KEY) {
    const modelId = override || "grok-4-1-fast-reasoning";
    const xai = createXai({ apiKey: process.env.XAI_API_KEY });
    return { model: xai(modelId), provider: "xai", modelId };
  }
  if (process.env.GROQ_API_KEY) {
    const modelId = override || "openai/gpt-oss-120b";
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    return { model: groq(modelId), provider: "groq", modelId };
  }
  if (process.env.OPENAI_COMPATIBLE_BASE_URL) {
    const modelId = override;
    if (!modelId) return null;
    const provider = createOpenAICompatible({
      name: "custom",
      baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL,
      apiKey: process.env.OPENAI_COMPATIBLE_API_KEY ?? "none",
    });
    return { model: provider(modelId), provider: "openai-compatible", modelId };
  }
  if (process.env.AI_GATEWAY_API_KEY && override?.includes("/")) {
    // A plain "provider/model" string routes through Vercel AI Gateway.
    return { model: override, provider: "gateway", modelId: override };
  }
  return null;
}

export function describeSetup(): string {
  return [
    "No AI provider configured. Add one of these to .env.local and restart `npm run dev`:",
    "  XAI_API_KEY=...           (Grok — https://console.x.ai)",
    "  GROQ_API_KEY=...          (Groq free tier — https://console.groq.com)",
    "  OPENAI_COMPATIBLE_BASE_URL=... OPENAI_COMPATIBLE_API_KEY=... AI_MODEL=...",
    "Optional: AI_MODEL=<model id> to override the default model.",
  ].join("\n");
}
