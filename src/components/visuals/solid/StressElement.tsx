"use client";

import { useState } from "react";
import type { StressElementConfig } from "@/content/types";
import { Math as TeX } from "@/components/ui/RichText";

interface Props {
  config: StressElementConfig;
  disabled?: boolean;
}

type V2 = [number, number];

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

function texNum(x: number, sig = 4): string {
  return fmtNum(x, sig)
    .replace(/ /g, "\\,")
    .replace(/−/g, "-")
    .replace(/×10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (_, e: string) => `\\times 10^{${e
      .split("")
      .map((c) => UNSUP[c] ?? c)
      .join("")}}`);
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

function niceCeil(x: number): number {
  if (!(x > 0)) return 1;
  const e = Math.floor(Math.log10(x));
  for (const m of [1, 2, 5, 10]) if (m * 10 ** e >= x * (1 - 1e-12)) return m * 10 ** e;
  return 10 ** (e + 1);
}

/* ------------------------------------------------------------------ */
/* Mechanics (pure, exported for tests)                                */
/* ------------------------------------------------------------------ */
/*
 * Govindjee §3.2.1: sigma_ij = force component j per unit area on the cut whose normal is e_i.
 * Positive components point in +coordinate directions on +faces and in −directions on −faces.
 * The traction on any face / cut with outward unit normal n is Cauchy's t = sigma n (sigma symmetric),
 * so the arrows below are generated from t = sigma m for each face normal m — the sign convention
 * then comes out automatically: +x face (sxx, sxy), −x face (−sxx, −sxy), +y face (sxy, syy), −y face (−sxy, −syy).
 * For a cut with n = (cos θ, sin θ) and s = (−sin θ, cos θ): sigma_n = t·n, tau = t·s.
 * With θ = 90° − θ_book this s equals the book's tangent t = −cos θ_b e_x + sin θ_b e_y (§3.1.1),
 * so for a bar (only sxx = F/A0): sigma_n = (F/A0) sin²θ_b and tau = −(F/A0) sin θ_b cos θ_b.
 */
export function traction(sxx: number, syy: number, sxy: number, n: V2): { t: V2; sn: number; tau: number } {
  const t: V2 = [sxx * n[0] + sxy * n[1], sxy * n[0] + syy * n[1]];
  const s: V2 = [-n[1], n[0]];
  return { t, sn: t[0] * n[0] + t[1] * n[1], tau: t[0] * s[0] + t[1] * s[1] };
}

/** The part of the square [−a, a]² on the side p·n ≤ 0 (Sutherland–Hodgman against one half-plane). */
function keptPolygon(a: number, n: V2): V2[] {
  const sq: V2[] = [
    [-a, -a],
    [a, -a],
    [a, a],
    [-a, a],
  ];
  const f = (p: V2) => p[0] * n[0] + p[1] * n[1];
  const out: V2[] = [];
  for (let i = 0; i < sq.length; i++) {
    const p = sq[i];
    const q = sq[(i + 1) % sq.length];
    const fp = f(p);
    const fq = f(q);
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const W = 460;
const H = 400;
const CX = 230;
const CY = 196;
const A = 62; // half side of the element (px)
const LMAX = 74; // arrow length for |component| = max
const GAP = 14; // gap between a face and its normal-stress arrow
const OFF = 8; // offset of the shear arrow from its face
const HALO = { paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3.5, strokeLinejoin: "round" } as const;

/** math (y up, relative to the element centre) -> svg px */
const px = (p: V2): V2 => [CX + p[0], CY - p[1]];

function PxArrow({ from, to, color, width = 2.6, head = 9, dashed = false }: { from: V2; to: V2; color: string; width?: number; head?: number; dashed?: boolean }) {
  const [x1, y1] = px(from);
  const [x2, y2] = px(to);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;
  const ux = dx / len;
  const uy = dy / len;
  const h = Math.min(head, len * 0.7);
  const w = h * 0.5;
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - ux * h * 0.6} y2={y2 - uy * h * 0.6} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? "5 4" : undefined} />
      <polygon points={`${x2},${y2} ${bx - uy * w},${by + ux * w} ${bx + uy * w},${by - ux * w}`} fill={color} />
    </g>
  );
}

function SymLabel({ at, sym, sub, value, color, anchor = "start" }: { at: V2; sym: string; sub: string; value: string; color: string; anchor?: "start" | "middle" | "end" }) {
  const [x, y] = px(at);
  return (
    <text x={x} y={y} fontSize={12.5} fontWeight={600} textAnchor={anchor} fill={color} style={HALO}>
      {sym}
      <tspan dy={3.5} fontSize={9.5}>
        {sub}
      </tspan>
      <tspan dy={-3.5}>{` = ${value}`}</tspan>
    </text>
  );
}

