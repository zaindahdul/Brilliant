"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { TorsionSectionConfig } from "@/content/types";
import { Math as TeX } from "@/components/ui/RichText";

interface Props {
  config: TorsionSectionConfig;
  disabled?: boolean;
}

/*
 * Circular shaft cross-section in torsion (Govindjee §7.1–7.3):
 *   γ = r φ′,  τ = G γ = T r / J,  J = π r_o⁴ / 2 (solid) or π (r_o⁴ − r_i⁴) / 2 (hollow),  φ′ = T / (G J).
 * The section drawn is the +z face (outward normal toward the viewer), so τ = σ_zθ points
 * counter-clockwise for T > 0 (right-hand rule about +z).
 *
 * Units: when `units.torque` and `units.length` are recognised (N·mm, N·m, kN·m, lbf·in, kip·ft …;
 * mm, cm, m, in, ft) τ is converted into `units.stress` (default MPa, or psi/ksi for inches/feet), so
 * T = 2 kN·m on r_o = 25 mm reports MPa. Otherwise the numbers are taken as consistent and only
 * labelled. G must be given in the stress unit; φ′ is reported in rad per length unit.
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

/** Plain-text number for SVG labels: 39.79, 251 327, 2.487×10⁻⁵, −18.18. */
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

/** N·m per unit of a torque unit such as "N·mm", "kN·m", "N.m", "Nm", "lbf·in", "in-lb", "kip·ft". */
function torqueSI(u: string): number | null {
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
  /** Multiply T·r/J (raw config numbers) by f to get τ in `stress`. */
  f: number;
  torque: string;
  length: string;
  stress: string;
}

function unitSystem(u: TorsionSectionConfig["units"]): UnitSys {
  const torque = u?.torque?.trim() ?? "";
  const length = u?.length?.trim() ?? "";
  const given = u?.stress?.trim() ?? "";
  const kT = torque ? torqueSI(torque) : null;
  const kL = length ? (LENGTH.get(normUnit(length)) ?? null) : null;
  if (kT === null || kL === null) return { f: 1, torque, length, stress: given };
  let stress = given;
  let kS = stress ? (STRESS.get(normUnit(stress)) ?? null) : null;
  if (kS === null) {
    if (stress) return { f: 1, torque, length, stress }; // unknown stress label: trust the numbers
    const imperial = kL === 0.0254 || kL === 0.3048;
    stress = imperial ? (/kip/i.test(torque) ? "ksi" : "psi") : "MPa";
    kS = STRESS.get(stress.toLowerCase()) ?? 1;
  }
  return { f: kT / (kL ** 3 * kS), torque, length, stress };
}

/* ------------------------------------------------------------------ */
/* Mechanics                                                           */
/* ------------------------------------------------------------------ */

/** τ(r) = T r / J for a solid (ri = 0) or hollow circular section; f converts T·r/J to the stress unit. */
export function torsionSection(T: number, ro: number, ri: number, f = 1) {
  const roE = Number.isFinite(ro) && ro > 0 ? ro : 1;
  const riE = Number.isFinite(ri) ? Math.min(Math.max(ri, 0), 0.999 * roE) : 0;
  const J = (Math.PI * (roE ** 4 - riE ** 4)) / 2;
  const Tn = Number.isFinite(T) ? T : 0;
  const tau = (r: number) => (J > 0 ? ((Tn * r) / J) * f : 0);
  return { roE, riE, hollow: riE > 0, J, tau, tauMax: tau(roE), tauIn: tau(riE) };
}

function initialState(c: TorsionSectionConfig) {
  const ro = Number.isFinite(c.ro) && c.ro > 0 ? c.ro : 1;
  const roR = sizeRange(ro);
  const riRaw = c.ri !== undefined && Number.isFinite(c.ri) && c.ri > 0 ? c.ri : 0;
  const ri = riRaw < ro ? riRaw : 0.9 * ro;
  const T = Number.isFinite(c.T) ? c.T : 0;
  const sliders = !!c.sliders;
  return {
    T,
    ro,
    ri,
    roR,
    TR: signedRange(T, 100),
    /** An `ri` key (even 0) gives the learner an r_i slider to bore out the section. */
    canBore: c.ri !== undefined,
    /** Radius drawn at full size: fixed, so moving the r_o slider visibly resizes the section. */
    rScale: sliders ? roR.max : ro,
    sliders,
  };
}

