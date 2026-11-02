"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import type { BeamLoad, ShearMomentConfig } from "@/content/types";
import { Math as TeX } from "@/components/ui/RichText";

interface Props {
  config: ShearMomentConfig;
  disabled?: boolean;
}

/*
 * Shear-force and bending-moment diagrams in the COURSE convention (Govindjee §8.2).
 *
 * Loads in the config are given the way a problem states them:
 *   point  { x, P }         P > 0 is a DOWNWARD force at x             → q = −P δ(x − a)
 *   udl    { from, to, w }  w > 0 is a DOWNWARD force per unit length  → q = −w on [from, to]
 *   moment { x, M }         M > 0 is a CLOCKWISE applied couple at x (the sense of M̄ in Fig. 8.10)
 *                                                                      → q = M δ′(x − a)
 * Internal resultants: V = ∫σxy dA (positive along +y on a +x face), M = −∫yσxx dA (positive =
 * sagging, top in compression), q positive UP, dV/dx + q = 0, dM/dx + V = 0, so
 *   V(x) = V(0) − ∫₀ˣ q dx,   M(x) = M(0) − ∫₀ˣ V dx.
 * Equilibrium of the free body to the LEFT of a cut at x, whose left end carries the reaction force F0
 * (upward) and the reaction couple C0 (counter-clockwise) when the beam is supported there:
 *   V(x) = −F0 + Σ_{xi<x} Pi + ∫₀ˣ w ds
 *   M(x) = −C0 + F0·x − Σ_{xi<x} Pi (x − xi) − ∫₀ˣ w(s) (x − s) ds + Σ_{xj<x} Mj
 * so a downward P makes V jump by +P, and a clockwise couple M makes M(x) jump UP by +M
 * (equivalently: a counter-clockwise couple makes M jump down).
 * Checks against the book: Example 8.3 (cantilever fixed at x = 0, downward tip load P): V = −P,
 * M(0) = −PL, M(L) = 0. Simple beam, downward P at a: RA = P(L − a)/L, V = −RA then +Pa/L,
 * M(a) = Pab/L. UDL w down on a simple beam: V = −wL/2 + wx, M = wx(L − x)/2. Example 8.1 (clockwise
 * M̄ at x = d on a simple beam): RA = −M̄/L (down), V = M̄/L, M = −M̄x/L then jumps up by M̄.
 */

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const SUB = "₀₁₂₃₄₅₆₇₈₉";

