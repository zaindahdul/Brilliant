"use client";

import { useState } from "react";
import type { StrainGridConfig } from "@/content/types";
import { Math as TeX } from "@/components/ui/RichText";
import { makePlane, type Plane } from "../plane";

interface Props {
  config: StrainGridConfig;
  disabled?: boolean;
}

type V2 = [number, number];
type Grad = [[number, number], [number, number]];

/* ------------------------------------------------------------------ */
/* Number helpers                                                      */
/* ------------------------------------------------------------------ */

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const UNSUP: Record<string, string> = Object.fromEntries(Object.entries(SUP).map(([k, v]) => [v, k]));

function finite(x: unknown, fallback = 0): number {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

function fmtNum(x: number, sig = 4): string {
  if (!Number.isFinite(x)) return "—";
  const ax = Math.abs(x);
  if (ax < 1e-12) return "0";
  if (ax >= 1e6 || ax < 1e-3) {
    let e = Math.floor(Math.log10(ax));
    let m = Number((x / 10 ** e).toPrecision(sig));
    if (Math.abs(m) >= 10) {
      m /= 10;
      e += 1;
    }
    return `${String(m).replace("-", "−")}×10${String(e)
      .split("")
      .map((c) => SUP[c] ?? c)
      .join("")}`;
  }
  const r = Number(x.toPrecision(sig));
  if (r === 0) return "0";
  return (r < 0 ? "−" : "") + String(Math.abs(r));
}

function texNum(x: number, sig = 4): string {
  return fmtNum(x, sig)
    .replace(/−/g, "-")
    .replace(/×10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (_, e: string) => `\\times 10^{${e
      .split("")
      .map((c) => UNSUP[c] ?? c)
      .join("")}}`);
}

/* ------------------------------------------------------------------ */
/* Kinematics (pure, exported for tests)                               */
/* ------------------------------------------------------------------ */
/*
 * Govindjee ch. 4 (small strain): with grad = [[du/dx, du/dy], [dv/dx, dv/dy]] = [[a, b], [c, d]]
 *   eps_xx = a, eps_yy = d, gamma_xy = b + c (engineering: decrease of the right angle between the x and y fibres),
 *   eps_xy = gamma_xy / 2 (tensor, the off-diagonal entry of the strain matrix), omega = (c − b) / 2 (rigid rotation, CCW +).
 * The picture maps x' = x + s (a x + b y), y' = y + s (c x + d y) with s = the drawing exaggeration `scale`.
 */
export function strainMeasures(g: Grad) {
  const [[a, b], [c, d]] = g;
  return { exx: a, eyy: d, gxy: b + c, exy: (b + c) / 2, omega: (c - b) / 2 };
}

/** Exact angle (degrees) between the deformed x and y fibres for F = I + s·grad (90° when undeformed). */
export function cornerAngle(g: Grad, s = 1): number {
  const d1: V2 = [1 + s * g[0][0], s * g[1][0]];
  const d2: V2 = [s * g[0][1], 1 + s * g[1][1]];
  return (Math.atan2(d1[0] * d2[1] - d1[1] * d2[0], d1[0] * d2[0] + d1[1] * d2[1]) * 180) / Math.PI;
}

function sanitize(grad: unknown): Grad {
  const row = (r: unknown): [number, number] => (Array.isArray(r) ? [finite(r[0]), finite(r[1])] : [0, 0]);
  return Array.isArray(grad) ? [row(grad[0]), row(grad[1])] : [
    [0, 0],
    [0, 0],
  ];
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const TICKS = [-1, -0.5, 0, 0.5, 1];
const HALO = { paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3.5, strokeLinejoin: "round" } as const;
const ACCENT = {
  blue: "accent-[var(--blue)]",
  orange: "accent-[var(--orange)]",
  purple: "accent-[var(--purple)]",
  teal: "accent-[var(--teal)]",
} as const;

function SliderRow({ label, value, min, max, step, disabled, onChange, accent, aria }: { label: React.ReactNode; value: number; min: number; max: number; step: number; disabled: boolean; onChange: (v: number) => void; accent: keyof typeof ACCENT; aria: string }) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 font-mono">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} aria-label={aria} onChange={(e) => onChange(Number(e.target.value))} className={`min-w-0 flex-1 disabled:opacity-50 ${ACCENT[accent]}`} />
    </label>
  );
}

