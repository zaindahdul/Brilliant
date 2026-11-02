"use client";

import { useState } from "react";
import type { AxialBarConfig } from "@/content/types";
import { Math as TeX } from "@/components/ui/RichText";

interface Props {
  config: AxialBarConfig;
  disabled?: boolean;
}

type Fixed = AxialBarConfig["fixed"];
type Kind = "R" | "sigma" | "u";
type Pt = [number, number];

/* ------------------------------------------------------------------ */
/* Number helpers                                                      */
/* ------------------------------------------------------------------ */

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const UNSUP: Record<string, string> = Object.fromEntries(Object.entries(SUP).map(([k, v]) => [v, k]));

function finite(x: unknown, fallback = 0): number {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/** `sig` significant digits, thin-space thousands, ×10ⁿ for very large / very small magnitudes. */
export function fmtNum(x: number, sig = 4): string {
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
    const exp = String(e)
      .split("")
      .map((c) => SUP[c] ?? c)
      .join("");
    return `${String(m).replace("-", "−")}×10${exp}`;
  }
  const r = Number(x.toPrecision(sig));
  if (r === 0) return "0";
  let s = String(Math.abs(r));
  if (Math.abs(r) >= 10000) {
    const [int, dec] = s.split(".");
    s = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (dec ? `.${dec}` : "");
  }
  return (r < 0 ? "−" : "") + s;
}

/** Same number, as KaTeX source. */
function texNum(x: number, sig = 4): string {
  return fmtNum(x, sig)
    .replace(/ /g, "\\,")
    .replace(/−/g, "-")
    .replace(/×10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (_, e: string) => `\\times 10^{${e
      .split("")
      .map((c) => UNSUP[c] ?? c)
      .join("")}}`);
}

/** A "nice" slider step (1, 2 or 5 × 10ⁿ, at least ~50 steps over `span`) that hits `anchor` exactly when possible. */
function niceStep(span: number, anchor: number): number {
  if (!(span > 0)) return 1;
  const target = span / 100;
  const e = Math.floor(Math.log10(target));
  for (let k = e + 1; k >= e - 4; k--) {
    for (const m of [5, 2, 1]) {
      const s = m * 10 ** k;
      if (s > target * 2) continue;
      const q = anchor / s;
      if (Math.abs(q - Math.round(q)) < 1e-6) return s;
    }
  }
  return target;
}

/** Smallest 1, 2 or 5 × 10ⁿ that is ≥ x. */
function niceCeil(x: number): number {
  if (!(x > 0)) return 1;
  const e = Math.floor(Math.log10(x));
  for (const m of [1, 2, 5, 10]) if (m * 10 ** e >= x * (1 - 1e-12)) return m * 10 ** e;
  return 10 ** (e + 1);
}

function subscript(n: number): string {
  return String(n)
    .split("")
    .map((c) => "₀₁₂₃₄₅₆₇₈₉"[Number(c)] ?? c)
    .join("");
}

/* ------------------------------------------------------------------ */
/* Mechanics (pure, exported for tests)                                */
/* ------------------------------------------------------------------ */
/*
 * Sign conventions (Govindjee ch. 2):
 *  - x runs from the left end (x = 0) to the right end (x = L). Point loads P and the
 *    distributed load b act in +x (to the right) when positive.
 *  - R(x) is the internal force on a section cut at x, TENSION POSITIVE (dR/dx + b = 0).
 *    Keep the part LEFT of the cut: its cut face has outward normal +x, so R acts on it in +x:
 *        F_left + sum_{x_i < x} P_i + b x + R(x) = 0    (F_left = force of the left wall ON the bar, + = +x)
 *    =>  R(x) = R1 - G(x),   G(x) = sum_{x_i < x} P_i + b x   (applied force left of the cut)
 *    with R1 = -F_left = R(0+): the textbook's left reaction, drawn pointing in -x (Fig. 2.17).
 *  - fixed "left":  no right reaction  => R1 = sum P + bL, i.e. R(x) = sum_{x_i > x} P_i + b (L - x)
 *    fixed "right": no left reaction   => R1 = 0,          i.e. R(x) = -G(x)
 *    fixed "both":  compatibility u(L) - u(0) = int_0^L R/(AE) dx = 0  =>  R1 = int G/(AE) dx / int 1/(AE) dx
 *    R is linear between breakpoints and AE is constant there, so these integrals are exact (trapezoid rule).
 *  - Checks: fixed-left, end load P  => R = P (tension), u(L) = PL/AE.
 *            fixed-right, free LEFT end pulled away from the wall (P < 0 at x = 0) => R = -P > 0 (tension).
 *            fixed-both, P at x = a    => R1 = P(1 - a/L); R = P(1 - a/L) for x < a and -Pa/L for x > a (Ex. 2.3).
 *            fixed-both, uniform b0    => R = b0 (L/2 - x), u = b0 x (L - x) / (2AE) (Ex. 2.4).
 *            fixed-left, gravity b = gamma A => R = b (L - x), u(L) = b L^2 / (2AE) = gamma L^2 / (2E) (Ex. 2.2).
 *  - u(x) = u(0) + int_0^x R/(AE) dx with u(0) = 0 (left or both fixed) or shifted so that u(L) = 0 (right fixed).
 */

