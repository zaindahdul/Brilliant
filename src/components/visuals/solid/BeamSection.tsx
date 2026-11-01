"use client";

import type { BeamSectionConfig } from "@/content/types";

interface Props {
  config: BeamSectionConfig;
  disabled?: boolean;
}

/** STUB — replaced by the real interactive beam-section visual. */
export function BeamSection({ config }: Props) {
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-dashed border-border bg-surface-2/60 p-4 text-sm text-muted" role="img" aria-label="beam section">
      <div className="font-semibold">Beam section (visual coming)</div>
      <pre className="mt-2 overflow-x-auto font-mono text-xs">{JSON.stringify(config, null, 1)}</pre>
    </div>
  );
}
