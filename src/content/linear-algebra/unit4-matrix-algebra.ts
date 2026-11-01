import type { Unit } from "../types";
import { goal, lesson, mat, matrix, mc, multi, numeric, r, reading, tf, vec } from "../dsl";

/* ------------------------------------------------------------------ */
/* Lesson 1 · Matrix operations (Lay §2.1)                              */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "u4-l1-matrix-operations",
    unitId: "u4",
    title: "Matrix operations",
    summary: "Sums, scalar multiples, the product AB as composition of transformations, transposes — and the rules that do not carry over from numbers.",
    textbook: "Lay §2.1",
    minutes: 13,
  },
  [
    reading(
      "basics",
      r`Write $a_{ij}$ for the entry in row $i$, column $j$ of $A$. Matrices of the **same size** are added entrywise, and $cA$ scales every entry. The **diagonal entries** are $a_{11}, a_{22}, \dots$; a **diagonal matrix** has zeros everywhere else; $I_n$ is the identity.

The interesting operation is the **product**. If $A$ is $m \times n$ and $B$ is $n \times p$ with columns $\mathbf{b}_1, \dots, \mathbf{b}_p$, then

$$AB = [\,A\mathbf{b}_1 \;\; A\mathbf{b}_2 \;\cdots\; A\mathbf{b}_p\,] \qquad (m \times p).$$

Each column of $AB$ is $A$ times the corresponding column of $B$. The **row–column rule** says the same thing entry by entry: $(AB)_{ij}$ is row $i$ of $A$ dotted with column $j$ of $B$.

**Why this definition?** If $S(\mathbf{x}) = B\mathbf{x}$ and $T(\mathbf{y}) = A\mathbf{y}$, then doing $S$ first and $T$ second gives $T(S(\mathbf{x})) = A(B\mathbf{x}) = (AB)\mathbf{x}$. Matrix multiplication **is** composition of transformations — which is also why the inner dimensions must match.`,
      { title: "The product AB" },
    ),
    matrix("compute-ab", {
      question: r`Compute $AB$ for $A = ${mat([
        [1, 2],
        [0, -1],
      ])}$ and $B = ${mat([
        [3, 1],
        [2, 0],
      ])}$.`,
      answer: [
        [7, 1],
        [-2, 0],
      ],
      hint: r`Column 1 of $AB$ is $A${vec(3, 2)}$; column 2 is $A${vec(1, 0)}$.`,
      explanation: r`$A${vec(3, 2)} = ${vec(7, -2)}$ and $A${vec(1, 0)} = ${vec(1, 0)}$, so $AB = ${mat([
        [7, 1],
        [-2, 0],
      ])}$. Row–column check: $(AB)_{11} = 1\cdot3 + 2\cdot2 = 7$ ✓.`,
      tags: ["matrix-multiplication"],
    }),
    matrix("compute-ba", {
      question: r`Now compute $BA$ for the same matrices.`,
      answer: [
        [3, 5],
        [2, 4],
      ],
      hint: r`Columns of $BA$ are $B$ times the columns of $A$: $B${vec(1, 0)}$ and $B${vec(2, -1)}$.`,
      explanation: r`$B${vec(1, 0)} = ${vec(3, 2)}$ and $B${vec(2, -1)} = ${vec(5, 4)}$, so $BA = ${mat([
        [3, 5],
        [2, 4],
      ])}$ — not equal to $AB$. Order matters, because doing $T$ then $S$ is a different transformation from $S$ then $T$.`,
      tags: ["matrix-multiplication"],
    }),
    mc("sizes", {
      question: r`$A$ is $3 \times 4$ and $B$ is $4 \times 2$. Which is true?`,
      choices: [
        ["ab32", r`$AB$ is defined and is $3 \times 2$; $BA$ is not defined.`, undefined],
        ["both", r`Both $AB$ and $BA$ are defined.`, "$BA$ would need the 2 columns of $B$ to match the 3 rows of $A$."],
        ["ab42", r`$AB$ is $4 \times 2$.`, "The product has as many rows as $A$ (3) and as many columns as $B$ (2)."],
        ["neither", "Neither product is defined.", "The inner dimensions of $AB$ — 4 and 4 — match."],
      ],
      correct: "ab32",
      hint: "(m × n)(n × p) = m × p. The inner numbers must agree.",
      explanation: r`$(3 \times 4)(4 \times 2) = 3 \times 2$ ✓. For $BA$ the inner dimensions would be $2$ and $3$, so it isn't defined. In transformation terms, $B : \mathbb{R}^2 \to \mathbb{R}^4$ and $A : \mathbb{R}^4 \to \mathbb{R}^3$: applying $B$ and then $A$ makes sense (that's $AB$), but applying $A$ and then $B$ would feed vectors from $\mathbb{R}^3$ into a map that expects $\mathbb{R}^2$.`,
      tags: ["matrix-multiplication"],
    }),
    reading(
      "rules",
      r`Properties that **do** hold (sizes permitting): $A(BC) = (AB)C$, $A(B + C) = AB + AC$, $(B + C)A = BA + CA$, $r(AB) = (rA)B = A(rB)$, $I_mA = A = AI_n$.

Three familiar rules for numbers that **fail** for matrices:

- **Commutativity:** in general $AB \neq BA$.
- **Cancellation:** $AB = AC$ does **not** imply $B = C$.
- **Zero products:** $AB = 0$ does **not** imply $A = 0$ or $B = 0$.

The **transpose** $A^T$ swaps rows and columns. Key rule: $(AB)^T = B^T A^T$ — the order reverses.`,
      { title: "Algebra that works, and algebra that doesn't" },
    ),
    mc("always-true", {
      question: "Which identity is **always** true (whenever the products are defined)?",
      choices: [
        ["rev", r`$(AB)^T = B^T A^T$`, undefined],
        ["same", r`$(AB)^T = A^T B^T$`, "The order must reverse. Check sizes: if $A$ is $2\\times3$ and $B$ is $3\\times1$, then $A^TB^T$ isn't even defined."],
        ["comm", r`$AB = BA$`, "You computed a counterexample two steps ago."],
        ["binomial", r`$(A + B)^2 = A^2 + 2AB + B^2$`, "Expanding gives $A^2 + AB + BA + B^2$, and $AB + BA \\neq 2AB$ in general."],
      ],
      correct: "rev",
      hint: "Think about which rule is sensitive to the order of multiplication.",
      explanation: r`$(AB)^T = B^TA^T$ is the one that always holds. The binomial formula needs $AB = BA$, which usually fails.`,
      tags: ["matrix-algebra"],
    }),
    matrix("transpose", {
      question: r`Find $A^T$ for $A = ${mat([
        [1, 2, 3],
        [4, 5, 6],
      ])}$.`,
      answer: [
        [1, 4],
        [2, 5],
        [3, 6],
      ],
      hint: "Rows become columns: the answer is 3 × 2.",
      explanation: r`Row 1 of $A$ becomes column 1 of $A^T$: $${mat([
        [1, 4],
        [2, 5],
        [3, 6],
      ])}$.`,
      tags: ["transpose"],
    }),
    numeric("shear-power", {
      body: r`Let $A = ${mat([
        [1, 1],
        [0, 1],
      ])}$, the shear from Unit 3. Compute $A^2$ and $A^3$ by hand and look for the pattern.`,
      question: r`What is the $(1, 2)$ entry of $A^5$?`,
      answer: 5,
      hint: r`$A^2 = ${mat([
        [1, 2],
        [0, 1],
      ])}$. What does each extra factor of $A$ do to the top-right entry?`,
      explanation: r`$A^k = ${mat([
        [1, "k"],
        [0, 1],
      ])}$: shearing five times by 1 is shearing once by 5. So the $(1, 2)$ entry of $A^5$ is $5$. (Powers $A^k$ mean "apply the transformation $k$ times".)`,
      tags: ["matrix-powers"],
    }),
    tf("cancellation", {
      statement: r`If $AB = AC$ and $A \neq 0$, then $B = C$.`,
      answer: false,
      feedback: r`Try $A = ${mat([
        [1, 0],
        [0, 0],
      ])}$ with $B$ and $C$ differing only in their bottom row.`,
      hint: r`$A$ could wipe out part of $B$ — e.g. a projection kills whatever is in the second row.`,
      explanation: r`False. With $A = ${mat([
        [1, 0],
        [0, 0],
      ])}$, $B = ${mat([
        [1, 1],
        [0, 0],
      ])}$, $C = ${mat([
        [1, 1],
        [5, 5],
      ])}$ we get $AB = AC = ${mat([
        [1, 1],
        [0, 0],
      ])}$ but $B \neq C$. Cancellation works only when $A$ is *invertible* (next lesson).`,
      tags: ["matrix-algebra"],
    }),
    matrix("swap-squared", {
      question: r`Let $A = ${mat([
        [0, 1],
        [1, 0],
      ])}$ (reflection across the line $x_2 = x_1$). Compute $A^2$.`,
      answer: [
        [1, 0],
        [0, 1],
      ],
      hint: "Reflecting twice brings every point back. What matrix does nothing?",
      explanation: r`$A^2 = ${mat([
        [0, 1],
        [1, 0],
      ])}${mat([
        [0, 1],
        [1, 0],
      ])} = ${mat([
        [1, 0],
        [0, 1],
      ])} = I$. Any reflection is its own inverse.`,
      tags: ["matrix-powers"],
    }),
    reading(
      "summary",
      r`**What you did:** multiplied matrices as "A times each column of B", saw $AB \neq BA$, transposed, and found a counterexample to cancellation.

**Remember:** $AB$ is composition — $B$ first, then $A$. Keep the order; reverse it under a transpose.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Inverses (Lay §2.2)                                       */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "u4-l2-inverses",
    unitId: "u4",
    title: "The inverse of a matrix",
    summary: "Undoing a transformation: the 2×2 formula, the [A | I] algorithm, and the rules for inverses of products and transposes.",
    textbook: "Lay §2.2",
    minutes: 14,
  },
  [
    reading(
      "def",
      r`An $n \times n$ matrix $A$ is **invertible** if there is a matrix $C$ with

$$CA = I \quad\text{and}\quad AC = I.$$

Such a $C$ is unique, written $A^{-1}$. A matrix that is not invertible is **singular**. Geometrically, $A^{-1}$ is the transformation that undoes $A$.

For $2 \times 2$ matrices there is a formula: if $A = ${mat([
        ["a", "b"],
        ["c", "d"],
      ])}$ and $ad - bc \neq 0$, then

$$A^{-1} = \frac{1}{ad - bc}${mat([
        ["d", "-b"],
        ["-c", "a"],
      ])}.$$

If $ad - bc = 0$, $A$ is not invertible. The number $ad - bc$ is the **determinant** of $A$ — Unit 5 is all about it.

If $A$ is invertible, then for every $\mathbf{b}$ the equation $A\mathbf{x} = \mathbf{b}$ has the **unique** solution $\mathbf{x} = A^{-1}\mathbf{b}$.`,
      { title: "Undoing a matrix" },
    ),
    matrix("inverse-2x2", {
      question: r`Find $A^{-1}$ for $A = ${mat([
        [2, 5],
        [1, 3],
      ])}$.`,
      answer: [
        [3, -5],
        [-1, 2],
      ],
      prefix: r`$A^{-1} =$`,
      hint: "Swap the diagonal entries, negate the off-diagonal entries, divide by ad − bc.",
      explanation: r`$ad - bc = 6 - 5 = 1$, so $A^{-1} = \tfrac11${mat([
        [3, -5],
        [-1, 2],
      ])}$. Check: $${mat([
        [2, 5],
        [1, 3],
      ])}${mat([
        [3, -5],
        [-1, 2],
      ])} = ${mat([
        [1, 0],
        [0, 1],
      ])}$ ✓.`,
      tags: ["inverse"],
    }),
    mc("singular", {
      question: r`Is $${mat([
        [2, 4],
        [1, 2],
      ])}$ invertible?`,
      choices: [
        ["no", r`No — $ad - bc = 0$.`, undefined],
        ["yes", r`Yes — its inverse is $\tfrac{1}{8}${mat([
          [2, -4],
          [-1, 2],
        ])}$.`, "Compute $ad - bc = 2\\cdot2 - 4\\cdot1$ first."],
        ["yes2", "Yes — every matrix with nonzero entries is invertible.", "Invertibility depends on $ad - bc$, not on entries being nonzero."],
      ],
      correct: "no",
      hint: r`$ad - bc = 2\cdot 2 - 4\cdot 1$.`,
      explanation: r`$ad - bc = 4 - 4 = 0$, so the formula divides by zero: not invertible. Notice the columns are parallel ($(4, 2) = 2(2, 1)$) — the transformation squashes the plane onto a line and can't be undone.`,
      tags: ["inverse"],
    }),
    matrix("solve-with-inverse", {
      question: r`Use $A^{-1} = ${mat([
        [3, -5],
        [-1, 2],
      ])}$ to solve $${mat([
        [2, 5],
        [1, 3],
      ])}\mathbf{x} = ${vec(1, 1)}$.`,
      answer: [[-2], [1]],
      prefix: r`$\mathbf{x} =$`,
      hint: r`$\mathbf{x} = A^{-1}\mathbf{b}$.`,
      explanation: r`$\mathbf{x} = ${mat([
        [3, -5],
        [-1, 2],
      ])}${vec(1, 1)} = ${vec(-2, 1)}$. Check: $2(-2) + 5(1) = 1$ ✓, $-2 + 3 = 1$ ✓. (For a single system, row reduction is usually faster; $A^{-1}$ shines when you solve for many different $\mathbf{b}$.)`,
      tags: ["inverse"],
    }),
    reading(
      "algorithm",
      r`For larger matrices, use row reduction. Row reduce the augmented matrix $[\,A \mid I\,]$:

- if $A$ is row equivalent to $I$, the reduction ends at $[\,I \mid A^{-1}\,]$ — the inverse appears on the right;
- otherwise $A$ is not invertible (you'll hit a zero row on the left).

Why it works: each row operation is multiplication by an **elementary matrix** $E$. Reducing $A$ to $I$ means $E_k \cdots E_1 A = I$, so $A^{-1} = E_k \cdots E_1$, and applying those same operations to $I$ builds exactly that product.

Rules worth memorising:

- $(A^{-1})^{-1} = A$
- $(AB)^{-1} = B^{-1}A^{-1}$ — the order reverses, like the transpose
- $(A^T)^{-1} = (A^{-1})^T$`,
      { title: "The [A | I] algorithm" },
    ),
    goal("reduce-ai", {
      question: r`Row reduce $[\,A \mid I\,]$ for $A = ${mat([
        [1, 2],
        [1, 3],
      ])}$ all the way to reduced echelon form. The right half will be $A^{-1}$.`,
      visual: {
        kind: "row-reducer",
        config: {
          matrix: [
            [1, 2, 1, 0],
            [1, 3, 0, 1],
          ],
          augmented: true,
          rightColumns: 2,
          target: "rref",
        },
      },
      hint: r`Start with $R_2 \to R_2 - R_1$, then clear the $2$ above the new pivot.`,
      explanation: r`$R_2 \to R_2 - R_1$ gives $\left[\begin{array}{cc|cc}1&2&1&0\\0&1&-1&1\end{array}\right]$; then $R_1 \to R_1 - 2R_2$ gives $\left[\begin{array}{cc|cc}1&0&3&-2\\0&1&-1&1\end{array}\right]$. So $A^{-1} = ${mat([
        [3, -2],
        [-1, 1],
      ])}$, which matches the $2\times2$ formula ($ad - bc = 1$).`,
      tags: ["inverse"],
    }),
    matrix("read-off", {
      question: r`Read off $A^{-1}$ from the reduction you just did.`,
      answer: [
        [3, -2],
        [-1, 1],
      ],
      prefix: r`$A^{-1} =$`,
      hint: "The right half of [I | A⁻¹].",
      explanation: r`$A^{-1} = ${mat([
        [3, -2],
        [-1, 1],
      ])}$. Check with the formula: $\tfrac{1}{3 - 2}${mat([
        [3, -2],
        [-1, 1],
      ])}$ ✓.`,
      tags: ["inverse"],
    }),
    matrix("inverse-3x3", {
      question: r`Find the inverse of $A = ${mat([
        [1, 0, 2],
        [0, 1, 0],
        [1, 0, 3],
      ])}$ (row reduce $[A \mid I]$).`,
      answer: [
        [3, 0, -2],
        [0, 1, 0],
        [-1, 0, 1],
      ],
      prefix: r`$A^{-1} =$`,
      hint: r`Row 2 is already $\mathbf{e}_2$, so only rows 1 and 3 interact: $R_3 \to R_3 - R_1$ gives a pivot of $1$ in column 3, then clear the $2$ above it.`,
      explanation: r`$R_3 \to R_3 - R_1$: left side becomes $${mat([
        [1, 0, 2],
        [0, 1, 0],
        [0, 0, 1],
      ])}$, right side $${mat([
        [1, 0, 0],
        [0, 1, 0],
        [-1, 0, 1],
      ])}$. Then $R_1 \to R_1 - 2R_3$ gives $I$ on the left and $A^{-1} = ${mat([
        [3, 0, -2],
        [0, 1, 0],
        [-1, 0, 1],
      ])}$ on the right. Check: $AA^{-1}$ row 1: $(1, 0, 2)\cdot(3, 0, -1) = 1$, $(1,0,2)\cdot(-2, 0, 1) = 0$ ✓.`,
      tags: ["inverse"],
    }),
    mc("inverse-of-product", {
      question: r`If $A$ and $B$ are invertible $n \times n$ matrices, then $(AB)^{-1}$ equals…`,
      choices: [
        ["rev", r`$B^{-1}A^{-1}$`, undefined],
        ["same", r`$A^{-1}B^{-1}$`, "Check: $(AB)(A^{-1}B^{-1}) = ABA^{-1}B^{-1}$, which is not $I$ unless $A$ and $B$ commute."],
        ["prod", r`$A^{-1}B^{-1}$ or $B^{-1}A^{-1}$ — they're equal.`, "Inverses don't commute in general either."],
        ["none", r`$AB$ might not be invertible.`, "A product of invertible matrices is always invertible."],
      ],
      correct: "rev",
      hint: r`To undo "B then A", you must undo A first, then B. Verify: $(AB)(B^{-1}A^{-1}) = A(BB^{-1})A^{-1}$.`,
      explanation: r`$(AB)(B^{-1}A^{-1}) = A(BB^{-1})A^{-1} = AA^{-1} = I$. Undoing a composition means undoing the last step first — socks and shoes.`,
      tags: ["inverse"],
    }),
    tf("unique-solution", {
      statement: r`If $A$ is invertible, then $A\mathbf{x} = \mathbf{b}$ has exactly one solution for every $\mathbf{b}$.`,
      answer: true,
      feedback: r`Multiply both sides by $A^{-1}$.`,
      hint: r`What does $A^{-1}$ do to both sides of $A\mathbf{x} = \mathbf{b}$?`,
      explanation: r`True: $\mathbf{x} = A^{-1}\mathbf{b}$ is a solution, and any solution must equal $A^{-1}A\mathbf{x} = A^{-1}\mathbf{b}$, so it's the only one.`,
      tags: ["inverse"],
    }),
    tf("sum-invertible", {
      statement: r`If $A$ and $B$ are invertible $n \times n$ matrices, then $A + B$ is invertible.`,
      answer: false,
      feedback: r`Try $B = -A$.`,
      hint: r`What is $I + (-I)$?`,
      explanation: r`False. $I$ and $-I$ are both invertible, but $I + (-I) = 0$ is not. Products of invertible matrices are invertible; sums need not be.`,
      tags: ["inverse"],
    }),
    reading(
      "summary",
      r`**What you did:** inverted $2\times2$ matrices by formula, ran the $[A \mid I]$ algorithm by hand, and used inverses to solve systems.

**Remember:** $(AB)^{-1} = B^{-1}A^{-1}$; $A$ invertible ⟺ $A \sim I$ ⟺ $ad - bc \neq 0$ (for $2\times2$). Next: the theorem that connects invertibility to everything in Units 1–3.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · The Invertible Matrix Theorem (Lay §2.3)                  */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "u4-l3-invertible-matrix-theorem",
    unitId: "u4",
    title: "The Invertible Matrix Theorem",
    summary: "One square matrix, a dozen equivalent statements. Learn to move between them instantly.",
    textbook: "Lay §2.3",
    minutes: 14,
  },
  [
    reading(
      "theorem",
      r`For a **square** $n \times n$ matrix $A$, the following are all equivalent — all true or all false:

1. $A$ is invertible.
2. $A$ is row equivalent to $I_n$.
3. $A$ has $n$ pivot positions.
4. $A\mathbf{x} = \mathbf{0}$ has only the trivial solution.
5. The columns of $A$ are linearly independent.
6. $\mathbf{x} \mapsto A\mathbf{x}$ is one-to-one.
7. $A\mathbf{x} = \mathbf{b}$ has at least one solution for each $\mathbf{b}$ in $\mathbb{R}^n$.
8. The columns of $A$ span $\mathbb{R}^n$.
9. $\mathbf{x} \mapsto A\mathbf{x}$ is onto $\mathbb{R}^n$.
10. There is a matrix $C$ with $CA = I$.
11. There is a matrix $D$ with $AD = I$.
12. $A^T$ is invertible.

Two things to notice. Statements 4–6 are the *uniqueness* cluster (pivot in every column) and 7–9 are the *existence* cluster (pivot in every row); for a square matrix, $n$ pivots gives both at once, which is why they collapse together. And it is **square only** — for a $3 \times 4$ matrix, independence and spanning are different questions.`,
      { title: "Twelve ways to say the same thing" },
    ),
    mc("span-implies", {
      question: r`$A$ is $4 \times 4$ and its columns span $\mathbb{R}^4$. Which can you conclude?`,
      choices: [
        ["all", r`$A$ is invertible, its columns are linearly independent, and $A\mathbf{x} = \mathbf{0}$ has only the trivial solution.`, undefined],
        ["maybe", r`$A$ might or might not be invertible — spanning says nothing about uniqueness.`, "For a *square* matrix it does: spanning means 4 pivots, which also fills every column."],
        ["fewer", r`$A$ has fewer than 4 pivots.`, "Spanning $\\mathbb{R}^4$ needs a pivot in every one of the 4 rows."],
        ["dep", r`The columns of $A$ are linearly dependent.`, "Four pivots in four columns means independent."],
      ],
      correct: "all",
      hint: "Spanning ℝ⁴ gives a pivot in every row. For a 4 × 4 matrix, how many pivots is that, and what else do they fill?",
      explanation: r`Spanning puts a pivot in each of the 4 rows, i.e. 4 pivots, which for a $4 \times 4$ matrix is statement 3 of the theorem — and then every other statement follows: invertible, independent columns, only the trivial solution.`,
      tags: ["imt"],
    }),
    mc("nontrivial-false", {
      question: r`$A$ is $3 \times 3$ and $A\mathbf{x} = \mathbf{0}$ has a nontrivial solution. Which statement is **false**?`,
      choices: [
        ["every-b", r`$A\mathbf{x} = \mathbf{b}$ has a solution for every $\mathbf{b}$ in $\mathbb{R}^3$.`, undefined],
        ["not-inv", r`$A$ is not invertible.`, "That one is true — statement 4 of the theorem fails, so all of them fail."],
        ["dep", r`The columns of $A$ are linearly dependent.`, "True: a nontrivial solution of $A\\mathbf{x} = \\mathbf{0}$ is a dependence relation among the columns."],
        ["zero-row", r`$A$ is row equivalent to a matrix with a row of zeros.`, "True: fewer than 3 pivots in a 3-row matrix leaves a zero row in echelon form."],
      ],
      correct: "every-b",
      hint: "A nontrivial solution means statement 4 fails. Since all twelve statements stand or fall together, which option claims one of them is true?",
      explanation: r`A nontrivial solution means fewer than 3 pivots, so $A$ is singular and **every** statement of the theorem is false — including "solvable for every $\mathbf{b}$". The other three options are correct descriptions of a singular matrix.`,
      tags: ["imt"],
    }),
    mc("one-sided-inverse", {
      question: r`$A$ is $5 \times 5$ and there is a matrix $C$ with $CA = I_5$. Which is true?`,
      choices: [
        ["inv", r`$A$ is invertible, $AC = I_5$ too, and $C = A^{-1}$.`, undefined],
        ["left-only", r`$C$ is a left inverse but $AC$ might not equal $I_5$.`, "For square matrices a one-sided inverse is automatically two-sided — statement 10 of the theorem."],
        ["cant", "Nothing — invertibility needs both $CA = I$ and $AC = I$.", "The theorem says a single one-sided inverse already forces invertibility when $A$ is square."],
      ],
      correct: "inv",
      hint: "Look at statement 10 in the list.",
      explanation: r`Statement 10 ($CA = I$ for some $C$) is equivalent to invertibility, so $A^{-1}$ exists; then $C = C(AA^{-1}) = (CA)A^{-1} = A^{-1}$, and hence $AC = I$ as well.`,
      tags: ["imt"],
    }),
    mc("by-inspection", {
      question: r`Without row reducing, decide: is $${mat([
        [1, 2, 0],
        [2, 4, 1],
        [3, 6, 1],
      ])}$ invertible?`,
      choices: [
        ["no", "No — column 2 is twice column 1, so the columns are dependent.", undefined],
        ["yes", "Yes — it has no zero rows or columns.", "Having no zero row isn't enough. Compare the first two columns."],
        ["yes-det", "Yes — a 3 × 3 matrix with nonzero diagonal is invertible.", "The diagonal says nothing by itself. Look at the columns."],
      ],
      correct: "no",
      hint: "Compare the columns pairwise. Is one a multiple of another?",
      explanation: r`$${vec(2, 4, 6)} = 2${vec(1, 2, 3)}$, so the columns are linearly dependent (statement 5 fails) and $A$ is singular. Spotting a dependence is often faster than reducing.`,
      tags: ["imt"],
    }),
    mc("ab-equals-i", {
      question: r`$A$ and $B$ are $n \times n$ and $AB = I$. Then $BA$ equals…`,
      choices: [
        ["i", r`$I$`, undefined],
        ["unknown", "it can't be determined.", "Use the theorem: $AB = I$ makes $A$ invertible (statement 11), so $B = A^{-1}$."],
        ["zero", r`$0$`, "If $BA = 0$ then $A = (AB)A = A(BA) = 0$, contradicting $AB = I$."],
      ],
      correct: "i",
      hint: r`$AB = I$ is statement 11, so $A$ is invertible. What must $B$ be?`,
      explanation: r`Since $AB = I$, $A$ is invertible, and $B = A^{-1}(AB) = A^{-1}$. Therefore $BA = A^{-1}A = I$. For square matrices, one-sided inverses are two-sided.`,
      tags: ["imt"],
    }),
    tf("transpose-invertible", {
      statement: r`If $A$ is invertible, then $A^T$ is invertible.`,
      answer: true,
      feedback: r`Transpose both sides of $AA^{-1} = I$.`,
      hint: r`$(AA^{-1})^T = (A^{-1})^TA^T$.`,
      explanation: r`True: $(A^{-1})^TA^T = (AA^{-1})^T = I^T = I$, so $(A^T)^{-1} = (A^{-1})^T$. This is statement 12.`,
      tags: ["imt"],
    }),
    tf("one-b-not-enough", {
      statement: r`If $A$ is $3 \times 3$ and $A\mathbf{x} = ${vec(1, 2, 3)}$ has a solution, then $A$ is invertible.`,
      answer: false,
      feedback: "Statement 7 requires a solution for *every* b, not just one.",
      hint: r`Could a singular matrix still happen to hit this one particular $\mathbf{b}$?`,
      explanation: r`False. Statement 7 is about **every** $\mathbf{b}$. A singular matrix can still reach some particular vectors: $A = ${mat([
        [1, 0, 0],
        [0, 2, 0],
        [0, 3, 0],
      ])}$ has a zero column, so it is singular, yet $A${vec(1, 1, 0)} = ${vec(1, 2, 3)}$. One solvable $\mathbf{b}$ proves nothing; the theorem needs a solution for all of them.`,
      tags: ["imt"],
    }),
    tf("product-invertible", {
      statement: r`If $A$ and $B$ are $n \times n$ and $AB$ is invertible, then both $A$ and $B$ are invertible.`,
      answer: true,
      feedback: r`Start with $B$: if $B\mathbf{x} = \mathbf{0}$ then $(AB)\mathbf{x} = \mathbf{0}$ — what does invertibility of $AB$ say about $\mathbf{x}$?`,
      hint: r`Show $B\mathbf{x} = \mathbf{0}$ forces $\mathbf{x} = \mathbf{0}$ (so $B$ is invertible), then write $A = (AB)B^{-1}$.`,
      explanation: r`True. If $B\mathbf{x} = \mathbf{0}$ then $(AB)\mathbf{x} = \mathbf{0}$, so $\mathbf{x} = \mathbf{0}$ because $AB$ is invertible; thus $B$ is invertible (statement 4). Then $A = (AB)B^{-1}$ is a product of invertible matrices, hence invertible.`,
      tags: ["imt", "theory"],
    }),
    reading(
      "invertible-maps",
      r`A linear transformation $T : \mathbb{R}^n \to \mathbb{R}^n$ is **invertible** if there is an $S$ with $S(T(\mathbf{x})) = \mathbf{x}$ and $T(S(\mathbf{x})) = \mathbf{x}$ for all $\mathbf{x}$. By the theorem, $T$ is invertible exactly when its standard matrix $A$ is, and then $T^{-1}(\mathbf{x}) = A^{-1}\mathbf{x}$.

Rotation by $\theta$ is undone by rotation by $-\theta$; a reflection is undone by itself; a shear by $k$ is undone by a shear by $-k$. A projection onto a line cannot be undone — information is lost — and its matrix is singular.`,
      { title: "Invertible transformations" },
    ),
    mc("reflection-inverse", {
      question: r`$T$ is the reflection across the $x_1$-axis, with matrix $${mat([
        [1, 0],
        [0, -1],
      ])}$. What is $T^{-1}$?`,
      choices: [
        ["self", r`$T$ itself — reflecting twice returns every point.`, undefined],
        ["rot", r`Rotation by $180^\circ$.`, "Rotation by $180^\\circ$ after the reflection gives a reflection across the other axis, not the identity."],
        ["none", r`$T$ has no inverse.`, "The matrix has $ad - bc = -1 \\neq 0$."],
      ],
      correct: "self",
      hint: "Apply T twice to a point.",
      explanation: r`$A^2 = ${mat([
        [1, 0],
        [0, -1],
      ])}^2 = I$, so $A^{-1} = A$: the reflection is its own inverse.`,
      tags: ["imt"],
    }),
    reading(
      "summary",
      r`**What you did:** moved between a dozen equivalent descriptions of an invertible matrix, used one-sided inverses, and recognised singular matrices by inspection.

**The reflex to build:** any fact about a *square* matrix — pivots, independence, spanning, solutions, transposes — immediately tells you about all the others. Take the Level Check.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit                                                                */
/* ------------------------------------------------------------------ */

export const unit4: Unit = {
  id: "u4",
  title: "Matrix algebra",
  subtitle: "Products, inverses, and the big theorem",
  description: "Matrix multiplication as composition, inverses and how to compute them, and the Invertible Matrix Theorem that ties the whole chapter together.",
  textbook: "Lay §2.1–2.3",
  lessons: [l1, l2, l3],
  practice: [
    matrix("p-product", {
      question: r`Compute $${mat([
        [2, 1],
        [-1, 3],
      ])}${mat([
        [1, 0],
        [4, 2],
      ])}$.`,
      answer: [
        [6, 2],
        [11, 6],
      ],
      hint: "Row i of the first times column j of the second.",
      explanation: r`$(1,1)$: $2 + 4 = 6$; $(1,2)$: $0 + 2 = 2$; $(2,1)$: $-1 + 12 = 11$; $(2,2)$: $0 + 6 = 6$.`,
      tags: ["matrix-multiplication"],
    }),
    mc("p-size", {
      question: r`$A$ is $2 \times 3$ and $B$ is $3 \times 3$. Which products are defined?`,
      choices: [
        ["ab", r`$AB$ only`],
        ["ba", r`$BA$ only`, "$BA$ would need $B$'s 3 columns to match $A$'s 2 rows."],
        ["both", r`Both $AB$ and $BA$`, "$BA$ is not defined."],
      ],
      correct: "ab",
      hint: "Inner dimensions must match.",
      explanation: r`$(2\times3)(3\times3)$ works; $(3\times3)(2\times3)$ does not.`,
      tags: ["matrix-multiplication"],
    }),
    matrix("p-inverse", {
      question: r`Find the inverse of $${mat([
        [4, 7],
        [1, 2],
      ])}$.`,
      answer: [
        [2, -7],
        [-1, 4],
      ],
      hint: "ad − bc = 8 − 7 = 1.",
      explanation: r`$\tfrac{1}{1}${mat([
        [2, -7],
        [-1, 4],
      ])}$.`,
      tags: ["inverse"],
    }),
    numeric("p-det-zero", {
      question: r`For which $k$ is $${mat([
        [3, "k"],
        [2, 4],
      ])}$ **not** invertible?`,
      answer: 6,
      prefix: "k =",
      hint: "Set ad − bc = 0.",
      explanation: r`$12 - 2k = 0$ gives $k = 6$ — then the columns $(3, 2)$ and $(6, 4)$ are parallel.`,
      tags: ["inverse"],
    }),
    mc("p-imt", {
      question: r`$A$ is $6 \times 6$ with linearly independent columns. Which is **false**?`,
      choices: [
        ["false", r`$A\mathbf{x} = \mathbf{b}$ has infinitely many solutions for some $\mathbf{b}$.`],
        ["t1", r`$A$ is invertible.`, "True by the Invertible Matrix Theorem."],
        ["t2", r`The columns of $A$ span $\mathbb{R}^6$.`, "True — square plus independent gives spanning."],
        ["t3", r`$A^T$ is invertible.`, "True — statement 12."],
      ],
      correct: "false",
      hint: "Independent columns of a square matrix make it invertible; then solutions are unique.",
      explanation: r`Invertible ⟹ every $A\mathbf{x} = \mathbf{b}$ has exactly one solution, never infinitely many.`,
      tags: ["imt"],
    }),
    tf("p-tf-commute", {
      statement: r`For all $n \times n$ matrices $A$ and $B$, $(A + B)(A - B) = A^2 - B^2$.`,
      answer: false,
      hint: "Expand: the cross terms are −AB + BA.",
      explanation: r`$(A+B)(A-B) = A^2 - AB + BA - B^2$, which equals $A^2 - B^2$ only when $AB = BA$.`,
      tags: ["matrix-algebra"],
    }),
    tf("p-tf-inverse-product", {
      statement: r`If $A$ and $B$ are invertible, then $(AB)^{-1} = A^{-1}B^{-1}$.`,
      answer: false,
      hint: "Socks and shoes.",
      explanation: r`False — the order reverses: $(AB)^{-1} = B^{-1}A^{-1}$.`,
      tags: ["inverse"],
    }),
    matrix("p-transpose-product", {
      question: r`With $A = ${mat([
        [1, 2],
        [0, 1],
      ])}$ and $B = ${mat([
        [0, 1],
        [1, 1],
      ])}$, compute $(AB)^T$.`,
      answer: [
        [2, 1],
        [3, 1],
      ],
      hint: "Compute AB first, then transpose — or use BᵀAᵀ.",
      explanation: r`$AB = ${mat([
        [2, 3],
        [1, 1],
      ])}$, so $(AB)^T = ${mat([
        [2, 1],
        [3, 1],
      ])}$.`,
      tags: ["transpose"],
    }),
    mc("p-singular-shape", {
      question: r`Which matrix is **singular** (not invertible)?`,
      choices: [
        ["sing", r`$${mat([
          [1, 2, 3],
          [0, 0, 0],
          [4, 5, 6],
        ])}$`],
        ["inv1", r`$${mat([
          [1, 0, 0],
          [0, 2, 0],
          [0, 0, 3],
        ])}$`, "A diagonal matrix with nonzero diagonal has 3 pivots."],
        ["inv2", r`$${mat([
          [1, 1, 1],
          [0, 1, 1],
          [0, 0, 1],
        ])}$`, "Triangular with nonzero diagonal: 3 pivots."],
      ],
      correct: "sing",
      hint: "A zero row means fewer than 3 pivots.",
      explanation: r`A row of zeros can never become a pivot row, so the matrix has at most 2 pivots and is singular.`,
      tags: ["imt"],
    }),
    multi("p-equivalents", {
      question: r`$A$ is $n \times n$ and **invertible**. Select every statement that must be true.`,
      choices: [
        ["triv", r`$A\mathbf{x} = \mathbf{0}$ has only the trivial solution.`],
        ["span", r`The columns of $A$ span $\mathbb{R}^n$.`],
        ["onto", r`$\mathbf{x} \mapsto A\mathbf{x}$ is onto $\mathbb{R}^n$.`],
        ["sym", r`$A = A^T$.`],
        ["two", r`$A$ has exactly two pivot positions.`],
      ],
      correct: ["triv", "span", "onto"],
      hint: "Everything in the theorem's list is true; anything not in it (symmetry, a fixed pivot count other than n) isn't implied.",
      explanation: r`Statements 4, 8 and 9 of the theorem hold. Invertible matrices need not be symmetric, and they have $n$ pivots, not two.`,
      tags: ["imt"],
    }),
  ],
  generators: ["gen.matrix-product", "gen.inverse-2x2", "gen.imt"],
};