function Line({ plane, p, q, stroke, width = 1, dash, opacity }: { plane: Plane; p: V2; q: V2; stroke: string; width?: number; dash?: string; opacity?: number }) {
  const [x1, y1] = plane.toPx(p);
  const [x2, y2] = plane.toPx(q);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={width} strokeDasharray={dash} opacity={opacity} strokeLinecap="round" />;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function StrainGrid({ config, disabled = false }: Props) {
  const scale = finite(config.scale, 1) > 0 ? finite(config.scale, 1) : 1;
  const g0 = sanitize(config.grad);
  const [g, setG] = useState<Grad>(g0);

  // Sliders: [−0.3, 0.3] in drawn units (i.e. ±0.3/scale of true gradient), step 0.01/scale.
  const step = 0.01 / scale;
  const biggest0 = Math.max(...g0.flat().map(Math.abs));
  const lim = Math.ceil(Math.max(0.3 / scale, biggest0) / step - 1e-9) * step;
  const bound = config.sliders ? 1 + 2 * lim * scale : 1 + scale * Math.max(Math.abs(g0[0][0]) + Math.abs(g0[0][1]), Math.abs(g0[1][0]) + Math.abs(g0[1][1]));
  const range = Math.max(1.45, bound + 0.3);
  const plane = makePlane(range);

  const F = (p: V2): V2 => [p[0] + scale * (g[0][0] * p[0] + g[0][1] * p[1]), p[1] + scale * (g[1][0] * p[0] + g[1][1] * p[1])];
  const m = strainMeasures(g);
  const phiDrawn = cornerAngle(g, scale);
  const phiTrue = cornerAngle(g, 1);
  const inverted = !(phiDrawn > 0 && phiDrawn < 180) || (1 + scale * g[0][0]) * (1 + scale * g[1][1]) - scale * scale * g[0][1] * g[1][0] <= 0;

  const biggest = Math.max(...g.flat().map(Math.abs));
  const micro = biggest > 0 && biggest < 0.01;
  const sv = (x: number) => (micro ? `${fmtNum(x * 1e6, 4)} μ` : fmtNum(x, 4));
  const tv = (x: number) => (micro ? texNum(x * 1e6, 4) : texNum(x, 4));

  // corner arc at the deformed lower-left corner
  const P0 = F([-1, -1]);
  const [cx, cy] = plane.toPx(P0);
  const d1: V2 = [1 + scale * g[0][0], scale * g[1][0]];
  const d2: V2 = [scale * g[0][1], 1 + scale * g[1][1]];
  const n1 = Math.hypot(d1[0], d1[1]) || 1;
  const n2 = Math.hypot(d2[0], d2[1]) || 1;
  const r = 30;
  const a1: V2 = [cx + (r * d1[0]) / n1, cy - (r * d1[1]) / n1];
  const a2: V2 = [cx + (r * d2[0]) / n2, cy - (r * d2[1]) / n2];
  const bis: V2 = [d1[0] / n1 + d2[0] / n2, d1[1] / n1 + d2[1] / n2];
  const bn = Math.hypot(bis[0], bis[1]) || 1;
  const lbl: V2 = [cx + (52 * bis[0]) / bn, cy - (52 * bis[1]) / bn];
  const [ux, uy] = plane.toPx([-1, -1]);
  const corner = F([1, 1]);
  const square = [F([-1, -1]), F([1, -1]), F([1, 1]), F([-1, 1])];

  const names = ["∂u/∂x", "∂u/∂y", "∂v/∂x", "∂v/∂y"] as const;
  const accents = ["blue", "purple", "purple", "orange"] as const;
  const set = (i: number, v: number) => setG((cur) => (i === 0 ? [[v, cur[0][1]], cur[1]] : i === 1 ? [[cur[0][0], v], cur[1]] : i === 2 ? [cur[0], [v, cur[1][1]]] : [cur[0], [cur[1][0], v]]) as Grad);

  const axisEnd = range * 0.94;

  return (
    <div className="grid gap-3">
      <svg viewBox={`0 0 ${plane.size} ${plane.size}`} className="mx-auto w-full max-w-[420px] select-none rounded-2xl border border-border bg-surface" role="img" aria-label={`Square of material deformed by the displacement gradient: strain xx ${sv(m.exx)}, strain yy ${sv(m.eyy)}, engineering shear strain ${sv(m.gxy)}`}>
        {/* axes */}
        <Line plane={plane} p={[-axisEnd, 0]} q={[axisEnd, 0]} stroke="var(--canvas-axis)" />
        <Line plane={plane} p={[0, -axisEnd]} q={[0, axisEnd]} stroke="var(--canvas-axis)" />
        <text x={plane.toPx([axisEnd, 0])[0] - 4} y={plane.toPx([axisEnd, 0])[1] - 6} fontSize={12} fontStyle="italic" textAnchor="end" fill="var(--muted)">
          x
        </text>
        <text x={plane.toPx([0, axisEnd])[0] + 7} y={plane.toPx([0, axisEnd])[1] + 10} fontSize={12} fontStyle="italic" fill="var(--muted)">
          y
        </text>

        {/* undeformed square and grid */}
        {TICKS.map((t) => (
          <g key={`u${t}`}>
            <Line plane={plane} p={[t, -1]} q={[t, 1]} stroke="var(--muted)" dash="4 4" opacity={Math.abs(t) === 1 ? 0.8 : 0.45} />
            <Line plane={plane} p={[-1, t]} q={[1, t]} stroke="var(--muted)" dash="4 4" opacity={Math.abs(t) === 1 ? 0.8 : 0.45} />
          </g>
        ))}
        <polyline points={`${ux + 11},${uy} ${ux + 11},${uy - 11} ${ux},${uy - 11}`} fill="none" stroke="var(--muted)" strokeWidth={1.3} />

        {/* deformed square and grid */}
        <polygon points={square.map((p) => plane.toPx(p).join(",")).join(" ")} fill="var(--purple)" fillOpacity={0.1} />
        {TICKS.map((t) => (
          <g key={`d${t}`}>
            <Line plane={plane} p={F([t, -1])} q={F([t, 1])} stroke="var(--orange)" width={Math.abs(t) === 1 ? 2.4 : 1.3} opacity={Math.abs(t) === 1 ? 1 : 0.75} />
            <Line plane={plane} p={F([-1, t])} q={F([1, t])} stroke="var(--blue)" width={Math.abs(t) === 1 ? 2.4 : 1.3} opacity={Math.abs(t) === 1 ? 1 : 0.75} />
          </g>
        ))}
        <circle cx={plane.toPx(corner)[0]} cy={plane.toPx(corner)[1]} r={3.5} fill="var(--text)" />

        {/* the (formerly) right angle */}
        {!inverted && (
          <g>
            <path d={`M ${a1[0]} ${a1[1]} A ${r} ${r} 0 0 0 ${a2[0]} ${a2[1]}`} fill="var(--purple)" fillOpacity={0.15} stroke="var(--purple)" strokeWidth={2} />
            <text x={lbl[0]} y={lbl[1] + 4} fontSize={12.5} fontWeight={700} textAnchor="middle" fill="var(--purple)" style={HALO}>
              {`${fmtNum(phiDrawn, 4)}°`}
            </text>
          </g>
        )}
      </svg>

      <div className="mx-auto grid w-full max-w-[420px] gap-2 rounded-2xl border border-border bg-surface-2/60 p-3 text-sm">
        <div className="overflow-x-auto">
          <TeX tex={`\\begin{bmatrix}\\partial u/\\partial x & \\partial u/\\partial y\\\\ \\partial v/\\partial x & \\partial v/\\partial y\\end{bmatrix}=\\begin{bmatrix}${tv(g[0][0])} & ${tv(g[0][1])}\\\\ ${tv(g[1][0])} & ${tv(g[1][1])}\\end{bmatrix}${micro ? "\\times 10^{-6}" : ""}`} />
        </div>
        {config.sliders && (
          <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
            {names.map((name, i) => {
              const v = g[Math.floor(i / 2)][i % 2];
              return <SliderRow key={name} label={`${name} = ${sv(v)}`} value={v} min={-lim} max={lim} step={step} disabled={disabled} accent={accents[i]} aria={name} onChange={(x) => set(i, x)} />;
            })}
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[13px]">
          <span className="text-blue">εxx = ∂u/∂x = {sv(m.exx)}</span>
          <span className="text-orange">εyy = ∂v/∂y = {sv(m.eyy)}</span>
          <span className="text-purple">γxy = ∂u/∂y + ∂v/∂x = {sv(m.gxy)}</span>
          <span className="text-purple">εxy = ½γxy = {sv(m.exy)}</span>
          <span className="text-teal">ω = ½(∂v/∂x − ∂u/∂y) = {sv(m.omega)}</span>
        </div>
        <div className="overflow-x-auto">
          <TeX tex={`\\boldsymbol{\\varepsilon}=\\begin{bmatrix}\\varepsilon_{xx} & \\tfrac12\\gamma_{xy}\\\\ \\tfrac12\\gamma_{xy} & \\varepsilon_{yy}\\end{bmatrix}=\\begin{bmatrix}${tv(m.exx)} & ${tv(m.exy)}\\\\ ${tv(m.exy)} & ${tv(m.eyy)}\\end{bmatrix}${micro ? "\\times 10^{-6}" : ""}`} />
        </div>
        <div className="text-xs text-muted">
          {inverted
            ? "The drawn deformation is so large that the square folds over — reduce the gradient (or the scale)."
            : scale === 1
              ? `The right angle at the corner is now ${fmtNum(phiTrue, 4)}°, a decrease of ${fmtNum(90 - phiTrue, 4)}°; the small-strain value is γxy = ${fmtNum(m.gxy, 4)} rad = ${fmtNum((m.gxy * 180) / Math.PI, 4)}°.`
              : `Drawn ×${fmtNum(scale, 4)}. The true corner angle is ${fmtNum(phiTrue, 6)}°, a decrease of ${fmtNum(90 - phiTrue, 4)}° ≈ γxy = ${fmtNum(m.gxy, 4)} rad.`}{" "}
          Blue lines were horizontal (x-fibres), orange were vertical (y-fibres); dashed = undeformed. γxy &gt; 0 closes the corner angle; ω &gt; 0 is a counter-clockwise rigid rotation and produces no strain.
          {micro && " μ = 10⁻⁶."}
        </div>
      </div>
    </div>
  );
}
