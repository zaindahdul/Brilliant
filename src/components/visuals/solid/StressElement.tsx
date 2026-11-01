"use client";

import type { StressElementConfig } from "@/content/types";

interface Props {
  config: StressElementConfig;
  disabled?: boolean;
}

/** STUB — replaced by the real interactive stress-element visual. */
export function StressElement({ config }: Props) {
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-dashed border-border bg-surface-2/60 p-4 text-sm text-muted" role="img" aria-label="stress element">
      <div className="font-semibold">Stress element (visual coming)</div>
      <pre className="mt-2 overflow-x-auto font-mono text-xs">{JSON.stringify(config, null, 1)}</pre>
    </div>
  );
}