/* ------------------------------------------------------------------ */
/* Drawing helpers                                                     */
/* ------------------------------------------------------------------ */

const W = 460;
const H = 252;
const CX = 120;
const CY = 130;
const RMAX = 94;
const RINGS = 16;
const ARROW_MAX = 28;
const GL = 290;
const GR = 446;
const GT = 38;
const GB = 206;
/** Rough width of a "τmax = 39.79"-style label (px at 11px font). */
const LABEL_W = 80;

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
function ArcArrow({ cx, cy, r, from, to, color, width = 2.25 }: { cx: number; cy: number; r: number; from: number; to: number; color: string; width?: number }) {
  const rad = Math.PI / 180;
  const x0 = cx + r * Math.cos(from * rad);
  const y0 = cy + r * Math.sin(from * rad);
  const x1 = cx + r * Math.cos(to * rad);
  const y1 = cy + r * Math.sin(to * rad);
  const s = to > from ? 1 : -1;
  // unit tangent in the direction of travel at the end point
  const tx = -Math.sin(to * rad) * s;
  const ty = Math.cos(to * rad) * s;
  const hl = 8;
  const hw = 4.5;
  return (
    <g>
      <path d={`M ${x0} ${y0} A ${r} ${r} 0 ${Math.abs(to - from) > 180 ? 1 : 0} ${s > 0 ? 1 : 0} ${x1} ${y1}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x1 + tx * hl},${y1 + ty * hl} ${x1 - ty * hw},${y1 + tx * hw} ${x1 + ty * hw},${y1 - tx * hw}`} fill={color} />
    </g>
  );
}

/** Annulus (or disc when a ≈ 0) as an even-odd path. */
function ringPath(cx: number, cy: number, a: number, b: number): string {
  const circle = (r: number) => `M ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} Z`;
  return a > 0.25 ? `${circle(b)} ${circle(a)}` : circle(b);
}

const halo = { paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3, strokeLinejoin: "round" } as const;

