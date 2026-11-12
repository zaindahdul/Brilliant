"use client";

import { X } from "lucide-react";
import { Meter } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

/** The tutor is a side panel on wide screens; everything else moves over to make room for it. */
export const TUTOR_OFFSET = "lg:pr-[400px]";

/** Top bar of a lesson or practice set: leave, and how far along you are. */
export function PlayerHeader({ onExit, done, current, total, label }: { onExit: () => void; done: number; current: number; total: number; label: string }) {
  return (
    <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-4 px-4">
        <button type="button" onClick={onExit} aria-label="Leave" className="-ml-2 rounded-full p-2 text-muted transition-colors hover:text-text">
          <X size={20} />
        </button>
        <Meter value={done} max={total} className="flex-1" />
        <span className="shrink-0 text-sm tabular-nums text-muted" aria-label={label}>
          {current} / {total}
        </span>
      </div>
    </header>
  );
}

/** Bottom bar: the secondary action on the left, the one primary action on the right. */
export function ActionBar({ tutorOpen, secondary, children }: { tutorOpen: boolean; secondary?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur", tutorOpen && "lg:right-[400px]")}>
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">{secondary}</div>
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      </div>
    </div>
  );
}
