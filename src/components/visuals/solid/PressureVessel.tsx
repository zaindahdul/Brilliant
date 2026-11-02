"use client";

import { useId, useState } from "react";
import type { PressureVesselConfig } from "@/content/types";
import { Math as TeX } from "@/components/ui/RichText";

interface Props {
  config: PressureVesselConfig;
  disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/* Number helpers                                                      */
/* ------------------------------------------------------------------ */

const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };

function finite(x: unknown, fallback = 0): number {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
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
  let s = String(Math.abs(r));
  if (Math.abs(r) >= 10000) {
    const [int, dec] = s.split(".");
    s = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (dec ? `.${dec}` : "");
  }
  return (r < 0 ? "−" : "") + s;
}

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

/* ------------------------------------------------------------------ */
/* Mechanics (pure, exported for tests)                                */
/* ------------------------------------------------------------------ */
/*
 * Govindjee §6.2 (thin-walled, R/t > 10, sigma_rr ≈ 0):
 *   cylinder: hoop sigma_θθ = pR/t (half-cylinder FBD: p·2RL = 2 sigma_θθ L t),
 *             axial sigma_zz = pR/(2t) (end-cap FBD: p πR² = sigma_zz 2πR t);
 *   sphere:   sigma_θθ = sigma_φφ = pR/(2t) (hemisphere FBD).
 */
