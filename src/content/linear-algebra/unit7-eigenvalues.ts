import type { Unit } from "../types";
import { lesson, mat, matrix, mc, numeric, r, reading, tf, vec } from "../dsl";

/* ------------------------------------------------------------------ */
/* Lesson 1 · Eigenvectors and eigenvalues (Lay §5.1)                   */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "u7-l1-eigenvectors-eigenvalues",
    unitId: "u7",
    title: "Eigenvectors and eigenvalues",
    summary: "Directions a matrix only stretches. Checking, finding, and the eigenspace as a null space.",
    textbook: "Lay §5.1",
    minutes: 13,
  },
  [
    reading(
      "def",
      r`Most vectors get knocked off their line when a matrix hits them. The special ones that don't are **eigenvectors**: a nonzero $\mathbf{v}$ with

$$A\mathbf{v} = \lambda\mathbf{v}$$

for some scalar $\lambda$, the **eigenvalue**. $A$ merely stretches $\mathbf{v}$ by the factor $\lambda$ (and flips it if $\lambda < 0$; if $\lambda = 0$ it collapses $\mathbf{v}$ to the origin).

The picture shows $A = ${mat([
        [2, 1],
        [1, 2],
      ])}$. The dashed teal lines are its eigenvector directions: everything on them stays on them. The grey vectors are the inputs $\mathbf{u}$, $\mathbf{w}$; the purple ones are their images $A\mathbf{u}$, $A\mathbf{w}$. One of them stays on its line (scaled by $3$); the other does not.`,
      {
        title: "Vectors that keep their direction",
        visual: {
          kind: "transform",
          config: {
            matrix: [
              [2, 1],
              [1, 2],
            ],
            showEigen: true,
            showDet: false,
            shape: "none",
            range: 5,
            vectors: [
              { id: "u", x: 1, y: 1, label: "u", color: "purple" },
              { id: "w", x: 1, y: 0, label: "w", color: "orange" },
            ],
          },
        },
      },
    ),
    mc("is-eigenvector", {
      question: r`Is $\mathbf{v} = ${vec(1, 2)}$ an eigenvector of $A = ${mat([
        [4, 1],
        [2, 3],
      ])}$?`,
      choices: [
        ["no", r`No — $A\mathbf{v} = ${vec(6, 8)}$, which is not a multiple of $${vec(1, 2)}$.`, undefined],
        ["yes5", r`Yes, with eigenvalue $5$.`, "Compute $A\\mathbf{v}$: is it $(5, 10)$?"],
        ["yes6", r`Yes, with eigenvalue $6$.`, "The first entry of $A\\mathbf{v}$ is $6$, but check the second entry against $6\\cdot2$."],
      ],
      correct: "no",
      hint: r`Compute $A\mathbf{v}$ and ask whether the result is a scalar multiple of $\mathbf{v}$.`,
      explanation: r`$A\mathbf{v} = ${vec("4 + 2", "2 + 6")} = ${vec(6, 8)}$. For this to be $\lambda${vec(1, 2)}$ we'd need $\lambda = 6$ from the first entry and $\lambda = 4$ from the second — impossible. Not an eigenvector. (The eigenvectors of this $A$ are along $(1, 1)$ and $(1, -2)$.)`,
      tags: ["eigenvectors"],
    }),
    numeric("find-eigenvalue", {
      question: r`$${vec(1, 1)}$ **is** an eigenvector of $A = ${mat([
        [4, 1],
        [2, 3],
      ])}$. What is its eigenvalue?`,
      answer: 5,
      prefix: "λ =",
      hint: r`Compute $A${vec(1, 1)}$ and read off the scalar.`,
      explanation: r`$A${vec(1, 1)} = ${vec(5, 5)} = 5${vec(1, 1)}$, so $\lambda = 5$.`,
      tags: ["eigenvalues"],
    }),
    reading(
      "eigenspace",
      r`To find the eigenvectors for a **given** $\lambda$, rewrite $A\mathbf{v} = \lambda\mathbf{v}$ as

$$(A - \lambda I)\mathbf{v} = \mathbf{0}.$$

So the eigenvectors for $\lambda$ are the nonzero vectors in $\operatorname{Nul}(A - \lambda I)$. That null space — including $\mathbf{0}$ — is the **eigenspace** of $A$ corresponding to $\lambda$, a subspace of $\mathbb{R}^n$. Finding it is a Unit-6 job: row reduce $A - \lambda I$ and write the solutions in parametric form.

A scalar $\lambda$ is an eigenvalue exactly when that null space is nontrivial, i.e. when $A - \lambda I$ is **not** invertible.`,
      { title: "Eigenspaces" },
    ),
    matrix("eigenspace-basis", {
      question: r`$\lambda = 2$ is an eigenvalue of $A = ${mat([
        [4, 1],
        [2, 3],
      ])}$. Find a basis vector for the eigenspace, scaled so that its **first entry is 1**.`,
      answer: [[1], [-2]],
      hint: r`Row reduce $A - 2I = ${mat([
        [2, 1],
        [2, 1],
      ])}$ and solve for the null space.`,
      explanation: r`$A - 2I = ${mat([
        [2, 1],
        [2, 1],
      ])} \sim ${mat([
        [2, 1],
        [0, 0],
      ])}$, so $2x_1 + x_2 = 0$: $x_2 = -2x_1$. The eigenspace is $\operatorname{Span}\left\{${vec(1, -2)}\right\}$. Check: $A${vec(1, -2)} = ${vec("4 - 2", "2 - 6")} = ${vec(2, -4)} = 2${vec(1, -2)}$ ✓.`,
      tags: ["eigenvectors"],
    }),
    reading(
      "triangular-zero",
      r`Two quick facts:

- **The eigenvalues of a triangular matrix are its diagonal entries.** ($A - \lambda I$ is triangular, and it fails to be invertible exactly when a diagonal entry $a_{ii} - \lambda$ is $0$.)
- **$0$ is an eigenvalue of $A$ if and only if $A$ is not invertible.** ($A\mathbf{v} = 0\mathbf{v}$ has a nonzero solution ⟺ $\operatorname{Nul}A \neq \{\mathbf{0}\}$.)

And a structural fact: **eigenvectors belonging to distinct eigenvalues are linearly independent.**`,
      { title: "Triangular matrices and λ = 0" },
    ),
    numeric("triangular-eigen", {
      question: r`What is the **largest** eigenvalue of $${mat([
        [3, 7, -2],
        [0, -1, 5],
        [0, 0, 6],
      ])}$?`,
      answer: 6,
      hint: "Upper triangular: read the diagonal.",
      explanation: r`The eigenvalues are the diagonal entries $3, -1, 6$; the largest is $6$. No characteristic polynomial needed.`,
      tags: ["eigenvalues"],
    }),
    mc("zero-eigenvalue", {
      question: r`$A$ is a $3 \times 3$ matrix with $0$ as an eigenvalue. Which is true?`,
      choices: [
        ["singular", r`$A$ is not invertible, and the eigenspace for $0$ is $\operatorname{Nul}A$.`, undefined],
        ["zero-matrix", r`$A$ is the zero matrix.`, "Lots of nonzero matrices have 0 as an eigenvalue — any singular one."],
        ["inv", r`$A$ is invertible.`, "$A\\mathbf{v} = \\mathbf{0}$ for a nonzero $\\mathbf{v}$ contradicts invertibility."],
      ],
      correct: "singular",
      hint: r`$A\mathbf{v} = 0\cdot\mathbf{v} = \mathbf{0}$ with $\mathbf{v} \neq \mathbf{0}$ — what does that say about $\operatorname{Nul}A$?`,
      explanation: r`An eigenvector for $\lambda = 0$ is a nonzero solution of $A\mathbf{v} = \mathbf{0}$, so $\operatorname{Nul}A \neq \{\mathbf{0}\}$ and $A$ is singular. The eigenspace for $0$ is exactly $\operatorname{Nul}A$.`,
      tags: ["eigenvalues"],
    }),
    tf("independent-eigenvectors", {
      statement: r`If $\mathbf{v}_1, \mathbf{v}_2$ are eigenvectors of $A$ for distinct eigenvalues $\lambda_1 \neq \lambda_2$, then $\{\mathbf{v}_1, \mathbf{v}_2\}$ is linearly independent.`,
      answer: true,
      feedback: r`If $\mathbf{v}_2 = c\mathbf{v}_1$, apply $A$ to both sides and compare.`,
      hint: r`Suppose $\mathbf{v}_2 = c\mathbf{v}_1$. Then $A\mathbf{v}_2 = \lambda_2\mathbf{v}_2$ but also $A\mathbf{v}_2 = cA\mathbf{v}_1 = c\lambda_1\mathbf{v}_1 = \lambda_1\mathbf{v}_2$.`,
      explanation: r`True. If $\mathbf{v}_2 = c\mathbf{v}_1$ then $\lambda_2\mathbf{v}_2 = A\mathbf{v}_2 = \lambda_1\mathbf{v}_2$, forcing $\lambda_1 = \lambda_2$ since $\mathbf{v}_2 \neq \mathbf{0}$ — a contradiction. (Lay's Theorem 2 extends this to any number of distinct eigenvalues.)`,
      tags: ["eigenvectors", "theory"],
    }),
    tf("eigenvalue-of-sum", {
      statement: r`If $\mathbf{v}$ is an eigenvector of $A$ with eigenvalue $\lambda$, then $\mathbf{v}$ is an eigenvector of $A + 3I$ with eigenvalue $\lambda + 3$.`,
      answer: true,
      feedback: r`Compute $(A + 3I)\mathbf{v}$ directly.`,
      hint: r`$(A + 3I)\mathbf{v} = A\mathbf{v} + 3\mathbf{v}$.`,
      explanation: r`True: $(A + 3I)\mathbf{v} = \lambda\mathbf{v} + 3\mathbf{v} = (\lambda + 3)\mathbf{v}$. Shifting a matrix by a multiple of $I$ shifts every eigenvalue and keeps every eigenvector.`,
      tags: ["eigenvectors", "theory"],
    }),
    reading(
      "summary",
      r`**What you did:** tested eigenvectors by multiplying, found an eigenvalue from an eigenvector, computed an eigenspace as a null space, and read eigenvalues off a triangular matrix.

**Remember:** eigenspace for $\lambda$ = $\operatorname{Nul}(A - \lambda I)$. Next: how to find the eigenvalues in the first place.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · The characteristic equation (Lay §5.2)                    */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "u7-l2-characteristic-equation",
    unitId: "u7",
    title: "The characteristic equation",
    summary: "det(A − λI) = 0 finds every eigenvalue. Multiplicities, the 2×2 shortcut, and similar matrices.",
    textbook: "Lay §5.2",
    minutes: 13,
  },
  [
    reading(
      "char-eq",
      r`$\lambda$ is an eigenvalue of $A$ ⟺ $A - \lambda I$ is singular ⟺

$$\det(A - \lambda I) = 0.$$

This is the **characteristic equation**. For an $n \times n$ matrix, $\det(A - \lambda I)$ is a polynomial of degree $n$ in $\lambda$ — the **characteristic polynomial** — so there are at most $n$ eigenvalues (counting complex ones, which we meet in lesson 5). The number of times $(\lambda - \lambda_0)$ divides the polynomial is the **algebraic multiplicity** of $\lambda_0$.

For $2 \times 2$ matrices there's a shortcut worth memorising:

$$\det(A - \lambda I) = \lambda^2 - (\operatorname{tr}A)\lambda + \det A,$$

where $\operatorname{tr}A = a_{11} + a_{22}$ is the **trace**.`,
      { title: "Where eigenvalues come from" },
    ),
    numeric("char-poly-c", {
      question: r`The characteristic polynomial of $A = ${mat([
        [4, 1],
        [2, 3],
      ])}$ is $\lambda^2 + b\lambda + c$. What is $b$?`,
      answer: -7,
      prefix: "b =",
      hint: r`$b = -\operatorname{tr}A$.`,
      explanation: r`$\operatorname{tr}A = 4 + 3 = 7$ and $\det A = 12 - 2 = 10$, so $\det(A - \lambda I) = \lambda^2 - 7\lambda + 10 = (\lambda - 2)(\lambda - 5)$. Eigenvalues $2$ and $5$ — exactly what lesson 1 found.`,
      tags: ["characteristic-polynomial"],
    }),
    numeric("eigenvalues-2x2", {
      question: r`Find the **smaller** eigenvalue of $${mat([
        [1, 4],
        [2, 3],
      ])}$.`,
      answer: -1,
      hint: r`$\lambda^2 - (\operatorname{tr}A)\lambda + \det A = 0$ with $\operatorname{tr}A = 4$, $\det A = -5$.`,
      explanation: r`$\lambda^2 - 4\lambda - 5 = (\lambda - 5)(\lambda + 1) = 0$, so the eigenvalues are $5$ and $-1$; the smaller is $-1$.`,
      tags: ["eigenvalues"],
    }),
    numeric("multiplicity", {
      question: r`The characteristic polynomial of a $4 \times 4$ matrix is $(\lambda - 3)^2(\lambda + 1)\lambda$. What is the algebraic multiplicity of the eigenvalue $3$?`,
      answer: 2,
      hint: "Count the power of (λ − 3).",
      explanation: r`$(\lambda - 3)$ appears squared, so $3$ has algebraic multiplicity $2$; the eigenvalues $-1$ and $0$ each have multiplicity $1$. The multiplicities add up to $4 = n$.`,
      tags: ["characteristic-polynomial"],
    }),
    numeric("char-3x3", {
      question: r`For $A = ${mat([
        [2, 0, 0],
        [1, 3, 0],
        [4, 5, -1],
      ])}$, evaluate the characteristic polynomial $\det(A - \lambda I)$ at $\lambda = 1$.`,
      answer: -4,
      hint: "The matrix is lower triangular, so det(A − λI) is the product of the diagonal entries of A − λI.",
      explanation: r`$A - \lambda I$ is lower triangular with diagonal $2 - \lambda,\ 3 - \lambda,\ -1 - \lambda$, so $\det(A - \lambda I) = (2 - \lambda)(3 - \lambda)(-1 - \lambda)$. At $\lambda = 1$: $(1)(2)(-2) = -4$. The roots — the eigenvalues — are $2, 3, -1$, the diagonal entries, as the triangular rule promised.`,
      tags: ["characteristic-polynomial"],
    }),
    reading(
      "similarity",
      r`Two $n \times n$ matrices are **similar** if $B = P^{-1}AP$ for some invertible $P$. Similar matrices represent the *same* linear transformation in different coordinates, and they share the **same characteristic polynomial**, hence the same eigenvalues with the same multiplicities:

$$\det(B - \lambda I) = \det(P^{-1}AP - \lambda P^{-1}P) = \det\big(P^{-1}(A - \lambda I)P\big) = \det(A - \lambda I).$$

Beware: similarity is **not** the same as row equivalence. Row operations can change eigenvalues completely.`,
      { title: "Similar matrices" },
    ),
    tf("row-equiv-eigen", {
      statement: "Row equivalent matrices have the same eigenvalues.",
      answer: false,
      feedback: r`Scale a row of $I$ by 5 — the eigenvalues change but the matrices are row equivalent.`,
      hint: r`$I$ and $${mat([
        [5, 0],
        [0, 1],
      ])}$ are row equivalent.`,
      explanation: r`False. $I$ has eigenvalue $1$ (twice) while the row-equivalent matrix $${mat([
        [5, 0],
        [0, 1],
      ])}$ has eigenvalues $5$ and $1$. It is *similarity* ($P^{-1}AP$), not row equivalence, that preserves eigenvalues.`,
      tags: ["similarity"],
    }),
    tf("similar-same-det", {
      statement: r`If $A$ and $B$ are similar, then $\det A = \det B$.`,
      answer: true,
      feedback: r`$\det(P^{-1}AP) = \det P^{-1}\det A\det P$.`,
      hint: "Use multiplicativity of the determinant.",
      explanation: r`True: $\det(P^{-1}AP) = \det(P^{-1})\det A\det P = \det A$ since $\det(P^{-1}) = 1/\det P$. (The determinant is the constant term of the characteristic polynomial, up to sign, so this also follows from the shared polynomial.)`,
      tags: ["similarity"],
    }),
    mc("which-eigenvalue", {
      question: r`Which of these is an eigenvalue of $${mat([
        [3, -2],
        [1, 0],
      ])}$?`,
      choices: [
        ["two", r`$2$`, undefined],
        ["three", r`$3$`, "Check: is $A - 3I = \\begin{bmatrix}0&-2\\\\1&-3\\end{bmatrix}$ singular? Its determinant is $2$."],
        ["zero", r`$0$`, "$\\det A = 2 \\neq 0$, so $A$ is invertible and $0$ is not an eigenvalue."],
        ["minus-one", r`$-1$`, "$\\det(A + I) = 4\\cdot1 + 2 = 6 \\neq 0$."],
      ],
      correct: "two",
      hint: r`$\lambda^2 - 3\lambda + 2 = 0$.`,
      explanation: r`$\operatorname{tr}A = 3$, $\det A = 2$: $\lambda^2 - 3\lambda + 2 = (\lambda - 1)(\lambda - 2)$, so the eigenvalues are $1$ and $2$.`,
      tags: ["eigenvalues"],
    }),
    reading(
      "summary",
      r`**What you did:** found eigenvalues from the characteristic equation, used the trace/determinant shortcut, read multiplicities, and separated similarity from row equivalence.

**Remember:** $\det(A - \lambda I) = 0$; for $2 \times 2$, $\lambda^2 - (\operatorname{tr}A)\lambda + \det A$; similar matrices share eigenvalues, row-equivalent ones don't.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Diagonalization (Lay §5.3)                                */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "u7-l3-diagonalization",
    unitId: "u7",
    title: "Diagonalization",
    summary: "A = PDP⁻¹: when it's possible, how to build P and D, and why it makes powers trivial.",
    textbook: "Lay §5.3",
    minutes: 14,
  },
  [
    reading(
      "pdp",
      r`A square matrix $A$ is **diagonalizable** if $A = PDP^{-1}$ for some invertible $P$ and diagonal $D$. Then

$$A^k = PD^kP^{-1},$$

and $D^k$ just raises the diagonal entries to the $k$-th power — huge powers become trivial.

**The Diagonalization Theorem.** $A$ ($n \times n$) is diagonalizable **if and only if** it has $n$ linearly independent eigenvectors. In that case the columns of $P$ are those eigenvectors and the diagonal entries of $D$ are the corresponding eigenvalues, in the same order.

**Recipe:** (1) find the eigenvalues; (2) find a basis for each eigenspace; (3) if the bases together give $n$ vectors, put them in $P$ and the eigenvalues in $D$; otherwise $A$ is not diagonalizable.

A useful sufficient condition: an $n \times n$ matrix with $n$ **distinct** eigenvalues is diagonalizable (eigenvectors for distinct eigenvalues are independent). Repeated eigenvalues need the eigenspace dimensions to add up to $n$.`,
      { title: "A = PDP⁻¹" },
    ),
    matrix("build-d", {
      body: r`$A = ${mat([
        [4, 1],
        [2, 3],
      ])}$ has eigenvalues $2$ and $5$ with eigenvectors $${vec(1, -2)}$ and $${vec(1, 1)}$.`,
      question: r`Using $P = ${mat([
        [1, 1],
        [-2, 1],
      ])}$, what is $D$?`,
      answer: [
        [2, 0],
        [0, 5],
      ],
      hint: "D's diagonal lists the eigenvalues in the same order as P's columns.",
      explanation: r`Column 1 of $P$ is the eigenvector for $2$, column 2 for $5$, so $D = ${mat([
        [2, 0],
        [0, 5],
      ])}$. Check $AP = PD$: $A${vec(1, -2)} = 2${vec(1, -2)}$ and $A${vec(1, 1)} = 5${vec(1, 1)}$ ✓.`,
      tags: ["diagonalization"],
    }),
    numeric("power-via-d", {
      question: r`With $A = PDP^{-1}$ as above, $A^{10} = PD^{10}P^{-1}$. What is the $(2, 2)$ entry of $D^{10}$?`,
      answer: 9765625,
      hint: r`$D^{10}$ is diagonal with entries $2^{10}$ and $5^{10}$.`,
      explanation: r`$D^{10} = \operatorname{diag}(2^{10}, 5^{10}) = \operatorname{diag}(1024,\ 9765625)$, so the $(2,2)$ entry is $5^{10} = 9\,765\,625$. Multiplying by $P$ and $P^{-1}$ then gives $A^{10}$ without ten matrix products.`,
      tags: ["diagonalization"],
    }),
    mc("not-diagonalizable", {
      question: r`Is $A = ${mat([
        [2, 1],
        [0, 2],
      ])}$ diagonalizable?`,
      choices: [
        ["no", r`No — the only eigenvalue is $2$ and its eigenspace is one-dimensional, so there aren't two independent eigenvectors.`, undefined],
        ["yes-tri", r`Yes — it's triangular, so $D = ${mat([
          [2, 0],
          [0, 2],
        ])}$.`, "Triangular gives the eigenvalues easily, but $PDP^{-1}$ with $D = 2I$ would equal $2I$, not $A$."],
        ["yes-inv", "Yes — it's invertible.", "Invertibility and diagonalizability are unrelated. This matrix is invertible yet not diagonalizable."],
      ],
      correct: "no",
      hint: r`Find the eigenspace for $\lambda = 2$: row reduce $A - 2I = ${mat([
        [0, 1],
        [0, 0],
      ])}$.`,
      explanation: r`$A - 2I = ${mat([
        [0, 1],
        [0, 0],
      ])}$ forces $x_2 = 0$, so the eigenspace is $\operatorname{Span}\{\mathbf{e}_1\}$ — dimension 1. With a double eigenvalue but only one eigenvector direction, $A$ is a shear, not diagonalizable. (If $A = PDP^{-1}$ with $D = 2I$, then $A = 2PP^{-1} = 2I$, which it isn't.)`,
      tags: ["diagonalization"],
    }),
    mc("distinct-eigenvalues", {
      question: r`A $3 \times 3$ matrix has eigenvalues $1$, $4$ and $-2$. Is it diagonalizable?`,
      choices: [
        ["yes", "Yes — three distinct eigenvalues give three independent eigenvectors.", undefined],
        ["maybe", "It depends on the eigenspaces.", "With three *distinct* eigenvalues, each eigenspace contributes an independent eigenvector automatically."],
        ["no", "No — the eigenvalues aren't all positive.", "Signs are irrelevant to diagonalizability."],
      ],
      correct: "yes",
      hint: "Distinct eigenvalues ⟹ independent eigenvectors ⟹ enough for P.",
      explanation: r`Three distinct eigenvalues yield three linearly independent eigenvectors (Theorem 2 from lesson 1), which is exactly $n = 3$. So $A$ is diagonalizable with $D = \operatorname{diag}(1, 4, -2)$.`,
      tags: ["diagonalization"],
    }),
    numeric("eigenspace-dims", {
      question: r`A $5 \times 5$ matrix has eigenvalues $3$ (algebraic multiplicity 3) and $7$ (multiplicity 2). It is diagonalizable. What is $\dim$ of the eigenspace for $3$?`,
      answer: 3,
      hint: "For a diagonalizable matrix, each eigenspace dimension equals the algebraic multiplicity.",
      explanation: r`Diagonalizable ⟺ the eigenspace dimensions sum to $n = 5$. Each dimension is at most the algebraic multiplicity, so they must be exactly $3$ and $2$.`,
      tags: ["diagonalization"],
    }),
    matrix("p-inverse-check", {
      question: r`For $P = ${mat([
        [1, 1],
        [-2, 1],
      ])}$, compute $P^{-1}$ (needed to assemble $A = PDP^{-1}$).`,
      answer: [
        [1 / 3, -1 / 3],
        [2 / 3, 1 / 3],
      ],
      prefix: r`$P^{-1} =$`,
      hint: r`$ad - bc = 1 + 2 = 3$; swap, negate, divide.`,
      explanation: r`$P^{-1} = \tfrac13${mat([
        [1, -1],
        [2, 1],
      ])} = ${mat([
        ["1/3", "-1/3"],
        ["2/3", "1/3"],
      ])}$. You can verify $PDP^{-1} = ${mat([
        [4, 1],
        [2, 3],
      ])}$.`,
      tags: ["diagonalization"],
    }),
    tf("invertible-diagonalizable", {
      statement: "Every invertible matrix is diagonalizable.",
      answer: false,
      feedback: r`$${mat([
        [2, 1],
        [0, 2],
      ])}$ is invertible but has only one independent eigenvector.`,
      hint: "The shear matrix from earlier in this lesson.",
      explanation: r`False. Invertibility is about $0$ not being an eigenvalue; diagonalizability is about having enough eigenvectors. The shear $${mat([
        [2, 1],
        [0, 2],
      ])}$ has one but not the other. (Conversely, $${mat([
        [1, 0],
        [0, 0],
      ])}$ is diagonalizable but not invertible.)`,
      tags: ["diagonalization"],
    }),
    tf("diag-means-distinct", {
      statement: r`If an $n \times n$ matrix is diagonalizable, then it has $n$ distinct eigenvalues.`,
      answer: false,
      feedback: r`$I_n$ is diagonalizable (it's already diagonal) with a single eigenvalue.`,
      hint: "Distinct eigenvalues are sufficient, not necessary.",
      explanation: r`False. $I_n$ has only the eigenvalue $1$ yet is diagonalizable. Repeated eigenvalues are fine as long as their eigenspaces are big enough.`,
      tags: ["diagonalization"],
    }),
    reading(
      "summary",
      r`**What you did:** assembled $D$ from eigenpairs, computed $P^{-1}$, used $A^k = PD^kP^{-1}$, and diagnosed a non-diagonalizable shear.

**Remember:** diagonalizable ⟺ $n$ independent eigenvectors; distinct eigenvalues suffice; a repeated eigenvalue needs an eigenspace as big as its multiplicity.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Eigenvectors and linear transformations (Lay §5.4)        */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "u7-l4-eigenvectors-transformations",
    unitId: "u7",
    title: "Eigenvectors and linear transformations",
    summary: "The matrix of a linear map relative to any bases, and why an eigenbasis makes it diagonal.",
    textbook: "Lay §5.4",
    minutes: 12,
  },
  [
    reading(
      "matrix-of-t",
      r`Let $T : V \to W$ be linear, with bases $\mathcal{B} = \{\mathbf{b}_1, \dots, \mathbf{b}_n\}$ for $V$ and $\mathcal{C}$ for $W$. The **matrix of $T$ relative to $\mathcal{B}$ and $\mathcal{C}$** is

$$M = \big[\,[T(\mathbf{b}_1)]_{\mathcal{C}} \;\cdots\; [T(\mathbf{b}_n)]_{\mathcal{C}}\,\big], \qquad [T(\mathbf{x})]_{\mathcal{C}} = M[\mathbf{x}]_{\mathcal{B}}.$$

Columns are the images of the basis vectors, written in the output coordinates — the same idea as the standard matrix, now for arbitrary bases. When $V = W$ and $\mathcal{B} = \mathcal{C}$ it's written $[T]_{\mathcal{B}}$, the **$\mathcal{B}$-matrix of $T$**.`,
      { title: "The matrix of T relative to bases" },
    ),
    matrix("derivative-matrix", {
      question: r`Let $D : \mathbb{P}_2 \to \mathbb{P}_1$ be differentiation, with standard bases $\{1, t, t^2\}$ and $\{1, t\}$. Find the matrix of $D$.`,
      answer: [
        [0, 1, 0],
        [0, 0, 2],
      ],
      hint: r`Columns are $[D(1)]_{\mathcal{C}}, [D(t)]_{\mathcal{C}}, [D(t^2)]_{\mathcal{C}}$. $D(t^2) = 2t$ has coordinates $(0, 2)$.`,
      explanation: r`$D(1) = 0 \mapsto (0, 0)$, $D(t) = 1 \mapsto (1, 0)$, $D(t^2) = 2t \mapsto (0, 2)$, so $M = ${mat([
        [0, 1, 0],
        [0, 0, 2],
      ])}$. Check on $p = 3 + 2t + t^2$: $M${vec(3, 2, 1)} = ${vec(2, 2)}$, i.e. $p' = 2 + 2t$ ✓.`,
      tags: ["matrix-of-transformation"],
    }),
    reading(
      "eigenbasis",
      r`Now take $T(\mathbf{x}) = A\mathbf{x}$ on $\mathbb{R}^n$ and suppose $A = PDP^{-1}$. Let $\mathcal{B}$ be the basis formed by the columns of $P$ (eigenvectors). Then

$$[T]_{\mathcal{B}} = D.$$

Reason: $T(\mathbf{b}_j) = \lambda_j\mathbf{b}_j$, whose $\mathcal{B}$-coordinates are $\lambda_j\mathbf{e}_j$ — the $j$-th column of $D$. Diagonalizing $A$ is the same as finding coordinates in which $T$ just scales each axis. More generally, for any basis $\mathcal{B}$ with matrix $P = P_{\mathcal{B}}$, $[T]_{\mathcal{B}} = P^{-1}AP$ — similar to $A$.`,
      { title: "Diagonal in the right coordinates" },
    ),
    matrix("b-matrix", {
      question: r`$T(\mathbf{x}) = ${mat([
        [4, 1],
        [2, 3],
      ])}\mathbf{x}$ and $\mathcal{B} = \left\{${vec(1, 1)}, ${vec(1, -2)}\right\}$ (eigenvectors for $5$ and $2$). Find $[T]_{\mathcal{B}}$.`,
      answer: [
        [5, 0],
        [0, 2],
      ],
      hint: "An eigenbasis gives a diagonal matrix — list the eigenvalues in the order of the basis vectors.",
      explanation: r`$T(\mathbf{b}_1) = 5\mathbf{b}_1 \mapsto (5, 0)$ and $T(\mathbf{b}_2) = 2\mathbf{b}_2 \mapsto (0, 2)$, so $[T]_{\mathcal{B}} = ${mat([
        [5, 0],
        [0, 2],
      ])}$. Note the order follows $\mathcal{B}$, so it's $\operatorname{diag}(5, 2)$ here, not $\operatorname{diag}(2, 5)$.`,
      tags: ["matrix-of-transformation"],
    }),
    matrix("non-eigen-basis", {
      question: r`Same $T$, but now $\mathcal{B} = \{\mathbf{e}_1, \mathbf{b}\}$ with $\mathbf{b} = ${vec(1, 1)}$. Find the first column of $[T]_{\mathcal{B}}$, i.e. $[T(\mathbf{e}_1)]_{\mathcal{B}}$.`,
      answer: [[2], [2]],
      hint: r`$T(\mathbf{e}_1) = ${vec(4, 2)}$. Write it as $c_1\mathbf{e}_1 + c_2\mathbf{b}$: the second entry fixes $c_2$.`,
      explanation: r`$T(\mathbf{e}_1) = ${vec(4, 2)} = c_1${vec(1, 0)} + c_2${vec(1, 1)}$ gives $c_2 = 2$, $c_1 = 2$. So the first column is $${vec(2, 2)}$ — not diagonal, because $\mathbf{e}_1$ is not an eigenvector.`,
      tags: ["matrix-of-transformation"],
    }),
    tf("similar-b-matrix", {
      statement: r`For any basis $\mathcal{B}$ of $\mathbb{R}^n$ with $P = P_{\mathcal{B}}$, the matrix $[T]_{\mathcal{B}}$ of $T(\mathbf{x}) = A\mathbf{x}$ equals $P^{-1}AP$.`,
      answer: true,
      feedback: r`Convert to standard coordinates, apply $A$, convert back.`,
      hint: r`$[T(\mathbf{x})]_{\mathcal{B}} = P^{-1}A\mathbf{x} = P^{-1}AP[\mathbf{x}]_{\mathcal{B}}$.`,
      explanation: r`True: $\mathbf{x} = P[\mathbf{x}]_{\mathcal{B}}$, so $[T(\mathbf{x})]_{\mathcal{B}} = P^{-1}A\mathbf{x} = (P^{-1}AP)[\mathbf{x}]_{\mathcal{B}}$. Every $\mathcal{B}$-matrix of $T$ is similar to $A$ — which is *why* similar matrices describe the same transformation.`,
      tags: ["similarity"],
    }),
    reading(
      "summary",
      r`**What you did:** built the matrix of a transformation column by column (including differentiation on polynomials) and saw that an eigenbasis makes it diagonal.

**Remember:** $[T]_{\mathcal{B}} = P^{-1}AP$; choose $\mathcal{B}$ = eigenvectors and you get $D$.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 5 · Complex eigenvalues (Lay §5.5)                            */
/* ------------------------------------------------------------------ */

const l5 = lesson(
  {
    id: "u7-l5-complex-eigenvalues",
    unitId: "u7",
    title: "Complex eigenvalues",
    summary: "Rotations have no real eigenvectors. Complex eigenvalues, the rotation–scaling matrix, and A = PCP⁻¹.",
    textbook: "Lay §5.5",
    minutes: 12,
  },
  [
    reading(
      "intro",
      r`The rotation $${mat([
        [0, -1],
        [1, 0],
      ])}$ moves **every** nonzero vector off its line, so it has no real eigenvectors. Its characteristic polynomial $\lambda^2 + 1$ has roots $\lambda = \pm i$. Allowing complex scalars, the theory goes through unchanged: eigenvalues are roots of $\det(A - \lambda I)$, eigenvectors live in $\mathbb{C}^n$.

For a **real** matrix, complex eigenvalues come in **conjugate pairs** $a \pm bi$, and if $\mathbf{v}$ is an eigenvector for $\lambda$ then $\bar{\mathbf{v}}$ is an eigenvector for $\bar\lambda$. Below, drag the Apply slider: the rotation never keeps a direction fixed — there is no teal eigen-line to draw.`,
      {
        title: "No real eigenvectors",
        visual: {
          kind: "transform",
          config: {
            matrix: [
              [0, -1],
              [1, 0],
            ],
            showEigen: true,
            showDet: false,
            shape: "f",
            animate: true,
            range: 3,
          },
        },
      },
    ),
    numeric("rotation-eigenvalue", {
      question: r`The eigenvalues of $${mat([
        [0, -1],
        [1, 0],
      ])}$ are $\pm bi$. What is $b$ (the positive imaginary part)?`,
      answer: 1,
      hint: r`Solve $\lambda^2 - (\operatorname{tr}A)\lambda + \det A = 0$: trace $0$, determinant $1$.`,
      explanation: r`$\lambda^2 + 1 = 0$ gives $\lambda = \pm i$, so $b = 1$. Pure rotation by $90^\circ$ — eigenvalues of modulus 1, no real part.`,
      tags: ["complex-eigenvalues"],
    }),
    reading(
      "rotation-scaling",
      r`The model for every complex eigenvalue is the **rotation–scaling matrix**

$$C = ${mat([
        ["a", "-b"],
        ["b", "a"],
      ])} = r${mat([
        ["\\cos\\varphi", "-\\sin\\varphi"],
        ["\\sin\\varphi", "\\cos\\varphi"],
      ])}, \qquad r = \sqrt{a^2 + b^2} = |\lambda|,$$

with eigenvalues $a \pm bi$: it rotates by the angle $\varphi$ of $a + bi$ and scales by $r$.

**Theorem.** If $A$ is a real $2 \times 2$ matrix with complex eigenvalue $\lambda = a - bi$ ($b \neq 0$) and eigenvector $\mathbf{v}$, then

$$A = PCP^{-1}, \qquad P = [\,\operatorname{Re}\mathbf{v} \;\; \operatorname{Im}\mathbf{v}\,], \quad C = ${mat([
        ["a", "-b"],
        ["b", "a"],
      ])}.$$

So in the coordinates given by $P$, every such $A$ is a rotation combined with a scaling. Repeated application spirals points in ($r < 1$) or out ($r > 1$).`,
      { title: "Rotation–scaling matrices" },
    ),
    numeric("scale-factor", {
      question: r`$A = ${mat([
        [1, -1],
        [1, 1],
      ])}$ has eigenvalues $1 \pm i$. What is the scaling factor $r = |\lambda|$?`,
      answer: Math.SQRT2,
      answerDisplay: "\\sqrt{2}",
      hint: r`$r = \sqrt{a^2 + b^2}$ with $a = b = 1$. You can type \`sqrt(2)\`.`,
      explanation: r`$r = \sqrt{1^2 + 1^2} = \sqrt 2 \approx 1.414$. Each application rotates by $45^\circ$ and stretches lengths by $\sqrt2$ — points spiral outward.`,
      tags: ["complex-eigenvalues"],
    }),
    numeric("rotation-angle", {
      question: r`For the same $A = ${mat([
        [1, -1],
        [1, 1],
      ])}$, what is the rotation angle $\varphi$ in degrees?`,
      answer: 45,
      suffix: "°",
      hint: r`$\varphi$ is the angle of the complex number $a + bi = 1 + i$.`,
      explanation: r`$1 + i$ sits at $45^\circ$ ($\tan\varphi = b/a = 1$), so $A = \sqrt2\,R_{45^\circ}$. Indeed $A\mathbf{e}_1 = (1, 1)$, which is $\mathbf{e}_1$ rotated by $45^\circ$ and stretched by $\sqrt2$.`,
      tags: ["complex-eigenvalues"],
    }),
    matrix("build-c", {
      question: r`A real $2 \times 2$ matrix has eigenvalue $\lambda = 2 - 3i$. Write the rotation–scaling matrix $C$ from the theorem.`,
      answer: [
        [2, -3],
        [3, 2],
      ],
      hint: r`With $\lambda = a - bi$: $C = ${mat([
        ["a", "-b"],
        ["b", "a"],
      ])}$, so $a = 2$, $b = 3$.`,
      explanation: r`$a = 2$, $b = 3$: $C = ${mat([
        [2, -3],
        [3, 2],
      ])}$, with $r = \sqrt{13}$ and $\varphi = \arctan(3/2) \approx 56.3^\circ$. Any real matrix with this eigenvalue is similar to $C$.`,
      tags: ["complex-eigenvalues"],
    }),
    tf("odd-real-eigenvalue", {
      statement: r`Every real $3 \times 3$ matrix has at least one real eigenvalue.`,
      answer: true,
      feedback: "A real cubic polynomial always has a real root; complex roots come in pairs.",
      hint: "The characteristic polynomial has degree 3 and real coefficients.",
      explanation: r`True. A real polynomial of odd degree has at least one real root (non-real roots come in conjugate pairs, so there's an odd number left over). Geometrically: every rotation of $\mathbb{R}^3$ has an axis.`,
      tags: ["complex-eigenvalues"],
    }),
    mc("spiral", {
      question: r`$A$ is real $2 \times 2$ with eigenvalues $0.8 \pm 0.6i$. Under repeated multiplication $\mathbf{x}, A\mathbf{x}, A^2\mathbf{x}, \dots$, points…`,
      choices: [
        ["circle", r`rotate around the origin without spiralling in or out (in suitable coordinates).`, undefined],
        ["in", "spiral inward toward the origin.", "Compute $|\\lambda| = \\sqrt{0.64 + 0.36}$."],
        ["out", "spiral outward.", "Compute $|\\lambda| = \\sqrt{0.64 + 0.36}$."],
      ],
      correct: "circle",
      hint: r`$r = |\lambda| = \sqrt{0.8^2 + 0.6^2}$.`,
      explanation: r`$|\lambda| = \sqrt{0.64 + 0.36} = 1$, so $A$ is similar to a pure rotation: in $P$-coordinates the orbit stays on a circle (in standard coordinates, on an ellipse). $|\lambda| < 1$ would spiral in, $|\lambda| > 1$ out.`,
      tags: ["complex-eigenvalues"],
    }),
    reading(
      "summary",
      r`**What you did:** found complex eigenvalues of rotations, extracted the scaling factor and angle, and built the rotation–scaling matrix $C$.

**Remember:** real matrix ⟹ conjugate pairs; $|\lambda|$ = scaling, $\arg\lambda$ = rotation; $A = PCP^{-1}$ with $P = [\operatorname{Re}\mathbf{v}\ \operatorname{Im}\mathbf{v}]$. Take the Level Check, then on to orthogonality.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit                                                                */
/* ------------------------------------------------------------------ */

export const unit7: Unit = {
  id: "u7",
  title: "Eigenvalues and eigenvectors",
  subtitle: "Directions a matrix only stretches",
  description: "Eigenvectors and eigenvalues, the characteristic equation, diagonalization, the matrix of a transformation in an eigenbasis, and complex eigenvalues.",
  textbook: "Lay §5.1–5.5",
  lessons: [l1, l2, l3, l4, l5],
  practice: [
    mc("p-is-eigenvector", {
      question: r`Is $${vec(2, 1)}$ an eigenvector of $${mat([
        [1, 2],
        [2, 1],
      ])}$?`,
      choices: [
        ["no", r`No — $A\mathbf{v} = (4, 5)$ is not a multiple of $(2, 1)$.`],
        ["yes", r`Yes, with eigenvalue $2$.`, "Compute $A\\mathbf{v}$ and compare entries."],
      ],
      correct: "no",
      hint: "Multiply and compare.",
      explanation: r`$A${vec(2, 1)} = ${vec(4, 5)}$; $4/2 = 2$ but $5/1 = 5$. Not an eigenvector.`,
      tags: ["eigenvectors"],
    }),
    numeric("p-eigenvalue", {
      question: r`Find the larger eigenvalue of $${mat([
        [1, 2],
        [2, 1],
      ])}$.`,
      answer: 3,
      hint: "λ² − 2λ − 3 = 0.",
      explanation: r`$(\lambda - 3)(\lambda + 1) = 0$: eigenvalues $3$ and $-1$.`,
      tags: ["eigenvalues"],
    }),
    matrix("p-eigenspace", {
      question: r`Find the eigenvector of $${mat([
        [1, 2],
        [2, 1],
      ])}$ for $\lambda = -1$ whose first entry is $1$.`,
      answer: [[1], [-1]],
      hint: "Solve (A + I)x = 0.",
      explanation: r`$A + I = ${mat([
        [2, 2],
        [2, 2],
      ])}$ gives $x_1 + x_2 = 0$, so $(1, -1)$.`,
      tags: ["eigenvectors"],
    }),
    numeric("p-triangular", {
      question: r`What is the sum of the eigenvalues of $${mat([
        [5, 0, 0],
        [2, -3, 0],
        [1, 1, 4],
      ])}$?`,
      answer: 6,
      hint: "Triangular — read the diagonal.",
      explanation: r`$5 + (-3) + 4 = 6$ (the trace, as always).`,
      tags: ["eigenvalues"],
    }),
    mc("p-diagonalizable", {
      question: r`Which matrix is **not** diagonalizable?`,
      choices: [
        ["shear", r`$${mat([
          [3, 1],
          [0, 3],
        ])}$`],
        ["diag", r`$${mat([
          [3, 0],
          [0, 3],
        ])}$`, "Already diagonal."],
        ["distinct", r`$${mat([
          [3, 1],
          [0, 4],
        ])}$`, "Two distinct eigenvalues, so diagonalizable."],
      ],
      correct: "shear",
      hint: "Repeated eigenvalue with a one-dimensional eigenspace.",
      explanation: r`$${mat([
        [3, 1],
        [0, 3],
      ])}$ has eigenvalue $3$ twice but $A - 3I$ has rank 1, so only one eigenvector direction.`,
      tags: ["diagonalization"],
    }),
    numeric("p-power", {
      question: r`$A = PDP^{-1}$ with $D = \operatorname{diag}(2, -1)$. What is the $(1,1)$ entry of $D^6$?`,
      answer: 64,
      hint: "Powers of a diagonal matrix.",
      explanation: r`$2^6 = 64$ (and $(-1)^6 = 1$).`,
      tags: ["diagonalization"],
    }),
    tf("p-tf-similar", {
      statement: r`If $B = P^{-1}AP$, then $A$ and $B$ have the same eigenvalues.`,
      answer: true,
      hint: "Similar matrices share the characteristic polynomial.",
      explanation: r`True — $\det(B - \lambda I) = \det(A - \lambda I)$.`,
      tags: ["similarity"],
    }),
    tf("p-tf-zero", {
      statement: r`If $0$ is an eigenvalue of $A$, then $\det A = 0$.`,
      answer: true,
      hint: "0 eigenvalue ⟺ singular.",
      explanation: r`True: $A - 0I = A$ is singular.`,
      tags: ["eigenvalues"],
    }),
    numeric("p-complex-modulus", {
      question: r`A real matrix has eigenvalue $3 - 4i$. What is $|\lambda|$?`,
      answer: 5,
      hint: "√(a² + b²).",
      explanation: r`$\sqrt{9 + 16} = 5$.`,
      tags: ["complex-eigenvalues"],
    }),
    matrix("p-t-matrix", {
      question: r`$T(\mathbf{x}) = ${mat([
        [2, 0],
        [0, -1],
      ])}\mathbf{x}$ and $\mathcal{B} = \{\mathbf{e}_2, \mathbf{e}_1\}$ (standard vectors in reverse order). Find $[T]_{\mathcal{B}}$.`,
      answer: [
        [-1, 0],
        [0, 2],
      ],
      hint: "Columns are [T(e₂)]_B then [T(e₁)]_B.",
      explanation: r`$T(\mathbf{e}_2) = -\mathbf{e}_2 \mapsto (-1, 0)$ and $T(\mathbf{e}_1) = 2\mathbf{e}_1 \mapsto (0, 2)$ in the reordered basis.`,
      tags: ["matrix-of-transformation"],
    }),
  ],
  generators: ["gen.eigen-2x2"],
};
