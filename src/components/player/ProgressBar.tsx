"use client";

import { cn } from "@/lib/cn";

export type SegmentState = "upcoming" | "current" | "reading" | "correct" | "wrong";

export function ProgressBar({ segments, label }: { segments: SegmentState[]; label?: string }) {
  return (
    <div className="flex items-center gap-3" aria-label={label}>
      <div className="flex flex-1 gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={segments.length} aria-valuenow={segments.filter((s) => s !== "upcoming" && s !== "current").length}>
        {segments.map((s, i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors duration-300",
              s === "upcoming" && "bg-surface-3",
              s === "current" && "bg-blue",
              s === "reading" && "bg-text/60",
              s === "correct" && "bg-primary",
              s === "wrong" && "bg-danger",
            )}
          />
        ))}
      </div>
    </div>
  );
}
