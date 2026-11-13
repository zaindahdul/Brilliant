import type { QuestionStep } from "@/content/types";
import { toPlainText } from "@/lib/markdown";

/**
 * The correct answer of a step as plain text, in the one format both the tutor's
 * instructions and the answer guard read: a bare number for numeric steps, the
 * option text for multiple choice, the option texts joined by " + " for
 * select-all, rows like "[1, 2] [3, 4]" for matrices.
 */
export function plainCorrectAnswer(step: QuestionStep): string {
  switch (step.type) {
    case "mc":
      return toPlainText(step.choices.find((c) => c.id === step.correct)?.text ?? "");
    case "multi":
      return step.correct.map((id) => toPlainText(step.choices.find((c) => c.id === id)?.text ?? "")).join(" + ");
    case "numeric":
      return String(step.answer);
    case "matrix":
      return step.answer.map((r) => `[${r.join(", ")}]`).join(" ");
    case "order":
      return step.correct.map((id) => toPlainText(step.items.find((x) => x.id === id)?.text ?? "")).join(" → ");
    case "goal":
      return "the diagram must satisfy the stated goal";
  }
}
