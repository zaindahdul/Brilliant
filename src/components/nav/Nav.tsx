"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Flame, Home, Map as MapIcon, RotateCcw, Settings, Sparkles } from "lucide-react";
import { useProgressStore } from "@/lib/progress/store";
import { dueProblems, getStreakStatus } from "@/lib/progress/logic";
import { useClock } from "@/lib/useClock";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/course/linear-algebra", label: "Course", icon: MapIcon },
  { href: "/review", label: "Review", icon: RotateCcw },
  { href: "/homework", label: "Homework", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  const state = useProgressStore((s) => s.state);
  const hydrated = useProgressStore((s) => s.hydrated);
  const clock = useClock();
  const streak = clock.today ? getStreakStatus(state, clock.today) : { current: 0, status: "none" as const };
  const due = hydrated && clock.now ? dueProblems(state, clock.now).length : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5">
        <Link href="/" className="mr-2 flex items-center gap-2 font-serif text-xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
            <Sparkles size={16} />
          </span>
          Nudge
        </Link>
        <nav className="flex flex-1 items-center gap-1" aria-label="Main">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors", active ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2 hover:text-text")}
              >
                <l.icon size={16} />
                <span className="hidden sm:inline">{l.label}</span>
                {l.href === "/review" && due > 0 && <span className="ml-0.5 rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">{due}</span>}
              </Link>
            );
          })}
        </nav>
        <div className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold", streak.status === "done-today" ? "bg-orange-soft text-orange" : "bg-surface-2 text-muted")} title={`Streak: ${streak.status}`}>
          <Flame size={16} /> {hydrated ? streak.current : "–"}
        </div>
      </div>
    </header>
  );
}