const FACES: { m: V2; key: string }[] = [
  { m: [1, 0], key: "+x" },
  { m: [-1, 0], key: "-x" },
  { m: [0, 1], key: "+y" },
  { m: [0, -1], key: "-y" },
];

function FaceArrows({ sxx, syy, sxy, M }: { sxx: number; syy: number; sxy: number; M: number }) {
  const lenOf = (v: number) => (Math.abs(v) < M * 0.004 ? 0 : clamp((Math.abs(v) / M) * LMAX, 7, LMAX));
  return (
    <g>
      {FACES.map(({ m, key }) => {
        const { t, sn } = traction(sxx, syy, sxy, m);
        const tt: V2 = [t[0] - sn * m[0], t[1] - sn * m[1]];
        const tmag = Math.hypot(tt[0], tt[1]);
        const nLen = lenOf(sn);
        const sLen = lenOf(tmag);
        const nColor = m[0] !== 0 ? "var(--blue)" : "var(--orange)";
        const near: V2 = [m[0] * (A + GAP), m[1] * (A + GAP)];
        const far: V2 = [m[0] * (A + GAP + nLen), m[1] * (A + GAP + nLen)];
        const c: V2 = [m[0] * (A + OFF), m[1] * (A + OFF)];
        const d: V2 = tmag > 0 ? [tt[0] / tmag, tt[1] / tmag] : [0, 0];
        return (
          <g key={key}>
            {nLen > 0 && <PxArrow from={sn > 0 ? near : far} to={sn > 0 ? far : near} color={nColor} />}
            {sLen > 0 && <PxArrow from={[c[0] - (d[0] * sLen) / 2, c[1] - (d[1] * sLen) / 2]} to={[c[0] + (d[0] * sLen) / 2, c[1] + (d[1] * sLen) / 2]} color="var(--purple)" />}
          </g>
        );
      })}
    </g>
  );
}