export interface BarSegment {
  length: number;
  E: number;
  A: number;
  label?: string;
}

/** One interval between consecutive breakpoints (segment ends and load points). */
export interface BarPiece {
  x0: number;
  x1: number;
  seg: number;
  A: number;
  AE: number;
  /** R at x0⁺ and x1⁻ (linear in between, slope −b). */
  R0: number;
  R1: number;
  /** u at x0 and x1. */
  u0: number;
  u1: number;
}

export interface BarSolution {
  L: number;
  segs: BarSegment[];
  /** Segment boundaries 0 = s0 < s1 < … < sn = L. */
  bounds: number[];
  /** Breakpoints (segment boundaries and load positions). */
  breaks: number[];
  pieces: BarPiece[];
  loads: { x: number; P: number }[];
  b: number;
  /** R1 = R(0⁺), the textbook's left reaction (= −forceLeft). */
  R1: number;
  /** Force of the left / right wall on the bar, + = +x (0 at a free end). */
  forceLeft: number;
  forceRight: number;
  /** δ = u(L) − u(0) = ∫ R/(AE) dx. */
  elongation: number;
}

function sanitizeSegments(segments: unknown): BarSegment[] {
  const list = Array.isArray(segments) ? (segments as Partial<BarSegment>[]) : [];
  const out: BarSegment[] = [];
  for (const s of list) {
    const length = finite(s?.length);
    if (!(length > 0)) continue;
    const E = finite(s?.E);
    const A = finite(s?.A);
    out.push({ length, E: E > 0 ? E : 1, A: A > 0 ? A : 1, label: typeof s?.label === "string" ? s.label : undefined });
  }
  return out.length ? out : [{ length: 1, E: 1, A: 1 }];
}

export function solveAxialBar(segments: unknown, loads: { x: number; P: number }[], distributed: number, fixed: Fixed): BarSolution {
  const segs = sanitizeSegments(segments);
  const bounds = [0];
  for (const s of segs) bounds.push(bounds[bounds.length - 1] + s.length);
  const L = bounds[bounds.length - 1];
  const eps = L * 1e-9;
  const ld = loads.map((l) => ({ x: clamp(finite(l.x), 0, L), P: finite(l.P) }));
  const b = finite(distributed);

  const cand = [...bounds, ...ld.map((l) => l.x)].sort((p, q) => p - q);
  const breaks: number[] = [];
  for (const x of cand) if (!breaks.length || x - breaks[breaks.length - 1] > eps) breaks.push(x);
  breaks[breaks.length - 1] = L;

  // First pass: G(x) = applied force left of the cut, at both ends of every piece.
  const raw: { x0: number; x1: number; seg: number; A: number; AE: number; G0: number; G1: number }[] = [];
  let sumW = 0;
  let sumGW = 0;
  for (let k = 0; k + 1 < breaks.length; k++) {
    const x0 = breaks[k];
    const x1 = breaks[k + 1];
    const mid = (x0 + x1) / 2;
    let seg = 0;
    while (seg < segs.length - 1 && mid > bounds[seg + 1]) seg++;
    const { E, A } = segs[seg];
    const AE = E * A;
    let G0 = b * x0;
    for (const l of ld) if (l.x <= x0 + eps) G0 += l.P;
    const G1 = G0 + b * (x1 - x0);
    raw.push({ x0, x1, seg, A, AE, G0, G1 });
    sumW += (x1 - x0) / AE;
    sumGW += (((G0 + G1) / 2) * (x1 - x0)) / AE;
  }

  const Ptot = ld.reduce((s, l) => s + l.P, 0) + b * L;
  const R1 = fixed === "left" ? Ptot : fixed === "right" ? 0 : sumW > 0 ? sumGW / sumW : 0;

  // Round-off clean-up: anything below 1e-9 of the load scale is exactly zero.
  const Fscale = ld.reduce((s, l) => s + Math.abs(l.P), 0) + Math.abs(b) * L;
  const zr = (v: number) => (Math.abs(v) <= 1e-9 * Fscale ? 0 : v);

  const pieces: BarPiece[] = [];
  let u = 0;
  for (const p of raw) {
    const R0 = zr(R1 - p.G0);
    const Re = zr(R1 - p.G1);
    const u0 = u;
    u += (((R0 + Re) / 2) * (p.x1 - p.x0)) / p.AE;
    pieces.push({ x0: p.x0, x1: p.x1, seg: p.seg, A: p.A, AE: p.AE, R0, R1: Re, u0, u1: u });
  }
  let elongation = u;
  if (fixed === "right") {
    for (const p of pieces) {
      p.u0 -= elongation;
      p.u1 -= elongation;
    }
  }
  const uScale = pieces.reduce((s, p) => Math.max(s, Math.abs(p.u0), Math.abs(p.u1)), 0);
  const zu = (v: number) => (Math.abs(v) <= 1e-9 * uScale ? 0 : v);
  for (const p of pieces) {
    p.u0 = zu(p.u0);
    p.u1 = zu(p.u1);
  }
  elongation = fixed === "both" ? 0 : zu(elongation);

  const forceLeft = fixed === "right" ? 0 : zr(-R1);
  const forceRight = fixed === "left" ? 0 : zr(-Ptot - forceLeft);
  return { L, segs, bounds, breaks, pieces, loads: ld, b, R1: zr(R1), forceLeft, forceRight, elongation };
}

