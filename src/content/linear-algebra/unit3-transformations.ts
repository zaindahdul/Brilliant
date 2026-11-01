import type { Unit } from "../types";
import { goal, lesson, mat, matrix, mc, multi, numeric, r, reading, tf, vec } from "../dsl";

/* ------------------------------------------------------------------ */
/* Lesson 1 · Matrices as transformations (Lay §1.8)                    */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "u3-l1-matrices-as-transformations",
    unitId: "u3",
    title: "Matrices as transformations",
    summary: "A matrix is a function: it moves every vector of the plane at once. Domain, codomain, range, and what makes a map linear.",
    textbook: "Lay §1.8",
    minutes: 12,
  },
  [
    reading(
      "intro",
      r`So far $A\mathbf{x}$ was a computation. Now think of it as a **function**: an $m \times n$ matrix $A$ defines the **transformation**

$$T : \mathbb{R}^n \to \mathbb{R}^m, \qquad T(\mathbf{x}) = A\mathbf{x}.$$

$\mathbb{R}^n$ is the **domain**, $\mathbb{R}^m$ the **codomain**, $T(\mathbf{x})$ the **image** of $\mathbf{x}$, and the set of all images is the **range**.

The picture below shows $T(\mathbf{x}) = ${mat([
        [1, 1],
        [0, 1],
      ])}\mathbf{x}$ acting on the whole plane: the grey shape is the input, the purple one its image. Drag the **Apply** slider to morph from "do nothing" to the full transformation — every point moves at once, along straight paths, and grid lines stay straight and evenly spaced.`,
      {
        title: "A matrix moves the whole plane",
        visual: {
          kind: "transform",
          config: {
            matrix: [
              [1, 1],
              [0, 1],
            ],
            shape: "f",
            animate: true,
            showDet: false,
            range: 4,
          },
        },
      },
    ),
    matrix("compute-image", {
      body: r`Let $T(\mathbf{x}) = A\mathbf{x}$ with $A = ${mat([
        [1, -1],
        [2, 0],
        [0, 3],
      ])}$.`,
      question: r`Compute the image $T\!\left(${vec(2, 1)}\right)$.`,
      answer: [[1], [4], [3]],
      hint: r`$T(\mathbf{x}) = A\mathbf{x} = 2\,(\text{col }1) + 1\,(\text{col }2)$.`,
      explanation: r`$2${vec(1, 2, 0)} + 1${vec(-1, 0, 3)} = ${vec(1, 4, 3)}$. A vector with 2 entries went in; a vector with 3 entries came out.`,
      tags: ["transformations"],
    }),
    mc("domain-codomain", {
      question: r`For that same $T(\mathbf{x}) = A\mathbf{x}$ with $A$ a $3 \times 2$ matrix, what are the domain and codomain?`,
      choices: [
        ["r2r3", r`Domain $\mathbb{R}^2$, codomain $\mathbb{R}^3$.`, undefined],
        ["r3r2", r`Domain $\mathbb{R}^3$, codomain $\mathbb{R}^2$.`, "Backwards. $A\\mathbf{x}$ needs $\\mathbf{x}$ to have as many entries as $A$ has *columns*."],
        ["r3r3", r`Domain $\mathbb{R}^3$, codomain $\mathbb{R}^3$.`, "The input vectors have 2 entries (one per column of $A$)."],
        ["r2r2", r`Domain $\mathbb{R}^2$, codomain $\mathbb{R}^2$.`, "The output $A\\mathbf{x}$ is a combination of columns with 3 entries each."],
      ],
      correct: "r2r3",
      hint: "An m × n matrix eats vectors with n entries and produces vectors with m entries.",
      explanation: r`An $m \times n$ matrix defines $T : \mathbb{R}^n \to \mathbb{R}^m$ — here $\mathbb{R}^2 \to \mathbb{R}^3$. Columns count inputs, rows count outputs.`,
      tags: ["transformations"],
    }),
    matrix("preimage", {
      question: r`With the same $A = ${mat([
        [1, -1],
        [2, 0],
        [0, 3],
      ])}$, find an $\mathbf{x}$ whose image is $T(\mathbf{x}) = ${vec(3, 2, -6)}$.`,
      answer: [[1], [-2]],
      prefix: r`$\mathbf{x} =$`,
      hint: r`Solve $A\mathbf{x} = \mathbf{b}$: row 2 gives $2x_1 = 2$ right away.`,
      explanation: r`Row 2: $x_1 = 1$. Row 3: $3x_2 = -6$, so $x_2 = -2$. Row 1 checks: $1 - (-2) = 3$ ✓. So $\mathbf{x} = ${vec(1, -2)}$, and because $A$ has a pivot in each column it is the *only* such $\mathbf{x}$.`,
      tags: ["transformations"],
    }),
    mc("in-range", {
      question: r`Is $${vec(1, 2, 1)}$ in the **range** of that $T$?`,
      choices: [
        ["no", r`No — $A\mathbf{x} = ${vec(1, 2, 1)}$ is inconsistent.`, undefined],
        ["yes10", r`Yes, it is $T\!\left(${vec(1, 0)}\right)$.`, "$T(1, 0) = (1, 2, 0)$. Close, but the third entry is wrong."],
        ["yesall", r`Yes — every vector in $\mathbb{R}^3$ is in the range.`, "The range is only a plane inside $\\mathbb{R}^3$: two columns can't span three-dimensional space."],
        ["cant", "It can't be decided.", "Set up $A\\mathbf{x} = \\mathbf{b}$ and check consistency — that settles it."],
      ],
      correct: "no",
      hint: r`"In the range" means some $\mathbf{x}$ has $A\mathbf{x} = \mathbf{b}$. Rows 2 and 3 pin down $\mathbf{x}$; does row 1 agree?`,
      explanation: r`Row 2 forces $x_1 = 1$ and row 3 forces $x_2 = \tfrac13$; then row 1 would need $1 - \tfrac13 = 1$, which fails. The system is inconsistent, so the vector is not an image of anything. The range of a matrix transformation is the span of the columns of $A$ — here a plane in $\mathbb{R}^3$.`,
      tags: ["transformations", "range"],
    }),
    reading(
      "linear-def",
      r`Matrix transformations have two properties that make everything work. A transformation $T$ is **linear** if for all $\mathbf{u}, \mathbf{v}$ in its domain and all scalars $c$:

1. $T(\mathbf{u} + \mathbf{v}) = T(\mathbf{u}) + T(\mathbf{v})$
2. $T(c\mathbf{u}) = c\,T(\mathbf{u})$

Consequences you'll use constantly:

- $T(\mathbf{0}) = \mathbf{0}$ (take $c = 0$).
- **Superposition:** $T(c\mathbf{u} + d\mathbf{v}) = c\,T(\mathbf{u}) + d\,T(\mathbf{v})$, and likewise for longer combinations.

Every matrix transformation is linear, because $A(\mathbf{u} + \mathbf{v}) = A\mathbf{u} + A\mathbf{v}$ and $A(c\mathbf{u}) = cA\mathbf{u}$. The surprise in the next lesson: the converse holds too.`,
      { title: "What makes a transformation linear" },
    ),
    multi("which-linear", {
      question: r`Select **every** transformation $T : \mathbb{R}^2 \to \mathbb{R}^2$ that is linear.`,
      choices: [
        ["shift", r`$T(x_1, x_2) = (x_1 + 1,\; x_2)$`],
        ["lin1", r`$T(x_1, x_2) = (2x_1 - x_2,\; 3x_2)$`],
        ["square", r`$T(x_1, x_2) = (x_1^2,\; x_2)$`],
        ["rot", r`$T(x_1, x_2) = (x_2,\; -x_1)$`],
        ["abs", r`$T(x_1, x_2) = (|x_1|,\; x_2)$`],
      ],
      correct: ["lin1", "rot"],
      hint: r`Quick tests: does $T(\mathbf{0}) = \mathbf{0}$? Does doubling the input double the output? Do a square, an absolute value, or a "+1" survive those tests?`,
      explanation: r`$(x_1 + 1, x_2)$ sends $\mathbf{0}$ to $(1, 0) \neq \mathbf{0}$. $(x_1^2, x_2)$ fails scaling: $T(2, 0) = (4, 0) \neq 2T(1, 0) = (2, 0)$. $(|x_1|, x_2)$ fails too: $T(-1, 0) = (1, 0) \neq -T(1, 0)$. The other two are $\mathbf{x} \mapsto A\mathbf{x}$ with $A = ${mat([
        [2, -1],
        [0, 3],
      ])}$ and $A = ${mat([
        [0, 1],
        [-1, 0],
      ])}$ — linear.`,
      tags: ["linearity"],
    }),
    matrix("superposition", {
      body: r`$T$ is linear, with $T(\mathbf{u}) = ${vec(1, 2)}$ and $T(\mathbf{v}) = ${vec(3, -1)}$.`,
      question: r`Compute $T(2\mathbf{u} - \mathbf{v})$.`,
      answer: [[-1], [5]],
      hint: "Use superposition: push the 2 and the minus sign through T.",
      explanation: r`$T(2\mathbf{u} - \mathbf{v}) = 2T(\mathbf{u}) - T(\mathbf{v}) = 2${vec(1, 2)} - ${vec(3, -1)} = ${vec(-1, 5)}$. You never needed to know $\mathbf{u}$ or $\mathbf{v}$ themselves — linearity is that powerful.`,
      tags: ["linearity"],
    }),
    tf("t-zero", {
      statement: r`If $T$ is a linear transformation, then $T(\mathbf{0}) = \mathbf{0}$.`,
      answer: true,
      feedback: r`Apply the scaling property with $c = 0$.`,
      hint: r`$\mathbf{0} = 0 \cdot \mathbf{u}$ for any $\mathbf{u}$.`,
      explanation: r`True: $T(\mathbf{0}) = T(0\cdot\mathbf{u}) = 0\cdot T(\mathbf{u}) = \mathbf{0}$. This is the fastest way to show a transformation is **not** linear — but passing this test alone doesn't prove linearity.`,
      tags: ["linearity"],
    }),
    tf("injective-not-automatic", {
      statement: r`If $T : \mathbb{R}^2 \to \mathbb{R}^2$ is linear and $T(\mathbf{u}) = T(\mathbf{v})$, then $\mathbf{u} = \mathbf{v}$.`,
      answer: false,
      feedback: r`Think of a transformation that squashes the plane onto a line — many inputs share one output.`,
      hint: r`Try the projection $T(x_1, x_2) = (x_1, 0)$.`,
      explanation: r`False. The projection $T(x_1, x_2) = (x_1, 0)$ is linear, yet $T(1, 5) = T(1, -3) = (1, 0)$. Linear maps can collapse different inputs together; the ones that don't are called *one-to-one* (lesson 3).`,
      tags: ["linearity"],
    }),
    reading(
      "summary",
      r`**What you did:** treated $A\mathbf{x}$ as a function, computed images and preimages, decided range membership, and tested linearity.

**Remember:** linear ⟺ respects sums and scalar multiples. Then $T(\mathbf{0}) = \mathbf{0}$ and superposition $T(c\mathbf{u} + d\mathbf{v}) = cT(\mathbf{u}) + dT(\mathbf{v})$ come for free.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · The standard matrix (Lay §1.9)                            */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "u3-l2-standard-matrix",
    unitId: "u3",
    title: "The standard matrix",
    summary: "Every linear map is a matrix: its columns are where the basis vectors land. Rotations, reflections, shears and projections.",
    textbook: "Lay §1.9",
    minutes: 13,
  },
  [
    reading(
      "theorem",
      r`Here's the converse promised last lesson. If $T : \mathbb{R}^n \to \mathbb{R}^m$ is linear, then there is a unique matrix $A$ with $T(\mathbf{x}) = A\mathbf{x}$ for all $\mathbf{x}$, namely

$$A = [\,T(\mathbf{e}_1)\;\; T(\mathbf{e}_2)\;\cdots\; T(\mathbf{e}_n)\,],$$

the **standard matrix** of $T$. Why: any $\mathbf{x} = x_1\mathbf{e}_1 + \cdots + x_n\mathbf{e}_n$, so by superposition $T(\mathbf{x}) = x_1T(\mathbf{e}_1) + \cdots + x_nT(\mathbf{e}_n) = A\mathbf{x}$.

So a linear map is completely determined by what it does to $\mathbf{e}_1, \dots, \mathbf{e}_n$. In the picture, the blue and orange arrows are $T(\mathbf{e}_1)$ and $T(\mathbf{e}_2)$ — read them off and you have the matrix.`,
      {
        title: "Columns are the images of e₁, e₂",
        visual: {
          kind: "transform",
          config: {
            matrix: [
              [2, 1],
              [0, 1],
            ],
            shape: "square",
            showDet: false,
            range: 4,
          },
        },
      },
    ),
    matrix("from-images", {
      question: r`A linear $T : \mathbb{R}^2 \to \mathbb{R}^2$ has $T(\mathbf{e}_1) = ${vec(3, 1)}$ and $T(\mathbf{e}_2) = ${vec(-2, 4)}$. Find its standard matrix.`,
      answer: [
        [3, -2],
        [1, 4],
      ],
      hint: "The images of e₁ and e₂ become the columns, in that order.",
      explanation: r`$A = [\,T(\mathbf{e}_1)\ \ T(\mathbf{e}_2)\,] = ${mat([
        [3, -2],
        [1, 4],
      ])}$. The first *column* is $T(\mathbf{e}_1)$ — not the first row.`,
      tags: ["standard-matrix"],
    }),
    matrix("from-formula", {
      question: r`Find the standard matrix of $T(x_1, x_2) = (x_1 + 2x_2,\; 3x_1 - x_2)$.`,
      answer: [
        [1, 2],
        [3, -1],
      ],
      hint: r`Compute $T(1, 0)$ and $T(0, 1)$, or read the coefficients of $x_1$ and $x_2$ row by row.`,
      explanation: r`$T(\mathbf{e}_1) = T(1, 0) = (1, 3)$ and $T(\mathbf{e}_2) = T(0, 1) = (2, -1)$, so $A = ${mat([
        [1, 2],
        [3, -1],
      ])}$. Equivalently, row $i$ of $A$ holds the coefficients in the $i$-th output formula.`,
      tags: ["standard-matrix"],
    }),
    reading(
      "geometry",
      r`Geometric transformations of the plane are easy to encode: just track where $\mathbf{e}_1 = (1, 0)$ and $\mathbf{e}_2 = (0, 1)$ go.

- **Rotation** counter-clockwise by $\theta$: $\mathbf{e}_1 \mapsto (\cos\theta, \sin\theta)$, $\mathbf{e}_2 \mapsto (-\sin\theta, \cos\theta)$, so $A = ${mat([
        ["\\cos\\theta", "-\\sin\\theta"],
        ["\\sin\\theta", "\\cos\\theta"],
      ])}$.
- **Reflection** across the $x_1$-axis: $A = ${mat([
        [1, 0],
        [0, -1],
      ])}$. Across the line $x_2 = x_1$: $A = ${mat([
        [0, 1],
        [1, 0],
      ])}$.
- **Horizontal shear** $A = ${mat([
        [1, "k"],
        [0, 1],
      ])}$: $\mathbf{e}_1$ stays put, $\mathbf{e}_2$ slides to $(k, 1)$.
- **Projection** onto the $x_1$-axis: $A = ${mat([
        [1, 0],
        [0, 0],
      ])}$.
- **Scaling** by $k$: $A = ${mat([
        ["k", 0],
        [0, "k"],
      ])}$.

You don't memorise these — you derive each one in two seconds from the basis vectors.`,
      { title: "Geometric transformations" },
    ),
    goal("rotate-90", {
      question: r`Edit the entries so that $T$ rotates the plane $90^\circ$ **counter-clockwise**. Ask yourself where $\mathbf{e}_1$ and $\mathbf{e}_2$ must land.`,
      visual: {
        kind: "transform",
        config: {
          matrix: [
            [1, 0],
            [0, 1],
          ],
          editable: true,
          shape: "f",
          showDet: false,
          range: 3,
          goal: {
            type: "matrix-equals",
            target: [
              [0, -1],
              [1, 0],
            ],
          },
        },
      },
      hint: r`Rotating $(1, 0)$ by $90^\circ$ counter-clockwise gives $(0, 1)$; rotating $(0, 1)$ gives $(-1, 0)$. Those are the columns.`,
      explanation: r`$T(\mathbf{e}_1) = (0, 1)$ and $T(\mathbf{e}_2) = (-1, 0)$, so $A = ${mat([
        [0, -1],
        [1, 0],
      ])}$ — the rotation formula with $\theta = 90^\circ$ ($\cos = 0$, $\sin = 1$).`,
      tags: ["standard-matrix", "geometry"],
    }),
    goal("shear", {
      question: r`Now make a **shear** that leaves $\mathbf{e}_1$ fixed and sends $\mathbf{e}_2$ to $(1, 1)$.`,
      visual: {
        kind: "transform",
        config: {
          matrix: [
            [1, 0],
            [0, 1],
          ],
          editable: true,
          shape: "f",
          showDet: false,
          range: 3,
          goal: {
            type: "matrix-equals",
            target: [
              [1, 1],
              [0, 1],
            ],
          },
        },
      },
      hint: "Column 1 must stay (1, 0). Column 2 is where e₂ goes.",
      explanation: r`$A = [\,T(\mathbf{e}_1)\ T(\mathbf{e}_2)\,] = ${mat([
        [1, 1],
        [0, 1],
      ])}$. Horizontal lines stay horizontal; everything slides sideways in proportion to its height.`,
      tags: ["standard-matrix", "geometry"],
    }),
    matrix("reflect-y", {
      question: r`Find the standard matrix of the reflection across the $x_2$-axis (the vertical axis).`,
      answer: [
        [-1, 0],
        [0, 1],
      ],
      hint: "Reflecting across the vertical axis flips the first coordinate and keeps the second.",
      explanation: r`$\mathbf{e}_1 = (1, 0) \mapsto (-1, 0)$ and $\mathbf{e}_2 = (0, 1) \mapsto (0, 1)$, so $A = ${mat([
        [-1, 0],
        [0, 1],
      ])}$.`,
      tags: ["standard-matrix", "geometry"],
    }),
    matrix("rotate-180", {
      question: r`Find the standard matrix of rotation by $180^\circ$.`,
      answer: [
        [-1, 0],
        [0, -1],
      ],
      hint: r`$\cos 180^\circ = -1$, $\sin 180^\circ = 0$ — or just picture where $\mathbf{e}_1$ and $\mathbf{e}_2$ end up.`,
      explanation: r`Both basis vectors reverse: $A = ${mat([
        [-1, 0],
        [0, -1],
      ])} = -I$. Rotation by $180^\circ$ is the same as reflecting through the origin.`,
      tags: ["standard-matrix", "geometry"],
    }),
    mc("identify-swap", {
      question: r`Which transformation has standard matrix $${mat([
        [0, 1],
        [1, 0],
      ])}$?`,
      choices: [
        ["refl-diag", r`Reflection across the line $x_2 = x_1$.`, undefined],
        ["rot90", r`Rotation by $90^\circ$.`, "Rotation by $90^\\circ$ sends $\\mathbf{e}_1$ to $(0, 1)$ but $\\mathbf{e}_2$ to $(-1, 0)$, not $(1, 0)$."],
        ["refl-x", r`Reflection across the $x_1$-axis.`, "That reflection keeps $\\mathbf{e}_1$ fixed. This matrix moves it."],
        ["proj", r`Projection onto the line $x_2 = x_1$.`, "A projection flattens the plane; this matrix just swaps coordinates."],
      ],
      correct: "refl-diag",
      hint: r`The matrix sends $(x_1, x_2)$ to $(x_2, x_1)$. Which geometric move swaps the coordinates?`,
      explanation: r`$\mathbf{e}_1 \mapsto (0, 1)$ and $\mathbf{e}_2 \mapsto (1, 0)$: the two basis vectors trade places, which is exactly reflection across the diagonal line $x_2 = x_1$. Points on that line are fixed.`,
      tags: ["standard-matrix", "geometry"],
    }),
    numeric("rotate-60", {
      question: r`What is the $(1, 1)$ entry (top-left) of the standard matrix for rotation by $60^\circ$ counter-clockwise?`,
      answer: 0.5,
      hint: r`The top-left entry of a rotation matrix is $\cos\theta$.`,
      explanation: r`$\cos 60^\circ = \tfrac12$. The full matrix is $${mat([
        ["1/2", "-\\sqrt{3}/2"],
        ["\\sqrt{3}/2", "1/2"],
      ])}$.`,
      tags: ["standard-matrix", "geometry"],
    }),
    matrix("two-steps", {
      question: r`$T$ first reflects across the $x_1$-axis, **then** rotates $90^\circ$ counter-clockwise. Find the standard matrix of $T$ by tracking $\mathbf{e}_1$ and $\mathbf{e}_2$ through both steps.`,
      answer: [
        [0, 1],
        [1, 0],
      ],
      hint: r`$\mathbf{e}_1$: reflect → $(1, 0)$, rotate → ? $\quad \mathbf{e}_2$: reflect → $(0, -1)$, rotate → ?`,
      explanation: r`$\mathbf{e}_1 \to (1, 0) \to (0, 1)$ and $\mathbf{e}_2 \to (0, -1) \to (1, 0)$, so $A = ${mat([
        [0, 1],
        [1, 0],
      ])}$ — the two moves together equal a reflection across $x_2 = x_1$. (In Unit 4 you'll see this as a matrix *product*.)`,
      tags: ["standard-matrix", "geometry"],
    }),
    reading(
      "summary",
      r`**What you did:** built standard matrices from images of basis vectors and from formulas, and encoded rotations, reflections, shears and compositions.

**Remember:** $A = [\,T(\mathbf{e}_1) \cdots T(\mathbf{e}_n)\,]$. To find any geometric matrix, ask only: *where do $\mathbf{e}_1$ and $\mathbf{e}_2$ go?*`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · One-to-one and onto (Lay §1.9)                            */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "u3-l3-one-to-one-onto",
    unitId: "u3",
    title: "One-to-one and onto",
    summary: "Two questions about a linear map — does it hit everything, and does it ever collide? — and their pivot tests.",
    textbook: "Lay §1.9",
    minutes: 12,
  },
  [
    reading(
      "defs",
      r`Two independent questions about a map $T : \mathbb{R}^n \to \mathbb{R}^m$:

- $T$ is **onto** $\mathbb{R}^m$ if every $\mathbf{b}$ in $\mathbb{R}^m$ is the image of **at least one** $\mathbf{x}$. (The range is the whole codomain — $T$ "hits everything".)
- $T$ is **one-to-one** if every $\mathbf{b}$ is the image of **at most one** $\mathbf{x}$. (Different inputs never collide.)

These are the *existence* and *uniqueness* questions from Unit 1 in disguise: onto is about solving $A\mathbf{x} = \mathbf{b}$ for every $\mathbf{b}$; one-to-one is about solutions being unique.`,
      { title: "Hitting everything vs. never colliding" },
    ),
    reading(
      "tests",
      r`For a linear $T$ with standard matrix $A$ ($m \times n$):

- $T$ is **one-to-one** ⟺ $T(\mathbf{x}) = \mathbf{0}$ has only the trivial solution ⟺ the columns of $A$ are **linearly independent** ⟺ $A$ has a pivot in **every column**.
- $T$ is **onto** $\mathbb{R}^m$ ⟺ the columns of $A$ **span** $\mathbb{R}^m$ ⟺ $A$ has a pivot in **every row**.

So one row reduction answers both questions: count the pivots and compare with the number of columns (one-to-one) and the number of rows (onto).`,
      { title: "The pivot tests" },
    ),
    mc("2x3", {
      question: r`$T : \mathbb{R}^3 \to \mathbb{R}^2$ has a $2 \times 3$ standard matrix with 2 pivot columns. Then $T$ is…`,
      choices: [
        ["onto", "onto but not one-to-one.", undefined],
        ["one", "one-to-one but not onto.", "Three columns, two pivots: one column is free, so two different inputs can share an image."],
        ["both", "both one-to-one and onto.", "Check columns: 3 columns need 3 pivots for one-to-one, but a 2-row matrix holds at most 2."],
        ["neither", "neither.", "Two pivots in two rows means a pivot in every row."],
      ],
      correct: "onto",
      hint: "Pivot in every row? (2 of 2 — yes.) Pivot in every column? (2 of 3 — no.)",
      explanation: r`Pivots in both rows ⟹ columns span $\mathbb{R}^2$ ⟹ onto. Only 2 pivots for 3 columns ⟹ a free variable ⟹ $T(\mathbf{x}) = \mathbf{0}$ has nontrivial solutions ⟹ not one-to-one. Squeezing $\mathbb{R}^3$ into $\mathbb{R}^2$ always costs collisions.`,
      tags: ["one-to-one-onto"],
    }),
    mc("3x2", {
      question: r`$T : \mathbb{R}^2 \to \mathbb{R}^3$ has a $3 \times 2$ standard matrix with 2 pivot columns. Then $T$ is…`,
      choices: [
        ["one", "one-to-one but not onto.", undefined],
        ["onto", "onto but not one-to-one.", "Three rows but only two pivots: some row has no pivot, so some $\\mathbf{b}$ is unreachable."],
        ["both", "both.", "Two columns can never span $\\mathbb{R}^3$."],
        ["neither", "neither.", "Two pivots in two columns is a pivot in every column — that's one-to-one."],
      ],
      correct: "one",
      hint: "Pivot in every column? Pivot in every row?",
      explanation: r`Pivot in every column ⟹ independent columns ⟹ one-to-one. But 2 pivots for 3 rows ⟹ the columns span only a plane in $\mathbb{R}^3$ ⟹ not onto. A map from a smaller space into a bigger one can be one-to-one but never onto.`,
      tags: ["one-to-one-onto"],
    }),
    mc("3x3", {
      question: r`$T : \mathbb{R}^3 \to \mathbb{R}^3$ has a standard matrix with 3 pivots. Then $T$ is…`,
      choices: [
        ["both", "both one-to-one and onto.", undefined],
        ["one", "one-to-one but not onto.", "Three pivots in three rows is a pivot in every row."],
        ["onto", "onto but not one-to-one.", "Three pivots in three columns is a pivot in every column."],
        ["neither", "neither.", "Three pivots is the maximum — every row and every column has one."],
      ],
      correct: "both",
      hint: "Three pivots, three rows, three columns.",
      explanation: r`Pivot in every row (onto) and in every column (one-to-one). For square matrices the two properties always come together — one of the many equivalences in the Invertible Matrix Theorem (Unit 4).`,
      tags: ["one-to-one-onto"],
    }),
    mc("r4-to-r3", {
      question: r`Can a linear transformation $T : \mathbb{R}^4 \to \mathbb{R}^3$ be one-to-one?`,
      choices: [
        ["never", "No, never.", undefined],
        ["sometimes", "Yes, if its standard matrix has 3 pivots.", "Three pivots leaves the fourth column without one — a free variable, hence collisions."],
        ["always", "Yes, always.", "Four columns in a 3-row matrix can't all have pivots."],
        ["ifonto", "Only if it is also onto.", "Onto is possible here; one-to-one is not. The two are independent questions."],
      ],
      correct: "never",
      hint: "One-to-one needs a pivot in every one of the 4 columns. How many rows are there?",
      explanation: r`A $3 \times 4$ matrix has at most 3 pivots, so one of its 4 columns is free and $T(\mathbf{x}) = \mathbf{0}$ has nontrivial solutions. In general $T : \mathbb{R}^n \to \mathbb{R}^m$ can be one-to-one only if $n \le m$.`,
      tags: ["one-to-one-onto"],
    }),
    mc("r2-to-r4", {
      question: r`Can a linear transformation $T : \mathbb{R}^2 \to \mathbb{R}^4$ be onto $\mathbb{R}^4$?`,
      choices: [
        ["never", "No, never.", undefined],
        ["sometimes", "Yes, if the columns are independent.", "Independence gives one-to-one. Onto needs a pivot in each of the 4 rows, but there are only 2 columns."],
        ["always", "Yes, always.", "Two vectors span at most a plane inside $\\mathbb{R}^4$."],
      ],
      correct: "never",
      hint: "Onto needs a pivot in every row. How many pivots can 2 columns provide?",
      explanation: r`At most 2 pivots for 4 rows, so the columns span at most a 2-dimensional piece of $\mathbb{R}^4$. $T : \mathbb{R}^n \to \mathbb{R}^m$ can be onto only if $n \ge m$.`,
      tags: ["one-to-one-onto"],
    }),
    numeric("5x5-pivots", {
      question: r`$T : \mathbb{R}^5 \to \mathbb{R}^5$ is one-to-one. How many pivot columns does its standard matrix have?`,
      answer: 5,
      hint: "One-to-one ⟺ pivot in every column.",
      explanation: r`All 5 columns need a pivot, so there are 5 pivots — which also puts a pivot in every row, so $T$ is onto as well.`,
      tags: ["one-to-one-onto"],
    }),
    mc("projection", {
      question: r`The projection $T(x_1, x_2) = (x_1, 0)$ onto the $x_1$-axis, with standard matrix $${mat([
        [1, 0],
        [0, 0],
      ])}$, is…`,
      choices: [
        ["neither", "neither one-to-one nor onto.", undefined],
        ["one", "one-to-one but not onto.", "$T(0, 1) = T(0, 7) = (0, 0)$ — a collision."],
        ["onto", "onto but not one-to-one.", "Nothing maps to $(0, 1)$: the second output coordinate is always $0$."],
        ["both", "both.", "The matrix has only one pivot."],
      ],
      correct: "neither",
      hint: "One pivot, two rows, two columns.",
      explanation: r`One pivot: column 2 has none (not one-to-one — the whole $x_2$-axis maps to $\mathbf{0}$) and row 2 has none (not onto — the range is just the $x_1$-axis).`,
      tags: ["one-to-one-onto"],
    }),
    mc("sum-diff", {
      question: r`$T(x_1, x_2) = (x_1 + x_2,\; x_1 - x_2)$. Then $T$ is…`,
      choices: [
        ["both", "both one-to-one and onto.", undefined],
        ["one", "one-to-one but not onto.", "Row reduce the standard matrix — it has two pivots, so every row has one."],
        ["onto", "onto but not one-to-one.", "Two pivots means every column has one."],
        ["neither", "neither.", "Are the columns $(1, 1)$ and $(1, -1)$ parallel? They aren't."],
      ],
      correct: "both",
      hint: r`The standard matrix is $${mat([
        [1, 1],
        [1, -1],
      ])}$. Count its pivots.`,
      explanation: r`$${mat([
        [1, 1],
        [1, -1],
      ])} \sim ${mat([
        [1, 1],
        [0, -2],
      ])}$ has 2 pivots: pivot in every column (one-to-one) and every row (onto). Indeed you can always recover $x_1 = \tfrac{b_1 + b_2}{2}$, $x_2 = \tfrac{b_1 - b_2}{2}$.`,
      tags: ["one-to-one-onto"],
    }),
    tf("one-to-one-n-le-m", {
      statement: r`If $T : \mathbb{R}^n \to \mathbb{R}^m$ is linear and one-to-one, then $n \le m$.`,
      answer: true,
      feedback: "One-to-one needs a pivot in each of n columns, and pivots live in distinct rows.",
      hint: "How many pivots can an m × n matrix have?",
      explanation: r`True. One-to-one requires $n$ pivots (one per column), and there are at most $m$ (one per row), so $n \le m$. The domain can't be bigger than the codomain.`,
      tags: ["one-to-one-onto"],
    }),
    tf("onto-implies-one-to-one", {
      statement: "A linear transformation that is onto is also one-to-one.",
      answer: false,
      feedback: r`Think of a $2 \times 3$ matrix with two pivots.`,
      hint: "Onto is about rows; one-to-one is about columns. Can rows all have pivots while a column doesn't?",
      explanation: r`False. $T : \mathbb{R}^3 \to \mathbb{R}^2$ with matrix $${mat([
        [1, 0, 0],
        [0, 1, 0],
      ])}$ is onto (pivot in every row) but not one-to-one (column 3 is free). The two properties coincide only for square matrices.`,
      tags: ["one-to-one-onto"],
    }),
    reading(
      "summary",
      r`**What you did:** classified linear maps as one-to-one, onto, both or neither using pivot counts.

**Remember:**

- one-to-one ⟺ pivot in every **column** ⟺ independent columns ⟺ only the trivial solution to $T(\mathbf{x}) = \mathbf{0}$;
- onto ⟺ pivot in every **row** ⟺ columns span $\mathbb{R}^m$.

Take the Level Check, then on to matrix algebra, where composing transformations becomes multiplying matrices.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit                                                                */
/* ------------------------------------------------------------------ */

export const unit3: Unit = {
  id: "u3",
  title: "Linear transformations",
  subtitle: "Matrices as functions of the plane",
  description: "Matrices as transformations of the plane, the standard matrix, rotations, shears and reflections, and the one-to-one / onto questions.",
  textbook: "Lay §1.8–1.9",
  lessons: [l1, l2, l3],
  practice: [
    matrix("p-image", {
      question: r`$T(\mathbf{x}) = ${mat([
        [2, 0],
        [1, -1],
        [0, 3],
      ])}\mathbf{x}$. Compute $T\!\left(${vec(1, 2)}\right)$.`,
      answer: [[2], [-1], [6]],
      hint: "Weight the columns by 1 and 2.",
      explanation: r`$1${vec(2, 1, 0)} + 2${vec(0, -1, 3)} = ${vec(2, -1, 6)}$.`,
      tags: ["transformations"],
    }),
    matrix("p-standard-matrix", {
      question: r`Find the standard matrix of $T(x_1, x_2, x_3) = (x_1 - x_3,\; 2x_2 + x_3)$.`,
      answer: [
        [1, 0, -1],
        [0, 2, 1],
      ],
      hint: "Row i holds the coefficients of the i-th output; columns are T(e₁), T(e₂), T(e₃).",
      explanation: r`$T(\mathbf{e}_1) = (1, 0)$, $T(\mathbf{e}_2) = (0, 2)$, $T(\mathbf{e}_3) = (-1, 1)$, giving $${mat([
        [1, 0, -1],
        [0, 2, 1],
      ])}$.`,
      tags: ["standard-matrix"],
    }),
    matrix("p-reflection", {
      question: r`Find the standard matrix of the reflection across the $x_1$-axis.`,
      answer: [
        [1, 0],
        [0, -1],
      ],
      hint: "The first coordinate stays, the second flips sign.",
      explanation: r`$\mathbf{e}_1 \mapsto \mathbf{e}_1$, $\mathbf{e}_2 \mapsto -\mathbf{e}_2$.`,
      tags: ["geometry"],
    }),
    mc("p-linear", {
      question: r`Which transformation is **not** linear?`,
      choices: [
        ["notlin", r`$T(x_1, x_2) = (x_1 x_2,\; x_1)$`],
        ["lin1", r`$T(x_1, x_2) = (x_2,\; x_1 + x_2)$`, "Each output is a linear expression in the inputs — this one is linear."],
        ["lin2", r`$T(x_1, x_2) = (0,\; 4x_1)$`, "Linear: it's $\\mathbf{x} \\mapsto A\\mathbf{x}$ with $A = \\begin{bmatrix}0&0\\\\4&0\\end{bmatrix}$."],
        ["lin3", r`$T(x_1, x_2) = (-x_1,\; -x_2)$`, "Linear: multiplication by $-I$."],
      ],
      correct: "notlin",
      hint: "Products of coordinates break the scaling rule.",
      explanation: r`$T(2, 2) = (4, 2)$ but $2T(1, 1) = (2, 2)$, so $(x_1x_2, x_1)$ is not linear. The others are matrix transformations.`,
      tags: ["linearity"],
    }),
    mc("p-onto", {
      question: r`$T : \mathbb{R}^4 \to \mathbb{R}^3$ has a standard matrix with 3 pivots. Then $T$ is…`,
      choices: [
        ["onto", "onto but not one-to-one."],
        ["one", "one-to-one but not onto.", "Four columns, three pivots."],
        ["both", "both.", "Four columns can't all have pivots in a 3-row matrix."],
        ["neither", "neither.", "Three pivots in three rows is a pivot in every row."],
      ],
      correct: "onto",
      hint: "Compare pivots with rows (onto) and with columns (one-to-one).",
      explanation: r`Pivot in every row ⟹ onto; a column without a pivot ⟹ not one-to-one.`,
      tags: ["one-to-one-onto"],
    }),
    tf("p-tf-one-to-one", {
      statement: r`If the columns of the standard matrix of $T$ are linearly independent, then $T$ is one-to-one.`,
      answer: true,
      hint: "Independent columns ⟺ only the trivial solution to Ax = 0.",
      explanation: r`True — that's the one-to-one criterion.`,
      tags: ["one-to-one-onto"],
    }),
    tf("p-tf-zero", {
      statement: r`A transformation with $T(\mathbf{0}) = \mathbf{0}$ must be linear.`,
      answer: false,
      hint: r`Try $T(x_1, x_2) = (x_1^2, 0)$.`,
      explanation: r`False. $T(x_1, x_2) = (x_1^2, 0)$ sends $\mathbf{0}$ to $\mathbf{0}$ but fails $T(2\mathbf{u}) = 2T(\mathbf{u})$. Mapping zero to zero is necessary for linearity, not sufficient.`,
      tags: ["linearity"],
    }),
    matrix("p-superposition", {
      question: r`$T$ is linear with $T(\mathbf{u}) = ${vec(2, 0)}$ and $T(\mathbf{v}) = ${vec(-1, 3)}$. Find $T(\mathbf{u} + 3\mathbf{v})$.`,
      answer: [[-1], [9]],
      hint: "Superposition.",
      explanation: r`$T(\mathbf{u}) + 3T(\mathbf{v}) = ${vec(2, 0)} + ${vec(-3, 9)} = ${vec(-1, 9)}$.`,
      tags: ["linearity"],
    }),
    mc("p-range", {
      question: r`The range of $T(\mathbf{x}) = ${mat([
        [1, 2],
        [2, 4],
      ])}\mathbf{x}$ is…`,
      choices: [
        ["line", r`the line through $\mathbf{0}$ and $(1, 2)$.`],
        ["plane", r`all of $\mathbb{R}^2$.`, "The two columns are parallel, so their span is a line."],
        ["point", "just the origin.", "The columns are nonzero, so the range contains more than $\\mathbf{0}$."],
      ],
      correct: "line",
      hint: "The range is the span of the columns.",
      explanation: r`The columns $(1, 2)$ and $(2, 4)$ are parallel, so their span — the range — is the line through $(1, 2)$.`,
      tags: ["range"],
    }),
    numeric("p-rotation-entry", {
      question: r`What is the $(2, 1)$ entry (bottom-left) of the standard matrix for rotation by $90^\circ$ counter-clockwise?`,
      answer: 1,
      hint: r`Bottom-left is $\sin\theta$.`,
      explanation: r`$\sin 90^\circ = 1$; the matrix is $${mat([
        [0, -1],
        [1, 0],
      ])}$.`,
      tags: ["geometry"],
    }),
  ],
  generators: ["gen.standard-matrix", "gen.onto-one-to-one"],
};
