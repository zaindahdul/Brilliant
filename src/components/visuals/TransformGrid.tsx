"use client";

import { useEffect, useMemo, useState } from "react";
import type { TransformConfig } from "@/content/types";
import { apply2, det2, eigen2, type Mat2, type Vec2 } from "@/lib/linalg";
import { Arrow, ArrowDefs, Grid, colorVar, fmt, makePlane } from "./plane";
import { Math as TeX } from "@/components/ui/RichText";
import { cn } from "@/lib/cn";

interface Props {
  config: TransformConfig;
  onGoal?: (satisfied: boolean, detail?: string) => void;
  disabled?: boolean;
}

const SHAPES: Record<NonNullable<TransformConfig["shape"]>, Vec2[]> = {
  square: [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ],
  house: [
    [0, 0],
    [1.5, 0],
    [1.5, 1],
    [0.75, 1.6],
    [0, 1],
  ],
  f: [
    [0, 0],
    [0.4, 0],
    [0.4, 0.8],
    [1, 0.8],
    [1, 1.2],
    [0.4, 1.2],
    [0.4, 1.6],
    [1.2, 1.6],
    [1.2, 2],
    [0, 2],
  ],
  none: [],
};

function lerp(a: Mat2, b: Mat2, t: number): Mat2 {
  return [
    [a[0][0] + (b[0][0] - a[0][0]) * t, a[0][1] + (b[0][1] - a[0][1]) * t],
    [a[1][0] + (b[1][0] - a[1][0]) * t, a[1][1] + (b[1][1] - a[1][1]) * t],
  ];
}

const I: Mat2 = [
  [1, 0],
  [0, 1],
];