function valueIn(p: BarPiece, x: number, b: number): { R: number; sigma: number; u: number } {
  const s = clamp(x - p.x0, 0, p.x1 - p.x0);
  const R = p.R0 - b * s;
  return { R, sigma: R / p.A, u: p.u0 + (p.R0 * s - (b * s * s) / 2) / p.AE };
}

/** R and σ just left and right of x (they differ at a load / a change of section), and u(x). */
export function barValuesAt(sol: BarSolution, x: number) {
  const eps = sol.L * 1e-9;
  const ps = sol.pieces;
  let iR = ps.findIndex((p) => x >= p.x0 - eps && x < p.x1 - eps);
  let iL = ps.findIndex((p) => x > p.x0 + eps && x <= p.x1 + eps);
  if (iR < 0) iR = iL >= 0 ? iL : ps.length - 1;
  if (iL < 0) iL = iR;
  const r = valueIn(ps[iR], x, sol.b);
  const l = valueIn(ps[iL], x, sol.b);
  return { RL: l.R, RR: r.R, sL: l.sigma, sR: r.sigma, u: r.u };
}

/** Sampled diagram (x, value) for R, σ or u; jumps appear as a repeated x. */
function diagramPoints(sol: BarSolution, kind: Kind): Pt[] {
  const pts: Pt[] = [];
  for (const p of sol.pieces) {
    if (kind === "R") pts.push([p.x0, p.R0], [p.x1, p.R1]);
    else if (kind === "sigma") pts.push([p.x0, p.R0 / p.A], [p.x1, p.R1 / p.A]);
    else {
      const n = sol.b !== 0 ? 24 : 1;
      for (let i = 0; i <= n; i++) {
        const x = p.x0 + ((p.x1 - p.x0) * i) / n;
        pts.push([x, valueIn(p, x, sol.b).u]);
      }
    }
  }
  return pts;
}

/** Candidate label points for u: every breakpoint and the interior extremum (R = 0) of each piece. */
function uCandidates(sol: BarSolution): { x: number; v: number; pri: number }[] {
  const out: { x: number; v: number; pri: number }[] = [];
  sol.pieces.forEach((p, i) => {
    out.push({ x: p.x0, v: p.u0, pri: i === 0 ? 2 : 1 });
    if (sol.b !== 0) {
      const s = p.R0 / sol.b;
      if (s > 0 && s < p.x1 - p.x0) out.push({ x: p.x0 + s, v: valueIn(p, p.x0 + s, sol.b).u, pri: 3 });
    }
  });
  const last = sol.pieces[sol.pieces.length - 1];
  out.push({ x: last.x1, v: last.u1, pri: 2 });
  let best = 0;
  out.forEach((c, i) => {
    if (Math.abs(c.v) > Math.abs(out[best].v)) best = i;
  });
  out[best] = { ...out[best], pri: 4 };
  return out;
}

/* ------------------------------------------------------------------ */
/* Drawing helpers                                                     */
/* ------------------------------------------------------------------ */

const W = 460;
const BAR_Y = 54;
const BAR_HALF = 15;
const PANEL_H = 106;
const PANEL_GAP = 8;
const SEG_COLORS = ["var(--blue)", "var(--teal)", "var(--purple)", "var(--gold)"];
const HALO = { paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3, strokeLinejoin: "round" } as const;

function PxArrow({ x1, y1, x2, y2, color, width = 2.5, head = 9, halo = false }: { x1: number; y1: number; x2: number; y2: number; color: string; width?: number; head?: number; halo?: boolean }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;
  const ux = dx / len;
  const uy = dy / len;
  const h = Math.min(head, len * 0.75);
  const w = h * 0.5;
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  const tri = `${x2},${y2} ${bx - uy * w},${by + ux * w} ${bx + uy * w},${by - ux * w}`;
  const lx = x2 - ux * h * 0.6;
  const ly = y2 - uy * h * 0.6;
  return (
    <g>
      {halo && (
        <>
          <line x1={x1} y1={y1} x2={lx} y2={ly} stroke="var(--surface)" strokeWidth={width + 3.5} strokeLinecap="round" />
          <polygon points={tri} fill="var(--surface)" stroke="var(--surface)" strokeWidth={3} strokeLinejoin="round" />
        </>
      )}
      <line x1={x1} y1={y1} x2={lx} y2={ly} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={tri} fill={color} />
    </g>
  );
}

function Wall({ x, side }: { x: number; side: "left" | "right" }) {
  const top = BAR_Y - BAR_HALF - 13;
  const bottom = BAR_Y + BAR_HALF + 13;
  const dir = side === "left" ? -1 : 1;
  const hatch: React.ReactNode[] = [];
  for (let y = top; y < bottom - 1; y += 6) {
    const y2 = Math.min(bottom, y + 8);
    hatch.push(<line key={y} x1={x} y1={y} x2={x + dir * (y2 - y)} y2={y2} stroke="var(--muted)" strokeWidth={1.2} />);
  }
  return (
    <g>
      {hatch}
      <line x1={x} y1={top} x2={x} y2={bottom} stroke="var(--text)" strokeWidth={2.2} />
    </g>
  );
}

