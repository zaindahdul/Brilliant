import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import type { VisualSpec } from "@/content/types";
import { Visual } from "@/components/visuals/Visual";
import { principalPlane, transformPlane } from "@/components/visuals/solid/MohrCircle";
import { deflection, maxDeflection } from "@/components/visuals/solid/BeamDeflection";
import { CLAMPED_PINNED_ROOT, COLUMNS } from "@/components/visuals/solid/ColumnBuckling";
import { buckledAngle, energy } from "@/components/visuals/solid/LinkStability";

/** The mechanics behind the visuals for the later solid-mechanics units, checked against the textbook results. */

describe("Mohr's circle", () => {
  it("transforms a plane state of stress (Govindjee eqs 9.23–9.25)", () => {
    const t = transformPlane(80, 20, 30, 30);
    expect(t.xx).toBeCloseTo(90.981, 2);
    expect(t.yy).toBeCloseTo(9.019, 2);
    expect(t.xy).toBeCloseTo(-10.981, 2);
    // invariants: trace and determinant
    expect(t.xx + t.yy).toBeCloseTo(100, 9);
    expect(t.xx * t.yy - t.xy ** 2).toBeCloseTo(80 * 20 - 30 ** 2, 6);
  });

  it("returns to itself after 180° and swaps the faces after 90°", () => {
    const a = transformPlane(60, -20, 30, 180);
    expect(a.xx).toBeCloseTo(60, 9);
    expect(a.xy).toBeCloseTo(30, 9);
    const b = transformPlane(60, -20, 30, 90);
    expect(b.xx).toBeCloseTo(-20, 9);
    expect(b.yy).toBeCloseTo(60, 9);
    expect(b.xy).toBeCloseTo(-30, 9);
  });

  it("finds principal values and the principal angle", () => {
    const p = principalPlane(90, 10, 30);
    expect(p.s1).toBeCloseTo(100, 9);
    expect(p.s2).toBeCloseTo(0, 9);
    expect(p.R).toBeCloseTo(50, 9);
    expect(p.thetaP).toBeCloseTo(18.435, 3);
    // no shear in the principal axes, and the normal stress there is s1
    const t = transformPlane(90, 10, 30, p.thetaP);
    expect(t.xy).toBeCloseTo(0, 9);
    expect(t.xx).toBeCloseTo(100, 9);
  });

  it("handles pure shear and the hydrostatic point", () => {
    const shear = principalPlane(0, 0, 60);
    expect([shear.s1, shear.s2, shear.thetaP]).toEqual([60, -60, 45]);
    const point = principalPlane(40, 40, 0);
    expect(point.R).toBe(0);
    expect(point.thetaP).toBe(0);
  });
});

describe("beam deflection", () => {
  const L = 2000;
  const EI = 1.6e12;

  it("matches the standard results", () => {
    expect(deflection("cantilever", { kind: "point", x: L, P: 1200 }, L, EI, L)).toBeCloseTo(-(1200 * L ** 3) / (3 * EI), 9);
    expect(deflection("cantilever", { kind: "udl", w: 4 }, L, EI, L)).toBeCloseTo(-(4 * L ** 4) / (8 * EI), 9);
    expect(deflection("simple", { kind: "point", x: L / 2, P: 1200 }, L, EI, L / 2)).toBeCloseTo(-(1200 * L ** 3) / (48 * EI), 9);
    expect(deflection("simple", { kind: "udl", w: 4 }, L, EI, L / 2)).toBeCloseTo(-(5 * 4 * L ** 4) / (384 * EI), 9);
  });

  it("respects the supports and is continuous under a point load", () => {
    const load = { kind: "point", x: 700, P: 900 } as const;
    expect(deflection("simple", load, L, EI, 0)).toBeCloseTo(0, 12);
    expect(deflection("simple", load, L, EI, L)).toBeCloseTo(0, 12);
    expect(deflection("cantilever", load, L, EI, 0)).toBeCloseTo(0, 12);
    for (const support of ["simple", "cantilever"] as const) {
      expect(deflection(support, load, L, EI, 700 - 1e-6)).toBeCloseTo(deflection(support, load, L, EI, 700 + 1e-6), 6);
    }
    // a cantilever is straight beyond the load: the slope there is −Pa²/(2EI)
    const a = 700;
    const slope = (deflection("cantilever", load, L, EI, 1500) - deflection("cantilever", load, L, EI, 1000)) / 500;
    expect(slope).toBeCloseTo(-(900 * a * a) / (2 * EI), 12);
  });

  it("finds the largest deflection", () => {
    const tip = maxDeflection("cantilever", { kind: "point", x: L, P: 1200 }, L, EI);
    expect(tip.x).toBe(L);
    expect(tip.v).toBeCloseTo(-2, 9);
    const mid = maxDeflection("simple", { kind: "udl", w: 6 }, 4000, 2e13);
    expect(mid.x).toBe(2000);
    expect(mid.v).toBeCloseTo(-1, 9);
  });
});

