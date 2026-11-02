"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Flame, Home, RotateCcw, Settings, Sigma, Sparkles, Wrench } from "lucide-react";
import { useProgressStore } from "@/lib/progress/store";
import { dueProblems, getStreakStatus } from "@/lib/progress/logic";
import { useClock } from "@/lib/useClock";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/course/linear-algebra", label: "Linear algebra", icon: Sigma },
  { href: "/course/solid-mechanics", label: "Solid mechanics", icon: Wrench },
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
        <Link href="/" className="flex items-center gap-2 font-serif text-xl sm:mr-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
            <Sparkles size={16} />
          </span>
          {/* six links leave no room for the wordmark on a phone */}
          <span className="sr-only sm:not-sr-only">Nudge</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1" aria-label="Main">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                title={l.label}
                aria-current={active ? "page" : undefined}
                className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium transition-colors sm:px-3", active ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2 hover:text-text")}
              >
                <l.icon size={16} />
                {/* icon-only until there is room for all six labels */}
                <span className="sr-only lg:not-sr-only">{l.label}</span>
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
