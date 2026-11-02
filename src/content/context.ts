import type { Lesson, QuestionStep, Rich } from "./types";
import { isQuestion } from "./types";
import { toPlainText } from "@/lib/markdown";

/**
 * Lesson questions often lean on the step before them ("Same shaft, same twist
 * rate…", "For the same rod…", "In that same system…"). Inside the lesson that
 * reads naturally; replayed on its own in a review set the data is missing.
 *
 * `withLessonContext` prepends the setup from the preceding steps to such a
 * step's body, so the learner — and the tutor, which reads the same body — see
 * what the question refers to. It only fires for steps that have no body of
 * their own and whose question points backwards; a false positive just shows a
 * little extra lesson material above the question.
 */

const REFERS_BACK =
  /\b(?:same|previous|earlier|above|again|still|now|this time|these two|those|back to|return(?:ing)? to|that (?!the\b|a\b|an\b|is\b|are\b|it\b|there\b|if\b|when\b|every\b|any\b|all\b|contains?\b|has\b|have\b|must\b|can\b|cannot\b|will\b|would\b|should\b|does\b|do\b|follows?\b|gives?\b|says?\b|makes?\b|means?\b)\w)/i;

/** How many steps back to look for the setup. */
const MAX_BACK = 4;

/** True when the question's wording points at an earlier step. */
export function refersBack(question: Rich): boolean {
  return REFERS_BACK.test(toPlainText(question).replace(/\s+/g, " "));
}

/**
 * The lesson material a step at `index` depends on, or null when it stands on
 * its own. Walks back from the step collecting bodies and earlier questions,
 * stopping once a step that carries its own setup (a non-empty body) is included.
 */
export function lessonContextFor(lesson: Lesson, index: number): Rich | null {
  const step = lesson.steps[index];
  if (!step || !isQuestion(step) || step.body.trim() !== "" || !refersBack(step.question)) return null;

  const parts: Rich[] = [];
  for (let k = index - 1; k >= 0 && index - k <= MAX_BACK; k--) {
    const prev = lesson.steps[k];
    const piece: Rich[] = [];
    if (prev.body.trim()) piece.push(prev.body.trim());
    if (isQuestion(prev)) piece.push(`*Earlier question:* ${prev.question.trim()}`);
    parts.unshift(...piece);
    if (prev.body.trim()) break;
  }
  if (parts.length === 0) return null;

  return [`> **Earlier in this lesson** — the question below refers to this setup.`, ...parts].join("\n\n");
}

/** The step with its lesson context folded into the body (unchanged when it needs none). */
export function withLessonContext(lesson: Lesson, step: QuestionStep): QuestionStep {
  const index = lesson.steps.findIndex((s) => s.id === step.id);
  const context = lessonContextFor(lesson, index);
  if (!context) return step;
  return { ...step, body: step.body.trim() ? `${context}\n\n${step.body}` : context };
}
