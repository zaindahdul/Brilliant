/**
 * Parameterised problem generators. Each produces a fresh, exactly-checked
 * problem from a seed, so practice sets never repeat and surface details change
 * while the underlying idea stays the same (the way Brilliant's practice does).
 */
import type { QuestionStep } from "../types";
import { rngFrom, randInt, randNonZero, pick, shuffle, type Rng } from "@/lib/random";
import { frac, toFracMatrix, fracMatrixToNumbers, fracToLatex, type FracMatrix, toNumber, mul, add } from "@/lib/fraction";
import { applyRowOp, det, inverse, matMul, rref, transpose, type RowOp } from "@/lib/linalg";
import { aug, mat, vec, r } from "../dsl";

export interface Generator {
  id: string;
  unitId: string;
  title: string;
  make: (seed: number, rng: Rng) => QuestionStep;
}

export interface GeneratedProblem {
  key: string;
  unitId: string;
  step: QuestionStep;
}

const registry: Record<string, Generator> = {};

function define(g: Generator) {
  registry[g.id] = g;
}

export function generate(id: string, seed: number): GeneratedProblem | null {
  const g = registry[id];
  if (!g) return null;
  const key = `gen:${id}:${seed}`;
  const rng = rngFrom(key);
  const step = g.make(seed, rng);
  return { key, unitId: g.unitId, step: { ...step, id: key } };
}

export function hasGenerator(id: string): boolean {
  return id in registry;
}

export function parseGeneratedKey(key: string): { id: string; seed: number } | null {
  const m = key.match(/^gen:(.+):(\d+)$/);
  return m ? { id: m[1], seed: Number(m[2]) } : null;
}

export function listGenerators(): Generator[] {
  return Object.values(registry);
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function fm(n: number): string {
  return fracToLatex(frac(n));
}

/** Random integer matrix with small entries. */
function randMatrix(rng: Rng, rows: number, cols: number, lo = -4, hi = 4): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => randInt(rng, lo, hi)));
}

/** Scramble a matrix with integer row operations so the result stays integral. */
function scramble(m: number[][], rng: Rng, ops = 3): number[][] {
  let f: FracMatrix = toFracMatrix(m);
  const rows = m.length;
  for (let t = 0; t < ops; t++) {
    const i = randInt(rng, 0, rows - 1);
    let j = randInt(rng, 0, rows - 1);
    while (j === i) j = randInt(rng, 0, rows - 1);
    const kind = rng();
    const op: RowOp = kind < 0.2 ? { type: "swap", i, j } : { type: "replace", i, j, by: frac(randNonZero(rng, 2)) };
    f = applyRowOp(f, op);
  }
  // keep entries small-ish
  const nums = fracMatrixToNumbers(f);
  if (nums.some((row) => row.some((x) => Math.abs(x) > 12))) return scramble(m, rng, Math.max(1, ops - 1));
  return nums;
}

function sys2(a: number, b: number, c: number, d: number, e: number, f: number): string {
  const term = (coef: number, v: string, first: boolean) => {
    if (coef === 0) return "";
    const sign = coef < 0 ? "-" : first ? "" : "+";
    const abs = Math.abs(coef);
    return `${sign} ${abs === 1 ? "" : abs}${v} `;
  };
  const row = (p: number, q: number, rhs: number) => `${term(p, "x_1", true)}${term(q, "x_2", p === 0)}= ${rhs}`;
  return `\\begin{aligned} ${row(a, b, e)} \\\\ ${row(c, d, f)} \\end{aligned}`;
}

/* ------------------------------------------------------------------ */
/* Unit 1 — linear systems                                             */
/* ------------------------------------------------------------------ */

define({
  id: "gen.solve-2x2",
  unitId: "u1",
  title: "Solve a 2×2 system",
  make: (_seed, rng) => {
    const x = randInt(rng, -4, 4);
    const y = randInt(rng, -4, 4);
    let a: number, b: number, c: number, d: number;
    do {
      a = randNonZero(rng, 3);
      b = randInt(rng, -3, 3);
      c = randInt(rng, -3, 3);
      d = randNonZero(rng, 3);
    } while (a * d - b * c === 0 || (b === 0 && c === 0));
    const e = a * x + b * y;
    const f = c * x + d * y;
    const askX = rng() < 0.5;
    return {
      type: "numeric",
      id: "",
      body: r`Solve the system $$${sys2(a, b, c, d, e, f)}$$`,
      question: askX ? r`What is $x_1$?` : r`What is $x_2$?`,
      answer: askX ? x : y,
      prefix: askX ? "x_1 =" : "x_2 =",
      hint: "Row reduce the augmented matrix, or eliminate one variable by combining the equations.",
      explanation: r`Row reducing $${aug([
        [a, b, e],
        [c, d, f],
      ])}$ gives the unique solution $x_1 = ${x},\; x_2 = ${y}$. Check: $${a}(${x}) + ${b}(${y}) = ${e}$ ✓.`,
      tags: ["solving"],
    };
  },
});

define({
  id: "gen.rref-2x3",
  unitId: "u1",
  title: "Reduced echelon form of a 2×3 matrix",
  make: (_seed, rng) => {
    const shape = pick(rng, ["two-pivots", "pivot-13", "one-pivot"] as const);
    let target: number[][];
    if (shape === "two-pivots") target = [[1, 0, randInt(rng, -3, 3)], [0, 1, randInt(rng, -3, 3)]];
    else if (shape === "pivot-13") target = [[1, randNonZero(rng, 3), 0], [0, 0, 1]];
    else target = [[1, randNonZero(rng, 3), randInt(rng, -3, 3)], [0, 0, 0]];
    let m = scramble(target, rng, 3);
    // ensure the scrambled matrix isn't already reduced (too easy)
    if (JSON.stringify(m) === JSON.stringify(target)) m = scramble(target, rng, 2);
    const { matrix: red, ops } = rref(toFracMatrix(m));
    const answer = fracMatrixToNumbers(red);
    return {
      type: "matrix",
      id: "",
      body: "",
      question: r`Find the reduced echelon form of $${mat(m)}$.`,
      answer,
      hint: "Get a leading 1 in row 1 (swap or scale), clear below it, then make the second leading entry 1 and clear above it.",
      explanation: r`One sequence of operations: $${ops.map((op) => rowOpTex(op)).join(",\\;")}$, which yields $${mat(answer.map((row) => row.map((x) => fracToLatex(frac(x)))))}$. Pivot columns: ${red
        .map((row) => row.findIndex((x) => x.n !== 0) + 1)
        .filter((c) => c > 0)
        .join(" and ")}.`,
      tags: ["rref"],
    };
  },
});

