"use client";

import { useRef } from "react";
import { RichText } from "@/components/ui/RichText";
import { parseNumber } from "@/lib/check";
import { cn } from "@/lib/cn";

interface Props {
  rows: number;
  cols: number;
  cells: string[][];
  onChange: (cells: string[][]) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  prefix?: string;
  augmented?: boolean;
  state?: "idle" | "wrong" | "correct";
  /** Mark specific cells as wrong after a miss. */
  wrongCells?: boolean[][];
}

export function emptyCells(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
}

export function MatrixInput({ rows, cols, cells, onChange, onSubmit, disabled, prefix, augmented, state = "idle", wrongCells }: Props) {
  const refs = useRef<(HTMLInputElement | null)[][]>([]);

  const set = (i: number, j: number, v: string) => {
    const next = cells.map((r) => [...r]);
    next[i][j] = v;
    onChange(next);
  };

  const move = (i: number, j: number, di: number, dj: number) => {
    const ni = i + di;
    const nj = j + dj;
    if (ni < 0 || nj < 0 || ni >= rows || nj >= cols) return;
    refs.current[ni]?.[nj]?.focus();
  };

  const bracket = "w-2.5 shrink-0 border-y-2 border-text/80";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        {prefix && (
          <span className="text-lg">
            <RichText text={prefix} inline />
          </span>
        )}
        <div className="flex items-stretch">
          <div className={cn(bracket, "rounded-l-md border-l-2")} aria-hidden />
          <div className="grid gap-1.5 px-2 py-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {cells.map((row, i) =>
              row.map((v, j) => {
                const bad = wrongCells?.[i]?.[j];
                const invalid = v.trim() !== "" && parseNumber(v) === null;
                return (
                  <div key={`${i}-${j}`} className={cn("relative", augmented && j === cols - 1 && "ml-2 border-l-2 border-text/40 pl-2")}>
                    <input
                      ref={(el) => {
                        refs.current[i] ??= [];
                        refs.current[i][j] = el;
                      }}
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      spellCheck={false}
                      aria-label={`row ${i + 1} column ${j + 1}`}
                      value={v}
                      disabled={disabled}
                      onChange={(e) => set(i, j, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onSubmit?.();
                        } else if (e.key === "ArrowRight" && e.currentTarget.selectionStart === v.length) move(i, j, 0, 1);
                        else if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0) move(i, j, 0, -1);
                        else if (e.key === "ArrowDown") move(i, j, 1, 0);
                        else if (e.key === "ArrowUp") move(i, j, -1, 0);
                        else if (e.key === "Tab" && !e.shiftKey && j === cols - 1 && i < rows - 1) {
                          e.preventDefault();
                          move(i, j, 1, -(cols - 1));
                        }
                      }}
                      className={cn(
                        "h-12 w-16 rounded-lg border-2 bg-surface text-center font-mono text-base outline-none transition-colors",
                        "focus:ring-4 focus:ring-[var(--ring)] disabled:opacity-80",
                        state === "correct" ? "border-primary bg-primary-soft" : bad ? "border-danger bg-danger-soft/60" : invalid ? "border-danger" : "border-border-strong focus:border-blue",
                      )}
                    />
                  </div>
                );
              }),
            )}
          </div>
          <div className={cn(bracket, "rounded-r-md border-r-2")} aria-hidden />
        </div>
      </div>
      <div className="h-5 text-xs text-muted">Fractions like 1/2 and expressions like sqrt(2)/2 are fine. Use arrow keys to move.</div>
    </div>
  );
}
