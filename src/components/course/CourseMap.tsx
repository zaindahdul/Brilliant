"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Check, Flag } from "lucide-react";
import type { CourseMeta, LessonMeta } from "@/content/types";
import { useProgressStore } from "@/lib/progress/store";
import { Button } from "@/components/ui/Button";
import { Meter } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type RowState = "completed" | "current" | "in-progress" | "upcoming";

/** The course page: progress, the next lesson, then every unit as a plain list. */
export function CourseMap({ course }: { course: CourseMeta }) {
  const state = useProgressStore((s) => s.state);
  const hydrated = useProgressStore((s) => s.hydrated);

  const ordered = useMemo(() => course.units.flatMap((u) => u.lessons), [course]);
  const completedCount = hydrated ? ordered.filter((l) => state.lessons[l.id]?.status === "completed").length : 0;
  const inProgress = ordered.find((l) => state.lessons[l.id]?.status === "in-progress" && state.lessons[l.id]?.stepIndex > 0);
  const current = inProgress ?? ordered.find((l) => state.lessons[l.id]?.status !== "completed") ?? null;

  const stateOf = (l: LessonMeta): RowState => {
    const lp = state.lessons[l.id];
    if (lp?.status === "completed") return "completed";
    if (l.id === current?.id) return "current";
    if (lp?.status === "in-progress" && lp.stepIndex > 0) return "in-progress";
    return "upcoming";
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
      <h1 className="font-serif text-4xl">{course.title}</h1>
      <p className="mt-2 max-w-xl text-muted">{course.tagline}</p>

      <div className="mt-6 flex items-center gap-4">
        <Meter value={completedCount} max={course.lessonCount} className="flex-1" />
        <span className="shrink-0 text-sm tabular-nums text-muted">
          {completedCount} of {course.lessonCount} lessons
        </span>
      </div>

      {current && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
          <div className="min-w-0">
            <p className="text-sm text-muted">{inProgress ? "Continue" : completedCount === 0 ? "Start here" : "Up next"}</p>
            <p className="mt-0.5 text-lg font-medium leading-snug">{current.title}</p>
          </div>
          <Link href={`/lesson/${current.id}`}>
            <Button variant="primary" size="lg" ledge>
              {inProgress ? "Continue" : "Start"} <ArrowRight size={17} />
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-12 grid gap-12">
        {course.units.map((u, ui) => {
          const done = u.lessons.filter((l) => state.lessons[l.id]?.status === "completed").length;
          const sessions = state.sessions.filter((s) => s.unitId === u.id && s.mode !== "review");
          const best = sessions.length ? Math.max(...sessions.map((s) => Math.round((100 * s.firstTry) / Math.max(1, s.total)))) : null;
          return (
            <section key={u.id} id={u.id} className="scroll-mt-20">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm text-muted">Unit {ui + 1}</p>
                <p className="text-sm tabular-nums text-muted">
                  {hydrated ? done : 0} / {u.lessons.length}
                </p>
              </div>
              <h2 className="mt-1 font-serif text-2xl">{u.title}</h2>
              <p className="mt-1 text-[15px] text-muted">{u.subtitle}</p>

              <ol className="mt-4 divide-y divide-border border-y border-border">
                {u.lessons.map((l) => {
                  const s = stateOf(l);
                  return (
                    <li key={l.id}>
                      <Link href={`/lesson/${l.id}`} className="group flex items-center gap-4 py-3.5">
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                            s === "completed" && "border-primary bg-primary text-white",
                            s === "current" && "border-primary",
                            s === "in-progress" && "border-gold",
                            s === "upcoming" && "border-border-strong",
                          )}
                          aria-hidden
                        >
                          {s === "completed" ? <Check size={14} strokeWidth={3} /> : s === "current" ? <span className="h-2 w-2 rounded-full bg-primary" /> : s === "in-progress" ? <span className="h-2 w-2 rounded-full bg-gold" /> : null}
                        </span>
                        <span className={cn("min-w-0 flex-1 text-[15.5px] group-hover:underline group-hover:underline-offset-4", s === "current" && "font-medium")}>{l.title}</span>
                        <span className="shrink-0 text-sm tabular-nums text-muted">{l.minutes} min</span>
                        <span className="sr-only">{s === "completed" ? "Completed" : s === "current" ? "Up next" : s === "in-progress" ? "In progress" : "Not started"}</span>
                      </Link>
                    </li>
                  );
                })}
                {u.lessons.length > 0 && (
                  <li>
                    <Link href={`/practice/${u.id}`} className="group flex items-center gap-4 py-3.5">
                      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center", best !== null && best >= 80 ? "text-primary" : "text-muted")} aria-hidden>
                        <Flag size={17} />
                      </span>
                      <span className="min-w-0 flex-1 text-[15.5px] group-hover:underline group-hover:underline-offset-4">Level check</span>
                      <span className="shrink-0 text-sm tabular-nums text-muted">{best !== null ? `Best ${best}%` : "No hints"}</span>
                    </Link>
                  </li>
                )}
              </ol>
              {u.lessons.length === 0 && <p className="mt-4 text-sm text-muted">Lessons for this unit are on the way.</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
