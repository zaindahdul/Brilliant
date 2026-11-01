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
  show?: Array<"sum" | "difference" | "parallelogram" | "combination" | "span" | "tip-to-tail" | "coordinates">;
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
    | { type: "orthogonal-to"; id: string; to: string; tolerance?: number };
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
  /** Draw a bar before the last column. */
  augmented?: boolean;
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

export type VisualSpec =
  | { kind: "lines"; config: LinesConfig }
  | { kind: "vectors"; config: VectorsConfig }
  | { kind: "transform"; config: TransformConfig }
  | { kind: "row-reducer"; config: RowReducerConfig }
  | { kind: "projection"; config: ProjectionConfig }
  | { kind: "least-squares"; config: LeastSquaresConfig };

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
