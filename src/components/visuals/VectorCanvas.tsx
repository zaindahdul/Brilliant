"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VectorsConfig, VectorSpec } from "@/content/types";
import { Arrow, ArrowDefs, Grid, Handle, colorVar, fmt, makePlane, snapTo, useDrag } from "./plane";
import { Math as TeX } from "@/components/ui/RichText";

interface Props {
  config: VectorsConfig;
  onGoal?: (satisfied: boolean, detail?: string) => void;
  disabled?: boolean;
}

type V = { id: string; x: number; y: number; spec: VectorSpec };

function evalGoal(config: VectorsConfig, vecs: V[], comb: { a: number; b: number }): boolean {
  const g = config.goal;
  if (!g) return true;
  const tol = g.tolerance ?? 1e-6;
  const get = (id: string) => vecs.find((v) => v.id === id);
  const close = (p: [number, number], q: [number, number]) => Math.abs(p[0] - q[0]) <= tol && Math.abs(p[1] - q[1]) <= tol;
  switch (g.type) {
    case "vector-equals": {
      const v = get(g.id);
      return !!v && close([v.x, v.y], g.target);
    }
    case "sum-equals": {
      const s = g.of.reduce<[number, number]>((acc, id) => {
        const v = get(id);
        return v ? [acc[0] + v.x, acc[1] + v.y] : acc;
      }, [0, 0]);
      return close(s, g.target);
    }
    case "combination-equals": {
      if (!config.combination) return false;
      const [u, w] = config.combination.of.map(get);
      if (!u || !w) return false;
      return close([comb.a * u.x + comb.b * w.x, comb.a * u.y + comb.b * w.y], g.target);
    }
    case "orthogonal-to": {
      const v = get(g.id);
      const w = get(g.to);
      if (!v || !w) return false;
      const nonzero = Math.hypot(v.x, v.y) > 1e-9;
      return nonzero && Math.abs(v.x * w.x + v.y * w.y) <= tol;
    }
  }
}

