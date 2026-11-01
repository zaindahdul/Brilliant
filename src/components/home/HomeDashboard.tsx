"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BatteryCharging, BookOpen, Flame, RotateCcw, Sparkles, Target } from "lucide-react";
import type { CourseMeta, LessonMeta } from "@/content/types";
import { useProgressStore } from "@/lib/progress/store";
import { dueProblems, getStreakStatus, weakProblems, xpThisWeek, xpToday, xpTotal } from "@/lib/progress/logic";
import { STREAK_PROBLEMS_PER_DAY } from "@/lib/progress/types";
import { useClock } from "@/lib/useClock";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow, Pill } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function HomeDashboard({ course }: { course: CourseMeta }) {
  const state = useProgressStore((s) => s.state);
  const hydrated = useProgressStore((s) => s.hydrated);
  const sync = useProgressStore((s) => s.sync);
  const [tutor, setTutor] = useState<{ configured: boolean; model?: string } | null>(null);

  useEffect(() => {
    fetch("/api/tutor/status", { cache: "no-store" })
      .then((r) => r.json())
      .then(setTutor)
      .catch(() => setTutor({ configured: false }));
  }, []);

  const lessons = useMemo(() => course.units.flatMap((u) => u.lessons.map((l) => ({ ...l, unitTitle: u.title }))), [course]);
  const completed = lessons.filter((l) => state.lessons[l.id]?.status === "completed").length;
  const inProgress = lessons.find((l) => state.lessons[l.id]?.status === "in-progress" && state.lessons[l.id]?.stepIndex > 0);
  const nextUp: (LessonMeta & { unitTitle: string }) | undefined = inProgress ?? lessons.find((l) => state.lessons[l.id]?.status !== "completed");
  const clock = useClock();
  const today = clock.today ?? "";
  const streak = clock.today ? getStreakStatus(state, clock.today) : { current: 0, status: "none" as const };
  const act = state.activity[today] ?? { problems: 0, lessons: 0 };
  const goalDone = act.lessons >= 1 || act.problems >= STREAK_PROBLEMS_PER_DAY;
  const goalPct = goalDone ? 100 : Math.round((100 * act.problems) / STREAK_PROBLEMS_PER_DAY);
  const due = clock.now ? dueProblems(state, clock.now) : [];
  const weak = weakProblems(state, 5);
  const hour = clock.hour ?? 12;
  const greeting = hour < 5 ? "Burning the midnight oil" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = state.settings.name?.trim();

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>{clock.dateLabel ?? "Today"}</Eyebrow>
          <h1 className="mt-1 font-serif text-4xl">
            {greeting}
            {name ? `, ${name}` : ""}.
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className={cn("h-2 w-2 rounded-full", sync === "saved" ? "bg-primary" : sync === "saving" ? "bg-gold" : sync === "error" || sync === "offline" ? "bg-danger" : "bg-surface-3")} />
          {sync === "saved" ? "Progress saved" : sync === "saving" ? "Saving…" : sync === "offline" ? "Saved in this browser only" : sync === "error" ? "Server save failed (kept locally)" : "Ready"}
        </div>
      </div>

      {/* stat row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Eyebrow>Streak</Eyebrow>
            <span className="flex gap-0.5" title={`${state.streak.charges} streak charge(s)`}>
              {Array.from({ length: 2 }).map((_, i) => (
                <BatteryCharging key={i} size={16} className={i < state.streak.charges ? "text-teal" : "text-surface-3"} />
              ))}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-4xl">{hydrated ? streak.current : "–"}</span>
            <Flame size={22} className={streak.status === "done-today" ? "text-orange" : "text-muted"} />
          </div>
          <div className="mt-1 text-sm text-muted">
            {streak.status === "done-today" && "Extended today. Nice."}
            {streak.status === "at-risk" && "Learn today to keep it alive."}
            {streak.status === "protected" && "A streak charge covered yesterday."}
            {streak.status === "broken" && "Streak reset — start a new one today."}
            {streak.status === "none" && "Finish a lesson or 3 problems to start one."}
          </div>
        </Card>
        <Card className="p-4">
          <Eyebrow>Today&apos;s goal</Eyebrow>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative h-14 w-14">
              <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--surface-3)" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke={goalDone ? "var(--primary)" : "var(--gold)"} strokeWidth="3.5" strokeDasharray={`${goalPct * 0.974} 100`} strokeLinecap="round" />
              </svg>
              <Target size={18} className="absolute inset-0 m-auto text-muted" />
            </div>
            <div>
              <div className="font-serif text-2xl">{goalDone ? "Done" : `${act.problems}/${STREAK_PROBLEMS_PER_DAY}`}</div>
              <div className="text-sm text-muted">{goalDone ? "1 lesson or 3 problems ✓" : "3 problems or 1 lesson"}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <Eyebrow>XP</Eyebrow>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-4xl">{hydrated && clock.today ? xpThisWeek(state, clock.today) : "–"}</span>
            <span className="text-sm text-muted">this week</span>
          </div>
          <div className="mt-1 text-sm text-muted">
            +{clock.today ? xpToday(state, clock.today) : 0} today · {xpTotal(state)} all time
          </div>
        </Card>
      </div>

      {/* continue + course */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="flex flex-col justify-between gap-4 p-5">
          <div>
            <Eyebrow>{inProgress ? "Pick up where you left off" : completed === 0 ? "Start here" : "Up next"}</Eyebrow>
            {nextUp ? (
              <>
                <h2 className="mt-1 font-serif text-2xl">{nextUp.title}</h2>
                <p className="mt-1 text-sm text-muted">
                  {nextUp.unitTitle} · {nextUp.textbook} · ~{nextUp.minutes} min · {nextUp.questionCount} problems
                </p>
                <p className="mt-2 text-[15px]">{nextUp.summary}</p>
                {inProgress && (
                  <p className="mt-2 text-sm text-muted">
                    Step {state.lessons[inProgress.id].stepIndex + 1} of {inProgress.stepCount}
                  </p>
                )}
              </>
            ) : (
              <h2 className="mt-1 font-serif text-2xl">You&apos;ve completed every lesson. Keep the level checks and reviews going.</h2>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {nextUp && (
              <Link href={`/lesson/${nextUp.id}`}>
                <Button variant="primary" size="lg" ledge>
                  {inProgress ? "Continue" : "Start lesson"} <ArrowRight size={18} />
                </Button>
              </Link>
            )}
            <Link href={`/course/${course.id}`}>
              <Button variant="outline" size="lg">
                Course map
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="grid gap-3 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-soft text-blue">
              <BookOpen size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-xl">{course.title}</h2>
              <p className="text-sm text-muted">
                {course.lessonCount} lessons · {course.exerciseCount} exercises
              </p>
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>
                {completed} of {course.lessonCount} lessons
              </span>
              <span>{Math.round((100 * completed) / Math.max(1, course.lessonCount))}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(100 * completed) / Math.max(1, course.lessonCount)}%` }} />
            </div>
          </div>
          <p className="text-sm text-muted">{course.tagline}</p>
        </Card>
      </div>

      {/* review + weak spots + tutor */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="grid content-between gap-3 p-5">
          <div>
            <div className="flex items-center gap-2">
              <RotateCcw size={18} className="text-purple" />
              <Eyebrow>Spaced review</Eyebrow>
            </div>
            <div className="mt-2 font-serif text-3xl">{due.length}</div>
            <p className="text-sm text-muted">{due.length === 0 ? "Nothing due. Missed problems come back here on a schedule." : "problems due — recall beats recognition."}</p>
          </div>
          <Link href="/review">
            <Button variant={due.length ? "ink" : "outline"} size="md" full>
              {due.length ? "Review now" : "Open review"}
            </Button>
          </Link>
        </Card>

        <Card className="p-5">
          <Eyebrow>Weak spots</Eyebrow>
          {weak.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Problems you miss will show up here so you can target them.</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {weak.map((p) => (
                <li key={p.key} className="flex items-start justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{p.label ?? p.key}</span>
                  <Pill tone="danger">{p.wrong}×</Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="grid content-between gap-3 p-5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple" />
              <Eyebrow>AI tutor</Eyebrow>
            </div>
            {tutor === null ? (
              <p className="mt-2 text-sm text-muted">Checking…</p>
            ) : tutor.configured ? (
              <p className="mt-2 text-sm">
                <Pill tone="green">Connected</Pill> <span className="text-muted">{tutor.model}</span>
                <br />
                <span className="text-muted">It sees your step and your attempts. It never gives the answer.</span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted">
                <Pill tone="gold">Not connected</Pill> Add an API key to <code>.env.local</code> to enable nudges. Built-in hints work regardless.
              </p>
            )}
          </div>
          <Link href="/settings">
            <Button variant="outline" size="md" full>
              Tutor settings
            </Button>
          </Link>
        </Card>
      </div>

      <Card className="grid gap-2 p-5 text-sm">
        <Eyebrow>How to get the most out of this</Eyebrow>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          <li>
            <strong>Try first, every time.</strong> Commit to an answer before asking for anything. Being wrong once is how the hint lands.
          </li>
          <li>
            <strong>Ask for the smallest nudge.</strong> The tutor escalates in three levels and never finishes the problem for you.
          </li>
          <li>
            <strong>Explain it back.</strong> After a problem resolves, say in your own words why. Recognition is cheap; recollection is learning.
          </li>
          <li>
            <strong>Level checks are the truth.</strong> No hints, shuffled, partly generated. Your first-try score there is your real score.
          </li>
        </ul>
      </Card>
    </div>
  );
}