export function TransformGrid({ config, onGoal, disabled = false }: Props) {
  const range = config.range ?? 4;
  const plane = useMemo(() => makePlane(range), [range]);
  const [m, setM] = useState<Mat2>(config.matrix);
  const [t, setT] = useState(config.animate ? 0 : 1);
  const [entryText, setEntryText] = useState<string[]>(() => config.matrix.flat().map((x) => String(x)));

  const shown = useMemo(() => lerp(I, m, t), [m, t]);
  const d = det2(m);

  useEffect(() => {
    const g = config.goal;
    if (!g) return;
    const tol = g.tolerance ?? 1e-6;
    if (g.type === "matrix-equals") {
      const ok = m.flat().every((x, i) => Math.abs(x - g.target.flat()[i]) <= tol);
      onGoal?.(ok);
    } else if (g.type === "det-equals") {
      onGoal?.(Math.abs(d - g.target) <= tol);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m]);

  const setEntry = (i: number, raw: string) => {
    const next = [...entryText];
    next[i] = raw;
    setEntryText(next);
    const v = Number(raw);
    if (raw.trim() !== "" && Number.isFinite(v)) {
      const flat = m.flat();
      flat[i] = v;
      setM([
        [flat[0], flat[1]],
        [flat[2], flat[3]],
      ]);
    }
  };

  const setSlider = (i: number, v: number) => {
    const flat = m.flat();
    flat[i] = v;
    const next: Mat2 = [
      [flat[0], flat[1]],
      [flat[2], flat[3]],
    ];
    setM(next);
    setEntryText(next.flat().map((x) => String(x)));
  };

  // transformed grid lines
  const R = range + 2;
  const gridLines: React.ReactNode[] = [];
  for (let i = -R; i <= R; i++) {
    const v1 = apply2(shown, [i, -R]);
    const v2 = apply2(shown, [i, R]);
    const h1 = apply2(shown, [-R, i]);
    const h2 = apply2(shown, [R, i]);
    const [x1, y1] = plane.toPx(v1);
    const [x2, y2] = plane.toPx(v2);
    const [x3, y3] = plane.toPx(h1);
    const [x4, y4] = plane.toPx(h2);
    const axis = i === 0;
    gridLines.push(<line key={`tv${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--blue)" strokeWidth={axis ? 2 : 1} opacity={axis ? 0.8 : 0.35} />);
    gridLines.push(<line key={`th${i}`} x1={x3} y1={y3} x2={x4} y2={y4} stroke="var(--orange)" strokeWidth={axis ? 2 : 1} opacity={axis ? 0.8 : 0.35} />);
  }

  const shape = SHAPES[config.shape ?? "square"];
  const e1 = apply2(shown, [1, 0]);
  const e2 = apply2(shown, [0, 1]);
  const eig = config.showEigen ? eigen2(m) : null;

  return (
    <div className="grid gap-3">
      <svg viewBox={`0 0 ${plane.size} ${plane.size}`} className="mx-auto w-full max-w-[420px] select-none rounded-2xl border border-border bg-surface" role="img" aria-label="Linear transformation of the plane">
        <ArrowDefs ids={["blue", "orange", "green", "purple", "gray", "teal"]} />
        <Grid plane={plane} faint />
        <g>{gridLines}</g>

        {shape.length > 0 && (
          <>
            <polygon points={shape.map((p) => plane.toPx(p).join(",")).join(" ")} fill="var(--muted)" opacity={0.15} stroke="var(--muted)" strokeDasharray="4 4" />
            <polygon points={shape.map((p) => plane.toPx(apply2(shown, p)).join(",")).join(" ")} fill="var(--purple)" opacity={0.28} stroke="var(--purple)" strokeWidth={2} />
          </>
        )}

        {eig && eig.real &&
          eig.vectors.map((v, i) => {
            const L = range * 3;
            const [x1, y1] = plane.toPx([v[0] * L, v[1] * L]);
            const [x2, y2] = plane.toPx([-v[0] * L, -v[1] * L]);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--teal)" strokeWidth={3} opacity={0.5} strokeDasharray="8 6" />;
          })}

        {config.vectors?.map((v) => {
          const img = apply2(shown, [v.x, v.y]);
          return (
            <g key={v.id}>
              <Arrow plane={plane} from={[0, 0]} to={[v.x, v.y]} color="gray" dashed opacity={0.6} label={v.label} />
              <Arrow plane={plane} from={[0, 0]} to={img} color={v.color ?? "purple"} label={v.label ? `T(${v.label})` : undefined} />
            </g>
          );
        })}

        <Arrow plane={plane} from={[0, 0]} to={e1} color="blue" label="T(e₁)" />
        <Arrow plane={plane} from={[0, 0]} to={e2} color="orange" label="T(e₂)" />
      </svg>

      <div className="mx-auto grid w-full max-w-[420px] gap-3 rounded-2xl border border-border bg-surface-2/60 p-3">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg">A =</span>
            {config.editable ? (
              <div className="grid grid-cols-2 gap-1">
                {entryText.map((v, i) => (
                  <input
                    key={i}
                    aria-label={`entry ${i + 1}`}
                    value={v}
                    disabled={disabled}
                    onChange={(e) => setEntry(i, e.target.value)}
                    className="h-10 w-14 rounded-lg border-2 border-border-strong bg-surface text-center font-mono text-sm focus:border-blue focus:outline-none"
                  />
                ))}
              </div>
            ) : (
              <TeX tex={`\\begin{bmatrix}${fmt(m[0][0])}&${fmt(m[0][1])}\\\\${fmt(m[1][0])}&${fmt(m[1][1])}\\end{bmatrix}`} />
            )}
          </div>
          {config.showDet !== false && (
            <div className={cn("rounded-xl px-3 py-1.5 font-mono text-sm", Math.abs(d) < 1e-9 ? "bg-danger-soft text-danger-ink" : d < 0 ? "bg-purple-soft text-purple" : "bg-primary-soft text-primary-ink")}>
              det A = {fmt(d)} {Math.abs(d) < 1e-9 ? "· collapses!" : d < 0 ? "· flips orientation" : ""}
            </div>
          )}
        </div>

        {config.sliders && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {["a", "b", "c", "d"].map((name, i) => (
              <label key={name} className="flex items-center gap-2 text-xs">
                <span className="w-10 font-mono">
                  {name} = {fmt(m.flat()[i])}
                </span>
                <input type="range" min={-3} max={3} step={0.5} value={m.flat()[i]} disabled={disabled} onChange={(e) => setSlider(i, Number(e.target.value))} className="flex-1 accent-[var(--blue)]" />
              </label>
            ))}
          </div>
        )}

        {config.animate && (
          <label className="flex items-center gap-3 text-sm">
            <span className="w-28">Apply: {Math.round(t * 100)}%</span>
            <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} className="flex-1 accent-[var(--purple)]" />
          </label>
        )}

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-mono">
          <span style={{ color: colorVar("blue") }}>T(e₁) = ({fmt(e1[0])}, {fmt(e1[1])})</span>
          <span style={{ color: colorVar("orange") }}>T(e₂) = ({fmt(e2[0])}, {fmt(e2[1])})</span>
          {eig && (eig.real ? <span className="text-teal">λ = {fmt(eig.values[0])}, {fmt(eig.values[1])}</span> : <span className="text-teal">no real eigenvectors (rotation-like)</span>)}
        </div>
      </div>
    </div>
  );
}
