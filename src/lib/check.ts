/**
 * Answer parsing and checking.
 *
 * Numeric inputs accept integers, decimals, fractions ("-3/4"), and simple
 * expressions ("sqrt(2)/2", "2*sqrt(3)", "1/sqrt(2)", "pi/4", "2^3").
 */
import type { MatrixStep, McStep, MultiStep, NumericStep, OrderStep, QuestionStep } from "@/content/types";

export type AnswerValue =
  | { kind: "choice"; id: string }
  | { kind: "choices"; ids: string[] }
  | { kind: "number"; text: string }
  | { kind: "matrix"; cells: string[][] }
  | { kind: "order"; ids: string[] }
  | { kind: "goal"; satisfied: boolean; detail?: string };

/* ------------------------------------------------------------------ */
/* Expression parser                                                   */
/* ------------------------------------------------------------------ */

type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

function tokenize(src: string): Tok[] | null {
  const s = src
    .replace(/[−–]/g, "-")
    .replace(/√/g, "sqrt")
    .replace(/π/g, "pi")
    .replace(/×|·/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, "");
  const toks: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const v = Number(s.slice(i, j));
      if (!Number.isFinite(v)) return null;
      toks.push({ t: "num", v });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      toks.push({ t: "id", v: s.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if ("+-*/^()".includes(ch)) {
      toks.push({ t: "op", v: ch });
      i++;
      continue;
    }
    return null;
  }
  return toks;
}

class Parser {
  private p = 0;
  constructor(private toks: Tok[]) {}

  parse(): number | null {
    const v = this.expr();
    if (v === null || this.p !== this.toks.length) return null;
    return v;
  }

  private peek(): Tok | undefined {
    return this.toks[this.p];
  }

  private expr(): number | null {
    let v = this.term();
    if (v === null) return null;
    for (;;) {
      const t = this.peek();
      if (t && t.t === "op" && (t.v === "+" || t.v === "-")) {
        this.p++;
        const r = this.term();
        if (r === null) return null;
        v = t.v === "+" ? v + r : v - r;
      } else return v;
    }
  }

  private term(): number | null {
    let v = this.unary();
    if (v === null) return null;
    for (;;) {
      const t = this.peek();
      if (t && t.t === "op" && (t.v === "*" || t.v === "/")) {
        this.p++;
        const r = this.unary();
        if (r === null) return null;
        if (t.v === "/") {
          if (r === 0) return null;
          v = v / r;
        } else v = v * r;
      } else if (t && (t.t === "id" || (t.t === "op" && t.v === "("))) {
        // implicit multiplication: 2sqrt(3), 2(1+1), 3pi
        const r = this.unary();
        if (r === null) return null;
        v = v * r;
      } else return v;
    }
  }

  private unary(): number | null {
    const t = this.peek();
    if (t && t.t === "op" && t.v === "-") {
      this.p++;
      const v = this.unary();
      return v === null ? null : -v;
    }
    if (t && t.t === "op" && t.v === "+") {
      this.p++;
      return this.unary();
    }
    return this.power();
  }

  private power(): number | null {
    const base = this.atom();
    if (base === null) return null;
    const t = this.peek();
    if (t && t.t === "op" && t.v === "^") {
      this.p++;
      const e = this.unary();
      if (e === null) return null;
      const v = Math.pow(base, e);
      return Number.isFinite(v) ? v : null;
    }
    return base;
  }

  private atom(): number | null {
    const t = this.peek();
    if (!t) return null;
    if (t.t === "num") {
      this.p++;
      return t.v;
    }
    if (t.t === "op" && t.v === "(") {
      this.p++;
      const v = this.expr();
      const close = this.peek();
      if (v === null || !close || close.t !== "op" || close.v !== ")") return null;
      this.p++;
      return v;
    }
    if (t.t === "id") {
      this.p++;
      if (t.v === "pi") return Math.PI;
      if (t.v === "e") return Math.E;
      if (t.v === "sqrt" || t.v === "root") {
        const open = this.peek();
        let v: number | null;
        if (open && open.t === "op" && open.v === "(") {
          this.p++;
          v = this.expr();
          const close = this.peek();
          if (!close || close.t !== "op" || close.v !== ")") return null;
          this.p++;
        } else {
          v = this.atom(); // sqrt2
        }
        if (v === null || v < 0) return null;
        return Math.sqrt(v);
      }
      return null;
    }
    return null;
  }
}

/** Parse a learner-typed number. Returns null when it isn't a valid number. */
export function parseNumber(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const toks = tokenize(trimmed);
  if (!toks || toks.length === 0) return null;
  const v = new Parser(toks).parse();
  if (v === null || !Number.isFinite(v)) return null;
  return v;
}

export function approxEqual(a: number, b: number, tolerance = 1e-3): boolean {
  return Math.abs(a - b) <= tolerance + 1e-9;
}

/* ------------------------------------------------------------------ */
/* Checking                                                            */
/* ------------------------------------------------------------------ */

export interface CheckResult {
  correct: boolean;
  /** Choice-specific feedback for the picked wrong choice (if the author wrote one). */
  feedback?: string;
  /** Set when the input could not be parsed (so the attempt should not count). */
  invalid?: string;
}

export function checkAnswer(step: QuestionStep, value: AnswerValue | null): CheckResult {
  if (!value) return { correct: false, invalid: "Enter an answer first." };
  switch (step.type) {
    case "mc":
      return checkMc(step, value);
    case "multi":
      return checkMulti(step, value);
    case "numeric":
      return checkNumeric(step, value);
    case "matrix":
      return checkMatrix(step, value);
    case "order":
      return checkOrder(step, value);
    case "goal":
      return value.kind === "goal" ? { correct: value.satisfied } : { correct: false, invalid: "Adjust the diagram first." };
  }
}

function checkMc(step: McStep, value: AnswerValue): CheckResult {
  if (value.kind !== "choice") return { correct: false, invalid: "Pick an option." };
  if (value.id === step.correct) return { correct: true };
  const picked = step.choices.find((c) => c.id === value.id);
  return { correct: false, feedback: picked?.feedback };
}

function checkMulti(step: MultiStep, value: AnswerValue): CheckResult {
  if (value.kind !== "choices" || value.ids.length === 0) return { correct: false, invalid: "Select at least one option." };
  const want = new Set(step.correct);
  const got = new Set(value.ids);
  if (want.size !== got.size) return { correct: false };
  for (const id of want) if (!got.has(id)) return { correct: false };
  return { correct: true };
}

function checkNumeric(step: NumericStep, value: AnswerValue): CheckResult {
  if (value.kind !== "number") return { correct: false, invalid: "Type a number." };
  const v = parseNumber(value.text);
  if (v === null) return { correct: false, invalid: "That doesn't look like a number. Try something like 3, -1/2 or sqrt(2)." };
  return { correct: approxEqual(v, step.answer, step.tolerance ?? 1e-3) };
}

function checkMatrix(step: MatrixStep, value: AnswerValue): CheckResult {
  if (value.kind !== "matrix") return { correct: false, invalid: "Fill in the entries." };
  const rows = step.answer.length;
  const cols = step.answer[0].length;
  if (value.cells.length !== rows || value.cells.some((r) => r.length !== cols)) return { correct: false, invalid: "Fill in every entry." };
  let ok = true;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const v = parseNumber(value.cells[i][j]);
      if (v === null) return { correct: false, invalid: "Every entry needs a number (fractions like 1/2 are fine)." };
      if (!approxEqual(v, step.answer[i][j], step.tolerance ?? 1e-3)) ok = false;
    }
  }
  return { correct: ok };
}