function trimZeros(s: string): string {
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

function groupDigits(s: string, sep: string): string {
  const [int, dec] = s.split(".");
  const g = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : int;
  return dec === undefined ? g : `${g}.${dec}`;
}

/** |x| rounded to `sig` significant figures, split into a mantissa and a power of ten (0 = none). */
function numParts(x: number, sig: number): { neg: boolean; mant: string; exp: number } | null {
  if (!Number.isFinite(x)) return null;
  const a = Math.abs(x);
  if (a === 0) return { neg: false, mant: "0", exp: 0 };
  const r = Number(a.toPrecision(sig));
  let e = Math.floor(Math.log10(r));
  if (10 ** (e + 1) <= r) e += 1;
  else if (10 ** e > r) e -= 1;
  if (e >= 6 || e <= -4) return { neg: x < 0, mant: trimZeros((r / 10 ** e).toFixed(sig - 1)), exp: e };
  if (e >= sig - 1) return { neg: x < 0, mant: String(Math.round(a)), exp: 0 };
  return { neg: x < 0, mant: trimZeros(r.toFixed(sig - 1 - e)), exp: 0 };
}

/** Plain-text number for SVG labels: 16, 2.667, 12 500, 3.2×10⁶, −8. */
function numText(x: number, sig = 4): string {
  const p = numParts(x, sig);
  if (!p) return "—";
  const sign = p.neg && p.mant !== "0" ? "−" : "";
  if (p.exp) return `${sign}${p.mant}×10${String(p.exp).replace(/./g, (c) => SUP[c] ?? c)}`;
  return sign + groupDigits(p.mant, " ");
}

/** The same number as KaTeX source. */
function numTex(x: number, sig = 4): string {
  const p = numParts(x, sig);
  if (!p) return "\\text{--}";
  const sign = p.neg && p.mant !== "0" ? "-" : "";
  if (p.exp) return `${sign}${p.mant}\\times 10^{${p.exp}}`;
  return sign + groupDigits(p.mant, "\\,");
}

/** An author-supplied unit label as KaTeX (characters that break \text{…} stripped). */
function texUnit(u: string): string {
  if (!u) return "";
  return `\\,\\text{${u.replace(/\^\{?(\d)\}?/g, (_m, d: string) => SUP[d] ?? d).replace(/[\\{}$&#%_^~]/g, "")}}`;
}

/** Slider value printed to the precision of its step. */
function stepText(v: number, step: number): string {
  const d = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
  const s = trimZeros(Math.abs(v).toFixed(d));
  return (v < 0 && Number(s) !== 0 ? "−" : "") + groupDigits(s, " ");
}

/** 1, 2 or 5 × 10ᵏ: the smallest such value ≥ x. */
function niceNum(x: number): number {
  if (!(x > 0) || !Number.isFinite(x)) return 1;
  const e = Math.floor(Math.log10(x));
  const f = x / 10 ** e;
  const m = f <= 1 + 1e-9 ? 1 : f <= 2 + 1e-9 ? 2 : f <= 5 + 1e-9 ? 5 : 10;
  return Number((m * 10 ** e).toPrecision(12));
}

function signedRange(v0: number, fallback: number) {
  const ref = Math.abs(v0) > 0 ? Math.abs(v0) : fallback;
  const step = niceNum(ref / 50);
  const max = Number((Math.ceil((2 * ref) / step - 1e-9) * step).toPrecision(12));
  return { min: -max, max, step };
}

const maxAbs = (vs: number[]) => vs.reduce((m, v) => (Number.isFinite(v) ? Math.max(m, Math.abs(v)) : m), 0);

/* ------------------------------------------------------------------ */
/* Statics                                                             */
/* ------------------------------------------------------------------ */

type Support = ShearMomentConfig["support"];

interface Loads {
  /** P > 0 downward */
  points: { x: number; P: number }[];
  /** w > 0 downward on [a, b] */
  udls: { a: number; b: number; w: number }[];
  /** M > 0 clockwise */
  couples: { x: number; M: number }[];
}

export interface SMSample {
  x: number;
  V: number;
  M: number;
  /** −1 = left limit x⁻ at a breakpoint, +1 = right limit x⁺, 0 = ordinary point */
  side: -1 | 0 | 1;
}

export interface SMSolution {
  L: number;
  support: Support;
  loads: Loads;
  /** Reaction force (up) and couple (counter-clockwise) on the beam at its LEFT end (0 when free). */
  F0: number;
  C0: number;
  /** Simple supports: upward reactions at the pin (x = 0) and the roller (x = L). */
  RA: number;
  RB: number;
  /** Cantilevers: upward force and counter-clockwise couple that the wall exerts on the beam. */
  wallR: number;
  wallC: number;
  /** V and M on ~400 points plus both one-sided limits at every load point and the zeros of V. */
  samples: SMSample[];
  breaks: number[];
  tolV: number;
  tolM: number;
}

function normalizeLoads(L: number, loads: readonly BeamLoad[]): Loads {
  const clampX = (x: number) => (Number.isFinite(x) ? Math.min(L, Math.max(0, x)) : 0);
  const num = (v: number) => (Number.isFinite(v) ? v : 0);
  const out: Loads = { points: [], udls: [], couples: [] };
  for (const l of loads) {
    if (l.kind === "point") out.points.push({ x: clampX(l.x), P: num(l.P) });
    else if (l.kind === "moment") out.couples.push({ x: clampX(l.x), M: num(l.M) });
    else if (l.kind === "udl") {
      const a = clampX(Math.min(num(l.from), num(l.to)));
      const b = clampX(Math.max(num(l.from), num(l.to)));
      out.udls.push({ a, b, w: num(l.w) });
    }
  }
  return out;
}

/** V and M at x from the left free body; `include` = also count loads sitting exactly at x (right limit). */
function evalVM(x: number, include: boolean, F0: number, C0: number, ld: Loads): { V: number; M: number } {
  let V = -F0;
  let M = -C0 + F0 * x;
  for (const p of ld.points) {
    if (p.x < x || (include && p.x === x)) {
      V += p.P;
      M -= p.P * (x - p.x);
    }
  }
  for (const u of ld.udls) {
    if (x > u.a && u.b > u.a) {
      const e = Math.min(x, u.b);
      V += u.w * (e - u.a);
      M -= (u.w * ((x - u.a) ** 2 - (x - e) ** 2)) / 2;
    }
  }
  for (const c of ld.couples) {
    if (c.x < x || (include && c.x === x)) M += c.M;
  }
  return { V, M };
}

export function solveBeam(length: number, support: Support, loads: readonly BeamLoad[], n = 400): SMSolution {
  const L = Number.isFinite(length) && length > 0 ? length : 1;
  const ld = normalizeLoads(L, loads ?? []);
  let Wdown = 0; // total downward force
  let Mcw = 0; // total clockwise moment of the applied loads about x = 0
  let Fs = 0; // magnitude scales, used to snap round-off to exactly zero
  let Cs = 0;
  for (const p of ld.points) {
    Wdown += p.P;
    Mcw += p.P * p.x;
    Fs += Math.abs(p.P);
  }
  for (const u of ld.udls) {
    const F = u.w * (u.b - u.a);
    Wdown += F;
    Mcw += (F * (u.a + u.b)) / 2;
    Fs += Math.abs(F);
  }
  for (const c of ld.couples) {
    Mcw += c.M;
    Cs += Math.abs(c.M);
  }
  const tolV = 1e-9 * (Fs + Cs / L) + 1e-300;
  const tolM = 1e-9 * (Fs * L + Cs) + 1e-300;
  const snapV = (v: number) => (Math.abs(v) < tolV ? 0 : v);
  const snapM = (v: number) => (Math.abs(v) < tolM ? 0 : v);

  const sup: Support = support === "cantilever-left" || support === "cantilever-right" ? support : "simple";
  let F0 = 0;
  let C0 = 0;
  let RA = 0;
  let RB = 0;
  let wallR = 0;
  let wallC = 0;
  if (sup === "simple") {
    // pin at 0, roller at L: ΣM about the pin gives RB·L = Mcw, ΣFy gives RA + RB = Wdown
    RB = snapV(Mcw / L);
    RA = snapV(Wdown - Mcw / L);
    F0 = RA;
  } else if (sup === "cantilever-left") {
    // wall at x = 0: ΣFy ⇒ R = Wdown; ΣM about the wall ⇒ counter-clockwise couple C = Mcw
    wallR = snapV(Wdown);
    wallC = snapM(Mcw);
    F0 = wallR;
    C0 = wallC;
  } else {
    // wall at x = L, free left end (F0 = C0 = 0): ΣM about x = L ⇒ C = Mcw − Wdown·L
    wallR = snapV(Wdown);
    wallC = snapM(Mcw - Wdown * L);
  }

  const breaks = [...new Set([0, L, ...ld.points.map((p) => p.x), ...ld.couples.map((c) => c.x), ...ld.udls.flatMap((u) => [u.a, u.b])])].sort((p, q) => p - q);
  const tolX = 1e-9 * L;
  const xs: { x: number; brk: boolean }[] = breaks.map((x) => ({ x, brk: true }));
  for (let i = 1; i < n; i++) {
    const x = (i * L) / n;
    if (!breaks.some((b) => Math.abs(b - x) <= tolX)) xs.push({ x, brk: false });
  }
  xs.sort((p, q) => p.x - q.x);

  const raw: SMSample[] = [];
  const push = (x: number, side: -1 | 0 | 1) => {
    const r = evalVM(x, side === 1, F0, C0, ld);
    raw.push({ x, V: snapV(r.V), M: snapM(r.M), side });
  };
  for (const { x, brk } of xs) {
    if (!brk) push(x, 0);
    else {
      if (x > 0) push(x, -1);
      if (x < L) push(x, 1);
    }
  }

  // V is linear between consecutive samples, so its sign changes can be located exactly:
  // those are the stationary points of M (dM/dx = −V = 0).
  const samples: SMSample[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (i > 0) {
      const p = raw[i - 1];
      const s = raw[i];
      if (s.x > p.x && ((p.V < 0 && s.V > 0) || (p.V > 0 && s.V < 0))) {
        const xr = p.x + ((s.x - p.x) * p.V) / (p.V - s.V);
        samples.push({ x: xr, V: 0, M: snapM(evalVM(xr, false, F0, C0, ld).M), side: 0 });
      }
    }
    samples.push(raw[i]);
  }

  return { L, support: sup, loads: ld, F0, C0, RA, RB, wallR, wallC, samples, breaks, tolV, tolM };
}

interface Extreme {
  v: number;
  /** extent of the first run of samples attaining the extreme */
  a: number;
  b: number;
  side: -1 | 0 | 1;
  /** the extreme is a one-sided limit at a jump */
  jump: boolean;
}

function extremeOf(samples: SMSample[], key: "V" | "M", which: "max" | "min", tol: number): Extreme | null {
  if (!samples.length) return null;
  let best = samples[0][key];
  for (const s of samples) best = which === "max" ? Math.max(best, s[key]) : Math.min(best, s[key]);
  const i = samples.findIndex((s) => Math.abs(s[key] - best) <= tol);
  let j = i;
  while (j + 1 < samples.length && Math.abs(samples[j + 1][key] - best) <= tol) j++;
  const s = samples[i];
  const twin = samples.some((t, k) => k !== i && t.x === s.x && Math.abs(t[key] - s[key]) > tol);
  return { v: best, a: s.x, b: samples[j].x, side: s.side, jump: i === j && twin };
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const W = 460;
const X0 = 62;
const X1 = 436;
const BEAM_TOP = 54;
const BEAM_BOT = 64;
const BEAM_MID = 59;
const REACT_Y = 98;
const V_TOP = 110;
const V_BOT = 232;
const M_TOP = 248;
const M_BOT = 370;
const AXIS_Y = 386;
const H = 396;
const PAD = 16;

const halo = { paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3, strokeLinejoin: "round" } as const;
const LOAD = "var(--purple)";
const REACT = "var(--teal)";

function PxArrow({ x1, y1, x2, y2, color, width = 2, head = 7 }: { x1: number; y1: number; x2: number; y2: number; color: string; width?: number; head?: number }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;
  const ux = dx / len;
  const uy = dy / len;
  const hl = Math.min(head, len * 0.6);
  const hw = hl * 0.5;
  const bx = x2 - ux * hl;
  const by = y2 - uy * hl;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx + ux * 0.5} y2={by + uy * 0.5} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`} fill={color} />
    </g>
  );
}

/** Circular-arc arrow; angles in screen degrees (y down), drawn from `from` to `to` (to > from = clockwise). */
function ArcArrow({ cx, cy, r, from, to, color, width = 2 }: { cx: number; cy: number; r: number; from: number; to: number; color: string; width?: number }) {
  const rad = Math.PI / 180;
  const x0 = cx + r * Math.cos(from * rad);
  const y0 = cy + r * Math.sin(from * rad);
  const x1 = cx + r * Math.cos(to * rad);
  const y1 = cy + r * Math.sin(to * rad);
  const s = to > from ? 1 : -1;
  // unit tangent in the direction of travel at the end point
  const tx = -Math.sin(to * rad) * s;
  const ty = Math.cos(to * rad) * s;
  const hl = 7;
  const hw = 4;
  return (
    <g>
      <path d={`M ${x0} ${y0} A ${r} ${r} 0 ${Math.abs(to - from) > 180 ? 1 : 0} ${s > 0 ? 1 : 0} ${x1} ${y1}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x1 + tx * hl},${y1 + ty * hl} ${x1 - ty * hw},${y1 + tx * hw} ${x1 + ty * hw},${y1 - tx * hw}`} fill={color} />
    </g>
  );
}

function Pin({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="var(--muted)" strokeWidth={1.5} fill="var(--surface)">
      <polygon points={`${x},${y} ${x - 8},${y + 14} ${x + 8},${y + 14}`} strokeLinejoin="round" />
      <line x1={x - 13} y1={y + 14} x2={x + 13} y2={y + 14} />
      {[-10, -4, 2, 8].map((d) => (
        <line key={d} x1={x + d + 4} y1={y + 14} x2={x + d} y2={y + 19} strokeWidth={1} />
      ))}
    </g>
  );
}

function Roller({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="var(--muted)" strokeWidth={1.5} fill="var(--surface)">
      <polygon points={`${x},${y} ${x - 8},${y + 10} ${x + 8},${y + 10}`} strokeLinejoin="round" />
      <circle cx={x - 4} cy={y + 13} r={3} />
      <circle cx={x + 4} cy={y + 13} r={3} />
      <line x1={x - 13} y1={y + 16} x2={x + 13} y2={y + 16} />
      {[-10, -4, 2, 8].map((d) => (
        <line key={d} x1={x + d + 4} y1={y + 16} x2={x + d} y2={y + 21} strokeWidth={1} />
      ))}
    </g>
  );
}

/** Built-in end; `side` −1 puts the hatched wall to the left of x, +1 to the right. */
function Wall({ x, y, side }: { x: number; y: number; side: -1 | 1 }) {
  return (
    <g stroke="var(--muted)">
      <line x1={x} y1={y - 24} x2={x} y2={y + 24} strokeWidth={2.25} />
      {[-22, -14, -6, 2, 10, 18].map((d) => (
        <line key={d} x1={x} y1={y + d} x2={x + side * 8} y2={y + d + 7} strokeWidth={1} />
      ))}
    </g>
  );
}

interface DiagramLabel {
  x: number;
  v: number;
  text: string;
}

/** One diagram: positive part blue above the zero line, negative part orange below (clip paths). */
function Diagram({ id, symbol, unit, pts, lo, hi, top, bottom, px, L, labels }: { id: string; symbol: string; unit: string; pts: { x: number; v: number }[]; lo: number; hi: number; top: number; bottom: number; px: (x: number) => number; L: number; labels: DiagramLabel[] }) {
  const py = (v: number) => top + PAD + ((hi - v) / (hi - lo)) * (bottom - top - 2 * PAD);
  const y0 = py(0);
  const line = pts.map((p) => `${px(p.x).toFixed(2)},${py(p.v).toFixed(2)}`).join(" ");
  const area = `${px(0).toFixed(2)},${y0.toFixed(2)} ${line} ${px(L).toFixed(2)},${y0.toFixed(2)}`;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-pos`}>
          <rect x={0} y={top - 4} width={W} height={Math.max(0, y0 - top + 4)} />
        </clipPath>
        <clipPath id={`${id}-neg`}>
          <rect x={0} y={y0} width={W} height={Math.max(0, bottom - y0 + 4)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-pos)`}>
        <polygon points={area} fill="var(--blue)" fillOpacity={0.16} />
        <polyline points={line} fill="none" stroke="var(--blue)" strokeWidth={2.25} strokeLinejoin="round" />
      </g>
      <g clipPath={`url(#${id}-neg)`}>
        <polygon points={area} fill="var(--orange)" fillOpacity={0.18} />
        <polyline points={line} fill="none" stroke="var(--orange)" strokeWidth={2.25} strokeLinejoin="round" />
      </g>
      <line x1={px(0)} y1={y0} x2={px(L)} y2={y0} stroke="var(--canvas-axis)" strokeWidth={1.25} />
      <text x={px(0) - 10} y={y0 + 3} fontSize={15} fontWeight={700} fontStyle="italic" textAnchor="end" fill="var(--text)" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
        {symbol}
      </text>
      {unit && (
        <text x={px(0) - 10} y={y0 + 15} fontSize={9.5} textAnchor="end" fill="var(--muted)">
          ({unit})
        </text>
      )}
      {labels.map((l, i) => {
        const above = l.v > 0;
        const x = Math.min(Math.max(px(l.x), px(0) + 26), px(L) - 26);
        return (
          <text key={i} x={x} y={above ? py(l.v) - 6 : py(l.v) + 15} fontSize={11} fontWeight={600} textAnchor="middle" fill={above ? "var(--blue)" : "var(--orange)"} style={halo}>
            {l.text}
          </text>
        );
      })}
    </g>
  );
}

