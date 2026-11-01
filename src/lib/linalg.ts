/**
 * Linear algebra helpers used by generators, visuals and tests.
 * Exact (fraction) routines where correctness matters, float routines for
 * geometry.
 */
import { add, div, eq, frac, isZero, mul, neg, sub, type Frac, type FracMatrix, ZERO, ONE, toNumber } from "./fraction";

/* ------------------------------------------------------------------ */
/* Row operations (exact)                                              */
/* ------------------------------------------------------------------ */

export type RowOp =
  | { type: "swap"; i: number; j: number }
  | { type: "scale"; i: number; by: Frac }
  | { type: "replace"; i: number; j: number; by: Frac }; // R_i <- R_i + by * R_j

export function cloneMatrix(m: FracMatrix): FracMatrix {
  return m.map((row) => row.map((x) => ({ n: x.n, d: x.d })));
}

export function applyRowOp(m: FracMatrix, op: RowOp): FracMatrix {
  const out = cloneMatrix(m);
  switch (op.type) {
    case "swap": {
      [out[op.i], out[op.j]] = [out[op.j], out[op.i]];
      return out;
    }
    case "scale": {
      if (isZero(op.by)) throw new Error("cannot scale a row by 0");
      out[op.i] = out[op.i].map((x) => mul(x, op.by));
      return out;
    }
    case "replace": {
      if (op.i === op.j) throw new Error("replace needs two different rows");
      out[op.i] = out[op.i].map((x, k) => add(x, mul(op.by, out[op.j][k])));
      return out;
    }
  }
}

export function rowOpToLatex(op: RowOp): string {
  const f = (x: Frac) => (x.d === 1 ? String(x.n) : `\\tfrac{${x.n}}{${x.d}}`);
  switch (op.type) {
    case "swap":
      return `R_${op.i + 1} \\leftrightarrow R_${op.j + 1}`;
    case "scale":
      return `R_${op.i + 1} \\to ${f(op.by)}\\,R_${op.i + 1}`;
    case "replace": {
      const by = op.by;
      const sign = by.n < 0 ? "-" : "+";
      const abs = { n: Math.abs(by.n), d: by.d };
      const coef = abs.n === 1 && abs.d === 1 ? "" : f(abs) + "\\,";
      return `R_${op.i + 1} \\to R_${op.i + 1} ${sign} ${coef}R_${op.j + 1}`;
    }
  }
}

export interface RrefResult {
  matrix: FracMatrix;
  ops: RowOp[];
  pivotCols: number[];
}

/** Reduced row echelon form with the list of operations used. */
export function rref(input: FracMatrix): RrefResult {
  let m = cloneMatrix(input);
  const rows = m.length;
  const cols = m[0]?.length ?? 0;
  const ops: RowOp[] = [];
  const pivotCols: number[] = [];
  let r = 0;
  for (let c = 0; c < cols && r < rows; c++) {
    // find a pivot row (prefer a 1 or the first non-zero)
    let p = -1;
    for (let i = r; i < rows; i++) {
      if (!isZero(m[i][c])) {
        if (p === -1 || (eq(m[i][c], ONE) && !eq(m[p][c], ONE))) p = i;
      }
    }
    if (p === -1) continue;
    if (p !== r) {
      const op: RowOp = { type: "swap", i: r, j: p };
      m = applyRowOp(m, op);
      ops.push(op);
    }
    if (!eq(m[r][c], ONE)) {
      const op: RowOp = { type: "scale", i: r, by: div(ONE, m[r][c]) };
      m = applyRowOp(m, op);
      ops.push(op);
    }
    for (let i = 0; i < rows; i++) {
      if (i !== r && !isZero(m[i][c])) {
        const op: RowOp = { type: "replace", i, j: r, by: neg(m[i][c]) };
        m = applyRowOp(m, op);
        ops.push(op);
      }
    }
    pivotCols.push(c);
    r++;
  }
  return { matrix: m, ops, pivotCols };
}

