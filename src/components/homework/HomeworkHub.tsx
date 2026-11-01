"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Flag, Sparkles } from "lucide-react";
import { homeworkSets, sectionLessons, unitForSection } from "@/content/homework";
import type { CourseMeta } from "@/content/types";
import { useProgressStore } from "@/lib/progress/store";
import { useClock } from "@/lib/useClock";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow, Pill } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function HomeworkHub({ course }: { course: CourseMeta }) {
  const state = useProgressStore((s) => s.state);
  const clock = useClock();
  const titles = new Map(course.units.flatMap((u) => u.lessons.map((l) => [l.id, l.title] as const)));
  const today = clock.today ?? "";

  // The first set due on/after today is "current"; everything before is past.
  const currentIdx = homeworkSets.findIndex((h) => h.due >= today);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8">
      <div>
        <Eyebrow>Math 54 · Fall 2026</Eyebrow>
        <h1 className="mt-1 font-serif text-4xl">Homework companion</h1>
        <p className="mt-2 max-w-xl text-muted">
          Each assignment is linked to the lessons that teach it. The problems themselves stay in your textbook: type one out, and the tutor will nudge you through it without doing it for you — then check your finished work.
        </p>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple" />
            <Eyebrow>Work a problem</Eyebrow>
          </div>
          <p className="mt-1 text-sm text-muted">Paste or type any assigned problem. Nudges only — and a step-by-step check when you&apos;re done.</p>
        </div>
        <Link href="/homework/tutor">
          <Button variant="ink" ledge>
            Open the homework tutor <ArrowRight size={16} />
          </Button>
        </Link>
      </Card>

      <ol className="grid gap-4">
        {homeworkSets.map((hw, i) => {
          const isCurrent = i === currentIdx;
          const isPast = currentIdx === -1 || i < currentIdx;
          const dueLabel = new Date(hw.due + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
          return (
            <li key={hw.id}>
              <Card className={cn("p-5", isCurrent && "border-gold/60 bg-gold-soft/40")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-2xl">Homework {hw.number}</h2>
                    {isCurrent && <Pill tone="gold">up next</Pill>}
                    {isPast && !isCurrent && <Pill>past due</Pill>}
                  </div>
                  <div className="text-sm text-muted">Due {dueLabel} · 11:59 pm PT</div>
                </div>
                <ul className="mt-3 grid gap-3">
                  {hw.sections.map((sec) => {
                    const lessons = sectionLessons[sec.section] ?? [];
                    const unit = unitForSection(sec.section);
                    const allDone = lessons.length > 0 && lessons.every((id) => state.lessons[id]?.status === "completed");
                    return (
                      <li key={sec.section} className="grid gap-1.5 rounded-2xl border border-border bg-surface p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <BookOpen size={16} className="text-muted" />
                            <span className="font-semibold">§{sec.section}</span>
                            <span className="text-sm text-muted">#{sec.problems}</span>
                          </div>
                          {sec.book === "lay" && (
                            <Link href={`/homework/tutor?section=${encodeURIComponent(sec.section)}&hw=${hw.number}`} className="text-sm font-medium text-purple hover:underline">
                              Work a problem →
                            </Link>
                          )}
                        </div>
                        {sec.note && <div className="text-sm text-muted">{sec.note}</div>}
                        {sec.book === "lay" ? (
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            {lessons.map((id) => (
                              <Link key={id} href={`/lesson/${id}`} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5", state.lessons[id]?.status === "completed" ? "border-primary/40 bg-primary-soft text-primary-ink" : "border-border hover:border-border-strong")}>
                                {state.lessons[id]?.status === "completed" && <CheckCircle2 size={13} />}
                                {titles.get(id) ?? id}
                              </Link>
                            ))}
                            {unit && (
                              <Link href={`/practice/${unit}`} className="inline-flex items-center gap-1 rounded-full border border-purple/40 bg-purple-soft px-2.5 py-0.5 text-purple">
                                <Flag size={13} /> Level check
                              </Link>
                            )}
                            {allDone && <Pill tone="green">lessons done</Pill>}
                          </div>
                        ) : (
                          <div className="text-sm text-muted">Differential equations — outside this course for now.</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
