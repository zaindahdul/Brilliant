import { connection } from "next/server";
import { getTutorModel, describeSetup } from "@/lib/ai/provider";

export async function GET() {
  await connection();
  const tutor = getTutorModel();
  return Response.json(
    tutor
      ? { configured: true, provider: tutor.provider, model: tutor.modelId, thinkingLevel: tutor.thinkingLevel ?? null }
      : { configured: false, help: describeSetup() },
    { headers: { "cache-control": "no-store" } },
  );
}
