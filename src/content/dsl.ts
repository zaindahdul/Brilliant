/**
 * Small authoring helpers so lesson files stay readable.
 * Use `r` (String.raw) for bodies containing LaTeX so backslashes survive.
 */
import type {
  Choice,
  GoalStep,
  Lesson,
  MatrixStep,
  McStep,
  MultiStep,
  NumericStep,
  OrderStep,
  ReadingStep,
  Rich,
  Step,
  VisualSpec,
} from "./types";

export const r = String.raw;

export function reading(id: string, body: Rich, opts: { title?: string; visual?: VisualSpec } = {}): ReadingStep {
  return { type: "reading", id, body, ...opts };
}

export interface McOpts {
  title?: string;
  body?: Rich;
  question: Rich;
  choices: (Choice | [id: string, text: Rich, feedback?: Rich])[];
  correct: string;
  hint: Rich;
  explanation: Rich;
  visual?: VisualSpec;
  shuffle?: boolean;
  tags?: string[];
}

function normChoices(choices: McOpts["choices"]): Choice[] {
  return choices.map((c) => (Array.isArray(c) ? { id: c[0], text: c[1], feedback: c[2] } : c));
}

export function mc(id: string, o: McOpts): McStep {
  const choices = normChoices(o.choices);
  if (!choices.some((c) => c.id === o.correct)) throw new Error(`mc ${id}: correct id "${o.correct}" not in choices`);
  return {
    type: "mc",
    id,
    title: o.title,
    body: o.body ?? "",
    question: o.question,
    choices,
    correct: o.correct,
    hint: o.hint,
    explanation: o.explanation,
    visual: o.visual,
    shuffle: o.shuffle,
    tags: o.tags,
  };
}

export interface TfOpts {
  title?: string;
  body?: Rich;
  /** The statement to judge. */
  statement: Rich;
  answer: boolean;
  hint: Rich;
  explanation: Rich;
  /** Feedback when the learner picks the wrong truth value. */
  feedback?: Rich;
  tags?: string[];
  visual?: VisualSpec;
}

/** Lay-style "True or False — justify" problem rendered as a two-choice question. */
export function tf(id: string, o: TfOpts): McStep {
  return mc(id, {
    title: o.title,
    body: o.body,
    question: `**True or false?** ${o.statement}`,
    choices: [
      ["true", "True", o.answer ? undefined : o.feedback],
      ["false", "False", o.answer ? o.feedback : undefined],
    ],
    correct: o.answer ? "true" : "false",
    hint: o.hint,
    explanation: o.explanation,
    tags: o.tags,
    visual: o.visual,
  });
}

export interface MultiOpts extends Omit<McOpts, "correct"> {
  correct: string[];
}

export function multi(id: string, o: MultiOpts): MultiStep {
  const choices = normChoices(o.choices);
  for (const c of o.correct) {
    if (!choices.some((x) => x.id === c)) throw new Error(`multi ${id}: correct id "${c}" not in choices`);
  }
  return {
    type: "multi",
    id,
    title: o.title,
    body: o.body ?? "",
    question: o.question,
    choices,
    correct: o.correct,
    hint: o.hint,
    explanation: o.explanation,
    visual: o.visual,
    tags: o.tags,
  };
}

export interface NumericOpts {
  title?: string;
  body?: Rich;
  question: Rich;
  answer: number;
  tolerance?: number;
  hint: Rich;
  explanation: Rich;
  placeholder?: string;
  prefix?: Rich;
  suffix?: Rich;
  answerDisplay?: string;
  visual?: VisualSpec;
  tags?: string[];
}

export function numeric(id: string, o: NumericOpts): NumericStep {
  return { type: "numeric", id, body: o.body ?? "", ...o };
}

export interface MatrixOpts {
  title?: string;
  body?: Rich;
  question: Rich;
  answer: number[][];
  tolerance?: number;
  hint: Rich;
  explanation: Rich;
  prefix?: Rich;
  answerDisplay?: string;
  augmented?: boolean;
  visual?: VisualSpec;
  tags?: string[];
}

export function matrix(id: string, o: MatrixOpts): MatrixStep {
  return { type: "matrix", id, body: o.body ?? "", ...o };
}

export interface OrderOpts {
  title?: string;
  body?: Rich;
  question: Rich;
  /** Items in the CORRECT order; they are shuffled for display. */
  items: [id: string, text: Rich][];
  hint: Rich;
  explanation: Rich;
  tags?: string[];
  visual?: VisualSpec;
}

export function order(id: string, o: OrderOpts): OrderStep {
  return {
    type: "order",
    id,
    title: o.title,
    body: o.body ?? "",
    question: o.question,
    items: o.items.map(([iid, text]) => ({ id: iid, text })),
    correct: o.items.map(([iid]) => iid),
    hint: o.hint,
    explanation: o.explanation,
    tags: o.tags,
    visual: o.visual,
  };
}

export interface GoalOpts {
  title?: string;
  body?: Rich;
  question: Rich;
  visual: VisualSpec;
  hint: Rich;
  explanation: Rich;
  tags?: string[];
}

export function goal(id: string, o: GoalOpts): GoalStep {
  return { type: "goal", id, body: o.body ?? "", ...o };
}

/** Render a column vector in LaTeX: vec(1, -2) -> \begin{bmatrix}1\\-2\end{bmatrix} */
export function vec(...entries: (number | string)[]): string {
  return `\\begin{bmatrix}${entries.join("\\\\")}\\end{bmatrix}`;
}

/** Render a matrix in LaTeX from rows. */
export function mat(rows: (number | string)[][]): string {
  return `\\begin{bmatrix}${rows.map((row) => row.join("&")).join("\\\\")}\\end{bmatrix}`;
}

/** Render an augmented matrix [A | b] with a vertical bar. */
export function aug(rows: (number | string)[][]): string {
  const n = rows[0].length;
  const cols = "c".repeat(n - 1) + "|c";
  return `\\left[\\begin{array}{${cols}}${rows.map((row) => row.join("&")).join("\\\\")}\\end{array}\\right]`;
}

export function lesson(
  meta: { id: string; unitId: string; title: string; summary: string; textbook?: string; minutes?: number },
  steps: Step[],
): Lesson {
  const ids = new Set<string>();
  for (const s of steps) {
    if (ids.has(s.id)) throw new Error(`lesson ${meta.id}: duplicate step id ${s.id}`);
    ids.add(s.id);
  }
  return { minutes: 10, ...meta, steps };
}
