"use client";

import { useCallback, useMemo, useState } from "react";
import type { ProjectionConfig } from "@/content/types";
import { dot, projectOnto } from "@/lib/linalg";
import { Arrow, ArrowDefs, Grid, Handle, fmt, makePlane, snapTo, useDrag } from "./plane";
import { Math as TeX } from "@/components/ui/RichText";

interface Props {
  config: ProjectionConfig;
  disabled?: boolean;
}

export function ProjectionCanvas({ config, disabled = false }: Props) {
  const range = config.range ?? 5;
  const plane = useMemo(() => makePlane(range), [range]);
  const [y, setY] = useState<[number, number]>(config.y);
  const u = config.u;

  const onMove = useCallback(
    (_id: string, p: [number, number]) => {
      if (disabled) return;
      const lim = range;
      setY([Math.max(-lim, Math.min(lim, snapTo(p[0], 0.5))), Math.max(-lim, Math.min(lim, snapTo(p[1], 0.5)))]);
    },
    [disabled, range],
  );
  const { svgProps, start } = useDrag(plane, onMove);

  const p = projectOnto(y, u) as [number, number];
  const z: [number, number] = [y[0] - p[0], y[1] - p[1]];
  const coef = dot(u, u) ? dot(y, u) / dot(u, u) : 0;

  const L = range * 4;
  const n = Math.hypot(u[0], u[1]) || 1;
  const [lx1, ly1] = plane.toPx([(u[0] / n) * L, (u[1] / n) * L]);
  const [lx2, ly2] = plane.toPx([(-u[0] / n) * L, (-u[1] / n) * L]);

  // right-angle marker at p
  const s = 0.35;
  const un: [number, number] = [u[0] / n, u[1] / n];
  const zn = Math.hypot(z[0], z[1]);
  const zdir: [number, number] = zn > 1e-9 ? [z[0] / zn, z[1] / zn] : [0, 0];
  const back = coef >= 0 ? -1 : 1;
  const c1: [number, number] = [p[0] + back * un[0] * s, p[1] + back * un[1] * s];
  const c2: [number, number] = [c1[0] + zdir[0] * s, c1[1] + zdir[1] * s];
  const c3: [number, number] = [p[0] + zdir[0] * s, p[1] + zdir[1] * s];

  return (
    <div className="grid gap-3">
      <svg {...svgProps} viewBox={`0 0 ${plane.size} ${plane.size}`} className="mx-auto w-full max-w-[420px] touch-none select-none rounded-2xl border border-border bg-surface" role="img" aria-label="Orthogonal projection">
        <ArrowDefs ids={["blue", "orange", "green", "purple", "gray", "teal"]} />
        <Grid plane={plane} />
        <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="var(--orange)" strokeWidth={8} opacity={0.18} />
        <Arrow plane={plane} from={[0, 0]} to={u} color="orange" label="u" />
        <Arrow plane={plane} from={[0, 0]} to={y} color="blue" label="y" />
        <Arrow plane={plane} from={[0, 0]} to={p} color="green" width={4} label="ŷ" />
        {config.showResidual !== false && zn > 1e-9 && (
          <>
            <Arrow plane={plane} from={p} to={y} color="purple" dashed label="y − ŷ" />
            <polyline points={[c1, c2, c3].map((q) => plane.toPx(q).join(",")).join(" ")} fill="none" stroke="var(--muted)" strokeWidth={1.5} />
          </>
        )}
        {!disabled && config.draggable !== false && <Handle plane={plane} at={y} color="blue" onPointerDown={start("y")} label="drag y" />}
      </svg>
      <div className="mx-auto grid w-full max-w-[420px] gap-1 rounded-2xl border border-border bg-surface-2/60 p-3 text-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono">
          <span className="text-blue">y = ({fmt(y[0])}, {fmt(y[1])})</span>
          <span className="text-orange">u = ({fmt(u[0])}, {fmt(u[1])})</span>
          <span className="text-primary">ŷ = ({fmt(p[0])}, {fmt(p[1])})</span>
          <span className="text-purple">y − ŷ = ({fmt(z[0])}, {fmt(z[1])})</span>
        </div>
        <div>
          <TeX tex={`\\hat{y} = \\frac{y\\cdot u}{u\\cdot u}\\,u = \\frac{${fmt(dot(y, u))}}{${fmt(dot(u, u))}}\\,u = ${fmt(coef, 3)}\\,u`} />
        </div>
        <div className="text-muted">
          Check: (y − ŷ) · u = {fmt(dot(z, u), 3)} {Math.abs(dot(z, u)) < 1e-9 ? "— orthogonal ✓" : ""}
        </div>
      </div>
    </div>
  );
}
