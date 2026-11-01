"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useProgressStore } from "@/lib/progress/store";
import { dueProblems, weakProblems } from "@/lib/progress/logic";
import { useClock } from "@/lib/useClock";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow, Pill } from "@/components/ui/Card";

const MAX_SET = 15;

export function ReviewHub() {
  const state = useProgressStore((s) => s.state);
  const hydrated = useProgressStore((s) => s.hydrated);
  const clock = useClock();
  const now = clock.now;
  const due = useMemo(() => (now ? dueProblems(state, now) : []), [state, now]);
  const weak = useMemo(() => weakProblems(state, 20), [state]);
  const seen = Object.keys(state.problems).length;

  const dueKeys = due.slice(0, MAX_SET).map((p) => p.key);
  const weakKeys = weak.slice(0, MAX_SET).map((p) => p.key);
  const href = (keys: string[]) => `/review/session?keys=${encodeURIComponent(keys.join(","))}`;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8">
      <div>
        <Eyebrow>Spaced review</Eyebrow>
        <h1 className="mt-1 font-serif text-4xl">Recall, don&apos;t recognise.</h1>
        <p className="mt-2 max-w-xl text-muted">
          Problems you miss come back later, with the interval growing each time you get them right. Problems you got right return too — spaced out — so the knowledge sticks past the exam.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="grid content-between gap-4 p-5">
          <div>
            <div className="flex items-center gap-2">
              <RotateCcw size={18} className="text-purple" />
              <Eyebrow>Due now</Eyebrow>
            </div>
            <div className="mt-2 font-serif text-4xl">{hydrated ? due.length : "–"}</div>
            <p className="text-sm text-muted">{due.length ? `Up to ${MAX_SET} per session, oldest first.` : seen ? "Nothing due. Come back tomorrow." : "Do a lesson first — missed problems will appear here."}</p>
          </div>
          {due.length > 0 ? (
            <Link href={href(dueKeys)}>
              <Button variant="ink" size="lg" ledge full>
                Start review ({Math.min(due.length, MAX_SET)}) <ArrowRight size={16} />
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="lg" full disabled>
              Nothing due
            </Button>
          )}
        </Card>

        <Card className="grid content-between gap-4 p-5">
          <div>
            <Eyebrow>Weak spots</Eyebrow>
            <div className="mt-2 font-serif text-4xl">{hydrated ? weak.length : "–"}</div>
            <p className="text-sm text-muted">Problems you&apos;ve missed at least once, hardest first. Drill them any time.</p>
          </div>
          {weak.length > 0 ? (
            <Link href={href(weakKeys)}>
              <Button variant="outline" size="lg" full>
                Drill weak spots ({Math.min(weak.length, MAX_SET)})
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="lg" full disabled>
              No weak spots yet
            </Button>
          )}
        </Card>
      </div>

      {weak.length > 0 && (
        <Card className="p-5">
          <Eyebrow>What you keep missing</Eyebrow>
          <ul className="mt-3 grid gap-2">
            {weak.map((p) => (
              <li key={p.key} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate">{p.label ?? p.key}</div>
                  <div className="text-xs text-muted">
                    {p.lessonId ? (
                      <Link href={`/lesson/${p.lessonId}`} className="hover:underline">
                        re-open lesson
                      </Link>
                    ) : (
                      "practice problem"
                    )}
                    {p.tags?.length ? ` · ${p.tags.join(", ")}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Pill tone="danger">{p.wrong} wrong</Pill>
                  <Pill tone="green">{p.correct} right</Pill>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