function rowOpTex(op: RowOp): string {
  const f = (x: { n: number; d: number }) => (x.d === 1 ? String(x.n) : `\\tfrac{${x.n}}{${x.d}}`);
  if (op.type === "swap") return `R_${op.i + 1} \\leftrightarrow R_${op.j + 1}`;
  if (op.type === "scale") return `R_${op.i + 1} \\to ${f(op.by)} R_${op.i + 1}`;
  const sign = op.by.n < 0 ? "-" : "+";
  const abs = { n: Math.abs(op.by.n), d: op.by.d };
  const coef = abs.n === 1 && abs.d === 1 ? "" : f(abs);
  return `R_${op.i + 1} \\to R_${op.i + 1} ${sign} ${coef}R_${op.j + 1}`;
}

define({
  id: "gen.param-h",
  unitId: "u1",
  title: "Systems with a parameter h",
  make: (_seed, rng) => {
    const a = randNonZero(rng, 4);
    const b = randInt(rng, -4, 4);
    const c = randNonZero(rng, 3);
    const variant = pick(rng, ["infinite", "inconsistent"] as const);
    const hCrit = c * a; // h - c*a = 0 after R2 - c R1
    const rhs2 = variant === "infinite" ? c * b : c * b + randNonZero(rng, 3);
    return {
      type: "numeric",
      id: "",
      body: r`Consider the system $$${sys2(1, a, c, 0, b, rhs2).replace("0x_2", "h\\,x_2").replace("= " + rhs2, "= " + rhs2)}$$ where the coefficient of $x_2$ in the second equation is $h$.`,
      question: variant === "infinite" ? r`For which value of $h$ does the system have infinitely many solutions?` : r`For which value of $h$ is the system inconsistent?`,
      answer: hCrit,
      prefix: "h =",
      hint: r`Apply $R_2 \to R_2 - ${c}R_1$ and look at the new second row.`,
      explanation: r`$R_2 \to R_2 - (${c})R_1$ turns row 2 into $(0,\; h - (${hCrit}) \mid ${rhs2 - c * b})$. ${
        variant === "infinite"
          ? r`When $h = ${hCrit}$ the row is all zeros, so $x_2$ is free and there are infinitely many solutions; otherwise the solution is unique.`
          : r`When $h = ${hCrit}$ the row reads $0 = ${rhs2 - c * b}$, a contradiction — inconsistent. For every other $h$ the solution is unique.`
      }`,
      tags: ["parameters"],
    };
  },
});

define({
  id: "gen.pivot-count",
  unitId: "u1",
  title: "Counting pivots and free variables",
  make: (_seed, rng) => {
    const variant = pick(rng, ["free", "max", "rows"] as const);
    if (variant === "max") {
      const m = randInt(rng, 2, 6);
      const n = randInt(rng, 2, 6);
      return {
        type: "numeric",
        id: "",
        body: "",
        question: r`What is the largest possible number of pivot positions in a $${m} \times ${n}$ matrix?`,
        answer: Math.min(m, n),
        hint: "At most one pivot per row and per column.",
        explanation: r`At most one pivot per row and one per column, so at most $\min(${m}, ${n}) = ${Math.min(m, n)}$.`,
        tags: ["pivots"],
      };
    }
    if (variant === "free") {
      const n = randInt(rng, 3, 7);
      const p = randInt(rng, 1, n - 1);
      return {
        type: "numeric",
        id: "",
        body: "",
        question: r`A consistent system has $${n}$ unknowns and its coefficient matrix has $${p}$ pivot columns. How many free variables does it have?`,
        answer: n - p,
        hint: "Every variable is basic (pivot column) or free (non-pivot column).",
        explanation: r`$${n} - ${p} = ${n - p}$ free variables.`,
        tags: ["free-variables"],
      };
    }
    const m = randInt(rng, 2, 5);
    const n = m + randInt(rng, 1, 3);
    return {
      type: "mc",
      id: "",
      body: "",
      question: r`A linear system has $${m}$ equations and $${n}$ unknowns. Which statement is always true?`,
      choices: [
        { id: "a", text: "If it is consistent, it has infinitely many solutions." },
        { id: "b", text: "It is consistent.", feedback: "More unknowns than equations says nothing about existence — the equations can still contradict each other." },
        { id: "c", text: "It has a unique solution.", feedback: "With fewer equations than unknowns there must be a free variable, so uniqueness is impossible." },
        { id: "d", text: "It is inconsistent.", feedback: "Plenty of such systems are consistent, e.g. the all-zero system." },
      ],
      correct: "a",
      hint: "Pivots ≤ equations < unknowns. What does that force?",
      explanation: r`At most $${m}$ pivots for $${n}$ unknowns leaves at least one free variable, so a consistent system of this shape has infinitely many solutions. Consistency itself is not guaranteed.`,
      tags: ["theory"],
    };
  },
});

/* ------------------------------------------------------------------ */
/* Unit 2 — vectors, Ax = b, independence                              */
/* ------------------------------------------------------------------ */

define({
  id: "gen.lin-comb",
  unitId: "u2",
  title: "Linear combination coordinates",
  make: (_seed, rng) => {
    const u = [randNonZero(rng, 3), randInt(rng, -3, 3)];
    const v = [randInt(rng, -3, 3), randNonZero(rng, 3)];
    const c1 = randNonZero(rng, 3);
    const c2 = randNonZero(rng, 3);
    const w = [c1 * u[0] + c2 * v[0], c1 * u[1] + c2 * v[1]];
    return {
      type: "matrix",
      id: "",
      body: "",
      question: r`Let $\mathbf{u} = ${vec(...u)}$ and $\mathbf{v} = ${vec(...v)}$. Compute $${fm(c1)}\mathbf{u} ${c2 < 0 ? "-" : "+"} ${Math.abs(c2) === 1 ? "" : Math.abs(c2)}\mathbf{v}$.`,
      answer: [[w[0]], [w[1]]],
      hint: "Scale each vector entrywise, then add entrywise.",
      explanation: r`$${c1}${vec(...u)} ${c2 < 0 ? "-" : "+"} ${Math.abs(c2)}${vec(...v)} = ${vec(c1 * u[0], c1 * u[1])} + ${vec(c2 * v[0], c2 * v[1])} = ${vec(...w)}$.`,
      tags: ["linear-combinations"],
    };
  },
});

