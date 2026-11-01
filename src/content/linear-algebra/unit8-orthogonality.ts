import type { Unit } from "../types";
import { goal, lesson, mat, matrix, mc, numeric, order, r, reading, tf, vec } from "../dsl";

/* ------------------------------------------------------------------ */
/* Lesson 1 · Inner product, length, orthogonality (Lay §6.1)           */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "u8-l1-inner-product-length-orthogonality",
    unitId: "u8",
    title: "Inner product, length and orthogonality",
    summary: "The dot product gives lengths, distances and right angles. Orthogonal complements and how they relate to Nul A.",
    textbook: "Lay §6.1",
    minutes: 13,
  },
  [
    reading(
      "dot",
      r`For $\mathbf{u}, \mathbf{v} \in \mathbb{R}^n$ the **inner product** (dot product) is

$$\mathbf{u}\cdot\mathbf{v} = \mathbf{u}^T\mathbf{v} = u_1v_1 + u_2v_2 + \cdots + u_nv_n.$$

It is symmetric ($\mathbf{u}\cdot\mathbf{v} = \mathbf{v}\cdot\mathbf{u}$), linear in each slot, and $\mathbf{u}\cdot\mathbf{u} \ge 0$ with equality only for $\mathbf{u} = \mathbf{0}$. From it:

- **length** $\|\mathbf{v}\| = \sqrt{\mathbf{v}\cdot\mathbf{v}}$, with $\|c\mathbf{v}\| = |c|\,\|\mathbf{v}\|$;
- a **unit vector** in the direction of $\mathbf{v}$: $\mathbf{v}/\|\mathbf{v}\|$ (**normalizing**);
- **distance** $\operatorname{dist}(\mathbf{u}, \mathbf{v}) = \|\mathbf{u} - \mathbf{v}\|$;
- **orthogonal** means $\mathbf{u}\cdot\mathbf{v} = 0$, and then the Pythagorean theorem holds: $\|\mathbf{u} + \mathbf{v}\|^2 = \|\mathbf{u}\|^2 + \|\mathbf{v}\|^2$.

Drag the vectors below and watch $\mathbf{u}\cdot\mathbf{v}$: positive when they point roughly the same way, negative when opposite, zero at a right angle.`,
      {
        title: "The dot product",
        visual: {
          kind: "vectors",
          config: {
            vectors: [
              { id: "u", x: 3, y: 1, color: "blue", label: "u", draggable: true },
              { id: "v", x: 1, y: 2, color: "orange", label: "v", draggable: true },
            ],
            show: ["dot"],
          },
        },
      },
    ),
    numeric("compute-dot", {
      question: r`Compute $\mathbf{u}\cdot\mathbf{v}$ for $\mathbf{u} = ${vec(2, -1, 3)}$ and $\mathbf{v} = ${vec(1, 4, -2)}$.`,
      answer: -8,
      hint: "Multiply matching entries, then add.",
      explanation: r`$2(1) + (-1)(4) + 3(-2) = 2 - 4 - 6 = -8$. Negative: the vectors point more against each other than with.`,
      tags: ["dot-product"],
    }),
    numeric("length", {
      question: r`Find $\|\mathbf{v}\|$ for $\mathbf{v} = ${vec(2, -2, 1)}$.`,
      answer: 3,
      hint: r`$\|\mathbf{v}\| = \sqrt{\mathbf{v}\cdot\mathbf{v}}$.`,
      explanation: r`$\mathbf{v}\cdot\mathbf{v} = 4 + 4 + 1 = 9$, so $\|\mathbf{v}\| = 3$.`,
      tags: ["length"],
    }),
    matrix("unit-vector", {
      question: r`Find the unit vector in the direction of $${vec(3, 4)}$.`,
      answer: [[0.6], [0.8]],
      hint: "Divide by the length.",
      explanation: r`$\|(3, 4)\| = 5$, so the unit vector is $\tfrac15${vec(3, 4)} = ${vec("3/5", "4/5")}$. Same direction, length $1$.`,
      tags: ["length"],
    }),
    numeric("orthogonal-k", {
      question: r`For which $k$ are $${vec(1, 2, "k")}$ and $${vec(3, -1, 2)}$ orthogonal?`,
      answer: -0.5,
      prefix: "k =",
      hint: "Set the dot product to zero and solve.",
      explanation: r`$3 - 2 + 2k = 0$ gives $k = -\tfrac12$.`,
      tags: ["orthogonality"],
    }),
    numeric("distance", {
      question: r`Find the distance between $${vec(1, 2)}$ and $${vec(4, 6)}$.`,
      answer: 5,
      hint: r`$\operatorname{dist} = \|\mathbf{u} - \mathbf{v}\|$.`,
      explanation: r`$\mathbf{u} - \mathbf{v} = (-3, -4)$, with length $\sqrt{9 + 16} = 5$.`,
      tags: ["length"],
    }),
    goal("make-orthogonal", {
      question: r`$\mathbf{u} = ${vec(3, 1)}$ is fixed. Drag $\mathbf{v}$ so that $\mathbf{u}$ and $\mathbf{v}$ are **orthogonal** (watch the dot product readout).`,
      visual: {
        kind: "vectors",
        config: {
          vectors: [
            { id: "u", x: 3, y: 1, color: "blue", label: "u" },
            { id: "v", x: 2, y: 2, color: "orange", label: "v", draggable: true },
          ],
          show: ["dot"],
          goal: { type: "orthogonal-to", id: "v", to: "u" },
        },
      },
      hint: r`You need $3v_1 + v_2 = 0$. Swap the entries of $\mathbf{u}$ and flip one sign.`,
      explanation: r`Any nonzero multiple of $(-1, 3)$ works, e.g. $(-1, 3)$ or $(1, -3)$: $3(-1) + 1(3) = 0$. In $\mathbb{R}^2$ the vectors orthogonal to $\mathbf{u}$ form a line — the orthogonal complement of $\operatorname{Span}\{\mathbf{u}\}$.`,
      tags: ["orthogonality", "geometry"],
    }),
    reading(
      "complement",
      r`If $W$ is a subspace of $\mathbb{R}^n$, the set of all vectors orthogonal to **every** vector in $W$ is the **orthogonal complement** $W^\perp$ ("W perp"). Facts:

- $\mathbf{x} \in W^\perp$ ⟺ $\mathbf{x}$ is orthogonal to every vector in a *spanning set* of $W$ (no need to check all of $W$);
- $W^\perp$ is a subspace of $\mathbb{R}^n$;
- for any $m \times n$ matrix, $(\operatorname{Row}A)^\perp = \operatorname{Nul}A$ and $(\operatorname{Col}A)^\perp = \operatorname{Nul}A^T$.

The first of these is just $A\mathbf{x} = \mathbf{0}$ read as "each row dotted with $\mathbf{x}$ is $0$".`,
      { title: "Orthogonal complements" },
    ),
    mc("complement-of-line", {
      question: r`Let $W = \operatorname{Span}\left\{${vec(1, 1, 0)}\right\}$ in $\mathbb{R}^3$. What is $W^\perp$?`,
      choices: [
        ["plane", r`The plane $x_1 + x_2 = 0$, i.e. all vectors $${vec("a", "-a", "b")}$.`, undefined],
        ["line", r`The line through $${vec(1, -1, 0)}$.`, "That line is orthogonal to $W$, but so is every vector with $x_1 + x_2 = 0$ — including $(0, 0, 1)$."],
        ["same", r`All vectors $${vec("a", "a", "b")}$.`, "$(1, 1, 0)\\cdot(a, a, b) = 2a \\neq 0$ unless $a = 0$."],
        ["zero", r`$\{\mathbf{0}\}$.`, "$(0, 0, 1)$ is a nonzero vector orthogonal to $(1, 1, 0)$."],
      ],
      correct: "plane",
      hint: r`$\mathbf{x} \in W^\perp$ ⟺ $\mathbf{x}\cdot(1, 1, 0) = 0$ ⟺ $x_1 + x_2 = 0$.`,
      explanation: r`The condition is $x_1 + x_2 = 0$ with $x_3$ free: a plane through the origin, spanned by $(1, -1, 0)$ and $(0, 0, 1)$. Dimensions add up: $1 + 2 = 3$.`,
      tags: ["orthogonal-complement"],
    }),
    tf("basis-enough", {
      statement: r`If $\mathbf{x}$ is orthogonal to every vector in a basis of $W$, then $\mathbf{x} \in W^\perp$.`,
      answer: true,
      feedback: "Every vector of W is a combination of basis vectors — use linearity of the dot product.",
      hint: r`$\mathbf{x}\cdot(c_1\mathbf{w}_1 + \cdots + c_p\mathbf{w}_p) = c_1(\mathbf{x}\cdot\mathbf{w}_1) + \cdots$`,
      explanation: r`True: any $\mathbf{w} \in W$ is $\sum c_i\mathbf{w}_i$, so $\mathbf{x}\cdot\mathbf{w} = \sum c_i(\mathbf{x}\cdot\mathbf{w}_i) = 0$. Checking a spanning set suffices.`,
      tags: ["orthogonal-complement"],
    }),
    tf("col-perp", {
      statement: r`For any matrix $A$, $(\operatorname{Col}A)^\perp = \operatorname{Nul}A$.`,
      answer: false,
      feedback: "Which space is orthogonal to the columns — the null space of A or of Aᵀ?",
      hint: r`A vector orthogonal to every column of $A$ satisfies $A^T\mathbf{x} = \mathbf{0}$.`,
      explanation: r`False. $\mathbf{x} \perp$ every column of $A$ ⟺ $A^T\mathbf{x} = \mathbf{0}$, so $(\operatorname{Col}A)^\perp = \operatorname{Nul}A^T$. It is $(\operatorname{Row}A)^\perp$ that equals $\operatorname{Nul}A$.`,
      tags: ["orthogonal-complement"],
    }),
    reading(
      "summary",
      r`**What you did:** computed dot products, lengths, unit vectors and distances, built an orthogonal vector by hand, and identified an orthogonal complement.

**Remember:** $\|\mathbf{v}\|^2 = \mathbf{v}\cdot\mathbf{v}$; orthogonal ⟺ dot product $0$; $(\operatorname{Row}A)^\perp = \operatorname{Nul}A$, $(\operatorname{Col}A)^\perp = \operatorname{Nul}A^T$.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Orthogonal sets (Lay §6.2)                                */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "u8-l2-orthogonal-sets",
    unitId: "u8",
    title: "Orthogonal sets and projections onto lines",
    summary: "Orthogonal bases make coordinates a one-line formula. Projecting onto a line, orthonormal sets, and matrices with orthonormal columns.",
    textbook: "Lay §6.2",
    minutes: 13,
  },
  [
    reading(
      "orthogonal-sets",
      r`A set $\{\mathbf{u}_1, \dots, \mathbf{u}_p\}$ is **orthogonal** if every pair is orthogonal: $\mathbf{u}_i\cdot\mathbf{u}_j = 0$ for $i \neq j$. An orthogonal set of **nonzero** vectors is automatically linearly independent, so it's a basis for the subspace it spans — an **orthogonal basis**.

The payoff: coordinates become a formula instead of a system. If $\{\mathbf{u}_1, \dots, \mathbf{u}_p\}$ is an orthogonal basis for $W$ and $\mathbf{y} \in W$, then

$$\mathbf{y} = c_1\mathbf{u}_1 + \cdots + c_p\mathbf{u}_p, \qquad c_j = \frac{\mathbf{y}\cdot\mathbf{u}_j}{\mathbf{u}_j\cdot\mathbf{u}_j}.$$

(Dot both sides with $\mathbf{u}_j$; every other term dies.)`,
      { title: "Orthogonal bases" },
    ),
    mc("is-orthogonal-set", {
      question: r`Is $\left\{${vec(1, 1, 0)}, ${vec(1, -1, 0)}, ${vec(0, 0, 1)}\right\}$ an orthogonal set?`,
      choices: [
        ["yes", "Yes — all three pairwise dot products are 0.", undefined],
        ["no", "No — the first two vectors share nonzero entries.", "Sharing entries doesn't matter; compute $(1, 1, 0)\\cdot(1, -1, 0)$."],
        ["partial", "Only the third vector is orthogonal to the others.", "Check the first pair: $1 - 1 + 0 = 0$."],
      ],
      correct: "yes",
      hint: "Three dot products to check.",
      explanation: r`$(1,1,0)\cdot(1,-1,0) = 0$, $(1,1,0)\cdot(0,0,1) = 0$, $(1,-1,0)\cdot(0,0,1) = 0$. An orthogonal set of three nonzero vectors in $\mathbb{R}^3$ — hence an orthogonal basis of $\mathbb{R}^3$.`,
      tags: ["orthogonal-sets"],
    }),
    matrix("weights", {
      question: r`Using that orthogonal basis $\mathbf{u}_1 = ${vec(1, 1, 0)}$, $\mathbf{u}_2 = ${vec(1, -1, 0)}$, $\mathbf{u}_3 = ${vec(0, 0, 1)}$, find the weights $(c_1, c_2, c_3)$ with $\mathbf{y} = c_1\mathbf{u}_1 + c_2\mathbf{u}_2 + c_3\mathbf{u}_3$ for $\mathbf{y} = ${vec(3, 1, 2)}$.`,
      answer: [[2], [1], [2]],
      hint: r`$c_j = \dfrac{\mathbf{y}\cdot\mathbf{u}_j}{\mathbf{u}_j\cdot\mathbf{u}_j}$ — no row reduction needed.`,
      explanation: r`$c_1 = \tfrac{3 + 1}{2} = 2$, $c_2 = \tfrac{3 - 1}{2} = 1$, $c_3 = \tfrac{2}{1} = 2$. Check: $2(1,1,0) + 1(1,-1,0) + 2(0,0,1) = (3, 1, 2)$ ✓.`,
      tags: ["orthogonal-sets"],
    }),
    reading(
      "projection-line",
      r`One term of that formula is already important on its own. For a nonzero $\mathbf{u}$, the **orthogonal projection of $\mathbf{y}$ onto the line through $\mathbf{u}$** is

$$\hat{\mathbf{y}} = \operatorname{proj}_{\mathbf{u}}\mathbf{y} = \frac{\mathbf{y}\cdot\mathbf{u}}{\mathbf{u}\cdot\mathbf{u}}\,\mathbf{u},$$

and $\mathbf{z} = \mathbf{y} - \hat{\mathbf{y}}$ is orthogonal to $\mathbf{u}$ — the **component of $\mathbf{y}$ orthogonal to $\mathbf{u}$**. So $\mathbf{y} = \hat{\mathbf{y}} + \mathbf{z}$ splits $\mathbf{y}$ into a piece along $\mathbf{u}$ and a piece perpendicular to it. Drag $\mathbf{y}$ below.`,
      {
        title: "Projection onto a line",
        visual: { kind: "projection", config: { y: [2, 4], u: [1, 1], range: 5 } },
      },
    ),
    matrix("project", {
      question: r`Find the projection of $\mathbf{y} = ${vec(2, 4)}$ onto the line through $\mathbf{u} = ${vec(1, 1)}$.`,
      answer: [[3], [3]],
      prefix: r`$\hat{\mathbf{y}} =$`,
      hint: r`$\mathbf{y}\cdot\mathbf{u} = 6$, $\mathbf{u}\cdot\mathbf{u} = 2$.`,
      explanation: r`$\hat{\mathbf{y}} = \tfrac{6}{2}${vec(1, 1)} = ${vec(3, 3)}$. The leftover $\mathbf{z} = (2, 4) - (3, 3) = (-1, 1)$ is indeed orthogonal to $(1, 1)$.`,
      tags: ["projection"],
    }),
    numeric("distance-to-line", {
      question: r`What is the distance from $\mathbf{y} = ${vec(2, 4)}$ to the line through $${vec(1, 1)}$?`,
      answer: Math.SQRT2,
      answerDisplay: "\\sqrt{2}",
      hint: r`The distance is $\|\mathbf{y} - \hat{\mathbf{y}}\|$, the length of the perpendicular component. Type \`sqrt(2)\` if needed.`,
      explanation: r`$\mathbf{z} = \mathbf{y} - \hat{\mathbf{y}} = (-1, 1)$ has length $\sqrt2$. The projection is the closest point on the line, so this is the distance.`,
      tags: ["projection"],
    }),
    reading(
      "orthonormal",
      r`An **orthonormal** set is an orthogonal set of **unit** vectors. With an orthonormal basis the weight formula simplifies to $c_j = \mathbf{y}\cdot\mathbf{u}_j$.

If the columns of an $m \times n$ matrix $U$ are orthonormal, then $U^TU = I_n$, and $U$ preserves geometry: $\|U\mathbf{x}\| = \|\mathbf{x}\|$ and $(U\mathbf{x})\cdot(U\mathbf{y}) = \mathbf{x}\cdot\mathbf{y}$. A **square** matrix with orthonormal columns is an **orthogonal matrix**; then $U^{-1} = U^T$ and its rows are orthonormal too. Rotations and reflections are orthogonal matrices.`,
      { title: "Orthonormal sets and orthogonal matrices" },
    ),
    mc("utu", {
      question: r`Let $U = \tfrac{1}{\sqrt2}${mat([
        [1, 1],
        [1, -1],
      ])}$. What is $U^TU$?`,
      choices: [
        ["identity", r`$I_2$ — the columns are orthonormal.`, undefined],
        ["half", r`$\tfrac12 I_2$`, "Each column has length $\\sqrt{(1/2) + (1/2)} = 1$, so the diagonal entries of $U^TU$ are $1$, not $\\tfrac12$."],
        ["u", r`$U$ itself.`, "Compute it: the off-diagonal entries are $(1\\cdot1 + 1\\cdot(-1))/2 = 0$."],
      ],
      correct: "identity",
      hint: "Entry (i, j) of UᵀU is column i dotted with column j.",
      explanation: r`Columns $\tfrac{1}{\sqrt2}(1, 1)$ and $\tfrac{1}{\sqrt2}(1, -1)$ are unit vectors with dot product $0$, so $U^TU = I$. $U$ is an orthogonal matrix (a reflection across the line at $22.5^\circ$), with $U^{-1} = U^T = U$.`,
      tags: ["orthonormal"],
    }),
    matrix("normalize", {
      question: r`Normalize $${vec(1, 1, 0)}$ to a unit vector. (Entries like \`sqrt(2)/2\` or \`1/sqrt(2)\` are accepted.)`,
      answer: [[Math.SQRT1_2], [Math.SQRT1_2], [0]],
      answerDisplay: "\\begin{bmatrix} 1/\\sqrt{2} \\\\ 1/\\sqrt{2} \\\\ 0 \\end{bmatrix}",
      hint: r`Divide by $\|(1, 1, 0)\| = \sqrt2$.`,
      explanation: r`$\tfrac{1}{\sqrt2}${vec(1, 1, 0)} = ${vec("1/\\sqrt2", "1/\\sqrt2", 0)} \approx (0.707, 0.707, 0)$. Normalizing each vector of an orthogonal basis gives an orthonormal basis.`,
      tags: ["orthonormal"],
    }),
    tf("orthogonal-independent", {
      statement: "An orthogonal set of nonzero vectors is linearly independent.",
      answer: true,
      feedback: r`Dot a dependence relation $c_1\mathbf{u}_1 + \cdots + c_p\mathbf{u}_p = \mathbf{0}$ with $\mathbf{u}_j$.`,
      hint: "Dotting with u_j isolates c_j(u_j · u_j).",
      explanation: r`True. Dotting $c_1\mathbf{u}_1 + \cdots + c_p\mathbf{u}_p = \mathbf{0}$ with $\mathbf{u}_j$ gives $c_j(\mathbf{u}_j\cdot\mathbf{u}_j) = 0$, and $\mathbf{u}_j \neq \mathbf{0}$ forces $c_j = 0$. (The word *nonzero* matters: any set containing $\mathbf{0}$ is dependent.)`,
      tags: ["orthogonal-sets"],
    }),
    tf("rows-orthonormal", {
      statement: "If a square matrix has orthonormal columns, then its rows are also orthonormal.",
      answer: true,
      feedback: r`$U^TU = I$ for a square $U$ means $U^T = U^{-1}$, so $UU^T = I$ too.`,
      hint: r`For square matrices, a one-sided inverse is two-sided.`,
      explanation: r`True. $U^TU = I$ makes $U^T$ the inverse of $U$, hence also $UU^T = I$, which says the rows of $U$ are orthonormal. (For a *non-square* $U$ with orthonormal columns, $UU^T \neq I$ in general.)`,
      tags: ["orthonormal"],
    }),
    reading(
      "summary",
      r`**What you did:** verified orthogonal sets, found coordinates with the dot-product formula, projected onto a line, normalized, and tested $U^TU = I$.

**Remember:** $c_j = \dfrac{\mathbf{y}\cdot\mathbf{u}_j}{\mathbf{u}_j\cdot\mathbf{u}_j}$; $\operatorname{proj}_{\mathbf{u}}\mathbf{y} = \dfrac{\mathbf{y}\cdot\mathbf{u}}{\mathbf{u}\cdot\mathbf{u}}\mathbf{u}$; orthonormal columns ⟹ $U^TU = I$.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Orthogonal projections (Lay §6.3)                         */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "u8-l3-orthogonal-projections",
    unitId: "u8",
    title: "Orthogonal projections",
    summary: "Projecting onto a whole subspace: the decomposition y = ŷ + z and the Best Approximation Theorem.",
    textbook: "Lay §6.3",
    minutes: 12,
  },
  [
    reading(
      "decomposition",
      r`**Orthogonal Decomposition Theorem.** Let $W$ be a subspace of $\mathbb{R}^n$ with an orthogonal basis $\{\mathbf{u}_1, \dots, \mathbf{u}_p\}$. Every $\mathbf{y} \in \mathbb{R}^n$ can be written **uniquely** as

$$\mathbf{y} = \hat{\mathbf{y}} + \mathbf{z}, \qquad \hat{\mathbf{y}} = \frac{\mathbf{y}\cdot\mathbf{u}_1}{\mathbf{u}_1\cdot\mathbf{u}_1}\mathbf{u}_1 + \cdots + \frac{\mathbf{y}\cdot\mathbf{u}_p}{\mathbf{u}_p\cdot\mathbf{u}_p}\mathbf{u}_p \in W, \quad \mathbf{z} \in W^\perp.$$

$\hat{\mathbf{y}} = \operatorname{proj}_W\mathbf{y}$ is the **orthogonal projection of $\mathbf{y}$ onto $W$** — the sum of the projections onto each basis direction. It does not depend on which orthogonal basis you used.

**Best Approximation Theorem.** $\hat{\mathbf{y}}$ is the point of $W$ closest to $\mathbf{y}$: $\|\mathbf{y} - \hat{\mathbf{y}}\| < \|\mathbf{y} - \mathbf{v}\|$ for every other $\mathbf{v} \in W$. So $\|\mathbf{y} - \hat{\mathbf{y}}\| = \|\mathbf{z}\|$ is the **distance** from $\mathbf{y}$ to $W$.`,
      { title: "y = ŷ + z" },
    ),
    matrix("project-plane", {
      question: r`$W = \operatorname{Span}\left\{${vec(1, 1, 0)}, ${vec(1, -1, 0)}\right\}$ (an orthogonal basis). Find $\operatorname{proj}_W\mathbf{y}$ for $\mathbf{y} = ${vec(3, 1, 5)}$.`,
      answer: [[3], [1], [0]],
      prefix: r`$\hat{\mathbf{y}} =$`,
      hint: "Add the two line projections. You computed these weights in the previous lesson.",
      explanation: r`$\hat{\mathbf{y}} = \tfrac{4}{2}${vec(1, 1, 0)} + \tfrac{2}{2}${vec(1, -1, 0)} = ${vec(3, 1, 0)}$. $W$ is the $x_1x_2$-plane, so projecting just drops the third coordinate — as it should.`,
      tags: ["projection"],
    }),
    numeric("distance-plane", {
      question: r`What is the distance from $\mathbf{y} = ${vec(3, 1, 5)}$ to that plane $W$?`,
      answer: 5,
      hint: r`$\|\mathbf{z}\|$ where $\mathbf{z} = \mathbf{y} - \hat{\mathbf{y}}$.`,
      explanation: r`$\mathbf{z} = (3, 1, 5) - (3, 1, 0) = (0, 0, 5)$, of length $5$.`,
      tags: ["projection"],
    }),
    matrix("project-tilted", {
      question: r`$W = \operatorname{Span}\{\mathbf{u}_1, \mathbf{u}_2\}$ with $\mathbf{u}_1 = ${vec(1, 2, 1)}$, $\mathbf{u}_2 = ${vec(-1, 0, 1)}$ (orthogonal — check!). Find $\operatorname{proj}_W\mathbf{y}$ for $\mathbf{y} = ${vec(2, 2, 6)}$.`,
      answer: [[0], [4], [4]],
      prefix: r`$\hat{\mathbf{y}} =$`,
      hint: r`$\mathbf{y}\cdot\mathbf{u}_1 = 12$, $\mathbf{u}_1\cdot\mathbf{u}_1 = 6$; $\mathbf{y}\cdot\mathbf{u}_2 = 4$, $\mathbf{u}_2\cdot\mathbf{u}_2 = 2$.`,
      explanation: r`$\hat{\mathbf{y}} = \tfrac{12}{6}${vec(1, 2, 1)} + \tfrac{4}{2}${vec(-1, 0, 1)} = ${vec(2, 4, 2)} + ${vec(-2, 0, 2)} = ${vec(0, 4, 4)}$. Check: $\mathbf{z} = (2, -2, 2)$ is orthogonal to both $\mathbf{u}_1$ ($2 - 4 + 2 = 0$) and $\mathbf{u}_2$ ($-2 + 0 + 2 = 0$) ✓.`,
      tags: ["projection"],
    }),
    numeric("distance-tilted", {
      question: r`What is the distance from $${vec(2, 2, 6)}$ to that subspace $W$?`,
      answer: Math.sqrt(12),
      answerDisplay: "2\\sqrt{3}",
      hint: r`$\|\mathbf{z}\|$ with $\mathbf{z} = (2, -2, 2)$. You can type \`sqrt(12)\` or \`2sqrt(3)\`.`,
      explanation: r`$\|\mathbf{z}\| = \sqrt{4 + 4 + 4} = \sqrt{12} = 2\sqrt3 \approx 3.46$.`,
      tags: ["projection"],
    }),
    mc("already-in-w", {
      question: r`If $\mathbf{y}$ is already in $W$, then $\operatorname{proj}_W\mathbf{y}$ equals…`,
      choices: [
        ["y", r`$\mathbf{y}$`, undefined],
        ["zero", r`$\mathbf{0}$`, "The projection is the closest point of $W$ to $\\mathbf{y}$ — and $\\mathbf{y}$ is in $W$."],
        ["depends", "it depends on the basis.", "Projections never depend on the choice of orthogonal basis."],
      ],
      correct: "y",
      hint: "The closest point in W to y, when y ∈ W, is…",
      explanation: r`$\mathbf{y}$ itself, with $\mathbf{z} = \mathbf{0}$. The formula reproduces the orthogonal-basis coordinate expansion from §6.2.`,
      tags: ["projection"],
    }),
    mc("uut", {
      body: r`If $U$ is $n \times p$ with **orthonormal** columns spanning $W$, the projection has a matrix form: $\operatorname{proj}_W\mathbf{y} = UU^T\mathbf{y}$.`,
      question: r`With $p < n$, which is true?`,
      choices: [
        ["utu", r`$U^TU = I_p$, but $UU^T \neq I_n$ — $UU^T$ is the projection matrix onto $W$.`, undefined],
        ["both", r`$U^TU = I_p$ and $UU^T = I_n$.`, "$UU^T$ is $n \\times n$ with rank only $p < n$, so it can't be $I_n$."],
        ["neither", r`Neither product is an identity.`, "Orthonormal columns give $U^TU = I_p$ always."],
      ],
      correct: "utu",
      hint: "Rank of UUᵀ is at most p.",
      explanation: r`Orthonormal columns give $U^TU = I_p$. But $UU^T$ ($n \times n$) has rank $p < n$ — it's the matrix of the projection onto $W$, which collapses $W^\perp$ to zero. Only when $U$ is square do both equal the identity.`,
      tags: ["projection"],
    }),
    tf("basis-independent", {
      statement: r`$\operatorname{proj}_W\mathbf{y}$ depends on which orthogonal basis of $W$ is used to compute it.`,
      answer: false,
      feedback: "The decomposition y = ŷ + z is unique.",
      hint: "Uniqueness in the Orthogonal Decomposition Theorem.",
      explanation: r`False. $\hat{\mathbf{y}}$ is the unique vector in $W$ with $\mathbf{y} - \hat{\mathbf{y}} \in W^\perp$; the basis is just a tool to compute it.`,
      tags: ["projection"],
    }),
    tf("closest", {
      statement: r`$\operatorname{proj}_W\mathbf{y}$ is the closest vector in $W$ to $\mathbf{y}$.`,
      answer: true,
      feedback: "Best Approximation Theorem.",
      hint: "Best Approximation Theorem.",
      explanation: r`True — and that's the whole reason projections matter for least squares, coming next.`,
      tags: ["projection"],
    }),
    reading(
      "summary",
      r`**What you did:** projected onto planes using orthogonal bases, measured distances to subspaces, and met $UU^T$.

**Remember:** $\hat{\mathbf{y}} = \sum \dfrac{\mathbf{y}\cdot\mathbf{u}_i}{\mathbf{u}_i\cdot\mathbf{u}_i}\mathbf{u}_i$ needs an **orthogonal** basis — which is why the next lesson builds one.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Gram–Schmidt (Lay §6.4)                                   */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "u8-l4-gram-schmidt",
    unitId: "u8",
    title: "The Gram–Schmidt process",
    summary: "Turn any basis into an orthogonal one by subtracting projections, then normalize. The QR factorization.",
    textbook: "Lay §6.4",
    minutes: 12,
  },
  [
    reading(
      "algorithm",
      r`Given a basis $\{\mathbf{x}_1, \dots, \mathbf{x}_p\}$ for $W$, **Gram–Schmidt** produces an orthogonal basis $\{\mathbf{v}_1, \dots, \mathbf{v}_p\}$:

$$\begin{aligned} \mathbf{v}_1 &= \mathbf{x}_1 \\ \mathbf{v}_2 &= \mathbf{x}_2 - \frac{\mathbf{x}_2\cdot\mathbf{v}_1}{\mathbf{v}_1\cdot\mathbf{v}_1}\mathbf{v}_1 \\ \mathbf{v}_3 &= \mathbf{x}_3 - \frac{\mathbf{x}_3\cdot\mathbf{v}_1}{\mathbf{v}_1\cdot\mathbf{v}_1}\mathbf{v}_1 - \frac{\mathbf{x}_3\cdot\mathbf{v}_2}{\mathbf{v}_2\cdot\mathbf{v}_2}\mathbf{v}_2 \\ &\;\;\vdots \end{aligned}$$

Each step subtracts from $\mathbf{x}_k$ its projection onto the span of the previous $\mathbf{v}$'s, keeping only the perpendicular part. Along the way $\operatorname{Span}\{\mathbf{v}_1, \dots, \mathbf{v}_k\} = \operatorname{Span}\{\mathbf{x}_1, \dots, \mathbf{x}_k\}$ for every $k$. Normalize at the end for an orthonormal basis.`,
      { title: "Subtract the projection, keep the rest" },
    ),
    matrix("v2", {
      question: r`Apply Gram–Schmidt to $\mathbf{x}_1 = ${vec(1, 1, 1)}$, $\mathbf{x}_2 = ${vec(1, 0, 2)}$. With $\mathbf{v}_1 = \mathbf{x}_1$, find $\mathbf{v}_2$.`,
      answer: [[0], [-1], [1]],
      prefix: r`$\mathbf{v}_2 =$`,
      hint: r`$\mathbf{x}_2\cdot\mathbf{v}_1 = 3$ and $\mathbf{v}_1\cdot\mathbf{v}_1 = 3$.`,
      explanation: r`$\mathbf{v}_2 = \mathbf{x}_2 - \tfrac{3}{3}\mathbf{v}_1 = ${vec(1, 0, 2)} - ${vec(1, 1, 1)} = ${vec(0, -1, 1)}$. Check: $\mathbf{v}_2\cdot\mathbf{v}_1 = 0 - 1 + 1 = 0$ ✓.`,
      tags: ["gram-schmidt"],
    }),
    matrix("normalize-v2", {
      question: r`Normalize $\mathbf{v}_2 = ${vec(0, -1, 1)}$ to get the second orthonormal basis vector.`,
      answer: [[0], [-Math.SQRT1_2], [Math.SQRT1_2]],
      answerDisplay: "\\begin{bmatrix} 0 \\\\ -1/\\sqrt{2} \\\\ 1/\\sqrt{2} \\end{bmatrix}",
      hint: r`$\|\mathbf{v}_2\| = \sqrt2$. Entries like \`-1/sqrt(2)\` are fine.`,
      explanation: r`$\mathbf{v}_2/\|\mathbf{v}_2\| = \tfrac{1}{\sqrt2}${vec(0, -1, 1)} = ${vec(0, "-1/\\sqrt2", "1/\\sqrt2")}$. Together with $\mathbf{v}_1/\sqrt3$ this is an orthonormal basis for $\operatorname{Span}\{\mathbf{x}_1, \mathbf{x}_2\}$.`,
      tags: ["gram-schmidt"],
    }),
    reading(
      "qr",
      r`**QR factorization.** If $A$ is $m \times n$ with linearly independent columns, then $A = QR$ where $Q$ ($m \times n$) has orthonormal columns (from Gram–Schmidt, normalized) and $R$ ($n \times n$) is upper triangular with positive diagonal entries. Since $Q^TQ = I$, you can recover $R = Q^TA$. QR is the numerically stable way to do least squares and is the engine behind most eigenvalue algorithms.`,
      { title: "A = QR" },
    ),
    numeric("r-entry", {
      question: r`Let $A = [\,\mathbf{x}_1\ \mathbf{x}_2\,] = ${mat([
        [1, 1],
        [1, 0],
        [1, 2],
      ])}$ and $Q = [\,\mathbf{q}_1\ \mathbf{q}_2\,]$ with $\mathbf{q}_1 = \mathbf{v}_1/\sqrt3$, $\mathbf{q}_2 = \mathbf{v}_2/\sqrt2$. In $A = QR$, what is $r_{12}$?`,
      answer: Math.sqrt(3),
      answerDisplay: "\\sqrt{3}",
      hint: r`$R = Q^TA$, so $r_{12} = \mathbf{q}_1\cdot\mathbf{x}_2$. Type \`sqrt(3)\` or \`3/sqrt(3)\`.`,
      explanation: r`$r_{12} = \mathbf{q}_1\cdot\mathbf{x}_2 = \tfrac{1}{\sqrt3}(1 + 0 + 2) = \tfrac{3}{\sqrt3} = \sqrt3$. The full $R = ${mat([
        ["\\sqrt3", "\\sqrt3"],
        [0, "\\sqrt2"],
      ])}$: $r_{11} = \|\mathbf{x}_1\|$ and $r_{22} = \|\mathbf{v}_2\|$.`,
      tags: ["qr"],
    }),
    order("steps", {
      question: "Put the Gram–Schmidt steps for three vectors in order.",
      items: [
        ["v1", r`Set $\mathbf{v}_1 = \mathbf{x}_1$.`],
        ["v2", r`Subtract from $\mathbf{x}_2$ its projection onto $\mathbf{v}_1$ to get $\mathbf{v}_2$.`],
        ["v3", r`Subtract from $\mathbf{x}_3$ its projections onto $\mathbf{v}_1$ and $\mathbf{v}_2$ to get $\mathbf{v}_3$.`],
        ["norm", r`Divide each $\mathbf{v}_i$ by its length for an orthonormal basis.`],
      ],
      hint: "Each new v uses all the previous v's; normalizing comes last (or you can normalize as you go, but never before projecting).",
      explanation: r`Build $\mathbf{v}_1, \mathbf{v}_2, \mathbf{v}_3$ in order, each orthogonal to all earlier ones, then normalize. Normalizing each $\mathbf{v}_i$ immediately also works, but the projections must use vectors that are already orthogonal.`,
      tags: ["gram-schmidt"],
    }),
    tf("dependent-input", {
      statement: r`If $\{\mathbf{x}_1, \dots, \mathbf{x}_p\}$ is linearly dependent, Gram–Schmidt produces $\mathbf{v}_k = \mathbf{0}$ at some step.`,
      answer: true,
      feedback: "If x_k is already in the span of the earlier vectors, subtracting its projection leaves nothing.",
      hint: r`What is $\mathbf{x}_k - \operatorname{proj}\mathbf{x}_k$ when $\mathbf{x}_k$ lies in the span of $\mathbf{x}_1, \dots, \mathbf{x}_{k-1}$?`,
      explanation: r`True. The first $\mathbf{x}_k$ that is a combination of its predecessors lies in $\operatorname{Span}\{\mathbf{v}_1, \dots, \mathbf{v}_{k-1}\}$, so its projection is itself and $\mathbf{v}_k = \mathbf{0}$. (Handy: Gram–Schmidt doubles as a dependence detector.)`,
      tags: ["gram-schmidt"],
    }),
    tf("span-preserved", {
      statement: r`For each $k$, $\operatorname{Span}\{\mathbf{v}_1, \dots, \mathbf{v}_k\} = \operatorname{Span}\{\mathbf{x}_1, \dots, \mathbf{x}_k\}$.`,
      answer: true,
      feedback: "Each v_k is x_k minus a combination of earlier v's.",
      hint: "Induction: v_k ∈ Span{x_1..x_k} and x_k ∈ Span{v_1..v_k}.",
      explanation: r`True — this is what makes $R$ upper triangular in $A = QR$: each $\mathbf{x}_k$ is a combination of $\mathbf{q}_1, \dots, \mathbf{q}_k$ only.`,
      tags: ["gram-schmidt"],
    }),
    reading(
      "summary",
      r`**What you did:** ran Gram–Schmidt by hand, normalized, and computed an entry of $R$.

**Remember:** $\mathbf{v}_k = \mathbf{x}_k - (\text{projections onto earlier } \mathbf{v}\text{'s})$; $A = QR$ with $R = Q^TA$.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 5 · Least squares (Lay §6.5)                                  */
/* ------------------------------------------------------------------ */

const l5 = lesson(
  {
    id: "u8-l5-least-squares",
    unitId: "u8",
    title: "Least-squares problems",
    summary: "When Ax = b has no solution, find the x that comes closest. The normal equations and fitting a line to data.",
    textbook: "Lay §6.5",
    minutes: 14,
  },
  [
    reading(
      "idea",
      r`Real data rarely gives a consistent system: more equations than unknowns, measurement noise. When $A\mathbf{x} = \mathbf{b}$ has no solution, the next best thing is the $\hat{\mathbf{x}}$ that makes $A\hat{\mathbf{x}}$ **as close to $\mathbf{b}$ as possible**:

$$\|\mathbf{b} - A\hat{\mathbf{x}}\| \le \|\mathbf{b} - A\mathbf{x}\| \quad\text{for all } \mathbf{x}.$$

Such an $\hat{\mathbf{x}}$ is a **least-squares solution**. Since $A\mathbf{x}$ ranges over $\operatorname{Col}A$, the Best Approximation Theorem says $A\hat{\mathbf{x}}$ must be $\operatorname{proj}_{\operatorname{Col}A}\mathbf{b}$, and then $\mathbf{b} - A\hat{\mathbf{x}} \perp \operatorname{Col}A$, i.e. $A^T(\mathbf{b} - A\hat{\mathbf{x}}) = \mathbf{0}$. Rearranged, these are the **normal equations**:

$$A^TA\,\hat{\mathbf{x}} = A^T\mathbf{b}.$$

They are always consistent, and the least-squares solution is **unique** exactly when the columns of $A$ are linearly independent (then $A^TA$ is invertible and $\hat{\mathbf{x}} = (A^TA)^{-1}A^T\mathbf{b}$). The **least-squares error** is $\|\mathbf{b} - A\hat{\mathbf{x}}\|$.

Below: three data points and a line. The dashed red segments are the residuals; the readout is the sum of their squares. Slide $m$ and $b$ to minimise it, then reveal the best fit.`,
      {
        title: "As close as possible",
        visual: {
          kind: "least-squares",
          config: {
            points: [
              [-1, 1],
              [0, 2],
              [1, 4],
            ],
            line: { m: 1, b: 1 },
            sliders: true,
            showBest: true,
          },
        },
      },
    ),
    matrix("ata", {
      body: r`Take $A = ${mat([
        [1, 0],
        [1, 0],
        [0, 1],
      ])}$ and $\mathbf{b} = ${vec(1, 3, 2)}$. Rows 1 and 2 demand $x_1 = 1$ and $x_1 = 3$ at once — inconsistent.`,
      question: r`Compute $A^TA$.`,
      answer: [
        [2, 0],
        [0, 1],
      ],
      hint: r`$A^T$ is $2 \times 3$; entry $(i, j)$ of $A^TA$ is column $i$ of $A$ dotted with column $j$.`,
      explanation: r`Columns of $A$: $(1, 1, 0)$ and $(0, 0, 1)$. Dot products: $2, 0, 0, 1$, so $A^TA = ${mat([
        [2, 0],
        [0, 1],
      ])}$.`,
      tags: ["least-squares"],
    }),
    matrix("atb", {
      question: r`Compute $A^T\mathbf{b}$.`,
      answer: [[4], [2]],
      hint: "Each entry is a column of A dotted with b.",
      explanation: r`$(1, 1, 0)\cdot(1, 3, 2) = 4$ and $(0, 0, 1)\cdot(1, 3, 2) = 2$, so $A^T\mathbf{b} = ${vec(4, 2)}$.`,
      tags: ["least-squares"],
    }),
    matrix("solve-normal", {
      question: r`Solve the normal equations $A^TA\hat{\mathbf{x}} = A^T\mathbf{b}$ for $\hat{\mathbf{x}}$.`,
      answer: [[2], [2]],
      prefix: r`$\hat{\mathbf{x}} =$`,
      hint: r`$${mat([
        [2, 0],
        [0, 1],
      ])}\hat{\mathbf{x}} = ${vec(4, 2)}$ is diagonal — divide.`,
      explanation: r`$2\hat{x}_1 = 4$ and $\hat{x}_2 = 2$, so $\hat{\mathbf{x}} = ${vec(2, 2)}$. Sensible: the conflicting demands $x_1 = 1$ and $x_1 = 3$ are settled by their average, $2$.`,
      tags: ["least-squares"],
    }),
    numeric("ls-error", {
      question: r`What is the least-squares error $\|\mathbf{b} - A\hat{\mathbf{x}}\|$?`,
      answer: Math.SQRT2,
      answerDisplay: "\\sqrt{2}",
      hint: r`$A\hat{\mathbf{x}} = (2, 2, 2)$. Subtract from $\mathbf{b}$ and take the length. Type \`sqrt(2)\` if needed.`,
      explanation: r`$\mathbf{b} - A\hat{\mathbf{x}} = (1, 3, 2) - (2, 2, 2) = (-1, 1, 0)$, of length $\sqrt2$. No choice of $\mathbf{x}$ gets closer to $\mathbf{b}$ than that.`,
      tags: ["least-squares"],
    }),
    reading(
      "line-fit",
      r`**Fitting a line.** To fit $y = \beta_0 + \beta_1x$ to data points $(x_i, y_i)$, write one equation per point, $\beta_0 + \beta_1x_i = y_i$, as $X\boldsymbol\beta = \mathbf{y}$ with the **design matrix**

$$X = ${mat([
        [1, "x_1"],
        [1, "x_2"],
        ["\\vdots", "\\vdots"],
        [1, "x_n"],
      ])}, \qquad \boldsymbol\beta = ${vec("\\beta_0", "\\beta_1")}, \qquad \mathbf{y} = ${vec("y_1", "\\vdots", "y_n")}.$$

The system is almost never consistent; the least-squares $\hat{\boldsymbol\beta}$ from the normal equations $X^TX\hat{\boldsymbol\beta} = X^T\mathbf{y}$ is the **least-squares line** (the regression line). The residuals $y_i - (\hat\beta_0 + \hat\beta_1x_i)$ are the dashed segments in the picture.`,
      { title: "Fitting a line to data" },
    ),
    matrix("xtx", {
      question: r`For the data $(-1, 1), (0, 2), (1, 4)$ from the picture, compute $X^TX$.`,
      answer: [
        [3, 0],
        [0, 2],
      ],
      hint: r`$X = ${mat([
        [1, -1],
        [1, 0],
        [1, 1],
      ])}$. The $x$-values are symmetric about $0$, which kills the off-diagonal entries.`,
      explanation: r`Columns $(1, 1, 1)$ and $(-1, 0, 1)$: $X^TX = ${mat([
        [3, 0],
        [0, 2],
      ])}$. (Centred $x$-data makes the normal equations diagonal — a classic trick.)`,
      tags: ["least-squares"],
    }),
    matrix("xty", {
      question: r`Compute $X^T\mathbf{y}$ for $\mathbf{y} = ${vec(1, 2, 4)}$.`,
      answer: [[7], [3]],
      hint: "Column 1 of X dotted with y, then column 2 dotted with y.",
      explanation: r`$1 + 2 + 4 = 7$ and $-1 + 0 + 4 = 3$, so $X^T\mathbf{y} = ${vec(7, 3)}$.`,
      tags: ["least-squares"],
    }),
    matrix("beta", {
      question: r`Solve for the least-squares line: find $\hat{\boldsymbol\beta} = ${vec("\\hat\\beta_0", "\\hat\\beta_1")}$. (Fractions like 7/3 are fine.)`,
      answer: [[7 / 3], [1.5]],
      hint: r`$3\hat\beta_0 = 7$ and $2\hat\beta_1 = 3$.`,
      explanation: r`$\hat\beta_0 = \tfrac73$, $\hat\beta_1 = \tfrac32$: the line $y = \tfrac73 + \tfrac32x$. Check it against the "best fit" readout in the picture.`,
      tags: ["least-squares"],
    }),
    tf("unique-ls", {
      statement: r`If the columns of $A$ are linearly independent, then $A\mathbf{x} = \mathbf{b}$ has exactly one least-squares solution.`,
      answer: true,
      feedback: "Independent columns make AᵀA invertible.",
      hint: r`Then $A^TA$ is invertible and $\hat{\mathbf{x}} = (A^TA)^{-1}A^T\mathbf{b}$.`,
      explanation: r`True. Independent columns ⟺ $A^TA$ invertible, so the normal equations have the unique solution $(A^TA)^{-1}A^T\mathbf{b}$.`,
      tags: ["least-squares"],
    }),
    tf("ls-solves", {
      statement: r`A least-squares solution $\hat{\mathbf{x}}$ always satisfies $A\hat{\mathbf{x}} = \mathbf{b}$.`,
      answer: false,
      feedback: "If that held, the system would be consistent in the first place.",
      hint: r`$A\hat{\mathbf{x}}$ equals the *projection* of $\mathbf{b}$ onto $\operatorname{Col}A$.`,
      explanation: r`False. $A\hat{\mathbf{x}} = \operatorname{proj}_{\operatorname{Col}A}\mathbf{b}$, which equals $\mathbf{b}$ only when $\mathbf{b} \in \operatorname{Col}A$ (a consistent system). In the example above, $A\hat{\mathbf{x}} = (2, 2, 2) \neq (1, 3, 2)$.`,
      tags: ["least-squares"],
    }),
    reading(
      "summary",
      r`**What you did:** set up and solved normal equations, measured the least-squares error, and fitted a regression line.

**Remember:** $A^TA\hat{\mathbf{x}} = A^T\mathbf{b}$; $A\hat{\mathbf{x}}$ is the projection of $\mathbf{b}$ onto $\operatorname{Col}A$; design matrix $X = [\mathbf{1}\ \mathbf{x}]$ for a line.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 6 · Inner product spaces (Lay §6.7)                           */
/* ------------------------------------------------------------------ */

const l6 = lesson(
  {
    id: "u8-l6-inner-product-spaces",
    unitId: "u8",
    title: "Inner product spaces",
    summary: "Any vector space can have its own notion of angle and length. Evaluation and weighted inner products, Cauchy–Schwarz.",
    textbook: "Lay §6.7",
    minutes: 11,
  },
  [
    reading(
      "axioms",
      r`An **inner product** on a vector space $V$ assigns to each pair $\mathbf{u}, \mathbf{v}$ a real number $\langle\mathbf{u}, \mathbf{v}\rangle$ such that for all $\mathbf{u}, \mathbf{v}, \mathbf{w}$ and scalars $c$:

1. $\langle\mathbf{u}, \mathbf{v}\rangle = \langle\mathbf{v}, \mathbf{u}\rangle$
2. $\langle\mathbf{u} + \mathbf{v}, \mathbf{w}\rangle = \langle\mathbf{u}, \mathbf{w}\rangle + \langle\mathbf{v}, \mathbf{w}\rangle$
3. $\langle c\mathbf{u}, \mathbf{v}\rangle = c\langle\mathbf{u}, \mathbf{v}\rangle$
4. $\langle\mathbf{u}, \mathbf{u}\rangle \ge 0$, with equality only if $\mathbf{u} = \mathbf{0}$.

Then $\|\mathbf{u}\| = \sqrt{\langle\mathbf{u}, \mathbf{u}\rangle}$, distance, orthogonality, projections and Gram–Schmidt all work exactly as before. Examples:

- a **weighted** inner product on $\mathbb{R}^2$: $\langle\mathbf{u}, \mathbf{v}\rangle = 2u_1v_1 + 3u_2v_2$;
- an **evaluation** inner product on $\mathbb{P}_n$: $\langle p, q\rangle = p(t_0)q(t_0) + \cdots + p(t_n)q(t_n)$ for distinct points $t_i$;
- an **integral** inner product on continuous functions: $\langle f, g\rangle = \int_a^b f(t)g(t)\,dt$.`,
      { title: "Inner products beyond the dot product" },
    ),
    numeric("evaluation-ip", {
      question: r`On $\mathbb{P}_2$ with $\langle p, q\rangle = p(0)q(0) + p(1)q(1) + p(2)q(2)$, compute $\langle t,\ 1 + t\rangle$.`,
      answer: 8,
      hint: r`Evaluate both polynomials at $0, 1, 2$: $t \mapsto (0, 1, 2)$ and $1 + t \mapsto (1, 2, 3)$. Then dot.`,
      explanation: r`$0\cdot1 + 1\cdot2 + 2\cdot3 = 8$. The evaluation inner product is just the dot product of the value vectors.`,
      tags: ["inner-product-spaces"],
    }),
    numeric("evaluation-norm", {
      question: r`With the same inner product, what is $\|t\|$?`,
      answer: Math.sqrt(5),
      answerDisplay: "\\sqrt{5}",
      hint: r`$\|t\|^2 = \langle t, t\rangle = 0^2 + 1^2 + 2^2$. Type \`sqrt(5)\`.`,
      explanation: r`$\langle t, t\rangle = 0 + 1 + 4 = 5$, so $\|t\| = \sqrt5$.`,
      tags: ["inner-product-spaces"],
    }),
    mc("orthogonal-polys", {
      question: r`With $\langle p, q\rangle = p(-1)q(-1) + p(0)q(0) + p(1)q(1)$ on $\mathbb{P}_2$, are $1$ and $t$ orthogonal?`,
      choices: [
        ["yes", r`Yes — $\langle 1, t\rangle = (-1) + 0 + 1 = 0$.`, undefined],
        ["no", "No — polynomials can't be orthogonal.", "Orthogonality is defined by the inner product, and this one makes perfect sense for polynomials."],
        ["no2", r`No — $\langle 1, t\rangle = 3$.`, "Evaluate $t$ at $-1, 0, 1$: the values are $-1, 0, 1$, not $1, 1, 1$."],
      ],
      correct: "yes",
      hint: "Value vectors: 1 ↦ (1, 1, 1), t ↦ (−1, 0, 1).",
      explanation: r`$(1, 1, 1)\cdot(-1, 0, 1) = 0$, so $1 \perp t$ for this inner product. Symmetric sample points make odd and even functions orthogonal — the start of the theory behind Legendre polynomials.`,
      tags: ["inner-product-spaces"],
    }),
    numeric("weighted-ip", {
      question: r`On $\mathbb{R}^2$ with $\langle\mathbf{u}, \mathbf{v}\rangle = 2u_1v_1 + 3u_2v_2$, compute $\langle(1, 2), (3, -1)\rangle$.`,
      answer: 0,
      hint: "Apply the weights 2 and 3 to the entrywise products.",
      explanation: r`$2(1)(3) + 3(2)(-1) = 6 - 6 = 0$. These vectors are orthogonal for the *weighted* inner product even though their ordinary dot product is $3 - 2 = 1$. "Orthogonal" always means "with respect to a chosen inner product".`,
      tags: ["inner-product-spaces"],
    }),
    mc("not-inner-product", {
      question: r`Which formula is **not** an inner product on $\mathbb{R}^2$?`,
      choices: [
        ["indef", r`$\langle\mathbf{u}, \mathbf{v}\rangle = u_1v_1 - u_2v_2$`, undefined],
        ["w23", r`$\langle\mathbf{u}, \mathbf{v}\rangle = 2u_1v_1 + 3u_2v_2$`, "Positive weights keep axiom 4 intact."],
        ["dot", r`$\langle\mathbf{u}, \mathbf{v}\rangle = u_1v_1 + u_2v_2$`, "That's the ordinary dot product."],
        ["w41", r`$\langle\mathbf{u}, \mathbf{v}\rangle = 4u_1v_1 + u_2v_2$`, "Positive weights again — fine."],
      ],
      correct: "indef",
      hint: r`Test axiom 4 with $\mathbf{u} = (0, 1)$.`,
      explanation: r`For $\mathbf{u} = (0, 1)$: $\langle\mathbf{u}, \mathbf{u}\rangle = 0 - 1 = -1 < 0$, violating positivity. A minus sign in a weight breaks the axioms; positive weights are fine.`,
      tags: ["inner-product-spaces"],
    }),
    tf("cauchy-schwarz", {
      statement: r`In every inner product space, $|\langle\mathbf{u}, \mathbf{v}\rangle| \le \|\mathbf{u}\|\,\|\mathbf{v}\|$.`,
      answer: true,
      feedback: "Cauchy–Schwarz follows from the axioms alone.",
      hint: "This is the Cauchy–Schwarz inequality.",
      explanation: r`True — the **Cauchy–Schwarz inequality** holds in any inner product space, and the triangle inequality $\|\mathbf{u} + \mathbf{v}\| \le \|\mathbf{u}\| + \|\mathbf{v}\|$ follows from it. Both are proved from the four axioms only.`,
      tags: ["inner-product-spaces"],
    }),
    reading(
      "summary",
      r`**What you did:** computed with evaluation and weighted inner products, tested orthogonality in $\mathbb{P}_2$, and spotted a formula that breaks positivity.

**Remember:** any function satisfying the four axioms gives a geometry; all the Unit-8 machinery (projections, Gram–Schmidt, least squares) then works verbatim. Take the Level Check.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit                                                                */
/* ------------------------------------------------------------------ */

export const unit8: Unit = {
  id: "u8",
  title: "Orthogonality and least squares",
  subtitle: "Right angles, projections and best fits",
  description: "Inner products and length, orthogonal sets, projections onto subspaces, Gram–Schmidt, least-squares solutions, and general inner product spaces.",
  textbook: "Lay §6.1–6.5, 6.7",
  lessons: [l1, l2, l3, l4, l5, l6],
  practice: [
    numeric("p-dot", {
      question: r`Compute $${vec(1, -2, 2)}\cdot${vec(3, 1, 4)}$.`,
      answer: 9,
      hint: "Entrywise products, then add.",
      explanation: r`$3 - 2 + 8 = 9$.`,
      tags: ["dot-product"],
    }),
    numeric("p-length", {
      question: r`Find $\|(1, -2, 2)\|$.`,
      answer: 3,
      hint: "√(1 + 4 + 4).",
      explanation: r`$\sqrt{9} = 3$.`,
      tags: ["length"],
    }),
    matrix("p-projection", {
      question: r`Project $${vec(3, 4)}$ onto the line through $${vec(1, 0)}$.`,
      answer: [[3], [0]],
      hint: "(y·u / u·u) u.",
      explanation: r`$\tfrac{3}{1}(1, 0) = (3, 0)$ — projection onto the $x_1$-axis just keeps the first coordinate.`,
      tags: ["projection"],
    }),
    matrix("p-gram-schmidt", {
      question: r`Gram–Schmidt with $\mathbf{x}_1 = ${vec(1, 0, 1)}$, $\mathbf{x}_2 = ${vec(2, 1, 0)}$: find $\mathbf{v}_2$.`,
      answer: [[1], [1], [-1]],
      hint: "x₂·v₁ = 2, v₁·v₁ = 2.",
      explanation: r`$\mathbf{v}_2 = (2, 1, 0) - 1\cdot(1, 0, 1) = (1, 1, -1)$; check $(1, 1, -1)\cdot(1, 0, 1) = 0$ ✓.`,
      tags: ["gram-schmidt"],
    }),
    matrix("p-normal-eq", {
      question: r`For $A = ${mat([
        [1, 1],
        [1, -1],
        [1, 0],
      ])}$, compute $A^TA$.`,
      answer: [
        [3, 0],
        [0, 2],
      ],
      hint: "Columns (1,1,1) and (1,−1,0).",
      explanation: r`Dot products: $3$, $0$, $0$, $2$.`,
      tags: ["least-squares"],
    }),
    matrix("p-ls-solution", {
      question: r`With that $A$ and $\mathbf{b} = ${vec(2, 0, 1)}$, find the least-squares solution $\hat{\mathbf{x}}$.`,
      answer: [[1], [1]],
      hint: "AᵀA x̂ = Aᵀb with Aᵀb = (3, 2).",
      explanation: r`$A^T\mathbf{b} = (2 + 0 + 1,\ 2 - 0 + 0) = (3, 2)$; then $3\hat x_1 = 3$, $2\hat x_2 = 2$: $\hat{\mathbf{x}} = (1, 1)$.`,
      tags: ["least-squares"],
    }),
    mc("p-complement", {
      question: r`If $A$ is $m \times n$, then $(\operatorname{Row}A)^\perp$ equals…`,
      choices: [
        ["nul", r`$\operatorname{Nul}A$`],
        ["nulT", r`$\operatorname{Nul}A^T$`, "That's $(\\operatorname{Col}A)^\\perp$."],
        ["col", r`$\operatorname{Col}A$`, "Col A lives in ℝᵐ; (Row A)⊥ lives in ℝⁿ."],
      ],
      correct: "nul",
      hint: "Ax = 0 says each row is orthogonal to x.",
      explanation: r`$A\mathbf{x} = \mathbf{0}$ ⟺ every row dotted with $\mathbf{x}$ is $0$ ⟺ $\mathbf{x} \perp \operatorname{Row}A$.`,
      tags: ["orthogonal-complement"],
    }),
    tf("p-tf-orthonormal", {
      statement: r`If $U$ has orthonormal columns, then $\|U\mathbf{x}\| = \|\mathbf{x}\|$ for every $\mathbf{x}$.`,
      answer: true,
      hint: "UᵀU = I.",
      explanation: r`True: $\|U\mathbf{x}\|^2 = (U\mathbf{x})^T(U\mathbf{x}) = \mathbf{x}^TU^TU\mathbf{x} = \mathbf{x}^T\mathbf{x}$.`,
      tags: ["orthonormal"],
    }),
    tf("p-tf-ls", {
      statement: r`The least-squares solution of $A\mathbf{x} = \mathbf{b}$ is the vector $\hat{\mathbf{x}}$ that makes $A\hat{\mathbf{x}}$ the projection of $\mathbf{b}$ onto $\operatorname{Col}A$.`,
      answer: true,
      hint: "Best Approximation Theorem applied to Col A.",
      explanation: r`True — that's the geometric meaning of the normal equations.`,
      tags: ["least-squares"],
    }),
    numeric("p-inner-product", {
      question: r`On $\mathbb{P}_1$ with $\langle p, q\rangle = p(0)q(0) + p(1)q(1)$, compute $\langle 1 + t,\ 2 - t\rangle$.`,
      answer: 4,
      hint: "Values at 0 and 1: (1, 2) and (2, 1).",
      explanation: r`$1\cdot2 + 2\cdot1 = 4$.`,
      tags: ["inner-product-spaces"],
    }),
  ],
  generators: ["gen.dot-product", "gen.projection", "gen.least-squares"],
};
