/**
 * Content model for the course engine.
 *
 * Everything here is plain serialisable data so that lessons can be loaded on
 * the server and handed to client components, and so the tutor API can be
 * given the exact step the learner is looking at.
 *
 * `Rich` strings use a small markdown dialect:
 *   - paragraphs separated by blank lines, `- ` bullet lists, `1. ` numbered lists
 *   - `**bold**`, `*italic*`, `` `code` ``
 *   - inline math `$...$`, display math `$$...$$`
 *   - `> ` callout blocks, `### ` headings
 */
export type Rich = string;

export type ChoiceId = string;

export interface Choice {
  id: ChoiceId;
  text: Rich;
  /** Targeted feedback shown when this (wrong) choice is picked on the first try. */
  feedback?: Rich;
}

/* ------------------------------------------------------------------ */
/* Visuals (interactive manipulatives)                                 */
/* ------------------------------------------------------------------ */

export type DataColor = "blue" | "orange" | "green" | "purple" | "teal" | "gray";

export interface VectorSpec {
  id: string;
  x: number;
  y: number;
  color?: DataColor;
  label?: string;
  draggable?: boolean;
  /** Draw this vector starting at the tip of another vector (tip-to-tail). */
  tailAt?: string;
  dashed?: boolean;
}

export interface VectorsConfig {
  /** Half-width of the visible grid; default 5. */
  range?: number;
  vectors: VectorSpec[];
  /** Overlay options. */
  show?: Array<"sum" | "difference" | "parallelogram" | "combination" | "span" | "tip-to-tail" | "coordinates" | "dot">;
  /** c1·u + c2·v, with optional sliders for the learner. */
  combination?: {
    of: [string, string];
    a: number;
    b: number;
    sliders?: boolean;
    min?: number;
    max?: number;
    step?: number;
  };
  /** Shade the span of these vector ids (a line, or the whole plane). */
  spanOf?: string[];
  /** Snap dragged vectors to integer coordinates (default true). */
  snap?: boolean;
  /** Goal used by `goal` steps. */
  goal?:
    | { type: "vector-equals"; id: string; target: [number, number]; tolerance?: number }
    | { type: "sum-equals"; of: string[]; target: [number, number]; tolerance?: number }
    | { type: "combination-equals"; target: [number, number]; tolerance?: number }
    | { type: "orthogonal-to"; id: string; to: string; tolerance?: number }
    /** The two vectors must be linearly independent (span the whole plane). */
    | { type: "span-plane"; of: [string, string] };
}

export interface TransformConfig {
  matrix: [[number, number], [number, number]];
  /** Let the learner edit the matrix entries. */
  editable?: boolean;
  /** Show entry sliders (−3..3). */
  sliders?: boolean;
  showDet?: boolean;
  showEigen?: boolean;
  shape?: "square" | "house" | "f" | "none";
  /** Show an "animate" slider that morphs from the identity to the matrix. */
  animate?: boolean;
  range?: number;
  /** Draw the images of these vectors too. */
  vectors?: VectorSpec[];
  goal?:
    | { type: "matrix-equals"; target: [[number, number], [number, number]]; tolerance?: number }
    | { type: "det-equals"; target: number; tolerance?: number };
}

export interface RowReducerConfig {
  /** Entries may be numbers or fraction strings like "1/2". */
  matrix: (number | string)[][];
  /** Draw a bar before the last column (or before the last `rightColumns` columns). */
  augmented?: boolean;
  /** Number of columns to the right of the bar, e.g. n for [A | I]. Default 1. */
  rightColumns?: number;
  /** What counts as "done" for a goal step. */
  target?: "ref" | "rref" | "free";
  /** Row labels, e.g. for showing variables. */
  columnLabels?: string[];
}

export interface ProjectionConfig {
  y: [number, number];
  u: [number, number];
  draggable?: boolean;
  showResidual?: boolean;
  range?: number;
}

export interface LeastSquaresConfig {
  points: [number, number][];
  /** Starting guess for the line y = m x + b. */
  line?: { m: number; b: number };
  sliders?: boolean;
  showBest?: boolean;
}

export interface LinesConfig {
  /** Each line a·x + b·y = c. */
  lines: { a: number; b: number; c: number; editable?: boolean }[];
  range?: number;
  goal?: { type: "solutions"; target: "one" | "none" | "infinite" };
}


/* ------------------------------------------------------------------ */
/* Solid mechanics visuals                                             */
/* ------------------------------------------------------------------ */

