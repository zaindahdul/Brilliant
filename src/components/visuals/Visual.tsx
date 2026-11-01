"use client";

import type { VisualSpec } from "@/content/types";
import { VectorCanvas } from "./VectorCanvas";
import { TransformGrid } from "./TransformGrid";
import { RowReducer } from "./RowReducer";
import { ProjectionCanvas } from "./ProjectionCanvas";
import { LeastSquaresCanvas } from "./LeastSquaresCanvas";
import { LinesCanvas } from "./LinesCanvas";

interface Props {
  spec: VisualSpec;
  onGoal?: (satisfied: boolean, detail?: string) => void;
  disabled?: boolean;
}

export function Visual({ spec, onGoal, disabled }: Props) {
  switch (spec.kind) {
    case "lines":
      return <LinesCanvas config={spec.config} onGoal={onGoal} disabled={disabled} />;
    case "vectors":
      return <VectorCanvas config={spec.config} onGoal={onGoal} disabled={disabled} />;
    case "transform":
      return <TransformGrid config={spec.config} onGoal={onGoal} disabled={disabled} />;
    case "row-reducer":
      return <RowReducer config={spec.config} onGoal={onGoal} disabled={disabled} />;
    case "projection":
      return <ProjectionCanvas config={spec.config} disabled={disabled} />;
    case "least-squares":
      return <LeastSquaresCanvas config={spec.config} disabled={disabled} />;
  }
}