export function VectorCanvas({ config, onGoal, disabled = false }: Props) {
  const range = config.range ?? 5;
  const plane = useMemo(() => makePlane(range), [range]);
  const snap = config.snap ?? true;
  const [vecs, setVecs] = useState<V[]>(() => config.vectors.map((s) => ({ id: s.id, x: s.x, y: s.y, spec: s })));
  const [comb, setComb] = useState({ a: config.combination?.a ?? 1, b: config.combination?.b ?? 1 });

  const show = new Set(config.show ?? []);

  useEffect(() => {
    onGoal?.(evalGoal(config, vecs, comb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vecs, comb]);

  const onMove = useCallback(
    (id: string, p: [number, number]) => {
      if (disabled) return;
      setVecs((prev) =>
        prev.map((v) => {
          if (v.id !== id || !v.spec.draggable) return v;
          const step = snap ? 1 : 0.25;
          const lim = range;
          const x = Math.max(-lim, Math.min(lim, snapTo(p[0], step)));
          const y = Math.max(-lim, Math.min(lim, snapTo(p[1], step)));
          return { ...v, x, y };
        }),
      );
    },
    [disabled, range, snap],
  );

  const { svgProps, start } = useDrag(plane, onMove);

  const get = (id: string) => vecs.find((v) => v.id === id);
  const tailOf = (v: V): [number, number] => {
    if (v.spec.tailAt) {
      const t = get(v.spec.tailAt);
      if (t) {
        const tt = tailOf(t);
        return [tt[0] + t.x, tt[1] + t.y];
      }
    }
    return [0, 0];
  };

  const first = vecs[0];
  const second = vecs[1];
  const sum: [number, number] | null = first && second ? [first.x + second.x, first.y + second.y] : null;
  const diff: [number, number] | null = first && second ? [first.x - second.x, first.y - second.y] : null;

  const combVecs = config.combination ? (config.combination.of.map(get) as (V | undefined)[]) : [];
  const combResult: [number, number] | null =
    config.combination && combVecs[0] && combVecs[1]
      ? [comb.a * combVecs[0].x + comb.b * combVecs[1].x, comb.a * combVecs[0].y + comb.b * combVecs[1].y]
      : null;

  // span rendering
  const spanIds = config.spanOf ?? (show.has("span") ? vecs.slice(0, 2).map((v) => v.id) : []);
  const spanVecs = spanIds.map(get).filter((v): v is V => !!v && Math.hypot(v.x, v.y) > 1e-9);
  let spanKind: "none" | "line" | "plane" = "none";
  if (spanVecs.length === 1) spanKind = "line";
  else if (spanVecs.length >= 2) {
    const [u, w] = spanVecs;
    spanKind = Math.abs(u.x * w.y - u.y * w.x) < 1e-9 ? "line" : "plane";
  }

  const colors = Array.from(new Set(vecs.map((v) => v.spec.color ?? "blue").concat(["green", "purple", "gray", "orange", "teal"])));

  return (
    <div className="grid gap-3">
      <svg
        {...svgProps}
        viewBox={`0 0 ${plane.size} ${plane.size}`}
        className="mx-auto w-full max-w-[420px] touch-none select-none rounded-2xl border border-border bg-surface"
        role="img"
        aria-label="Vector diagram"
      >
        <ArrowDefs ids={colors} />
        <Grid plane={plane} />

        {spanKind === "plane" && <rect x={0} y={0} width={plane.size} height={plane.size} fill="var(--blue)" opacity={0.08} />}
        {spanKind === "line" &&
          (() => {
            const u = spanVecs[0];
            const L = range * 4;
            const n = Math.hypot(u.x, u.y);
            const [x1, y1] = plane.toPx([(u.x / n) * L, (u.y / n) * L]);
            const [x2, y2] = plane.toPx([(-u.x / n) * L, (-u.y / n) * L]);
            return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--blue)" strokeWidth={10} opacity={0.18} />;
          })()}

        {/* parallelogram */}
        {show.has("parallelogram") && first && second && (
          <polygon
            points={[[0, 0], [first.x, first.y], sum!, [second.x, second.y]].map((p) => plane.toPx(p as [number, number]).join(",")).join(" ")}
            fill="var(--primary)"
            opacity={0.12}
            stroke="var(--primary)"
            strokeDasharray="5 5"
          />
        )}

        {/* tip-to-tail copy of second vector */}
        {show.has("tip-to-tail") && first && second && (
          <Arrow plane={plane} from={[first.x, first.y]} to={sum!} color={second.spec.color ?? "orange"} dashed opacity={0.7} />
        )}

        {vecs.map((v) => {
          const tail = tailOf(v);
          return <Arrow key={v.id} plane={plane} from={tail} to={[tail[0] + v.x, tail[1] + v.y]} color={v.spec.color ?? "blue"} dashed={v.spec.dashed} label={v.spec.label} />;
        })}

        {show.has("sum") && sum && <Arrow plane={plane} from={[0, 0]} to={sum} color="green" label={`${first.spec.label ?? "u"} + ${second.spec.label ?? "v"}`} />}
        {show.has("difference") && diff && first && second && (
          <Arrow plane={plane} from={[second.x, second.y]} to={[first.x, first.y]} color="purple" label={`${first.spec.label ?? "u"} − ${second.spec.label ?? "v"}`} />
        )}
        {show.has("combination") && combResult && config.combination && (
          <>
            {combVecs[0] && <Arrow plane={plane} from={[0, 0]} to={[comb.a * combVecs[0].x, comb.a * combVecs[0].y]} color={combVecs[0].spec.color ?? "blue"} dashed opacity={0.55} />}
            {combVecs[0] && combVecs[1] && (
              <Arrow
                plane={plane}
                from={[comb.a * combVecs[0].x, comb.a * combVecs[0].y]}
                to={combResult}
                color={combVecs[1].spec.color ?? "orange"}
                dashed
                opacity={0.55}
              />
            )}
            <Arrow plane={plane} from={[0, 0]} to={combResult} color="green" width={3.5} label="result" />
          </>
        )}

        {config.goal && "target" in config.goal && (
          <g>
            {(() => {
              const [tx, ty] = plane.toPx(config.goal.target);
              return (
                <>
                  <circle cx={tx} cy={ty} r={9} fill="none" stroke="var(--gold)" strokeWidth={3} strokeDasharray="4 3" />
                  <text x={tx + 12} y={ty - 10} fontSize={12} fontWeight={700} fill="var(--gold-ink)">
                    target
                  </text>
                </>
              );
            })()}
          </g>
        )}

        {!disabled &&
          vecs
            .filter((v) => v.spec.draggable)
            .map((v) => {
              const tail = tailOf(v);
              return <Handle key={`h-${v.id}`} plane={plane} at={[tail[0] + v.x, tail[1] + v.y]} color={v.spec.color ?? "blue"} onPointerDown={start(v.id)} label={`drag ${v.spec.label ?? v.id}`} />;
            })}
      </svg>

      {config.combination?.sliders && combVecs[0] && combVecs[1] && (
        <div className="mx-auto grid w-full max-w-[420px] gap-2 rounded-2xl border border-border bg-surface-2/60 p-3">
          {(["a", "b"] as const).map((k, i) => {
            const v = combVecs[i]!;
            const min = config.combination!.min ?? -3;
            const max = config.combination!.max ?? 3;
            const step = config.combination!.step ?? 0.5;
            return (
              <label key={k} className="flex items-center gap-3 text-sm">
                <span className="w-24 font-mono" style={{ color: colorVar(v.spec.color) }}>
                  {k === "a" ? "c₁" : "c₂"} = {fmt(comb[k])}
                </span>
                <input type="range" min={min} max={max} step={step} value={comb[k]} disabled={disabled} onChange={(e) => setComb((c) => ({ ...c, [k]: Number(e.target.value) }))} className="flex-1 accent-[var(--blue)]" />
                <span className="w-16 text-right text-muted">× {v.spec.label ?? v.id}</span>
              </label>
            );
          })}
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[420px] flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
        {vecs.map((v) => (
          <span key={v.id} className="font-mono" style={{ color: colorVar(v.spec.color) }}>
            {v.spec.label ?? v.id} = ({fmt(v.x)}, {fmt(v.y)})
          </span>
        ))}
        {show.has("sum") && sum && (
          <span className="font-mono text-primary">
            sum = ({fmt(sum[0])}, {fmt(sum[1])})
          </span>
        )}
        {show.has("difference") && diff && (
          <span className="font-mono text-purple">
            diff = ({fmt(diff[0])}, {fmt(diff[1])})
          </span>
        )}
        {show.has("combination") && combResult && (
          <span className="font-mono text-primary">
            <TeX tex={`${fmt(comb.a)}\\,${combVecs[0]?.spec.label ?? "u"} + ${fmt(comb.b)}\\,${combVecs[1]?.spec.label ?? "v"} = (${fmt(combResult[0])},\\ ${fmt(combResult[1])})`} />
          </span>
        )}
      </div>
    </div>
  );
}
