"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { BeamSectionConfig, BeamSectionShape } from "@/content/types";
import { Math as TeX } from "@/components/ui/RichText";

interface Props {
  config: BeamSectionConfig;
  disabled?: boolean;
}

/*
 * Bending stress on a beam cross-section (Govindjee §8.3).
 * y is measured UP from the neutral axis: ε_xx = −κy, σ = −M y / I, M = EIκ; positive M is sagging
 * (top fibres in compression, bottom in tension). For a homogeneous section the neutral axis passes
 * through the centroid:
 *   ȳ = Σ Aᵢ ȳᵢ / Σ Aᵢ (measured from the bottom),  I = Σ (I_c,i + Aᵢ dᵢ²) with dᵢ = ȳᵢ − ȳ,
 *   S = I / y_max,  |σ|max = |M| / S.
 * Shapes (symmetric about the vertical axis; x from that axis, y from the bottom):
 *   rect  b × h;  tee  flange bf × tf on top of a web tw × hw (depth hw + tf);  ibeam  flanges bf × tf
 *   above and below a web tw × hw (depth hw + 2tf);  box  b × h outside with wall t (outer minus inner).
 *
 * Units: when `units.moment` and `units.length` are recognised (N·mm, N·m, kN·m, lbf·in, kip·ft …;
 * mm, cm, m, in, ft) σ is converted into `units.stress` (default MPa, or psi/ksi for inches/feet), so
 * M = 4 kN·m on a section in mm reports MPa. Otherwise the numbers are taken as consistent.
 */

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };

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

/** Plain-text number for SVG labels: 54.55, 73 333, 6.6×10⁶, −18.18. */
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

