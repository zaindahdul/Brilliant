"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { defaultHomeworkCourseId, getHomeworkCourse, homeworkCourses, homeworkTitle, lessonsForSection, prettyLessonId, sectionLabel, unitForSection, type HomeworkCourse, type HomeworkSet } from "@/content/homework";
import type { CourseMeta } from "@/content/types";
import { useProgressStore } from "@/lib/progress/store";
import { useClock } from "@/lib/useClock";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function HomeworkHub({ courses }: { courses: CourseMeta[] }) {
  const clock = useClock();
  const today = clock.today ?? "";
  // Until the learner picks a class, show the one with the nearest deadline.
  const [picked, setPicked] = useState<string | null>(null);
  const hc = getHomeworkCourse(picked ?? defaultHomeworkCourseId(today)) ?? homeworkCourses[0];
  const meta = courses.find((c) => c.id === hc.courseId);

  // The first set due on/after today is "current"; everything before is past.
  const currentIdx = hc.sets.findIndex((h) => h.due >= today);
  const current = currentIdx === -1 ? null : hc.sets[currentIdx];
  const upcoming = currentIdx === -1 ? [] : hc.sets.slice(currentIdx + 1);
  const past = (currentIdx === -1 ? hc.sets : hc.sets.slice(0, currentIdx)).slice().reverse();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
      <h1 className="font-serif text-4xl">Homework</h1>
      <p className="mt-2 max-w-xl text-muted">Each assignment links to the lessons that teach it. Bring any problem to the tutor: it helps you work it out and checks your finished solution, but it will not solve it for you.</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Class" className="flex rounded-full bg-surface-2 p-1">
          {homeworkCourses.map((c) => {
            const active = c.courseId === hc.courseId;
            return (
              <button key={c.courseId} type="button" aria-pressed={active} onClick={() => setPicked(c.courseId)} className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors", active ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text")}>
                {c.title}
              </button>
            );
          })}
        </div>
        <Link href={`/homework/tutor?${new URLSearchParams({ course: hc.courseId })}`}>
          <Button variant="primary" size="lg" ledge>
            Work a problem <ArrowRight size={17} />
          </Button>
        </Link>
      </div>

      {current && (
        <section className="mt-10">
          <p className="text-sm text-muted">Due next</p>
          <SetView hc={hc} hw={current} meta={meta} />
        </section>
      )}

      {upcoming.length > 0 && <SetGroup title="Later" hc={hc} sets={upcoming} meta={meta} />}
      {past.length > 0 && <SetGroup title="Past" hc={hc} sets={past} meta={meta} />}
    </div>
  );
}

function dueLabel(hw: HomeworkSet): string {
  return new Date(hw.due + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** Collapsed list of assignments; each one opens to its sections. */
function SetGroup({ title, hc, sets, meta }: { title: string; hc: HomeworkCourse; sets: HomeworkSet[]; meta: CourseMeta | undefined }) {
  return (
    <section className="mt-10">
      <p className="text-sm text-muted">{title}</p>
      <div className="mt-2 divide-y divide-border border-y border-border">
        {sets.map((hw) => (
          <details key={hw.id} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 [&::-webkit-details-marker]:hidden">
              <span className="text-[15.5px] font-medium">{homeworkTitle(hw)}</span>
              <span className="flex items-center gap-2 text-sm text-muted">
                {dueLabel(hw)}
                <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
              </span>
            </summary>
            <div className="pb-5">
              <SetView hc={hc} hw={hw} meta={meta} bare />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/** One assignment: its sections, the problems assigned from each, and the lessons that teach them. */
function SetView({ hc, hw, meta, bare = false }: { hc: HomeworkCourse; hw: HomeworkSet; meta: CourseMeta | undefined; bare?: boolean }) {
  const state = useProgressStore((s) => s.state);
  // Lesson ids are authored separately from this schedule, so look titles up rather than assume them.
  const titles = new Map(meta?.units.flatMap((u) => u.lessons.map((l) => [l.id, l.title] as const)) ?? []);
  const unitsWithLessons = new Set(meta?.units.filter((u) => u.lessons.length > 0).map((u) => u.id) ?? []);

  return (
    <div>
      {!bare && (
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl">{homeworkTitle(hw)}</h2>
          <p className="text-sm text-muted">
            {dueLabel(hw)} · {hc.dueTime}
          </p>
        </div>
      )}
      {hw.note && <p className="mt-1 text-sm text-muted">{hw.note}</p>}
      <ul className={cn("grid gap-3", !bare && "mt-4")}>
        {hw.sections.map((sec) => {
          const lessons = lessonsForSection(sec.section, hc.sectionLessons);
          const unit = unitForSection(sec.section, hc.sectionLessons);
          // Problems from the class's own textbook can go to the tutor, covered by lessons yet or not.
          const tutorable = sec.book === hc.book && sec.problems !== "";
          return (
            <li key={sec.section} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[15.5px]">
                  <span className="font-medium">{sectionLabel(sec.section)}</span>
                  {sec.problems && <span className="text-muted"> · problems {sec.problems}</span>}
                </p>
                {tutorable && (
                  <Link href={`/homework/tutor?${new URLSearchParams({ course: hc.courseId, section: sec.section, hw: hw.id })}`} className="text-sm font-medium text-muted hover:text-text">
                    Get help
                  </Link>
                )}
              </div>
              {sec.note && <p className="mt-1 text-sm text-muted">{sec.note}</p>}
              {lessons.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {lessons.map((id) => {
                    const title = titles.get(id);
                    const done = state.lessons[id]?.status === "completed";
                    return title ? (
                      <Link key={id} href={`/lesson/${id}`} className="inline-flex items-center gap-1 text-muted underline decoration-border-strong underline-offset-4 hover:text-text">
                        {done && <Check size={13} className="text-primary" strokeWidth={3} />}
                        {title}
                      </Link>
                    ) : (
                      <span key={id} className="text-muted">
                        {prettyLessonId(id)}
                      </span>
                    );
                  })}
                  {unit && unitsWithLessons.has(unit) && (
                    <Link href={`/practice/${unit}`} className="text-muted underline decoration-border-strong underline-offset-4 hover:text-text">
                      Level check
                    </Link>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
