"use client";

import type { PressureVesselConfig } from "@/content/types";

interface Props {
  config: PressureVesselConfig;
  disabled?: boolean;
}

/** STUB — replaced by the real interactive pressure-vessel visual. */
export function PressureVessel({ config }: Props) {
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-dashed border-border bg-surface-2/60 p-4 text-sm text-muted" role="img" aria-label="pressure vessel">
      <div className="font-semibold">Pressure vessel (visual coming)</div>
      <pre className="mt-2 overflow-x-auto font-mono text-xs">{JSON.stringify(config, null, 1)}</pre>
    </div>
  );
}
