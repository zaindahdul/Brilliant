import type { LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

/** Anthropic `output_config.effort`: how hard Claude thinks before each nudge. */
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface TutorModel {
  model: LanguageModel;
  provider: "anthropic";
  modelId: string;
  effort: Effort;
}

/**
 * The tutor runs on Claude through the Anthropic API.
 *
 *   ANTHROPIC_API_KEY — from the Claude Developer Platform console (https://platform.claude.com → API keys)
 *   AI_MODEL          — optional model id override (default: claude-opus-5-5;
 *                       claude-sonnet-5-5 and claude-haiku-5-5 are faster and cheaper)
 *   AI_EFFORT         — optional: low | medium | high | xhigh | max (default: medium)
 *
 * Current Claude models think adaptively on every request; `effort` is the only
 * depth control, and thinking tokens count against the output cap.
 */
export const DEFAULT_MODEL = "claude-opus-5-5";
export const DEFAULT_EFFORT: Effort = "medium";
const EFFORTS: readonly string[] = ["low", "medium", "high", "xhigh", "max"];

export function getAnthropicApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY?.trim() || undefined;
}

export function getEffort(): Effort {
  const raw = process.env.AI_EFFORT?.trim().toLowerCase();
  return raw && EFFORTS.includes(raw) ? (raw as Effort) : DEFAULT_EFFORT;
}

export function getTutorModel(): TutorModel | null {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) return null;
  const modelId = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
  const anthropic = createAnthropic({ apiKey });
  return { model: anthropic(modelId), provider: "anthropic", modelId, effort: getEffort() };
}

export function describeSetup(): string {
  return [
    "The AI tutor needs an Anthropic API key. Add this line to .env.local and restart `npm run dev`:",
    "  ANTHROPIC_API_KEY=...     (from https://platform.claude.com → API keys)",
    `Optional: AI_MODEL=<claude model id> (default ${DEFAULT_MODEL}) and AI_EFFORT=low|medium|high|xhigh|max (default ${DEFAULT_EFFORT}).`,
  ].join("\n");
}
