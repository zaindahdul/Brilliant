"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Check, Flag, Play, Star } from "lucide-react";
import type { CourseMeta, LessonMeta } from "@/content/types";
import { useProgressStore } from "@/lib/progress/store";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow, Pill } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type NodeState = "completed" | "in-progress" | "current" | "upcoming";

const OFFSETS = ["translate-x-0", "translate-x-12", "translate-x-0", "-translate-x-12"];

export function CourseMap({ course }: { course: CourseMeta }) {
  const state = useProgressStore((s) => s.state);
  const hydrated = useProgressStore((s) => s.hydrated);

  const ordered = useMemo(() => course.units.flatMap((u) => u.lessons), [course]);
  const completedCount = ordered.filter((l) => state.lessons[l.id]?.status === "completed").length;
  const currentId = ordered.find((l) => state.lessons[l.id]?.status !== "completed")?.id ?? null;
  const current = ordered.find((l) => l.id === currentId) ?? null;
  const currentUnit = current ? course.units.find((u) => u.id === current.unitId) : null;

  const stateOf = (l: LessonMeta): NodeState => {
    const lp = state.lessons[l.id];
    if (lp?.status === "completed") return "completed";
    if (l.id === currentId) return "current";
    if (lp?.status === "in-progress" && lp.stepIndex > 0) return "in-progress";
    return "upcoming";
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[320px_1fr]">
      {/* sticky info card */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card className="grid gap-4 p-5">
          <div>
            <Eyebrow>Course</Eyebrow>
            <h1 className="mt-1 font-serif text-3xl">{course.title}</h1>
            <p className="mt-2 text-sm text-muted">{course.tagline}</p>
          </div>
          <div className="text-sm text-muted">
            {course.lessonCount} lessons · {course.exerciseCount} exercises
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>
                {hydrated ? completedCount : 0} of {course.lessonCount} completed
              </span>
              <span>{Math.round((100 * completedCount) / Math.max(1, course.lessonCount))}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(100 * completedCount) / Math.max(1, course.lessonCount)}%` }} />
            </div>
          </div>
          {current && (
            <div className="rounded-2xl border border-gold/50 bg-gold-soft p-4">
              <Eyebrow className="text-gold-ink">Up next · {currentUnit?.title}</Eyebrow>
              <div className="mt-1 font-serif text-lg">{current.title}</div>
              <p className="mt-1 text-sm text-muted">~{current.minutes} min</p>
              <Link href={`/lesson/${current.id}`} className="mt-3 block">
                <Button variant="gold" size="lg" ledge full>
                  <Play size={16} /> {state.lessons[current.id]?.stepIndex ? "Continue" : "Start"}
                </Button>
              </Link>
            </div>
          )}
          <p className="text-xs text-muted">Lessons are in the recommended order but you can open any of them. Each unit ends with a Level Check.</p>
        </Card>
      </aside>

      {/* winding path */}
      <div className="grid gap-10">
        {course.units.map((u, ui) => {
          const unitLessons = u.lessons;
          const unitDone = unitLessons.length > 0 && unitLessons.every((l) => state.lessons[l.id]?.status === "completed");
          const sessions = state.sessions.filter((s) => s.unitId === u.id && s.mode !== "review");
          const best = sessions.length ? Math.max(...sessions.map((s) => Math.round((100 * s.firstTry) / Math.max(1, s.total)))) : null;
          return (
            <section key={u.id} id={u.id} className="scroll-mt-24">
              <div className={cn("rounded-3xl border px-5 py-4", unitDone ? "border-primary/40 bg-primary-soft/60" : "border-border bg-surface-2/70")}>
                <Eyebrow>
                  Unit {ui + 1} · {u.textbook}
                </Eyebrow>
                <h2 className="mt-1 font-serif text-2xl">{u.title}</h2>
                <p className="mt-1 text-sm text-muted">{u.description}</p>
              </div>

              {unitLessons.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted">Lessons for this unit are coming next.</p>
              ) : (
                <ol className="relative mx-auto mt-6 grid max-w-md gap-7">
                  {unitLessons.map((l, i) => {
                    const s = stateOf(l);
                    const lp = state.lessons[l.id];
                    return (
                      <li key={l.id} className={cn("flex flex-col items-center transition-transform", OFFSETS[i % OFFSETS.length])}>
                        <Link href={`/lesson/${l.id}`} className="group flex flex-col items-center" aria-label={`${l.title} — ${s}`}>
                          <span
                            className={cn(
                              "flex h-16 w-16 items-center justify-center rounded-full border-4 text-white transition-transform group-hover:scale-105",
                              s === "completed" && "border-primary-hover bg-primary",
                              s === "current" && "border-[#b58600] bg-gold text-[#2a1f00] pulse-ring",
                              s === "in-progress" && "border-gold bg-gold-soft text-gold-ink",
                              s === "upcoming" && "border-border-strong bg-surface-3 text-muted",
                            )}
                          >
                            {s === "completed" ? <Check size={26} strokeWidth={3} /> : s === "current" ? <Play size={24} className="bob" /> : <Star size={22} />}
                          </span>
                          <span className={cn("mt-2 max-w-[180px] text-center text-sm font-medium leading-tight", s === "upcoming" ? "text-muted" : "text-text")}>{l.title}</span>
                          <span className="mt-0.5 text-xs text-muted">
                            {l.textbook} · {l.minutes} min
                            {lp?.bestFirstTryPct !== undefined && ` · best ${lp.bestFirstTryPct}%`}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                  {/* Level check node */}
                  <li className={cn("flex flex-col items-center", OFFSETS[unitLessons.length % OFFSETS.length])}>
                    <Link href={`/practice/${u.id}`} className="group flex flex-col items-center" aria-label={`Level check for ${u.title}`}>
                      <span className={cn("flex h-16 w-16 items-center justify-center rounded-2xl border-4 transition-transform group-hover:scale-105", best !== null && best >= 80 ? "border-primary-hover bg-primary text-white" : "border-purple bg-purple-soft text-purple")}>
                        <Flag size={24} />
                      </span>
                      <span className="mt-2 text-sm font-semibold">Level check</span>
                      <span className="mt-0.5 text-xs text-muted">
                        {u.practiceCount}+ problems{best !== null && ` · best ${best}%`}
                      </span>
                    </Link>
                  </li>
                </ol>
              )}
            </section>
          );
        })}

        {/* Plain-text list for accessibility / scanning */}
        <section className="rounded-3xl border border-border bg-surface p-5">
          <Eyebrow>All lessons</Eyebrow>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {course.units.map((u) => (
              <div key={u.id}>
                <div className="font-semibold">{u.title}</div>
                <ol className="mt-1 grid gap-1 text-sm">
                  {u.lessons.map((l) => (
                    <li key={l.id} className="flex items-center gap-2">
                      <Link href={`/lesson/${l.id}`} className="text-muted hover:text-text hover:underline">
                        {l.title}
                      </Link>
                      {state.lessons[l.id]?.status === "completed" && <Pill tone="green">done</Pill>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">{course.description}</p>
        </section>
      </div>
    </div>
  );
}
