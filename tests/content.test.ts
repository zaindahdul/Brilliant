import { describe, expect, it } from "vitest";
import { course, allLessonIds } from "@/content/course";
import { isQuestion, type QuestionStep, type Step } from "@/content/types";
import { toFracMatrix } from "@/lib/fraction";
import { rref, isRref, isRef } from "@/lib/linalg";
import { generate, hasGenerator, listGenerators } from "@/content/generators";
import { checkAnswer, formatAnswer } from "@/lib/check";
import { parseBlocks } from "@/lib/markdown";
import { classify } from "@/components/visuals/LinesCanvas";

function allSteps(): { where: string; step: Step }[] {
  const out: { where: string; step: Step }[] = [];
  for (const u of course.units) {
    for (const l of u.lessons) for (const s of l.steps) out.push({ where: `${l.id}/${s.id}`, step: s });
    for (const s of u.practice) out.push({ where: `${u.id}/practice/${s.id}`, step: s });
  }
  return out;
}

function validateQuestion(where: string, q: QuestionStep) {
  expect(q.question, where).toBeTruthy();
  expect(q.hint, where).toBeTruthy();
  expect(q.explanation, where).toBeTruthy();
  // the dialect must parse without throwing
  parseBlocks(q.question);
  parseBlocks(q.hint);
  parseBlocks(q.explanation);
  switch (q.type) {
    case "mc": {
      const ids = q.choices.map((c) => c.id);
      expect(new Set(ids).size, where).toBe(ids.length);
      expect(ids, where).toContain(q.correct);
      expect(q.choices.length, where).toBeGreaterThanOrEqual(2);
      break;
    }
    case "multi": {
      const ids = q.choices.map((c) => c.id);
      expect(new Set(ids).size, where).toBe(ids.length);
      for (const c of q.correct) expect(ids, where).toContain(c);
      expect(q.correct.length, where).toBeGreaterThan(0);
      break;
    }
    case "numeric":
      expect(Number.isFinite(q.answer), where).toBe(true);
      break;
    case "matrix": {
      expect(q.answer.length, where).toBeGreaterThan(0);
      const cols = q.answer[0].length;
      for (const row of q.answer) {
        expect(row.length, where).toBe(cols);
        for (const x of row) expect(Number.isFinite(x), where).toBe(true);
      }
      break;
    }
    case "order": {
      const ids = q.items.map((i) => i.id);
      expect(new Set(ids).size, where).toBe(ids.length);
      expect([...q.correct].sort(), where).toEqual([...ids].sort());
      break;
    }
    case "goal": {
      const v = q.visual;
      if (v.kind === "row-reducer") {
        const m = toFracMatrix(v.config.matrix);
        const target = v.config.target ?? "rref";
        // the goal must be reachable and not already satisfied
        if (target === "rref") {
          expect(isRref(m), `${where}: already reduced`).toBe(false);
          expect(isRref(rref(m).matrix), where).toBe(true);
        } else if (target === "ref") {
          expect(isRef(m), `${where}: already in echelon form`).toBe(false);
        }
      } else if (v.kind === "lines") {
        expect(v.config.goal, where).toBeTruthy();
        expect(v.config.lines.some((l) => l.editable), where).toBe(true);
        const [l1, l2] = v.config.lines;
        expect(classify(l1, l2), `${where}: goal already satisfied`).not.toBe(v.config.goal!.target);
      } else if (v.kind === "vectors" || v.kind === "transform") {
        expect(v.config.goal, where).toBeTruthy();
      } else {
        throw new Error(`${where}: goal step uses a visual without goal support`);
      }
      break;
    }
  }
  // the canonical answer must pass its own checker
  const canonical = canonicalAnswer(q);
  if (canonical) expect(checkAnswer(q, canonical).correct, `${where}: canonical answer fails check`).toBe(true);
  formatAnswer(q);
}

function canonicalAnswer(q: QuestionStep) {
  switch (q.type) {
    case "mc":
      return { kind: "choice" as const, id: q.correct };
    case "multi":
      return { kind: "choices" as const, ids: q.correct };
    case "numeric":
      return { kind: "number" as const, text: String(q.answer) };
    case "matrix":
      return { kind: "matrix" as const, cells: q.answer.map((r) => r.map(String)) };
    case "order":
      return { kind: "order" as const, ids: q.correct };
    case "goal":
      return null;
  }
}

describe("course content", () => {
  it("has unique lesson ids and step ids", () => {
    const ids = allLessonIds();
    expect(new Set(ids).size).toBe(ids.length);
    for (const u of course.units) {
      for (const l of u.lessons) {
        const sids = l.steps.map((s) => s.id);
        expect(new Set(sids).size, l.id).toBe(sids.length);
        expect(l.unitId, l.id).toBe(u.id);
        expect(l.steps.length, l.id).toBeGreaterThan(0);
        expect(l.steps.some(isQuestion), `${l.id} has no questions`).toBe(true);
      }
      const pids = u.practice.map((s) => s.id);
      expect(new Set(pids).size, u.id).toBe(pids.length);
    }
  });

  it("every question is well-formed and self-consistent", () => {
    for (const { where, step } of allSteps()) {
      parseBlocks(step.body);
      if (isQuestion(step)) validateQuestion(where, step);
    }
  });

  it("every unit's generators exist", () => {
    for (const u of course.units) for (const g of u.generators) expect(hasGenerator(g), `${u.id} references ${g}`).toBe(true);
  });
});

describe("generators", () => {
  it("produce valid, self-consistent problems across many seeds", () => {
    for (const g of listGenerators()) {
      for (let seed = 1; seed <= 40; seed++) {
        const p = generate(g.id, seed);
        expect(p, g.id).toBeTruthy();
        validateQuestion(`${g.id}#${seed}`, p!.step);
        expect(p!.step.id).toBe(p!.key);
      }
    }
  });
  it("are deterministic per seed", () => {
    for (const g of listGenerators()) {
      expect(JSON.stringify(generate(g.id, 7))).toBe(JSON.stringify(generate(g.id, 7)));
    }
  });
});
