import { APICallError, convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream, type UIMessage } from "ai";
import type { GoogleLanguageModelOptions } from "@ai-sdk/google";
import { z } from "zod";
import { buildInstructions, TutorContextSchema } from "@/lib/ai/prompt";
import { describeSetup, getTutorModel } from "@/lib/ai/provider";

export const maxDuration = 60;

/** Turns provider failures into a sentence the learner can act on (never includes the key). */
function describeStreamError(error: unknown, modelId: string): string {
  if (APICallError.isInstance(error)) {
    const status = error.statusCode ?? 0;
    if (status === 400 && /api key/i.test(error.message)) {
      return "Gemini rejected the API key. Check GEMINI_API_KEY in .env.local and restart `npm run dev`.";
    }
    if (status === 404) return `Gemini model "${modelId}" was not found. Check AI_MODEL in .env.local.`;
    if (status === 403) return "Gemini refused the request (403) — this key may not have access to the chosen model.";
    if (status === 429) return "Gemini rate limit reached. Wait a minute and try again, or set AI_MODEL=gemini-3.5-flash-lite.";
    if (status >= 500) return "Gemini is having trouble right now. Try again in a moment.";
    return `Gemini error: ${error.message}`;
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
    // Gemini 3 is tuned for its default temperature (1.0); Google warns that lowering it can cause
    // looping, so it is left alone. Thinking tokens count against the output cap, so the cap leaves
    // room for them — the instructions keep the visible reply short.
    maxOutputTokens: 6000,
    ...(tutor.thinkingLevel
      ? {
          providerOptions: {
            google: {
              thinkingConfig: { thinkingLevel: tutor.thinkingLevel, includeThoughts: false },
            } satisfies GoogleLanguageModelOptions,
          },
        }
      : {}),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      sendReasoning: false,
      onError: (error) => describeStreamError(error, tutor.modelId),
    }),
  });
}
