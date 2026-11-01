"use client";

import type { VisualSpec } from "@/content/types";
import { VectorCanvas } from "./VectorCanvas";
import { TransformGrid } from "./TransformGrid";
import { RowReducer } from "./RowReducer";
import { ProjectionCanvas } from "./ProjectionCanvas";
import { LeastSquaresCanvas } from "./LeastSquaresCanvas";
import { LinesCanvas } from "./LinesCanvas";
import { AxialBar } from "./solid/AxialBar";
import { StressElement } from "./solid/StressElement";
import { StrainGrid } from "./solid/StrainGrid";
import { TorsionSection } from "./solid/TorsionSection";
import { BeamSection } from "./solid/BeamSection";
import { ShearMoment } from "./solid/ShearMoment";
import { PressureVessel } from "./solid/PressureVessel";

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
    case "axial-bar":
      return <AxialBar config={spec.config} disabled={disabled} />;
    case "stress-element":
      return <StressElement config={spec.config} disabled={disabled} />;
    case "strain-grid":
      return <StrainGrid config={spec.config} disabled={disabled} />;
    case "torsion-section":
      return <TorsionSection config={spec.config} disabled={disabled} />;
    case "beam-section":
      return <BeamSection config={spec.config} disabled={disabled} />;
    case "shear-moment":
      return <ShearMoment config={spec.config} disabled={disabled} />;
    case "pressure-vessel":
      return <PressureVessel config={spec.config} disabled={disabled} />;
  }
}
