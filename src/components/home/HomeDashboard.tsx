"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, BookOpen, Sigma, Wrench, type LucideIcon } from "lucide-react";
import type { CourseMeta } from "@/content/types";
import type { ProgressState } from "@/lib/progress/types";
import { useProgressStore } from "@/lib/progress/store";
import { dueProblems, getStreakStatus } from "@/lib/progress/logic";
import { STREAK_PROBLEMS_PER_DAY } from "@/lib/progress/types";
import { useClock } from "@/lib/useClock";
import { useTutorStatus } from "@/components/tutor/useTutorStatus";
import { Button } from "@/components/ui/Button";
import { Card, Meter } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface CourseLook {
  /** Position on the home page. */
  order: number;
  icon: LucideIcon;
  tone: string;
  /** An upcoming exam, shown beside the lesson count through `until` (an ISO day). */
  exam?: { until: string; label: string };
}

const LOOKS: Record<string, CourseLook> = {
  "solid-mechanics": { order: 0, icon: Wrench, tone: "bg-orange-soft text-orange", exam: { until: "2026-12-17", label: "Final Dec 17" } },
  "linear-algebra": { order: 1, icon: Sigma, tone: "bg-blue-soft text-blue" },
};

const DEFAULT_LOOK: CourseLook = { order: Number.MAX_SAFE_INTEGER, icon: BookOpen, tone: "bg-blue-soft text-blue" };

const lookOf = (courseId: string) => LOOKS[courseId] ?? DEFAULT_LOOK;

export function HomeDashboard({ courses }: { courses: CourseMeta[] }) {
  const state = useProgressStore((s) => s.state);
  const hydrated = useProgressStore((s) => s.hydrated);
  const sync = useProgressStore((s) => s.sync);
  const tutor = useTutorStatus();

  const ordered = useMemo(() => [...courses].sort((a, b) => lookOf(a.id).order - lookOf(b.id).order), [courses]);
  const clock = useClock();
  const today = clock.today ?? "";
  const streak = clock.today ? getStreakStatus(state, clock.today) : { current: 0, status: "none" as const };
  const act = state.activity[today] ?? { problems: 0, lessons: 0 };
  const goalDone = act.lessons >= 1 || act.problems >= STREAK_PROBLEMS_PER_DAY;
  const due = clock.now ? dueProblems(state, clock.now).length : 0;
  const hour = clock.hour ?? 12;
  const greeting = hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = state.settings.name?.trim();

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
      <p className="text-sm text-muted">{clock.dateLabel ?? "Today"}</p>
      <h1 className="mt-1 font-serif text-4xl">
        {greeting}
        {name ? `, ${name}` : ""}.
      </h1>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {ordered.map((c) => (
          <CourseCard key={c.id} course={c} state={state} today={clock.today} />
        ))}
      </div>

      <dl className="mt-5 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-surface">
        <Stat label="Day streak" value={hydrated ? String(streak.current) : "–"} />
        <Stat label="Today" value={goalDone ? "Done" : `${act.problems} of ${STREAK_PROBLEMS_PER_DAY}`} />
        <Stat label="Due for review" value={hydrated ? String(due) : "–"} href={due > 0 ? "/review" : undefined} />
      </dl>

      {(sync === "error" || sync === "offline") && <p className="mt-4 text-sm text-muted">Progress is being kept in this browser only — the local server could not save it.</p>}
      {tutor !== null && !tutor.configured && (
        <p className="mt-4 text-sm text-muted">
          The AI tutor is not connected yet.{" "}
          <Link href="/settings" className="font-medium text-text underline underline-offset-4">
            Set it up
          </Link>
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-2xl tabular-nums">{value}</dd>
    </>
  );
  return href ? (
    <Link href={href} className="block px-5 py-4 transition-colors hover:bg-surface-2">
      {body}
    </Link>
  ) : (
    <div className="px-5 py-4">{body}</div>
  );
}

/** One course: how far along you are and the single next thing to do. */
function CourseCard({ course, state, today }: { course: CourseMeta; state: ProgressState; today: string | null }) {
  const look = lookOf(course.id);
  const lessons = useMemo(() => course.units.flatMap((u) => u.lessons.map((l) => ({ ...l, unitTitle: u.title }))), [course]);
  const completed = lessons.filter((l) => state.lessons[l.id]?.status === "completed").length;
  const inProgress = lessons.find((l) => state.lessons[l.id]?.status === "in-progress" && state.lessons[l.id]?.stepIndex > 0);
  const nextUp = inProgress ?? lessons.find((l) => state.lessons[l.id]?.status !== "completed");
  // Client-only (the server has no "today"), and gone once the exam day has passed.
  const exam = look.exam && today !== null && today <= look.exam.until ? look.exam.label : null;

  return (
    <Card as="section" className="flex flex-col p-6">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", look.tone)}>
          <look.icon size={19} />
        </span>
        <div className="min-w-0">
          <h2 className="font-serif text-2xl leading-tight">{course.title}</h2>
          <p className="text-sm text-muted">
            {completed} of {course.lessonCount} lessons{exam ? ` · ${exam}` : ""}
          </p>
        </div>
      </div>
      <Meter value={completed} max={course.lessonCount} className="mt-5" />

      <div className="mt-6 flex-1">
        {nextUp ? (
          <>
            <p className="text-sm text-muted">{inProgress ? "Continue" : completed === 0 ? "Start here" : "Up next"}</p>
            <p className="mt-1 text-lg font-medium leading-snug">{nextUp.title}</p>
            <p className="mt-0.5 text-sm text-muted">
              {nextUp.unitTitle} · {nextUp.minutes} min
            </p>
          </>
        ) : (
          <p className="text-lg font-medium leading-snug">Every lesson done. Keep the level checks and reviews going.</p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-5">
        {nextUp && (
          <Link href={`/lesson/${nextUp.id}`}>
            <Button variant="primary" size="lg" ledge>
              {inProgress ? "Continue" : "Start"} <ArrowRight size={17} />
            </Button>
          </Link>
        )}
        <Link href={`/course/${course.id}`} className="text-sm font-medium text-muted transition-colors hover:text-text">
          All lessons
        </Link>
      </div>
    </Card>
  );
}