interface ValueLabel {
  x: number;
  v: number;
  text: string;
  anchor: "start" | "middle" | "end";
}

/** Labels for a piecewise-linear diagram: merge continuous collinear pieces, label constant runs once, sloped runs at both ends. */
function stepLabels(pcs: { x0: number; x1: number; v0: number; v1: number }[], tol: number, pxPerUnit: number): ValueLabel[] {
  const runs: { x0: number; x1: number; v0: number; v1: number }[] = [];
  for (const s of pcs) {
    const last = runs[runs.length - 1];
    if (last && Math.abs(last.v1 - s.v0) <= tol) {
      const slopeL = (last.v1 - last.v0) / (last.x1 - last.x0);
      const slopeS = (s.v1 - s.v0) / (s.x1 - s.x0);
      if (Math.abs(slopeL - slopeS) * (s.x1 - last.x0) <= tol) {
        last.x1 = s.x1;
        last.v1 = s.v1;
        continue;
      }
    }
    runs.push({ ...s });
  }
  const out: ValueLabel[] = [];
  for (const r of runs) {
    const wpx = (r.x1 - r.x0) * pxPerUnit;
    if (Math.abs(r.v1 - r.v0) <= tol) {
      if (Math.abs(r.v0) <= tol || wpx < 16) continue;
      out.push({ x: (r.x0 + r.x1) / 2, v: r.v0, text: fmtNum(r.v0, 3), anchor: "middle" });
    } else if (wpx >= 84) {
      out.push({ x: r.x0, v: r.v0, text: fmtNum(r.v0, 3), anchor: "start" });
      out.push({ x: r.x1, v: r.v1, text: fmtNum(r.v1, 3), anchor: "end" });
    } else {
      const atEnd = Math.abs(r.v1) >= Math.abs(r.v0);
      const v = atEnd ? r.v1 : r.v0;
      out.push({ x: atEnd ? r.x1 : r.x0, v, text: fmtNum(v, 3), anchor: atEnd ? "end" : "start" });
    }
  }
  return out;
}

function curveLabels(cands: { x: number; v: number; pri: number }[], tol: number, pxPerUnit: number): ValueLabel[] {
  const sorted = cands.filter((c) => Math.abs(c.v) > tol).sort((p, q) => q.pri - p.pri);
  const kept: { x: number; v: number; pri: number }[] = [];
  for (const c of sorted) {
    if (kept.some((k) => Math.abs(k.x - c.x) * pxPerUnit < 44)) continue;
    kept.push(c);
  }
  return kept.map((c) => ({ x: c.x, v: c.v, text: fmtNum(c.v, 3), anchor: "middle" as const }));
}

/** Split a polyline at its zero crossings; return the positive and negative parts (clamped to 0). */
function splitBySign(pts: Pt[]): { pos: Pt[]; neg: Pt[] } {
  const out: Pt[] = [];
  pts.forEach((p, i) => {
    if (i > 0) {
      const q = pts[i - 1];
      if ((q[1] > 0 && p[1] < 0) || (q[1] < 0 && p[1] > 0)) {
        const t = q[1] / (q[1] - p[1]);
        out.push([q[0] + (p[0] - q[0]) * t, 0]);
      }
    }
    out.push(p);
  });
  return { pos: out.map(([x, v]) => [x, Math.max(0, v)]), neg: out.map(([x, v]) => [x, Math.min(0, v)]) };
}

interface PanelProps {
  top: number;
  title: string;
  pts: Pt[];
  labels: ValueLabel[];
  signed: boolean;
  stroke: string;
  X: (x: number) => number;
  cutX: number;
  cutV: number;
  dots: boolean;
}