/** Strip characters that would break KaTeX \text{…}; turn ^2 into ². */
function cleanUnit(u: string): string {
  return u.replace(/\^\{?(\d)\}?/g, (_m, d: string) => SUP[d] ?? d).replace(/[\\{}$&#%_^~]/g, "");
}

/** An author-supplied unit label as KaTeX, optionally raised to a power. */
function texUnit(u: string, pow?: number): string {
  if (!u) return "";
  return `\\,\\text{${cleanUnit(u)}}${pow ? `^{${pow}}` : ""}`;
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

function sizeRange(v0: number) {
  const step = niceNum(v0 / 50);
  const min = Math.max(step, Number((Math.round((0.5 * v0) / step) * step).toPrecision(12)));
  const max = Math.max(v0, Number((Math.round((1.5 * v0) / step) * step).toPrecision(12)));
  return { min, max, step };
}

/* ------------------------------------------------------------------ */
/* Units                                                               */
/* ------------------------------------------------------------------ */

const LENGTH = new Map<string, number>([
  ["mm", 1e-3],
  ["cm", 1e-2],
  ["m", 1],
  ["in", 0.0254],
  ["inch", 0.0254],
  ["ft", 0.3048],
]);
const FORCE = new Map<string, number>([
  ["n", 1],
  ["kn", 1e3],
  ["mn", 1e6],
  ["lb", 4.4482216152605],
  ["lbf", 4.4482216152605],
  ["lbs", 4.4482216152605],
  ["kip", 4448.2216152605],
  ["kips", 4448.2216152605],
]);
const STRESS = new Map<string, number>([
  ["pa", 1],
  ["kpa", 1e3],
  ["mpa", 1e6],
  ["gpa", 1e9],
  ["n/mm2", 1e6],
  ["n/m2", 1],
  ["kn/m2", 1e3],
  ["kn/mm2", 1e9],
  ["psi", 6894.757293168],
  ["ksi", 6894757.293168],
  ["lb/in2", 6894.757293168],
  ["lbf/in2", 6894.757293168],
  ["kip/in2", 6894757.293168],
]);

function normUnit(u: string): string {
  return u.trim().toLowerCase().replace(/\s+/g, "").replace(/²/g, "2").replace(/\^\{?2\}?/g, "2");
}

/** N·m per unit of a moment unit such as "N·mm", "kN·m", "N.m", "Nm", "lbf·in", "in-lb", "kip·ft". */
function momentSI(u: string): number | null {
  const parts = u.trim().toLowerCase().split(/[\s·⋅•*×.\-]+/).filter(Boolean);
  if (parts.length === 2) {
    const [a, b] = parts;
    const fa = FORCE.get(a);
    const lb = LENGTH.get(b);
    if (fa !== undefined && lb !== undefined) return fa * lb;
    const la = LENGTH.get(a);
    const fb = FORCE.get(b);
    if (la !== undefined && fb !== undefined) return la * fb;
    return null;
  }
  if (parts.length === 1) {
    const prefixes = [...FORCE.keys()].sort((p, q) => q.length - p.length);
    for (const f of prefixes) {
      const l = parts[0].startsWith(f) ? LENGTH.get(parts[0].slice(f.length)) : undefined;
      if (l !== undefined) return (FORCE.get(f) ?? 1) * l;
    }
  }
  return null;
}

interface UnitSys {
  /** Multiply M·y/I (raw config numbers) by f to get σ in `stress`. */
  f: number;
  moment: string;
  length: string;
  stress: string;
}

function unitSystem(u: BeamSectionConfig["units"]): UnitSys {
  const moment = u?.moment?.trim() ?? "";
  const length = u?.length?.trim() ?? "";
  const given = u?.stress?.trim() ?? "";
  const kM = moment ? momentSI(moment) : null;
  const kL = length ? (LENGTH.get(normUnit(length)) ?? null) : null;
  if (kM === null || kL === null) return { f: 1, moment, length, stress: given };
  let stress = given;
  let kS = stress ? (STRESS.get(normUnit(stress)) ?? null) : null;
  if (kS === null) {
    if (stress) return { f: 1, moment, length, stress }; // unknown stress label: trust the numbers
    const imperial = kL === 0.0254 || kL === 0.3048;
    stress = imperial ? (/kip/i.test(moment) ? "ksi" : "psi") : "MPa";
    kS = STRESS.get(stress.toLowerCase()) ?? 1;
  }
  return { f: kM / (kL ** 3 * kS), moment, length, stress };
}

/* ------------------------------------------------------------------ */
/* Section geometry and properties                                     */
/* ------------------------------------------------------------------ */

type Pt = [number, number];

interface Piece {
  name: string;
  /** left edge (x from the symmetry axis), bottom edge (y from the section bottom), size; sign −1 = hole */
  x: number;
  y: number;
  w: number;
  h: number;
  sign: 1 | -1;
}

interface Geometry {
  pieces: Piece[];
  height: number;
  width: number;
  /** half-width of the bottom fibre (for the ȳ dimension line) */
  bottomHalf: number;
  /** outline loops (even-odd) */
  loops: Pt[][];
  /** internal boundaries between the rectangles used for the parallel-axis sum */
  seams: [Pt, Pt][];
}

const dim = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
const rectLoop = (x: number, y: number, w: number, h: number): Pt[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

export function sectionGeometry(sec: BeamSectionShape): Geometry {
  switch (sec.kind) {
    case "tee": {
      const bf = dim(sec.bf);
      const tf = dim(sec.tf);
      const hw = dim(sec.hw);
      const tw = dim(sec.tw);
      const H = hw + tf;
      const m = Math.min(bf, tw) / 2;
      return {
        pieces: [
          { name: "web", x: -tw / 2, y: 0, w: tw, h: hw, sign: 1 },
          { name: "flange", x: -bf / 2, y: hw, w: bf, h: tf, sign: 1 },
        ],
        height: H,
        width: Math.max(bf, tw),
        bottomHalf: tw / 2,
        loops: [
          [
            [-bf / 2, H],
            [bf / 2, H],
            [bf / 2, hw],
            [tw / 2, hw],
            [tw / 2, 0],
            [-tw / 2, 0],
            [-tw / 2, hw],
            [-bf / 2, hw],
          ],
        ],
        seams: hw > 0 && tf > 0 ? [[[-m, hw], [m, hw]]] : [],
      };
    }
    case "ibeam": {
      const bf = dim(sec.bf);
      const tf = dim(sec.tf);
      const hw = dim(sec.hw);
      const tw = dim(sec.tw);
      const H = hw + 2 * tf;
      const m = Math.min(bf, tw) / 2;
      return {
        pieces: [
          { name: "bottom flange", x: -bf / 2, y: 0, w: bf, h: tf, sign: 1 },
          { name: "web", x: -tw / 2, y: tf, w: tw, h: hw, sign: 1 },
          { name: "top flange", x: -bf / 2, y: tf + hw, w: bf, h: tf, sign: 1 },
        ],
        height: H,
        width: Math.max(bf, tw),
        bottomHalf: bf / 2,
        loops: [
          [
            [-bf / 2, 0],
            [bf / 2, 0],
            [bf / 2, tf],
            [tw / 2, tf],
            [tw / 2, tf + hw],
            [bf / 2, tf + hw],
            [bf / 2, H],
            [-bf / 2, H],
            [-bf / 2, tf + hw],
            [-tw / 2, tf + hw],
            [-tw / 2, tf],
            [-bf / 2, tf],
          ],
        ],
        seams:
          hw > 0 && tf > 0
            ? [
                [
                  [-m, tf],
                  [m, tf],
                ],
                [
                  [-m, tf + hw],
                  [m, tf + hw],
                ],
              ]
            : [],
      };
    }
    case "box": {
      const b = dim(sec.b);
      const h = dim(sec.h);
      const t = dim(sec.t);
      const bi = Math.max(0, b - 2 * t);
      const hi = Math.max(0, h - 2 * t);
      const hole = bi > 0 && hi > 0 && t > 0;
      return {
        pieces: [{ name: "outer", x: -b / 2, y: 0, w: b, h, sign: 1 }, ...(hole ? [{ name: "hole", x: -bi / 2, y: t, w: bi, h: hi, sign: -1 as const }] : [])],
        height: h,
        width: b,
        bottomHalf: b / 2,
        loops: [rectLoop(-b / 2, 0, b, h), ...(hole ? [rectLoop(-bi / 2, t, bi, hi)] : [])],
        seams: [],
      };
    }
    default: {
      const b = dim(sec.b);
      const h = dim(sec.h);
      return { pieces: [{ name: "rectangle", x: -b / 2, y: 0, w: b, h, sign: 1 }], height: h, width: b, bottomHalf: b / 2, loops: [rectLoop(-b / 2, 0, b, h)], seams: [] };
    }
  }
}

/** Centroid (neutral axis), I about it (parallel-axis theorem over the rectangles), fibre distances, S. */
export function sectionProperties(sec: BeamSectionShape) {
  const g = sectionGeometry(sec);
  let A = 0;
  let Ay = 0;
  for (const p of g.pieces) {
    const a = p.sign * p.w * p.h;
    A += a;
    Ay += a * (p.y + p.h / 2);
  }
  const ybar = A > 0 ? Ay / A : g.height / 2;
  const rows = g.pieces.map((p) => {
    const a = p.sign * p.w * p.h;
    const yc = p.y + p.h / 2;
    const d = yc - ybar;
    return { name: p.name, A: a, yc, Ic: (p.sign * p.w * p.h ** 3) / 12, d, Ad2: a * d * d };
  });
  const I = A > 0 ? Math.max(0, rows.reduce((s, r) => s + r.Ic + r.Ad2, 0)) : 0;
  const yTop = g.height - ybar; // distance from the NA up to the top fibre
  const yBot = ybar; // distance from the NA down to the bottom fibre
  const ymax = Math.max(yTop, yBot);
  return { g, A, ybar, I, yTop, yBot, ymax, S: ymax > 0 ? I / ymax : 0, rows };
}

function initialState(c: BeamSectionConfig) {
  const M = Number.isFinite(c.M) ? c.M : 0;
  const sec = c.section;
  const rect = sec.kind === "rect";
  const b = rect ? dim(sec.b) || 1 : 0;
  const h = rect ? dim(sec.h) || 1 : 0;
  const sliders = !!c.sliders;
  const props0 = sectionProperties(rect ? { kind: "rect", b, h } : sec);
  const bR = sizeRange(b || 1);
  const hR = sizeRange(h || 1);
  return {
    M,
    MR: signedRange(M, 1),
    b,
    h,
    bR,
    hR,
    sliders,
    props0,
    // drawing scale is fixed (largest slider size for rect) so the b/h sliders visibly resize the shape
    scaleW: rect && sliders ? bR.max : props0.g.width,
    scaleH: rect && sliders ? hR.max : props0.g.height,
  };
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const W = 460;
const H = 262;
const SCX = 118;
const SCY = 142;
const SEC_W = 168;
const SEC_H = 176;
const PX0 = 352;
const PW = 76;
const BARS = 12;

const halo = { paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3, strokeLinejoin: "round" } as const;

function Slider({ label, value, min, max, step, disabled, onChange }: { label: ReactNode; value: number; min: number; max: number; step: number; disabled: boolean; onChange: (v: number) => void }) {
  return (
    <label className={`flex items-center gap-3 text-xs ${disabled ? "opacity-60" : ""}`}>
      <span className="w-40 shrink-0 font-mono">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[var(--blue)] disabled:cursor-not-allowed" />
    </label>
  );
}

function describe(sec: BeamSectionShape, lu: string): string {
  const u = lu ? ` ${lu}` : "";
  const n = (v: number) => numText(v, 4);
  switch (sec.kind) {
    case "tee":
      return `flange ${n(sec.bf)}×${n(sec.tf)} on web ${n(sec.tw)}×${n(sec.hw)}${u}`;
    case "ibeam":
      return `flanges ${n(sec.bf)}×${n(sec.tf)}, web ${n(sec.tw)}×${n(sec.hw)}${u}`;
    case "box":
      return `${n(sec.b)}×${n(sec.h)}, wall t = ${n(sec.t)}${u}`;
    default:
      return `b × h = ${n(sec.b)} × ${n(sec.h)}${u}`;
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function BeamSection({ config, disabled = false }: Props) {
  const init = useMemo(() => initialState(config), [config]);
  const units = useMemo(() => unitSystem(config.units), [config.units]);
  const [M, setM] = useState(init.M);
  const [b, setB] = useState(init.b);
  const [h, setH] = useState(init.h);

  const section: BeamSectionShape = config.section.kind === "rect" ? { kind: "rect", b, h } : config.section;
  const P = sectionProperties(section);
  const f = units.f;
  const sigma = (y: number) => (P.I > 0 ? ((-M * y) / P.I) * f : 0); // σ = −M y / I, y from the NA
  const sTop = sigma(P.yTop);
  const sBot = sigma(-P.yBot);
  const sMaxAbs = Math.max(Math.abs(sTop), Math.abs(sBot));
  const s0 = init.props0.I > 0 ? ((Math.abs(init.M) * init.props0.ymax) / init.props0.I) * f : 0;
  const sRef = Math.max(sMaxAbs, s0) || 1;
  const lu = units.length;
  const su = units.stress;
  const col = (v: number) => (v >= 0 ? "var(--blue)" : "var(--orange)");
  const tag = (v: number) => (v < 0 ? "compression" : v > 0 ? "tension" : "");

  /* --- section to scale --- */
  const sc = init.scaleW > 0 && init.scaleH > 0 ? Math.min(SEC_W / init.scaleW, SEC_H / init.scaleH) : 1;
  const hPx = P.g.height * sc;
  const py = (yb: number) => SCY + hPx / 2 - yb * sc;
  const pxs = (x: number) => SCX + x * sc;
  const outline = P.g.loops.map((loop) => `M ${loop.map(([x, y]) => `${pxs(x).toFixed(2)} ${py(y).toFixed(2)}`).join(" L ")} Z`).join(" ");
  const leftPx = pxs(-P.g.width / 2);
  const yNA = py(P.ybar);
  const yTopPx = py(P.g.height);
  const yBotPx = py(0);
  const dimX = leftPx - 16;

  /* --- stress profile --- */
  const k = PW / sRef;
  const xTop = PX0 + sTop * k;
  const xBot = PX0 + sBot * k;
  const bars: ReactNode[] = [];
  for (let i = 0; i <= BARS; i++) {
    const yb = (P.g.height * i) / BARS;
    const v = sigma(yb - P.ybar);
    const len = v * k;
    if (Math.abs(len) < 1.5) continue;
    bars.push(<line key={i} x1={PX0} y1={py(yb)} x2={PX0 + len} y2={py(yb)} stroke={col(v)} strokeWidth={1.5} strokeOpacity={0.75} />);
  }

  const kind = section.kind;
  const ybarTex = kind === "tee" ? "\\bar y = \\frac{\\sum A_i\\,\\bar y_i}{\\sum A_i}" : "\\bar y = \\frac{h}{2}";
  const iTex = kind === "rect" ? "I = \\frac{b h^3}{12}" : kind === "box" ? "I = \\frac{b h^3 - b_i h_i^3}{12}" : "I = \\sum\\left(I_{c,i} + A_i d_i^2\\right)";
  const sumIc = P.rows.reduce((acc, r) => acc + r.Ic, 0);
  const sumAd2 = P.rows.reduce((acc, r) => acc + r.Ad2, 0);

  return (
    <div className="grid gap-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto w-full max-w-[480px] select-none rounded-2xl border border-border bg-surface"
        role="img"
        aria-label={`Beam cross-section with the neutral axis ${numText(P.ybar)} ${lu} above the bottom, I = ${numText(P.I)}, and the linear bending stress sigma = -M y / I: top ${numText(sTop)} ${su}, bottom ${numText(sBot)} ${su}`}
      >
        {/* cross-section */}
        <path d={outline} fill="var(--teal)" fillOpacity={0.16} fillRule="evenodd" stroke="var(--teal)" strokeWidth={1.75} strokeLinejoin="round" />
        {P.g.seams.map(([a, c], i) => (
          <line key={i} x1={pxs(a[0])} y1={py(a[1])} x2={pxs(c[0])} y2={py(c[1])} stroke="var(--teal)" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
        ))}
        <text x={SCX} y={yBotPx + 16} fontSize={10} textAnchor="middle" fill="var(--muted)">
          {describe(section, lu)}
        </text>

        {/* ȳ dimension from the bottom fibre to the neutral axis */}
        {P.ybar > 0 && (
          <g stroke="var(--muted)" strokeWidth={1}>
            <line x1={dimX - 4} y1={yBotPx} x2={pxs(-P.g.bottomHalf)} y2={yBotPx} strokeDasharray="2 3" />
            <line x1={dimX} y1={yBotPx} x2={dimX} y2={yNA} />
            <line x1={dimX - 4} y1={yBotPx} x2={dimX + 4} y2={yBotPx} />
            <line x1={dimX - 4} y1={yNA} x2={dimX + 4} y2={yNA} />
          </g>
        )}
        {P.ybar > 0 && (
          <text x={dimX - 5} y={(yBotPx + yNA) / 2 + 4} fontSize={12} fontStyle="italic" textAnchor="end" fill="var(--text)" style={halo}>
            ȳ
          </text>
        )}

        {/* neutral axis through the centroid, continued across the stress profile */}
        <line x1={leftPx - 24} y1={yNA} x2={PX0 + PW + 14} y2={yNA} stroke="var(--purple)" strokeWidth={1.5} strokeDasharray="6 4" />
        <circle cx={SCX} cy={yNA} r={4.5} fill="var(--surface)" stroke="var(--purple)" strokeWidth={1.5} />
        <line x1={SCX - 4.5} y1={yNA} x2={SCX + 4.5} y2={yNA} stroke="var(--purple)" strokeWidth={1.25} />
        <line x1={SCX} y1={yNA - 4.5} x2={SCX} y2={yNA + 4.5} stroke="var(--purple)" strokeWidth={1.25} />
        <text x={W - 6} y={yNA - 5} fontSize={10.5} fontWeight={600} textAnchor="end" fill="var(--purple)" style={halo}>
          N.A.
        </text>

        {/* σ(y) = −M y / I */}
        <text x={PX0} y={16} fontSize={12} fontWeight={600} textAnchor="middle" fill="var(--text)">
          σ = −My/I
        </text>
        <text x={PX0 - 5} y={30} fontSize={9.5} textAnchor="end" fill="var(--orange)">
          ← compression
        </text>
        <text x={PX0 + 5} y={30} fontSize={9.5} textAnchor="start" fill="var(--blue)">
          tension →
        </text>
        <polygon points={`${PX0},${yNA} ${xTop},${yTopPx} ${PX0},${yTopPx}`} fill={col(sTop)} fillOpacity={0.16} />
        <polygon points={`${PX0},${yNA} ${PX0},${yBotPx} ${xBot},${yBotPx}`} fill={col(sBot)} fillOpacity={0.16} />
        <g>{bars}</g>
        <line x1={PX0} y1={yNA} x2={xTop} y2={yTopPx} stroke={col(sTop)} strokeWidth={2} />
        <line x1={PX0} y1={yNA} x2={xBot} y2={yBotPx} stroke={col(sBot)} strokeWidth={2} />
        <line x1={PX0} y1={yTopPx - 4} x2={PX0} y2={yBotPx + 4} stroke="var(--canvas-axis)" strokeWidth={1.5} />
        <text x={PX0} y={yTopPx - 7} fontSize={10.5} fontWeight={600} textAnchor="middle" fill={col(sTop)} style={halo}>
          σ<tspan dy={3} fontSize={8}>top</tspan>
          <tspan dy={-3}>
            {" "}
            = {numText(sTop)}
            {su ? ` ${su}` : ""}
          </tspan>
        </text>
        <text x={PX0} y={yBotPx + 16} fontSize={10.5} fontWeight={600} textAnchor="middle" fill={col(sBot)} style={halo}>
          σ<tspan dy={3} fontSize={8}>bot</tspan>
          <tspan dy={-3}>
            {" "}
            = {numText(sBot)}
            {su ? ` ${su}` : ""}
          </tspan>
        </text>
      </svg>

      <div className="mx-auto grid w-full max-w-[480px] gap-2.5 rounded-2xl border border-border bg-surface-2/60 p-3 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5">
          <span>
            <TeX tex={`${ybarTex} = ${numTex(P.ybar)}${texUnit(lu)}`} /> <span className="text-xs text-muted">from the bottom</span>
          </span>
          <TeX tex={`${iTex} = ${numTex(P.I)}${texUnit(lu, 4)}`} />
          <TeX tex={`y_{top} = ${numTex(P.yTop)},\\;\\; y_{bot} = ${numTex(-P.yBot)}${texUnit(lu)}`} />
          <span>
            <TeX tex={`\\sigma_{top} = -\\frac{M\\,y_{top}}{I} = ${numTex(sTop)}${texUnit(su)}`} /> {tag(sTop) && <span className="text-xs text-muted">{tag(sTop)}</span>}
          </span>
          <span>
            <TeX tex={`\\sigma_{bot} = -\\frac{M\\,y_{bot}}{I} = ${numTex(sBot)}${texUnit(su)}`} /> {tag(sBot) && <span className="text-xs text-muted">{tag(sBot)}</span>}
          </span>
          <TeX tex={`S = \\frac{I}{y_{\\max}} = ${numTex(P.S)}${texUnit(lu, 3)},\\;\\; |\\sigma|_{\\max} = \\frac{|M|}{S} = ${numTex(sMaxAbs)}${texUnit(su)}`} />
        </div>

        {kind !== "rect" && P.rows.length > 1 && (
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[11px] tabular-nums">
              <thead className="text-muted">
                <tr className="text-right">
                  <th className="pr-2 text-left font-normal">part</th>
                  <th className="px-1 font-normal">A</th>
                  <th className="px-1 font-normal">
                    ȳ<sub>i</sub>
                  </th>
                  <th className="px-1 font-normal">
                    I<sub>c</sub>
                  </th>
                  <th className="px-1 font-normal">d = ȳ<sub>i</sub> − ȳ</th>
                  <th className="pl-1 font-normal">A d²</th>
                </tr>
              </thead>
              <tbody>
                {P.rows.map((r) => (
                  <tr key={r.name} className="text-right">
                    <td className="pr-2 text-left">{r.name}</td>
                    <td className="px-1">{numText(r.A)}</td>
                    <td className="px-1">{numText(r.yc)}</td>
                    <td className="px-1">{numText(r.Ic)}</td>
                    <td className="px-1">{numText(r.d)}</td>
                    <td className="pl-1">{numText(r.Ad2)}</td>
                  </tr>
                ))}
                <tr className="border-t border-border text-right">
                  <td className="pr-2 text-left text-muted">sum</td>
                  <td className="px-1">{numText(P.A)}</td>
                  <td className="px-1">{numText(P.ybar)}</td>
                  <td className="px-1">{numText(sumIc)}</td>
                  <td className="px-1" />
                  <td className="pl-1">{numText(sumAd2)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-0.5 text-[11px] text-muted">
              {lu ? `lengths in ${lu}; ` : ""}ȳ column of the sum row = neutral axis; I = ΣI<sub>c</sub> + ΣA d².
            </div>
          </div>
        )}

        {init.sliders && (
          <div className="grid gap-1.5">
            <Slider
              label={`M = ${stepText(M, init.MR.step)}${units.moment ? ` ${units.moment}` : ""}${M > 0 ? " (sag)" : M < 0 ? " (hog)" : ""}`}
              value={M}
              min={init.MR.min}
              max={init.MR.max}
              step={init.MR.step}
              disabled={disabled}
              onChange={setM}
            />
            {config.section.kind === "rect" && (
              <>
                <Slider label={`b = ${stepText(b, init.bR.step)}${lu ? ` ${lu}` : ""}`} value={b} min={init.bR.min} max={init.bR.max} step={init.bR.step} disabled={disabled} onChange={setB} />
                <Slider label={`h = ${stepText(h, init.hR.step)}${lu ? ` ${lu}` : ""}`} value={h} min={init.hR.min} max={init.hR.max} step={init.hR.step} disabled={disabled} onChange={setH} />
              </>
            )}
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted">
          y is measured up from the neutral axis, which passes through the centroid. With σ = −My/I a positive (sagging) M compresses the top fibres and stretches the bottom ones; |σ| is largest at the fibre farthest from the N.A.
        </p>
      </div>
    </div>
  );
}
