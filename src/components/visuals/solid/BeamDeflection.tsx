"use client";

import { useState } from "react";
import type { BeamDeflectionConfig } from "@/content/types";
import { Arrow, HALO, SVG_CLASS, Slider, VisualFrame, clamp, finite, fmt, withUnit } from "./shared";

interface Props {
  config: BeamDeflectionConfig;
  disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/* Mechanics (pure, exported for tests)                                */
/* ------------------------------------------------------------------ */

type Load = BeamDeflectionConfig["load"];

/**
 * Deflection v(x) (positive up) of a uniform beam from EI v'''' = q.
 * Loads are positive downward, so a positive load gives a negative v.
 */
export function deflection(support: BeamDeflectionConfig["support"], load: Load, L: number, EI: number, x: number): number {
  if (!(L > 0) || !(EI > 0)) return 0;
  if (load.kind === "udl") {
    const w = load.w;
    if (support === "cantilever") return (-w * x * x * (6 * L * L - 4 * L * x + x * x)) / (24 * EI);
    return (-w * x * (L ** 3 - 2 * L * x * x + x ** 3)) / (24 * EI);
  }
  const P = load.P;
  const a = clamp(load.x, 0, L);
  if (support === "cantilever") {
    return x <= a ? (-P * x * x * (3 * a - x)) / (6 * EI) : (-P * a * a * (3 * x - a)) / (6 * EI);
  }
  const b = L - a;
  return x <= a ? (-P * b * x * (L * L - b * b - x * x)) / (6 * L * EI) : (-P * a * (L - x) * (L * L - a * a - (L - x) ** 2)) / (6 * L * EI);
}

/** The largest deflection (by magnitude) and where it occurs, sampled finely. */
export function maxDeflection(support: BeamDeflectionConfig["support"], load: Load, L: number, EI: number) {
  let best = { x: 0, v: 0 };
  for (let i = 0; i <= 400; i++) {
    const x = (L * i) / 400;
    const v = deflection(support, load, L, EI, x);
    if (Math.abs(v) > Math.abs(best.v)) best = { x, v };
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const W = 520;
const H = 230;
const X0 = 56;
const X1 = 476;
const Y0 = 96; // undeformed axis
const DMAX = 62; // pixels for the largest deflection of the starting state

export function BeamDeflection({ config, disabled = false }: Props) {
  const L = finite(config.length) > 0 ? finite(config.length) : 1;
  const EI = finite(config.EI) > 0 ? finite(config.EI) : 1;
  const support = config.support === "simple" ? "simple" : "cantilever";
  const units = config.units ?? {};
  const load0 = config.load;
  const mag0 = load0.kind === "udl" ? finite(load0.w) : finite(load0.P);
  const pos0 = load0.kind === "point" ? clamp(finite(load0.x, L), 0, L) : L;

  const [mag, setMag] = useState(mag0);
  const [pos, setPos] = useState(pos0);

  const load: Load = load0.kind === "udl" ? { kind: "udl", w: mag } : { kind: "point", x: pos, P: mag };
  const ref: Load = load0.kind === "udl" ? { kind: "udl", w: Math.abs(mag0) || 1 } : { kind: "point", x: support === "simple" ? L / 2 : L, P: Math.abs(mag0) || 1 };
  const refMax = Math.abs(maxDeflection(support, ref, L, EI).v) || 1;
  const scale = DMAX / (2 * refMax); // the slider reaches twice the starting load

  const px = (x: number) => X0 + ((X1 - X0) * x) / L;
  const py = (v: number) => Y0 - clamp(v * scale, -DMAX - 30, DMAX + 30);
  const pts = Array.from({ length: 81 }, (_, i) => {
    const x = (L * i) / 80;
    return `${px(x).toFixed(1)},${py(deflection(support, load, L, EI, x)).toFixed(1)}`;
  }).join(" ");
  const worst = maxDeflection(support, load, L, EI);
  const uF = load0.kind === "udl" ? (units.force && units.length ? `${units.force}/${units.length}` : "") : (units.force ?? "");
  const magMax = Math.abs(mag0) > 0 ? 2 * Math.abs(mag0) : 10;
  const down = mag >= 0;

  return (
    <VisualFrame
      controls={
        <>
          {config.sliders && (
            <div className="grid gap-1.5">
              <Slider label={`${load0.kind === "udl" ? "w" : "P"} = ${withUnit(fmt(mag), uF)}`} min={0} max={magMax} step={magMax / 40} value={mag} onChange={setMag} disabled={disabled} accent="orange" aria="load" />
              {load0.kind === "point" && <Slider label={`at x = ${withUnit(fmt(pos), units.length)}`} min={0} max={L} step={L / 40} value={pos} onChange={setPos} disabled={disabled} accent="blue" aria="position of the load" />}
            </div>
          )}
          <p className="text-sm tabular-nums">
            <span className="text-muted">Largest deflection </span>
            <span className="font-medium">{withUnit(fmt(Math.abs(worst.v)), units.deflection ?? units.length)}</span>
            <span className="text-muted">
              {" "}
              {Math.abs(worst.v) < 1e-12 ? "" : `${worst.v < 0 ? "down" : "up"}, at x = ${withUnit(fmt(worst.x), units.length)}`}
            </span>
          </p>
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className={SVG_CLASS} role="img" aria-label={`${support === "simple" ? "Simply supported beam" : "Cantilever"}: largest deflection ${fmt(Math.abs(worst.v))} at x = ${fmt(worst.x)}`}>
        {/* supports */}
        {support === "cantilever" ? (
          <g>
            <rect x={X0 - 14} y={Y0 - 44} width={14} height={88} fill="var(--surface-3)" />
            <line x1={X0} y1={Y0 - 44} x2={X0} y2={Y0 + 44} stroke="var(--text)" strokeWidth={2} />
          </g>
        ) : (
          <g fill="var(--surface-3)" stroke="var(--text)" strokeWidth={1.4}>
            <polygon points={`${X0},${Y0 + 3} ${X0 - 11},${Y0 + 22} ${X0 + 11},${Y0 + 22}`} />
            <polygon points={`${X1},${Y0 + 3} ${X1 - 11},${Y0 + 22} ${X1 + 11},${Y0 + 22}`} />
            <line x1={X1 - 14} y1={Y0 + 26} x2={X1 + 14} y2={Y0 + 26} />
          </g>
        )}
        {/* undeformed axis, then the deflected shape */}
        <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke="var(--border-strong)" strokeWidth={1.2} strokeDasharray="5 4" />
        <polyline points={pts} fill="none" stroke="var(--blue)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* load */}
        {Math.abs(mag) > 1e-12 &&
          (load0.kind === "udl" ? (
            <g>
              {Array.from({ length: 9 }, (_, i) => {
                const x = (L * i) / 8;
                const y = py(deflection(support, load, L, EI, x));
                return down ? <Arrow key={i} x1={px(x)} y1={y - 34} x2={px(x)} y2={y - 5} color="var(--orange)" width={1.6} head={6} /> : <Arrow key={i} x1={px(x)} y1={y + 34} x2={px(x)} y2={y + 5} color="var(--orange)" width={1.6} head={6} />;
              })}
              <text x={(X0 + X1) / 2} y={22} fontSize={12} fontWeight={600} textAnchor="middle" fill="var(--orange)">{`w = ${withUnit(fmt(mag), uF)}`}</text>
            </g>
          ) : (
            <g>
              <Arrow x1={px(pos)} y1={py(deflection(support, load, L, EI, pos)) - 50} x2={px(pos)} y2={py(deflection(support, load, L, EI, pos)) - 5} color="var(--orange)" />
              <text x={clamp(px(pos), X0 + 30, X1 - 30)} y={22} fontSize={12} fontWeight={600} textAnchor="middle" fill="var(--orange)">{`P = ${withUnit(fmt(mag), uF)}`}</text>
            </g>
          ))}
        {/* largest deflection marker */}
        {Math.abs(worst.v) > 1e-12 && (
          <g>
            <line x1={px(worst.x)} y1={Y0} x2={px(worst.x)} y2={py(worst.v)} stroke="var(--teal)" strokeWidth={1.4} />
            <circle cx={px(worst.x)} cy={py(worst.v)} r={3.5} fill="var(--teal)" />
          </g>
        )}
        <line x1={X0} y1={H - 26} x2={X1} y2={H - 26} stroke="var(--canvas-axis)" strokeWidth={1} />
        <text x={X0} y={H - 9} fontSize={11.5} textAnchor="middle" fill="var(--muted)">
          x = 0
        </text>
        <text x={X1 + 8} y={H - 9} fontSize={11.5} textAnchor="end" fill="var(--muted)" style={HALO}>{`x = L = ${withUnit(fmt(L), units.length)}`}</text>
      </svg>
    </VisualFrame>
  );
}
