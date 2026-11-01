import type { Unit } from "../types";
import { lesson, mat, matrix, mc, numeric, r, reading, tf } from "../dsl";

/* ------------------------------------------------------------------ */
/* Lesson 1 · Diagonalization of symmetric matrices (Lay §7.1)          */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "u9-l1-symmetric-matrices",
    unitId: "u9",
    title: "Diagonalization of symmetric matrices",
    summary: "Symmetric matrices are the best-behaved of all: real eigenvalues, orthogonal eigenvectors, and A = PDPᵀ.",
    textbook: "Lay §7.1",
    minutes: 13,
  },
  [
    reading(
      "theorems",
      r`A matrix is **symmetric** if $A^T = A$. Symmetric matrices have exceptional eigenvalue structure:

- **Theorem 1.** If $A$ is symmetric, eigenvectors from *different* eigenspaces are **orthogonal**. (Proof idea: $\lambda_1\mathbf{v}_1\cdot\mathbf{v}_2 = (A\mathbf{v}_1)^T\mathbf{v}_2 = \mathbf{v}_1^TA\mathbf{v}_2 = \lambda_2\mathbf{v}_1\cdot\mathbf{v}_2$, so $(\lambda_1 - \lambda_2)\mathbf{v}_1\cdot\mathbf{v}_2 = 0$.)
- A matrix is **orthogonally diagonalizable** if $A = PDP^{-1} = PDP^T$ with $P$ an **orthogonal** matrix (orthonormal columns, $P^{-1} = P^T$).
- **Spectral Theorem.** An $n \times n$ matrix is orthogonally diagonalizable **if and only if** it is symmetric. Moreover a symmetric matrix has $n$ real eigenvalues (counting multiplicity), each eigenspace has dimension equal to the algebraic multiplicity, and the eigenspaces are mutually orthogonal.

So for symmetric matrices you *always* get a full set of eigenvectors, and you can make them orthonormal: Gram–Schmidt within each eigenspace, normalize, and assemble $P$.

The picture shows $A = ${mat([
        [2, 1],
        [1, 2],
      ])}$: its two eigen-lines (teal) are perpendicular, and the unit square is stretched by $3$ along one and by $1$ along the other.`,
      {
        title: "Why symmetric matrices are special",
        visual: {
          kind: "transform",
          config: {
            matrix: [
              [2, 1],
              [1, 2],
            ],
            showEigen: true,
            showDet: false,
            shape: "square",
            range: 4,
          },
        },
      },
    ),
    numeric("eigenvalues", {
      question: r`What is the larger eigenvalue of $A = ${mat([
        [2, 1],
        [1, 2],
      ])}$?`,
      answer: 3,
      hint: r`$\lambda^2 - 4\lambda + 3 = 0$.`,
      explanation: r`$\operatorname{tr}A = 4$, $\det A = 3$: $(\lambda - 3)(\lambda - 1) = 0$, so the eigenvalues are $3$ and $1$ — both real, as the Spectral Theorem promises.`,
      tags: ["symmetric"],
    }),
    matrix("unit-eigenvector", {
      question: r`Find the **unit** eigenvector of $A$ for $\lambda = 3$ with positive entries. (Type entries like \`1/sqrt(2)\`.)`,
      answer: [[Math.SQRT1_2], [Math.SQRT1_2]],
      answerDisplay: "\\begin{bmatrix} 1/\\sqrt{2} \\\\ 1/\\sqrt{2} \\end{bmatrix}",
      hint: r`$A - 3I = ${mat([
        [-1, 1],
        [1, -1],
      ])}$ gives $x_1 = x_2$. Normalize $(1, 1)$.`,
      explanation: r`The eigenspace is $\operatorname{Span}\{(1, 1)\}$; normalizing gives $\tfrac{1}{\sqrt2}(1, 1)$. For $\lambda = 1$ the eigenspace is $\operatorname{Span}\{(1, -1)\}$ — orthogonal to the first, exactly as Theorem 1 says.`,
      tags: ["symmetric"],
    }),
    matrix("build-p", {
      question: r`Build the orthogonal matrix $P$ for $A = PDP^T$ with $D = \operatorname{diag}(3, 1)$, using unit eigenvectors whose **first entries are positive**.`,
      answer: [
        [Math.SQRT1_2, Math.SQRT1_2],
        [Math.SQRT1_2, -Math.SQRT1_2],
      ],
      answerDisplay: "\\tfrac{1}{\\sqrt{2}}\\begin{bmatrix} 1 & 1 \\\\ 1 & -1 \\end{bmatrix}",
      hint: "Column 1 is the unit eigenvector for 3, column 2 the unit eigenvector for 1.",
      explanation: r`$P = \tfrac{1}{\sqrt2}${mat([
        [1, 1],
        [1, -1],
      ])}$. Its columns are orthonormal, so $P^{-1} = P^T$ and $A = PDP^T$ — no inverse to compute.`,
      tags: ["symmetric"],
    }),
    mc("which-orthogonally-diag", {
      question: r`Which matrix is orthogonally diagonalizable?`,
      choices: [
        ["sym", r`$${mat([
          [1, 2],
          [2, 5],
        ])}$`, undefined],
        ["tri", r`$${mat([
          [1, 2],
          [0, 5],
        ])}$`, "Diagonalizable (distinct eigenvalues), but not *orthogonally*: it isn't symmetric."],
        ["rot", r`$${mat([
          [0, -1],
          [1, 0],
        ])}$`, "No real eigenvectors at all — and it isn't symmetric."],
        ["shear", r`$${mat([
          [1, 1],
          [0, 1],
        ])}$`, "Not even diagonalizable."],
      ],
      correct: "sym",
      hint: "Spectral Theorem: orthogonally diagonalizable ⟺ symmetric.",
      explanation: r`Only $${mat([
        [1, 2],
        [2, 5],
      ])}$ is symmetric, so only it is orthogonally diagonalizable. The triangular matrix is diagonalizable, but its eigenvectors $(1, 0)$ and $(1, 2)$ aren't orthogonal, so no orthogonal $P$ exists.`,
      tags: ["symmetric"],
    }),
    numeric("eigenspace-dim", {
      question: r`$A = ${mat([
        [2, 0, 0],
        [0, 3, 1],
        [0, 1, 3],
      ])}$ is symmetric with characteristic polynomial $(2 - \lambda)^2(4 - \lambda)$. What is the dimension of the eigenspace for $\lambda = 2$?`,
      answer: 2,
      hint: "For symmetric matrices, each eigenspace dimension equals the algebraic multiplicity.",
      explanation: r`Multiplicity $2$ ⟹ dimension $2$ (symmetric matrices never fall short). Concretely $A - 2I = ${mat([
        [0, 0, 0],
        [0, 1, 1],
        [0, 1, 1],
      ])}$ has rank 1, so its null space is 2-dimensional, spanned by $(1, 0, 0)$ and $(0, 1, -1)$ — already orthogonal.`,
      tags: ["symmetric"],
    }),
    tf("symmetric-diagonalizable", {
      statement: "Every symmetric matrix is diagonalizable.",
      answer: true,
      feedback: "Spectral Theorem.",
      hint: "Spectral Theorem — even orthogonally.",
      explanation: r`True: symmetric ⟹ orthogonally diagonalizable ⟹ diagonalizable. The shear counterexamples from Unit 7 are never symmetric.`,
      tags: ["symmetric"],
    }),
    tf("orth-diag-symmetric", {
      statement: r`If $A$ is orthogonally diagonalizable, then $A$ is symmetric.`,
      answer: true,
      feedback: r`Transpose $A = PDP^T$.`,
      hint: r`$(PDP^T)^T = ?$`,
      explanation: r`True: $A^T = (PDP^T)^T = (P^T)^TD^TP^T = PDP^T = A$. This is the easy direction of the Spectral Theorem.`,
      tags: ["symmetric"],
    }),
    tf("complex-eigen", {
      statement: "A real symmetric matrix can have a non-real complex eigenvalue.",
      answer: false,
      feedback: "All eigenvalues of a symmetric matrix are real.",
      hint: "Spectral Theorem, part (a).",
      explanation: r`False — every eigenvalue of a real symmetric matrix is real. (For an $n \times n$ symmetric matrix there are $n$ of them, counting multiplicity.)`,
      tags: ["symmetric"],
    }),
    reading(
      "spectral-decomposition",
      r`Writing out $A = PDP^T$ column by column gives the **spectral decomposition**

$$A = \lambda_1\mathbf{u}_1\mathbf{u}_1^T + \lambda_2\mathbf{u}_2\mathbf{u}_2^T + \cdots + \lambda_n\mathbf{u}_n\mathbf{u}_n^T.$$

Each $\mathbf{u}_i\mathbf{u}_i^T$ is the matrix of the projection onto the line through $\mathbf{u}_i$, so a symmetric matrix is a weighted sum of orthogonal projections: project onto each eigen-direction, scale by $\lambda_i$, add up. That picture is the key to quadratic forms and to the SVD.

**What you did:** found orthonormal eigenvectors, assembled $P$, and used the Spectral Theorem to reason about eigenspaces.`,
      { title: "Spectral decomposition and summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · The singular value decomposition (Lay §7.4)               */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "u9-l2-svd",
    unitId: "u9",
    title: "The singular value decomposition",
    summary: "Every matrix stretches the unit sphere into an ellipsoid. Singular values, rank, and A = UΣVᵀ.",
    textbook: "Lay §7.4",
    minutes: 13,
  },
  [
    reading(
      "singular-values",
      r`Diagonalization needs a square matrix with enough eigenvectors. The SVD works for **any** $m \times n$ matrix $A$. The trick: $A^TA$ is symmetric ($n \times n$) with nonnegative eigenvalues $\lambda_1 \ge \cdots \ge \lambda_n \ge 0$ (since $\mathbf{v}^TA^TA\mathbf{v} = \|A\mathbf{v}\|^2 \ge 0$). The **singular values** of $A$ are

$$\sigma_i = \sqrt{\lambda_i}, \qquad i = 1, \dots, n.$$

If $\mathbf{v}_i$ are orthonormal eigenvectors of $A^TA$, then $\|A\mathbf{v}_i\| = \sigma_i$ and the vectors $A\mathbf{v}_i$ are orthogonal. Geometrically, $A$ maps the unit sphere to an ellipsoid whose semi-axes have lengths $\sigma_1 \ge \sigma_2 \ge \cdots$ — $\sigma_1$ is the **largest stretch** $\max_{\|\mathbf{x}\| = 1}\|A\mathbf{x}\|$.

**Theorem.** The number of nonzero singular values equals $\operatorname{rank}A$.`,
      { title: "Singular values" },
    ),
    numeric("sv-diagonal", {
      question: r`What is the largest singular value of $A = ${mat([
        [3, 0],
        [0, -2],
      ])}$?`,
      answer: 3,
      hint: r`$A^TA = \operatorname{diag}(9, 4)$.`,
      explanation: r`$A^TA = ${mat([
        [9, 0],
        [0, 4],
      ])}$ has eigenvalues $9, 4$, so $\sigma_1 = 3$, $\sigma_2 = 2$. Singular values are never negative — the sign of $-2$ is absorbed into $U$.`,
      tags: ["svd"],
    }),
    numeric("sv-rank-one", {
      question: r`Find the largest singular value of $A = ${mat([
        [1, 1],
        [0, 0],
      ])}$.`,
      answer: Math.SQRT2,
      answerDisplay: "\\sqrt{2}",
      hint: r`$A^TA = ${mat([
        [1, 1],
        [1, 1],
      ])}$ has eigenvalues $2$ and $0$. Type \`sqrt(2)\`.`,
      explanation: r`$A^TA = ${mat([
        [1, 1],
        [1, 1],
      ])}$, eigenvalues $2, 0$, so $\sigma_1 = \sqrt2$ and $\sigma_2 = 0$. Check: $A\tfrac{1}{\sqrt2}(1, 1) = (\sqrt2, 0)$ has length $\sqrt2$ ✓.`,
      tags: ["svd"],
    }),
    numeric("rank-from-sv", {
      question: r`How many **nonzero** singular values does that matrix $${mat([
        [1, 1],
        [0, 0],
      ])}$ have — and therefore what is its rank?`,
      answer: 1,
      hint: "Count the nonzero σ's.",
      explanation: r`Only $\sigma_1 = \sqrt2$ is nonzero, so $\operatorname{rank}A = 1$, matching the single pivot column.`,
      tags: ["svd"],
    }),
    mc("rank-4x3", {
      question: r`$A$ is $4 \times 3$ with singular values $5, 3, 0$. What is $\operatorname{rank}A$?`,
      choices: [
        ["two", r`$2$`, undefined],
        ["three", r`$3$`, "Only the *nonzero* singular values count."],
        ["four", r`$4$`, "Rank can't exceed the number of columns, 3."],
      ],
      correct: "two",
      hint: "Nonzero singular values = rank.",
      explanation: r`Two nonzero singular values, so $\operatorname{rank}A = 2$: $\operatorname{Col}A$ is a plane inside $\mathbb{R}^4$, and $\dim\operatorname{Nul}A = 3 - 2 = 1$.`,
      tags: ["svd"],
    }),
    numeric("sv-nondiag", {
      question: r`Find the largest singular value of $A = ${mat([
        [2, 2],
        [-1, 1],
      ])}$.`,
      answer: Math.sqrt(8),
      answerDisplay: "2\\sqrt{2}",
      hint: r`$A^TA = ${mat([
        [5, 3],
        [3, 5],
      ])}$; its eigenvalues are $5 \pm 3$. Type \`sqrt(8)\` or \`2sqrt(2)\`.`,
      explanation: r`$A^TA = ${mat([
        [5, 3],
        [3, 5],
      ])}$ has eigenvalues $8$ and $2$, so $\sigma_1 = \sqrt8 = 2\sqrt2 \approx 2.83$ and $\sigma_2 = \sqrt2$. The unit circle becomes an ellipse with semi-axes $2\sqrt2$ and $\sqrt2$.`,
      tags: ["svd"],
    }),
    reading(
      "decomposition",
      r`**The SVD.** Any $m \times n$ matrix of rank $r$ can be written

$$A = U\Sigma V^T,$$

with $U$ ($m \times m$) and $V$ ($n \times n$) **orthogonal** and $\Sigma$ ($m \times n$) having $\sigma_1 \ge \cdots \ge \sigma_r > 0$ on its diagonal and zeros elsewhere. The columns of $V$ are the orthonormal eigenvectors $\mathbf{v}_i$ of $A^TA$ (**right singular vectors**); the first $r$ columns of $U$ are $\mathbf{u}_i = A\mathbf{v}_i/\sigma_i$ (**left singular vectors**), extended to an orthonormal basis of $\mathbb{R}^m$.

Read it as three moves: $V^T$ rotates (no stretching), $\Sigma$ stretches each axis by $\sigma_i$, $U$ rotates again. Also: $\{\mathbf{u}_1, \dots, \mathbf{u}_r\}$ is an orthonormal basis for $\operatorname{Col}A$ and $\{\mathbf{v}_{r+1}, \dots, \mathbf{v}_n\}$ one for $\operatorname{Nul}A$.`,
      { title: "A = UΣVᵀ" },
    ),
    matrix("sigma", {
      question: r`Write $\Sigma$ in the SVD of $A = ${mat([
        [3, 0],
        [0, -2],
      ])}$.`,
      answer: [
        [3, 0],
        [0, 2],
      ],
      hint: "Σ is diagonal with the singular values in decreasing order — all nonnegative.",
      explanation: r`$\Sigma = ${mat([
        [3, 0],
        [0, 2],
      ])}$. One valid SVD is $U = ${mat([
        [1, 0],
        [0, -1],
      ])}$, $V = I$: the sign lives in $U$.`,
      tags: ["svd"],
    }),
    mc("max-stretch", {
      question: r`For a $2 \times 2$ matrix $A$, the maximum of $\|A\mathbf{x}\|$ over all unit vectors $\mathbf{x}$ equals…`,
      choices: [
        ["sigma1", r`$\sigma_1$, the largest singular value.`, undefined],
        ["lambda1", "the largest eigenvalue of A.", "Eigenvalues can be complex or negative, and for non-symmetric $A$ they don't measure stretching. Try the shear $\\begin{bmatrix}1&1\\\\0&1\\end{bmatrix}$: eigenvalue 1, yet it stretches some vectors."],
        ["det", r`$|\det A|$.`, "The determinant measures area scaling, not the biggest single stretch."],
      ],
      correct: "sigma1",
      hint: "The unit circle maps to an ellipse; what's its longest semi-axis?",
      explanation: r`$\|A\mathbf{x}\|^2 = \mathbf{x}^TA^TA\mathbf{x}$ is maximised over unit vectors at the top eigenvector of $A^TA$, giving $\lambda_1 = \sigma_1^2$. So the largest stretch is $\sigma_1$, attained at $\mathbf{x} = \mathbf{v}_1$.`,
      tags: ["svd"],
    }),
    tf("sv-are-eigenvalues", {
      statement: r`The singular values of $A$ are the eigenvalues of $A$.`,
      answer: false,
      feedback: "They're the square roots of the eigenvalues of AᵀA.",
      hint: r`$${mat([
        [1, 1],
        [0, 0],
      ])}$ has eigenvalues $1, 0$ but singular values $\sqrt2, 0$.`,
      explanation: r`False. Singular values are $\sqrt{\text{eigenvalues of }A^TA}$. For a symmetric matrix they are the *absolute values* of its eigenvalues; for a general matrix there's no simple relation.`,
      tags: ["svd"],
    }),
    tf("transpose-sv", {
      statement: r`$A$ and $A^T$ have the same nonzero singular values.`,
      answer: true,
      feedback: r`Transpose $A = U\Sigma V^T$ to get $A^T = V\Sigma^TU^T$.`,
      hint: r`$A^T = V\Sigma^TU^T$ is an SVD of $A^T$.`,
      explanation: r`True: $A^T = V\Sigma^TU^T$ is an SVD of $A^T$ with the same diagonal entries. (Equivalently, $AA^T$ and $A^TA$ share their nonzero eigenvalues.)`,
      tags: ["svd"],
    }),
    reading(
      "summary",
      r`**What you did:** computed singular values from $A^TA$, read rank off them, built $\Sigma$, and interpreted $\sigma_1$ as the maximal stretch.

**Remember:** $\sigma_i = \sqrt{\lambda_i(A^TA)}$; #nonzero $\sigma_i$ = rank; $A = U\Sigma V^T$ = rotate, stretch, rotate. The ratio $\sigma_1/\sigma_r$ (the condition number) tells you how numerically sensitive $A\mathbf{x} = \mathbf{b}$ is.

That's the end of the linear algebra half of Math 54. Take the Level Check, then keep the Review page in rotation until the exam.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit                                                                */
/* ------------------------------------------------------------------ */

export const unit9: Unit = {
  id: "u9",
  title: "Symmetric matrices and the SVD",
  subtitle: "The spectral theorem and singular values",
  description: "Orthogonal diagonalization of symmetric matrices and the singular value decomposition.",
  textbook: "Lay §7.1, 7.4",
  lessons: [l1, l2],
  practice: [
    numeric("p-sym-eigen", {
      question: r`What is the smaller eigenvalue of $${mat([
        [5, 2],
        [2, 5],
      ])}$?`,
      answer: 3,
      hint: "λ² − 10λ + 21.",
      explanation: r`$(\lambda - 7)(\lambda - 3)$: eigenvalues $7$ and $3$.`,
      tags: ["symmetric"],
    }),
    mc("p-orthogonal-eigvecs", {
      question: r`$A$ is symmetric with eigenvectors $\mathbf{v}_1$ (for $\lambda = 7$) and $\mathbf{v}_2$ (for $\lambda = 3$). Then $\mathbf{v}_1\cdot\mathbf{v}_2$ equals…`,
      choices: [
        ["zero", r`$0$`],
        ["unknown", "it can't be determined.", "Symmetric matrices force eigenvectors of different eigenvalues to be orthogonal."],
        ["product", r`$21$`, "Eigenvalues don't multiply into dot products."],
      ],
      correct: "zero",
      hint: "Theorem 1 of §7.1.",
      explanation: r`Eigenvectors of a symmetric matrix belonging to distinct eigenvalues are orthogonal.`,
      tags: ["symmetric"],
    }),
    tf("p-tf-spectral", {
      statement: r`If $A$ is $n \times n$ and symmetric, then $A$ has $n$ real eigenvalues, counting multiplicity.`,
      answer: true,
      hint: "Spectral Theorem.",
      explanation: r`True.`,
      tags: ["symmetric"],
    }),
    tf("p-tf-diag-sym", {
      statement: r`If $A$ is diagonalizable, then $A$ is symmetric.`,
      answer: false,
      hint: r`$\begin{bmatrix}1&2\\0&5\end{bmatrix}$.`,
      explanation: r`False: $${mat([
        [1, 2],
        [0, 5],
      ])}$ is diagonalizable (distinct eigenvalues) but not symmetric. Only *orthogonal* diagonalizability forces symmetry.`,
      tags: ["symmetric"],
    }),
    numeric("p-singular-value", {
      question: r`What is the largest singular value of $${mat([
        [0, 4],
        [-3, 0],
      ])}$?`,
      answer: 4,
      hint: "AᵀA = diag(9, 16).",
      explanation: r`$A^TA = ${mat([
        [9, 0],
        [0, 16],
      ])}$, so $\sigma_1 = 4$, $\sigma_2 = 3$.`,
      tags: ["svd"],
    }),
    numeric("p-rank-sv", {
      question: r`A $5 \times 5$ matrix has singular values $9, 4, 4, 0, 0$. What is its rank?`,
      answer: 3,
      hint: "Count nonzero singular values.",
      explanation: r`Three nonzero singular values ⟹ rank $3$.`,
      tags: ["svd"],
    }),
    matrix("p-sigma", {
      question: r`Write $\Sigma$ for a $2 \times 2$ matrix with singular values $\sigma_1 = 5$, $\sigma_2 = 1$.`,
      answer: [
        [5, 0],
        [0, 1],
      ],
      hint: "Diagonal, decreasing.",
      explanation: r`$\Sigma = \operatorname{diag}(5, 1)$.`,
      tags: ["svd"],
    }),
    tf("p-tf-ata", {
      statement: r`For any matrix $A$, the eigenvalues of $A^TA$ are all nonnegative.`,
      answer: true,
      hint: "vᵀAᵀAv = ‖Av‖².",
      explanation: r`True: for a unit eigenvector $\mathbf{v}$, $\lambda = \mathbf{v}^TA^TA\mathbf{v} = \|A\mathbf{v}\|^2 \ge 0$.`,
      tags: ["svd"],
    }),
  ],
  generators: ["gen.singular-values"],
};
