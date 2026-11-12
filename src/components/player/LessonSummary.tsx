"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { LessonStats } from "@/lib/progress/logic";

interface Props {
  title: string;
  stats: LessonStats;
  xp: number;
  streak: { current: number; status: string };
  earnedCharge: boolean;
  next: { id: string; title: string } | null;
  courseHref: string;
  onRedo: () => void;
}

export function LessonSummary({ title, stats, xp, streak, earnedCharge, next, courseHref, onRedo }: Props) {
  const pct = (n: number) => (stats.questions ? Math.round((100 * n) / stats.questions) : 100);
  const first = pct(stats.firstTry);
  const headline = first >= 90 ? "Excellent." : first >= 70 ? "Nice work." : first >= 50 ? "Good effort." : "You got through it.";
  const nextAction =
    first >= 80 ? "You're ready for the next lesson." : first >= 50 ? "Try this unit's level check later today to lock it in." : "Redo this lesson tomorrow before moving on. Coming back after a gap is where it sticks.";

  return (
    <div className="mx-auto w-full max-w-lg px-1 py-14 text-center">
      <p className="text-sm text-muted">Lesson complete · {title}</p>
      <h1 className="mt-2 font-serif text-4xl">{headline}</h1>

      <p className="mt-6 font-serif text-6xl tabular-nums">{first}%</p>
      <p className="mt-1 text-sm text-muted">
        right on the first try · {stats.firstTry} of {stats.questions} problems
      </p>
      <p className="mt-4 text-sm text-muted">
        +{xp} XP · {streak.current}-day streak{earnedCharge ? " · streak charge earned" : ""}
      </p>

      <p className="mx-auto mt-6 max-w-sm text-[15px] text-muted">{nextAction}</p>

      <div className="mt-8 grid gap-2">
        <Link href={next ? `/lesson/${next.id}` : courseHref} className="contents">
          <Button variant="primary" size="xl" ledge full>
            <span className="truncate">{next ? `Next: ${next.title}` : "Back to the course"}</span> <ArrowRight size={18} className="shrink-0" />
          </Button>
        </Link>
        <div className="flex justify-center gap-6 pt-2 text-sm font-medium text-muted">
          {next && (
            <Link href={courseHref} className="hover:text-text">
              All lessons
            </Link>
          )}
          <button type="button" onClick={onRedo} className="hover:text-text">
            Redo this lesson
          </button>
        </div>
      </div>
    </div>
  );
}
