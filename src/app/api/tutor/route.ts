import { APICallError, convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream, type UIMessage } from "ai";
import type { AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { z } from "zod";
import { buildInstructions, TutorContextSchema } from "@/lib/ai/prompt";
import { describeSetup, getTutorModel } from "@/lib/ai/provider";

export const maxDuration = 60;

/** Turns provider failures into a sentence the learner can act on (never includes the key). */
function describeStreamError(error: unknown, modelId: string): string {
  if (APICallError.isInstance(error)) {
    const status = error.statusCode ?? 0;
    if (status === 401) return "Anthropic rejected the API key. Check ANTHROPIC_API_KEY in .env.local and restart `npm run dev`.";
    if (status === 403) return "Anthropic refused the request (403) — this key may not have access to the chosen model.";
    if (status === 404) return `Claude model "${modelId}" was not found. Check AI_MODEL in .env.local.`;
    if (status === 429) return "Anthropic rate limit reached. Wait a minute and try again, or set AI_MODEL=claude-sonnet-5-5.";
    if (status === 529 || status >= 500) return "Anthropic is overloaded right now. Try again in a moment.";
    // 400s carry the API's own explanation (credit balance, an option the model rejects, …).
    return `Anthropic rejected the request: ${error.message}`;
  }
  return error instanceof Error ? `Tutor error: ${error.message}` : "The tutor hit an unexpected error.";
}

const Body = z.object({
  messages: z.array(z.custom<UIMessage>((m) => typeof m === "object" && m !== null && "role" in m && "parts" in m)).max(40),
  context: TutorContextSchema,
});

export async function POST(req: Request) {
  const tutor = getTutorModel();
  if (!tutor) {
    return Response.json({ error: "not-configured", message: describeSetup() }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid-body", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
  }
  const { messages, context } = parsed.data;

  // Keep the conversation short — the context block carries the real state.
  const recent = messages.slice(-12);

  const result = streamText({
    model: tutor.model,
    instructions: buildInstructions(context),
    messages: await convertToModelMessages(recent),
    // Claude thinks before every reply and those tokens count against the output cap, so the cap
    // leaves room for them — the instructions keep the visible nudge short. No sampling parameters:
    // current Claude models reject temperature / top_p / top_k.
    maxOutputTokens: 16000,
    providerOptions: {
      anthropic: {
        thinking: { type: "adaptive" },
        effort: tutor.effort,
        // If a safety classifier declines a turn, Anthropic re-runs it on a fallback model inside the
        // same request instead of handing the learner an empty reply.
        fallbacks: "default",
        anthropicBeta: ["server-side-fallback-2026-07-01"],
      } satisfies AnthropicProviderOptions,
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      sendReasoning: false,
      onError: (error) => describeStreamError(error, tutor.modelId),
    }),
  });
}