export function vesselStresses(kind: PressureVesselConfig["kind"], p: number, r: number, t: number) {
  if (!(t > 0)) return { hoop: NaN, axial: NaN, ratio: NaN };
  const ratio = r / t;
  return kind === "sphere" ? { hoop: (p * r) / (2 * t), axial: (p * r) / (2 * t), ratio } : { hoop: (p * r) / t, axial: (p * r) / (2 * t), ratio };
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const W = 460;
const H = 250;
const EX = 364; // element centre
const EY = 122;
const EH = 22; // element half side
const AMAX = 44; // longest stress arrow
const HALO = { paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3.5, strokeLinejoin: "round" } as const;

function PxArrow({ x1, y1, x2, y2, color, width = 2.4, head = 8 }: { x1: number; y1: number; x2: number; y2: number; color: string; width?: number; head?: number }) {
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
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - ux * h * 0.6} y2={y2 - uy * h * 0.6} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${bx - uy * w},${by + ux * w} ${bx + uy * w},${by - ux * w}`} fill={color} />
    </g>
  );
}

function Sub({ x, y, sym, sub, value, color, anchor = "start" }: { x: number; y: number; sym: string; sub: string; value: string; color: string; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} fontSize={12} fontWeight={600} textAnchor={anchor} fill={color} style={HALO}>
      {sym}
      <tspan dy={3.5} fontSize={9}>
        {sub}
      </tspan>
      <tspan dy={-3.5}>{` = ${value}`}</tspan>
    </text>
  );
}

/** Wall element (θ up, z or φ to the right) with outward arrows for tension. */
function WallElement({ hoop, axial, ref0, kind }: { hoop: number; axial: number; ref0: number; kind: PressureVesselConfig["kind"] }) {
  const len = (s: number) => (!Number.isFinite(s) || Math.abs(s) < 1e-12 ? 0 : clamp((26 * Math.abs(s)) / ref0, 5, AMAX));
  const lt = len(hoop);
  const lz = len(axial);
  const out = (s: number, a: number, b: number): [number, number] => (s >= 0 ? [a, b] : [b, a]);
  const [t1, t2] = out(hoop, EY - EH - 4, EY - EH - 4 - lt);
  const [b1, b2] = out(hoop, EY + EH + 4, EY + EH + 4 + lt);
  const [r1, r2] = out(axial, EX + EH + 4, EX + EH + 4 + lz);
  const [l1, l2] = out(axial, EX - EH - 4, EX - EH - 4 - lz);
  const horizSub = kind === "sphere" ? "φφ" : "zz";
  return (
    <g>
      <text x={EX} y={20} fontSize={11.5} fontWeight={700} textAnchor="middle" fill="var(--text)">
        wall element
      </text>
      <text x={EX} y={34} fontSize={10} textAnchor="middle" fill="var(--muted)">
        {kind === "sphere" ? "θ ↑   φ →" : "θ (hoop) ↑   z (axial) →"}
      </text>
      <rect x={EX - EH} y={EY - EH} width={2 * EH} height={2 * EH} fill="var(--surface-2)" stroke="var(--text)" strokeWidth={1.5} />
      {lt > 0 && (
        <>
          <PxArrow x1={EX} y1={t1} x2={EX} y2={t2} color="var(--orange)" />
          <PxArrow x1={EX} y1={b1} x2={EX} y2={b2} color="var(--orange)" />
        </>
      )}
      {lz > 0 && (
        <>
          <PxArrow x1={r1} y1={EY} x2={r2} y2={EY} color="var(--blue)" />
          <PxArrow x1={l1} y1={EY} x2={l2} y2={EY} color="var(--blue)" />
        </>
      )}
      <Sub x={EX + 7} y={EY - EH - 8 - lt / 2} sym="σ" sub="θθ" value={fmtNum(hoop, 3)} color="var(--orange)" />
      <Sub x={EX + EH + 6} y={EY + 20} sym="σ" sub={horizSub} value={fmtNum(axial, 3)} color="var(--blue)" />
    </g>
  );
}

const ACCENT = {
  blue: "accent-[var(--blue)]",
  orange: "accent-[var(--orange)]",
  teal: "accent-[var(--teal)]",
} as const;

function SliderRow({ label, value, min, max, step, disabled, onChange, accent, aria }: { label: React.ReactNode; value: number; min: number; max: number; step: number; disabled: boolean; onChange: (v: number) => void; accent: keyof typeof ACCENT; aria: string }) {
  return (
    <label className="flex items-center gap-3 text-xs">
      <span className="w-32 shrink-0 font-mono">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} aria-label={aria} onChange={(e) => onChange(Number(e.target.value))} className={`min-w-0 flex-1 disabled:opacity-50 ${ACCENT[accent]}`} />
    </label>
  );
}

function withUnit(v: string, unit: string) {
  return unit ? `${v} ${unit}` : v;
}

/** Slider range [lo, hi] with a nice step that hits the initial value. */
function range(lo: number, hi: number, v0: number) {
  const step = niceStep(hi - lo, v0);
  return { min: Math.ceil(lo / step - 1e-9) * step, max: Math.floor(hi / step + 1e-9) * step, step };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function PressureVessel({ config, disabled = false }: Props) {
  const kind: PressureVesselConfig["kind"] = config.kind === "sphere" ? "sphere" : "cylinder";
  const units = config.units ?? {};
  const uP = units.pressure ?? "";
  const uL = units.length ?? "";
  const uS = units.stress ?? units.pressure ?? "";
  const p0 = finite(config.p);
  const r0 = finite(config.r) > 0 ? finite(config.r) : 1;
  const t0 = finite(config.t);

  const [p, setP] = useState(p0);
  const [r, setR] = useState(r0);
  const [t, setT] = useState(t0);
  const hatchId = `pv-hatch-${useId().replace(/[^A-Za-z0-9_-]/g, "")}`;

  const st = vesselStresses(kind, p, r, t);
  const ref = vesselStresses(kind, p0 || 1, r0, t0 > 0 ? t0 : r0 / 20);
  const ref0 = Math.abs(ref.hoop) || 1;
  const thinOk = st.ratio > 10;
  const borderline = Math.abs(st.ratio - 10) < 1e-9;

  // drawing scale: wall thickness ∝ t/R (at least 3 px so it stays visible)
  const tDraw = t > 0 ? t : r / 20;
  const pLen = (s: number) => (Math.abs(s) < 1e-12 ? 0 : clamp((15 * Math.abs(s)) / (Math.abs(p0) || 1), 5, 26));
  const plen = pLen(p);
  const pdir = p >= 0 ? 1 : -1; // outward when p > 0

  const pR = p0 > 0 ? range(0, 2 * p0, p0) : p0 < 0 ? range(2 * p0, 0, p0) : range(0, 10, 0);
  const rR = range(r0 / 5, 2 * r0, r0);
  const tR = range(0, Math.max(2 * Math.max(t0, 0), r0 / 2), Math.max(t0, 0));
  const tMin = Math.max(tR.step, tR.min);

  let drawing: React.ReactNode;
  if (kind === "cylinder") {
    const x0 = 22;
    const x1 = 282;
    const cy = 126;
    const Ro = 74;
    const tw = clamp((Ro * tDraw) / r, 3, Ro * 0.8);
    const Ri = Ro - tw;
    const arrowsTop = [0, 1, 2, 3, 4, 5].map((k) => x0 + tw + 22 + (k * (x1 - x0 - 2 * tw - 44)) / 5);
    drawing = (
      <g>
        <rect x={x0} y={cy - Ro} width={x1 - x0} height={2 * Ro} fill="var(--blue)" fillOpacity={0.06} />
        {/* walls (longitudinal section) and flat end caps */}
        {[
          [x0, cy - Ro, x1 - x0, tw],
          [x0, cy + Ri, x1 - x0, tw],
          [x0, cy - Ri, tw, 2 * Ri],
          [x1 - tw, cy - Ri, tw, 2 * Ri],
        ].map(([x, y, w, h], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill="var(--surface-3)" />
            <rect x={x} y={y} width={w} height={h} fill={`url(#${hatchId})`} />
          </g>
        ))}
        <rect x={x0} y={cy - Ro} width={x1 - x0} height={2 * Ro} fill="none" stroke="var(--text)" strokeWidth={1.6} />
        <rect x={x0 + tw} y={cy - Ri} width={x1 - x0 - 2 * tw} height={2 * Ri} fill="none" stroke="var(--text)" strokeWidth={1.2} />
        <line x1={x0 - 8} y1={cy} x2={x1 + 8} y2={cy} stroke="var(--muted)" strokeWidth={1} strokeDasharray="10 3 2 3" />
        {/* internal pressure */}
        {plen > 0 &&
          arrowsTop.map((x) => (
            <g key={x}>
              <PxArrow x1={x} y1={cy - Ri + (pdir > 0 ? plen + 2 : 2)} x2={x} y2={cy - Ri + (pdir > 0 ? 2 : plen + 2)} color="var(--teal)" width={1.8} head={6} />
              <PxArrow x1={x} y1={cy + Ri - (pdir > 0 ? plen + 2 : 2)} x2={x} y2={cy + Ri - (pdir > 0 ? 2 : plen + 2)} color="var(--teal)" width={1.8} head={6} />
            </g>
          ))}
        {plen > 0 &&
          [-Ri * 0.45, Ri * 0.45].map((dy) => (
            <g key={dy}>
              <PxArrow x1={x0 + tw + (pdir > 0 ? plen + 2 : 2)} y1={cy + dy} x2={x0 + tw + (pdir > 0 ? 2 : plen + 2)} y2={cy + dy} color="var(--teal)" width={1.8} head={6} />
              <PxArrow x1={x1 - tw - (pdir > 0 ? plen + 2 : 2)} y1={cy + dy} x2={x1 - tw - (pdir > 0 ? 2 : plen + 2)} y2={cy + dy} color="var(--teal)" width={1.8} head={6} />
            </g>
          ))}
        <text x={(x0 + x1) / 2} y={cy - 8} fontSize={12} fontWeight={700} textAnchor="middle" fill="var(--teal)" style={HALO}>
          {`p = ${withUnit(fmtNum(p, 3), uP)}`}
        </text>
        {/* R and t */}
        <PxArrow x1={x0 + tw + 50} y1={cy} x2={x0 + tw + 50} y2={cy - Ro + tw / 2} color="var(--text)" width={1.3} head={6} />
        <text x={x0 + tw + 56} y={cy - Ro / 2 + 4} fontSize={12} fontStyle="italic" fontWeight={600} fill="var(--text)" style={HALO}>
          R
        </text>
        <line x1={x1 - 40} y1={cy - Ro + tw / 2} x2={x1 - 28} y2={cy - Ro - 12} stroke="var(--muted)" strokeWidth={1} />
        <text x={x1 - 25} y={cy - Ro - 14} fontSize={12} fontStyle="italic" fontWeight={600} fill="var(--text)">
          t
        </text>
        <PxArrow x1={x0} y1={H - 18} x2={x0 + 38} y2={H - 18} color="var(--muted)" width={1.4} head={6} />
        <text x={x0 + 43} y={H - 14} fontSize={12} fontStyle="italic" fill="var(--muted)">
          z
        </text>
        <text x={x0 + 62} y={H - 14} fontSize={10.5} textAnchor="start" fill="var(--muted)">
          section along the axis (closed ends)
        </text>
      </g>
    );
  } else {
    const cx = 152;
    const cy = 126;
    const Ro = 96;
    const tw = clamp((Ro * tDraw) / r, 3, Ro * 0.8);
    const Ri = Ro - tw;
    const ring = `M ${cx - Ro} ${cy} a ${Ro} ${Ro} 0 1 0 ${2 * Ro} 0 a ${Ro} ${Ro} 0 1 0 ${-2 * Ro} 0 Z M ${cx - Ri} ${cy} a ${Ri} ${Ri} 0 1 1 ${2 * Ri} 0 a ${Ri} ${Ri} 0 1 1 ${-2 * Ri} 0 Z`;
    const angles = Array.from({ length: 12 }, (_, k) => (k * Math.PI) / 6 + Math.PI / 12);
    const rd = (-30 * Math.PI) / 180;
    drawing = (
      <g>
        <circle cx={cx} cy={cy} r={Ri} fill="var(--blue)" fillOpacity={0.06} />
        <path d={ring} fill="var(--surface-3)" fillRule="evenodd" />
        <path d={ring} fill={`url(#${hatchId})`} fillRule="evenodd" stroke="var(--text)" strokeWidth={1.4} />
        {plen > 0 &&
          angles.map((a) => {
            const ca = Math.cos(a);
            const sa = Math.sin(a);
            const ra = Ri - 2 - (pdir > 0 ? plen : 0);
            const rb = Ri - 2 - (pdir > 0 ? 0 : plen);
            return <PxArrow key={a} x1={cx + ra * ca} y1={cy - ra * sa} x2={cx + rb * ca} y2={cy - rb * sa} color="var(--teal)" width={1.8} head={6} />;
          })}
        <text x={cx} y={cy - 8} fontSize={12} fontWeight={700} textAnchor="middle" fill="var(--teal)" style={HALO}>
          {`p = ${withUnit(fmtNum(p, 3), uP)}`}
        </text>
        <PxArrow x1={cx} y1={cy} x2={cx + (Ro - tw / 2) * Math.cos(rd)} y2={cy - (Ro - tw / 2) * Math.sin(rd)} color="var(--text)" width={1.3} head={6} />
        <text x={cx + 0.45 * Ro * Math.cos(rd) + 4} y={cy - 0.45 * Ro * Math.sin(rd) - 6} fontSize={12} fontStyle="italic" fontWeight={600} fill="var(--text)" style={HALO}>
          R
        </text>
        <line x1={cx + (Ro - tw / 2) * Math.cos(Math.PI / 4)} y1={cy - (Ro - tw / 2) * Math.sin(Math.PI / 4)} x2={cx + (Ro + 12) * Math.cos(Math.PI / 4)} y2={cy - (Ro + 12) * Math.sin(Math.PI / 4)} stroke="var(--muted)" strokeWidth={1} />
        <text x={cx + (Ro + 15) * Math.cos(Math.PI / 4)} y={cy - (Ro + 15) * Math.sin(Math.PI / 4)} fontSize={12} fontStyle="italic" fontWeight={600} fill="var(--text)">
          t
        </text>
        <text x={cx} y={H - 6} fontSize={10.5} textAnchor="middle" fill="var(--muted)">
          section through the centre
        </text>
      </g>
    );
  }

  return (
    <div className="grid gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[480px] select-none rounded-2xl border border-border bg-surface" role="img" aria-label={`Thin-walled ${kind} under internal pressure ${fmtNum(p)} ${uP}: ${kind === "cylinder" ? `hoop stress ${fmtNum(st.hoop)}, axial stress ${fmtNum(st.axial)}` : `membrane stress ${fmtNum(st.hoop)}`} ${uS}`}>
        <defs>
          <pattern id={hatchId} patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={6} stroke="var(--muted)" strokeWidth={1.5} />
          </pattern>
        </defs>
        {drawing}
        <WallElement hoop={st.hoop} axial={st.axial} ref0={ref0} kind={kind} />
      </svg>

      <div className="mx-auto grid w-full max-w-[480px] gap-2 rounded-2xl border border-border bg-surface-2/60 p-3 text-sm">
        {config.sliders && (
          <div className="grid gap-1.5">
            <SliderRow label={`p = ${withUnit(fmtNum(p, 4), uP)}`} {...pR} value={p} disabled={disabled} accent="teal" aria="internal pressure p" onChange={setP} />
            <SliderRow label={`R = ${withUnit(fmtNum(r, 4), uL)}`} {...rR} value={r} disabled={disabled} accent="blue" aria="radius R" onChange={setR} />
            <SliderRow label={`t = ${withUnit(fmtNum(t, 4), uL)}`} {...tR} min={tMin} value={t} disabled={disabled} accent="orange" aria="wall thickness t" onChange={setT} />
          </div>
        )}
        {kind === "cylinder" ? (
          <div className="grid gap-1">
            <div className="flex flex-wrap items-baseline gap-x-2 text-orange">
              <TeX tex={`\\sigma_{\\theta\\theta}=\\frac{pR}{t}`} />
              <span className="font-mono">= {withUnit(fmtNum(st.hoop, 4), uS)}</span>
              <span className="text-xs text-muted">(hoop)</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 text-blue">
              <TeX tex={`\\sigma_{zz}=\\frac{pR}{2t}`} />
              <span className="font-mono">= {withUnit(fmtNum(st.axial, 4), uS)}</span>
              <span className="text-xs text-muted">(axial — half the hoop stress)</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-2 text-orange">
            <TeX tex={`\\sigma_{\\theta\\theta}=\\sigma_{\\phi\\phi}=\\frac{pR}{2t}`} />
            <span className="font-mono">= {withUnit(fmtNum(st.hoop, 4), uS)}</span>
            <span className="text-xs text-muted">(equal in every direction in the wall)</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">
            <TeX tex={`\\sigma_{rr}\\approx 0`} /> (it only varies from −p inside to 0 outside)
          </span>
          {t > 0 ? (
            <span className={`rounded-full px-2.5 py-1 font-mono ${thinOk ? "bg-primary-soft text-primary-ink" : borderline ? "bg-gold-soft text-gold-ink" : "bg-danger-soft text-danger-ink"}`}>
              R/t = {fmtNum(st.ratio, 3)} {thinOk ? "> 10 · thin-walled ✓" : borderline ? "= 10 · borderline (the book asks R/t > 10)" : st.ratio <= 1 ? "· t ≥ R: not a thin wall at all" : "< 10 · not thin — formulas only approximate"}
            </span>
          ) : (
            <span className="rounded-full bg-danger-soft px-2.5 py-1 font-mono text-danger-ink">t must be positive</span>
          )}
        </div>
      </div>
    </div>
  );
}
