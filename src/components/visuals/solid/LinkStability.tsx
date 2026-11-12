"use client";

import { useState } from "react";
import type { LinkStabilityConfig } from "@/content/types";
import { Arrow, HALO, SVG_CLASS, Slider, VisualFrame, clamp, finite, fmt } from "./shared";
import { cn } from "@/lib/cn";

interface Props {
  config: LinkStabilityConfig;
  disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/* Mechanics (pure, exported for tests)                                */
/* ------------------------------------------------------------------ */

/** Potential energy divided by the spring constant k, with lambda = P L / k and theta in radians. */
export function energy(lambda: number, theta: number): number {
  return (theta * theta) / 2 - lambda * (1 - Math.cos(theta));
}

/** The tilted equilibrium angle (radians, positive) solving theta = lambda sin(theta); null when lambda <= 1. */
export function buckledAngle(lambda: number): number | null {
  if (!(lambda > 1 + 1e-9)) return null;
  let lo = 1e-6;
  let hi = Math.PI;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (mid - lambda * Math.sin(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const W = 520;
const H = 280;
const PX = 110; // pivot
const PY = 226;
const LEN = 132; // link length in pixels
const GX0 = 250; // energy plot
const GX1 = 496;
const GY0 = 40;
const GY1 = 236;
const TMAX = (100 * Math.PI) / 180;
const EMAX = 1.6;

export function LinkStability({ config, disabled = false }: Props) {
  const [lambda, setLambda] = useState(clamp(finite(config.load, 0.5), 0, 2.5));
  const [deg, setDeg] = useState(clamp(finite(config.theta), -100, 100));
  const theta = (deg * Math.PI) / 180;

  const tip = { x: PX + LEN * Math.sin(theta), y: PY - LEN * Math.cos(theta) };
  const gx = (t: number) => GX0 + ((GX1 - GX0) * (t + TMAX)) / (2 * TMAX);
  const gy = (e: number) => (GY0 + GY1) / 2 - (clamp(e, -EMAX, EMAX) / EMAX) * ((GY1 - GY0) / 2);
  const curve = Array.from({ length: 101 }, (_, i) => {
    const t = -TMAX + (2 * TMAX * i) / 100;
    return `${gx(t).toFixed(1)},${gy(energy(lambda, t)).toFixed(1)}`;
  }).join(" ");

  const straightStable = lambda < 1 - 1e-9;
  const tb = buckledAngle(lambda);
  // Net moment (divided by k) pushing the link back toward the vertical: positive restores.
  const restoring = theta - lambda * Math.sin(theta);
  const atRest = Math.abs(restoring) < 0.02;
  const verdict = atRest ? "In equilibrium here" : restoring * Math.sign(theta) > 0 ? "The spring wins: it swings back" : "The load wins: it tips further";

  // a short spiral for the torsional spring
  const spiral = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 39) * 3.2 * Math.PI;
    const rr = 4 + i * 0.32;
    return `${(PX + rr * Math.cos(a)).toFixed(1)},${(PY - rr * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

  return (
    <VisualFrame
      controls={
        <>
          {config.sliders && (
            <div className="grid gap-1.5">
              <Slider label={`PL/k = ${fmt(lambda)}`} min={0} max={2.5} step={0.05} value={lambda} onChange={setLambda} disabled={disabled} accent="orange" aria="load ratio P L over k" />
              <Slider label={`θ = ${fmt(deg)}°`} min={-100} max={100} step={1} value={deg} onChange={setDeg} disabled={disabled} accent="blue" aria="tilt of the link in degrees" />
            </div>
          )}
          <p className="text-sm">
            <span className={cn("font-medium", straightStable ? "text-primary-ink" : "text-danger")}>{straightStable ? "Upright is stable" : Math.abs(lambda - 1) < 1e-9 ? "Upright is at the critical load" : "Upright is unstable"}</span>
            <span className="text-muted">
              {tb !== null ? ` · tilted equilibrium at θ = ±${fmt((tb * 180) / Math.PI)}°` : ""} · {verdict}
            </span>
          </p>
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className={SVG_CLASS} role="img" aria-label={`Rigid link on a torsional spring with P L over k = ${fmt(lambda)}, tilted ${fmt(deg)} degrees. ${straightStable ? "Upright is stable." : "Upright is not stable."}`}>
        {/* the link */}
        <line x1={PX - 46} y1={PY + 8} x2={PX + 46} y2={PY + 8} stroke="var(--text)" strokeWidth={2} />
        <line x1={PX} y1={PY} x2={PX} y2={PY - LEN - 14} stroke="var(--border-strong)" strokeWidth={1.2} strokeDasharray="5 4" />
        <polyline points={spiral} fill="none" stroke="var(--teal)" strokeWidth={1.6} />
        <line x1={PX} y1={PY} x2={tip.x} y2={tip.y} stroke="var(--blue)" strokeWidth={6} strokeLinecap="round" />
        <circle cx={PX} cy={PY} r={5} fill="var(--surface)" stroke="var(--text)" strokeWidth={1.6} />
        {lambda > 0 && <Arrow x1={tip.x} y1={tip.y - 14 - clamp(14 + lambda * 14, 16, 46)} x2={tip.x} y2={tip.y - 8} color="var(--orange)" />}
        <text x={tip.x + 10} y={tip.y - 26} fontSize={12} fontWeight={600} fill="var(--orange)" style={HALO}>
          P
        </text>
        <text x={PX + 16} y={PY - 14} fontSize={12} fontStyle="italic" fill="var(--teal)" style={HALO}>
          k
        </text>

        {/* potential energy against the tilt */}
        <line x1={GX0} y1={(GY0 + GY1) / 2} x2={GX1} y2={(GY0 + GY1) / 2} stroke="var(--canvas-axis)" strokeWidth={1} />
        <line x1={gx(0)} y1={GY0} x2={gx(0)} y2={GY1} stroke="var(--canvas-axis)" strokeWidth={1} />
        <text x={GX0} y={GY0 - 14} fontSize={11.5} fill="var(--muted)">
          Potential energy Π ÷ k
        </text>
        <text x={GX1} y={(GY0 + GY1) / 2 + 16} fontSize={11.5} textAnchor="end" fill="var(--muted)">
          θ
        </text>
        <polyline points={curve} fill="none" stroke="var(--text)" strokeWidth={2} strokeLinejoin="round" />
        {/* equilibria: filled = stable, hollow = unstable */}
        <circle cx={gx(0)} cy={gy(0)} r={4.5} fill={straightStable ? "var(--primary)" : "var(--surface)"} stroke={straightStable ? "var(--primary)" : "var(--danger)"} strokeWidth={2} />
        {tb !== null &&
          tb <= TMAX &&
          [-tb, tb].map((t) => <circle key={t} cx={gx(t)} cy={gy(energy(lambda, t))} r={4.5} fill="var(--primary)" stroke="var(--primary)" strokeWidth={2} />)}
        {/* where the link is now */}
        <line x1={gx(theta)} y1={GY0} x2={gx(theta)} y2={GY1} stroke="var(--blue)" strokeWidth={1.2} strokeDasharray="4 3" />
        <circle cx={gx(theta)} cy={gy(energy(lambda, theta))} r={6} fill="var(--blue)" />
      </svg>
    </VisualFrame>
  );
}