/**
 * An axial bar (Govindjee ch. 2): segments left -> right, point loads, an
 * optional uniform distributed load, fixed ends. Draws the bar with its loads
 * and the internal-force R(x), stress sigma(x) and displacement u(x) diagrams.
 * Units are whatever the author passes (labels via `units`); the component
 * only does arithmetic.
 */
export interface AxialBarConfig {
  /** Segments left -> right. Lengths add up to the bar length. */
  segments: { length: number; E: number; A: number; label?: string }[];
  /** Point loads at distance x from the left end; positive pulls toward +x (to the right). */
  loads?: { x: number; P: number; label?: string }[];
  /** Uniform distributed axial load per unit length, positive toward +x. */
  distributed?: number;
  /** Which ends are built in. "both" is statically indeterminate (solved by compatibility u(L) = 0). */
  fixed: "left" | "right" | "both";
  /** Diagrams to draw below the bar; default ["R"]. */
  show?: Array<"R" | "sigma" | "u">;
  /** Let the learner change the point-load magnitudes (and the distributed load) with sliders. */
  sliders?: boolean;
  units?: { length?: string; force?: string; stress?: string; displacement?: string };
}

/**
 * A 2-D stress element (Govindjee 3.2) drawn with the textbook convention:
 * first index = cut normal, second = force direction; positive components
 * point in +coordinate directions on positive faces. Optional traction on an
 * inclined cut via Cauchy's law t = sigma n.
 */
export interface StressElementConfig {
  sxx: number;
  syy: number;
  sxy: number;
  /** Sliders for the three components (range +-max). */
  sliders?: boolean;
  /** Show the traction vector on a cut whose outward normal makes angle theta (degrees, from +x), with a theta slider. */
  cut?: { theta: number; slider?: boolean };
  max?: number;
  unit?: string;
}

/**
 * A square element deformed by a homogeneous displacement gradient
 * (Govindjee ch. 4): shows the deformed shape, exx, eyy, exy (tensor) and
 * gxy = 2 exy (engineering), and the rotation.
 */
export interface StrainGridConfig {
  /** [[du/dx, du/dy], [dv/dx, dv/dy]] - small numbers such as 0.1. */
  grad: [[number, number], [number, number]];
  sliders?: boolean;
  /** Drawing exaggeration factor (default 1). */
  scale?: number;
}

/** Circular shaft cross-section under torque T (Govindjee 7.1-7.3): tau(r) = T r / J, solid or hollow. */
export interface TorsionSectionConfig {
  T: number;
  ro: number;
  ri?: number;
  /** Shear modulus; when given the twist rate phi' = T/GJ is shown too. */
  G?: number;
  sliders?: boolean;
  units?: { torque?: string; length?: string; stress?: string };
}

export type BeamSectionShape =
  | { kind: "rect"; b: number; h: number }
  | { kind: "tee"; bf: number; tf: number; hw: number; tw: number }
  | { kind: "ibeam"; bf: number; tf: number; hw: number; tw: number }
  | { kind: "box"; b: number; h: number; t: number };

/** Bending stress on a cross-section (Govindjee 8.3): neutral axis at the centroid, sigma = -M y / I. */
export interface BeamSectionConfig {
  M: number;
  section: BeamSectionShape;
  sliders?: boolean;
  units?: { moment?: string; length?: string; stress?: string };
}

export type BeamLoad =
  | { kind: "point"; x: number; P: number }
  | { kind: "udl"; from: number; to: number; w: number }
  | { kind: "moment"; x: number; M: number };

/**
 * Shear-force and bending-moment diagrams (Govindjee 8.2). Loads P and w are
 * positive DOWNWARD (the way problems state them); V and M follow the course
 * sign convention (V = integral of sigma_xy dA, dV/dx + q = 0, dM/dx + V = 0, q positive upward).
 */
export interface ShearMomentConfig {
  length: number;
  support: "simple" | "cantilever-left" | "cantilever-right";
  loads: BeamLoad[];
  /** Sliders for point-load positions/magnitudes. */
  sliders?: boolean;
  units?: { length?: string; force?: string };
}

/** Thin-walled pressure vessel (Govindjee 6.2): hoop/axial (cylinder) or membrane (sphere) stress. */
export interface PressureVesselConfig {
  kind: "cylinder" | "sphere";
  p: number;
  r: number;
  t: number;
  sliders?: boolean;
  units?: { pressure?: string; length?: string; stress?: string };
}

