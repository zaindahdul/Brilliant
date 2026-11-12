"use client";

import { useState } from "react";
import type { MohrCircleConfig } from "@/content/types";
import { Arrow, HALO, SVG_CLASS, Slider, VisualFrame, clamp, finite, fmt, withUnit } from "./shared";

interface Props {
  config: MohrCircleConfig;
  disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/* Mechanics (pure, exported for tests)                                */
/* ------------------------------------------------------------------ */

/** Components in axes turned counter-clockwise by `thetaDeg` (Govindjee eqs 9.23–9.25). */
export function transformPlane(sxx: number, syy: number, sxy: number, thetaDeg: number) {
  const t = (2 * thetaDeg * Math.PI) / 180;
  const m = (sxx + syy) / 2;
  const d = (sxx - syy) / 2;
  return {
    xx: m + d * Math.cos(t) + sxy * Math.sin(t),
    yy: m - d * Math.cos(t) - sxy * Math.sin(t),
    xy: -d * Math.sin(t) + sxy * Math.cos(t),
  };
}

/** Centre, radius, principal values and the principal angle (degrees, counter-clockwise from x to the direction of s1). */
export function principalPlane(sxx: number, syy: number, sxy: number) {
  const m = (sxx + syy) / 2;
  const d = (sxx - syy) / 2;
  const R = Math.hypot(d, sxy);
  const thetaP = R < 1e-12 ? 0 : (Math.atan2(sxy, d) * 90) / Math.PI;
  return { m, R, s1: m + R, s2: m - R, thetaP };
}

function niceCeil(x: number): number {
  if (!(x > 0)) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(x)));
  for (const k of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (k * e >= x - 1e-9) return k * e;
  return 10 * e;
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const W = 520;
const H = 300;
const EX = 104; // element centre
const EY = 150;
const EH = 34; // element half side
const CX = 372; // circle plot centre (sigma = 0, tau = 0 sits here when the plot is symmetric)
const CY = 150;
const HALF = 112; // half-size of the plot in pixels

export function MohrCircle({ config, disabled = false }: Props) {
  const strain = config.quantity === "strain";
  const unit = config.unit ?? "";
  const s0 = { xx: finite(config.sxx), yy: finite(config.syy), xy: finite(config.sxy) };
  const [sxx, setSxx] = useState(s0.xx);
  const [syy, setSyy] = useState(s0.yy);
  const [sxy, setSxy] = useState(s0.xy);
  const [theta, setTheta] = useState(clamp(finite(config.theta), -90, 90));

  const p0 = principalPlane(s0.xx, s0.yy, s0.xy);
  const max = finite(config.max) > 0 ? finite(config.max) : niceCeil(Math.max(Math.abs(s0.xx), Math.abs(s0.yy), Math.abs(s0.xy), p0.R, 1));
  const step = max / 20;

  const p = principalPlane(sxx, syy, sxy);
  const r = transformPlane(sxx, syy, sxy, theta);
  const ext = niceCeil(Math.max(Math.abs(p.m) + p.R, p.R, max * 0.25));
  const k = HALF / ext; // pixels per unit
  const px = (s: number) => CX + s * k;
  const py = (t: number) => CY + t * k; // shear plotted positive DOWN

  const sym = strain ? "ε" : "σ";
  const shearSym = strain ? "γ/2" : "τ";
  const val = (x: number) => withUnit(fmt(x), unit);

  // element axes in screen coordinates
  const th = (theta * Math.PI) / 180;
  const ex = { x: Math.cos(th), y: -Math.sin(th) };
  const ey = { x: -Math.sin(th), y: -Math.cos(th) };
  const corner = (a: number, b: number) => `${EX + EH * (a * ex.x + b * ey.x)},${EY + EH * (a * ex.y + b * ey.y)}`;
  const alen = (s: number) => (Math.abs(s) < 1e-9 * ext ? 0 : clamp((34 * Math.abs(s)) / ext, 7, 34));

  /** Normal-stress arrow on the face whose outward normal is n: outward for tension, inward for compression. */
  const normalArrow = (n: { x: number; y: number }, s: number, color: string, key: string) => {
    const L = alen(s);
    if (L === 0) return null;
    // start clear of the shear arrow that lies along the same face
    const a = { x: EX + n.x * (EH + 12), y: EY + n.y * (EH + 12) };
    const b = { x: EX + n.x * (EH + 12 + L), y: EY + n.y * (EH + 12 + L) };
    return s > 0 ? <Arrow key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} color={color} /> : <Arrow key={key} x1={b.x} y1={b.y} x2={a.x} y2={a.y} color={color} />;
  };
  /** Shear arrow lying along face n, pointing along t for positive shear. */
  const shearArrow = (n: { x: number; y: number }, t: { x: number; y: number }, s: number, key: string) => {
    const L = alen(s);
    if (L === 0) return null;
    const c = { x: EX + n.x * (EH + 6), y: EY + n.y * (EH + 6) };
    const sg = s > 0 ? 1 : -1;
    return <Arrow key={key} x1={c.x - (sg * t.x * L) / 2} y1={c.y - (sg * t.y * L) / 2} x2={c.x + (sg * t.x * L) / 2} y2={c.y + (sg * t.y * L) / 2} color="var(--purple)" width={1.8} head={6} />;
  };
  const neg = (v: { x: number; y: number }) => ({ x: -v.x, y: -v.y });

  // arc from the x-face point X to the rotated point X' (screen angle of X' is 2(theta - thetaP), counter-clockwise)
  const a0 = (-2 * p.thetaP * Math.PI) / 180;
  const a1 = a0 + 2 * th;
  const arcR = Math.min(p.R * k * 0.45, 26);
  const arc =
    p.R * k > 12 && Math.abs(theta) > 0.5
      ? `M ${px(p.m) + arcR * Math.cos(a0)} ${CY - arcR * Math.sin(a0)} A ${arcR} ${arcR} 0 ${Math.abs(2 * th) > Math.PI ? 1 : 0} ${theta > 0 ? 0 : 1} ${px(p.m) + arcR * Math.cos(a1)} ${CY - arcR * Math.sin(a1)}`
      : null;

  return (
    <VisualFrame
      controls={
        <>
          {config.sliders && (
            <div className="grid gap-1.5">
              <Slider label={`${sym}xx = ${val(sxx)}`} min={-max} max={max} step={step} value={sxx} onChange={setSxx} disabled={disabled} accent="blue" aria={`${sym} x x`} />
              <Slider label={`${sym}yy = ${val(syy)}`} min={-max} max={max} step={step} value={syy} onChange={setSyy} disabled={disabled} accent="orange" aria={`${sym} y y`} />
              <Slider label={`${strain ? "εxy" : "σxy"} = ${val(sxy)}`} min={-max} max={max} step={step} value={sxy} onChange={setSxy} disabled={disabled} accent="purple" aria="shear component" />
              <Slider label={`θ = ${fmt(theta)}°`} min={-90} max={90} step={1} value={theta} onChange={setTheta} disabled={disabled} accent="green" aria="rotation of the axes in degrees" />
            </div>
          )}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm tabular-nums sm:grid-cols-3">
            <Readout label="centre" value={val(p.m)} />
            <Readout label="radius" value={val(p.R)} />
            <Readout label="θp" value={`${fmt(p.thetaP)}°`} />
            <Readout label={`${sym}1`} value={val(p.s1)} />
            <Readout label={`${sym}2`} value={val(p.s2)} />
            <Readout label={`max ${shearSym}`} value={val(p.R)} />
          </dl>
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className={SVG_CLASS} role="img" aria-label={`Mohr's circle: centre ${fmt(p.m)}, radius ${fmt(p.R)}, principal values ${fmt(p.s1)} and ${fmt(p.s2)} ${unit}`}>
        {/* element, turned by theta */}
        <text x={EX} y={24} fontSize={11.5} fontWeight={600} textAnchor="middle" fill="var(--muted)">
          {`element turned ${fmt(theta)}°`}
        </text>
        <line x1={EX - 78} y1={EY} x2={EX + 78} y2={EY} stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="3 4" />
        <line x1={EX} y1={EY - 78} x2={EX} y2={EY + 78} stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="3 4" />
        <polygon points={`${corner(1, 1)} ${corner(-1, 1)} ${corner(-1, -1)} ${corner(1, -1)}`} fill="var(--surface-2)" stroke="var(--text)" strokeWidth={1.5} />
        {!strain && (
          <g>
            {[normalArrow(ex, r.xx, "var(--blue)", "nx+"), normalArrow(neg(ex), r.xx, "var(--blue)", "nx-"), normalArrow(ey, r.yy, "var(--orange)", "ny+"), normalArrow(neg(ey), r.yy, "var(--orange)", "ny-")]}
            {[shearArrow(ex, ey, r.xy, "sx+"), shearArrow(neg(ex), neg(ey), r.xy, "sx-"), shearArrow(ey, ex, r.xy, "sy+"), shearArrow(neg(ey), neg(ex), r.xy, "sy-")]}
          </g>
        )}
        <text x={EX + ex.x * (EH + 58)} y={EY + ex.y * (EH + 58) + 4} fontSize={12} fontStyle="italic" textAnchor="middle" fill="var(--text)" style={HALO}>
          x′
        </text>
        <text x={EX + ey.x * (EH + 58)} y={EY + ey.y * (EH + 58) + 4} fontSize={12} fontStyle="italic" textAnchor="middle" fill="var(--text)" style={HALO}>
          y′
        </text>
        <text x={EX} y={H - 40} fontSize={11.5} textAnchor="middle" fill="var(--blue)">{`${sym}x′x′ = ${val(r.xx)}`}</text>
        <text x={EX} y={H - 25} fontSize={11.5} textAnchor="middle" fill="var(--orange)">{`${sym}y′y′ = ${val(r.yy)}`}</text>
        <text x={EX} y={H - 10} fontSize={11.5} textAnchor="middle" fill="var(--purple)">{`${strain ? "εx′y′" : "σx′y′"} = ${val(r.xy)}`}</text>

        {/* the circle */}
        <line x1={CX - HALF - 14} y1={CY} x2={CX + HALF + 14} y2={CY} stroke="var(--canvas-axis)" strokeWidth={1} />
        <line x1={CX} y1={CY - HALF - 8} x2={CX} y2={CY + HALF + 8} stroke="var(--canvas-axis)" strokeWidth={1} />
        <text x={CX + HALF + 18} y={CY + 4} fontSize={12} fontStyle="italic" fill="var(--muted)">
          {sym}
        </text>
        <text x={CX + 6} y={CY + HALF + 20} fontSize={11.5} fill="var(--muted)">
          {`${shearSym} (down)`}
        </text>
        <circle cx={px(p.m)} cy={CY} r={Math.max(p.R * k, 0.5)} fill="var(--blue)" fillOpacity={0.06} stroke="var(--text)" strokeWidth={1.4} />
        <circle cx={px(p.m)} cy={CY} r={2.5} fill="var(--text)" />
        {/* the original axes: X and Y at the ends of a diameter */}
        <line x1={px(sxx)} y1={py(sxy)} x2={px(syy)} y2={py(-sxy)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="4 3" />
        <circle cx={px(sxx)} cy={py(sxy)} r={3.5} fill="var(--muted)" />
        <text x={px(sxx) + 7} y={py(sxy) + (sxy >= 0 ? 14 : -7)} fontSize={11.5} fontWeight={600} fill="var(--muted)" style={HALO}>
          X
        </text>
        <circle cx={px(syy)} cy={py(-sxy)} r={3.5} fill="var(--muted)" />
        <text x={px(syy) - 15} y={py(-sxy) + (sxy >= 0 ? -7 : 14)} fontSize={11.5} fontWeight={600} fill="var(--muted)" style={HALO}>
          Y
        </text>
        {/* the turned axes */}
        {arc && <path d={arc} fill="none" stroke="var(--primary)" strokeWidth={1.6} />}
        <line x1={px(r.xx)} y1={py(r.xy)} x2={px(r.yy)} y2={py(-r.xy)} stroke="var(--primary)" strokeWidth={1.6} />
        <circle cx={px(r.xx)} cy={py(r.xy)} r={4.5} fill="var(--blue)" />
        <circle cx={px(r.yy)} cy={py(-r.xy)} r={4.5} fill="var(--orange)" />
        {/* principal values */}
        <circle cx={px(p.s1)} cy={CY} r={3} fill="var(--surface)" stroke="var(--text)" strokeWidth={1.4} />
        <circle cx={px(p.s2)} cy={CY} r={3} fill="var(--surface)" stroke="var(--text)" strokeWidth={1.4} />
        <text x={px(p.s1) + 6} y={CY - 7} fontSize={11.5} fontWeight={600} fill="var(--text)" style={HALO}>
          {`${sym}1`}
        </text>
        <text x={px(p.s2) - 6} y={CY - 7} fontSize={11.5} fontWeight={600} textAnchor="end" fill="var(--text)" style={HALO}>
          {`${sym}2`}
        </text>
      </svg>
    </VisualFrame>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border py-1">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
