"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Settings } from "lucide-react";
import { useProgressStore } from "@/lib/progress/store";
import { dueProblems, getStreakStatus } from "@/lib/progress/logic";
import { useClock } from "@/lib/useClock";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Learn", match: (p: string) => p === "/" || p.startsWith("/course") },
  { href: "/review", label: "Review", match: (p: string) => p.startsWith("/review") },
  { href: "/homework", label: "Homework", match: (p: string) => p.startsWith("/homework") },
];

export function Nav() {
  const pathname = usePathname();
  const state = useProgressStore((s) => s.state);
  const hydrated = useProgressStore((s) => s.hydrated);
  const clock = useClock();
  const streak = clock.today ? getStreakStatus(state, clock.today) : { current: 0, status: "none" as const };
  const due = hydrated && clock.now ? dueProblems(state, clock.now).length : 0;
  const onSettings = pathname.startsWith("/settings");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-1 px-4 sm:px-5">
        <Link href="/" className="mr-2 font-serif text-xl sm:mr-4">
          Nudge
        </Link>
        <nav className="flex flex-1 items-center gap-1" aria-label="Main">
          {links.map((l) => {
            const active = l.match(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3", active ? "text-text" : "text-muted hover:text-text")}
              >
                {l.label}
                {l.href === "/review" && due > 0 && <span className="rounded-full bg-danger px-1.5 text-[11px] font-semibold leading-4 text-white">{due}</span>}
              </Link>
            );
          })}
        </nav>
        <span className={cn("hidden items-center gap-1 px-2 text-sm font-medium tabular-nums sm:inline-flex", streak.status === "done-today" ? "text-orange" : "text-muted")} title="Day streak">
          <Flame size={16} /> {hydrated ? streak.current : "–"}
        </span>
        <Link href="/settings" aria-label="Settings" aria-current={onSettings ? "page" : undefined} className={cn("rounded-full p-2 transition-colors", onSettings ? "text-text" : "text-muted hover:text-text")}>
          <Settings size={18} />
        </Link>
      </div>
    </header>
  );
}
