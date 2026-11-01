"use client";

import type { ShearMomentConfig } from "@/content/types";

interface Props {
  config: ShearMomentConfig;
  disabled?: boolean;
}

/** STUB — replaced by the real interactive shear/moment-diagram visual. */
export function ShearMoment({ config }: Props) {
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-dashed border-border bg-surface-2/60 p-4 text-sm text-muted" role="img" aria-label="shear and moment diagrams">
      <div className="font-semibold">Shear and moment diagrams (visual coming)</div>
      <pre className="mt-2 overflow-x-auto font-mono text-xs">{JSON.stringify(config, null, 1)}</pre>
    </div>
  );
}
