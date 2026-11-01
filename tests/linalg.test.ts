import { describe, expect, it } from "vitest";
import { frac, fracMatrixToNumbers, parseFrac, toFracMatrix, fracToLatex } from "@/lib/fraction";
import { det, eigen2, inverse, isRef, isRref, leastSquaresLine, matMul, nullspaceBasis, projectOnto, rank, ref, rref, solve, gramSchmidt } from "@/lib/linalg";

describe("fractions", () => {
  it("normalises and parses", () => {
    expect(frac(2, 4)).toEqual({ n: 1, d: 2 });
    expect(frac(3, -6)).toEqual({ n: -1, d: 2 });
    expect(parseFrac("-3/4")).toEqual({ n: -3, d: 4 });
    expect(parseFrac("0.25")).toEqual({ n: 1, d: 4 });
    expect(parseFrac("1/0")).toBeNull();
    expect(fracToLatex(frac(-3, 4))).toBe("-\\tfrac{3}{4}");
  });
});

describe("rref", () => {
  it("reduces to the unique reduced echelon form", () => {
    const m = toFracMatrix([
      [1, 2, 3],
      [2, 4, 7],
    ]);
    const { matrix, pivotCols } = rref(m);
    expect(fracMatrixToNumbers(matrix)).toEqual([
      [1, 2, 0],
      [0, 0, 1],
    ]);
    expect(pivotCols).toEqual([0, 2]);
    expect(isRref(matrix)).toBe(true);
    expect(isRef(m)).toBe(false);
  });
  it("handles the 3x4 lesson example", () => {
    const m = toFracMatrix([
      [1, 1, 1, 6],
      [0, 1, 1, 4],
      [1, 2, 3, 11],
    ]);
    expect(fracMatrixToNumbers(rref(m).matrix)).toEqual([
      [1, 0, 0, 2],
      [0, 1, 0, 3],
      [0, 0, 1, 1],
    ]);
    const r = ref(m);
    expect(isRef(r.matrix)).toBe(true);
  });
  it("isRef / isRref edge cases", () => {
    expect(isRef(toFracMatrix([[0, 0, 0], [0, 0, 1]]))).toBe(false);
    expect(isRef(toFracMatrix([[0, 1, 2], [1, 0, 3]]))).toBe(false);
    expect(isRef(toFracMatrix([[1, 2, 0], [0, 1, 3], [0, 0, 0]]))).toBe(true);
    expect(isRref(toFracMatrix([[1, 2, 0], [0, 1, 3], [0, 0, 0]]))).toBe(false);
    expect(isRref(toFracMatrix([[1, 0, 2], [0, 1, -1]]))).toBe(true);
    expect(isRref(toFracMatrix([[2, 0, 0], [0, 1, 0]]))).toBe(false);
  });
});

describe("det / inverse / nullspace", () => {
  it("computes determinants exactly", () => {
    expect(det(toFracMatrix([[1, 2], [3, 4]]))).toEqual({ n: -2, d: 1 });
    expect(det(toFracMatrix([[1, 0, 0], [0, 2, 0], [0, 0, 3]]))).toEqual({ n: 6, d: 1 });
    expect(det(toFracMatrix([[0, 1], [1, 0]]))).toEqual({ n: -1, d: 1 });
  });
  it("det of a specific 3x3", () => {
    // 2*(3*1-2*1) - 0*(1*1-2*1) + 1*(1*1-3*1) = 2*1 + 1*(-2) = 0
    expect(det(toFracMatrix([[2, 0, 1], [1, 3, 2], [1, 1, 1]]))).toEqual({ n: 0, d: 1 });
    expect(det(toFracMatrix([[1, 2, 3], [0, 1, 4], [5, 6, 0]]))).toEqual({ n: 1, d: 1 });
  });
  it("inverts and detects singular", () => {
    const A = toFracMatrix([[2, 1], [5, 3]]);
    const inv = inverse(A)!;
    expect(fracMatrixToNumbers(inv)).toEqual([[3, -1], [-5, 2]]);
    expect(fracMatrixToNumbers(matMul(A, inv))).toEqual([[1, 0], [0, 1]]);
    expect(inverse(toFracMatrix([[1, 2], [2, 4]]))).toBeNull();
  });
  it("nullspace basis and solve", () => {
    const A = toFracMatrix([[1, 2, 0], [0, 0, 1]]);
    const ns = nullspaceBasis(A);
    expect(ns.map((v) => v.map((x) => x.n / x.d))).toEqual([[-2, 1, 0]]);
    expect(rank(A)).toBe(2);
    const sol = solve(toFracMatrix([[1, 2], [3, 7]]), [frac(5), frac(16)])!;
    expect(sol.particular.map((x) => x.n / x.d)).toEqual([3, 1]);
    expect(solve(toFracMatrix([[1, 1], [1, 1]]), [frac(3), frac(5)])).toBeNull();
  });
});

describe("float geometry", () => {
  it("eigen2 real and complex", () => {
    const e = eigen2([[2, 0], [0, 3]]);
    expect(e.real).toBe(true);
    if (e.real) expect([...e.values].sort()).toEqual([2, 3]);
    const rot = eigen2([[0, -1], [1, 0]]);
    expect(rot.real).toBe(false);
    const sh = eigen2([[2, 1], [1, 2]]);
    if (sh.real) {
      expect(sh.values[0]).toBeCloseTo(3);
      expect(sh.values[1]).toBeCloseTo(1);
      // eigenvector for 3 is along (1,1)
      expect(Math.abs(sh.vectors[0][0] - sh.vectors[0][1])).toBeLessThan(1e-9);
    }
  });
  it("projection, least squares, gram-schmidt", () => {
    expect(projectOnto([3, 1], [1, 1])).toEqual([2, 2]);
    const ls = leastSquaresLine([[0, 1], [1, 3], [2, 5]]);
    expect(ls.m).toBeCloseTo(2);
    expect(ls.b).toBeCloseTo(1);
    const gs = gramSchmidt([[1, 1, 0], [1, 0, 1]]);
    expect(gs[0]).toEqual([1, 1, 0]);
    expect(gs[1][0] * gs[0][0] + gs[1][1] * gs[0][1] + gs[1][2] * gs[0][2]).toBeCloseTo(0);
  });
});
