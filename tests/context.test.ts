import { describe, expect, it } from "vitest";
import { courses } from "@/content/course";
import { lessonContextFor, refersBack, withLessonContext } from "@/content/context";
import { numeric, reading, tf } from "@/content/dsl";
import type { Lesson } from "@/content/types";
import { isQuestion } from "@/content/types";
import { parseBlocks, toPlainText } from "@/lib/markdown";

function lesson(steps: Lesson["steps"]): Lesson {
  return { id: "t-l1", unitId: "t", title: "t", summary: "", minutes: 5, steps };
}

const setup = reading("setup", "A steel bar ($E = 200$ GPa, $A = 400$ mm²) carries $P = 50$ kN.");
const q1 = numeric("sigma", { question: "What is the normal stress, in MPa?", answer: 125, hint: "h", explanation: "e" });
const q2 = numeric("delta", { question: "For the same bar, with $L = 2$ m, what is the elongation in mm?", answer: 1.25, hint: "h", explanation: "e" });
const q3 = tf("tf", { statement: "If a system has a solution, that solution must be unique.", answer: false, hint: "h", explanation: "e" });

describe("lesson context for replayed questions", () => {
  it("detects wording that points back at an earlier step", () => {
    expect(refersBack("For the same bar, what is $\\delta$?")).toBe(true);
    expect(refersBack("Same shaft, same twist rate. What is $\\gamma$ at $r = 5$ mm?")).toBe(true);
    expect(refersBack("In that same system, if you choose $x_3 = 2$, what is $x_1$?")).toBe(true);
    expect(refersBack("Now compute $BA$.")).toBe(true);
    expect(refersBack("What is the determinant of a square matrix that has a row of zeros?")).toBe(false);
    expect(refersBack("A bar of length 2 m carries 50 kN. What is the stress?")).toBe(false);
  });

  it("folds the setup and the earlier question into a dependent step", () => {
    const l = lesson([setup, q1, q2]);
    const ctx = lessonContextFor(l, 2)!;
    expect(ctx).toBeTruthy();
    expect(ctx).toContain(setup.body);
    expect(ctx).toContain(q1.question);
    expect(ctx.indexOf(setup.body)).toBeLessThan(ctx.indexOf(q1.question));
    expect(parseBlocks(ctx)[0].t).toBe("callout");
    const step = withLessonContext(l, q2);
    expect(step.body).toContain(setup.body);
    expect(step.question).toBe(q2.question);
    // a self-contained question is left alone
    expect(lessonContextFor(l, 1)).toBeNull();
    expect(withLessonContext(l, q1)).toBe(q1);
  });

  it("stops at the nearest step that carries its own setup", () => {
    const withBody = numeric("own", { body: "A different rod: $L = 1$ m.", question: "What is its strain?", answer: 0, hint: "h", explanation: "e" });
    const l = lesson([setup, withBody, q2]);
    const ctx = lessonContextFor(l, 2)!;
    expect(ctx).toContain(withBody.body);
    expect(ctx).not.toContain(setup.body);
  });

  it("does not fire on 'that' used as a conjunction, and never without an earlier step", () => {
    expect(lessonContextFor(lesson([q3]), 0)).toBeNull();
    expect(lessonContextFor(lesson([q2]), 0)).toBeNull();
  });

  it("covers the known follow-up questions in the real courses", () => {
    const find = (id: string) => courses.flatMap((c) => c.units).flatMap((u) => u.lessons).find((l) => l.id === id)!;
    const torsion = find("sm6-l1-kinematics");
    const i = torsion.steps.findIndex((s) => s.id === "inner-strain");
    const ctx = lessonContextFor(torsion, i)!;
    expect(ctx).toBeTruthy();
    const prev = torsion.steps[i - 1];
    expect(isQuestion(prev) && ctx.includes(prev.question.trim())).toBe(true);

    const params = find("u1-l4-reading-solutions");
    const j = params.steps.findIndex((s) => s.id === "particular");
    expect(lessonContextFor(params, j)).toBeTruthy();

    // every context the courses produce parses as the dialect, and the feature is neither dead nor noisy
    let count = 0;
    let total = 0;
    for (const c of courses)
      for (const u of c.units)
        for (const l of u.lessons)
          l.steps.forEach((s, k) => {
            if (!isQuestion(s)) return;
            total++;
            const ctx = lessonContextFor(l, k);
            if (!ctx) return;
            count++;
            expect(toPlainText(ctx).length).toBeGreaterThan(20);
            parseBlocks(ctx);
          });
    expect(count).toBeGreaterThan(40);
    expect(count).toBeLessThan(total / 4);
  });
});