function DiagramPanel({ top, title, pts, labels, signed, stroke, X, cutX, cutV, dots }: PanelProps) {
  const plotTop = top + 31; // the title owns the first row
  const plotBot = top + PANEL_H - 15;
  let vmin = 0;
  let vmax = 0;
  for (const [, v] of pts) {
    vmin = Math.min(vmin, v);
    vmax = Math.max(vmax, v);
  }
  const allZero = !(vmax - vmin > 0);
  if (allZero) {
    vmin = -1;
    vmax = 1;
  }
  const Y = (v: number) => plotBot - ((v - vmin) / (vmax - vmin)) * (plotBot - plotTop);
  const base = Y(0);
  const x0 = X(pts[0][0]);
  const x1 = X(pts[pts.length - 1][0]);
  const poly = (arr: Pt[]) => `${x0},${base} ${arr.map(([x, v]) => `${X(x)},${Y(v)}`).join(" ")} ${x1},${base}`;
  const { pos, neg } = splitBySign(pts);
  const hasPos = pts.some(([, v]) => v > 0);
  const hasNeg = pts.some(([, v]) => v < 0);
  return (
    <g>
      <rect x={4} y={top} width={W - 8} height={PANEL_H} rx={10} fill="var(--surface-2)" opacity={0.45} />
      <text x={12} y={top + 14} fontSize={11.5} fontWeight={700} fill="var(--text)">
        {title}
      </text>
      {hasPos && <polygon points={poly(pos)} fill={signed ? "var(--blue)" : "var(--teal)"} opacity={0.22} />}
      {hasNeg && <polygon points={poly(neg)} fill={signed ? "var(--orange)" : "var(--teal)"} opacity={signed ? 0.26 : 0.22} />}
      <line x1={x0} y1={base} x2={x1} y2={base} stroke="var(--canvas-axis)" strokeWidth={1} />
      <polyline points={pts.map(([x, v]) => `${X(x)},${Y(v)}`).join(" ")} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
      {labels.map((l, i) => {
        const px = X(l.x);
        const est = l.text.length * 6;
        let anchor = l.anchor;
        let dx = anchor === "start" ? 3 : anchor === "end" ? -3 : 0;
        if (anchor === "middle" && px - est / 2 < 6) {
          anchor = "start";
          dx = 2;
        } else if (anchor === "middle" && px + est / 2 > W - 6) {
          anchor = "end";
          dx = -2;
        }
        const y = l.v >= 0 ? Math.max(top + 27, Y(l.v) - 6) : Math.min(top + PANEL_H - 3, Y(l.v) + 14);
        return (
          <g key={i}>
            {dots && <circle cx={px} cy={Y(l.v)} r={2.6} fill={stroke} />}
            <text x={px + dx} y={y} fontSize={10.5} fontWeight={600} textAnchor={anchor} fill="var(--text)" style={HALO}>
              {l.text}
            </text>
          </g>
        );
      })}
      {allZero && (
        <text x={(x0 + x1) / 2} y={base - 6} fontSize={10.5} textAnchor="middle" fill="var(--muted)">
          0 everywhere
        </text>
      )}
      <circle cx={X(cutX)} cy={Y(cutV)} r={4} fill="var(--purple)" stroke="var(--surface)" strokeWidth={1.5} />
    </g>
  );
}

const ACCENT = {
  blue: "accent-[var(--blue)]",
  orange: "accent-[var(--orange)]",
  teal: "accent-[var(--teal)]",
  purple: "accent-[var(--purple)]",
} as const;

function SliderRow({ label, value, min, max, step, disabled, onChange, accent = "blue", aria }: { label: React.ReactNode; value: number; min: number; max: number; step: number; disabled: boolean; onChange: (v: number) => void; accent?: keyof typeof ACCENT; aria: string }) {
  return (
    <label className="flex items-center gap-3 text-xs">
      <span className="w-44 shrink-0 font-mono">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} aria-label={aria} onChange={(e) => onChange(Number(e.target.value))} className={`min-w-0 flex-1 disabled:opacity-50 ${ACCENT[accent]}`} />
    </label>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-lg border border-border bg-surface px-2 py-1 font-mono">{children}</span>;
}

function withUnit(v: string, unit: string) {
  return unit ? `${v} ${unit}` : v;
}

