"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { QuestionStep } from "@/content/types";
import { generate, parseGeneratedKey } from "@/content/generators";
import { PracticePlayer, type PracticeProblem } from "@/components/player/PracticePlayer";

/**
 * Unit ids carry their course ("u3" is Math 54's linear algebra, "sm2" is solid
 * mechanics), which is all the tutor needs here — no course content on the client.
 */
function courseOfUnit(unitId: string): { id: string; title: string } | null {
  if (/^sm\d+$/.test(unitId)) return { id: "solid-mechanics", title: "Solid Mechanics" };
  if (/^u\d+$/.test(unitId)) return { id: "linear-algebra", title: "Linear Algebra" };
  return null;
}

const MIXED = { id: "review", title: "Review" };

export function ReviewSession() {
  const params = useSearchParams();
  const keysParam = params.get("keys") ?? "";
  const [set, setSet] = useState<PracticeProblem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const keys = keysParam.split(",").map((k) => k.trim()).filter(Boolean);
      const out: (PracticeProblem & { order: number })[] = [];
      const toFetch: string[] = [];
      keys.forEach((key, order) => {
        const g = parseGeneratedKey(key);
        if (g) {
          // regenerate a *fresh* instance of the same generator — surface details change, idea stays
          const fresh = generate(g.id, Math.floor(Math.random() * 2 ** 31));
          if (fresh) out.push({ key: fresh.key, unitId: fresh.unitId, step: fresh.step, order });
        } else toFetch.push(key);
      });
      if (toFetch.length > 0) {
        const res = await fetch(`/api/problems?keys=${encodeURIComponent(toFetch.join(","))}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { problems: Record<string, { unitId: string; lessonId?: string; step: QuestionStep }> };
        for (const key of toFetch) {
          const p = json.problems[key];
          if (p) out.push({ key, unitId: p.unitId, lessonId: p.lessonId, step: p.step, order: keys.indexOf(key) });
        }
      }
      out.sort((a, b) => a.order - b.order);
      return out.map((p) => ({ key: p.key, unitId: p.unitId, lessonId: p.lessonId, courseId: courseOfUnit(p.unitId)?.id, step: p.step }));
    }
    load()
      .then((set) => {
        if (!cancelled) setSet(set);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the review problems.");
      });
    return () => {
      cancelled = true;
    };
  }, [keysParam]);

  if (error)
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-muted">
        {error}{" "}
        <Link href="/review" className="underline">
          Back to review
        </Link>
      </div>
    );
  if (!set) return <div className="flex min-h-dvh items-center justify-center text-muted">Building your review set…</div>;

  // A set from one course is that course's review; a mixed set is just "Review", and each problem tells the tutor its own course.
  const shared = set.length > 0 && set.every((p) => p.courseId === set[0].courseId) ? courseOfUnit(set[0].unitId) : null;

  return <PracticePlayer unit={{ id: "review", title: "Review" }} course={shared ?? MIXED} problems={[]} generatorIds={[]} fixed={set} mode="review" backHref="/review" />;
}
