import type { LanguageModel } from "ai";
import { createGoogle } from "@ai-sdk/google";

export type ThinkingLevel = "minimal" | "low" | "medium" | "high";

export interface TutorModel {
  model: LanguageModel;
  provider: "google";
  modelId: string;
  /** Gemini 3+ reasoning depth; undefined for models that don't take `thinkingLevel`. */
  thinkingLevel?: ThinkingLevel;
}

/**
 * The tutor runs on Google Gemini.
 *
 *   GEMINI_API_KEY        — from https://aistudio.google.com/apikey (free tier covers the Flash models)
 *                           GOOGLE_GENERATIVE_AI_API_KEY (the SDK's own name) is accepted too.
 *   AI_MODEL              — optional model id override (default: gemini-3.8-flash)
 *   AI_THINKING_LEVEL     — optional: minimal | low | medium | high (default: medium)
 */
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export const DEFAULT_THINKING_LEVEL: ThinkingLevel = "medium";
const THINKING_LEVELS: readonly string[] = ["minimal", "low", "medium", "high"];

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || undefined;
}

export function getThinkingLevel(): ThinkingLevel {
  const raw = process.env.AI_THINKING_LEVEL?.trim().toLowerCase();
  return raw && THINKING_LEVELS.includes(raw) ? (raw as ThinkingLevel) : DEFAULT_THINKING_LEVEL;
}

/** `thinkingLevel` exists on Gemini 3 and later; 1.x/2.x models use the older budget mechanism. */
export function supportsThinkingLevel(modelId: string): boolean {
  return !/^gemini-(1|2)[.-]/.test(modelId);
}

export function getTutorModel(): TutorModel | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const modelId = process.env.AI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const google = createGoogle({ apiKey });
  return {
    model: google(modelId),
    provider: "google",
    modelId,
    thinkingLevel: supportsThinkingLevel(modelId) ? getThinkingLevel() : undefined,
  };
}

export function describeSetup(): string {
  return [
    "The AI tutor needs a Gemini API key. Add this line to .env.local and restart `npm run dev`:",
    "  GEMINI_API_KEY=...        (free at https://aistudio.google.com/apikey)",
    `Optional: AI_MODEL=<gemini model id> (default ${DEFAULT_GEMINI_MODEL}) and AI_THINKING_LEVEL=minimal|low|medium|high.`,
  ].join("\n");
}