/** Row echelon form (forward phase only). */
export function ref(input: FracMatrix): RrefResult {
  let m = cloneMatrix(input);
  const rows = m.length;
  const cols = m[0]?.length ?? 0;
  const ops: RowOp[] = [];
  const pivotCols: number[] = [];
  let r = 0;
  for (let c = 0; c < cols && r < rows; c++) {
    let p = -1;
    for (let i = r; i < rows; i++) {
      if (!isZero(m[i][c])) {
        p = i;
        break;
      }
    }
    if (p === -1) continue;
    if (p !== r) {
      const op: RowOp = { type: "swap", i: r, j: p };
      m = applyRowOp(m, op);
      ops.push(op);
    }
    for (let i = r + 1; i < rows; i++) {
      if (!isZero(m[i][c])) {
        const op: RowOp = { type: "replace", i, j: r, by: neg(div(m[i][c], m[r][c])) };
        m = applyRowOp(m, op);
        ops.push(op);
      }
    }
    pivotCols.push(c);
    r++;
  }
  return { matrix: m, ops, pivotCols };
}

export function isRef(m: FracMatrix): boolean {
  let lastPivot = -1;
  let seenZeroRow = false;
  for (const row of m) {
    const lead = row.findIndex((x) => !isZero(x));
    if (lead === -1) {
      seenZeroRow = true;
      continue;
    }
    if (seenZeroRow) return false;
    if (lead <= lastPivot) return false;
    lastPivot = lead;
  }
  return true;
}

export function isRref(m: FracMatrix): boolean {
  if (!isRef(m)) return false;
  for (let i = 0; i < m.length; i++) {
    const lead = m[i].findIndex((x) => !isZero(x));
    if (lead === -1) continue;
    if (!eq(m[i][lead], ONE)) return false;
    for (let k = 0; k < m.length; k++) {
      if (k !== i && !isZero(m[k][lead])) return false;
    }
  }
  return true;
}

export function rank(m: FracMatrix): number {
  return rref(m).pivotCols.length;
}

export function identity(n: number): FracMatrix {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? ONE : ZERO)));
}

export function matMul(a: FracMatrix, b: FracMatrix): FracMatrix {
  const n = a.length;
  const k = b.length;
  const p = b[0].length;
  if (a[0].length !== k) throw new Error("dimension mismatch");
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: p }, (_, j) => {
      let s = ZERO;
      for (let t = 0; t < k; t++) s = add(s, mul(a[i][t], b[t][j]));
      return s;
    }),
  );
}

export function transpose(a: FracMatrix): FracMatrix {
  return a[0].map((_, j) => a.map((row) => row[j]));
}

export function det(a: FracMatrix): Frac {
  const n = a.length;
  if (n === 0) return ONE;
  if (n === 1) return a[0][0];
  if (n === 2) return sub(mul(a[0][0], a[1][1]), mul(a[0][1], a[1][0]));
  // Gaussian elimination tracking sign
  let m = cloneMatrix(a);
  let d = ONE;
  for (let c = 0; c < n; c++) {
    let p = -1;
    for (let i = c; i < n; i++) {
      if (!isZero(m[i][c])) {
        p = i;
        break;
      }
    }
    if (p === -1) return ZERO;
    if (p !== c) {
      m = applyRowOp(m, { type: "swap", i: c, j: p });
      d = neg(d);
    }
    d = mul(d, m[c][c]);
    for (let i = c + 1; i < n; i++) {
      if (!isZero(m[i][c])) m = applyRowOp(m, { type: "replace", i, j: c, by: neg(div(m[i][c], m[c][c])) });
    }
  }
  return d;
}

/** Inverse via [A | I] -> [I | A^-1]. Returns null when singular. */
export function inverse(a: FracMatrix): FracMatrix | null {
  const n = a.length;
  const augmented = a.map((row, i) => [...row, ...identity(n)[i]]);
  const { matrix, pivotCols } = rref(augmented);
  if (pivotCols.length < n || pivotCols.some((c) => c >= n)) return null;
  return matrix.map((row) => row.slice(n));
}

/** Basis for Nul A as a list of column vectors (exact). */
export function nullspaceBasis(a: FracMatrix): Frac[][] {
  const { matrix, pivotCols } = rref(a);
  const cols = a[0].length;
  const free = Array.from({ length: cols }, (_, j) => j).filter((j) => !pivotCols.includes(j));
  return free.map((f) => {
    const v: Frac[] = Array.from({ length: cols }, () => ZERO);
    v[f] = ONE;
    pivotCols.forEach((pc, i) => {
      v[pc] = neg(matrix[i][f]);
    });
    return v;
  });
}