export type VisualSpec =
  | { kind: "lines"; config: LinesConfig }
  | { kind: "vectors"; config: VectorsConfig }
  | { kind: "transform"; config: TransformConfig }
  | { kind: "row-reducer"; config: RowReducerConfig }
  | { kind: "projection"; config: ProjectionConfig }
  | { kind: "least-squares"; config: LeastSquaresConfig }
  | { kind: "axial-bar"; config: AxialBarConfig }
  | { kind: "stress-element"; config: StressElementConfig }
  | { kind: "strain-grid"; config: StrainGridConfig }
  | { kind: "torsion-section"; config: TorsionSectionConfig }
  | { kind: "beam-section"; config: BeamSectionConfig }
  | { kind: "shear-moment"; config: ShearMomentConfig }
  | { kind: "pressure-vessel"; config: PressureVesselConfig };

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

interface StepBase {
  id: string;
  /** Short serif title shown above the body (optional). */
  title?: string;
  /** Main explanatory text. */
  body: Rich;
  visual?: VisualSpec;
}

export interface ReadingStep extends StepBase {
  type: "reading";
}

interface QuestionBase extends StepBase {
  /** The question text, rendered prominently after the body. */
  question: Rich;
  /** Targeted hint shown after the first wrong attempt (never reveals the answer). */
  hint: Rich;
  /** Worked reasoning shown after a correct answer or after the reveal. */
  explanation: Rich;
  /** Tags used by the practice/review system, e.g. ["pivots", "consistency"]. */
  tags?: string[];
}

export interface McStep extends QuestionBase {
  type: "mc";
  choices: Choice[];
  correct: ChoiceId;
  /** Shuffle choices on each load (default false so "all of the above"-style keeps order). */
  shuffle?: boolean;
}

export interface MultiStep extends QuestionBase {
  type: "multi";
  choices: Choice[];
  correct: ChoiceId[];
}

export interface NumericStep extends QuestionBase {
  type: "numeric";
  answer: number;
  /** Absolute tolerance; default 1e-3 (fractions like 1/3 are accepted exactly). */
  tolerance?: number;
  placeholder?: string;
  /** Rendered to the left/right of the input, e.g. "x =" or "°". */
  prefix?: Rich;
  suffix?: Rich;
  /** How to show the answer on reveal, e.g. "\\tfrac{1}{3}". Defaults to the number. */
  answerDisplay?: string;
}

export interface MatrixStep extends QuestionBase {
  type: "matrix";
  answer: number[][];
  tolerance?: number;
  /** Rendered before the matrix input, e.g. "A^{-1} =". */
  prefix?: Rich;
  answerDisplay?: string;
  /** Draw an augmented bar before the last column. */
  augmented?: boolean;
}

export interface OrderStep extends QuestionBase {
  type: "order";
  items: { id: string; text: Rich }[];
  correct: string[];
}

export interface GoalStep extends QuestionBase {
  type: "goal";
  visual: VisualSpec;
}

export type Step = ReadingStep | McStep | MultiStep | NumericStep | MatrixStep | OrderStep | GoalStep;
export type QuestionStep = Exclude<Step, ReadingStep>;

export function isQuestion(step: Step): step is QuestionStep {
  return step.type !== "reading";
}

/* ------------------------------------------------------------------ */
/* Course structure                                                    */
/* ------------------------------------------------------------------ */

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  summary: string;
  /** Textbook reference, e.g. "Lay §1.2". */
  textbook?: string;
  minutes: number;
  steps: Step[];
}

export interface LessonMeta {
  id: string;
  unitId: string;
  title: string;
  summary: string;
  textbook?: string;
  minutes: number;
  stepCount: number;
  questionCount: number;
}

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  /** Short motivation shown on the course map banner. */
  description: string;
  textbook?: string;
  lessons: Lesson[];
  /** Static practice problems for this unit's Level Check. */
  practice: QuestionStep[];
  /** Ids of parameterised generators that also feed the Level Check. */
  generators: string[];
}

export interface UnitMeta {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  textbook?: string;
  lessons: LessonMeta[];
  practiceCount: number;
}

export interface Course {
  id: string;
  title: string;
  tagline: string;
  description: string;
  units: Unit[];
}

export interface CourseMeta {
  id: string;
  title: string;
  tagline: string;
  description: string;
  units: UnitMeta[];
  lessonCount: number;
  exerciseCount: number;
}
