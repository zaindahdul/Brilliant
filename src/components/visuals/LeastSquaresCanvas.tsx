"use client";

import { useMemo, useState } from "react";
import type { LeastSquaresConfig } from "@/content/types";
import { leastSquaresLine, sse } from "@/lib/linalg";
import { fmt } from "./plane";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface Props {
  config: LeastSquaresConfig;
  disabled?: boolean;
}

const W = 420;
const H = 300;
const PAD = 34;

export function LeastSquaresCanvas({ config, disabled = false }: Props) {
  const pts = config.points;
  const best = useMemo(() => leastSquaresLine(pts), [pts]);
  const [line, setLine] = useState(config.line ?? { m: 0, b: 0 });
  const [showBest, setShowBest] = useState(false);

  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const xmin = Math.min(0, ...xs) - 1;
  const xmax = Math.max(...xs) + 1;
  const ymin = Math.min(0, ...ys) - 1;
  const ymax = Math.max(...ys) + 1;
  const sx = (x: number) => PAD + ((x - xmin) / (xmax - xmin)) * (W - 2 * PAD);
  const sy = (y: number) => H - PAD - ((y - ymin) / (ymax - ymin)) * (H - 2 * PAD);

  const cur = sse(pts, line.m, line.b);
  const isBest = Math.abs(cur - best.sse) < 1e-6;

  const linePath = (m: number, b: number) => `M ${sx(xmin)} ${sy(m * xmin + b)} L ${sx(xmax)} ${sy(m * xmax + b)}`;

  return (
    <div className="grid gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[460px] select-none rounded-2xl border border-border bg-surface" role="img" aria-label="Least squares fit">
        {/* axes */}
        <line x1={sx(xmin)} y1={sy(0)} x2={sx(xmax)} y2={sy(0)} stroke="var(--canvas-axis)" />
        <line x1={sx(0)} y1={sy(ymin)} x2={sx(0)} y2={sy(ymax)} stroke="var(--canvas-axis)" />
        {Array.from({ length: Math.floor(xmax) - Math.ceil(xmin) + 1 }, (_, i) => Math.ceil(xmin) + i).map((x) => (
          <text key={`x${x}`} x={sx(x)} y={sy(0) + 14} fontSize={10} textAnchor="middle" fill="var(--muted)">
            {x}
          </text>
        ))}
        {Array.from({ length: Math.floor(ymax) - Math.ceil(ymin) + 1 }, (_, i) => Math.ceil(ymin) + i).map((y) => (
          <text key={`y${y}`} x={sx(0) - 6} y={sy(y) + 4} fontSize={10} textAnchor="end" fill="var(--muted)">
            {y}
          </text>
        ))}
        {/* residuals */}
        {pts.map((p, i) => (
          <line key={`r${i}`} x1={sx(p[0])} y1={sy(p[1])} x2={sx(p[0])} y2={sy(line.m * p[0] + line.b)} stroke="var(--danger)" strokeWidth={2} strokeDasharray="4 3" />
        ))}
        {showBest && <path d={linePath(best.m, best.b)} stroke="var(--primary)" strokeWidth={3} opacity={0.6} fill="none" />}
        <path d={linePath(line.m, line.b)} stroke="var(--blue)" strokeWidth={3} fill="none" />
        {pts.map((p, i) => (
          <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r={5} fill="var(--orange)" stroke="var(--surface)" strokeWidth={2} />
        ))}
      </svg>
      <div className="mx-auto grid w-full max-w-[460px] gap-2 rounded-2xl border border-border bg-surface-2/60 p-3 text-sm">
        {config.sliders !== false && (
          <>
            <label className="flex items-center gap-3">
              <span className="w-24 font-mono">m = {fmt(line.m, 2)}</span>
              <input type="range" min={-3} max={3} step={0.05} value={line.m} disabled={disabled} onChange={(e) => setLine((l) => ({ ...l, m: Number(e.target.value) }))} className="flex-1 accent-[var(--blue)]" />
            </label>
            <label className="flex items-center gap-3">
              <span className="w-24 font-mono">b = {fmt(line.b, 2)}</span>
              <input type="range" min={-5} max={5} step={0.05} value={line.b} disabled={disabled} onChange={(e) => setLine((l) => ({ ...l, b: Number(e.target.value) }))} className="flex-1 accent-[var(--blue)]" />
            </label>
          </>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn("rounded-full px-3 py-1 font-mono", isBest ? "bg-primary-soft text-primary-ink" : "bg-danger-soft text-danger-ink")}>sum of squared errors = {fmt(cur, 3)}</span>
          {config.showBest !== false && (
            <Button size="sm" variant="outline" onClick={() => setShowBest((s) => !s)}>
              {showBest ? "Hide" : "Show"} best fit
            </Button>
          )}
          {showBest && (
            <span className="font-mono text-primary">
              best: m = {fmt(best.m, 3)}, b = {fmt(best.b, 3)}, SSE = {fmt(best.sse, 3)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
