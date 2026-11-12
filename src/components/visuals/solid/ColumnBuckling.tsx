"use client";

import { useState } from "react";
import type { ColumnBucklingConfig } from "@/content/types";
import { Arrow, SVG_CLASS, Slider, VisualFrame, clamp, finite, fmt } from "./shared";
import { cn } from "@/lib/cn";

interface Props {
  config: ColumnBucklingConfig;
  disabled?: boolean;
}

type Ends = ColumnBucklingConfig["ends"];

/* ------------------------------------------------------------------ */
/* Mechanics (pure, exported for tests)                                */
/* ------------------------------------------------------------------ */

/** Smallest root of tan(x) = x, the clamped–pinned buckling condition. */
export const CLAMPED_PINNED_ROOT = 4.493409457909064;

/**
 * Critical load as a multiple of the pinned–pinned Euler load pi^2 EI / L^2,
 * the effective-length factor K (Pcr = pi^2 EI / (K L)^2) and the buckled shape,
 * with s running from 0 (bottom) to 1 (top) and the shape scaled to a peak of 1.
 */
export const COLUMNS: Record<Ends, { label: string; ratio: number; K: number; shape: (s: number) => number }> = {
  "pinned-pinned": { label: "Pinned–pinned", ratio: 1, K: 1, shape: (s) => Math.sin(Math.PI * s) },
  "clamped-free": { label: "Clamped–free", ratio: 0.25, K: 2, shape: (s) => 1 - Math.cos((Math.PI * s) / 2) },
  "clamped-pinned": {
    label: "Clamped–pinned",
    ratio: (CLAMPED_PINNED_ROOT / Math.PI) ** 2,
    K: Math.PI / CLAMPED_PINNED_ROOT,
    // clamped at the bottom (s = 0), pinned at the top (s = 1)
    shape: (s) => {
      const k = CLAMPED_PINNED_ROOT;
      return (Math.sin(k * s) - k * Math.cos(k * s) + k * (1 - s)) / 6.2832;
    },
  },
  "clamped-clamped": { label: "Clamped–clamped", ratio: 4, K: 0.5, shape: (s) => (1 - Math.cos(2 * Math.PI * s)) / 2 },
};

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const W = 520;
const H = 300;
const CX = 150;
const YT = 70; // top of the column
const YB = 248; // bottom
const AMP = 44; // sideways amplitude of the buckled shape, pixels

function Support({ kind, y, top }: { kind: "pinned" | "clamped" | "free"; y: number; top: boolean }) {
  if (kind === "free") return null;
  if (kind === "clamped") {
    const yy = top ? y - 12 : y;
    return (
      <g>
        <rect x={CX - 30} y={yy} width={60} height={12} fill="var(--surface-3)" />
        <line x1={CX - 30} y1={top ? y : y} x2={CX + 30} y2={top ? y : y} stroke="var(--text)" strokeWidth={2} />
      </g>
    );
  }
  // pinned: a small triangle; the top pin sits in a guide so it can move down but not sideways
  return top ? (
    <g stroke="var(--text)" strokeWidth={1.4}>
      <circle cx={CX} cy={y} r={4} fill="var(--surface)" />
      <line x1={CX - 18} y1={y - 14} x2={CX - 18} y2={y + 14} />
      <line x1={CX + 18} y1={y - 14} x2={CX + 18} y2={y + 14} />
    </g>
  ) : (
    <g stroke="var(--text)" strokeWidth={1.4}>
      <polygon points={`${CX},${y} ${CX - 12},${y + 18} ${CX + 12},${y + 18}`} fill="var(--surface-3)" />
      <line x1={CX - 20} y1={y + 18} x2={CX + 20} y2={y + 18} />
    </g>
  );
}

