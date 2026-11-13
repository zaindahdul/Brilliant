/**
 * A second line of defence behind the tutor's instructions.
 *
 * The instructions tell the model never to give the answer. This module checks
 * what the model actually wrote, sentence by sentence, before it reaches the
 * learner. A sentence that states the answer to an unresolved step is never
 * sent; a short redirect takes its place and the rest of the reply is dropped.
 *
 * It is deliberately conservative about what it recognises as a leak (a number
 * equal to the answer, the correct option quoted or asserted, the answer
 * matrix, "the answer is …"). It is not a proof of secrecy: a reply can still
 * hint too strongly in words, which is what the instructions are for.
 */
import type { StreamTextTransform, TextStreamPart, ToolSet } from "ai";
import type { TutorContext } from "./prompt";

export type GuardContext = Pick<TutorContext, "stepType" | "correctAnswer" | "choices" | "body" | "question" | "resolved" | "mode" | "hint">;

/** Only lesson and practice steps that are still open have a known answer worth protecting. */
export function isGuarded(ctx: GuardContext): boolean {
  return !ctx.resolved && ctx.mode !== "homework" && !!ctx.correctAnswer && ctx.stepType !== "reading" && ctx.stepType !== "homework";
}

/* ------------------------------------------------------------------ */
/* Numbers in free text                                                */
/* ------------------------------------------------------------------ */

interface Found {
  /** Signed value (a minus sign written directly before the number counts). */
  value: number;
  start: number;
  /** Significant digits as written: "43.2" has 3, "400" has 1, "0.050" has 2. */
  sig: number;
}