define({
  id: "gen.in-span",
  unitId: "u2",
  title: "Is b in Span{v1, v2}?",
  make: (_seed, rng) => {
    const v1 = [randNonZero(rng, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
    let v2 = [randInt(rng, -3, 3), randNonZero(rng, 3), randInt(rng, -3, 3)];
    // ensure independent
    while (v1[0] * v2[1] - v1[1] * v2[0] === 0 && v1[0] * v2[2] - v1[2] * v2[0] === 0 && v1[1] * v2[2] - v1[2] * v2[1] === 0) {
      v2 = [randInt(rng, -3, 3), randNonZero(rng, 3), randInt(rng, -3, 3)];
    }
    const inSpan = rng() < 0.5;
    const c1 = randInt(rng, -2, 2);
    const c2 = randNonZero(rng, 2);
    let b = [c1 * v1[0] + c2 * v2[0], c1 * v1[1] + c2 * v2[1], c1 * v1[2] + c2 * v2[2]];
    if (!inSpan) {
      // perturb along a direction not in the span: use the cross product
      const n = [v1[1] * v2[2] - v1[2] * v2[1], v1[2] * v2[0] - v1[0] * v2[2], v1[0] * v2[1] - v1[1] * v2[0]];
      b = [b[0] + n[0], b[1] + n[1], b[2] + n[2]];
    }
    const A = [
      [v1[0], v2[0], b[0]],
      [v1[1], v2[1], b[1]],
      [v1[2], v2[2], b[2]],
    ];
    const red = rref(toFracMatrix(A));
    const consistent = !red.pivotCols.includes(2);
    return {
      type: "mc",
      id: "",
      body: "",
      question: r`Is $\mathbf{b} = ${vec(...b)}$ in $\operatorname{Span}\{\mathbf{v}_1, \mathbf{v}_2\}$, where $\mathbf{v}_1 = ${vec(...v1)}$ and $\mathbf{v}_2 = ${vec(...v2)}$?`,
      choices: [
        { id: "yes", text: r`Yes — $\mathbf{b}$ is a linear combination of $\mathbf{v}_1$ and $\mathbf{v}_2$.` },
        { id: "no", text: r`No — the vector equation $x_1\mathbf{v}_1 + x_2\mathbf{v}_2 = \mathbf{b}$ is inconsistent.` },
      ],
      correct: consistent ? "yes" : "no",
      hint: r`Row reduce the augmented matrix $[\,\mathbf{v}_1\ \mathbf{v}_2 \mid \mathbf{b}\,]$ and check whether the last column is a pivot column.`,
      explanation: r`Row reducing $${aug(A)}$ gives $${aug(fracMatrixToNumbers(red.matrix).map((row) => row.map((x) => fracToLatex(frac(x)))))}$. ${
        consistent ? r`No pivot in the last column, so the system is consistent: $\mathbf{b} = ${fracToLatex(red.matrix[0][2])}\,\mathbf{v}_1 + ${fracToLatex(red.matrix[1][2])}\,\mathbf{v}_2$ is in the span.` : r`The last column is a pivot column (a row $0 = 1$ appears), so the system is inconsistent and $\mathbf{b}$ is **not** in the span.`
      }`,
      tags: ["span"],
    };
  },
});

define({
  id: "gen.independence-h",
  unitId: "u2",
  title: "Linear dependence for a value of h",
  make: (_seed, rng) => {
    const k = randNonZero(rng, 3);
    const v1 = [randNonZero(rng, 3), randInt(rng, -3, 3), randNonZero(rng, 3)];
    const v2 = [k * v1[0], k * v1[1], 0]; // placeholder for h in last slot
    const h = k * v1[2];
    return {
      type: "numeric",
      id: "",
      body: "",
      question: r`For which value of $h$ is the set $\left\{ ${vec(...v1)},\ ${vec(v2[0], v2[1], "h")} \right\}$ linearly **dependent**?`,
      answer: h,
      prefix: "h =",
      hint: "Two vectors are linearly dependent exactly when one is a scalar multiple of the other. What multiple relates the first two entries?",
      explanation: r`The second vector's first entries are $${k}$ times those of the first, so dependence requires $h = ${k}\cdot${v1[2]} = ${h}$. For any other $h$ the vectors are independent.`,
      tags: ["independence"],
    };
  },
});

define({
  id: "gen.matrix-vector",
  unitId: "u2",
  title: "Matrix–vector product",
  make: (_seed, rng) => {
    const A = randMatrix(rng, 2, 3, -3, 3);
    const x = [randInt(rng, -3, 3), randInt(rng, -3, 3), randNonZero(rng, 3)];
    const b = A.map((row) => row[0] * x[0] + row[1] * x[1] + row[2] * x[2]);
    return {
      type: "matrix",
      id: "",
      body: "",
      question: r`Compute $A\mathbf{x}$ for $A = ${mat(A)}$ and $\mathbf{x} = ${vec(...x)}$.`,
      answer: [[b[0]], [b[1]]],
      hint: r`$A\mathbf{x}$ is the linear combination of the columns of $A$ with weights $x_1, x_2, x_3$ — or take each row's dot product with $\mathbf{x}$.`,
      explanation: r`$A\mathbf{x} = ${x[0]}${vec(A[0][0], A[1][0])} + ${x[1]}${vec(A[0][1], A[1][1])} + ${x[2]}${vec(A[0][2], A[1][2])} = ${vec(...b)}$.`,
      tags: ["matrix-vector"],
    };
  },
});

/* ------------------------------------------------------------------ */
/* Unit 3 — linear transformations                                      */
/* ------------------------------------------------------------------ */

define({
  id: "gen.standard-matrix",
  unitId: "u3",
  title: "Standard matrix from images of e1, e2",
  make: (_seed, rng) => {
    const a = randMatrix(rng, 2, 2, -3, 3);
    const kind = pick(rng, ["images", "formula"] as const);
    if (kind === "images") {
      return {
        type: "matrix",
        id: "",
        body: "",
        question: r`A linear transformation $T:\mathbb{R}^2 \to \mathbb{R}^2$ satisfies $T(\mathbf{e}_1) = ${vec(a[0][0], a[1][0])}$ and $T(\mathbf{e}_2) = ${vec(a[0][1], a[1][1])}$. Find the standard matrix of $T$.`,
        answer: a,
        hint: "The columns of the standard matrix are the images of the standard basis vectors, in order.",
        explanation: r`$A = [\,T(\mathbf{e}_1)\ \ T(\mathbf{e}_2)\,] = ${mat(a)}$.`,
        tags: ["standard-matrix"],
      };
    }
    const term = (c: number, v: string, first: boolean) => (c === 0 ? "" : `${c < 0 ? "-" : first ? "" : "+"} ${Math.abs(c) === 1 ? "" : Math.abs(c)}${v} `);
    const row = (p: number, q: number) => `${term(p, "x_1", true)}${term(q, "x_2", p === 0)}`.trim() || "0";
    return {
      type: "matrix",
      id: "",
      body: "",
      question: r`Find the standard matrix of $T(x_1, x_2) = (${row(a[0][0], a[0][1])},\; ${row(a[1][0], a[1][1])})$.`,
      answer: a,
      hint: r`Compute $T(1, 0)$ and $T(0, 1)$ — those are the columns.`,
      explanation: r`$T(\mathbf{e}_1) = ${vec(a[0][0], a[1][0])}$ and $T(\mathbf{e}_2) = ${vec(a[0][1], a[1][1])}$, so $A = ${mat(a)}$.`,
      tags: ["standard-matrix"],
    };
  },
});

define({
  id: "gen.onto-one-to-one",
  unitId: "u3",
  title: "One-to-one and onto from pivots",
  make: (_seed, rng) => {
    const m = randInt(rng, 2, 4);
    const n = randInt(rng, 2, 4);
    const p = randInt(rng, 1, Math.min(m, n));
    const oneToOne = p === n;
    const onto = p === m;
    const answer = oneToOne && onto ? "both" : oneToOne ? "one" : onto ? "onto" : "neither";
    return {
      type: "mc",
      id: "",
      body: "",
      question: r`The standard matrix of $T:\mathbb{R}^{${n}} \to \mathbb{R}^{${m}}$ is $${m}\times${n}$ with $${p}$ pivot columns. Which is true?`,
      choices: [
        { id: "both", text: r`$T$ is both one-to-one and onto.` },
        { id: "one", text: r`$T$ is one-to-one but not onto.` },
        { id: "onto", text: r`$T$ is onto but not one-to-one.` },
        { id: "neither", text: r`$T$ is neither one-to-one nor onto.` },
      ],
      correct: answer,
      hint: r`One-to-one ⟺ pivot in every **column** (independent columns). Onto ⟺ pivot in every **row** (columns span $\mathbb{R}^m$).`,
      explanation: r`$${p}$ pivots: ${oneToOne ? `every column has a pivot, so $T$ is one-to-one` : `fewer pivots than columns ($${n}$), so $T$ is not one-to-one`}; ${onto ? `every row has a pivot, so $T$ is onto` : `fewer pivots than rows ($${m}$), so $T$ is not onto`}.`,
      tags: ["one-to-one-onto"],
    };
  },
});

/* ------------------------------------------------------------------ */
/* Unit 4 — matrix algebra                                              */
/* ------------------------------------------------------------------ */

define({
  id: "gen.matrix-product",
  unitId: "u4",
  title: "Matrix product",
  make: (_seed, rng) => {
    const A = randMatrix(rng, 2, 2, -3, 3);
    const B = randMatrix(rng, 2, 2, -3, 3);
    const C = fracMatrixToNumbers(matMul(toFracMatrix(A), toFracMatrix(B)));
    return {
      type: "matrix",
      id: "",
      body: "",
      question: r`Compute $AB$ for $A = ${mat(A)}$ and $B = ${mat(B)}$.`,
      answer: C,
      hint: "Entry (i, j) of AB is row i of A dotted with column j of B.",
      explanation: r`$AB = ${mat(C)}$. For example the (1,1) entry is $(${A[0][0]})(${B[0][0]}) + (${A[0][1]})(${B[1][0]}) = ${C[0][0]}$.`,
      tags: ["matrix-multiplication"],
    };
  },
});

define({
  id: "gen.inverse-2x2",
  unitId: "u4",
  title: "Inverse of a 2×2 matrix",
  make: (_seed, rng) => {
    let A: number[][];
    let d: number;
    do {
      A = randMatrix(rng, 2, 2, -4, 4);
      d = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    } while (d === 0 || Math.abs(d) > 6);
    const inv = inverse(toFracMatrix(A))!;
    const answer = fracMatrixToNumbers(inv);
    return {
      type: "matrix",
      id: "",
      body: "",
      question: r`Find $A^{-1}$ for $A = ${mat(A)}$. (Fractions like 1/2 are fine.)`,
      answer,
      prefix: r`$A^{-1} =$`,
      hint: r`For $\begin{bmatrix} a & b \\ c & d \end{bmatrix}$ the inverse is $\frac{1}{ad - bc}\begin{bmatrix} d & -b \\ -c & a \end{bmatrix}$.`,
      explanation: r`$\det A = (${A[0][0]})(${A[1][1]}) - (${A[0][1]})(${A[1][0]}) = ${d}$, so $A^{-1} = \tfrac{1}{${d}}${mat([
        [A[1][1], -A[0][1]],
        [-A[1][0], A[0][0]],
      ])} = ${mat(inv.map((row) => row.map(fracToLatex)))}$.`,
      tags: ["inverse"],
    };
  },
});

define({
  id: "gen.imt",
  unitId: "u4",
  title: "Invertible Matrix Theorem reasoning",
  make: (_seed, rng) => {
    const n = randInt(rng, 3, 6);
    const facts = [
      { text: r`$A$ has $${n}$ pivot positions`, inv: true },
      { text: r`the columns of $A$ are linearly dependent`, inv: false },
      { text: r`$A\mathbf{x} = \mathbf{0}$ has only the trivial solution`, inv: true },
      { text: r`$A\mathbf{x} = \mathbf{b}$ is inconsistent for some $\mathbf{b}$`, inv: false },
      { text: r`the columns of $A$ span $\mathbb{R}^{${n}}$`, inv: true },
      { text: r`$A^T$ is not invertible`, inv: false },
      { text: r`$\det A = 0$`, inv: false },
      { text: r`the transformation $\mathbf{x} \mapsto A\mathbf{x}$ is one-to-one`, inv: true },
      { text: r`$A$ is row equivalent to a matrix with a zero row`, inv: false },
    ];
    const chosen = pick(rng, facts);
    return {
      type: "mc",
      id: "",
      body: "",
      question: r`$A$ is an $${n}\times${n}$ matrix and ${chosen.text}. What can you conclude?`,
      choices: shuffle(
        [
          { id: "inv", text: r`$A$ is invertible.` },
          { id: "notinv", text: r`$A$ is not invertible.` },
          { id: "cannot", text: "Nothing — more information is needed.", feedback: "For a square matrix, the Invertible Matrix Theorem links this fact directly to invertibility." },
        ],
        rng,
      ),
      correct: chosen.inv ? "inv" : "notinv",
      hint: "The Invertible Matrix Theorem: for a square matrix, each of these statements is equivalent to invertibility (or to its negation).",
      explanation: chosen.inv
        ? r`By the Invertible Matrix Theorem this statement is equivalent to $A$ being invertible.`
        : r`This statement is the negation of one of the equivalent conditions in the Invertible Matrix Theorem, so $A$ is **not** invertible.`,
      tags: ["imt"],
    };
  },
});

/* ------------------------------------------------------------------ */
/* Unit 5 — determinants                                               */
/* ------------------------------------------------------------------ */

define({
  id: "gen.det-3x3",
  unitId: "u5",
  title: "Determinant of a 3×3 matrix",
  make: (_seed, rng) => {
    const A = randMatrix(rng, 3, 3, -3, 3);
    // sprinkle a zero to make cofactor expansion pleasant
    A[randInt(rng, 0, 2)][randInt(rng, 0, 2)] = 0;
    const d = toNumber(det(toFracMatrix(A)));
    return {
      type: "numeric",
      id: "",
      body: "",
      question: r`Compute $\det ${mat(A)}$.`,
      answer: d,
      hint: "Expand along the row or column with the most zeros, or row reduce to triangular form and track the operations.",
      explanation: r`Cofactor expansion along row 1: $${A[0][0]}\cdot\det${mat([
        [A[1][1], A[1][2]],
        [A[2][1], A[2][2]],
      ])} - ${A[0][1]}\cdot\det${mat([
        [A[1][0], A[1][2]],
        [A[2][0], A[2][2]],
      ])} + ${A[0][2]}\cdot\det${mat([
        [A[1][0], A[1][1]],
        [A[2][0], A[2][1]],
      ])} = ${d}$.`,
      tags: ["determinant"],
    };
  },
});

define({
  id: "gen.det-properties",
  unitId: "u5",
  title: "Determinants under row operations and products",
  make: (_seed, rng) => {
    const d = randNonZero(rng, 6);
    const variant = pick(rng, ["swap", "scale", "replace", "product", "transpose", "inverse", "scalar"] as const);
    const n = 3;
    let question: string;
    let answer: number;
    let explanation: string;
    switch (variant) {
      case "swap":
        question = r`$A$ is $3\times3$ with $\det A = ${d}$. $B$ is obtained from $A$ by swapping two rows. What is $\det B$?`;
        answer = -d;
        explanation = r`A row swap flips the sign: $\det B = -${d} = ${-d}$.`;
        break;
      case "scale": {
        const k = randNonZero(rng, 3);
        question = r`$A$ is $3\times3$ with $\det A = ${d}$. $B$ is obtained by multiplying one row of $A$ by $${k}$. What is $\det B$?`;
        answer = k * d;
        explanation = r`Scaling a single row scales the determinant by the same factor: $\det B = ${k}\cdot${d} = ${k * d}$.`;
        break;
      }
      case "replace":
        question = r`$A$ is $3\times3$ with $\det A = ${d}$. $B$ is obtained by replacing $R_2$ with $R_2 + 4R_1$. What is $\det B$?`;
        answer = d;
        explanation = r`A replacement operation leaves the determinant unchanged: $\det B = ${d}$.`;
        break;
      case "product": {
        const e = randNonZero(rng, 4);
        question = r`$A$ and $B$ are $3\times3$ with $\det A = ${d}$ and $\det B = ${e}$. What is $\det(AB)$?`;
        answer = d * e;
        explanation = r`$\det(AB) = \det A \cdot \det B = ${d}\cdot${e} = ${d * e}$.`;
        break;
      }
      case "transpose":
        question = r`$A$ is $3\times3$ with $\det A = ${d}$. What is $\det(A^T)$?`;
        answer = d;
        explanation = r`$\det A^T = \det A = ${d}$.`;
        break;
      case "inverse":
        question = r`$A$ is $3\times3$ with $\det A = ${d}$. What is $\det(A^{-1})$? (Enter a fraction if needed.)`;
        answer = 1 / d;
        explanation = r`$\det(A^{-1}) = 1/\det A = ${fracToLatex(frac(1, d))}$.`;
        break;
      default: {
        const k = randNonZero(rng, 3);
        question = r`$A$ is $${n}\times${n}$ with $\det A = ${d}$. What is $\det(${k}A)$?`;
        answer = k ** n * d;
        explanation = r`Every one of the $${n}$ rows is scaled by $${k}$, so $\det(${k}A) = ${k}^{${n}}\det A = ${k ** n}\cdot${d} = ${k ** n * d}$.`;
      }
    }
    return { type: "numeric", id: "", body: "", question, answer, hint: "Recall how each row operation (or product / transpose / inverse / scalar multiple) changes the determinant.", explanation, tags: ["determinant-properties"] };
  },
});

/* ------------------------------------------------------------------ */
/* Unit 6 — vector spaces                                              */
/* ------------------------------------------------------------------ */

define({
  id: "gen.rank-nullity",
  unitId: "u6",
  title: "Rank and nullity",
  make: (_seed, rng) => {
    const m = randInt(rng, 3, 6);
    const n = randInt(rng, 3, 7);
    const rk = randInt(rng, 1, Math.min(m, n));
    const variant = pick(rng, ["nullity", "rank-from-nullity", "dimcol", "dimrow", "nulAT"] as const);
    switch (variant) {
      case "nullity":
        return {
          type: "numeric",
          id: "",
          body: "",
          question: r`$A$ is a $${m}\times${n}$ matrix with rank $${rk}$. What is $\dim \operatorname{Nul} A$?`,
          answer: n - rk,
          hint: r`Rank Theorem: $\operatorname{rank} A + \dim\operatorname{Nul} A = $ number of columns.`,
          explanation: r`$\dim\operatorname{Nul}A = n - \operatorname{rank}A = ${n} - ${rk} = ${n - rk}$.`,
          tags: ["rank"],
        };
      case "rank-from-nullity":
        return {
          type: "numeric",
          id: "",
          body: "",
          question: r`$A$ is a $${m}\times${n}$ matrix and $\dim\operatorname{Nul}A = ${n - rk}$. What is $\operatorname{rank} A$?`,
          answer: rk,
          hint: "Use the Rank Theorem with the number of columns.",
          explanation: r`$\operatorname{rank}A = ${n} - ${n - rk} = ${rk}$.`,
          tags: ["rank"],
        };
      case "dimcol":
        return {
          type: "numeric",
          id: "",
          body: "",
          question: r`$A$ is $${m}\times${n}$ with $${rk}$ pivot columns. What is $\dim\operatorname{Col}A$?`,
          answer: rk,
          hint: "The pivot columns of A form a basis for Col A.",
          explanation: r`$\dim\operatorname{Col}A = $ number of pivot columns $= ${rk}$.`,
          tags: ["rank"],
        };
      case "dimrow":
        return {
          type: "numeric",
          id: "",
          body: "",
          question: r`$A$ is $${m}\times${n}$ with rank $${rk}$. What is $\dim\operatorname{Row}A$?`,
          answer: rk,
          hint: "Row space and column space always have the same dimension.",
          explanation: r`$\dim\operatorname{Row}A = \operatorname{rank}A = ${rk}$.`,
          tags: ["rank"],
        };
      default:
        return {
          type: "numeric",
          id: "",
          body: "",
          question: r`$A$ is $${m}\times${n}$ with rank $${rk}$. What is $\dim\operatorname{Nul}A^T$?`,
          answer: m - rk,
          hint: r`$A^T$ is $${n}\times${m}$ and has the same rank as $A$.`,
          explanation: r`$\operatorname{rank}A^T = ${rk}$ and $A^T$ has $${m}$ columns, so $\dim\operatorname{Nul}A^T = ${m} - ${rk} = ${m - rk}$.`,
          tags: ["rank"],
        };
    }
  },
});

define({
  id: "gen.coordinates",
  unitId: "u6",
  title: "Coordinates relative to a basis",
  make: (_seed, rng) => {
    let b1: number[], b2: number[];
    do {
      b1 = [randNonZero(rng, 3), randInt(rng, -2, 2)];
      b2 = [randInt(rng, -2, 2), randNonZero(rng, 3)];
    } while (b1[0] * b2[1] - b1[1] * b2[0] === 0);
    const c = [randNonZero(rng, 3), randNonZero(rng, 3)];
    const x = [c[0] * b1[0] + c[1] * b2[0], c[0] * b1[1] + c[1] * b2[1]];
    const direction = rng() < 0.5;
    if (direction) {
      return {
        type: "matrix",
        id: "",
        body: "",
        question: r`Let $\mathcal{B} = \{\mathbf{b}_1, \mathbf{b}_2\}$ with $\mathbf{b}_1 = ${vec(...b1)}$, $\mathbf{b}_2 = ${vec(...b2)}$. Find $[\mathbf{x}]_{\mathcal{B}}$ for $\mathbf{x} = ${vec(...x)}$.`,
        answer: [[c[0]], [c[1]]],
        hint: r`Solve $c_1\mathbf{b}_1 + c_2\mathbf{b}_2 = \mathbf{x}$ — row reduce $[\,\mathbf{b}_1\ \mathbf{b}_2 \mid \mathbf{x}\,]$.`,
        explanation: r`Solving $c_1${vec(...b1)} + c_2${vec(...b2)} = ${vec(...x)}$ gives $c_1 = ${c[0]},\ c_2 = ${c[1]}$, so $[\mathbf{x}]_{\mathcal{B}} = ${vec(...c)}$.`,
        tags: ["coordinates"],
      };
    }
    return {
      type: "matrix",
      id: "",
      body: "",
      question: r`Let $\mathcal{B} = \{\mathbf{b}_1, \mathbf{b}_2\}$ with $\mathbf{b}_1 = ${vec(...b1)}$, $\mathbf{b}_2 = ${vec(...b2)}$. If $[\mathbf{x}]_{\mathcal{B}} = ${vec(...c)}$, find $\mathbf{x}$.`,
      answer: [[x[0]], [x[1]]],
      hint: r`$\mathbf{x} = c_1\mathbf{b}_1 + c_2\mathbf{b}_2$ — the coordinates are the weights.`,
      explanation: r`$\mathbf{x} = ${c[0]}${vec(...b1)} + (${c[1]})${vec(...b2)} = ${vec(...x)}$.`,
      tags: ["coordinates"],
    };
  },
});

/* ------------------------------------------------------------------ */
/* Unit 7 — eigenvalues                                                */
/* ------------------------------------------------------------------ */

define({
  id: "gen.eigen-2x2",
  unitId: "u7",
  title: "Eigenvalues of a 2×2 matrix",
  make: (_seed, rng) => {
    // build from known integer eigenvalues via A = P D P^-1 with det P = ±1
    const l1 = randInt(rng, -3, 4);
    let l2 = randInt(rng, -3, 4);
    while (l2 === l1) l2 = randInt(rng, -3, 4);
    const p = randInt(rng, -2, 2);
    const P = [
      [1, p],
      [randInt(rng, -2, 2), 1 + p * 0],
    ];
    // ensure det P = 1 - p*P[1][0] = ±1 → choose P[1][0] accordingly
    P[1][0] = p === 0 ? randInt(rng, -2, 2) : 0;
    const Pf = toFracMatrix(P);
    const Pinv = inverse(Pf)!;
    const D = toFracMatrix([
      [l1, 0],
      [0, l2],
    ]);
    const A = fracMatrixToNumbers(matMul(matMul(Pf, D), Pinv));
    const variant = pick(rng, ["values", "charpoly", "vector"] as const);
    const tr = A[0][0] + A[1][1];
    const dt = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    if (variant === "values") {
      const hi = Math.max(l1, l2);
      return {
        type: "numeric",
        id: "",
        body: "",
        question: r`What is the **larger** eigenvalue of $A = ${mat(A)}$?`,
        answer: hi,
        hint: r`Solve $\det(A - \lambda I) = 0$: $\lambda^2 - (\operatorname{tr}A)\lambda + \det A = 0$.`,
        explanation: r`$\det(A - \lambda I) = \lambda^2 - (${tr})\lambda + (${dt}) = (\lambda - ${l1})(\lambda - ${l2})$, so the eigenvalues are $${l1}$ and $${l2}$; the larger is $${hi}$.`,
        tags: ["eigenvalues"],
      };
    }
    if (variant === "charpoly") {
      return {
        type: "numeric",
        id: "",
        body: "",
        question: r`The characteristic polynomial of $A = ${mat(A)}$ is $\lambda^2 + b\lambda + c$. What is $c$?`,
        answer: dt,
        hint: r`For a $2\times2$ matrix, $\det(A - \lambda I) = \lambda^2 - (\operatorname{tr}A)\lambda + \det A$.`,
        explanation: r`$c = \det A = (${A[0][0]})(${A[1][1]}) - (${A[0][1]})(${A[1][0]}) = ${dt}$ (and $b = -\operatorname{tr}A = ${-tr}$).`,
        tags: ["characteristic-polynomial"],
      };
    }
    // eigenvector check: which vector is an eigenvector for l1?
    const v = [P[0][0], P[1][0]]; // first column of P is eigenvector for l1
    const w = [P[0][1], P[1][1]];
    const bad = [v[0] + w[0] + 1, v[1] - w[1] + 2];
    return {
      type: "mc",
      id: "",
      body: "",
      question: r`Which vector is an eigenvector of $A = ${mat(A)}$ corresponding to $\lambda = ${l1}$?`,
      choices: shuffle(
        [
          { id: "v", text: r`$${vec(...v)}$` },
          { id: "w", text: r`$${vec(...w)}$`, feedback: r`That's an eigenvector, but for $\lambda = ${l2}$. Multiply it by $A$ and compare with $${l1}$ times it.` },
          { id: "bad", text: r`$${vec(...bad)}$`, feedback: "Multiply by A and check whether you get a multiple of the vector." },
        ],
        rng,
      ),
      correct: "v",
      hint: r`A vector $\mathbf{v}$ is an eigenvector for $\lambda$ when $A\mathbf{v} = \lambda\mathbf{v}$ — just multiply and compare.`,
      explanation: r`$A${vec(...v)} = ${vec(A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1])} = ${l1}${vec(...v)}$ ✓. Equivalently, $${vec(...v)}$ solves $(A - ${l1}I)\mathbf{x} = \mathbf{0}$.`,
      tags: ["eigenvectors"],
    };
  },
});

/* ------------------------------------------------------------------ */
/* Unit 8 — orthogonality                                              */
/* ------------------------------------------------------------------ */

define({
  id: "gen.dot-product",
  unitId: "u8",
  title: "Dot products, lengths and orthogonality",
  make: (_seed, rng) => {
    const u = [randInt(rng, -4, 4), randInt(rng, -4, 4), randNonZero(rng, 4)];
    const v = [randNonZero(rng, 4), randInt(rng, -4, 4), randInt(rng, -4, 4)];
    const variant = pick(rng, ["dot", "length-squared", "orthogonal-k"] as const);
    const d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    if (variant === "dot") {
      return {
        type: "numeric",
        id: "",
        body: "",
        question: r`Compute $\mathbf{u}\cdot\mathbf{v}$ for $\mathbf{u} = ${vec(...u)}$ and $\mathbf{v} = ${vec(...v)}$.`,
        answer: d,
        hint: "Multiply matching entries and add.",
        explanation: r`$(${u[0]})(${v[0]}) + (${u[1]})(${v[1]}) + (${u[2]})(${v[2]}) = ${d}$.`,
        tags: ["dot-product"],
      };
    }
    if (variant === "length-squared") {
      const ls = u[0] ** 2 + u[1] ** 2 + u[2] ** 2;
      return {
        type: "numeric",
        id: "",
        body: "",
        question: r`What is $\|\mathbf{u}\|^2$ for $\mathbf{u} = ${vec(...u)}$?`,
        answer: ls,
        hint: r`$\|\mathbf{u}\|^2 = \mathbf{u}\cdot\mathbf{u}$.`,
        explanation: r`$\|\mathbf{u}\|^2 = ${u[0]}^2 + ${u[1]}^2 + ${u[2]}^2 = ${ls}$, so $\|\mathbf{u}\| = \sqrt{${ls}}$.`,
        tags: ["length"],
      };
    }
    // find k so that u ⟂ (v0, v1, k)
    const k = -(u[0] * v[0] + u[1] * v[1]) / u[2];
    return {
      type: "numeric",
      id: "",
      body: "",
      question: r`For which $k$ are $\mathbf{u} = ${vec(...u)}$ and $\mathbf{w} = ${vec(v[0], v[1], "k")}$ orthogonal?`,
      answer: k,
      prefix: "k =",
      hint: r`Orthogonal means $\mathbf{u}\cdot\mathbf{w} = 0$. Solve for $k$.`,
      explanation: r`$\mathbf{u}\cdot\mathbf{w} = ${u[0] * v[0] + u[1] * v[1]} + ${u[2]}k = 0$, so $k = ${fracToLatex(frac(-(u[0] * v[0] + u[1] * v[1]), u[2]))}$.`,
      tags: ["orthogonality"],
    };
  },
});

define({
  id: "gen.projection",
  unitId: "u8",
  title: "Projection onto a line",
  make: (_seed, rng) => {
    const u = pick(rng, [
      [1, 1],
      [2, 1],
      [1, -1],
      [3, 1],
      [1, 2],
      [2, -1],
    ]);
    const y = [randInt(rng, -4, 4), randInt(rng, -4, 4)];
    const yu = y[0] * u[0] + y[1] * u[1];
    const uu = u[0] * u[0] + u[1] * u[1];
    const c = frac(yu, uu);
    const p = [mul(c, frac(u[0])), mul(c, frac(u[1]))];
    return {
      type: "matrix",
      id: "",
      body: "",
      question: r`Find the orthogonal projection of $\mathbf{y} = ${vec(...y)}$ onto the line through $\mathbf{0}$ and $\mathbf{u} = ${vec(...u)}$.`,
      answer: [[toNumber(p[0])], [toNumber(p[1])]],
      prefix: r`$\hat{\mathbf{y}} =$`,
      hint: r`$\hat{\mathbf{y}} = \dfrac{\mathbf{y}\cdot\mathbf{u}}{\mathbf{u}\cdot\mathbf{u}}\,\mathbf{u}$.`,
      explanation: r`$\mathbf{y}\cdot\mathbf{u} = ${yu}$ and $\mathbf{u}\cdot\mathbf{u} = ${uu}$, so $\hat{\mathbf{y}} = ${fracToLatex(c)}${vec(...u)} = ${vec(fracToLatex(p[0]), fracToLatex(p[1]))}$.`,
      tags: ["projection"],
    };
  },
});

define({
  id: "gen.least-squares",
  unitId: "u8",
  title: "Normal equations",
  make: (_seed, rng) => {
    const A = [
      [1, randInt(rng, 0, 2)],
      [1, randInt(rng, 1, 3)],
      [1, randInt(rng, 2, 4)],
    ];
    if (A[0][1] === A[1][1] && A[1][1] === A[2][1]) A[2][1] += 1;
    const b = [randInt(rng, -3, 3), randInt(rng, -3, 3), randInt(rng, -3, 3)];
    const Af = toFracMatrix(A);
    const AtA = matMul(transpose(Af), Af);
    const Atb = matMul(transpose(Af), b.map((x) => [frac(x)]));
    const variant = pick(rng, ["AtA", "Atb"] as const);
    if (variant === "AtA") {
      return {
        type: "matrix",
        id: "",
        body: "",
        question: r`For the least-squares problem $A\mathbf{x} = \mathbf{b}$ with $A = ${mat(A)}$, compute $A^TA$.`,
        answer: fracMatrixToNumbers(AtA),
        hint: r`$A^T$ is $2\times3$; multiply it by the $3\times2$ matrix $A$.`,
        explanation: r`$A^TA = ${mat(fracMatrixToNumbers(AtA))}$ — the normal equations are $A^TA\,\hat{\mathbf{x}} = A^T\mathbf{b}$.`,
        tags: ["least-squares"],
      };
    }
    return {
      type: "matrix",
      id: "",
      body: "",
      question: r`For $A = ${mat(A)}$ and $\mathbf{b} = ${vec(...b)}$, compute $A^T\mathbf{b}$.`,
      answer: fracMatrixToNumbers(Atb),
      hint: r`Each entry of $A^T\mathbf{b}$ is a column of $A$ dotted with $\mathbf{b}$.`,
      explanation: r`$A^T\mathbf{b} = ${vec(...fracMatrixToNumbers(Atb).map((row) => row[0]))}$: the first entry is the sum of the $b_i$, the second is $\sum t_i b_i$.`,
      tags: ["least-squares"],
    };
  },
});

/* ------------------------------------------------------------------ */
/* Unit 9 — symmetric matrices & SVD                                   */
/* ------------------------------------------------------------------ */

define({
  id: "gen.singular-values",
  unitId: "u9",
  title: "Singular values from AᵀA",
  make: (_seed, rng) => {
    // Choose A with A^T A diagonal for clean singular values: orthogonal columns
    const s1 = randInt(rng, 2, 5);
    const s2 = randInt(rng, 1, s1 - 1);
    const A = [
      [s1, 0],
      [0, s2],
      [0, 0],
    ];
    // optionally swap/negate to disguise
    if (rng() < 0.5) {
      A[0] = [0, -s2];
      A[1] = [s1, 0];
    }
    const variant = pick(rng, ["largest", "sum"] as const);
    if (variant === "largest") {
      return {
        type: "numeric",
        id: "",
        body: "",
        question: r`What is the largest singular value of $A = ${mat(A)}$?`,
        answer: s1,
        hint: r`Singular values are the square roots of the eigenvalues of $A^TA$.`,
        explanation: r`$A^TA = \operatorname{diag}(${s1 * s1}, ${s2 * s2})$ (in some order), with eigenvalues $${s1 * s1}$ and $${s2 * s2}$. So $\sigma_1 = ${s1}$, $\sigma_2 = ${s2}$.`,
        tags: ["svd"],
      };
    }
    const eigs = add(frac(s1 * s1), frac(s2 * s2));
    return {
      type: "numeric",
      id: "",
      body: "",
      question: r`For $A = ${mat(A)}$, what is $\sigma_1^2 + \sigma_2^2$ (the sum of the squared singular values)?`,
      answer: toNumber(eigs),
      hint: r`$\sigma_i^2$ are the eigenvalues of $A^TA$; their sum is the trace of $A^TA$.`,
      explanation: r`$\operatorname{tr}(A^TA) = ${s1 * s1} + ${s2 * s2} = ${toNumber(eigs)}$, which also equals the sum of the squares of all entries of $A$.`,
      tags: ["svd"],
    };
  },
});