/** Solve A x = b exactly. Returns null if inconsistent; otherwise a particular solution and the nullspace basis. */
export function solve(a: FracMatrix, b: Frac[]): { particular: Frac[]; nullspace: Frac[][] } | null {
  const cols = a[0].length;
  const aug = a.map((row, i) => [...row, b[i]]);
  const { matrix, pivotCols } = rref(aug);
  if (pivotCols.includes(cols)) return null;
  const particular: Frac[] = Array.from({ length: cols }, () => ZERO);
  pivotCols.forEach((pc, i) => {
    particular[pc] = matrix[i][cols];
  });
  return { particular, nullspace: nullspaceBasis(a) };
}

export function fracVecToNumbers(v: Frac[]): number[] {
  return v.map(toNumber);
}

/* ------------------------------------------------------------------ */
/* Float geometry                                                       */
/* ------------------------------------------------------------------ */

export type Vec2 = [number, number];
export type Mat2 = [[number, number], [number, number]];

export function dot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}
export function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}
export function scale(a: number[], k: number): number[] {
  return a.map((x) => x * k);
}
export function addV(a: number[], b: number[]): number[] {
  return a.map((x, i) => x + b[i]);
}
export function subV(a: number[], b: number[]): number[] {
  return a.map((x, i) => x - b[i]);
}
export function apply2(m: Mat2, v: Vec2): Vec2 {
  return [m[0][0] * v[0] + m[0][1] * v[1], m[1][0] * v[0] + m[1][1] * v[1]];
}
export function det2(m: Mat2): number {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}
export function mul2(a: Mat2, b: Mat2): Mat2 {
  return [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ];
}

/** Orthogonal projection of y onto the line spanned by u. */
export function projectOnto(y: number[], u: number[]): number[] {
  const uu = dot(u, u);
  if (uu === 0) return y.map(() => 0);
  return scale(u, dot(y, u) / uu);
}

/** Eigen-decomposition of a real 2x2 matrix. */
export function eigen2(m: Mat2): { real: true; values: [number, number]; vectors: [Vec2, Vec2] } | { real: false; values: { re: number; im: number } } {
  const tr = m[0][0] + m[1][1];
  const d = det2(m);
  const disc = tr * tr - 4 * d;
  if (disc < -1e-12) {
    return { real: false, values: { re: tr / 2, im: Math.sqrt(-disc) / 2 } };
  }
  const s = Math.sqrt(Math.max(disc, 0));
  const l1 = (tr + s) / 2;
  const l2 = (tr - s) / 2;
  const vecFor = (l: number): Vec2 => {
    const a = m[0][0] - l;
    const b = m[0][1];
    const c = m[1][0];
    const dd = m[1][1] - l;
    // rows of (A - lI): [a b], [c dd]; an eigenvector is orthogonal to a non-zero row
    let v: Vec2;
    if (Math.abs(a) > 1e-9 || Math.abs(b) > 1e-9) v = [-b, a];
    else if (Math.abs(c) > 1e-9 || Math.abs(dd) > 1e-9) v = [-dd, c];
    else v = [1, 0];
    const n = norm(v) || 1;
    return [v[0] / n, v[1] / n];
  };
  return { real: true, values: [l1, l2], vectors: [vecFor(l1), vecFor(l2)] };
}

/** Least-squares line y = m x + b through points (float). */
export function leastSquaresLine(points: [number, number][]): { m: number; b: number; sse: number } {
  const n = points.length;
  const sx = points.reduce((s, p) => s + p[0], 0);
  const sy = points.reduce((s, p) => s + p[1], 0);
  const sxx = points.reduce((s, p) => s + p[0] * p[0], 0);
  const sxy = points.reduce((s, p) => s + p[0] * p[1], 0);
  const denom = n * sxx - sx * sx;
  const m = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const b = (sy - m * sx) / n;
  const sse = points.reduce((s, p) => s + (p[1] - (m * p[0] + b)) ** 2, 0);
  return { m, b, sse };
}

export function sse(points: [number, number][], m: number, b: number): number {
  return points.reduce((s, p) => s + (p[1] - (m * p[0] + b)) ** 2, 0);
}

/** Numeric Gram–Schmidt (float), returns orthogonal (not normalised) vectors. */
export function gramSchmidt(vectors: number[][]): number[][] {
  const out: number[][] = [];
  for (const v of vectors) {
    let w = [...v];
    for (const u of out) w = subV(w, projectOnto(v, u));
    out.push(w);
  }
  return out;
}

export function fracFromNumber(x: number): Frac {
  return frac(x);
}