const ACCENT = {
  blue: "accent-[var(--blue)]",
  orange: "accent-[var(--orange)]",
  purple: "accent-[var(--purple)]",
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

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function StressElement({ config, disabled = false }: Props) {
  const init = { sxx: finite(config.sxx), syy: finite(config.syy), sxy: finite(config.sxy) };
  const base = finite(config.max) > 0 ? finite(config.max) : 100;
  const biggest = Math.max(Math.abs(init.sxx), Math.abs(init.syy), Math.abs(init.sxy));
  const M = biggest > base ? niceCeil(biggest) : base;
  const unit = config.unit ?? "";
  const cut = config.cut;
  const theta0 = (((finite(cut?.theta) % 360) + 360) % 360);
  const thetaMax = theta0 > 180 ? 360 : 180;

  const [s, setS] = useState(init);
  const [theta, setTheta] = useState(theta0);

  const { sxx, syy, sxy } = s;
  const th = (theta * Math.PI) / 180;
  const n: V2 = [Math.cos(th), Math.sin(th)];
  const sv: V2 = [-n[1], n[0]];
  const tr = traction(sxx, syy, sxy, n);
  const k = LMAX / M; // px per stress unit
  const tmagPx = Math.hypot(tr.t[0], tr.t[1]) * k;
  const tScale = tmagPx > 150 ? 150 / tmagPx : 1; // keep a huge traction inside the canvas
  const tVec: V2 = [tr.t[0] * k * tScale, tr.t[1] * k * tScale];
  const snVec: V2 = [n[0] * tr.sn * k * tScale, n[1] * tr.sn * k * tScale];
  const tauVec: V2 = [sv[0] * tr.tau * k * tScale, sv[1] * tr.tau * k * tScale];
  const lineAngle = (theta + 90) % 180;
  const cutToX = lineAngle > 90 ? 180 - lineAngle : lineAngle;

  // Cut line through the centre, clipped to the element.
  const tLim = Math.min(Math.abs(sv[0]) > 1e-9 ? A / Math.abs(sv[0]) : Infinity, Math.abs(sv[1]) > 1e-9 ? A / Math.abs(sv[1]) : Infinity);
  const c1 = px([-sv[0] * tLim, -sv[1] * tLim]);
  const c2 = px([sv[0] * tLim, sv[1] * tLim]);
  const kept = keptPolygon(A, n);

  // Label anchors on the positive faces.
  const nLen = (v: number) => (Math.abs(v) < M * 0.004 ? 0 : clamp((Math.abs(v) / M) * LMAX, 7, LMAX));
  const xxTip = A + GAP + nLen(sxx);
  const yyTip = A + GAP + nLen(syy);
  const shHalf = Math.max(nLen(sxy) / 2, 16);
  const fade = cut ? 0.4 : 1;
  const unitTex = /^[A-Za-z ]{1,12}$/.test(unit) ? `\\ \\text{${unit}}` : "";

  // θ arc (only when a cut is shown)
  const arcR = 24;
  const arcEnd = px([arcR * n[0], arcR * n[1]]);
  const thetaLbl = px([(arcR + 11) * Math.cos(th / 2), (arcR + 11) * Math.sin(th / 2)]);

  const tLen = Math.hypot(tVec[0], tVec[1]);
  const tLbl = tLen > 0 ? px([tVec[0] * (1 + 14 / tLen), tVec[1] * (1 + 14 / tLen)]) : px([0, 0]);
  const nLbl = px([n[0] * 56, n[1] * 56]);
  // Zero components are only labelled when the learner can change them.
  const showLbl = (v: number) => !!config.sliders || Math.abs(v) >= M * 0.004;

  const slider = (key: "sxx" | "syy" | "sxy") => ({ min: -M, max: M, step: niceStep(2 * M, init[key]) });

  return (
    <div className="grid gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[480px] select-none rounded-2xl border border-border bg-surface" role="img" aria-label={`Plane stress element: sigma_xx = ${fmtNum(sxx)}, sigma_yy = ${fmtNum(syy)}, sigma_xy = ${fmtNum(sxy)} ${unit}${cut ? `, with a cut whose normal is at ${fmtNum(theta, 3)} degrees` : ""}`}>
        {/* axes */}
        <g opacity={0.9}>
          <PxArrow from={[-CX + 28, -(H - CY) + 26]} to={[-CX + 70, -(H - CY) + 26]} color="var(--muted)" width={1.6} head={7} />
          <PxArrow from={[-CX + 28, -(H - CY) + 26]} to={[-CX + 28, -(H - CY) + 68]} color="var(--muted)" width={1.6} head={7} />
          <text x={74} y={H - 22} fontSize={12} fill="var(--muted)" fontStyle="italic">
            x
          </text>
          <text x={24} y={H - 72} fontSize={12} fill="var(--muted)" fontStyle="italic">
            y
          </text>
        </g>

        {/* the element */}
        <rect x={CX - A} y={CY - A} width={2 * A} height={2 * A} fill="var(--surface-2)" stroke="var(--text)" strokeWidth={1.6} strokeDasharray={cut ? "5 4" : undefined} />
        {cut && <polygon points={kept.map((p) => px(p).join(",")).join(" ")} fill="var(--purple)" fillOpacity={0.14} stroke="var(--text)" strokeWidth={1.6} />}

        <g opacity={fade}>
          <FaceArrows sxx={sxx} syy={syy} sxy={sxy} M={M} />
          {showLbl(sxx) && <SymLabel at={[xxTip + 5, -4]} sym="σ" sub="xx" value={fmtNum(sxx, 3)} color="var(--blue)" />}
          {showLbl(syy) && <SymLabel at={[0, yyTip + 7]} sym="σ" sub="yy" value={fmtNum(syy, 3)} color="var(--orange)" anchor="middle" />}
          {showLbl(sxy) && <SymLabel at={[A + OFF + 6, sxy >= 0 ? shHalf - 4 : -shHalf - 12]} sym="σ" sub="xy" value={fmtNum(sxy, 3)} color="var(--purple)" />}
          {showLbl(sxy) && <SymLabel at={[sxy >= 0 ? shHalf + 6 : -shHalf - 6, A + OFF - 4]} sym="σ" sub="yx" value={fmtNum(sxy, 3)} color="var(--purple)" anchor={sxy >= 0 ? "start" : "end"} />}
        </g>

        {cut && (
          <g>
            <line x1={c1[0]} y1={c1[1]} x2={c2[0]} y2={c2[1]} stroke="var(--purple)" strokeWidth={3} strokeLinecap="round" />
            <line x1={CX} y1={CY} x2={CX + 34} y2={CY} stroke="var(--muted)" strokeWidth={1.2} strokeDasharray="3 3" />
            {theta > 0.5 && <path d={`M ${CX + arcR} ${CY} A ${arcR} ${arcR} 0 ${theta > 180 ? 1 : 0} 0 ${arcEnd[0]} ${arcEnd[1]}`} fill="none" stroke="var(--muted)" strokeWidth={1.3} />}
            {theta > 8 && (
              <text x={thetaLbl[0]} y={thetaLbl[1] + 4} fontSize={11} fill="var(--muted)" textAnchor="middle" fontStyle="italic">
                θ
              </text>
            )}
            <PxArrow from={[0, 0]} to={[n[0] * 44, n[1] * 44]} color="var(--muted)" width={1.6} head={8} />
            <PxArrow from={[0, 0]} to={snVec} color="var(--primary)" width={2.2} head={8} dashed />
            <PxArrow from={[0, 0]} to={tauVec} color="var(--danger)" width={2.2} head={8} dashed />
            <PxArrow from={[0, 0]} to={tVec} color="var(--teal)" width={3.4} head={11} />
            <text x={nLbl[0]} y={nLbl[1] + 4} fontSize={12.5} fontWeight={700} textAnchor="middle" fill="var(--muted)" style={HALO}>
              n
            </text>
            {tLen > 6 && (
              <text x={tLbl[0]} y={tLbl[1] + 4} fontSize={13} fontWeight={700} textAnchor="middle" fill="var(--teal)" style={HALO}>
                t
              </text>
            )}
          </g>
        )}
      </svg>

      <div className="mx-auto grid w-full max-w-[480px] gap-2 rounded-2xl border border-border bg-surface-2/60 p-3 text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <TeX tex={`\\boldsymbol{\\sigma}=\\begin{bmatrix}\\sigma_{xx} & \\sigma_{xy}\\\\ \\sigma_{yx} & \\sigma_{yy}\\end{bmatrix}=\\begin{bmatrix}${texNum(sxx)} & ${texNum(sxy)}\\\\ ${texNum(sxy)} & ${texNum(syy)}\\end{bmatrix}${unitTex}`} />
          {!unitTex && unit && <span className="text-muted">{unit}</span>}
        </div>
        {config.sliders && (
          <div className="grid gap-1.5">
            <SliderRow label={`σxx = ${fmtNum(sxx, 4)}`} {...slider("sxx")} value={sxx} disabled={disabled} accent="blue" aria="sigma xx" onChange={(v) => setS((c) => ({ ...c, sxx: v }))} />
            <SliderRow label={`σyy = ${fmtNum(syy, 4)}`} {...slider("syy")} value={syy} disabled={disabled} accent="orange" aria="sigma yy" onChange={(v) => setS((c) => ({ ...c, syy: v }))} />
            <SliderRow label={`σxy = ${fmtNum(sxy, 4)}`} {...slider("sxy")} value={sxy} disabled={disabled} accent="purple" aria="sigma xy" onChange={(v) => setS((c) => ({ ...c, sxy: v }))} />
          </div>
        )}
        {cut && (
          <div className="grid gap-1.5">
            {cut.slider && <SliderRow label={`θ = ${fmtNum(theta, 3)}°`} min={0} max={thetaMax} step={1} value={theta} disabled={disabled} accent="teal" aria="angle of the cut normal" onChange={setTheta} />}
            <div className="text-xs text-muted">
              Normal n at θ = {fmtNum(theta, 3)}° from +x · the cut line makes {fmtNum(cutToX, 3)}° with the x-axis · the shaded part is kept.
            </div>
            <div className="overflow-x-auto">
              <TeX tex={`n=(\\cos\\theta,\\ \\sin\\theta)=(${texNum(n[0], 3)},\\ ${texNum(n[1], 3)}),\\quad s=(-\\sin\\theta,\\ \\cos\\theta)`} />
            </div>
            <div className="overflow-x-auto text-teal">
              <TeX tex={`t=\\boldsymbol{\\sigma}n=(\\sigma_{xx}\\cos\\theta+\\sigma_{xy}\\sin\\theta,\\ \\sigma_{xy}\\cos\\theta+\\sigma_{yy}\\sin\\theta)=(${texNum(tr.t[0])},\\ ${texNum(tr.t[1])})`} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[13px]">
              <span className="text-primary">σn = t·n = {fmtNum(tr.sn, 4)}</span>
              <span className="text-danger">τ = t·s = {fmtNum(tr.tau, 4)}</span>
              <span className="text-muted">
                |t| = {fmtNum(Math.hypot(tr.t[0], tr.t[1]), 4)} {unit}
              </span>
            </div>
          </div>
        )}
        <div className="text-xs text-muted">
          First index = the face&apos;s normal, second = the force direction. Positive components point in + directions on the labelled + faces and in − directions on the opposite faces (σxy = σyx).
          {cut && " Dashed green = normal part σn n, dashed red = shear part τ s of the traction t."}
        </div>
      </div>
    </div>
  );
}
