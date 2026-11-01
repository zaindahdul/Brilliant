"use client";

import { useEffect, useMemo, useState } from "react";
import type { LinesConfig } from "@/content/types";
import { Grid, fmt, makePlane } from "./plane";
import { Math as TeX } from "@/components/ui/RichText";
import { cn } from "@/lib/cn";

interface Props {
  config: LinesConfig;
  onGoal?: (satisfied: boolean, detail?: string) => void;
  disabled?: boolean;
}

type Line = { a: number; b: number; c: number };

/** Classify the system a1 x + b1 y = c1, a2 x + b2 y = c2. */
export function classify(l1: Line, l2: Line): "one" | "none" | "infinite" {
  const d = l1.a * l2.b - l1.b * l2.a;
  if (Math.abs(d) > 1e-9) return "one";
  // parallel or identical: check if (a2,b2,c2) is a multiple of (a1,b1,c1)
  const dx = l1.a * l2.c - l1.c * l2.a;
  const dy = l1.b * l2.c - l1.c * l2.b;
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return "infinite";
  return "none";
}

function intersection(l1: Line, l2: Line): [number, number] | null {
  const d = l1.a * l2.b - l1.b * l2.a;
  if (Math.abs(d) < 1e-9) return null;
  return [(l1.c * l2.b - l1.b * l2.c) / d, (l1.a * l2.c - l1.c * l2.a) / d];
}

const COLORS = ["var(--blue)", "var(--orange)", "var(--purple)"];

export function LinesCanvas({ config, onGoal, disabled = false }: Props) {
  const range = config.range ?? 5;
  const plane = useMemo(() => makePlane(range), [range]);
  const [lines, setLines] = useState<Line[]>(() => config.lines.map((l) => ({ a: l.a, b: l.b, c: l.c })));

  const kind = lines.length >= 2 ? classify(lines[0], lines[1]) : null;
  const pt = lines.length >= 2 ? intersection(lines[0], lines[1]) : null;

  useEffect(() => {
    if (!config.goal) return;
    onGoal?.(kind === config.goal.target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const segment = (l: Line): [[number, number], [number, number]] | null => {
    const L = range * 2;
    if (Math.abs(l.b) > 1e-9) {
      const y = (x: number) => (l.c - l.a * x) / l.b;
      return [
        [-L, y(-L)],
        [L, y(L)],
      ];
    }
    if (Math.abs(l.a) > 1e-9) {
      const x = l.c / l.a;
      return [
        [x, -L],
        [x, L],
      ];
    }
    return null;
  };

  return (
    <div className="grid gap-3">
      <svg viewBox={`0 0 ${plane.size} ${plane.size}`} className="mx-auto w-full max-w-[420px] select-none rounded-2xl border border-border bg-surface" role="img" aria-label="Two lines in the plane">
        <Grid plane={plane} />
        {lines.map((l, i) => {
          const s = segment(l);
          if (!s) return null;
          const [p1, p2] = s;
          const [x1, y1] = plane.toPx(p1);
          const [x2, y2] = plane.toPx(p2);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS[i % COLORS.length]} strokeWidth={i === 1 && kind === "infinite" ? 6 : 3} strokeDasharray={i === 1 && kind === "infinite" ? "10 8" : undefined} />;
        })}
        {pt && Math.abs(pt[0]) <= range && Math.abs(pt[1]) <= range && (
          <>
            <circle cx={plane.toPx(pt)[0]} cy={plane.toPx(pt)[1]} r={7} fill="var(--primary)" stroke="var(--surface)" strokeWidth={2} />
            <text x={plane.toPx(pt)[0] + 10} y={plane.toPx(pt)[1] - 8} fontSize={12} fontWeight={700} fill="var(--primary)">
              ({fmt(pt[0])}, {fmt(pt[1])})
            </text>
          </>
        )}
      </svg>

      <div className="mx-auto grid w-full max-w-[420px] gap-2 rounded-2xl border border-border bg-surface-2/60 p-3 text-sm">
        {lines.map((l, i) => {
          const editable = config.lines[i].editable && !disabled;
          return (
            <div key={i} className="grid gap-1">
              <div className="flex items-center gap-2" style={{ color: COLORS[i % COLORS.length] }}>
                <TeX tex={`${fmt(l.a)}x ${l.b < 0 ? "-" : "+"} ${fmt(Math.abs(l.b))}y = ${fmt(l.c)}`} />
              </div>
              {editable && (
                <div className="grid grid-cols-3 gap-2">
                  {(["a", "b", "c"] as const).map((k) => (
                    <label key={k} className="flex items-center gap-1 text-xs">
                      <span className="w-9 font-mono">
                        {k}={fmt(l[k])}
                      </span>
                      <input
                        type="range"
                        min={-5}
                        max={5}
                        step={1}
                        value={l[k]}
                        onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, [k]: Number(e.target.value) } : x)))}
                        className="flex-1 accent-[var(--blue)]"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {kind && (
          <div className={cn("rounded-xl px-3 py-1.5 font-medium", kind === "one" ? "bg-primary-soft text-primary-ink" : kind === "none" ? "bg-danger-soft text-danger-ink" : "bg-gold-soft text-gold-ink")}>
            {kind === "one" ? "Exactly one solution — the lines cross once." : kind === "none" ? "No solution — parallel lines never meet." : "Infinitely many solutions — it's the same line twice."}
          </div>
        )}
      </div>
    </div>
  );
}
