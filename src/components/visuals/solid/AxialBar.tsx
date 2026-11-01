"use client";

import type { AxialBarConfig } from "@/content/types";

interface Props {
  config: AxialBarConfig;
  disabled?: boolean;
}

/** STUB — replaced by the real interactive axial-bar visual. */
export function AxialBar({ config }: Props) {
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-dashed border-border bg-surface-2/60 p-4 text-sm text-muted" role="img" aria-label="axial bar">
      <div className="font-semibold">Axial bar (visual coming)</div>
      <pre className="mt-2 overflow-x-auto font-mono text-xs">{JSON.stringify(config, null, 1)}</pre>
    </div>
  );
}
