"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useProgressStore } from "@/lib/progress/store";
import { dueProblems, weakProblems } from "@/lib/progress/logic";
import { useClock } from "@/lib/useClock";
import { Button } from "@/components/ui/Button";

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
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
      <h1 className="font-serif text-4xl">Review</h1>
      <p className="mt-2 max-w-xl text-muted">Problems come back on a schedule: soon after a miss, further apart each time you get them right.</p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
        <div>
          <p className="text-sm text-muted">Due now</p>
          <p className="mt-0.5 font-serif text-3xl tabular-nums">{hydrated ? due.length : "–"}</p>
          {due.length === 0 && <p className="mt-1 text-sm text-muted">{seen ? "Nothing due. Come back tomorrow." : "Do a lesson first. Its problems will show up here."}</p>}
        </div>
        {due.length > 0 && (
          <Link href={href(dueKeys)}>
            <Button variant="primary" size="lg" ledge>
              Start review <ArrowRight size={17} />
            </Button>
          </Link>
        )}
      </div>

      {weak.length > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-2xl">Missed before</h2>
            <Link href={href(weakKeys)} className="text-sm font-medium text-muted hover:text-text">
              Practise these
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {weak.map((p) => (
              <li key={p.key} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px]">{p.label ?? p.key}</p>
                  {p.lessonId && (
                    <Link href={`/lesson/${p.lessonId}`} className="text-sm text-muted hover:text-text">
                      Open the lesson
                    </Link>
                  )}
                </div>
                <p className="shrink-0 text-sm tabular-nums text-muted">
                  {p.wrong} missed · {p.correct} right
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