export function ColumnBuckling({ config, disabled = false }: Props) {
  const [ends, setEnds] = useState<Ends>(config.ends in COLUMNS ? config.ends : "pinned-pinned");
  const [load, setLoad] = useState(clamp(finite(config.load, 0.5), 0, 5));
  const col = COLUMNS[ends];
  const buckled = load >= col.ratio - 1e-9;
  const amp = buckled ? AMP : 0;

  const bottom = ends === "pinned-pinned" ? "pinned" : "clamped";
  const top = ends === "clamped-free" ? "free" : ends === "clamped-clamped" ? "clamped" : "pinned";
  const pts = Array.from({ length: 61 }, (_, i) => {
    const s = i / 60;
    return `${(CX + amp * col.shape(s)).toFixed(1)},${(YB - (YB - YT) * s).toFixed(1)}`;
  }).join(" ");
  const tipX = CX + amp * col.shape(1);

  return (
    <VisualFrame
      controls={
        <>
          {config.sliders && (
            <>
              <div role="group" aria-label="End conditions" className="flex flex-wrap gap-1.5">
                {(Object.keys(COLUMNS) as Ends[]).map((e) => (
                  <button key={e} type="button" aria-pressed={e === ends} disabled={disabled} onClick={() => setEnds(e)} className={cn("rounded-full border px-3 py-1 text-sm font-medium transition-colors disabled:opacity-60", e === ends ? "border-text bg-text text-bg" : "border-border-strong text-muted hover:text-text")}>
                    {COLUMNS[e].label}
                  </button>
                ))}
              </div>
              <Slider label={`P = ${fmt(load)} × π²EI/L²`} min={0} max={5} step={0.05} value={load} onChange={setLoad} disabled={disabled} accent="orange" aria="compressive load as a multiple of the Euler load" />
            </>
          )}
          <p className="text-sm">
            <span className={cn("font-medium", buckled ? "text-danger" : "text-primary-ink")}>{buckled ? "Buckled" : "Straight and stable"}</span>
            <span className="text-muted">
              {" "}
              · this column buckles at {fmt(col.ratio)} × π²EI/L² (effective length {fmt(col.K, 2)} L)
            </span>
          </p>
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className={SVG_CLASS} role="img" aria-label={`${col.label} column under ${fmt(load)} times the Euler load: ${buckled ? "buckled" : "straight"}`}>
        <Support kind={bottom} y={YB} top={false} />
        <Support kind={top} y={YT} top />
        <line x1={CX} y1={YB} x2={CX} y2={YT} stroke="var(--border-strong)" strokeWidth={1.2} strokeDasharray="5 4" />
        <polyline points={pts} fill="none" stroke={buckled ? "var(--danger)" : "var(--blue)"} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        {load > 0 && <Arrow x1={tipX} y1={YT - 12 - clamp(10 + load * 9, 12, 46)} x2={tipX} y2={YT - 12} color="var(--orange)" />}
        <text x={tipX + 10} y={YT - 30} fontSize={12} fontWeight={600} fill="var(--orange)">
          P
        </text>

        {/* critical loads of the four standard cases, as a bar chart of Pcr / (pi^2 EI / L^2) */}
        <text x={300} y={52} fontSize={11.5} fill="var(--muted)">
          Critical load ÷ (π²EI/L²)
        </text>
        {(Object.keys(COLUMNS) as Ends[]).map((e, i) => {
          const c = COLUMNS[e];
          const y = 72 + i * 44;
          const w = (c.ratio / 4) * 190;
          return (
            <g key={e}>
              <rect x={300} y={y} width={190} height={10} rx={5} fill="var(--surface-3)" />
              <rect x={300} y={y} width={Math.max(w, 3)} height={10} rx={5} fill={e === ends ? "var(--blue)" : "var(--border-strong)"} />
              {/* the applied load on the same scale */}
              <line x1={300 + (clamp(load, 0, 4) / 4) * 190} y1={y - 4} x2={300 + (clamp(load, 0, 4) / 4) * 190} y2={y + 14} stroke="var(--orange)" strokeWidth={2} />
              <text x={300} y={y + 27} fontSize={11.5} fontWeight={e === ends ? 600 : 400} fill={e === ends ? "var(--text)" : "var(--muted)"}>
                {`${c.label}: ${fmt(c.ratio)}`}
              </text>
            </g>
          );
        })}
      </svg>
    </VisualFrame>
  );
}
