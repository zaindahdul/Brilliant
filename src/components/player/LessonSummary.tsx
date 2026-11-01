"use client";

import Link from "next/link";
import { ArrowRight, BatteryCharging, Flame, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow } from "@/components/ui/Card";
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
  const headline = first >= 90 ? "Excellent!" : first >= 70 ? "Nice work." : first >= 50 ? "Good effort — keep going." : "You got through it.";
  const nextAction =
    first >= 80
      ? "You're ready for the next lesson."
      : first >= 50
        ? "Try the Level Check for this unit later today to lock it in."
        : "Redo this lesson tomorrow before moving on — spaced repetition is where the learning sticks.";

  return (
    <div className="mx-auto grid w-full max-w-lg gap-5 py-8">
      <div className="text-center">
        <Eyebrow>Lesson complete</Eyebrow>
        <h1 className="mt-2 font-serif text-4xl">{headline}</h1>
        <p className="mt-1 text-muted">{title}</p>
      </div>

      <Card className="grid grid-cols-3 divide-x divide-border p-0">
        <Stat label="First try" value={`${first}%`} />
        <Stat label="Eventually correct" value={`${pct(stats.eventually)}%`} />
        <Stat label="Completed" value={`${stats.questions} of ${stats.questions}`} />
      </Card>

      <div className="flex flex-wrap justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5 text-sm font-semibold text-gold-ink">
          <Sparkles size={15} /> +{xp} XP
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-soft px-3 py-1.5 text-sm font-semibold text-orange">
          <Flame size={15} /> {streak.current}-day streak
        </span>
        {earnedCharge && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-3 py-1.5 text-sm font-semibold text-teal">
            <BatteryCharging size={15} /> Streak charge earned
          </span>
        )}
      </div>

      <p className="text-center text-[15px] text-muted">{nextAction}</p>

      <div className="grid gap-2">
        {next ? (
          <Link href={`/lesson/${next.id}`} className="contents">
            <Button variant="primary" size="xl" ledge full>
              Next: {next.title} <ArrowRight size={18} />
            </Button>
          </Link>
        ) : (
          <Link href={courseHref} className="contents">
            <Button variant="primary" size="xl" ledge full>
              Back to the course map <ArrowRight size={18} />
            </Button>
          </Link>
        )}
        <div className="flex gap-2">
          <Link href={courseHref} className="flex-1">
            <Button variant="outline" size="lg" full>
              Course map
            </Button>
          </Link>
          <Button variant="ghost" size="lg" onClick={onRedo} className="flex-1">
            <RotateCcw size={16} /> Redo lesson
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-4 text-center">
      <div className="font-serif text-2xl">{value}</div>
      <div className="mt-1 text-xs font-medium text-muted">{label}</div>
    </div>
  );
}