describe("column buckling", () => {
  it("has critical loads consistent with the effective-length factors", () => {
    for (const c of Object.values(COLUMNS)) expect(c.ratio).toBeCloseTo(1 / c.K ** 2, 9);
    expect(COLUMNS["clamped-pinned"].ratio).toBeCloseTo(2.0457, 3);
    expect(COLUMNS["clamped-pinned"].K).toBeCloseTo(0.699, 3);
    expect(Math.tan(CLAMPED_PINNED_ROOT)).toBeCloseTo(CLAMPED_PINNED_ROOT, 9);
  });

  it("has mode shapes that satisfy the end conditions and peak at 1", () => {
    const h = 1e-5;
    const slope = (f: (s: number) => number, s: number) => (f(s + h) - f(s - h)) / (2 * h);
    for (const [ends, c] of Object.entries(COLUMNS)) {
      expect(c.shape(0), ends).toBeCloseTo(0, 9);
      const peak = Math.max(...Array.from({ length: 1001 }, (_, i) => Math.abs(c.shape(i / 1000))));
      expect(peak, ends).toBeCloseTo(1, 3);
    }
    expect(COLUMNS["pinned-pinned"].shape(1)).toBeCloseTo(0, 9);
    expect(COLUMNS["clamped-pinned"].shape(1)).toBeCloseTo(0, 9);
    expect(COLUMNS["clamped-clamped"].shape(1)).toBeCloseTo(0, 9);
    // clamped ends have zero slope
    expect(slope(COLUMNS["clamped-free"].shape, 0)).toBeCloseTo(0, 4);
    expect(slope(COLUMNS["clamped-pinned"].shape, 0)).toBeCloseTo(0, 4);
    expect(slope(COLUMNS["clamped-clamped"].shape, 0)).toBeCloseTo(0, 4);
    expect(slope(COLUMNS["clamped-clamped"].shape, 1)).toBeCloseTo(0, 4);
  });
});

describe("rigid link on a torsional spring", () => {
  it("has a tilted equilibrium only above the critical load", () => {
    expect(buckledAngle(0.5)).toBeNull();
    expect(buckledAngle(1)).toBeNull();
    const t = buckledAngle(1.5)!;
    expect(t - 1.5 * Math.sin(t)).toBeCloseTo(0, 9);
    // P = (k/L) θ/sin θ at θ = 0.5 rad is 4.29 % above critical
    expect(buckledAngle(0.5 / Math.sin(0.5))).toBeCloseTo(0.5, 6);
  });

  it("is a valley below the critical load and a hilltop above it", () => {
    const curvature = (lambda: number) => (energy(lambda, 1e-3) - 2 * energy(lambda, 0) + energy(lambda, -1e-3)) / 1e-6;
    expect(curvature(0.6)).toBeCloseTo(0.4, 4);
    expect(curvature(1.4)).toBeCloseTo(-0.4, 4);
  });
});

describe("the new visuals survive degenerate configs", () => {
  const cases: VisualSpec[] = [
    { kind: "mohr-circle", config: { sxx: 0, syy: 0, sxy: 0, sliders: true } },
    { kind: "mohr-circle", config: { sxx: 40, syy: 40, sxy: 0, theta: 200, unit: "MPa" } },
    { kind: "mohr-circle", config: { sxx: -500, syy: 100, sxy: 150, quantity: "strain", unit: "μ", max: 600, sliders: true } },
    { kind: "beam-deflection", config: { length: 0, support: "simple", load: { kind: "udl", w: 0 }, EI: 0, sliders: true } },
    { kind: "beam-deflection", config: { length: 3000, support: "cantilever", load: { kind: "point", x: 9000, P: -500 }, EI: 1e12, sliders: true, units: { length: "mm", force: "N" } } },
    { kind: "beam-deflection", config: { length: 4, support: "simple", load: { kind: "point", x: 1, P: 10 }, EI: 2000 } },
    { kind: "column-buckling", config: { ends: "clamped-pinned", load: 99, sliders: true } },
    { kind: "column-buckling", config: { ends: "clamped-free" } },
    { kind: "link-stability", config: { load: 0, theta: 0 } },
    { kind: "link-stability", config: { load: 9, theta: -400, sliders: true } },
  ];
  for (const spec of cases) {
    it(`${spec.kind} ${JSON.stringify(spec.config).slice(0, 60)}`, () => {
      const html = renderToString(createElement(Visual, { spec }));
      expect(html.length).toBeGreaterThan(100);
      expect(html).not.toMatch(/NaN/);
      expect(html).not.toMatch(/undefined/);
    });
  }
});