function Slider({ label, value, min, max, step, disabled, onChange }: { label: ReactNode; value: number; min: number; max: number; step: number; disabled: boolean; onChange: (v: number) => void }) {
  return (
    <label className={`flex items-center gap-3 text-xs ${disabled ? "opacity-60" : ""}`}>
      <span className="w-36 shrink-0 font-mono">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[var(--blue)] disabled:cursor-not-allowed" />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function TorsionSection({ config, disabled = false }: Props) {
  const init = useMemo(() => initialState(config), [config]);
  const units = useMemo(() => unitSystem(config.units), [config.units]);
  const [T, setT] = useState(init.T);
  const [ro, setRo] = useState(init.ro);
  const [ri, setRi] = useState(init.ri);

  const st = torsionSection(T, ro, ri, units.f);
  const st0 = torsionSection(init.T, init.ro, init.ri, units.f);
  const G = config.G !== undefined && Number.isFinite(config.G) && config.G > 0 ? config.G : null;
  const phiPrime = G !== null ? st.tauMax / (G * st.roE) : null; // = T/(GJ), rad per length unit
  const gammaMax = G !== null ? st.tauMax / G : null; // = r_o φ′
  // colour / arrow / axis reference: the larger of the current and the initial τmax
  const tauRef = Math.max(Math.abs(st.tauMax), Math.abs(st0.tauMax)) || 1;
  const lenStep = init.roR.step;
  const tu = units.stress;
  const lu = units.length;

  /* --- cross-section --- */
  const s = RMAX / init.rScale; // px per length unit
  const roPx = st.roE * s;
  const riPx = st.riE * s;
  const rings: ReactNode[] = [];
  for (let k = 0; k < RINGS; k++) {
    const a = st.riE + ((st.roE - st.riE) * k) / RINGS;
    const b = st.riE + ((st.roE - st.riE) * (k + 1)) / RINGS;
    const op = 0.06 + (0.74 * Math.abs(st.tau((a + b) / 2))) / tauRef;
    rings.push(<path key={k} d={ringPath(CX, CY, a * s, b * s)} fill="var(--orange)" fillOpacity={op} fillRule="evenodd" />);
  }
  const dir = T >= 0 ? 1 : -1;
  // arrows at a few radii along four rays; a thin wall gets one row so the arrows do not pile up
  const wallPx = (st.roE - st.riE) * s;
  const radii = !st.hollow ? [st.roE / 3, (2 * st.roE) / 3, st.roE] : wallPx >= 36 ? [st.riE, (st.riE + st.roE) / 2, st.roE] : wallPx >= 16 ? [st.riE, st.roE] : [(st.riE + st.roE) / 2];
  const arrows: ReactNode[] = [];
  for (const deg of [45, 135, 225, 315]) {
    const th = (deg * Math.PI) / 180;
    for (let i = 0; i < radii.length; i++) {
      const r = radii[i];
      const len = (ARROW_MAX * Math.abs(st.tau(r))) / tauRef;
      if (len < 4) continue;
      const x = CX + r * s * Math.cos(th);
      const y = CY - r * s * Math.sin(th);
      // counter-clockwise tangent (−sin θ, cos θ) in screen coordinates (y down)
      const tx = -Math.sin(th) * dir;
      const ty = -Math.cos(th) * dir;
      arrows.push(<PxArrow key={`${deg}-${i}`} x1={x - (tx * len) / 2} y1={y - (ty * len) / 2} x2={x + (tx * len) / 2} y2={y + (ty * len) / 2} color="var(--blue)" width={2} head={6} />);
    }
  }

  /* --- τ–r graph --- */
  const rAxis = init.rScale;
  const rStep = niceNum(rAxis / 4);
  const rTicks: number[] = [];
  for (let k = 0; k * rStep <= rAxis * (1 + 1e-9); k++) rTicks.push(Number((k * rStep).toPrecision(12)));
  const tStep = niceNum(tauRef / 4);
  const tTop = Math.ceil((1.08 * tauRef) / tStep) * tStep;
  const neg = T < 0;
  const lo = neg ? -tTop : 0;
  const hi = neg ? 0 : tTop;
  const tTicks: number[] = [];
  for (let k = 0; k * tStep <= tTop * (1 + 1e-9); k++) tTicks.push(Number(((neg ? -k : k) * tStep).toPrecision(12)));
  const gx = (r: number) => GL + (r / rAxis) * (GR - GL);
  const gy = (t: number) => GT + ((hi - t) / (hi - lo)) * (GB - GT);
  const pIn = [gx(st.riE), gy(st.tauIn)] as const;
  const pOut = [gx(st.roE), gy(st.tauMax)] as const;
  const outLeft = pOut[0] + 8 + LABEL_W > W - 4;
  // τ(r_i) label: below-right of the inner point (under the solid line) when it fits, otherwise above-left
  // (clear of the dashed extension); dropped when it would sit on the τmax label (the readout still has it)
  const inRight = pIn[0] + 8 + LABEL_W <= W - 4;
  const inShown = inRight || !outLeft || Math.abs(pOut[1] - pIn[1]) >= 18;

  return (
    <div className="grid gap-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto w-full max-w-[480px] select-none rounded-2xl border border-border bg-surface"
        role="img"
        aria-label={`Torsion of a ${st.hollow ? "hollow" : "solid"} circular section: shear stress tau = T r / J grows linearly with r up to tau max = ${numText(st.tauMax)} ${tu} at the outer radius`}
      >
        {/* cross-section coloured by |τ(r)| */}
        <g>{rings}</g>
        <circle cx={CX} cy={CY} r={roPx} fill="none" stroke="var(--text)" strokeOpacity={0.55} strokeWidth={1.5} />
        {st.hollow && <circle cx={CX} cy={CY} r={riPx} fill="none" stroke="var(--text)" strokeOpacity={0.55} strokeWidth={1.5} />}
        {/* radius dimension lines */}
        <line x1={CX} y1={CY} x2={CX + roPx} y2={CY} stroke="var(--text)" strokeOpacity={0.5} strokeWidth={1} />
        <text x={CX + roPx / 2} y={CY - 5} fontSize={11} textAnchor="middle" fill="var(--text)" style={halo}>
          r<tspan dy={3} fontSize={8.5}>o</tspan>
        </text>
        {st.hollow && (
          <>
            <line x1={CX} y1={CY} x2={CX - riPx} y2={CY} stroke="var(--text)" strokeOpacity={0.5} strokeWidth={1} strokeDasharray="3 2" />
            <text x={CX - riPx / 2} y={CY - 5} fontSize={11} textAnchor="middle" fill="var(--text)" style={halo}>
              r<tspan dy={3} fontSize={8.5}>i</tspan>
            </text>
          </>
        )}
        {/* shear-stress arrows, length ∝ τ(r) */}
        <g>{arrows}</g>
        {/* z axis points out of the page */}
        <circle cx={CX} cy={CY} r={4.5} fill="var(--surface)" stroke="var(--muted)" strokeWidth={1.25} />
        <circle cx={CX} cy={CY} r={1.5} fill="var(--muted)" />
        <text x={CX + 6} y={CY + 15} fontSize={10} fill="var(--muted)" style={halo}>
          z
        </text>
        {/* applied torque */}
        {T !== 0 && (
          <>
            <ArcArrow cx={CX} cy={CY} r={roPx + 11} from={neg ? -110 : -20} to={neg ? -20 : -110} color="var(--blue)" />
            <text x={CX + (roPx + 23) * Math.cos((-65 * Math.PI) / 180)} y={CY + (roPx + 23) * Math.sin((-65 * Math.PI) / 180) + 4} fontSize={13} fontWeight={700} textAnchor="middle" fill="var(--blue)" style={halo}>
              T
            </text>
          </>
        )}

        {/* τ–r graph */}
        <g>
          {tTicks.map((t) => (
            <g key={`t${t}`}>
              <line x1={GL} y1={gy(t)} x2={GR} y2={gy(t)} stroke="var(--canvas-grid)" strokeWidth={1} />
              <text x={GL - 5} y={gy(t) + 3.5} fontSize={9.5} textAnchor="end" fill="var(--muted)">
                {numText(t, 3)}
              </text>
            </g>
          ))}
          {rTicks.map((r) => (
            <g key={`r${r}`}>
              <line x1={gx(r)} y1={GT} x2={gx(r)} y2={GB} stroke="var(--canvas-grid)" strokeWidth={1} />
              <text x={gx(r)} y={GB + 13} fontSize={9.5} textAnchor="middle" fill="var(--muted)">
                {numText(r, 3)}
              </text>
            </g>
          ))}
          <line x1={GL} y1={gy(0)} x2={GR} y2={gy(0)} stroke="var(--canvas-axis)" strokeWidth={1.5} />
          <line x1={GL} y1={GT} x2={GL} y2={GB} stroke="var(--canvas-axis)" strokeWidth={1.5} />
          <text x={GL} y={GT - 14} fontSize={11} textAnchor="middle" fill="var(--text)">
            τ{tu ? ` (${tu})` : ""}
          </text>
          <text x={GR} y={GB + 28} fontSize={11} textAnchor="end" fill="var(--text)">
            r{lu ? ` (${lu})` : ""}
          </text>
          <polygon points={`${pIn[0]},${gy(0)} ${pIn[0]},${pIn[1]} ${pOut[0]},${pOut[1]} ${pOut[0]},${gy(0)}`} fill="var(--orange)" fillOpacity={0.18} />
          {st.hollow && <line x1={gx(0)} y1={gy(0)} x2={pIn[0]} y2={pIn[1]} stroke="var(--orange)" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />}
          <line x1={pIn[0]} y1={pIn[1]} x2={pOut[0]} y2={pOut[1]} stroke="var(--orange)" strokeWidth={3} strokeLinecap="round" />
          {st.hollow && <circle cx={pIn[0]} cy={pIn[1]} r={4} fill="var(--orange)" stroke="var(--surface)" strokeWidth={1.5} />}
          <circle cx={pOut[0]} cy={pOut[1]} r={4.5} fill="var(--orange)" stroke="var(--surface)" strokeWidth={1.5} />
          <text x={outLeft ? pOut[0] - 8 : pOut[0] + 8} y={neg ? pOut[1] + 16 : pOut[1] - 8} fontSize={11} fontWeight={600} textAnchor={outLeft ? "end" : "start"} fill="var(--orange)" style={halo}>
            τ<tspan dy={3} fontSize={8.5}>max</tspan>
            <tspan dy={-3}> = {numText(st.tauMax)}</tspan>
          </text>
          {st.hollow && inShown && (
            <text x={inRight ? pIn[0] + 8 : pIn[0] - 8} y={inRight === neg ? pIn[1] - 7 : pIn[1] + 15} fontSize={10.5} textAnchor={inRight ? "start" : "end"} fill="var(--orange)" style={halo}>
              τ(r<tspan dy={3} fontSize={8}>i</tspan>
              <tspan dy={-3}>) = {numText(st.tauIn)}</tspan>
            </text>
          )}
        </g>
      </svg>

      <div className="mx-auto grid w-full max-w-[480px] gap-2.5 rounded-2xl border border-border bg-surface-2/60 p-3 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5">
          <TeX tex={`J = ${st.hollow ? "\\frac{\\pi\\,(r_o^4 - r_i^4)}{2}" : "\\frac{\\pi r_o^4}{2}"} = ${numTex(st.J)}${texUnit(lu, 4)}`} />
          <TeX tex={`\\tau_{\\max} = \\frac{T\\,r_o}{J} = ${numTex(st.tauMax)}${texUnit(tu)}`} />
          {st.hollow && <TeX tex={`\\tau(r_i) = \\frac{T\\,r_i}{J} = ${numTex(st.tauIn)}${texUnit(tu)}`} />}
          {phiPrime !== null && <TeX tex={`\\varphi' = \\frac{T}{GJ} = ${numTex(phiPrime)}\\,\\text{rad${lu ? `/${cleanUnit(lu)}` : ""}}`} />}
          {gammaMax !== null && <TeX tex={`\\gamma_{\\max} = r_o\\varphi' = ${numTex(gammaMax)}\\;(${numTex(gammaMax * 1e6, 3)}\\,\\mu)`} />}
        </div>

        {init.sliders && (
          <div className="grid gap-1.5">
            <Slider label={`T = ${stepText(T, init.TR.step)}${units.torque ? ` ${units.torque}` : ""}`} value={T} min={init.TR.min} max={init.TR.max} step={init.TR.step} disabled={disabled} onChange={setT} />
            <Slider
              label={
                <>
                  r<sub>o</sub> = {stepText(ro, lenStep)}
                  {lu ? ` ${lu}` : ""}
                </>
              }
              value={ro}
              min={init.roR.min}
              max={init.roR.max}
              step={lenStep}
              disabled={disabled}
              onChange={(v) => {
                setRo(v);
                if (ri > v - lenStep) setRi(Math.max(0, v - lenStep));
              }}
            />
            {init.canBore && (
              <Slider
                label={
                  <>
                    r<sub>i</sub> = {stepText(ri, lenStep)}
                    {lu ? ` ${lu}` : ""}
                  </>
                }
                value={ri}
                min={0}
                max={Number((init.roR.max - lenStep).toPrecision(12))}
                step={lenStep}
                disabled={disabled}
                onChange={(v) => setRi(Math.max(0, Math.min(v, ro - lenStep)))}
              />
            )}
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted">
          Shear stress τ = σ<sub>zθ</sub> on the +z face (normal toward you): counter-clockwise for T &gt; 0, zero on the axis and growing linearly to τ<sub>max</sub> at r<sub>o</sub> (γ = rφ′, τ = Gγ).
        </p>
      </div>
    </div>
  );
}