function dirArrow(F: number) {
  return F > 0 ? " →" : F < 0 ? " ←" : "";
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AxialBar({ config, disabled = false }: Props) {
  const fixed: Fixed = config.fixed === "right" || config.fixed === "both" ? config.fixed : "left";
  const loadsCfg = Array.isArray(config.loads) ? config.loads : [];
  const units = config.units ?? {};
  const uLen = units.length ?? "";
  const uF = units.force ?? "";
  const uS = units.stress ?? "";
  const uD = units.displacement ?? units.length ?? "";
  const uB = uF && uLen ? `${uF}/${uLen}` : uF;
  const b0 = finite(config.distributed);

  const [Ps, setPs] = useState<number[]>(() => loadsCfg.map((l) => finite(l.P)));
  const [b, setB] = useState<number>(b0);
  const [cut, setCut] = useState<number>(() => {
    const s0 = solveAxialBar(config.segments, loadsCfg.map((l) => ({ x: finite(l.x), P: finite(l.P) })), b0, fixed);
    return (s0.pieces[0].x0 + s0.pieces[0].x1) / 2;
  });

  const loads = loadsCfg.map((l, i) => ({ x: finite(l.x), P: Ps[i] ?? finite(l.P) }));
  const sol = solveAxialBar(config.segments, loads, b, fixed);
  const { L } = sol;
  const cutX = clamp(cut, 0, L);
  const at = barValuesAt(sol, cutX);
  const eps = L * 1e-9;

  // ---- layout ----
  const padL = fixed === "right" ? 66 : 30;
  const padR = fixed === "left" ? 66 : 30;
  const pxPerUnit = (W - padL - padR) / L;
  const X = (x: number) => padL + x * pxPerUnit;
  const showDistRow = config.distributed !== undefined && (b0 !== 0 || !!config.sliders);
  const distCount = Math.max(2, Math.floor((W - padL - padR) / 24));
  const segLabelY = BAR_Y + BAR_HALF + (showDistRow ? 40 : 16);
  const barAreaH = segLabelY + 22;
  const showList: string[] = Array.isArray(config.show) && config.show.length ? config.show : ["R"];
  const kinds = (["R", "sigma", "u"] as const).filter((k) => showList.includes(k));
  const panelTop = (i: number) => barAreaH + i * (PANEL_H + PANEL_GAP);
  const axisY = kinds.length ? panelTop(kinds.length - 1) + PANEL_H + 14 : barAreaH + 4;
  const H = axisY + 8;

  const Amax = Math.max(...sol.segs.map((s) => s.A));
  const halfH = (A: number) => Math.max(4, BAR_HALF * Math.sqrt(A / Amax));
  const Es: number[] = [];
  for (const s of sol.segs) if (!Es.includes(s.E)) Es.push(s.E);
  const Pref = Math.max(0, ...loadsCfg.map((l) => Math.abs(finite(l.P))));

  // ---- point loads: arrows + labels (staggered into rows when they collide) ----
  const loadNames = loadsCfg.map((l, i) => l.label ?? (loadsCfg.length === 1 ? "P" : `P${subscript(i + 1)}`));
  const arrows = loads.map((l, i) => {
    const x = clamp(l.x, 0, L);
    const px = X(x);
    const len = l.P === 0 ? 0 : Pref > 0 ? clamp(16 + 30 * (Math.abs(l.P) / Pref), 16, 58) : 40;
    const dir = Math.sign(l.P);
    // A push on a free end is drawn outside the bar with its head on the end face; everything else tail-at-the-point.
    const freeLeftPush = fixed === "right" && x <= eps && dir > 0;
    const freeRightPush = fixed === "left" && x >= L - eps && dir < 0;
    const [ax1, ax2] = freeLeftPush ? [px - len, px] : freeRightPush ? [px + len, px] : [px, clamp(px + dir * len, 8, W - 8)];
    const interior = x > eps && x < L - eps;
    const segIdx = Math.max(0, sol.bounds.findIndex((s, k) => k > 0 && x <= s + eps) - 1);
    const text = `${loadNames[i]} = ${withUnit(fmtNum(Math.abs(l.P), 3), uF)}`;
    return { i, px, ax1, ax2, interior, hh: halfH((sol.segs[segIdx] ?? sol.segs[0]).A), text, mid: (ax1 + ax2) / 2 };
  });
  const placed: { x0: number; x1: number; row: number }[] = [];
  const labelPos = arrows.map((a) => {
    const w = a.text.length * 6.1;
    const cx = clamp(a.mid, 6 + w / 2, W - 6 - w / 2);
    let row = 0;
    while (row < 2 && placed.some((p) => p.row === row && !(cx + w / 2 + 4 < p.x0 || cx - w / 2 - 4 > p.x1))) row++;
    placed.push({ x0: cx - w / 2, x1: cx + w / 2, row });
    return { cx, y: BAR_Y - BAR_HALF - 9 - row * 13 };
  });

  // ---- diagrams ----
  const panels = kinds.map((kind, idx) => {
    const pts = diagramPoints(sol, kind);
    const tol = 1e-9 * pts.reduce((m, [, v]) => Math.max(m, Math.abs(v)), 0);
    const labels =
      kind === "u"
        ? curveLabels(uCandidates(sol), tol, pxPerUnit)
        : stepLabels(
            sol.pieces.map((p) => (kind === "R" ? { x0: p.x0, x1: p.x1, v0: p.R0, v1: p.R1 } : { x0: p.x0, x1: p.x1, v0: p.R0 / p.A, v1: p.R1 / p.A })),
            tol,
            pxPerUnit,
          );
    const unit = kind === "R" ? uF : kind === "sigma" ? uS : uD;
    const name = kind === "R" ? "R(x)" : kind === "sigma" ? "σ(x) = R/A" : "u(x)";
    const cutV = kind === "R" ? at.RR : kind === "sigma" ? at.sR : at.u;
    return { kind, idx, pts, labels, title: unit ? `${name}  [${unit}]` : name, cutV };
  });

  // ---- readouts ----
  let maxR = 0;
  let maxS = 0;
  for (const p of sol.pieces) {
    maxR = Math.max(maxR, Math.abs(p.R0), Math.abs(p.R1));
    maxS = Math.max(maxS, Math.abs(p.R0 / p.A), Math.abs(p.R1 / p.A));
  }
  const uc = uCandidates(sol);
  const uMax = uc.reduce((best, c) => (Math.abs(c.v) > Math.abs(best.v) ? c : best), uc[0]);
  const jumpTol = 1e-9 * (maxR || 1);
  const jump = Math.abs(at.RL - at.RR) > jumpTol;
  const sJump = Math.abs(at.sL - at.sR) > 1e-9 * (maxS || 1);
  const state = (R: number) => (R > 0 ? "tension" : R < 0 ? "compression" : "no force");

  const ticks: number[] = [0, L];
  for (const x of sol.breaks) if (x > eps && x < L - eps && ticks.every((t) => Math.abs(X(t) - X(x)) >= 34)) ticks.push(x);

  const loadSliders = loadsCfg.map((l) => {
    const P0 = finite(l.P);
    const span = P0 === 0 ? 100 : 2 * Math.abs(P0);
    return { min: -span, max: span, step: niceStep(2 * span, P0) };
  });
  const bSpan = b0 !== 0 ? 2 * Math.abs(b0) : Pref > 0 ? niceCeil((2 * Pref) / L) : 10;
  const bStep = niceStep(2 * bSpan, b0);
  const cutStep = niceStep(L, 0);

  const ariaParts = [`Axial bar fixed at ${fixed === "both" ? "both ends" : `the ${fixed} end`}`];
  if (loads.length) ariaParts.push(`${loads.length} point load${loads.length > 1 ? "s" : ""}`);
  if (b !== 0) ariaParts.push("a distributed load");
  if (kinds.length) ariaParts.push(`diagrams of ${kinds.map((k) => (k === "sigma" ? "stress" : k === "u" ? "displacement" : "internal force R")).join(", ")}`);

  return (
    <div className="grid gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[480px] select-none rounded-2xl border border-border bg-surface" role="img" aria-label={ariaParts.join(", ")}>
        {/* faint guides through the diagrams at every breakpoint */}
        {kinds.length > 0 &&
          sol.breaks
            .filter((x) => x > eps && x < L - eps)
            .map((x) => <line key={`g${x}`} x1={X(x)} y1={panelTop(0)} x2={X(x)} y2={axisY - 10} stroke="var(--canvas-axis)" strokeOpacity={0.45} strokeWidth={1} strokeDasharray="3 3" />)}

        {/* walls */}
        {fixed !== "right" && <Wall x={X(0)} side="left" />}
        {fixed !== "left" && <Wall x={X(L)} side="right" />}

        {/* segments, width ∝ √A, colour by material (E) */}
        {sol.segs.map((s, k) => {
          const xa = X(sol.bounds[k]);
          const xb = X(sol.bounds[k + 1]);
          const hh = halfH(s.A);
          const col = SEG_COLORS[Es.indexOf(s.E) % SEG_COLORS.length];
          const mid = (xa + xb) / 2;
          const narrow = xb - xa < 96;
          return (
            <g key={`s${k}`}>
              <rect x={xa} y={BAR_Y - hh} width={xb - xa} height={2 * hh} fill={col} fillOpacity={0.2} stroke={col} strokeWidth={1.5} />
              {s.label && hh >= 8 && s.label.length * 6 < xb - xa - 8 && (
                <text x={mid} y={BAR_Y + 3.5} fontSize={10} fontWeight={600} textAnchor="middle" fill="var(--text)">
                  {s.label}
                </text>
              )}
              <text x={mid} y={segLabelY} fontSize={10} textAnchor="middle" fill="var(--muted)">
                {narrow ? `A ${fmtNum(s.A, 3)}` : `A = ${withUnit(fmtNum(s.A, 4), uLen ? `${uLen}²` : "")}`}
              </text>
              <text x={mid} y={segLabelY + 12} fontSize={10} textAnchor="middle" fill="var(--muted)">
                {narrow ? `E ${fmtNum(s.E, 3)}` : `E = ${withUnit(fmtNum(s.E, 4), uS)}`}
              </text>
            </g>
          );
        })}

        {/* distributed load */}
        {showDistRow && b !== 0 && (
          <g>
            {Array.from({ length: distCount }, (_, k) => {
              const cx = X(0) + ((k + 0.5) * (X(L) - X(0))) / distCount;
              const d = Math.sign(b) * 6;
              const y = BAR_Y + BAR_HALF + 9;
              return <PxArrow key={k} x1={cx - d} y1={y} x2={cx + d} y2={y} color="var(--teal)" width={1.6} head={5} />;
            })}
            <text x={(X(0) + X(L)) / 2} y={BAR_Y + BAR_HALF + 25} fontSize={10.5} fontWeight={600} textAnchor="middle" fill="var(--teal)">
              {`b = ${withUnit(fmtNum(Math.abs(b), 3), uB)} ${b > 0 ? "→" : "←"}`}
            </text>
          </g>
        )}

        {/* point loads */}
        {arrows.map((a) => (
          <g key={`p${a.i}`}>
            {a.interior && <line x1={a.px} y1={BAR_Y - a.hh - 4} x2={a.px} y2={BAR_Y + a.hh + 4} stroke="var(--orange)" strokeWidth={2.2} />}
            {a.ax1 !== a.ax2 && <PxArrow x1={a.ax1} y1={BAR_Y} x2={a.ax2} y2={BAR_Y} color="var(--orange)" width={3} head={10} halo />}
            <text x={labelPos[a.i].cx} y={labelPos[a.i].y} fontSize={11} fontWeight={600} textAnchor="middle" fill="var(--orange)" style={HALO}>
              {a.text}
            </text>
          </g>
        ))}

        {/* section cut */}
        <line x1={X(cutX)} y1={BAR_Y - BAR_HALF - 5} x2={X(cutX)} y2={BAR_Y + BAR_HALF + 5} stroke="var(--purple)" strokeWidth={1.5} strokeDasharray="5 4" />
        {kinds.length > 0 && <line x1={X(cutX)} y1={panelTop(0)} x2={X(cutX)} y2={axisY - 10} stroke="var(--purple)" strokeWidth={1.5} strokeDasharray="5 4" />}

        {/* diagrams */}
        {panels.map((p) => (
          <DiagramPanel key={p.kind} top={panelTop(p.idx)} title={p.title} pts={p.pts} labels={p.labels} signed={p.kind !== "u"} stroke={p.kind === "u" ? "var(--teal)" : "var(--text)"} X={X} cutX={cutX} cutV={p.cutV} dots={p.kind === "u"} />
        ))}

        {/* x axis */}
        {ticks.map((x) => (
          <text key={`t${x}`} x={X(x)} y={axisY} fontSize={10} textAnchor="middle" fill="var(--muted)">
            {x === L && uLen ? `x = ${fmtNum(x, 4)} ${uLen}` : fmtNum(x, 4)}
          </text>
        ))}
      </svg>

      <div className="mx-auto grid w-full max-w-[480px] gap-2 rounded-2xl border border-border bg-surface-2/60 p-3 text-sm">
        {config.sliders && (loadsCfg.length > 0 || config.distributed !== undefined) && (
          <div className="grid gap-1.5">
            {loadsCfg.map((_, i) => (
              <SliderRow
                key={`ls${i}`}
                label={`${loadNames[i]} = ${withUnit(fmtNum(Ps[i] ?? 0, 4), uF)}${dirArrow(Ps[i] ?? 0)}`}
                value={Ps[i] ?? 0}
                min={loadSliders[i].min}
                max={loadSliders[i].max}
                step={loadSliders[i].step}
                disabled={disabled}
                accent="orange"
                aria={`point load ${loadNames[i]}`}
                onChange={(v) => setPs((cur) => cur.map((p, j) => (j === i ? v : p)))}
              />
            ))}
            {config.distributed !== undefined && <SliderRow label={`b = ${withUnit(fmtNum(b, 4), uB)}${dirArrow(b)}`} value={b} min={-bSpan} max={bSpan} step={bStep} disabled={disabled} accent="teal" aria="distributed load b" onChange={setB} />}
          </div>
        )}
        <SliderRow label={`section cut at x = ${withUnit(fmtNum(cutX, 4), uLen)}`} value={cutX} min={0} max={L} step={cutStep} disabled={disabled} accent="purple" aria="position of the section cut" onChange={setCut} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[13px]">
          <span>
            {jump ? `R: ${fmtNum(at.RL, 4)} → ${withUnit(fmtNum(at.RR, 4), uF)}` : `R = ${withUnit(fmtNum(at.RR, 4), uF)}`} <span className="text-muted">({jump ? "jumps at the load" : state(at.RR)})</span>
          </span>
          <span className="text-purple">{sJump ? `σ: ${fmtNum(at.sL, 4)} → ${withUnit(fmtNum(at.sR, 4), uS)}` : `σ = ${withUnit(fmtNum(at.sR, 4), uS)}`}</span>
          <span className="text-teal">u = {withUnit(fmtNum(at.u, 4), uD)}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <Chip>max |R| = {withUnit(fmtNum(maxR, 4), uF)}</Chip>
          <Chip>max |σ| = {withUnit(fmtNum(maxS, 4), uS)}</Chip>
          {fixed === "left" && <Chip>free end u(L) = {withUnit(fmtNum(sol.pieces[sol.pieces.length - 1].u1, 4), uD)}</Chip>}
          {fixed === "right" && <Chip>free end u(0) = {withUnit(fmtNum(sol.pieces[0].u0, 4), uD)}</Chip>}
          {fixed === "both" && (
            <Chip>
              max |u| = {withUnit(fmtNum(Math.abs(uMax.v), 4), uD)} at x = {withUnit(fmtNum(uMax.x, 4), uLen)}
            </Chip>
          )}
          <Chip>
            wall force on bar: {fixed !== "right" && `left ${withUnit(fmtNum(Math.abs(sol.forceLeft), 4), uF)}${dirArrow(sol.forceLeft)}`}
            {fixed === "both" && " · "}
            {fixed !== "left" && `right ${withUnit(fmtNum(Math.abs(sol.forceRight), 4), uF)}${dirArrow(sol.forceRight)}`}
          </Chip>
        </div>
        <div className="overflow-x-auto">
          {fixed === "both" ? (
            <>
              <TeX tex={`u(L)-u(0)=\\int_0^L\\frac{R(x)}{A(x)E(x)}\\,\\mathrm{d}x=0\\;\\Rightarrow\\;R_1=R(0^+)=${texNum(sol.R1)}`} />
              {uF && <span className="text-muted"> {uF}</span>}
            </>
          ) : (
            <>
              <TeX tex={`\\delta=u(L)-u(0)=\\int_0^L\\frac{R(x)}{A(x)E(x)}\\,\\mathrm{d}x=${texNum(sol.elongation)}`} />
              {uD && <span className="text-muted"> {uD}</span>}
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue/40" /> R &gt; 0 tension
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-orange/50" /> R &lt; 0 compression
          </span>
          <span>u &gt; 0: moves in +x (right)</span>
        </div>
      </div>
    </div>
  );
}
