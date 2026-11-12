"use client";

/** Small pieces shared by the later solid-mechanics visuals. */

export function finite(x: unknown, fallback = 0): number {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/** A number for a label: up to `sig` significant figures, a real minus sign, no exponent for everyday sizes. */
export function fmt(x: number, sig = 3): string {
  if (!Number.isFinite(x)) return "–";
  if (Math.abs(x) < 1e-12) return "0";
  const ax = Math.abs(x);
  let s: string;
  if (ax >= 1e6 || ax < 1e-3) {
    const [m, e] = x.toExponential(sig - 1).split("e");
    s = `${Number(m)}×10^${Number(e)}`;
  } else {
    s = String(Number(x.toPrecision(sig)));
  }
  return s.replace("-", "−");
}

export function withUnit(value: string, unit?: string): string {
  return unit ? `${value} ${unit}` : value;
}

export const HALO = { paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3.5, strokeLinejoin: "round" } as const;

/** An arrow in SVG pixel coordinates. Draws nothing when shorter than a pixel. */
export function Arrow({ x1, y1, x2, y2, color, width = 2.2, head = 8 }: { x1: number; y1: number; x2: number; y2: number; color: string; width?: number; head?: number }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (!(len >= 1)) return null;
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

/** Text colour for a slider's label, matching the colour that quantity has in the drawing. */
const TONE = {
  blue: "text-blue",
  orange: "text-orange",
  teal: "text-teal",
  purple: "text-purple",
  green: "text-primary",
  plain: "",
} as const;

/**
 * A labelled range input. Every slider uses the same track colour (browsers redraw
 * the track differently for light and dark accent colours, which looks uneven);
 * the label carries the quantity's colour instead.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
  accent = "plain",
  aria,
}: {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  accent?: keyof typeof TONE;
  aria: string;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <span className={`w-40 shrink-0 font-medium tabular-nums ${TONE[accent]}`}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} aria-label={aria} onChange={(e) => onChange(Number(e.target.value))} className="min-w-0 flex-1 accent-[var(--blue)] disabled:opacity-50" />
    </label>
  );
}

/** The frame every visual sits in: the drawing, then its controls and read-outs. */
export function VisualFrame({ children, controls }: { children: React.ReactNode; controls?: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[520px] gap-3">
      {children}
      {controls && <div className="grid gap-2">{controls}</div>}
    </div>
  );
}

export const SVG_CLASS = "w-full select-none rounded-2xl border border-border bg-surface";

/**
 * The detailed read-outs of a visual (formulas, tables, conventions), closed until the
 * learner asks for them so the drawing and its sliders stay the focus.
 */
export function MoreNumbers({ children, label = "Show the numbers" }: { children: React.ReactNode; label?: string }) {
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-text [&::-webkit-details-marker]:hidden">
        {label}
        <svg viewBox="0 0 16 16" width={14} height={14} className="transition-transform group-open:rotate-180" aria-hidden>
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="mt-2 grid gap-2.5 rounded-xl bg-surface-2 p-3 text-sm">{children}</div>
    </details>
  );
}