const NUMBER = /(\d{1,3}(?:(?:\\,|,|[  ]| (?=\d{3}(?!\d)))\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?|\.\d+)(?:\s*(?:×|\\times|\\cdot|\*)\s*10\s*\^?\s*\{?\s*([-−]?\d+)\s*\}?|[eE]([-+]?\d+)(?![a-zA-Z]))?/g;

function significantDigits(mantissa: string): number {
  const digits = mantissa.replace(/[^\d.]/g, "");
  const [int = "", dec] = digits.split(".");
  if (dec !== undefined) return (int + dec).replace(/^0+/, "").length || 1;
  return int.replace(/^0+/, "").replace(/0+$/, "").length || 1;
}

/** Simple numeric fractions: \tfrac{1}{3}, \frac12, 3/4. */
const FRACTION = /\\[td]?frac\s*(?:\{(\d+)\}|(\d))\s*(?:\{(\d+)\}|(\d))|(?<![\d.\w/])(\d+)\s*\/\s*(\d+)(?![\d.\w/])/g;

/** A number written tight against a variable ("2x_1", "3\pi", "\tfrac12 k") is a coefficient, not a value. */
const isCoefficient = (after: string) => /^\s?(?:[a-zA-Z](?![a-zA-Z])|\\(?!mathrm|text|quad|ldots|times|cdot|div|approx|le|ge|[,;:!% ])[a-zA-Z]+)/.test(after);

export function numbersIn(text: string): Found[] {
  const out: Found[] = [];
  let rest = text;
  for (const m of text.matchAll(FRACTION)) {
    const num = Number(m[1] ?? m[2] ?? m[5]);
    const den = Number(m[3] ?? m[4] ?? m[6]);
    // blank the fraction out so its numerator and denominator are not read again as separate numbers
    rest = rest.slice(0, m.index) + " ".repeat(m[0].length) + rest.slice(m.index + m[0].length);
    if (!(den > 0) || isCoefficient(text.slice(m.index + m[0].length, m.index + m[0].length + 14).replace(/^\s?/, ""))) continue;
    let value = Number((num / den).toPrecision(12));
    if (/(?:^|[\s=({\[,&$])[-−]$/.test(text.slice(Math.max(0, m.index - 2), m.index))) value = -value;
    out.push({ value, start: m.index, sig: 3 });
  }
  for (const m of rest.matchAll(NUMBER)) {
    const mantissa = m[1].replace(/\\,|,|[   ]/g, "");
    const exp = m[2] ?? m[3];
    let value = Number((Number(mantissa) * (exp !== undefined ? 10 ** Number(exp.replace("−", "-")) : 1)).toPrecision(12));
    if (!Number.isFinite(value)) continue;
    const start = m.index;
    // subscripts and exponents ("c_2", "x^{3}", "mm^4") are labels and powers, not values
    if (/[_^]\{?[-−]?$/.test(text.slice(Math.max(0, start - 3), start))) continue;
    if (/^(?:[a-zA-Z](?![a-zA-Z])|\\(?!mathrm|text|quad|ldots|times|cdot|div|approx|le|ge|[,;:!% ])[a-zA-Z]+)/.test(text.slice(start + m[0].length, start + m[0].length + 14))) continue;
    // a minus sign directly before the number, itself preceded by something that cannot be a left operand
    const before = text.slice(Math.max(0, start - 2), start);
    if (/(?:^|[\s=({\[,&$])[-−]$/.test(before)) value = -value;
    out.push({ value, start, sig: significantDigits(m[1]) });
  }
  return out.sort((a, b) => a.start - b.start);
}

const close = (a: number, b: number, rel = 0.005) => Math.abs(a - b) <= Math.max(rel * Math.abs(b), 1e-9);

/** Numbers that turn up in hints for reasons that have nothing to do with the answer (formula constants, halves, angles). */
const COMMON = new Set([0.25, 0.5, 0.75, 1.5, 2.5, 16, 24, 32, 45, 48, 60, 64, 90, 100, 180, 360, 384, 1000]);

function distinctive(a: number): boolean {
  if (Number.isInteger(a) && a <= 12) return false;
  if (COMMON.has(a)) return false;
  return significantDigits(String(a)) >= 2;
}

/** True when the number at `start` is being stated as a result ("= 43.2", "is about 43.2", "gives $43.2$"). */
function asserted(text: string, start: number): boolean {
  const before = text.slice(Math.max(0, start - 40), start).toLowerCase();
  return /(?:=|≈|\\approx|\\simeq|\b(?:is|are|was|be|equals?|get|gets|got|gives?|giving|obtain|yields?|about|roughly|around|approximately|comes? to|out to|out as|answer|result|total|sum|leaving|namely)\b:?)\s*(?:\$\$?|\\\(|\\\[|[-−+~(]|\\,|\\;|\s)*$/.test(before);
}

/** For a step whose answer is zero: "the answer is zero", "so it equals zero". */
const STATES_ZERO = /\b(?:answer|result|value|it|that|this)\b[^.?!]{0,20}\b(?:is|equals|=|comes to|must be)\s+(?:exactly\s+)?(?:zero|nothing|\$?0\$?)(?=[\s.,!?;:)]|$)/i;

/** "the answer is 12", "the final answer would be $43.2$": the number such a phrase asserts, if any. */
const ANSWER_VALUE = /\b(?:final |correct |right |actual )?answer\s+(?:is|=|would be|should be|will be|comes? out (?:to|as)|works? out (?:to|as)|turns? out to be)\s*:?\s*(?:just |simply |exactly |about |roughly |approximately )?(?:\$\$?|\\\(|\\\[|[(~])?\s*(?=[-−+.\d])/gi;

function assertsAnswerValue(text: string, answer: number): boolean {
  for (const m of text.matchAll(ANSWER_VALUE)) {
    const stated = numbersIn(text.slice(m.index + m[0].length, m.index + m[0].length + 40))[0];
    if (stated && stated.start <= 1 && close(Math.abs(stated.value), Math.abs(answer))) return true;
  }
  return false;
}

function leaksNumber(text: string, answer: number, givens: number[]): boolean {
  // An outright "the answer is <that number>" is a leak whatever the number is, zero and small integers included.
  if (assertsAnswerValue(text, answer)) return true;
  const A = Math.abs(answer);
  if (A === 0) return STATES_ZERO.test(text); // a bare "= 0" is everywhere in mechanics, so only an explicit statement counts
  if (givens.some((g) => close(Math.abs(g), A, 1e-9))) return false; // indistinguishable from restating the problem
  const scaled = [A * 1e3, A * 1e-3, A * 1e6, A * 1e-6];
  for (const n of numbersIn(text)) {
    const v = Math.abs(n.value);
    if (close(v, A)) {
      if (distinctive(A) || asserted(text, n.start)) return true;
    } else if (n.sig >= 3 && scaled.some((s) => close(v, s))) {
      return true; // the same answer in other units, e.g. 3948 N for 3.948 kN
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Choices, matrices, phrases                                          */
/* ------------------------------------------------------------------ */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\$\$?|\\\(|\\\)|\\\[|\\\]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/^[\s"'.]+|[\s"'.]+$/g, "");

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function leaksChoice(text: string, correctAnswer: string): boolean {
  const t = norm(text);
  const correct = norm(correctAnswer);
  if (!correct) return false;

  if (correct === "true" || correct === "false") {
    const other = correct === "true" ? "false" : "true";
    const verdict = new RegExp(`\\b(?:statement|claim|it|that|this|answer)\\b(?:\\s+(?:is|was|must be|has to be|would be|turns out to be)|'s|:)\\s+(?:indeed |actually |definitely |clearly |in fact )?(?:${correct}|not ${other})\\b`);
    const pick = new RegExp(`\\b(?:choose|pick|select|go with|answer)\\s+"?${correct}\\b`);
    return verdict.test(t) || pick.test(t);
  }

  // a long option quoted outright
  if (correct.length >= 24 && t.includes(correct)) return true;

  // a short option named as the one to choose
  if (correct.length < 24) {
    const c = escapeRe(correct);
    const named = new RegExp(`\\b(?:answer|option|choice|one)\\b[^.?!]{0,30}\\b(?:is|would be|must be|should be)\\s+"?${c}"?(?=[\\s.,!?;:)]|$)`);
    const pick = new RegExp(`\\b(?:choose|pick|select|go with)\\s+"?${c}"?(?=[\\s.,!?;:)]|$)`);
    return named.test(t) || pick.test(t);
  }
  return false;
}

function leaksEveryChoice(text: string, correctAnswer: string): boolean {
  const parts = correctAnswer.split(" + ").map(norm).filter(Boolean);
  if (parts.length < 2 || parts.some((p) => p.length < 16)) return false;
  const t = norm(text);
  return parts.every((p) => t.includes(p));
}

/**
 * The entries of everything written as a matrix or a bracketed list: TeX matrix
 * environments, and runs like "[[1, 2], [3, 4]]" or "(1, 2)".
 */
function matricesIn(text: string): number[][] {
  const blocks: string[] = [];
  for (const m of text.matchAll(/\\begin\{[bpvBV]?matrix\}([\s\S]*?)\\end\{[bpvBV]?matrix\}/g)) blocks.push(m[1]);
  const plain = text.replace(/\\begin\{[bpvBV]?matrix\}[\s\S]*?\\end\{[bpvBV]?matrix\}/g, " ");
  for (const m of plain.matchAll(/[[(][[\]()\d\s,;.\-−]*[\])]/g)) blocks.push(m[0]);
  return blocks.map((b) => numbersIn(b.replace(/\\\\/g, " ; ").replace(/&/g, " , ")).map((n) => n.value)).filter((b) => b.length >= 2);
}

const sameEntries = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= 1e-6);

function leaksMatrix(text: string, correctAnswer: string, problem: string): boolean {
  const answer = numbersIn(correctAnswer).map((n) => n.value);
  if (answer.length < 2) return false;
  if (matricesIn(problem).some((m) => sameEntries(m, answer))) return false; // the answer matrix is already printed in the problem
  return matricesIn(text).some((m) => sameEntries(m, answer));
}

/** "the answer is option …", "the answer is "At the wall"", "the answer is true" — an option being named. */
const ANSWER_OPTION =
  /\b(?:final |correct |right |actual )?answer\s+(?:is|=|would be|should be|will be|turns? out to be)\s*:?\s*(?:just |simply |exactly )?(?=["“']|option\b|choice\b|true\b|false\b)/i;

const CORRECT_OPTION_PHRASE = /\b(?:correct|right)\s+(?:answer|option|choice|one|statement)s?\s+(?:is|are|would be|must be)\b|\b(?:option|choice)s?\s+[^.?!]{0,60}\b(?:is|are)\s+(?:the\s+)?(?:correct|right)(?:\s+(?:one|answer|ones))?\b/i;

/**
 * Does this text give away the answer to the step described by `ctx`?
 * `text` is everything the tutor has said so far in this reply.
 */
export function leaksAnswer(text: string, ctx: GuardContext): boolean {
  if (!isGuarded(ctx) || !ctx.correctAnswer) return false;

  const problem = [ctx.body, ctx.question ?? "", ...(ctx.choices ?? []).map((c) => c.text)].join("\n");
  switch (ctx.stepType) {
    case "numeric": {
      const answer = Number(ctx.correctAnswer);
      return Number.isFinite(answer) && leaksNumber(text, answer, numbersIn(problem).map((n) => n.value));
    }
    case "mc":
      return ANSWER_OPTION.test(text) || CORRECT_OPTION_PHRASE.test(text) || leaksChoice(text, ctx.correctAnswer);
    case "multi":
      return ANSWER_OPTION.test(text) || CORRECT_OPTION_PHRASE.test(text) || leaksEveryChoice(text, ctx.correctAnswer);
    case "matrix":
      return leaksMatrix(text, ctx.correctAnswer, problem);
    default:
      return false;
  }
}

/* ------------------------------------------------------------------ */
/* Sentence-by-sentence release                                        */
/* ------------------------------------------------------------------ */

const REDIRECT = "That would be handing you the answer, so I'll stop short of it.";
const NEXT_STEP = "Work the next step yourself and tell me what you get and how you got it. I'll check the reasoning with you.";

/** Plain-language hints can be shown as they are; hints with TeX in them have lost their math delimiters by this point. */
const usableHint = (hint: string | undefined) => (hint && !/[\\$]/.test(hint) ? hint.trim() : null);

/**
 * Releases a streamed reply one sentence at a time, and never releases a sentence
 * once the text so far would give the answer away.
 */
export class GuardedReply {
  private pending = "";
  private released = "";
  blocked = false;

  constructor(private readonly ctx: GuardContext) {}

  /** Add streamed text; returns whatever is now safe to show. */
  push(delta: string): string {
    if (this.blocked) return "";
    this.pending += delta;
    // a sentence ends at . ! or ? followed by white space, or at a line break
    let cut = -1;
    for (const m of this.pending.matchAll(/[.!?]["”')\]]*\s+|\n+/g)) cut = m.index + m[0].length;
    if (cut <= 0) return "";
    return this.release(this.pending.slice(0, cut), this.pending.slice(cut));
  }

  /** The stream has ended: release or replace whatever is left. */
  flush(): string {
    if (this.blocked || !this.pending) return "";
    return this.release(this.pending, "");
  }

  private release(candidate: string, rest: string): string {
    if (leaksAnswer(this.released + candidate, this.ctx)) {
      this.blocked = true;
      this.pending = "";
      const hint = usableHint(this.ctx.hint);
      const replacement = this.released.trim() ? `${REDIRECT} ${NEXT_STEP}` : `${REDIRECT} ${hint ? `Here is a hint instead: ${hint}` : NEXT_STEP}`;
      const out = (this.released && !/\s$/.test(this.released) ? " " : "") + replacement;
      this.released += out;
      return out;
    }
    this.released += candidate;
    this.pending = rest;
    return candidate;
  }
}

/** A `streamText` transform that passes the tutor's reply through a `GuardedReply`. */
export function answerGuard<TOOLS extends ToolSet>(ctx: GuardContext): StreamTextTransform<TOOLS> {
  return () => {
    const guard = new GuardedReply(ctx);
    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(chunk, controller) {
        if (chunk.type === "text-delta") {
          const safe = guard.push(chunk.text);
          if (safe) controller.enqueue({ ...chunk, text: safe });
          return;
        }
        if (chunk.type === "text-end") {
          const safe = guard.flush();
          if (safe) controller.enqueue({ type: "text-delta", id: chunk.id, text: safe });
        }
        controller.enqueue(chunk);
      },
    });
  };
}
