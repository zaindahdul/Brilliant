import { convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream, type UIMessage } from "ai";
import { z } from "zod";
import { buildInstructions, TutorContextSchema } from "@/lib/ai/prompt";
import { describeSetup, getTutorModel } from "@/lib/ai/provider";

export const maxDuration = 60;

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
    temperature: 0.4,
    maxOutputTokens: 700,
    ...(process.env.AI_REASONING_EFFORT && tutor.provider === "xai"
      ? { providerOptions: { xai: { reasoningEffort: process.env.AI_REASONING_EFFORT as "low" | "medium" | "high" } } }
      : {}),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, sendReasoning: false }),
  });
}
