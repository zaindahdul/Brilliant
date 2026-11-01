import { describe, expect, it } from "vitest";
import { courses, allLessonIds } from "@/content/course";
import { generate, hasGenerator, listGenerators } from "@/content/generators";
import { validateQuestion, validateUnit } from "./helpers/validate";

describe("course content", () => {
  it("has unique lesson ids and unit ids across courses", () => {
    const ids = allLessonIds();
    expect(new Set(ids).size).toBe(ids.length);
    const unitIds = courses.flatMap((c) => c.units.map((u) => u.id));
    expect(new Set(unitIds).size).toBe(unitIds.length);
    const courseIds = courses.map((c) => c.id);
    expect(new Set(courseIds).size).toBe(courseIds.length);
  });

  for (const c of courses) {
    for (const u of c.units) {
      it(`${c.id}/${u.id}: every lesson and question is well-formed and self-consistent`, () => {
        validateUnit(u);
      });
    }
  }

  it("every unit's generators exist and belong to that unit", () => {
    for (const c of courses) {
      for (const u of c.units) {
        for (const g of u.generators) {
          expect(hasGenerator(g), `${u.id} references ${g}`).toBe(true);
          expect(generate(g, 1)!.unitId, `${g} should belong to ${u.id}`).toBe(u.id);
        }
      }
    }
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
