"use client";

import type { StrainGridConfig } from "@/content/types";

interface Props {
  config: StrainGridConfig;
  disabled?: boolean;
}

/** STUB — replaced by the real interactive strain-grid visual. */
export function StrainGrid({ config }: Props) {
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-dashed border-border bg-surface-2/60 p-4 text-sm text-muted" role="img" aria-label="strain grid">
      <div className="font-semibold">Strain grid (visual coming)</div>
      <pre className="mt-2 overflow-x-auto font-mono text-xs">{JSON.stringify(config, null, 1)}</pre>
    </div>
  );
}