function checkOrder(step: OrderStep, value: AnswerValue): CheckResult {
  if (value.kind !== "order") return { correct: false, invalid: "Arrange the items first." };
  if (value.ids.length !== step.correct.length) return { correct: false };
  return { correct: value.ids.every((id, i) => id === step.correct[i]) };
}

/** Human-readable correct answer used by the reveal panel. */
export function formatAnswer(step: QuestionStep): { kind: "text" | "math"; value: string } {
  switch (step.type) {
    case "mc": {
      const c = step.choices.find((x) => x.id === step.correct);
      return { kind: "text", value: c?.text ?? "" };
    }
    case "multi": {
      return { kind: "text", value: step.correct.map((id) => step.choices.find((c) => c.id === id)?.text ?? "").join(" · ") };
    }
    case "numeric": {
      if (step.answerDisplay) return { kind: "math", value: step.answerDisplay };
      // Engineering answers (any step that sets an explicit tolerance) are shown as decimals with their
      // unit; exact linear-algebra answers keep the fraction form.
      if (step.tolerance !== undefined) {
        const unit = step.suffix && !/[$\\{}]/.test(step.suffix) ? String.raw`\;\text{` + step.suffix.replace(/[%#&_]/g, (c) => "\\" + c) + "}" : "";
        return { kind: "math", value: formatDecimalForTex(step.answer) + unit };
      }
      return { kind: "math", value: formatNumberForTex(step.answer) };
    }
    case "matrix":
      return {
        kind: "math",
        value: step.answerDisplay ?? `\\begin{bmatrix}${step.answer.map((row) => row.map(formatNumberForTex).join("&")).join("\\\\")}\\end{bmatrix}`,
      };
    case "order":
      return { kind: "text", value: step.correct.map((id, i) => `${i + 1}. ${step.items.find((x) => x.id === id)?.text ?? ""}`).join("  ") };
    case "goal":
      return { kind: "text", value: "See the explanation below." };
  }
}

/** Decimal with up to 4 significant figures (engineering answers), e.g. 159.2, 0.00254, 120000. */
export function formatDecimalForTex(x: number): string {
  if (Number.isInteger(x)) return String(x);
  const v = Number(x.toPrecision(4));
  return Math.abs(v) >= 1e21 || (Math.abs(v) < 1e-6 && v !== 0) ? v.toExponential(3).replace(/e([+-]?\d+)/, String.raw`\times 10^{$1}`) : String(v);
}

export function formatNumberForTex(x: number): string {
  if (Number.isInteger(x)) return String(x);
  // try small fraction
  for (let d = 2; d <= 24; d++) {
    const n = x * d;
    if (Math.abs(n - Math.round(n)) < 1e-9) {
      const num = Math.round(n);
      const sign = num < 0 ? "-" : "";
      return `${sign}\\tfrac{${Math.abs(num)}}{${d}}`;
    }
  }
  return String(Math.round(x * 1000) / 1000);
}

export function isAnswerEmpty(value: AnswerValue | null): boolean {
  if (!value) return true;
  switch (value.kind) {
    case "choice":
      return !value.id;
    case "choices":
      return value.ids.length === 0;
    case "number":
      return value.text.trim() === "";
    case "matrix":
      return value.cells.some((row) => row.some((c) => c.trim() === ""));
    case "order":
      return value.ids.length === 0;
    case "goal":
      return false;
  }
}