function Slider({ label, value, min, max, step, disabled, onChange }: { label: ReactNode; value: number; min: number; max: number; step: number; disabled: boolean; onChange: (v: number) => void }) {
  return (
    <label className={`flex items-center gap-3 text-xs ${disabled ? "opacity-60" : ""}`}>
      <span className="w-40 shrink-0 font-mono">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[var(--blue)] disabled:cursor-not-allowed" />
    </label>
  );
}

/** Display names P / P₁, P₂ …, w, M̄ for the loads, in config order. */
function loadNames(loads: readonly BeamLoad[]): string[] {
  const count = { point: 0, udl: 0, moment: 0 };
  for (const l of loads) count[l.kind]++;
  const seen = { point: 0, udl: 0, moment: 0 };
  const base = { point: "P", udl: "w", moment: "M̄" };
  return loads.map((l) => {
    const k = seen[l.kind]++;
    return count[l.kind] > 1 ? `${base[l.kind]}${String(k + 1).replace(/\d/g, (d) => SUB[Number(d)])}` : base[l.kind];
  });
}

function extentOf(samples: SMSample[], key: "V" | "M"): [number, number] {
  let lo = 0;
  let hi = 0;
  for (const s of samples) {
    lo = Math.min(lo, s[key]);
    hi = Math.max(hi, s[key]);
  }
  return [lo, hi];
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function ShearMoment({ config, disabled = false }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const L = Number.isFinite(config.length) && config.length > 0 ? config.length : 1;
  const configLoads = useMemo(() => config.loads ?? [], [config.loads]);
  const [loads, setLoads] = useState<BeamLoad[]>(() => (config.loads ?? []).map((l) => ({ ...l })));
  const sol = useMemo(() => solveBeam(L, config.support, loads), [L, config.support, loads]);
  const init = useMemo(() => solveBeam(L, config.support, configLoads), [L, config.support, configLoads]);

  // slider ranges from the authored loads (stable while sliding)
  const ranges = useMemo(() => {
    const Pmax = maxAbs(configLoads.map((l) => (l.kind === "point" ? l.P : 0)));
    const wmax = maxAbs(configLoads.map((l) => (l.kind === "udl" ? l.w : 0)));
    const Mmax = maxAbs(configLoads.map((l) => (l.kind === "moment" ? l.M : 0)));
    const Pref = Pmax || wmax * L || Mmax / L || 10;
    return {
      posStep: niceNum(L / 100),
      mag: configLoads.map((l) => (l.kind === "point" ? signedRange(l.P, Pref) : l.kind === "udl" ? signedRange(l.w, wmax || Pref / L) : signedRange(l.M, Mmax || (Pref * L) / 4))),
    };
  }, [configLoads, L]);

  const names = loadNames(loads);
  const nameOf = (kind: BeamLoad["kind"], k: number) => {
    let seen = -1;
    for (let i = 0; i < loads.length; i++) {
      if (loads[i].kind === kind && ++seen === k) return names[i];
    }
    return "";
  };

  const update = (i: number, patch: { x?: number; v?: number }) =>
    setLoads((ls) =>
      ls.map((l, j) => {
        if (j !== i) return l;
        if (l.kind === "point") return { ...l, x: patch.x ?? l.x, P: patch.v ?? l.P };
        if (l.kind === "moment") return { ...l, x: patch.x ?? l.x, M: patch.v ?? l.M };
        return { ...l, w: patch.v ?? l.w };
      }),
    );

  const fu = config.units?.force?.trim() ?? "";
  const lu = config.units?.length?.trim() ?? "";
  const mu = fu && lu ? `${fu}·${lu}` : fu;
  const wu = fu && lu ? `${fu}/${lu}` : fu;
  const px = (x: number) => X0 + (x / sol.L) * (X1 - X0);

  /* --- diagram ranges: union of the current and the authored diagrams, so sliders show growth --- */
  const [vlo1, vhi1] = extentOf(sol.samples, "V");
  const [vlo0, vhi0] = extentOf(init.samples, "V");
  const [mlo1, mhi1] = extentOf(sol.samples, "M");
  const [mlo0, mhi0] = extentOf(init.samples, "M");
  let vlo = Math.min(vlo1, vlo0);
  let vhi = Math.max(vhi1, vhi0);
  let mlo = Math.min(mlo1, mlo0);
  let mhi = Math.max(mhi1, mhi0);
  if (vhi - vlo <= 0) [vlo, vhi] = [-1, 1];
  if (mhi - mlo <= 0) [mlo, mhi] = [-1, 1];

  const vMax = extremeOf(sol.samples, "V", "max", sol.tolV);
  const vMin = extremeOf(sol.samples, "V", "min", sol.tolV);
  const mMax = extremeOf(sol.samples, "M", "max", sol.tolM);
  const mMin = extremeOf(sol.samples, "M", "min", sol.tolM);
  // a constant diagram has max = min: report that run once
  const same = (p: Extreme | null, q: Extreme | null, tol: number) => !!p && !!q && Math.abs(p.v - q.v) <= tol;
  const labelFor = (e: Extreme | null, unit: string): DiagramLabel[] => (e && e.v !== 0 ? [{ x: (e.a + e.b) / 2, v: e.v, text: `${numText(e.v)}${unit ? ` ${unit}` : ""}` }] : []);
  const vLabels = [...labelFor(vMax, fu), ...(same(vMax, vMin, sol.tolV) ? [] : labelFor(vMin, fu))];
  const mLabels = [...labelFor(mMax, mu), ...(same(mMax, mMin, sol.tolM) ? [] : labelFor(mMin, mu))];

  const where = (e: Extreme) => {
    const u = lu ? ` ${lu}` : "";
    if (e.b - e.a > 1e-6 * sol.L) return `on ${numText(e.a, 3)} < x < ${numText(e.b, 3)}${u}`;
    const mark = e.jump ? (e.side === 1 ? "⁺" : e.side === -1 ? "⁻" : "") : "";
    return `at x = ${numText(e.a, 3)}${mark}${u}`;
  };
  /** The extreme(s) of largest magnitude, both when they tie. */
  const biggest = (mx: Extreme | null, mn: Extreme | null, tol: number) => {
    const cands = [mx, ...(same(mx, mn, tol) ? [] : [mn])].filter((e): e is Extreme => !!e && e.v !== 0);
    const top = maxAbs(cands.map((e) => e.v));
    return cands.filter((e) => Math.abs(e.v) >= top - tol);
  };
  const vBig = biggest(vMax, vMin, sol.tolV);
  const mBig = biggest(mMax, mMin, sol.tolM);

  /* --- x ticks at the load points --- */
  const ticks: number[] = [];
  let lastPx = -Infinity;
  for (const b of sol.breaks) {
    const p = px(b);
    if (b === sol.L) {
      if (p - lastPx < 22 && ticks.length > 1) ticks.pop();
      ticks.push(b);
    } else if (p - lastPx >= 22) {
      ticks.push(b);
      lastPx = p;
    }
  }

  /* --- load glyph sizes --- */
  const pRef = Math.max(maxAbs(sol.loads.points.map((p) => p.P)), maxAbs(init.loads.points.map((p) => p.P))) || 1;
  const wRef = Math.max(maxAbs(sol.loads.udls.map((u) => u.w)), maxAbs(init.loads.udls.map((u) => u.w))) || 1;
  const arrowUp = (v: number) => (v >= 0 ? "↑" : "↓");
  const hasCouple = loads.some((l) => l.kind === "moment");

  return (
    <div className="grid gap-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto w-full max-w-[480px] select-none rounded-2xl border border-border bg-surface"
        role="img"
        aria-label={`Beam of length ${numText(sol.L)} ${lu} (${sol.support}) with its shear-force diagram V(x) and bending-moment diagram M(x) in the course sign convention`}
      >
        {/* guides at the load points */}
        {sol.breaks.map((b) => (
          <line key={`g${b}`} x1={px(b)} y1={BEAM_BOT + 2} x2={px(b)} y2={M_BOT} stroke="var(--canvas-grid)" strokeWidth={1} strokeDasharray="3 4" />
        ))}

        {/* beam, supports, reactions */}
        <rect x={X0} y={BEAM_TOP} width={X1 - X0} height={BEAM_BOT - BEAM_TOP} rx={2} fill="var(--surface-3)" stroke="var(--muted)" strokeWidth={1.25} />
        {sol.support === "simple" && (
          <>
            <Pin x={px(0)} y={BEAM_BOT} />
            <Roller x={px(sol.L)} y={BEAM_BOT} />
            <text x={px(0) - 18} y={REACT_Y} fontSize={10.5} textAnchor="start" fill={REACT} style={halo}>
              R<tspan dy={3} fontSize={8}>A</tspan>
              <tspan dy={-3}>
                {" "}
                = {numText(Math.abs(sol.RA))}
                {fu ? ` ${fu}` : ""} {sol.RA !== 0 ? arrowUp(sol.RA) : ""}
              </tspan>
            </text>
            <text x={px(sol.L) + 18} y={REACT_Y} fontSize={10.5} textAnchor="end" fill={REACT} style={halo}>
              R<tspan dy={3} fontSize={8}>B</tspan>
              <tspan dy={-3}>
                {" "}
                = {numText(Math.abs(sol.RB))}
                {fu ? ` ${fu}` : ""} {sol.RB !== 0 ? arrowUp(sol.RB) : ""}
              </tspan>
            </text>
          </>
        )}
        {sol.support !== "simple" && (
          <>
            <Wall x={sol.support === "cantilever-left" ? px(0) : px(sol.L)} y={BEAM_MID} side={sol.support === "cantilever-left" ? -1 : 1} />
            <text x={sol.support === "cantilever-left" ? px(0) + 6 : px(sol.L) - 6} y={REACT_Y} fontSize={10.5} textAnchor={sol.support === "cantilever-left" ? "start" : "end"} fill={REACT} style={halo}>
              wall: R = {numText(Math.abs(sol.wallR))}
              {fu ? ` ${fu}` : ""} {sol.wallR !== 0 ? arrowUp(sol.wallR) : ""}, M<tspan dy={3} fontSize={8}>w</tspan>
              <tspan dy={-3}>
                {" "}
                = {numText(Math.abs(sol.wallC))}
                {mu ? ` ${mu}` : ""} {sol.wallC > 0 ? "↺" : sol.wallC < 0 ? "↻" : ""}
              </tspan>
            </text>
          </>
        )}

        {/* distributed loads */}
        {sol.loads.udls.map((u, i) => {
          if (u.w === 0 || u.b <= u.a) return null;
          const xa = px(u.a);
          const xb = px(u.b);
          const len = 12 + 12 * Math.min(1, Math.abs(u.w) / wRef);
          // drawn above the beam either way (upward loads point away from it), clear of the reaction labels
          const down = u.w > 0;
          const yFar = BEAM_TOP - 1 - len;
          const yNear = BEAM_TOP - 1;
          const nArrows = Math.max(2, Math.round((xb - xa) / 18));
          return (
            <g key={`u${i}`}>
              <line x1={xa} y1={yFar} x2={xb} y2={yFar} stroke={LOAD} strokeWidth={1.5} />
              {Array.from({ length: nArrows + 1 }, (_, k) => xa + ((xb - xa) * k) / nArrows).map((x, k) => (
                <PxArrow key={k} x1={x} y1={down ? yFar : yNear} x2={x} y2={down ? yNear : yFar} color={LOAD} width={1.25} head={5} />
              ))}
              <text x={(xa + xb) / 2} y={yFar - 5} fontSize={11} fontWeight={600} textAnchor="middle" fill={LOAD} style={halo}>
                {nameOf("udl", i)} = {numText(Math.abs(u.w))}
                {wu ? ` ${wu}` : ""}
              </text>
            </g>
          );
        })}

        {/* point loads (P > 0 downward) */}
        {sol.loads.points.map((p, i) => {
          if (p.P === 0) return null;
          const x = px(p.x);
          const len = 14 + 22 * Math.min(1, Math.abs(p.P) / pRef);
          // drawn above the beam either way (an upward P points away from it), clear of the reaction labels
          const down = p.P > 0;
          const yFar = BEAM_TOP - 1 - len;
          const yNear = BEAM_TOP - 1;
          return (
            <g key={`p${i}`}>
              <PxArrow x1={x} y1={down ? yFar : yNear} x2={x} y2={down ? yNear : yFar} color={LOAD} width={2.5} head={8} />
              <text x={Math.min(Math.max(x, X0 + 20), X1 - 20)} y={yFar - 5} fontSize={11} fontWeight={600} textAnchor="middle" fill={LOAD} style={halo}>
                {nameOf("point", i)} = {numText(Math.abs(p.P))}
                {fu ? ` ${fu}` : ""}
              </text>
            </g>
          );
        })}

        {/* point moments (M > 0 clockwise) */}
        {sol.loads.couples.map((c, i) => {
          if (c.M === 0) return null;
          const x = px(c.x);
          const cw = c.M > 0;
          return (
            <g key={`c${i}`}>
              <ArcArrow cx={x} cy={BEAM_MID} r={14} from={cw ? 135 : 45} to={cw ? 405 : -225} color={LOAD} />
              <text x={Math.min(Math.max(x, X0 + 24), X1 - 24)} y={BEAM_MID - 22} fontSize={11} fontWeight={600} textAnchor="middle" fill={LOAD} style={halo}>
                {nameOf("moment", i)} = {numText(Math.abs(c.M))}
                {mu ? ` ${mu}` : ""}
              </text>
            </g>
          );
        })}

        {/* V(x) and M(x) */}
        <Diagram id={`${uid}-V`} symbol="V" unit={fu} pts={sol.samples.map((s) => ({ x: s.x, v: s.V }))} lo={vlo} hi={vhi} top={V_TOP} bottom={V_BOT} px={px} L={sol.L} labels={vLabels} />
        <Diagram id={`${uid}-M`} symbol="M" unit={mu} pts={sol.samples.map((s) => ({ x: s.x, v: s.M }))} lo={mlo} hi={mhi} top={M_TOP} bottom={M_BOT} px={px} L={sol.L} labels={mLabels} />

        {/* x axis */}
        <line x1={X0} y1={M_BOT + 2} x2={X1} y2={M_BOT + 2} stroke="var(--canvas-axis)" strokeWidth={1} />
        {ticks.map((t) => (
          <g key={`t${t}`}>
            <line x1={px(t)} y1={M_BOT + 2} x2={px(t)} y2={M_BOT + 6} stroke="var(--canvas-axis)" strokeWidth={1} />
            <text x={px(t)} y={AXIS_Y} fontSize={10} textAnchor="middle" fill="var(--muted)">
              {numText(t, 3)}
            </text>
          </g>
        ))}
        <text x={X0 - 10} y={AXIS_Y} fontSize={10} textAnchor="end" fill="var(--muted)">
          x{lu ? ` (${lu})` : ""}
        </text>
      </svg>

      <div className="mx-auto grid w-full max-w-[480px] gap-2.5 rounded-2xl border border-border bg-surface-2/60 p-3 text-sm">
        <p className="text-xs leading-relaxed text-muted">
          Course convention: V = ∫σ<sub>xy</sub> dA, dV/dx = −q, dM/dx = −V (sign of V is opposite to Beer/Hibbeler). Loads P, w drawn downward have q = −w; M &gt; 0 is sagging.
        </p>
        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {sol.support === "simple" && (
              <TeX tex={`R_A = ${numTex(Math.abs(sol.RA))}${texUnit(fu)}${sol.RA > 0 ? "\\uparrow" : sol.RA < 0 ? "\\downarrow" : ""},\\quad R_B = ${numTex(Math.abs(sol.RB))}${texUnit(fu)}${sol.RB > 0 ? "\\uparrow" : sol.RB < 0 ? "\\downarrow" : ""}`} />
            )}
            {sol.support !== "simple" && (
              <>
                <TeX tex={`\\text{wall: } R = ${numTex(Math.abs(sol.wallR))}${texUnit(fu)}${sol.wallR > 0 ? "\\uparrow" : sol.wallR < 0 ? "\\downarrow" : ""},\\; M_w = ${numTex(Math.abs(sol.wallC))}${texUnit(mu)}${sol.wallC > 0 ? "\\;\\circlearrowleft" : sol.wallC < 0 ? "\\;\\circlearrowright" : ""}`} />
                {sol.support === "cantilever-left" ? (
                  <TeX tex={`V(0^+) = ${numTex(-sol.wallR)}${texUnit(fu)},\\; M(0^+) = ${numTex(-sol.wallC)}${texUnit(mu)}`} />
                ) : (
                  <TeX tex={`V(L^-) = ${numTex(sol.wallR)}${texUnit(fu)},\\; M(L^-) = ${numTex(sol.wallC)}${texUnit(mu)}`} />
                )}
              </>
            )}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <TeX tex={`|V|_{\\max} = ${numTex(vBig.length ? Math.abs(vBig[0].v) : 0)}${texUnit(fu)}`} />
            <span className="text-xs text-muted">{vBig.map((e) => `V = ${numText(e.v)}${fu ? ` ${fu}` : ""} ${where(e)}`).join("; ")}</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <TeX tex={`|M|_{\\max} = ${numTex(mBig.length ? Math.abs(mBig[0].v) : 0)}${texUnit(mu)}`} />
            <span className="text-xs text-muted">{mBig.map((e) => `M = ${e.v > 0 ? "+" : ""}${numText(e.v)}${mu ? ` ${mu}` : ""} ${where(e)} (${e.v > 0 ? "sagging" : "hogging"})`).join("; ")}</span>
          </div>
        </div>

        {config.sliders && loads.length > 0 && (
          <div className="grid gap-1.5">
            {loads.map((l, i) => {
              const r = ranges.mag[i] ?? signedRange(0, 10);
              const name = names[i];
              if (l.kind === "udl") {
                return (
                  <Slider
                    key={`s${i}`}
                    label={`${name} = ${stepText(l.w, r.step)}${wu ? ` ${wu}` : ""} ${l.w >= 0 ? "↓" : "↑"}`}
                    value={l.w}
                    min={r.min}
                    max={r.max}
                    step={r.step}
                    disabled={disabled}
                    onChange={(v) => update(i, { v })}
                  />
                );
              }
              const value = l.kind === "point" ? l.P : l.M;
              const unit = l.kind === "point" ? fu : mu;
              const sense = l.kind === "point" ? (value >= 0 ? "↓" : "↑") : value >= 0 ? "↻" : "↺";
              return (
                <div key={`s${i}`} className="grid gap-1">
                  <Slider label={`${name} at x = ${stepText(l.x, ranges.posStep)}${lu ? ` ${lu}` : ""}`} value={l.x} min={0} max={sol.L} step={ranges.posStep} disabled={disabled} onChange={(v) => update(i, { x: v })} />
                  <Slider label={`${name} = ${stepText(value, r.step)}${unit ? ` ${unit}` : ""} ${sense}`} value={value} min={r.min} max={r.max} step={r.step} disabled={disabled} onChange={(v) => update(i, { v })} />
                </div>
              );
            })}
          </div>
        )}

        {hasCouple && (
          <p className="text-xs leading-relaxed text-muted">
            Point moment: M̄ &gt; 0 is a clockwise couple (the sense drawn in Govindjee Fig. 8.10). It makes M(x) jump up by +M̄ at its location (q = M̄ δ′(x − a)); a counter-clockwise couple makes M jump down.
          </p>
        )}
      </div>
    </div>
  );
}
