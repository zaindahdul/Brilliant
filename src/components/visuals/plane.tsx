"use client";

import { useCallback, useMemo, useRef } from "react";
import type { DataColor } from "@/content/types";

/** Shared helpers for square SVG coordinate planes. */
export const SIZE = 400;

export interface Plane {
  size: number;
  range: number;
  unit: number;
  toPx: (p: [number, number]) => [number, number];
  toMath: (px: number, py: number) => [number, number];
}

export function makePlane(range: number, size = SIZE): Plane {
  const unit = size / (2 * range);
  return {
    size,
    range,
    unit,
    toPx: ([x, y]) => [size / 2 + x * unit, size / 2 - y * unit],
    toMath: (px, py) => [(px - size / 2) / unit, (size / 2 - py) / unit],
  };
}

export function colorVar(c: DataColor | undefined, fallback: DataColor = "blue"): string {
  const key = c ?? fallback;
  if (key === "gray") return "var(--muted)";
  if (key === "green") return "var(--primary)";
  return `var(--${key})`;
}

export function snapTo(v: number, step: number): number {
  return Math.round(v / step) * step;
}

export function fmt(x: number, digits = 2): string {
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
  return x.toFixed(digits).replace(/\.?0+$/, "");
}

/**
 * Pointer-drag helper. Returns props for the SVG root plus a function to start
 * dragging a named handle. `onMove` receives math coordinates.
 */
export function useDrag(plane: Plane, onMove: (id: string, p: [number, number]) => void, onEnd?: (id: string) => void) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const active = useRef<string | null>(null);

  const toMathFromEvent = useCallback(
    (e: { clientX: number; clientY: number }): [number, number] | null => {
      const el = svgRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * plane.size;
      const py = ((e.clientY - rect.top) / rect.height) * plane.size;
      return plane.toMath(px, py);
    },
    [plane],
  );

  const start = useCallback(
    (id: string) => (e: React.PointerEvent) => {
      e.preventDefault();
      active.current = id;
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      const p = toMathFromEvent(e);
      if (p) onMove(id, p);
    },
    [onMove, toMathFromEvent],
  );

  const svgProps = useMemo(
    () => ({
      ref: svgRef,
      onPointerMove: (e: React.PointerEvent) => {
        if (!active.current) return;
        const p = toMathFromEvent(e);
        if (p) onMove(active.current, p);
      },
      onPointerUp: () => {
        if (active.current) onEnd?.(active.current);
        active.current = null;
      },
      onPointerCancel: () => {
        active.current = null;
      },
      onPointerLeave: () => {
        /* keep dragging while captured */
      },
    }),
    [onMove, onEnd, toMathFromEvent],
  );

  return { svgProps, start };
}

export function Grid({ plane, faint = false }: { plane: Plane; faint?: boolean }) {
  const lines: React.ReactNode[] = [];
  const R = Math.ceil(plane.range);
  for (let i = -R; i <= R; i++) {
    const [x] = plane.toPx([i, 0]);
    const [, y] = plane.toPx([0, i]);
    const stroke = i === 0 ? "var(--canvas-axis)" : "var(--canvas-grid)";
    const w = i === 0 ? 1.5 : 1;
    lines.push(<line key={`v${i}`} x1={x} y1={0} x2={x} y2={plane.size} stroke={stroke} strokeWidth={w} opacity={faint ? 0.5 : 1} />);
    lines.push(<line key={`h${i}`} x1={0} y1={y} x2={plane.size} y2={y} stroke={stroke} strokeWidth={w} opacity={faint ? 0.5 : 1} />);
  }
  // tick labels on axes
  const labels: React.ReactNode[] = [];
  for (let i = -R; i <= R; i++) {
    if (i === 0 || Math.abs(i) === R) continue;
    const [x, y0] = plane.toPx([i, 0]);
    const [x0, y] = plane.toPx([0, i]);
    labels.push(
      <text key={`tx${i}`} x={x} y={y0 + 13} fontSize={10} textAnchor="middle" fill="var(--muted)">
        {i}
      </text>,
    );
    labels.push(
      <text key={`ty${i}`} x={x0 - 6} y={y + 4} fontSize={10} textAnchor="end" fill="var(--muted)">
        {i}
      </text>,
    );
  }
  return (
    <g>
      {lines}
      {labels}
    </g>
  );
}

export function ArrowDefs({ ids }: { ids: string[] }) {
  return (
    <defs>
      {ids.map((id) => (
        <marker key={id} id={`arrow-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={id === "gray" ? "var(--muted)" : id === "green" ? "var(--primary)" : `var(--${id})`} />
        </marker>
      ))}
    </defs>
  );
}

export function Arrow({
  plane,
  from,
  to,
  color = "blue",
  dashed = false,
  width = 3,
  label,
  opacity = 1,
}: {
  plane: Plane;
  from: [number, number];
  to: [number, number];
  color?: DataColor;
  dashed?: boolean;
  width?: number;
  label?: string;
  opacity?: number;
}) {
  const [x1, y1] = plane.toPx(from);
  const [x2, y2] = plane.toPx(to);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 0.5) return null;
  // shorten so the arrowhead tip lands exactly on the point
  const k = Math.max(0, (len - 6) / len);
  const ex = x1 + (x2 - x1) * k;
  const ey = y1 + (y2 - y1) * k;
  const stroke = colorVar(color);
  const lx = x2 + ((x2 - x1) / len) * 12;
  const ly = y2 + ((y2 - y1) / len) * 12;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={stroke} strokeWidth={width} strokeDasharray={dashed ? "6 5" : undefined} strokeLinecap="round" markerEnd={`url(#arrow-${color})`} />
      {label && (
        <text x={lx} y={ly + 4} fontSize={13} fontWeight={600} textAnchor="middle" fill={stroke} style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3 }}>
          {label}
        </text>
      )}
    </g>
  );
}

export function Handle({ plane, at, color = "blue", onPointerDown, label }: { plane: Plane; at: [number, number]; color?: DataColor; onPointerDown: (e: React.PointerEvent) => void; label?: string }) {
  const [x, y] = plane.toPx(at);
  return (
    <g style={{ cursor: "grab", touchAction: "none" }} onPointerDown={onPointerDown} aria-label={label ?? "drag handle"} role="button">
      <circle cx={x} cy={y} r={16} fill="transparent" />
      <circle cx={x} cy={y} r={7} fill="var(--surface)" stroke={colorVar(color)} strokeWidth={3} />
    </g>
  );
}
