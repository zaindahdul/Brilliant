import { connection } from "next/server";
import { courses } from "@/content/course";
import { withLessonContext } from "@/content/context";
import { isQuestion, type QuestionStep } from "@/content/types";

/**
 * Looks up question content by progress key so the review page can rebuild a
 * set of previously-missed problems without shipping the whole course to the
 * client. Keys: "<lessonId>:<stepId>" or "practice:<unitId>:<stepId>".
 * Generated problems ("gen:...") are regenerated client-side instead.
 */
export async function GET(req: Request) {
  await connection();
  const url = new URL(req.url);
  const keys = (url.searchParams.get("keys") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 60);

  const problems: Record<string, { unitId: string; lessonId?: string; step: QuestionStep }> = {};

  for (const key of keys) {
    if (key.startsWith("gen:")) continue;
    if (key.startsWith("practice:")) {
      const [, unitId, ...rest] = key.split(":");
      const stepId = rest.join(":");
      for (const c of courses) {
        const u = c.units.find((x) => x.id === unitId);
        const step = u?.practice.find((s) => s.id === stepId);
        if (u && step) problems[key] = { unitId: u.id, step: { ...step, id: key } };
      }
      continue;
    }
    const idx = key.indexOf(":");
    if (idx === -1) continue;
    const lessonId = key.slice(0, idx);
    const stepId = key.slice(idx + 1);
    for (const c of courses) {
      for (const u of c.units) {
        const l = u.lessons.find((x) => x.id === lessonId);
        const step = l?.steps.find((s) => s.id === stepId);
        // A follow-up question ("same shaft…") gets the setup it refers to folded into its body.
        if (l && step && isQuestion(step)) problems[key] = { unitId: u.id, lessonId: l.id, step: { ...withLessonContext(l, step), id: key } };
      }
    }
  }

  return Response.json({ problems }, { headers: { "cache-control": "no-store" } });
}
