import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { courses } from "@/content/course";
import type { VisualSpec } from "@/content/types";
import { Visual } from "@/components/visuals/Visual";

/**
 * Every visual configured anywhere in the course content must server-render
 * without throwing (lesson pages are prerendered, so this mirrors the build)
 * and produce real markup. Catches NaN geometry, bad configs and runtime
 * errors in the interactive components with the exact configs authors wrote.
 */
function allVisuals(): { where: string; spec: VisualSpec }[] {
  const out: { where: string; spec: VisualSpec }[] = [];
  for (const c of courses) {
    for (const u of c.units) {
      for (const l of u.lessons) for (const s of l.steps) if (s.visual) out.push({ where: `${l.id}/${s.id}`, spec: s.visual });
      for (const s of u.practice) if (s.visual) out.push({ where: `${u.id}/practice/${s.id}`, spec: s.visual });
    }
  }
  return out;
}

describe("visuals render on the server", () => {
  const visuals = allVisuals();
  it("has visuals to test", () => {
    expect(visuals.length).toBeGreaterThan(0);
  });
  for (const { where, spec } of visuals) {
    it(`${where} (${spec.kind})`, () => {
      const html = renderToString(createElement(Visual, { spec }));
      expect(html.length).toBeGreaterThan(100);
      expect(html).not.toMatch(/NaN/);
      expect(html).not.toMatch(/undefined/);
    });
  }
});

describe("solid-mechanics visuals survive degenerate configs", () => {
  const cases: VisualSpec[] = [
    { kind: "axial-bar", config: { segments: [{ length: 100, E: 200000, A: 50 }], fixed: "both", loads: [], show: ["R", "sigma", "u"] } },
    { kind: "axial-bar", config: { segments: [{ length: 100, E: 200000, A: 50 }], fixed: "right", loads: [{ x: 0, P: -1000 }], distributed: 2, show: ["R", "u"], sliders: true } },
    { kind: "stress-element", config: { sxx: 0, syy: 0, sxy: 0, sliders: true, cut: { theta: 90, slider: true } } },
    { kind: "strain-grid", config: { grad: [[0, 0], [0, 0]], sliders: true } },
    { kind: "torsion-section", config: { T: 0, ro: 10, ri: 0, sliders: true } },
    { kind: "torsion-section", config: { T: 500000, ro: 25, ri: 20, G: 80000, units: { torque: "N·mm", length: "mm", stress: "MPa" } } },
    { kind: "beam-section", config: { M: 0, section: { kind: "box", b: 100, h: 200, t: 10 } } },
    { kind: "beam-section", config: { M: 4e6, section: { kind: "tee", bf: 200, tf: 20, hw: 100, tw: 20 }, sliders: true } },
    { kind: "beam-section", config: { M: -4e6, section: { kind: "ibeam", bf: 100, tf: 10, hw: 180, tw: 8 } } },
    { kind: "shear-moment", config: { length: 6, support: "simple", loads: [], sliders: true } },
    { kind: "shear-moment", config: { length: 2, support: "cantilever-left", loads: [{ kind: "point", x: 2, P: 5 }, { kind: "udl", from: 0, to: 1, w: 3 }, { kind: "moment", x: 1, M: 2 }] } },
    { kind: "shear-moment", config: { length: 3, support: "cantilever-right", loads: [{ kind: "udl", from: 0, to: 3, w: 2 }] } },
    { kind: "pressure-vessel", config: { kind: "sphere", p: 1, r: 10, t: 20, sliders: true } },
    { kind: "pressure-vessel", config: { kind: "cylinder", p: 0, r: 500, t: 0 } },
  ];
  for (const spec of cases) {
    it(`${spec.kind} ${JSON.stringify(spec.config).slice(0, 60)}`, () => {
      const html = renderToString(createElement(Visual, { spec }));
      expect(html.length).toBeGreaterThan(100);
    });
  }
});
