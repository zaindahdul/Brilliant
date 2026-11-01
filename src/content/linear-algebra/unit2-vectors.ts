import type { Unit } from "../types";
import { aug, goal, lesson, mat, matrix, mc, multi, numeric, order, r, reading, tf, vec } from "../dsl";

/* ------------------------------------------------------------------ */
/* Lesson 1 · Vectors and linear combinations (Lay §1.3)                */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "u2-l1-vectors-and-combinations",
    unitId: "u2",
    title: "Vectors and linear combinations",
    summary: "Arrows, columns, the parallelogram rule, weights, and the idea that will carry the whole course: linear combinations.",
    textbook: "Lay §1.3",
    minutes: 12,
  },
  [
    reading(
      "intro",
      r`A **vector** in $\mathbb{R}^2$ is a column of two numbers, $\mathbf{u} = ${vec(2, 1)}$, drawn as an arrow from the origin to the point $(2, 1)$. Two vectors are equal only if *all* their entries match.

**Addition** is entrywise, and geometrically it's the **parallelogram rule**: $\mathbf{u} + \mathbf{v}$ is the far corner of the parallelogram with sides $\mathbf{u}$ and $\mathbf{v}$. Drag the tips of $\mathbf{u}$ and $\mathbf{v}$ and watch the green sum follow.`,
      {
        title: "Arrows and columns",
        visual: {
          kind: "vectors",
          config: {
            vectors: [
              { id: "u", x: 2, y: 1, color: "blue", label: "u", draggable: true },
              { id: "v", x: -1, y: 2, color: "orange", label: "v", draggable: true },
            ],
            show: ["sum", "parallelogram"],
          },
        },
      },
    ),
    matrix("add", {
      question: r`Compute $\mathbf{u} + \mathbf{v}$ for $\mathbf{u} = ${vec(3, -1)}$ and $\mathbf{v} = ${vec(-2, 4)}$.`,
      answer: [[1], [3]],
      hint: "Add the top entries together and the bottom entries together.",
      explanation: r`$${vec(3, -1)} + ${vec(-2, 4)} = ${vec("3 + (-2)", "-1 + 4")} = ${vec(1, 3)}$.`,
      tags: ["vector-arithmetic"],
    }),
    matrix("scale-combine", {
      body: r`**Scalar multiplication** stretches a vector: $c\,\mathbf{u}$ multiplies every entry by $c$. A negative $c$ flips the direction.`,
      question: r`Compute $3\mathbf{u} - 2\mathbf{v}$ for $\mathbf{u} = ${vec(1, 2)}$ and $\mathbf{v} = ${vec(2, -1)}$.`,
      answer: [[-1], [8]],
      hint: r`First form $3\mathbf{u}$ and $2\mathbf{v}$ separately, then subtract entrywise.`,
      explanation: r`$3\mathbf{u} = ${vec(3, 6)}$ and $2\mathbf{v} = ${vec(4, -2)}$, so $3\mathbf{u} - 2\mathbf{v} = ${vec("3 - 4", "6 - (-2)")} = ${vec(-1, 8)}$.`,
      tags: ["vector-arithmetic"],
    }),
    reading(
      "lincomb",
      r`Put the two operations together and you get the central construction of linear algebra. Given vectors $\mathbf{v}_1, \dots, \mathbf{v}_p$ and scalars $c_1, \dots, c_p$, the vector

$$\mathbf{y} = c_1\mathbf{v}_1 + c_2\mathbf{v}_2 + \cdots + c_p\mathbf{v}_p$$

is a **linear combination** of the $\mathbf{v}_i$ with **weights** $c_i$. Weights can be any real numbers, including $0$ and negatives.

Move the sliders: the green vector is $c_1\mathbf{u} + c_2\mathbf{v}$. Notice how two fixed directions, with the right weights, can reach anywhere.`,
      {
        title: "Linear combinations",
        visual: {
          kind: "vectors",
          config: {
            vectors: [
              { id: "u", x: 2, y: 1, color: "blue", label: "u" },
              { id: "v", x: 1, y: 2, color: "orange", label: "v" },
            ],
            show: ["combination"],
            combination: { of: ["u", "v"], a: 1, b: 1, sliders: true, min: -3, max: 3, step: 0.5 },
          },
        },
      },
    ),
    goal("hit-target", {
      question: r`Use the sliders to find weights $c_1, c_2$ with $c_1\mathbf{u} + c_2\mathbf{v} = ${vec(4, 5)}$, where $\mathbf{u} = ${vec(2, 1)}$ and $\mathbf{v} = ${vec(1, 2)}$. Land the green vector on the target.`,
      visual: {
        kind: "vectors",
        config: {
          vectors: [
            { id: "u", x: 2, y: 1, color: "blue", label: "u" },
            { id: "v", x: 1, y: 2, color: "orange", label: "v" },
          ],
          show: ["combination"],
          combination: { of: ["u", "v"], a: 1, b: 1, sliders: true, min: -3, max: 3, step: 0.5 },
          goal: { type: "combination-equals", target: [4, 5], tolerance: 1e-6 },
        },
      },
      hint: r`Write it as equations: top entries give $2c_1 + c_2 = 4$, bottom entries give $c_1 + 2c_2 = 5$. Solve, then set the sliders.`,
      explanation: r`The system $2c_1 + c_2 = 4,\; c_1 + 2c_2 = 5$ has the unique solution $c_1 = 1$, $c_2 = 2$: indeed $1${vec(2, 1)} + 2${vec(1, 2)} = ${vec(4, 5)}$. Finding weights **is** solving a linear system — that's the next idea.`,
      tags: ["linear-combinations"],
    }),
    reading(
      "vector-eq",
      r`That last step is the key translation of this chapter. The **vector equation**

$$x_1\mathbf{a}_1 + x_2\mathbf{a}_2 + \cdots + x_n\mathbf{a}_n = \mathbf{b}$$

has exactly the same solution set as the linear system whose augmented matrix is

$$[\,\mathbf{a}_1 \;\; \mathbf{a}_2 \;\; \cdots \;\; \mathbf{a}_n \;\mid\; \mathbf{b}\,].$$

The vectors go in as **columns**, and the unknown weights are the variables. So "can $\mathbf{b}$ be built from the $\mathbf{a}_i$?" is answered by row reduction.`,
      { title: "Weights are unknowns" },
    ),
    mc("which-aug", {
      question: r`Which augmented matrix corresponds to the vector equation $x_1${vec(1, 2)} + x_2${vec(3, -1)} = ${vec(7, 0)}$?`,
      choices: [
        ["cols", r`$${aug([
          [1, 3, 7],
          [2, -1, 0],
        ])}$`, undefined],
        ["rows", r`$${aug([
          [1, 2, 7],
          [3, -1, 0],
        ])}$`, "You've written the vectors as *rows*. Each vector is a column of the augmented matrix."],
        ["nob", r`$${mat([
          [1, 3],
          [2, -1],
        ])}$`, "That's the coefficient matrix — the right-hand side $\\mathbf{b}$ is missing."],
        ["bfirst", r`$${aug([
          [7, 1, 3],
          [0, 2, -1],
        ])}$`, "The constant vector goes in the *last* column."],
      ],
      correct: "cols",
      hint: r`Each vector in the equation becomes one column, left to right, and $\mathbf{b}$ is the final column.`,
      explanation: r`Column by column: $\mathbf{a}_1 = ${vec(1, 2)}$, $\mathbf{a}_2 = ${vec(3, -1)}$, then $\mathbf{b} = ${vec(7, 0)}$. Row 1 of the matrix is the equation for the top entries, $x_1 + 3x_2 = 7$; row 2 is $2x_1 - x_2 = 0$.`,
      tags: ["vector-equation"],
    }),
    numeric("solve-weights", {
      question: r`Solve that vector equation. What is $x_2$?`,
      answer: 2,
      prefix: "x_2 =",
      hint: r`Row reduce $${aug([
        [1, 3, 7],
        [2, -1, 0],
      ])}$, or notice the second equation says $x_2 = 2x_1$.`,
      explanation: r`From row 2, $x_2 = 2x_1$. Substituting into $x_1 + 3x_2 = 7$ gives $7x_1 = 7$, so $x_1 = 1$ and $x_2 = 2$. Check: $1${vec(1, 2)} + 2${vec(3, -1)} = ${vec(7, 0)}$ ✓.`,
      tags: ["vector-equation"],
    }),
    reading(
      "span",
      r`The set of **all** linear combinations of $\mathbf{v}_1, \dots, \mathbf{v}_p$ is called their **span**, written $\operatorname{Span}\{\mathbf{v}_1, \dots, \mathbf{v}_p\}$. Asking whether $\mathbf{b}$ is in the span is the same as asking whether the vector equation above is consistent.

Geometrically:

- $\operatorname{Span}\{\mathbf{v}\}$ for a nonzero $\mathbf{v}$ is the **line** through the origin in the direction of $\mathbf{v}$.
- $\operatorname{Span}\{\mathbf{u}, \mathbf{v}\}$ for non-parallel $\mathbf{u}, \mathbf{v}$ is a **plane** through the origin (in $\mathbb{R}^2$, the whole plane).

The shaded region below is $\operatorname{Span}\{\mathbf{u}, \mathbf{v}\}$. Drag $\mathbf{v}$ onto the line through $\mathbf{u}$ and watch the plane collapse to a line.`,
      {
        title: "Span",
        visual: {
          kind: "vectors",
          config: {
            vectors: [
              { id: "u", x: 2, y: 1, color: "blue", label: "u" },
              { id: "v", x: -1, y: 2, color: "orange", label: "v", draggable: true },
            ],
            spanOf: ["u", "v"],
          },
        },
      },
    ),
    mc("span-one", {
      question: r`For a nonzero vector $\mathbf{v}$ in $\mathbb{R}^3$, what is $\operatorname{Span}\{\mathbf{v}\}$?`,
      choices: [
        ["line", "A line through the origin.", undefined],
        ["point", r`Just the single point $\mathbf{v}$.`, "The span includes every multiple $c\\mathbf{v}$ — infinitely many points."],
        ["plane", "A plane through the origin.", "A single direction can't sweep out a plane; you need two independent directions."],
        ["all", r`All of $\mathbb{R}^3$.`, "Multiples of one vector stay on one line."],
      ],
      correct: "line",
      hint: r`List a few elements: $0\mathbf{v}, 1\mathbf{v}, 2\mathbf{v}, -\tfrac12\mathbf{v}, \dots$ Where do they all sit?`,
      explanation: r`Every element is $c\mathbf{v}$ for some real $c$, i.e. a point on the line through $\mathbf{0}$ and $\mathbf{v}$. The span of two non-parallel vectors in $\mathbb{R}^3$ is a plane through the origin, and you need three well-chosen vectors to fill all of $\mathbb{R}^3$.`,
      tags: ["span"],
    }),
    tf("span-r2", {
      statement: r`If $\mathbf{u}$ and $\mathbf{v}$ are nonzero vectors in $\mathbb{R}^2$ that are not multiples of each other, then $\operatorname{Span}\{\mathbf{u}, \mathbf{v}\} = \mathbb{R}^2$.`,
      answer: true,
      feedback: "Think about the shaded region in the picture above when the two arrows point in different directions.",
      hint: r`Non-parallel means the augmented matrix $[\,\mathbf{u}\ \mathbf{v} \mid \mathbf{b}\,]$ has two pivots for *any* $\mathbf{b}$.`,
      explanation: r`True. Two non-parallel directions reach every point of the plane: for any $\mathbf{b}$ the system $x_1\mathbf{u} + x_2\mathbf{v} = \mathbf{b}$ has a pivot in both rows, hence a solution.`,
      tags: ["span"],
    }),
    reading(
      "summary",
      r`**What you did:** added and scaled vectors, built linear combinations by hand and with sliders, translated vector equations into augmented matrices, and met *span*.

**Remember:**

- $x_1\mathbf{a}_1 + \cdots + x_n\mathbf{a}_n = \mathbf{b}$ ⟺ the system with augmented matrix $[\,\mathbf{a}_1 \cdots \mathbf{a}_n \mid \mathbf{b}\,]$.
- $\mathbf{b} \in \operatorname{Span}\{\mathbf{a}_1, \dots, \mathbf{a}_n\}$ ⟺ that system is consistent.

Next: deciding membership in a span, in three dimensions where you can't just look.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Is b reachable? (Lay §1.3)                                */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "u2-l2-span",
    unitId: "u2",
    title: "Is b in the span?",
    summary: "Decide whether a vector is a linear combination of others by row reducing, and picture spans in three dimensions.",
    textbook: "Lay §1.3",
    minutes: 11,
  },
  [
    reading(
      "method",
      r`Is $\mathbf{b} = ${vec(4, -7, 6)}$ in $\operatorname{Span}\{\mathbf{a}_1, \mathbf{a}_2\}$ where $\mathbf{a}_1 = ${vec(1, -2, 1)}$ and $\mathbf{a}_2 = ${vec(2, -3, 4)}$?

Translate: does $x_1\mathbf{a}_1 + x_2\mathbf{a}_2 = \mathbf{b}$ have a solution? Row reduce the augmented matrix:

$$${aug([
        [1, 2, 4],
        [-2, -3, -7],
        [1, 4, 6],
      ])} \;\sim\; ${aug([
        [1, 2, 4],
        [0, 1, 1],
        [0, 2, 2],
      ])} \;\sim\; ${aug([
        [1, 2, 4],
        [0, 1, 1],
        [0, 0, 0],
      ])}.$$

No pivot in the last column, so it's consistent: $x_2 = 1$, $x_1 = 2$, and indeed $2\mathbf{a}_1 + \mathbf{a}_2 = \mathbf{b}$. Yes — $\mathbf{b}$ is in the span.`,
      { title: "Membership by row reduction" },
    ),
    mc("in-span-1", {
      body: r`Let $\mathbf{a}_1 = ${vec(1, 0, 1)}$ and $\mathbf{a}_2 = ${vec(0, 1, 1)}$.`,
      question: r`Is $\mathbf{b} = ${vec(1, 1, 3)}$ in $\operatorname{Span}\{\mathbf{a}_1, \mathbf{a}_2\}$?`,
      choices: [
        ["no", "No — the system is inconsistent.", undefined],
        ["yes11", r`Yes, with weights $x_1 = 1$, $x_2 = 1$.`, "Those weights match the first two entries. Check the third entry: $1 + 1 = 2$, not $3$."],
        ["yes12", r`Yes, with weights $x_1 = 1$, $x_2 = 2$.`, "The second entry of $\\mathbf{b}$ is $1$, so $x_2$ would have to be $1$, not $2$."],
        ["cant", "It can't be decided without more information.", "Everything needed is here — set up the three equations and check them."],
      ],
      correct: "no",
      hint: r`The first two entries force $x_1 = 1$ and $x_2 = 1$. Does the third entry then come out right?`,
      explanation: r`Entries 1 and 2 give $x_1 = 1$, $x_2 = 1$, but then entry 3 would be $x_1 + x_2 = 2 \neq 3$. The augmented matrix reduces to a row $[\,0\ 0 \mid 1\,]$, so the system is inconsistent and $\mathbf{b}$ is **not** in the span. Geometrically, the span is the plane $z = x + y$, and $(1, 1, 3)$ sits above it.`,
      tags: ["span"],
    }),
    numeric("k-in-span", {
      question: r`With the same $\mathbf{a}_1 = ${vec(1, 0, 1)}$, $\mathbf{a}_2 = ${vec(0, 1, 1)}$, for which value of $k$ is $${vec(2, 3, "k")}$ in $\operatorname{Span}\{\mathbf{a}_1, \mathbf{a}_2\}$?`,
      answer: 5,
      prefix: "k =",
      hint: r`The first two entries pin down the weights. The third entry must then equal $x_1 + x_2$.`,
      explanation: r`$x_1 = 2$, $x_2 = 3$, so the third entry must be $2 + 3 = 5$. Only $k = 5$ works — the span is the plane $z = x + y$, and only one point on the vertical line $(2, 3, k)$ lies on it.`,
      tags: ["span"],
    }),
    goal("span-the-plane", {
      question: r`$\mathbf{u} = ${vec(2, 1)}$ is fixed and $\mathbf{v}$ currently points the same way. Drag $\mathbf{v}$ so that $\operatorname{Span}\{\mathbf{u}, \mathbf{v}\}$ is the **whole plane**.`,
      visual: {
        kind: "vectors",
        config: {
          vectors: [
            { id: "u", x: 2, y: 1, color: "blue", label: "u" },
            { id: "v", x: 4, y: 2, color: "orange", label: "v", draggable: true },
          ],
          spanOf: ["u", "v"],
          goal: { type: "span-plane", of: ["u", "v"] },
        },
      },
      hint: r`Right now $\mathbf{v} = 2\mathbf{u}$, so every combination stays on one line. Any direction off that line will do.`,
      explanation: r`As long as $\mathbf{v}$ is not a multiple of $\mathbf{u}$ (and isn't zero), the two directions are independent and their combinations fill $\mathbb{R}^2$. When $\mathbf{v}$ is parallel to $\mathbf{u}$ the span collapses to the line through $\mathbf{u}$.`,
      tags: ["span", "geometry"],
    }),
    mc("span-three-parallel", {
      question: r`In $\mathbb{R}^2$, what is $\operatorname{Span}\left\{${vec(1, 2)}, ${vec(2, 4)}, ${vec(3, 6)}\right\}$?`,
      choices: [
        ["line", "A line through the origin.", undefined],
        ["r2", r`All of $\mathbb{R}^2$.`, "Three vectors sound like plenty, but they all point along the same direction."],
        ["plane3", r`A plane in $\mathbb{R}^3$.`, "These vectors live in $\\mathbb{R}^2$, not $\\mathbb{R}^3$."],
        ["points", "Just the three given points.", "A span always includes all combinations — infinitely many points."],
      ],
      correct: "line",
      hint: "Each vector is a multiple of the first one. What do multiples of a single vector span?",
      explanation: r`$${vec(2, 4)} = 2${vec(1, 2)}$ and $${vec(3, 6)} = 3${vec(1, 2)}$, so every combination is a multiple of $${vec(1, 2)}$: a line. Extra vectors only enlarge a span when they point in a genuinely new direction.`,
      tags: ["span"],
    }),
    multi("which-in-span", {
      body: r`Let $\mathbf{a}_1 = ${vec(1, 1, 0)}$ and $\mathbf{a}_2 = ${vec(0, 1, 1)}$.`,
      question: r`Select **every** vector that lies in $\operatorname{Span}\{\mathbf{a}_1, \mathbf{a}_2\}$.`,
      choices: [
        ["s", r`$${vec(1, 2, 1)}$`],
        ["d", r`$${vec(2, 2, 0)}$`],
        ["m", r`$${vec(1, 0, -1)}$`],
        ["o", r`$${vec(1, 1, 1)}$`],
        ["z", r`$${vec(0, 0, 0)}$`],
      ],
      correct: ["s", "d", "m", "z"],
      hint: r`A vector $(p, q, s)$ is in the span when $x_1 = p$, $x_2 = s$ and the middle entry equals $x_1 + x_2$. Don't forget the zero vector.`,
      explanation: r`$${vec(1, 2, 1)} = \mathbf{a}_1 + \mathbf{a}_2$, $${vec(2, 2, 0)} = 2\mathbf{a}_1$, $${vec(1, 0, -1)} = \mathbf{a}_1 - \mathbf{a}_2$, and $\mathbf{0} = 0\mathbf{a}_1 + 0\mathbf{a}_2$. For $${vec(1, 1, 1)}$ we'd need $x_1 = 1$, $x_2 = 1$ and middle entry $2 \neq 1$ — not in the span.`,
      tags: ["span"],
    }),
    tf("zero-in-span", {
      statement: r`The zero vector is in $\operatorname{Span}\{\mathbf{v}_1, \dots, \mathbf{v}_p\}$ for any vectors $\mathbf{v}_1, \dots, \mathbf{v}_p$.`,
      answer: true,
      feedback: "What weights would you use?",
      hint: "Weights are allowed to be zero.",
      explanation: r`True: $0\mathbf{v}_1 + \cdots + 0\mathbf{v}_p = \mathbf{0}$. Every span contains the origin — which is why spans are always lines, planes, … *through the origin*.`,
      tags: ["span"],
    }),
    mc("span-redundant", {
      question: r`Suppose $\mathbf{a}_1 \neq \mathbf{0}$ and $\mathbf{a}_2 = 3\mathbf{a}_1$. Which is true?`,
      choices: [
        ["same", r`$\operatorname{Span}\{\mathbf{a}_1, \mathbf{a}_2\} = \operatorname{Span}\{\mathbf{a}_1\}$ — a line.`, undefined],
        ["bigger", r`$\operatorname{Span}\{\mathbf{a}_1, \mathbf{a}_2\}$ is strictly larger than $\operatorname{Span}\{\mathbf{a}_1\}$.`, "Any combination $x_1\\mathbf{a}_1 + x_2(3\\mathbf{a}_1) = (x_1 + 3x_2)\\mathbf{a}_1$ is still a multiple of $\\mathbf{a}_1$."],
        ["plane", r`$\operatorname{Span}\{\mathbf{a}_1, \mathbf{a}_2\}$ is a plane.`, "A plane needs two different directions; $\\mathbf{a}_2$ points along $\\mathbf{a}_1$."],
        ["empty", r`$\operatorname{Span}\{\mathbf{a}_1, \mathbf{a}_2\}$ is empty.`, "Spans are never empty — they always contain $\\mathbf{0}$."],
      ],
      correct: "same",
      hint: r`Simplify $x_1\mathbf{a}_1 + x_2(3\mathbf{a}_1)$.`,
      explanation: r`$x_1\mathbf{a}_1 + x_2(3\mathbf{a}_1) = (x_1 + 3x_2)\mathbf{a}_1$, so the span is just the multiples of $\mathbf{a}_1$. A vector that is already a combination of the others adds nothing to the span.`,
      tags: ["span"],
    }),
    reading(
      "summary",
      r`**What you did:** tested span membership by row reduction, found the parameter that puts a vector on a plane, and saw that redundant (parallel) vectors don't enlarge a span.

Next: the same questions rephrased with a matrix, $A\mathbf{x} = \mathbf{b}$ — and a theorem that tells you when *every* $\mathbf{b}$ is reachable.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · The matrix equation Ax = b (Lay §1.4)                     */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "u2-l3-matrix-equation",
    unitId: "u2",
    title: "The matrix equation Ax = b",
    summary: "Ax as a combination of columns, three equivalent viewpoints, and the pivot-in-every-row theorem.",
    textbook: "Lay §1.4",
    minutes: 13,
  },
  [
    reading(
      "def",
      r`If $A$ is an $m \times n$ matrix with columns $\mathbf{a}_1, \dots, \mathbf{a}_n$ and $\mathbf{x}$ is in $\mathbb{R}^n$, the product $A\mathbf{x}$ is **defined** to be the linear combination of the columns using the entries of $\mathbf{x}$ as weights:

$$A\mathbf{x} = x_1\mathbf{a}_1 + x_2\mathbf{a}_2 + \cdots + x_n\mathbf{a}_n.$$

For example $${mat([
        [1, 2],
        [3, 4],
        [0, 1],
      ])}${vec(2, -1)} = 2${vec(1, 3, 0)} - 1${vec(2, 4, 1)} = ${vec(0, 2, -1)}$.

A shortcut (the **row–vector rule**): entry $i$ of $A\mathbf{x}$ is row $i$ of $A$ "dotted" with $\mathbf{x}$. Both views give the same numbers; the column view is the one that explains *why* things work.`,
      { title: "Multiplying a matrix by a vector" },
    ),
    matrix("compute-ax", {
      question: r`Compute $A\mathbf{x}$ for $A = ${mat([
        [2, -1, 0],
        [1, 3, 2],
      ])}$ and $\mathbf{x} = ${vec(1, 2, -1)}$.`,
      answer: [[0], [5]],
      hint: r`$A\mathbf{x} = 1\cdot(\text{col }1) + 2\cdot(\text{col }2) + (-1)\cdot(\text{col }3)$.`,
      explanation: r`$1${vec(2, 1)} + 2${vec(-1, 3)} - 1${vec(0, 2)} = ${vec("2 - 2 - 0", "1 + 6 - 2")} = ${vec(0, 5)}$. Row–vector check: row 1 gives $2(1) - 1(2) + 0(-1) = 0$ ✓.`,
      tags: ["matrix-vector"],
    }),
    mc("defined-when", {
      question: r`$A\mathbf{x}$ is defined only when…`,
      choices: [
        ["cols", r`the number of **columns** of $A$ equals the number of entries in $\mathbf{x}$.`, undefined],
        ["rows", r`the number of **rows** of $A$ equals the number of entries in $\mathbf{x}$.`, "Each entry of $\\mathbf{x}$ is a weight for one *column*. Count columns."],
        ["square", r`$A$ is square.`, "Nothing requires squareness — a $3\\times 2$ matrix times a vector in $\\mathbb{R}^2$ is fine."],
        ["always", "always — any matrix times any vector.", "Try $\\begin{bmatrix}1&2\\end{bmatrix}$ times a vector with three entries: there's no third column to weight."],
      ],
      correct: "cols",
      hint: "Look at the definition: each entry of x multiplies one column.",
      explanation: r`$A\mathbf{x}$ weights the columns of $A$ by the entries of $\mathbf{x}$, so an $m \times n$ matrix needs $\mathbf{x} \in \mathbb{R}^n$. The result then lives in $\mathbb{R}^m$ (it's a combination of columns, which have $m$ entries).`,
      tags: ["matrix-vector"],
    }),
    reading(
      "three-views",
      r`One problem, three languages. For $A = [\,\mathbf{a}_1 \cdots \mathbf{a}_n\,]$ these have **the same solution set**:

- the matrix equation $A\mathbf{x} = \mathbf{b}$;
- the vector equation $x_1\mathbf{a}_1 + \cdots + x_n\mathbf{a}_n = \mathbf{b}$;
- the linear system with augmented matrix $[\,\mathbf{a}_1 \cdots \mathbf{a}_n \mid \mathbf{b}\,]$.

So: **$A\mathbf{x} = \mathbf{b}$ has a solution if and only if $\mathbf{b}$ is a linear combination of the columns of $A$.** Everything you learned about consistency transfers immediately.`,
      { title: "Three views of one problem" },
    ),
    reading(
      "theorem",
      r`Now the big existence theorem. For an $m \times n$ matrix $A$, the following are **logically equivalent** — all true or all false:

1. For each $\mathbf{b}$ in $\mathbb{R}^m$, the equation $A\mathbf{x} = \mathbf{b}$ has a solution.
2. Each $\mathbf{b}$ in $\mathbb{R}^m$ is a linear combination of the columns of $A$.
3. The columns of $A$ span $\mathbb{R}^m$.
4. $A$ has a pivot position in **every row**.

> Statement 4 is about the **coefficient** matrix $A$, not an augmented matrix. If $A$ has a pivot in every row, no augmented matrix $[A \mid \mathbf{b}]$ can ever have a pivot in its last column.`,
      { title: "When is every b reachable?" },
    ),
    mc("3x4-pivots", {
      question: r`$A$ is a $3 \times 4$ matrix with 3 pivot columns. Which statement is true?`,
      choices: [
        ["every", r`$A\mathbf{x} = \mathbf{b}$ is consistent for every $\mathbf{b}$ in $\mathbb{R}^3$.`, undefined],
        ["unique", r`$A\mathbf{x} = \mathbf{b}$ has a unique solution for every $\mathbf{b}$.`, "Three pivots but four columns — one column has no pivot, so there's a free variable."],
        ["indep", r`The columns of $A$ are linearly independent.`, "Four vectors in $\\mathbb{R}^3$ can never be independent (coming up in this unit)."],
        ["trivial", r`$A\mathbf{x} = \mathbf{0}$ has only the trivial solution.`, "A free variable means nontrivial solutions exist."],
      ],
      correct: "every",
      hint: "Three pivots in a matrix with three rows means a pivot in every row. Which part of the theorem is that?",
      explanation: r`3 pivots in 3 rows ⟹ a pivot in every row ⟹ (by the theorem) $A\mathbf{x} = \mathbf{b}$ is consistent for every $\mathbf{b}$ and the columns span $\mathbb{R}^3$. Uniqueness is a separate question: with 4 columns and only 3 pivots there is a free variable, so solutions are never unique.`,
      tags: ["existence"],
    }),
    mc("4x3-span", {
      question: r`$A$ is a $4 \times 3$ matrix. Can its columns span $\mathbb{R}^4$?`,
      choices: [
        ["never", "No, never — there can't be a pivot in every row.", undefined],
        ["ifindep", "Yes, if the columns are linearly independent.", "Independence gives a pivot in every *column*; spanning $\\mathbb{R}^4$ needs a pivot in every *row*, and there are only 3 columns for 4 rows."],
        ["always", "Yes, always.", "Three vectors can't fill four-dimensional space."],
        ["inv", r`Only if $A$ is invertible.`, "Invertibility is only defined for square matrices."],
      ],
      correct: "never",
      hint: "At most one pivot per column. How many rows need a pivot?",
      explanation: r`$A$ has at most 3 pivots (one per column) but 4 rows, so some row has no pivot. By the theorem the columns do **not** span $\mathbb{R}^4$ — three vectors can span at most a 3-dimensional slice of $\mathbb{R}^4$.`,
      tags: ["existence"],
    }),
    numeric("pivot-count-span", {
      question: r`$A$ is $5 \times 7$ and its columns span $\mathbb{R}^5$. How many pivot columns does $A$ have?`,
      answer: 5,
      hint: "Spanning ℝ⁵ means a pivot in every row. How many rows?",
      explanation: r`Spanning $\mathbb{R}^5$ ⟺ pivot in every one of the 5 rows ⟹ exactly 5 pivot columns (and $7 - 5 = 2$ free variables in $A\mathbf{x} = \mathbf{b}$).`,
      tags: ["existence"],
    }),
    matrix("compute-ax-2", {
      question: r`Compute $A\mathbf{x}$ for $A = ${mat([
        [1, 2],
        [0, 1],
        [-1, 1],
      ])}$ and $\mathbf{x} = ${vec(3, -2)}$.`,
      answer: [[-1], [-2], [-5]],
      hint: "The answer has three entries — one per row of A. Use either the column view or the row–vector rule.",
      explanation: r`$3${vec(1, 0, -1)} - 2${vec(2, 1, 1)} = ${vec("3 - 4", "0 - 2", "-3 - 2")} = ${vec(-1, -2, -5)}$.`,
      tags: ["matrix-vector"],
    }),
    tf("inconsistent-no-pivot", {
      statement: r`If $A\mathbf{x} = \mathbf{b}$ is inconsistent for some $\mathbf{b}$, then $A$ does not have a pivot in every row.`,
      answer: true,
      feedback: "This is the theorem read backwards (its contrapositive).",
      hint: "Pivot in every row ⟹ consistent for every b. What does one inconsistent b tell you?",
      explanation: r`True. "Pivot in every row" would guarantee a solution for *every* $\mathbf{b}$; a single inconsistent $\mathbf{b}$ shows that guarantee fails, so some row has no pivot. (The four statements are equivalent, so their negations are too.)`,
      tags: ["existence"],
    }),
    tf("square-unique", {
      statement: r`If $A$ is $3 \times 3$ and $A\mathbf{x} = \mathbf{b}$ has a solution for every $\mathbf{b}$ in $\mathbb{R}^3$, then that solution is unique for every $\mathbf{b}$.`,
      answer: true,
      feedback: "Count pivots. A square matrix with a pivot in every row also has a pivot in every…?",
      hint: "Pivot in every row gives 3 pivots. With 3 columns, where must they be?",
      explanation: r`True — but only because $A$ is square. A pivot in every row means 3 pivots; with only 3 columns that is a pivot in every column, so there are no free variables and every solution is unique. For a $3 \times 4$ matrix the same hypothesis would *not* give uniqueness.`,
      tags: ["existence", "uniqueness"],
    }),
    reading(
      "summary",
      r`**What you did:** computed $A\mathbf{x}$ as a combination of columns, connected matrix equations, vector equations and systems, and used the pivot-in-every-row theorem to reason about existence.

**Remember:** existence for *all* $\mathbf{b}$ is a property of $A$ alone: pivot in every **row** ⟺ columns span $\mathbb{R}^m$. Uniqueness is about pivots in every **column** — next lesson.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Solution sets (Lay §1.5)                                  */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "u2-l4-solution-sets",
    unitId: "u2",
    title: "Solution sets of linear systems",
    summary: "Homogeneous systems, parametric vector form, and why every solution set is a shifted copy of Nul A.",
    textbook: "Lay §1.5",
    minutes: 13,
  },
  [
    reading(
      "homog",
      r`A system is **homogeneous** when the right-hand side is zero: $A\mathbf{x} = \mathbf{0}$. It is always consistent, because $\mathbf{x} = \mathbf{0}$ works — the **trivial solution**. The interesting question is whether there is a **nontrivial** solution, and the answer is clean:

> $A\mathbf{x} = \mathbf{0}$ has a nontrivial solution **if and only if** the equation has at least one free variable.`,
      { title: "Homogeneous systems" },
    ),
    mc("3x5-nontrivial", {
      question: r`$A$ is $3 \times 5$. Does $A\mathbf{x} = \mathbf{0}$ have a nontrivial solution?`,
      choices: [
        ["yes", "Yes, always.", undefined],
        ["no", "No, never.", "Count: at most 3 pivots for 5 unknowns leaves free variables."],
        ["depends", r`It depends on the entries of $A$.`, "The shape alone decides this one — compare the number of pivots to the number of unknowns."],
        ["onlyzero", r`Only if $A$ has a zero column.`, "A zero column is one way to get a free variable, but here the shape already forces one."],
      ],
      correct: "yes",
      hint: "How many pivots can 3 rows hold? How many unknowns are there?",
      explanation: r`At most 3 pivots but 5 unknowns, so at least $5 - 3 = 2$ free variables. Free variables mean nontrivial solutions — in fact a whole plane (at least) of them through the origin.`,
      tags: ["homogeneous"],
    }),
    reading(
      "param",
      r`To describe *all* solutions, write them in **parametric vector form**. Take $A = ${mat([
        [1, 3, -2],
        [2, 6, -4],
      ])}$. Row reducing $[A \mid \mathbf{0}]$ gives $${aug([
        [1, 3, -2, 0],
        [0, 0, 0, 0],
      ])}$, so $x_1 = -3x_2 + 2x_3$ with $x_2, x_3$ free. Collect by free variable:

$$\mathbf{x} = ${vec("-3x_2 + 2x_3", "x_2", "x_3")} = x_2${vec(-3, 1, 0)} + x_3${vec(2, 0, 1)}.$$

The solution set is $\operatorname{Span}\left\{${vec(-3, 1, 0)}, ${vec(2, 0, 1)}\right\}$ — a plane through the origin in $\mathbb{R}^3$.`,
      { title: "Parametric vector form" },
    ),
    matrix("nullspace-vector", {
      body: r`$A = ${mat([
        [1, 2, 0, -1],
        [0, 0, 1, 2],
      ])}$ is already in reduced echelon form, with free variables $x_2$ and $x_4$.`,
      question: r`The solutions of $A\mathbf{x} = \mathbf{0}$ have the form $\mathbf{x} = x_2\mathbf{u} + x_4\mathbf{v}$. Find $\mathbf{v}$ (the solution with $x_4 = 1$, $x_2 = 0$).`,
      answer: [[1], [0], [-2], [1]],
      hint: r`Row 1 says $x_1 = -2x_2 + x_4$; row 2 says $x_3 = -2x_4$. Plug in $x_2 = 0$, $x_4 = 1$.`,
      explanation: r`With $x_2 = 0$, $x_4 = 1$: $x_1 = 1$ and $x_3 = -2$, so $\mathbf{v} = ${vec(1, 0, -2, 1)}$. (Similarly $\mathbf{u} = ${vec(-2, 1, 0, 0)}$.) The entries of $\mathbf{v}$ are exactly the coefficients of $x_4$ in the general solution.`,
      tags: ["parametric-form"],
    }),
    reading(
      "nonhomog",
      r`What about $A\mathbf{x} = \mathbf{b}$ with $\mathbf{b} \neq \mathbf{0}$? If it is consistent and $\mathbf{p}$ is any one solution (a **particular solution**), then the full solution set is

$$\{\,\mathbf{p} + \mathbf{v}_h \;:\; \mathbf{v}_h \text{ solves } A\mathbf{x} = \mathbf{0}\,\}.$$

In words: *every* solution is the particular solution plus some solution of the homogeneous equation. Geometrically the solution set of $A\mathbf{x} = \mathbf{b}$ is the solution set of $A\mathbf{x} = \mathbf{0}$ **translated** by $\mathbf{p}$: a line through the origin becomes a parallel line through $\mathbf{p}$, and so on.

Below, the purple arrow is $\mathbf{p}$ and the dashed blue arrow is a direction $\mathbf{v}$ from the homogeneous solution; the solutions $\mathbf{p} + t\mathbf{v}$ run along the line through the tip of $\mathbf{p}$.`,
      {
        title: "Nonhomogeneous: shift the picture",
        visual: {
          kind: "vectors",
          config: {
            vectors: [
              { id: "p", x: 1, y: 2, color: "purple", label: "p" },
              { id: "v", x: 2, y: 1, color: "blue", label: "v", tailAt: "p", dashed: true },
              { id: "v2", x: -2, y: -1, color: "blue", tailAt: "p", dashed: true },
            ],
          },
        },
      },
    ),
    matrix("particular", {
      question: r`Solve $A\mathbf{x} = \mathbf{b}$ with $A = ${mat([
        [1, 2, 0, -1],
        [0, 0, 1, 2],
      ])}$ and $\mathbf{b} = ${vec(3, 4)}$. Writing the solution set as $\mathbf{p} + x_2\mathbf{u} + x_4\mathbf{v}$ with $\mathbf{p}$ the solution having $x_2 = x_4 = 0$, what is $\mathbf{p}$?`,
      answer: [[3], [0], [4], [0]],
      hint: r`The augmented matrix $[A \mid \mathbf{b}]$ is already reduced. Set both free variables to $0$ and read off $x_1$ and $x_3$.`,
      explanation: r`Row 1: $x_1 = 3 - 2x_2 + x_4$; row 2: $x_3 = 4 - 2x_4$. With $x_2 = x_4 = 0$: $\mathbf{p} = ${vec(3, 0, 4, 0)}$. The full solution set is $\mathbf{p} + x_2${vec(-2, 1, 0, 0)} + x_4${vec(1, 0, -2, 1)}$ — the same $\mathbf{u}, \mathbf{v}$ as for the homogeneous equation, shifted by $\mathbf{p}$.`,
      tags: ["parametric-form"],
    }),
    mc("geometry", {
      question: r`$A$ is $2 \times 3$ with 2 pivot columns, $\mathbf{b} \neq \mathbf{0}$, and $A\mathbf{x} = \mathbf{b}$ is consistent. Geometrically, the solution set is…`,
      choices: [
        ["line-off", r`a line in $\mathbb{R}^3$ that does **not** pass through the origin.`, undefined],
        ["line-origin", r`a line in $\mathbb{R}^3$ through the origin.`, "A solution set through the origin would mean $\\mathbf{0}$ is a solution — but $A\\mathbf{0} = \\mathbf{0} \\neq \\mathbf{b}$."],
        ["plane", r`a plane in $\mathbb{R}^3$.`, "Count free variables: 3 unknowns, 2 pivots, so just one free variable — one degree of freedom."],
        ["point", "a single point.", "One free variable means infinitely many solutions."],
      ],
      correct: "line-off",
      hint: r`One free variable gives a one-parameter family $\mathbf{p} + t\mathbf{v}$. Is $\mathbf{0}$ a solution?`,
      explanation: r`$3 - 2 = 1$ free variable, so the solutions form a line $\mathbf{p} + t\mathbf{v}$. Since $\mathbf{b} \neq \mathbf{0}$, $\mathbf{x} = \mathbf{0}$ is not a solution, so the line misses the origin. It is parallel to the line of solutions of $A\mathbf{x} = \mathbf{0}$.`,
      tags: ["geometry"],
    }),
    order("procedure", {
      question: "Order the steps for writing the solution set of a consistent system in parametric vector form.",
      items: [
        ["rref", "Row reduce the augmented matrix to reduced echelon form."],
        ["express", "Express each basic variable in terms of the free variables."],
        ["vector", "Write the general solution as a single vector with the free variables as parameters."],
        ["decompose", "Decompose that vector into a constant vector plus a sum of (free variable) × (vector)."],
      ],
      hint: "You need the reduced form before you can isolate basic variables, and you need the general solution before you can split it up.",
      explanation: r`Reduce → solve for basic variables → assemble the vector → split it as $\mathbf{p} + x_{\text{free}}\mathbf{v} + \cdots$. The constant part is a particular solution; the rest spans the solutions of the homogeneous equation.`,
      tags: ["procedure"],
    }),
    tf("v-solves-homog", {
      statement: r`If the solution set of $A\mathbf{x} = \mathbf{b}$ (with $\mathbf{b} \neq \mathbf{0}$) is $\{\mathbf{p} + t\mathbf{v} : t \in \mathbb{R}\}$, then $\mathbf{v}$ is a solution of $A\mathbf{x} = \mathbf{0}$.`,
      answer: true,
      feedback: "Compare two solutions on the line, say t = 0 and t = 1, and subtract.",
      hint: r`$A(\mathbf{p} + \mathbf{v}) = \mathbf{b}$ and $A\mathbf{p} = \mathbf{b}$. Subtract.`,
      explanation: r`True: $A\mathbf{v} = A(\mathbf{p} + \mathbf{v}) - A\mathbf{p} = \mathbf{b} - \mathbf{b} = \mathbf{0}$. The direction vectors of a solution set always solve the homogeneous equation.`,
      tags: ["theory"],
    }),
    tf("solution-set-subspace", {
      statement: r`The solution set of $A\mathbf{x} = \mathbf{b}$ always contains the zero vector.`,
      answer: false,
      feedback: r`Plug $\mathbf{x} = \mathbf{0}$ in. What does $A\mathbf{0}$ equal?`,
      hint: r`$A\mathbf{0} = \mathbf{0}$. When is that equal to $\mathbf{b}$?`,
      explanation: r`False: $A\mathbf{0} = \mathbf{0}$, so $\mathbf{0}$ is a solution only when $\mathbf{b} = \mathbf{0}$. Solution sets of *nonhomogeneous* systems are shifted away from the origin — which is why (in Unit 6) they are not subspaces.`,
      tags: ["theory"],
    }),
    reading(
      "summary",
      r`**What you did:** wrote solution sets in parametric vector form, found particular solutions, and connected the solutions of $A\mathbf{x} = \mathbf{b}$ to those of $A\mathbf{x} = \mathbf{0}$.

**Remember:** solutions of $A\mathbf{x} = \mathbf{b}$ = (one particular solution) + (all solutions of $A\mathbf{x} = \mathbf{0}$). The homogeneous part is a span; the shift is $\mathbf{p}$.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 5 · Linear independence (Lay §1.7)                            */
/* ------------------------------------------------------------------ */

const l5 = lesson(
  {
    id: "u2-l5-linear-independence",
    unitId: "u2",
    title: "Linear independence",
    summary: "When does a set of vectors contain redundancy? The definition, the shortcuts, and the pivot test.",
    textbook: "Lay §1.7",
    minutes: 13,
  },
  [
    reading(
      "def",
      r`A set $\{\mathbf{v}_1, \dots, \mathbf{v}_p\}$ is **linearly independent** if the vector equation

$$x_1\mathbf{v}_1 + x_2\mathbf{v}_2 + \cdots + x_p\mathbf{v}_p = \mathbf{0}$$

has **only the trivial solution** $x_1 = \cdots = x_p = 0$. If some nontrivial choice of weights (not all zero) gives $\mathbf{0}$, the set is **linearly dependent**, and that equation is a **linear dependence relation**.

In matrix language: the columns of $A$ are linearly independent ⟺ $A\mathbf{x} = \mathbf{0}$ has only the trivial solution ⟺ $A$ has a pivot in **every column** (no free variables).`,
      { title: "Independence" },
    ),
    mc("parallel-pair", {
      body: r`Below, $\mathbf{u} = ${vec(2, 1)}$ and $\mathbf{v} = ${vec(-4, -2)}$.`,
      question: r`Is $\{\mathbf{u}, \mathbf{v}\}$ linearly independent?`,
      visual: {
        kind: "vectors",
        config: {
          vectors: [
            { id: "u", x: 2, y: 1, color: "blue", label: "u" },
            { id: "v", x: -4, y: -2, color: "orange", label: "v" },
          ],
          spanOf: ["u", "v"],
        },
      },
      choices: [
        ["dep", r`No — $\mathbf{v} = -2\mathbf{u}$, so $2\mathbf{u} + \mathbf{v} = \mathbf{0}$ is a dependence relation.`, undefined],
        ["indep", "Yes — they point in opposite directions, so neither is a positive multiple of the other.", "The sign doesn't matter. A *negative* multiple is still a multiple."],
        ["indep2", "Yes — two vectors are always independent.", "Two vectors are dependent exactly when one is a multiple of the other, which happens here."],
      ],
      correct: "dep",
      hint: r`Can you write $\mathbf{v}$ as a scalar times $\mathbf{u}$?`,
      explanation: r`$\mathbf{v} = -2\mathbf{u}$, so $2\mathbf{u} + 1\mathbf{v} = \mathbf{0}$ with weights that aren't all zero: dependent. For a set of exactly two vectors, dependence means precisely that one is a multiple of the other — and their span collapses to a line.`,
      tags: ["independence"],
    }),
    goal("make-independent", {
      question: r`Drag $\mathbf{v}$ so that $\{\mathbf{u}, \mathbf{v}\}$ becomes linearly independent.`,
      visual: {
        kind: "vectors",
        config: {
          vectors: [
            { id: "u", x: 2, y: 1, color: "blue", label: "u" },
            { id: "v", x: -4, y: -2, color: "orange", label: "v", draggable: true },
          ],
          spanOf: ["u", "v"],
          goal: { type: "span-plane", of: ["u", "v"] },
        },
      },
      hint: "Independent means v is not on the line through u (and not zero).",
      explanation: r`Any $\mathbf{v}$ off the line through $\mathbf{u}$ works. Independence for two vectors and "the span is the whole plane" are the same condition — the pivot test says both happen exactly when $[\,\mathbf{u}\ \mathbf{v}\,]$ has two pivots.`,
      tags: ["independence", "geometry"],
    }),
    mc("multiple-3d", {
      question: r`Is $\left\{${vec(1, 2, 3)}, ${vec(2, 4, 6)}\right\}$ linearly independent?`,
      choices: [
        ["dep", "No — the second vector is twice the first.", undefined],
        ["indep", "Yes — they are different vectors.", "Different isn't enough. Check whether one is a scalar multiple of the other."],
        ["indep3", r`Yes — two vectors in $\mathbb{R}^3$ can't span $\mathbb{R}^3$, so they're independent.`, "Spanning and independence are different questions. Two vectors in $\\mathbb{R}^3$ never span it, but they can still be dependent."],
      ],
      correct: "dep",
      hint: "Compare entry by entry: what do you multiply the first vector by to get the second?",
      explanation: r`$${vec(2, 4, 6)} = 2${vec(1, 2, 3)}$, giving the dependence relation $2\mathbf{v}_1 - \mathbf{v}_2 = \mathbf{0}$. For two vectors, "dependent" and "one is a multiple of the other" are the same thing.`,
      tags: ["independence"],
    }),
    numeric("h-dependent", {
      question: r`For which value of $h$ is $\left\{${vec(1, -1, 2)}, ${vec(3, "h", 6)}\right\}$ linearly **dependent**?`,
      answer: -3,
      prefix: "h =",
      hint: "Two vectors are dependent exactly when one is a multiple of the other. The first and third entries fix the multiple.",
      explanation: r`The second vector must be $3$ times the first: $3${vec(1, -1, 2)} = ${vec(3, -3, 6)}$, so $h = -3$. For any other $h$ the set is independent.`,
      tags: ["independence"],
    }),
    mc("four-in-r3", {
      question: r`Is $\left\{${vec(1, 0, 0)}, ${vec(0, 1, 0)}, ${vec(1, 1, 0)}, ${vec(0, 0, 1)}\right\}$ linearly independent?`,
      choices: [
        ["dep-count", r`No — four vectors in $\mathbb{R}^3$ are always dependent.`, undefined],
        ["indep-mult", "Yes — no vector is a multiple of another.", "That test only works for sets of *two* vectors. Here the third vector is the *sum* of the first two."],
        ["indep-span", r`Yes — they span $\mathbb{R}^3$.`, "Spanning doesn't imply independence. A set can span and still contain a redundant vector."],
        ["cant", "It can't be decided without row reducing.", "A quick count settles it: more vectors than entries."],
      ],
      correct: "dep-count",
      hint: "A 3 × 4 matrix can have at most 3 pivots. What does that leave?",
      explanation: r`Putting the vectors as columns gives a $3 \times 4$ matrix with at most 3 pivots, so some column is free and the set is dependent. Here concretely $${vec(1, 1, 0)} = ${vec(1, 0, 0)} + ${vec(0, 1, 0)}$. General rule: **more vectors than entries ⟹ dependent.**`,
      tags: ["independence"],
    }),
    tf("zero-dependent", {
      statement: "Any set of vectors that contains the zero vector is linearly dependent.",
      answer: true,
      feedback: "Put weight 1 on the zero vector and 0 on everything else.",
      hint: r`Find weights, not all zero, with $x_1\mathbf{v}_1 + \cdots = \mathbf{0}$ when one $\mathbf{v}_i = \mathbf{0}$.`,
      explanation: r`True: $1\cdot\mathbf{0} + 0\cdot\mathbf{v}_2 + \cdots + 0\cdot\mathbf{v}_p = \mathbf{0}$ is a nontrivial dependence relation. (Even the one-element set $\{\mathbf{0}\}$ is dependent.)`,
      tags: ["independence"],
    }),
    mc("characterization", {
      question: r`Suppose $\{\mathbf{v}_1, \mathbf{v}_2, \mathbf{v}_3\}$ is linearly dependent. Which statement **must** be true?`,
      choices: [
        ["some", "At least one of the vectors is a linear combination of the others.", undefined],
        ["every", "Every one of the vectors is a linear combination of the others.", "Only the vectors with a nonzero weight in the dependence relation can be solved for. Try $\\{\\mathbf{e}_1, \\mathbf{e}_2, 2\\mathbf{e}_1\\}$: $\\mathbf{e}_2$ isn't a combination of the others."],
        ["v3", r`$\mathbf{v}_3$ is a linear combination of $\mathbf{v}_1$ and $\mathbf{v}_2$.`, "Not necessarily $\\mathbf{v}_3$ — the redundant vector could be $\\mathbf{v}_1$ (e.g. $\\mathbf{v}_1 = \\mathbf{0}$)."],
        ["multiples", "All three vectors are multiples of one another.", "That's much stronger than dependence. $\\{\\mathbf{e}_1, \\mathbf{e}_2, \\mathbf{e}_1 + \\mathbf{e}_2\\}$ is dependent with no two vectors parallel."],
      ],
      correct: "some",
      hint: r`Take a dependence relation $c_1\mathbf{v}_1 + c_2\mathbf{v}_2 + c_3\mathbf{v}_3 = \mathbf{0}$ with some $c_i \neq 0$ and solve for that $\mathbf{v}_i$.`,
      explanation: r`If $c_i \neq 0$ in a dependence relation, divide by $c_i$ to express $\mathbf{v}_i$ through the others. That's Lay's characterization theorem: dependent ⟺ **some** vector is a combination of the others. "Some", not "every", and not necessarily the last one.`,
      tags: ["independence", "theory"],
    }),
    numeric("dependence-relation", {
      body: r`The columns of $A = ${mat([
        [1, 2, 1],
        [0, 1, 3],
        [1, 3, 4],
      ])}$ are linearly dependent.`,
      question: r`Writing the third column as $c_1\mathbf{a}_1 + c_2\mathbf{a}_2$, what is $c_1$?`,
      answer: -5,
      prefix: "c_1 =",
      hint: r`Solve $c_1${vec(1, 0, 1)} + c_2${vec(2, 1, 3)} = ${vec(1, 3, 4)}$. The middle entries give $c_2$ immediately.`,
      explanation: r`Middle entries: $c_2 = 3$. Top entries: $c_1 + 2(3) = 1$, so $c_1 = -5$. Check the bottom: $-5 + 3\cdot 3 = 4$ ✓. So $\mathbf{a}_3 = -5\mathbf{a}_1 + 3\mathbf{a}_2$, equivalently $5\mathbf{a}_1 - 3\mathbf{a}_2 + \mathbf{a}_3 = \mathbf{0}$.`,
      tags: ["independence"],
    }),
    tf("4x5-independent", {
      statement: r`The columns of a $4 \times 5$ matrix can be linearly independent.`,
      answer: false,
      feedback: "How many pivots can 4 rows hold, and how many columns need one?",
      hint: "Independent columns need a pivot in every column.",
      explanation: r`False. Independence needs a pivot in each of the 5 columns, but 4 rows can hold at most 4 pivots. Five vectors in $\mathbb{R}^4$ are always dependent.`,
      tags: ["independence"],
    }),
    tf("trivial-independent", {
      statement: r`If $A\mathbf{x} = \mathbf{0}$ has only the trivial solution, then the columns of $A$ are linearly independent.`,
      answer: true,
      feedback: "This is the definition of independence, written with a matrix.",
      hint: r`$A\mathbf{x}$ is $x_1\mathbf{a}_1 + \cdots + x_n\mathbf{a}_n$. What does "only the trivial solution" say about those weights?`,
      explanation: r`True — it *is* the definition: $A\mathbf{x} = x_1\mathbf{a}_1 + \cdots + x_n\mathbf{a}_n = \mathbf{0}$ forcing all $x_i = 0$ is exactly linear independence of the columns.`,
      tags: ["independence"],
    }),
    reading(
      "summary",
      r`**What you did:** tested independence by definition, by the multiple test (two vectors), by counting (more vectors than entries), and by the pivot test.

**The two pivot facts of this unit, side by side:**

- Columns of $A$ **span** $\mathbb{R}^m$ ⟺ pivot in every **row** (existence for all $\mathbf{b}$).
- Columns of $A$ are **independent** ⟺ pivot in every **column** (uniqueness; only the trivial solution to $A\mathbf{x} = \mathbf{0}$).

Take the Level Check, then on to linear transformations.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit                                                                */
/* ------------------------------------------------------------------ */

export const unit2: Unit = {
  id: "u2",
  title: "Vectors and Ax = b",
  subtitle: "Span, the matrix equation, solution sets, independence",
  description: "Vectors as arrows and as columns, linear combinations and span, the matrix equation Ax = b, the geometry of solution sets, and linear independence.",
  textbook: "Lay §1.3–1.5, 1.7",
  lessons: [l1, l2, l3, l4, l5],
  practice: [
    matrix("p-lincomb", {
      question: r`Compute $2${vec(1, -3)} - 3${vec(2, 1)}$.`,
      answer: [[-4], [-9]],
      hint: "Scale, then subtract entrywise.",
      explanation: r`$${vec(2, -6)} - ${vec(6, 3)} = ${vec(-4, -9)}$.`,
      tags: ["vector-arithmetic"],
    }),
    mc("p-span-membership", {
      question: r`Is $${vec(2, 5, 7)}$ in $\operatorname{Span}\left\{${vec(1, 1, 2)}, ${vec(0, 1, 1)}\right\}$?`,
      choices: [
        ["yes", r`Yes: it equals $2${vec(1, 1, 2)} + 3${vec(0, 1, 1)}$.`],
        ["no", "No, the system is inconsistent.", "Try weights 2 and 3."],
      ],
      correct: "yes",
      hint: "The first entry fixes the first weight; the second entry then fixes the second. Check the third entry.",
      explanation: r`$x_1 = 2$, then $2 + x_2 = 5$ gives $x_2 = 3$, and the third entry checks: $2\cdot2 + 3\cdot1 = 7$ ✓.`,
      tags: ["span"],
    }),
    matrix("p-ax", {
      question: r`Compute $${mat([
        [1, 0, 2],
        [3, -1, 1],
      ])}${vec(2, 1, -1)}$.`,
      answer: [[0], [4]],
      hint: "Weight the columns by 2, 1, −1 and add.",
      explanation: r`$2${vec(1, 3)} + 1${vec(0, -1)} - 1${vec(2, 1)} = ${vec(0, 4)}$.`,
      tags: ["matrix-vector"],
    }),
    mc("p-existence", {
      question: r`$A$ is $4 \times 6$ with 4 pivot columns. Which is true?`,
      choices: [
        ["span", r`The columns of $A$ span $\mathbb{R}^4$.`],
        ["indep", r`The columns of $A$ are linearly independent.`, "Six columns, four pivots: two columns have no pivot."],
        ["unique", r`$A\mathbf{x} = \mathbf{b}$ has a unique solution for every $\mathbf{b}$.`, "Existence yes, uniqueness no — there are free variables."],
        ["none", r`$A\mathbf{x} = \mathbf{0}$ has only the trivial solution.`, "Free variables give nontrivial solutions."],
      ],
      correct: "span",
      hint: "Pivot in every row ⟺ columns span ℝ^m.",
      explanation: r`Four pivots in four rows means a pivot in every row, so the columns span $\mathbb{R}^4$. With six columns there are two free variables, so solutions are never unique.`,
      tags: ["existence"],
    }),
    numeric("p-free-vars", {
      question: r`$A$ is $3 \times 6$ and $A\mathbf{x} = \mathbf{0}$. What is the **minimum** number of free variables?`,
      answer: 3,
      hint: "At most one pivot per row.",
      explanation: r`At most 3 pivots, so at least $6 - 3 = 3$ free variables. (There could be more if some rows lack pivots.)`,
      tags: ["homogeneous"],
    }),
    matrix("p-parametric", {
      question: r`The reduced augmented matrix of $A\mathbf{x} = \mathbf{0}$ is $${aug([
        [1, -2, 0, 3, 0],
        [0, 0, 1, -1, 0],
      ])}$. Find the solution with $x_2 = 1$, $x_4 = 0$.`,
      answer: [[2], [1], [0], [0]],
      hint: r`$x_1 = 2x_2 - 3x_4$ and $x_3 = x_4$.`,
      explanation: r`With $x_2 = 1$, $x_4 = 0$: $x_1 = 2$, $x_3 = 0$, giving $${vec(2, 1, 0, 0)}$.`,
      tags: ["parametric-form"],
    }),
    numeric("p-h-independent", {
      question: r`For which $h$ is $\left\{${vec(2, 1, -1)}, ${vec("h", 2, -2)}\right\}$ linearly dependent?`,
      answer: 4,
      prefix: "h =",
      hint: "The second vector must be a multiple of the first — find the multiple from the last two entries.",
      explanation: r`Entries 2 and 3 show the multiple is $2$, so $h = 2\cdot 2 = 4$.`,
      tags: ["independence"],
    }),
    tf("p-tf-more-vectors", {
      statement: r`Any set of 5 vectors in $\mathbb{R}^3$ is linearly dependent.`,
      answer: true,
      hint: "More vectors than entries.",
      explanation: r`True: a $3 \times 5$ matrix has at most 3 pivots, so at least two columns are free.`,
      tags: ["independence"],
    }),
    tf("p-tf-span-indep", {
      statement: r`If the columns of $A$ span $\mathbb{R}^m$, then they are linearly independent.`,
      answer: false,
      hint: r`Try $A = \begin{bmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \end{bmatrix}$.`,
      explanation: r`False. $\begin{bmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \end{bmatrix}$ has columns spanning $\mathbb{R}^2$ (pivot in every row), but three vectors in $\mathbb{R}^2$ are dependent. Spanning is about rows; independence is about columns.`,
      tags: ["independence", "existence"],
    }),
    mc("p-solution-geometry", {
      question: r`$A\mathbf{x} = \mathbf{b}$ is consistent, $A$ is $3 \times 4$ with 2 pivot columns, and $\mathbf{b} \neq \mathbf{0}$. The solution set is a…`,
      choices: [
        ["plane-off", r`plane in $\mathbb{R}^4$ not through the origin.`],
        ["line-off", r`line in $\mathbb{R}^4$ not through the origin.`, "Count free variables: 4 − 2 = 2."],
        ["plane-origin", r`plane in $\mathbb{R}^4$ through the origin.`, "The origin solves only the homogeneous equation."],
        ["point", "single point.", "Two free variables give a two-parameter family."],
      ],
      correct: "plane-off",
      hint: "Free variables = 4 − 2. And is the zero vector a solution?",
      explanation: r`Two free variables give a two-dimensional solution set (a plane), shifted off the origin because $\mathbf{b} \neq \mathbf{0}$.`,
      tags: ["geometry"],
    }),
  ],
  generators: ["gen.lin-comb", "gen.in-span", "gen.independence-h", "gen.matrix-vector"],
};
