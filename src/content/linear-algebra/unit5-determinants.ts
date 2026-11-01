import type { Unit } from "../types";
import { goal, lesson, mat, mc, numeric, r, reading, tf, vec } from "../dsl";

/* ------------------------------------------------------------------ */
/* Lesson 1 · Introduction to determinants (Lay §3.1)                   */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "u5-l1-determinants",
    unitId: "u5",
    title: "Determinants",
    summary: "From ad − bc to cofactor expansion, and the shortcut for triangular matrices.",
    textbook: "Lay §3.1",
    minutes: 12,
  },
  [
    reading(
      "cofactor",
      r`For a $2 \times 2$ matrix, $\det ${mat([
        ["a", "b"],
        ["c", "d"],
      ])} = ad - bc$. For larger matrices the determinant is defined recursively by **cofactor expansion**. Let $A_{ij}$ be the submatrix obtained by deleting row $i$ and column $j$, and define the $(i, j)$-**cofactor**

$$C_{ij} = (-1)^{i+j}\det A_{ij}.$$

Then, expanding across the first row,

$$\det A = a_{11}C_{11} + a_{12}C_{12} + \cdots + a_{1n}C_{1n}.$$

Example: $\det ${mat([
        [2, 0, 1],
        [1, 3, 2],
        [1, 1, 2],
      ])} = 2\det${mat([
        [3, 2],
        [1, 2],
      ])} - 0\det${mat([
        [1, 2],
        [1, 2],
      ])} + 1\det${mat([
        [1, 3],
        [1, 1],
      ])} = 2(4) - 0 + (1 - 3) = 6.$

The signs $(-1)^{i+j}$ form a checkerboard: $+\,-\,+$ on the first row, $-\,+\,-$ on the second, and so on.`,
      { title: "Cofactor expansion" },
    ),
    numeric("det-3x3", {
      question: r`Compute $\det ${mat([
        [1, 2, 0],
        [3, 1, 1],
        [0, 2, 4],
      ])}$.`,
      answer: -22,
      hint: "Expand across row 1 — the third term vanishes because of the 0.",
      explanation: r`$1\cdot\det${mat([
        [1, 1],
        [2, 4],
      ])} - 2\cdot\det${mat([
        [3, 1],
        [0, 4],
      ])} + 0 = 1(4 - 2) - 2(12 - 0) = 2 - 24 = -22$.`,
      tags: ["determinant"],
    }),
    mc("best-line", {
      body: r`The determinant can be expanded across **any** row or down **any** column — the answer is always the same. So pick the line with the most zeros.`,
      question: r`For $A = ${mat([
        [1, 4, 2],
        [0, 0, 3],
        [5, 6, 0],
      ])}$, which expansion is shortest?`,
      choices: [
        ["row2", "Across row 2 — it has two zeros, so only one cofactor is needed.", undefined],
        ["row1", "Across row 1 — the first row is always best.", "Row 1 has no zeros here; you'd compute three cofactors."],
        ["col1", "Down column 1 — it has one zero.", "One zero saves one cofactor; row 2 saves two."],
        ["col3", "Down column 3 — it has one zero.", "Row 2 has more zeros than column 3."],
      ],
      correct: "row2",
      hint: "Count the zeros in each row and column.",
      explanation: r`Row 2 is $(0, 0, 3)$, so $\det A = 3\,C_{23}$ and nothing else. Always scan for the row or column with the most zeros before expanding.`,
      tags: ["determinant"],
    }),
    numeric("det-row2", {
      question: r`Compute that determinant: $\det ${mat([
        [1, 4, 2],
        [0, 0, 3],
        [5, 6, 0],
      ])}$.`,
      answer: 42,
      hint: r`$\det A = 3\,C_{23} = 3\cdot(-1)^{2+3}\det A_{23}$. Watch the sign.`,
      explanation: r`$C_{23} = (-1)^{5}\det${mat([
        [1, 4],
        [5, 6],
      ])} = -(6 - 20) = 14$, so $\det A = 3 \cdot 14 = 42$. The $(2, 3)$ position is a minus square on the checkerboard — forgetting it is the classic error.`,
      tags: ["determinant"],
    }),
    reading(
      "triangular",
      r`Expanding down the first column of a **triangular** matrix (all zeros above or all below the diagonal) peels off one diagonal entry at a time. The result:

> **The determinant of a triangular matrix is the product of its diagonal entries.**

In particular $\det I = 1$, and a triangular matrix with a $0$ on the diagonal has determinant $0$. This is why row reduction will turn out to be the practical way to compute determinants.`,
      { title: "Triangular matrices" },
    ),
    numeric("det-triangular", {
      question: r`Compute $\det ${mat([
        [2, 7, -1],
        [0, -3, 5],
        [0, 0, 4],
      ])}$.`,
      answer: -24,
      hint: "Upper triangular: multiply the diagonal.",
      explanation: r`$2 \cdot (-3) \cdot 4 = -24$. The entries above the diagonal never matter.`,
      tags: ["determinant"],
    }),
    mc("zero-row", {
      question: r`What is the determinant of a square matrix that has a row of zeros?`,
      choices: [
        ["zero", r`$0$`, undefined],
        ["one", r`$1$`, "Expand across the zero row: every term has a factor of 0."],
        ["depends", "It depends on the other rows.", "Expanding across the zero row kills every term regardless of the other rows."],
      ],
      correct: "zero",
      hint: "Expand across the row of zeros.",
      explanation: r`Expanding across the zero row gives $0\cdot C_{i1} + \cdots + 0\cdot C_{in} = 0$. (Same for a zero column.) This matches the Invertible Matrix Theorem: a zero row means fewer than $n$ pivots.`,
      tags: ["determinant"],
    }),
    numeric("cofactor-c23", {
      question: r`For $A = ${mat([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 10],
      ])}$, compute the cofactor $C_{23}$.`,
      answer: 6,
      hint: r`Delete row 2 and column 3, take the determinant, and apply the sign $(-1)^{2+3}$.`,
      explanation: r`$A_{23} = ${mat([
        [1, 2],
        [7, 8],
      ])}$ with determinant $8 - 14 = -6$, and $(-1)^{5} = -1$, so $C_{23} = 6$.`,
      tags: ["determinant"],
    }),
    tf("any-line", {
      statement: "The cofactor expansion of a determinant gives the same value whichever row or column you expand along.",
      answer: true,
      feedback: "This is the theorem that makes the zero-hunting strategy legitimate.",
      hint: "Lay's Theorem 1 in §3.1.",
      explanation: r`True. That's exactly what lets you choose the row or column with the most zeros. (It also means a matrix and its transpose have the same determinant — next lesson.)`,
      tags: ["determinant"],
    }),
    reading(
      "summary",
      r`**What you did:** expanded determinants by cofactors, chose the cheapest row or column, and used the triangular shortcut.

**Remember:** checkerboard signs, pick the line with the most zeros, and triangular ⟹ product of the diagonal.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Properties of determinants (Lay §3.2)                     */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "u5-l2-determinant-properties",
    unitId: "u5",
    title: "Properties of determinants",
    summary: "How row operations change the determinant, computing by row reduction, det(AB), and the determinant test for invertibility.",
    textbook: "Lay §3.2",
    minutes: 13,
  },
  [
    reading(
      "row-ops",
      r`Row operations change the determinant in a completely predictable way. If $B$ is obtained from $A$ by:

- a **replacement** $R_i \to R_i + cR_j$, then $\det B = \det A$;
- an **interchange** of two rows, then $\det B = -\det A$;
- **scaling** one row by $k$, then $\det B = k\det A$.

So you can compute $\det A$ by reducing to echelon form (which is triangular) while keeping a tally: each swap flips the sign, each scaling contributes a factor, replacements are free. Using only swaps and replacements,

$$\det A = (-1)^{\#\text{swaps}} \cdot (\text{product of the pivots}).$$`,
      { title: "Row operations and det" },
    ),
    numeric("swap-and-replace", {
      question: r`$\det A = 5$. $B$ is obtained from $A$ by swapping two rows and then adding $3$ times row 1 to row 2. What is $\det B$?`,
      answer: -5,
      hint: "The swap flips the sign; the replacement does nothing.",
      explanation: r`Swap: $5 \to -5$. Replacement: unchanged. $\det B = -5$.`,
      tags: ["determinant-properties"],
    }),
    numeric("scalar-multiple", {
      question: r`$A$ is $3 \times 3$ with $\det A = 4$. What is $\det(2A)$?`,
      answer: 32,
      hint: r`$2A$ scales **every** row by 2 — that's three scalings.`,
      explanation: r`Each of the 3 rows is scaled by $2$, contributing a factor of $2$ each: $\det(2A) = 2^3 \cdot 4 = 32$. In general $\det(kA) = k^n\det A$.`,
      tags: ["determinant-properties"],
    }),
    numeric("det-by-reduction", {
      question: r`Compute $\det ${mat([
        [1, 2, 3],
        [2, 4, 7],
        [0, 1, 1],
      ])}$ by row reduction (track your swaps).`,
      answer: -1,
      hint: r`$R_2 \to R_2 - 2R_1$ leaves $(0, 0, 1)$; then you'll need a swap to get echelon form.`,
      explanation: r`$R_2 \to R_2 - 2R_1$ gives $${mat([
        [1, 2, 3],
        [0, 0, 1],
        [0, 1, 1],
      ])}$ (no change to det). Swap $R_2 \leftrightarrow R_3$: $${mat([
        [1, 2, 3],
        [0, 1, 1],
        [0, 0, 1],
      ])}$ (sign flips). Triangular with diagonal product $1$, so $\det A = -1$. Cofactor check: $1(4 - 7) - 2(2 - 0) + 3(2 - 0) = -3 - 4 + 6 = -1$ ✓.`,
      tags: ["determinant-properties"],
    }),
    reading(
      "big-facts",
      r`Four facts that do most of the work in later chapters:

1. **Invertibility test:** $A$ is invertible ⟺ $\det A \neq 0$. (A new line in the Invertible Matrix Theorem.)
2. $\det A^T = \det A$ — so everything said about rows holds for columns too.
3. **Multiplicative:** $\det(AB) = (\det A)(\det B)$.
4. Consequently $\det(A^{-1}) = 1/\det A$ (since $\det A \cdot \det A^{-1} = \det I = 1$).

Warning: $\det(A + B)$ is **not** $\det A + \det B$ in general.`,
      { title: "The big four" },
    ),
    numeric("combine-facts", {
      question: r`$A$ and $B$ are $3 \times 3$ with $\det A = 2$ and $\det B = -3$. Compute $\det(A^2 B^T)$.`,
      answer: -12,
      hint: r`$\det(A^2B^T) = (\det A)^2 \det B^T$, and $\det B^T = \det B$.`,
      explanation: r`$\det(A^2B^T) = \det A \cdot \det A \cdot \det B^T = 2 \cdot 2 \cdot (-3) = -12$.`,
      tags: ["determinant-properties"],
    }),
    tf("det-zero-dependent", {
      statement: r`If $\det A = 0$, then the columns of $A$ are linearly dependent.`,
      answer: true,
      feedback: "det A = 0 means A is singular — then run through the Invertible Matrix Theorem.",
      hint: r`$\det A = 0$ ⟺ not invertible ⟺ ?`,
      explanation: r`True: $\det A = 0$ means $A$ is not invertible, and by the Invertible Matrix Theorem its columns are linearly dependent (and $A\mathbf{x} = \mathbf{0}$ has nontrivial solutions, and so on).`,
      tags: ["determinant-properties"],
    }),
    tf("det-sum", {
      statement: r`For all $n \times n$ matrices, $\det(A + B) = \det A + \det B$.`,
      answer: false,
      feedback: r`Try $A = B = I_2$.`,
      hint: r`$\det(I + I) = \det(2I) = ?$`,
      explanation: r`False. $\det(I_2 + I_2) = \det(2I_2) = 4$, but $\det I_2 + \det I_2 = 2$. Determinants are multiplicative, not additive.`,
      tags: ["determinant-properties"],
    }),
    reading(
      "geometry-preview",
      r`Here's the geometric meaning, which the next lesson makes precise: the transformation $\mathbf{x} \mapsto A\mathbf{x}$ scales **areas** by $|\det A|$, and $\det A < 0$ means it **flips orientation** (like a reflection). A determinant of $0$ means the plane is squashed onto a line or a point — information is lost, which is exactly why such matrices aren't invertible.

Move the sliders and watch the readout: the purple parallelogram is the image of the unit square and its area is $|\det A|$.`,
      {
        title: "Determinants are area factors",
        visual: {
          kind: "transform",
          config: {
            matrix: [
              [2, 1],
              [0, 1.5],
            ],
            sliders: true,
            showDet: true,
            shape: "square",
            range: 4,
          },
        },
      },
    ),
    numeric("singular-k", {
      question: r`For which value of $k$ is $${mat([
        [1, 2, "k"],
        [0, 1, 2],
        [1, 3, 1],
      ])}$ **singular**?`,
      answer: -1,
      prefix: "k =",
      hint: r`Compute the determinant as an expression in $k$ and set it to $0$.`,
      explanation: r`Expanding across row 1: $1(1\cdot1 - 2\cdot3) - 2(0\cdot1 - 2\cdot1) + k(0\cdot3 - 1\cdot1) = -5 + 4 - k = -1 - k$. Singular ⟺ $-1 - k = 0$ ⟺ $k = -1$.`,
      tags: ["determinant-properties"],
    }),
    reading(
      "summary",
      r`**What you did:** tracked determinants through row operations, computed by reduction, and used multiplicativity and the invertibility test.

**Remember:** swap → sign, scale → factor, replace → nothing; $\det(AB) = \det A\det B$; $\det A \neq 0$ ⟺ invertible.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Cramer's rule, area and volume (Lay §3.3)                  */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "u5-l3-cramer-area-volume",
    unitId: "u5",
    title: "Cramer's rule, area and volume",
    summary: "Solving with determinants, the adjugate formula for inverses, and determinants as area and volume scale factors.",
    textbook: "Lay §3.3",
    minutes: 13,
  },
  [
    reading(
      "cramer",
      r`**Cramer's rule.** If $A$ is an invertible $n \times n$ matrix, the unique solution of $A\mathbf{x} = \mathbf{b}$ has entries

$$x_i = \frac{\det A_i(\mathbf{b})}{\det A}, \qquad i = 1, \dots, n,$$

where $A_i(\mathbf{b})$ is $A$ with column $i$ replaced by $\mathbf{b}$.

Example: $2x_1 + x_2 = 5,\; x_1 + 3x_2 = 5$. Here $\det A = 6 - 1 = 5$, $\det A_1(\mathbf{b}) = \det${mat([
        [5, 1],
        [5, 3],
      ])} = 10$ and $\det A_2(\mathbf{b}) = \det${mat([
        [2, 5],
        [1, 5],
      ])} = 5$, so $x_1 = 2$, $x_2 = 1$.

It's a formula, not an algorithm — row reduction is faster for numbers, but Cramer's rule is what you reach for when the entries are symbols.`,
      { title: "Cramer's rule" },
    ),
    numeric("cramer-x2", {
      question: r`Use Cramer's rule on $3x_1 + 2x_2 = 7,\; x_1 - x_2 = -1$. What is $x_2$?`,
      answer: 2,
      prefix: "x_2 =",
      hint: r`$x_2 = \det A_2(\mathbf{b}) / \det A$ with $A_2(\mathbf{b}) = ${mat([
        [3, 7],
        [1, -1],
      ])}$.`,
      explanation: r`$\det A = -3 - 2 = -5$ and $\det A_2(\mathbf{b}) = -3 - 7 = -10$, so $x_2 = (-10)/(-5) = 2$. (Then $x_1 = \det${mat([
        [7, 2],
        [-1, -1],
      ])}/(-5) = (-5)/(-5) = 1$; check $3 + 4 = 7$ ✓.)`,
      tags: ["cramer"],
    }),
    reading(
      "adjugate",
      r`Cramer's rule applied to $A\mathbf{x} = \mathbf{e}_j$ for each $j$ yields a formula for the inverse:

$$A^{-1} = \frac{1}{\det A}\operatorname{adj} A,$$

where the **adjugate** $\operatorname{adj} A$ is the **transpose** of the matrix of cofactors $[C_{ij}]$. For $2 \times 2$ this is the familiar "swap, negate, divide". For $3 \times 3$ it's nine cofactors — fine for a single entry, slow for the whole matrix.`,
      { title: "The adjugate formula" },
    ),
    numeric("adjugate-entry", {
      question: r`For $A = ${mat([
        [1, 0, 2],
        [0, 1, 0],
        [1, 0, 3],
      ])}$ (which has $\det A = 1$), use the adjugate formula to find the $(1, 1)$ entry of $A^{-1}$.`,
      answer: 3,
      hint: r`The $(1,1)$ entry of $\operatorname{adj}A$ is $C_{11}$ (the transpose doesn't move diagonal entries).`,
      explanation: r`$C_{11} = \det${mat([
        [1, 0],
        [0, 3],
      ])} = 3$, and $\det A = 1$, so $(A^{-1})_{11} = 3$ — matching the inverse computed in Unit 4.`,
      tags: ["cramer"],
    }),
    reading(
      "area",
      r`**Geometry.** If $A$ is $2 \times 2$, the area of the parallelogram spanned by its columns is $|\det A|$. If $A$ is $3 \times 3$, the volume of the parallelepiped spanned by its columns is $|\det A|$.

And for the transformation $T(\mathbf{x}) = A\mathbf{x}$:

$$\text{area}\,T(S) = |\det A| \cdot \text{area}\,S$$

for any region $S$ of finite area (volume, in $\mathbb{R}^3$). A negative determinant means $T$ reverses orientation — a reflection is involved. Play with the sliders: the readout shows $\det A$, and the purple parallelogram is the image of the unit square.`,
      {
        title: "Area, volume, and what T does to them",
        visual: {
          kind: "transform",
          config: {
            matrix: [
              [1, 1],
              [-1, 1],
            ],
            sliders: true,
            showDet: true,
            shape: "square",
            range: 4,
          },
        },
      },
    ),
    numeric("parallelogram-area", {
      question: r`Find the area of the parallelogram with vertices $(0, 0)$, $(3, 1)$, $(1, 2)$ and $(4, 3)$.`,
      answer: 5,
      hint: r`The sides from the origin are $(3, 1)$ and $(1, 2)$. Put them in a matrix and take $|\det|$.`,
      explanation: r`$\left|\det${mat([
        [3, 1],
        [1, 2],
      ])}\right| = |6 - 1| = 5$. (The fourth vertex $(4, 3) = (3, 1) + (1, 2)$ confirms it's the parallelogram spanned by those two vectors.)`,
      tags: ["area"],
    }),
    numeric("volume", {
      question: r`Find the volume of the parallelepiped spanned by $${vec(1, 0, 0)}$, $${vec(1, 2, 0)}$ and $${vec(1, 1, 3)}$.`,
      answer: 6,
      hint: "Columns of a 3 × 3 matrix — notice it's triangular.",
      explanation: r`$\det${mat([
        [1, 1, 1],
        [0, 2, 1],
        [0, 0, 3],
      ])} = 1\cdot2\cdot3 = 6$, so the volume is $6$.`,
      tags: ["area"],
    }),
    numeric("area-scaling", {
      question: r`$T(\mathbf{x}) = ${mat([
        [2, 1],
        [1, -2],
      ])}\mathbf{x}$ is applied to a region of area $4$. What is the area of the image?`,
      answer: 20,
      hint: r`Area scales by $|\det A|$.`,
      explanation: r`$\det A = -4 - 1 = -5$, so areas are multiplied by $|{-5}| = 5$: the image has area $20$. The negative sign tells you $T$ also flips orientation.`,
      tags: ["area"],
    }),
    goal("det-minus-one", {
      question: r`Edit the entries to build a transformation that **preserves area but reverses orientation** — i.e. $\det A = -1$ — and watch what it does to the square.`,
      visual: {
        kind: "transform",
        config: {
          matrix: [
            [1, 0],
            [0, 1],
          ],
          editable: true,
          showDet: true,
          shape: "f",
          range: 3,
          goal: { type: "det-equals", target: -1, tolerance: 1e-9 },
        },
      },
      hint: r`You need $ad - bc = -1$. A reflection does it, but so do plenty of less obvious matrices like $${mat([
        [1, 2],
        [1, 1],
      ])}$.`,
      explanation: r`Any matrix with $ad - bc = -1$ works: $${mat([
        [1, 0],
        [0, -1],
      ])}$, $${mat([
        [0, 1],
        [1, 0],
      ])}$, $${mat([
        [1, 2],
        [1, 1],
      ])}$, … They all map the unit square to a parallelogram of area 1 while flipping it over — the letter F comes out mirrored.`,
      tags: ["area", "geometry"],
    }),
    tf("det-zero-area", {
      statement: r`If $T : \mathbb{R}^2 \to \mathbb{R}^2$ has standard matrix $A$ with $\det A = 0$, then $T$ sends every region to a set of area $0$.`,
      answer: true,
      feedback: "Area scales by |det A|.",
      hint: r`$\text{area}\,T(S) = |\det A|\cdot\text{area}\,S$.`,
      explanation: r`True: areas are multiplied by $|\det A| = 0$. Geometrically, $T$ collapses the plane onto a line (or a point), and lines have no area.`,
      tags: ["area"],
    }),
    reading(
      "summary",
      r`**What you did:** solved systems with Cramer's rule, extracted an inverse entry from the adjugate, and used determinants as area and volume factors.

**Remember:** $|\det A|$ = area/volume scale factor; sign = orientation. Take the Level Check — then on to abstract vector spaces, where the ideas from Units 1–2 get their proper names.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit                                                                */
/* ------------------------------------------------------------------ */

export const unit5: Unit = {
  id: "u5",
  title: "Determinants",
  subtitle: "Area, orientation and invertibility in one number",
  description: "Cofactor expansion, how row operations change the determinant, det(AB), Cramer's rule, and determinants as area and volume scale factors.",
  textbook: "Lay §3.1–3.3",
  lessons: [l1, l2, l3],
  practice: [
    numeric("p-det-2x2", {
      question: r`Compute $\det${mat([
        [4, -2],
        [3, 5],
      ])}$.`,
      answer: 26,
      hint: "ad − bc.",
      explanation: r`$4\cdot5 - (-2)\cdot3 = 20 + 6 = 26$.`,
      tags: ["determinant"],
    }),
    numeric("p-det-3x3", {
      question: r`Compute $\det${mat([
        [2, 0, 0],
        [1, 3, 0],
        [4, -1, 5],
      ])}$.`,
      answer: 30,
      hint: "Lower triangular.",
      explanation: r`Triangular: $2\cdot3\cdot5 = 30$.`,
      tags: ["determinant"],
    }),
    numeric("p-det-cofactor", {
      question: r`Compute $\det${mat([
        [0, 2, 1],
        [3, 0, 0],
        [1, 4, 2],
      ])}$.`,
      answer: 0,
      hint: "Row 2 has two zeros — expand there.",
      explanation: r`$\det A = 3\,C_{21} = 3\cdot(-1)^{3}\det${mat([
        [2, 1],
        [4, 2],
      ])} = -3(4 - 4) = 0$. The matrix is singular.`,
      tags: ["determinant"],
    }),
    numeric("p-row-op", {
      question: r`$\det A = -3$. $B$ is $A$ with its first row multiplied by $4$ and its second and third rows swapped. What is $\det B$?`,
      answer: 12,
      hint: "Scaling multiplies by 4; the swap flips the sign.",
      explanation: r`$-3 \cdot 4 = -12$, then the swap gives $12$.`,
      tags: ["determinant-properties"],
    }),
    numeric("p-det-product", {
      question: r`$A$ and $B$ are $4 \times 4$ with $\det A = 3$ and $\det B = 2$. Compute $\det(A^{-1}B^2)$. (Enter a fraction if needed.)`,
      answer: 4 / 3,
      hint: r`$\det(A^{-1}) = 1/\det A$.`,
      explanation: r`$\tfrac13 \cdot 2^2 = \tfrac43$.`,
      tags: ["determinant-properties"],
    }),
    numeric("p-cramer", {
      question: r`Use Cramer's rule to find $x_1$ in $2x_1 + 3x_2 = 8,\; x_1 + 2x_2 = 5$.`,
      answer: 1,
      prefix: "x_1 =",
      hint: "Replace column 1 by b.",
      explanation: r`$\det A = 4 - 3 = 1$, $\det A_1(\mathbf{b}) = 16 - 15 = 1$, so $x_1 = 1$ (and $x_2 = 2$).`,
      tags: ["cramer"],
    }),
    numeric("p-area", {
      question: r`Find the area of the parallelogram spanned by $(2, 5)$ and $(-1, 3)$.`,
      answer: 11,
      hint: "|ad − bc|.",
      explanation: r`$|2\cdot3 - 5\cdot(-1)| = |6 + 5| = 11$.`,
      tags: ["area"],
    }),
    tf("p-tf-invertible", {
      statement: r`If $\det A \neq 0$, then $A\mathbf{x} = \mathbf{b}$ has a unique solution for every $\mathbf{b}$.`,
      answer: true,
      hint: "Nonzero determinant means invertible.",
      explanation: r`True — $\det A \neq 0$ ⟺ invertible ⟺ unique solution for every $\mathbf{b}$.`,
      tags: ["determinant-properties"],
    }),
    tf("p-tf-transpose", {
      statement: r`$\det(A^T) = -\det A$ for every square matrix $A$.`,
      answer: false,
      hint: "Transposing doesn't change the determinant.",
      explanation: r`False: $\det A^T = \det A$.`,
      tags: ["determinant-properties"],
    }),
    mc("p-geometry", {
      question: r`$T(\mathbf{x}) = A\mathbf{x}$ with $\det A = -\tfrac12$. Then $T$…`,
      choices: [
        ["half-flip", "halves areas and reverses orientation."],
        ["double", "doubles areas.", "Areas scale by |det A| = 1/2."],
        ["half-keep", "halves areas and preserves orientation.", "A negative determinant reverses orientation."],
      ],
      correct: "half-flip",
      hint: "Magnitude for area, sign for orientation.",
      explanation: r`$|\det A| = \tfrac12$ halves areas; the negative sign flips orientation.`,
      tags: ["area"],
    }),
  ],
  generators: ["gen.det-3x3", "gen.det-properties"],
};
