"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Flag, Sparkles } from "lucide-react";
import { defaultHomeworkCourseId, getHomeworkCourse, homeworkCourses, homeworkTitle, lessonsForSection, prettyLessonId, sectionLabel, unitForSection } from "@/content/homework";
import type { CourseMeta } from "@/content/types";
import { useProgressStore } from "@/lib/progress/store";
import { useClock } from "@/lib/useClock";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow, Pill } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function HomeworkHub({ courses }: { courses: CourseMeta[] }) {
  const state = useProgressStore((s) => s.state);
  const clock = useClock();
  const today = clock.today ?? "";
  // Until the learner picks a class, show the one with the nearest deadline.
  const [picked, setPicked] = useState<string | null>(null);
  const hc = getHomeworkCourse(picked ?? defaultHomeworkCourseId(today)) ?? homeworkCourses[0];

  // Lesson ids are authored separately from this schedule, so look titles up rather than assume them.
  const meta = courses.find((c) => c.id === hc.courseId);
  const titles = new Map(meta?.units.flatMap((u) => u.lessons.map((l) => [l.id, l.title] as const)) ?? []);
  const unitsWithLessons = new Set(meta?.units.filter((u) => u.lessons.length > 0).map((u) => u.id) ?? []);
  const tutorHref = (params: Record<string, string> = {}) => `/homework/tutor?${new URLSearchParams({ course: hc.courseId, ...params })}`;

  // The first set due on/after today is "current"; everything before is past.
  const currentIdx = hc.sets.findIndex((h) => h.due >= today);

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8">
      <div>
        <Eyebrow>
          {hc.title} · {hc.subtitle}
        </Eyebrow>
        <h1 className="mt-1 font-serif text-4xl">Homework companion</h1>
        <p className="mt-2 max-w-xl text-muted">
          Each assignment is linked to the lessons that teach it. The problems themselves stay in your textbook: type one out, and the tutor will nudge you through it without doing it for you — then check your finished work.
        </p>
      </div>

      <div role="group" aria-label="Class" className="flex w-full rounded-full bg-surface-2 p-1 sm:w-fit">
        {homeworkCourses.map((c) => {
          const active = c.courseId === hc.courseId;
          return (
            <button
              key={c.courseId}
              type="button"
              aria-pressed={active}
              onClick={() => setPicked(c.courseId)}
              className={cn("flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors sm:flex-none", active ? "bg-text text-bg" : "text-muted hover:text-text")}
            >
              {c.title}
            </button>
          );
        })}
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple" />
            <Eyebrow>Work a problem</Eyebrow>
          </div>
          <p className="mt-1 text-sm text-muted">Paste or type any assigned problem. Nudges only — and a step-by-step check when you&apos;re done.</p>
        </div>
        <Link href={tutorHref()}>
          <Button variant="ink" ledge>
            Open the homework tutor <ArrowRight size={16} />
          </Button>
        </Link>
      </Card>

      <ol className="grid gap-4">
        {hc.sets.map((hw, i) => {
          const isCurrent = i === currentIdx;
          const isPast = currentIdx === -1 || i < currentIdx;
          const dueLabel = new Date(hw.due + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
          return (
            <li key={hw.id}>
              <Card className={cn("p-5", isCurrent && "border-gold/60 bg-gold-soft/40")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-2xl">{homeworkTitle(hw)}</h2>
                    {isCurrent && <Pill tone="gold">up next</Pill>}
                    {isPast && !isCurrent && <Pill>past due</Pill>}
                  </div>
                  <div className="text-sm text-muted">
                    Due {dueLabel} · {hc.dueTime}
                  </div>
                </div>
                {hw.note && <p className="mt-1 text-sm text-muted">{hw.note}</p>}
                <ul className="mt-3 grid gap-3">
                  {hw.sections.map((sec) => {
                    const lessons = lessonsForSection(sec.section, hc.sectionLessons);
                    const unit = unitForSection(sec.section, hc.sectionLessons);
                    // Problems from the class's own textbook can go to the tutor, covered by lessons yet or not.
                    const tutorable = sec.book === hc.book && sec.problems !== "";
                    const allDone = lessons.length > 0 && lessons.every((id) => state.lessons[id]?.status === "completed");
                    return (
                      <li key={sec.section} className="grid gap-1.5 rounded-2xl border border-border bg-surface p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <BookOpen size={16} className="text-muted" />
                            <span className="font-semibold">{sectionLabel(sec.section)}</span>
                            {sec.problems && <span className="text-sm text-muted">#{sec.problems}</span>}
                          </div>
                          {tutorable && (
                            <Link href={tutorHref({ section: sec.section, hw: hw.id })} className="text-sm font-medium text-purple hover:underline">
                              Work a problem →
                            </Link>
                          )}
                        </div>
                        {sec.note && <div className="text-sm text-muted">{sec.note}</div>}
                        {lessons.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            {lessons.map((id) => {
                              const title = titles.get(id);
                              const done = state.lessons[id]?.status === "completed";
                              return title ? (
                                <Link key={id} href={`/lesson/${id}`} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5", done ? "border-primary/40 bg-primary-soft text-primary-ink" : "border-border hover:border-border-strong")}>
                                  {done && <CheckCircle2 size={13} />}
                                  {title}
                                </Link>
                              ) : (
                                <span key={id} title="This lesson is still being written" className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-muted">
                                  {prettyLessonId(id)}
                                </span>
                              );
                            })}
                            {unit && unitsWithLessons.has(unit) && (
                              <Link href={`/practice/${unit}`} className="inline-flex items-center gap-1 rounded-full border border-purple/40 bg-purple-soft px-2.5 py-0.5 text-purple">
                                <Flag size={13} /> Level check
                              </Link>
                            )}
                            {allDone && <Pill tone="green">lessons done</Pill>}
                          </div>
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
