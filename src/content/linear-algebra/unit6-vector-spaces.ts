import type { Unit } from "../types";
import { aug, goal, lesson, mat, matrix, mc, multi, numeric, r, reading, tf, vec } from "../dsl";

/* ------------------------------------------------------------------ */
/* Lesson 1 · Vector spaces and subspaces (Lay §4.1)                    */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "u6-l1-vector-spaces-subspaces",
    unitId: "u6",
    title: "Vector spaces and subspaces",
    summary: "The axioms that make ℝⁿ work also apply to polynomials, functions and matrices. The three-part subspace test.",
    textbook: "Lay §4.1",
    minutes: 12,
  },
  [
    reading(
      "axioms",
      r`A **vector space** is a set $V$ of objects (called vectors) with two operations — addition and scalar multiplication — that behave the way they do in $\mathbb{R}^n$. Precisely, for all $\mathbf{u}, \mathbf{v}, \mathbf{w}$ in $V$ and scalars $c, d$:

1. $\mathbf{u} + \mathbf{v}$ is in $V$; 2. $\mathbf{u} + \mathbf{v} = \mathbf{v} + \mathbf{u}$; 3. $(\mathbf{u} + \mathbf{v}) + \mathbf{w} = \mathbf{u} + (\mathbf{v} + \mathbf{w})$; 4. there is a zero vector with $\mathbf{u} + \mathbf{0} = \mathbf{u}$; 5. each $\mathbf{u}$ has a negative with $\mathbf{u} + (-\mathbf{u}) = \mathbf{0}$; 6. $c\mathbf{u}$ is in $V$; 7. $c(\mathbf{u} + \mathbf{v}) = c\mathbf{u} + c\mathbf{v}$; 8. $(c + d)\mathbf{u} = c\mathbf{u} + d\mathbf{u}$; 9. $c(d\mathbf{u}) = (cd)\mathbf{u}$; 10. $1\mathbf{u} = \mathbf{u}$.

Examples beyond $\mathbb{R}^n$: the polynomials of degree at most $n$, written $\mathbb{P}_n$; all real-valued functions on an interval; all $m \times n$ matrices. In each case "add" and "scale" are the obvious operations, and all ten rules hold. Everything you've proved about $\mathbb{R}^n$ using only these rules transfers automatically.`,
      { title: "Beyond ℝⁿ" },
    ),
    reading(
      "subspace",
      r`A **subspace** of a vector space $V$ is a subset $H$ that is a vector space in its own right. You don't need to recheck all ten axioms — three conditions suffice:

- (a) the zero vector of $V$ is in $H$;
- (b) $H$ is closed under addition: $\mathbf{u}, \mathbf{v} \in H \Rightarrow \mathbf{u} + \mathbf{v} \in H$;
- (c) $H$ is closed under scalar multiplication: $\mathbf{u} \in H \Rightarrow c\mathbf{u} \in H$.

The most important source of subspaces: for any $\mathbf{v}_1, \dots, \mathbf{v}_p$ in $V$, $\operatorname{Span}\{\mathbf{v}_1, \dots, \mathbf{v}_p\}$ is a subspace of $V$ — the **subspace spanned** by those vectors. Lines and planes through the origin are exactly the spans of one or two vectors.`,
      { title: "The subspace test" },
    ),
    mc("line-off-origin", {
      question: r`Is $H = \{(x_1, x_2) : x_2 = 2x_1 + 1\}$ a subspace of $\mathbb{R}^2$?`,
      choices: [
        ["no-zero", r`No — $\mathbf{0}$ is not in $H$.`, undefined],
        ["yes-line", "Yes — it's a line.", "Only lines *through the origin* are subspaces. Does $(0, 0)$ satisfy $x_2 = 2x_1 + 1$?"],
        ["no-add", r`No — it's closed under addition but not scalar multiplication.`, "It fails closure under addition too, but the quickest failure is the missing zero vector."],
      ],
      correct: "no-zero",
      hint: "Check condition (a) first: does (0, 0) satisfy the equation?",
      explanation: r`$(0, 0)$ gives $0 = 1$, false — so $\mathbf{0} \notin H$ and $H$ is not a subspace. (It also fails (b): $(0, 1) + (0, 1) = (0, 2)$, but $2 \neq 1$.) A line not through the origin is never a subspace.`,
      tags: ["subspaces"],
    }),
    mc("first-quadrant", {
      question: r`Is the first quadrant $H = \{(x_1, x_2) : x_1 \ge 0,\ x_2 \ge 0\}$ a subspace of $\mathbb{R}^2$?`,
      choices: [
        ["no-scalar", r`No — it is not closed under scalar multiplication.`, undefined],
        ["yes", "Yes — it contains the origin and sums of points in it stay in it.", "Those two conditions hold, but check (c) with a negative scalar."],
        ["no-zero", r`No — $\mathbf{0}$ is not in $H$.`, "$(0, 0)$ does satisfy $x_1 \\ge 0$ and $x_2 \\ge 0$."],
      ],
      correct: "no-scalar",
      hint: r`Take $(1, 1) \in H$ and multiply by $-1$.`,
      explanation: r`$(1, 1) \in H$ but $(-1)(1, 1) = (-1, -1) \notin H$: condition (c) fails. Containing the origin and being closed under addition is not enough.`,
      tags: ["subspaces"],
    }),
    mc("param-plane", {
      question: r`Is $H = \left\{ ${vec("a", "b", "a + b")} : a, b \in \mathbb{R} \right\}$ a subspace of $\mathbb{R}^3$?`,
      choices: [
        ["yes-span", r`Yes — $H = \operatorname{Span}\left\{${vec(1, 0, 1)}, ${vec(0, 1, 1)}\right\}$, and spans are subspaces.`, undefined],
        ["no", r`No — the third entry depends on the first two, so it isn't closed under addition.`, "Dependence between entries is fine as long as it's *linear*. Try adding two vectors of this form."],
        ["cant", "It can't be decided without more information.", "Write a general element as a combination of fixed vectors — that settles it."],
      ],
      correct: "yes-span",
      hint: r`Split $(a, b, a + b)$ as $a(\dots) + b(\dots)$.`,
      explanation: r`$${vec("a", "b", "a + b")} = a${vec(1, 0, 1)} + b${vec(0, 1, 1)}$, so $H$ is the span of two vectors — a plane through the origin, hence a subspace. Writing a set as a span is the fastest way to prove it's a subspace.`,
      tags: ["subspaces"],
    }),
    multi("which-subspaces", {
      question: r`Select **every** subset that is a subspace of $\mathbb{R}^2$.`,
      choices: [
        ["zero", r`$\{\mathbf{0}\}$`],
        ["line", r`The line $x_2 = 3x_1$`],
        ["all", r`$\mathbb{R}^2$ itself`],
        ["axis", r`The $x_1$-axis`],
        ["union", r`$\{(x_1, x_2) : x_1x_2 = 0\}$ (the two axes together)`],
        ["circle", r`The circle $x_1^2 + x_2^2 = 1$`],
      ],
      correct: ["zero", "line", "all", "axis"],
      hint: "Run the three-part test on each. The union of the axes contains (1, 0) and (0, 1) — is their sum in it?",
      explanation: r`$\{\mathbf{0}\}$, any line through the origin, and $\mathbb{R}^2$ pass all three conditions. The union of the two axes fails closure under addition: $(1, 0) + (0, 1) = (1, 1)$ is on neither axis. The circle doesn't contain $\mathbf{0}$ (and isn't closed under anything).`,
      tags: ["subspaces"],
    }),
    mc("poly-zero-at-zero", {
      question: r`In $\mathbb{P}_2$, is $H = \{p : p(0) = 0\}$ a subspace?`,
      choices: [
        ["yes", r`Yes — the zero polynomial is in $H$, and $(p + q)(0) = 0$ and $(cp)(0) = 0$ whenever $p(0) = q(0) = 0$.`, undefined],
        ["no", r`No — polynomials aren't vectors.`, "$\\mathbb{P}_2$ is a vector space; its elements are the vectors here."],
        ["no-add", r`No — the sum of two such polynomials might not vanish at $0$.`, "$(p + q)(0) = p(0) + q(0) = 0 + 0$."],
      ],
      correct: "yes",
      hint: "Run the three-part test with polynomials in place of column vectors.",
      explanation: r`All three conditions hold, so $H$ is a subspace. In fact $H = \{a_1t + a_2t^2\} = \operatorname{Span}\{t, t^2\}$. Subspace reasoning works word-for-word in any vector space.`,
      tags: ["subspaces"],
    }),
    mc("poly-one-at-zero", {
      question: r`In $\mathbb{P}_2$, is $K = \{p : p(0) = 1\}$ a subspace?`,
      choices: [
        ["no", r`No — the zero polynomial has value $0$ at $0$, so $\mathbf{0} \notin K$.`, undefined],
        ["yes", "Yes — it's described by one linear condition.", "The condition $p(0) = 1$ isn't homogeneous: the zero polynomial fails it."],
      ],
      correct: "no",
      hint: "Is the zero vector of ℙ₂ in K?",
      explanation: r`The zero polynomial satisfies $p(0) = 0 \neq 1$, so condition (a) fails. Like the line $x_2 = 2x_1 + 1$, this set is a translate of a subspace, not a subspace.`,
      tags: ["subspaces"],
    }),
    tf("span-subspace", {
      statement: r`For any vectors $\mathbf{v}_1, \dots, \mathbf{v}_p$ in a vector space $V$, $\operatorname{Span}\{\mathbf{v}_1, \dots, \mathbf{v}_p\}$ is a subspace of $V$.`,
      answer: true,
      feedback: "This is Lay's Theorem 1 in §4.1.",
      hint: "Zero is the all-zero combination; sums and multiples of combinations are combinations.",
      explanation: r`True. $\mathbf{0}$ is the combination with all weights $0$; adding two combinations or scaling one gives another combination. Spans are the canonical subspaces.`,
      tags: ["subspaces"],
    }),
    tf("closed-under-combinations", {
      statement: r`If $H$ is a subspace of $V$ and $\mathbf{u}, \mathbf{v} \in H$, then every linear combination $c\mathbf{u} + d\mathbf{v}$ is in $H$.`,
      answer: true,
      feedback: "Combine closure under scaling with closure under addition.",
      hint: r`$c\mathbf{u} \in H$ and $d\mathbf{v} \in H$ by (c); then their sum is in $H$ by (b).`,
      explanation: r`True — this is exactly what the two closure conditions give you, and by induction it extends to combinations of any number of vectors. A subspace contains the span of any of its subsets.`,
      tags: ["subspaces"],
    }),
    reading(
      "summary",
      r`**What you did:** ran the three-part subspace test on sets in $\mathbb{R}^2$, $\mathbb{R}^3$ and $\mathbb{P}_2$, and recognised spans as subspaces.

**Remember:** zero in, closed under $+$, closed under scaling. The quickest way to prove "subspace" is to write the set as a span; the quickest way to prove "not a subspace" is usually a missing zero vector or a negative scalar.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Null space and column space (Lay §4.2)                    */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "u6-l2-null-column-space",
    unitId: "u6",
    title: "Null space and column space",
    summary: "Two subspaces every matrix carries around, how to describe each, and the kernel and range of a general linear transformation.",
    textbook: "Lay §4.2",
    minutes: 13,
  },
  [
    reading(
      "nul",
      r`The **null space** of an $m \times n$ matrix $A$ is the set of all solutions of $A\mathbf{x} = \mathbf{0}$:

$$\operatorname{Nul} A = \{\mathbf{x} \in \mathbb{R}^n : A\mathbf{x} = \mathbf{0}\}.$$

It is a **subspace of $\mathbb{R}^n$** (zero works, and $A(\mathbf{u} + \mathbf{v}) = A\mathbf{u} + A\mathbf{v} = \mathbf{0}$, $A(c\mathbf{u}) = c\mathbf{0} = \mathbf{0}$). $\operatorname{Nul}A$ is defined *implicitly* — by a condition. To describe it *explicitly*, solve $A\mathbf{x} = \mathbf{0}$ in parametric vector form; the vectors that multiply the free variables span $\operatorname{Nul}A$, and they are automatically linearly independent.`,
      { title: "Null space" },
    ),
    matrix("nul-vector", {
      body: r`$A = ${mat([
        [1, 2, -1],
        [2, 4, -2],
      ])}$ row reduces to $${mat([
        [1, 2, -1],
        [0, 0, 0],
      ])}$, so $x_1 = -2x_2 + x_3$ with $x_2, x_3$ free.`,
      question: r`Find the vector in $\operatorname{Nul}A$ with $x_2 = 0$ and $x_3 = 1$.`,
      answer: [[1], [0], [1]],
      hint: r`Substitute $x_2 = 0$, $x_3 = 1$ into $x_1 = -2x_2 + x_3$.`,
      explanation: r`$x_1 = 1$, giving $${vec(1, 0, 1)}$. Together with the $x_2 = 1$, $x_3 = 0$ vector $${vec(-2, 1, 0)}$ it spans $\operatorname{Nul}A$ — a plane through the origin in $\mathbb{R}^3$. Check: $A${vec(1, 0, 1)} = ${vec("1 - 1", "2 - 2")} = \mathbf{0}$ ✓.`,
      tags: ["null-space"],
    }),
    numeric("nul-spanning-count", {
      question: r`$A$ is $3 \times 5$ and its echelon form has 2 pivots. How many vectors are in the spanning set for $\operatorname{Nul}A$ produced by the parametric method?`,
      answer: 3,
      hint: "One vector per free variable.",
      explanation: r`$5 - 2 = 3$ free variables, hence 3 spanning vectors (which, as always with this method, are linearly independent).`,
      tags: ["null-space"],
    }),
    reading(
      "col",
      r`The **column space** of $A$ is the span of its columns:

$$\operatorname{Col}A = \operatorname{Span}\{\mathbf{a}_1, \dots, \mathbf{a}_n\} = \{\mathbf{b} : \mathbf{b} = A\mathbf{x} \text{ for some } \mathbf{x}\}.$$

It is a **subspace of $\mathbb{R}^m$** and equals the **range** of $\mathbf{x} \mapsto A\mathbf{x}$. Membership is a consistency question: $\mathbf{b} \in \operatorname{Col}A$ ⟺ $A\mathbf{x} = \mathbf{b}$ has a solution.

Also useful: the **row space** $\operatorname{Row}A$, the span of the rows (a subspace of $\mathbb{R}^n$). Row operations don't change $\operatorname{Row}A$, so the nonzero rows of an echelon form span it — but they *do* change $\operatorname{Col}A$, which is why column-space questions must go back to the original columns.`,
      { title: "Column space (and row space)" },
    ),
    mc("in-col", {
      question: r`Let $A = ${mat([
        [1, 2],
        [2, 4],
      ])}$. Is $${vec(1, 5)}$ in $\operatorname{Col}A$?`,
      choices: [
        ["no", r`No — $\operatorname{Col}A$ is the line through $(1, 2)$, and $(1, 5)$ is not on it.`, undefined],
        ["yes", r`Yes — $A$ has two columns, so $\operatorname{Col}A = \mathbb{R}^2$.`, "Two columns span $\\mathbb{R}^2$ only when they are independent. Here $(2, 4) = 2(1, 2)$."],
        ["yes2", r`Yes — $\mathbf{x} = (1, 0)$ works.`, "$A(1, 0) = (1, 2)$, not $(1, 5)$."],
      ],
      correct: "no",
      hint: "Both columns are multiples of (1, 2). What does their span look like?",
      explanation: r`$\operatorname{Col}A = \operatorname{Span}\{(1, 2)\}$, a line. $(1, 5)$ is not a multiple of $(1, 2)$, so $A\mathbf{x} = (1, 5)$ is inconsistent (row reduce $[A \mid \mathbf{b}]$ to see the row $0 = 3$).`,
      tags: ["column-space"],
    }),
    mc("which-space", {
      question: r`Let $A = ${mat([
        [1, 1, 0],
        [2, 0, -1],
      ])}$ and $\mathbf{u} = ${vec(1, -1, 2)}$. Which is true?`,
      choices: [
        ["nul", r`$\mathbf{u} \in \operatorname{Nul}A$.`, undefined],
        ["col", r`$\mathbf{u} \in \operatorname{Col}A$.`, "$\\operatorname{Col}A$ lives in $\\mathbb{R}^2$ — it can't contain a vector with three entries."],
        ["both", r`$\mathbf{u}$ is in both.`, "They live in different spaces: $\\operatorname{Nul}A \\subseteq \\mathbb{R}^3$, $\\operatorname{Col}A \\subseteq \\mathbb{R}^2$."],
        ["neither", r`$\mathbf{u}$ is in neither.`, "Compute $A\\mathbf{u}$."],
      ],
      correct: "nul",
      hint: r`$\mathbf{u}$ has 3 entries, so only $\operatorname{Nul}A \subseteq \mathbb{R}^3$ is even a candidate. Compute $A\mathbf{u}$.`,
      explanation: r`$A\mathbf{u} = ${vec("1 - 1 + 0", "2 + 0 - 2")} = \mathbf{0}$, so $\mathbf{u} \in \operatorname{Nul}A$. For an $m \times n$ matrix, $\operatorname{Nul}A \subseteq \mathbb{R}^n$ and $\operatorname{Col}A \subseteq \mathbb{R}^m$ — keep the spaces straight.`,
      tags: ["null-space", "column-space"],
    }),
    tf("nul-in-rm", {
      statement: r`If $A$ is $m \times n$, then $\operatorname{Nul}A$ is a subspace of $\mathbb{R}^m$.`,
      answer: false,
      feedback: r`Solutions $\mathbf{x}$ of $A\mathbf{x} = \mathbf{0}$ have how many entries?`,
      hint: "Count entries of a solution vector.",
      explanation: r`False — $\operatorname{Nul}A \subseteq \mathbb{R}^n$ (solutions have $n$ entries, one per column). It's $\operatorname{Col}A$ that lives in $\mathbb{R}^m$.`,
      tags: ["null-space"],
    }),
    tf("col-is-range", {
      statement: r`$\operatorname{Col}A$ is the range of the linear transformation $\mathbf{x} \mapsto A\mathbf{x}$.`,
      answer: true,
      feedback: r`Every $A\mathbf{x}$ is a combination of the columns, and every combination is some $A\mathbf{x}$.`,
      hint: r`$A\mathbf{x} = x_1\mathbf{a}_1 + \cdots + x_n\mathbf{a}_n$.`,
      explanation: r`True: the outputs $A\mathbf{x}$ are exactly the linear combinations of the columns, i.e. $\operatorname{Col}A$.`,
      tags: ["column-space"],
    }),
    reading(
      "kernel-range",
      r`The same ideas apply to any **linear transformation** $T : V \to W$ between vector spaces (meaning $T(\mathbf{u} + \mathbf{v}) = T(\mathbf{u}) + T(\mathbf{v})$ and $T(c\mathbf{u}) = cT(\mathbf{u})$):

- the **kernel** $\{\mathbf{v} \in V : T(\mathbf{v}) = \mathbf{0}\}$ is a subspace of $V$ (it's $\operatorname{Nul}A$ when $T(\mathbf{x}) = A\mathbf{x}$);
- the **range** $\{T(\mathbf{v}) : \mathbf{v} \in V\}$ is a subspace of $W$ (it's $\operatorname{Col}A$ for a matrix).

Example: differentiation $D : \mathbb{P}_2 \to \mathbb{P}_1$, $D(p) = p'$, is linear since $(p + q)' = p' + q'$ and $(cp)' = cp'$.`,
      { title: "Kernel and range in general" },
    ),
    mc("kernel-of-d", {
      question: r`What is the kernel of the differentiation map $D(p) = p'$ on $\mathbb{P}_2$?`,
      choices: [
        ["constants", "The constant polynomials.", undefined],
        ["zero", "Only the zero polynomial.", "Any constant has derivative zero, not just $0$."],
        ["all", r`All of $\mathbb{P}_2$.`, "$D(t) = 1 \\neq 0$, so $t$ is not in the kernel."],
        ["p0", r`The polynomials with $p(0) = 0$.`, "$p(t) = t$ has $p(0) = 0$ but $p' = 1 \\neq 0$."],
      ],
      correct: "constants",
      hint: "Which polynomials have derivative identically zero?",
      explanation: r`$p' = 0$ exactly when $p$ is constant, so $\ker D = \{c : c \in \mathbb{R}\} = \operatorname{Span}\{1\}$. (The range of $D$ is all of $\mathbb{P}_1$: every $a + bt$ is the derivative of $at + \tfrac{b}{2}t^2$.)`,
      tags: ["kernel"],
    }),
    mc("contrast", {
      question: r`To check whether a vector $\mathbf{v}$ is in $\operatorname{Nul}A$ versus in $\operatorname{Col}A$, you…`,
      choices: [
        ["right", r`compute $A\mathbf{v}$ and see if it is $\mathbf{0}$ (Nul); row reduce $[A \mid \mathbf{v}]$ and check consistency (Col).`, undefined],
        ["swapped", r`row reduce $[A \mid \mathbf{v}]$ (Nul); compute $A\mathbf{v}$ (Col).`, "Backwards. Null space membership is a direct multiplication; column space membership is a consistency question."],
        ["same", "do the same computation for both.", "They are different kinds of questions — one is a multiplication, the other a system to solve."],
      ],
      correct: "right",
      hint: "Nul A is defined by a condition on v; Col A by whether v can be produced.",
      explanation: r`$\mathbf{v} \in \operatorname{Nul}A$ is easy to *check* (one multiplication) but $\operatorname{Nul}A$ takes work to *describe* (solve a system). $\operatorname{Col}A$ is easy to *describe* (span of columns) but takes work to *check* membership (consistency). That contrast is the heart of §4.2.`,
      tags: ["null-space", "column-space"],
    }),
    reading(
      "summary",
      r`**What you did:** described null spaces explicitly, tested column-space membership, kept $\mathbb{R}^n$ and $\mathbb{R}^m$ straight, and found a kernel in $\mathbb{P}_2$.

**Remember:** $\operatorname{Nul}A \subseteq \mathbb{R}^n$ (solve $A\mathbf{x} = \mathbf{0}$); $\operatorname{Col}A \subseteq \mathbb{R}^m$ (span of columns = range). Next: the smallest spanning sets — bases.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Bases (Lay §4.3)                                          */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "u6-l3-bases",
    unitId: "u6",
    title: "Linearly independent sets; bases",
    summary: "A basis is a spanning set with nothing wasted. Finding bases for Nul A and Col A, and the trap in the column-space case.",
    textbook: "Lay §4.3",
    minutes: 13,
  },
  [
    reading(
      "def",
      r`A **basis** for a subspace $H$ is a set $\mathcal{B} = \{\mathbf{b}_1, \dots, \mathbf{b}_p\}$ that is (i) linearly independent and (ii) spans $H$. The **standard basis** of $\mathbb{R}^n$ is $\{\mathbf{e}_1, \dots, \mathbf{e}_n\}$; for $\mathbb{P}_n$ it is $\{1, t, t^2, \dots, t^n\}$.

**Spanning Set Theorem.** If $S$ spans $H$ and some $\mathbf{v}_k \in S$ is a linear combination of the other vectors, then removing $\mathbf{v}_k$ still leaves a spanning set. Repeating this until nothing is redundant produces a basis (provided $H \neq \{\mathbf{0}\}$). Two ways to think about a basis: a spanning set that is as *small* as possible, or an independent set that is as *large* as possible.`,
      { title: "What a basis is" },
    ),
    mc("too-many", {
      question: r`Is $\left\{${vec(1, 0)}, ${vec(0, 1)}, ${vec(1, 1)}\right\}$ a basis for $\mathbb{R}^2$?`,
      choices: [
        ["no-dep", "No — it spans, but it is linearly dependent.", undefined],
        ["yes", "Yes — it spans ℝ².", "Spanning is only half of the definition."],
        ["no-span", "No — it doesn't span ℝ².", "It does span (it contains the standard basis). The problem is elsewhere."],
      ],
      correct: "no-dep",
      hint: "Three vectors in ℝ².",
      explanation: r`Three vectors in $\mathbb{R}^2$ are always dependent ($(1, 1) = (1, 0) + (0, 1)$), so the set fails independence. Remove the redundant vector and you have a basis.`,
      tags: ["bases"],
    }),
    mc("too-few", {
      question: r`Is $\left\{${vec(1, 2)}, ${vec(2, 4)}\right\}$ a basis for $\mathbb{R}^2$?`,
      choices: [
        ["no", "No — the set is dependent and spans only a line.", undefined],
        ["yes", "Yes — two vectors in ℝ².", "Two vectors form a basis of $\\mathbb{R}^2$ only if they are independent. These are parallel."],
      ],
      correct: "no",
      hint: "Is the second vector a multiple of the first?",
      explanation: r`$(2, 4) = 2(1, 2)$: dependent, and their span is the line through $(1, 2)$, not $\mathbb{R}^2$. Both conditions fail.`,
      tags: ["bases"],
    }),
    mc("just-right", {
      question: r`Is $\left\{${vec(1, 1)}, ${vec(1, -1)}\right\}$ a basis for $\mathbb{R}^2$?`,
      choices: [
        ["yes", "Yes — two independent vectors in ℝ² span it.", undefined],
        ["no", "No — neither vector is a standard basis vector.", "A basis doesn't have to be the standard one; any independent spanning set works."],
      ],
      correct: "yes",
      hint: r`Are they parallel? Put them in a matrix and count pivots.`,
      explanation: r`$${mat([
        [1, 1],
        [1, -1],
      ])}$ has two pivots, so the columns are independent and span $\mathbb{R}^2$: a basis. $\mathbb{R}^2$ has infinitely many bases.`,
      tags: ["bases"],
    }),
    reading(
      "nul-col-bases",
      r`**Basis for $\operatorname{Nul}A$:** the vectors from the parametric vector form of the solutions of $A\mathbf{x} = \mathbf{0}$. They span by construction and are independent because each has a $1$ in a free-variable slot where the others have $0$.

**Basis for $\operatorname{Col}A$:** the **pivot columns of $A$**. Row reduce to find *which* columns are pivot columns, then take those columns from the **original** $A$.

> The columns of an echelon form $B$ of $A$ are generally **not** in $\operatorname{Col}A$ at all — row operations change the column space. Only the *positions* of the pivots carry over.`,
      { title: "Bases for Nul A and Col A" },
    ),
    mc("col-basis", {
      body: r`$A = ${mat([
        [1, 2, 0, 3],
        [2, 4, 1, 1],
        [-1, -2, 1, -8],
      ])}$ has reduced echelon form $${mat([
        [1, 2, 0, 3],
        [0, 0, 1, -5],
        [0, 0, 0, 0],
      ])}$.`,
      question: r`Which set is a basis for $\operatorname{Col}A$?`,
      choices: [
        ["pivot-orig", r`$\left\{${vec(1, 2, -1)}, ${vec(0, 1, 1)}\right\}$`, undefined],
        ["rref-cols", r`$\left\{${vec(1, 0, 0)}, ${vec(0, 1, 0)}\right\}$`, "Those are columns of the *reduced* matrix. Is $(1, 0, 0)$ even a combination of the columns of $A$? (Try — it isn't.)"],
        ["dep", r`$\left\{${vec(1, 2, -1)}, ${vec(2, 4, -2)}\right\}$`, "Columns 1 and 2 of $A$ are parallel — dependent."],
        ["all", "All four columns of A.", "Four vectors spanning a 2-dimensional space can't be independent."],
      ],
      correct: "pivot-orig",
      hint: "Pivots are in columns 1 and 3. Take those columns from the original matrix, not the reduced one.",
      explanation: r`Pivot columns are 1 and 3, so a basis for $\operatorname{Col}A$ is $\{\mathbf{a}_1, \mathbf{a}_3\} = \left\{${vec(1, 2, -1)}, ${vec(0, 1, 1)}\right\}$. Columns 2 and 4 are combinations of these: $\mathbf{a}_2 = 2\mathbf{a}_1$ and $\mathbf{a}_4 = 3\mathbf{a}_1 - 5\mathbf{a}_3$ — exactly the relations visible in the reduced form.`,
      tags: ["bases", "column-space"],
    }),
    matrix("nul-basis", {
      question: r`For the same $A$, a basis for $\operatorname{Nul}A$ has two vectors. Find the one with $x_2 = 0$ and $x_4 = 1$.`,
      answer: [[-3], [0], [5], [1]],
      hint: r`From the reduced form: $x_1 = -2x_2 - 3x_4$ and $x_3 = 5x_4$.`,
      explanation: r`With $x_2 = 0$, $x_4 = 1$: $x_1 = -3$, $x_3 = 5$, giving $${vec(-3, 0, 5, 1)}$. The other basis vector ($x_2 = 1$, $x_4 = 0$) is $${vec(-2, 1, 0, 0)}$. Check: $A${vec(-3, 0, 5, 1)} = ${vec("-3 + 0 + 0 + 3", "-6 + 0 + 5 + 1", "3 + 0 + 5 - 8")} = \mathbf{0}$ ✓.`,
      tags: ["bases", "null-space"],
    }),
    numeric("col-basis-size", {
      question: r`How many vectors are in a basis for $\operatorname{Col}A$ for that matrix?`,
      answer: 2,
      hint: "One per pivot column.",
      explanation: r`Two pivot columns, so two basis vectors. (You'll call this number the *rank* next lesson.)`,
      tags: ["bases"],
    }),
    tf("echelon-columns", {
      statement: r`If $B$ is an echelon form of $A$, then the pivot columns of $B$ form a basis for $\operatorname{Col}A$.`,
      answer: false,
      feedback: "The pivot columns of B are a basis for Col B. Is Col B the same as Col A?",
      hint: "Row operations change the column space.",
      explanation: r`False. The pivot columns of $B$ form a basis for $\operatorname{Col}B$, which is usually a different subspace. Use the pivot *positions* to select columns of the original $A$.`,
      tags: ["bases"],
    }),
    tf("basis-maximal", {
      statement: "A basis for a subspace is a linearly independent set in the subspace that is as large as possible.",
      answer: true,
      feedback: "Adding any other vector of the subspace would create a dependence, since it's already a combination of the basis.",
      hint: "If a basis spans H, what happens when you add another vector of H to it?",
      explanation: r`True: any extra vector of $H$ is a combination of the basis vectors, so adding it breaks independence. Equivalently, a basis is a spanning set that is as *small* as possible.`,
      tags: ["bases"],
    }),
    mc("poly-basis", {
      question: r`Which set is a basis for $\mathbb{P}_2$ (polynomials of degree at most 2)?`,
      choices: [
        ["std", r`$\{1, t, t^2\}$`, undefined],
        ["short", r`$\{1, t\}$`, "Independent, but it doesn't span — $t^2$ is missing."],
        ["long", r`$\{1, t, t^2, t^3\}$`, "$t^3$ isn't even in $\\mathbb{P}_2$."],
        ["nozero", r`$\{t, t^2\}$`, "Doesn't span: constants can't be built from $t$ and $t^2$."],
      ],
      correct: "std",
      hint: "Every polynomial of degree ≤ 2 is a₀ + a₁t + a₂t² in exactly one way.",
      explanation: r`$\{1, t, t^2\}$ spans $\mathbb{P}_2$ (every $a_0 + a_1t + a_2t^2$ is a combination) and is independent (a polynomial is zero only if all coefficients are zero). It's the standard basis of $\mathbb{P}_2$.`,
      tags: ["bases"],
    }),
    reading(
      "summary",
      r`**What you did:** tested sets for the two basis conditions, built bases for $\operatorname{Nul}A$ and $\operatorname{Col}A$, and avoided the echelon-form trap.

**Remember:** basis = independent + spanning. $\operatorname{Nul}A$: parametric vectors. $\operatorname{Col}A$: pivot columns of the **original** matrix.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Coordinate systems (Lay §4.4)                             */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "u6-l4-coordinate-systems",
    unitId: "u6",
    title: "Coordinate systems",
    summary: "A basis is a measuring grid: every vector gets unique coordinates, and the coordinate map turns any n-dimensional space into ℝⁿ.",
    textbook: "Lay §4.4",
    minutes: 12,
  },
  [
    reading(
      "unique-rep",
      r`**Unique Representation Theorem.** If $\mathcal{B} = \{\mathbf{b}_1, \dots, \mathbf{b}_n\}$ is a basis for $V$, then each $\mathbf{x} \in V$ can be written as $\mathbf{x} = c_1\mathbf{b}_1 + \cdots + c_n\mathbf{b}_n$ in **exactly one** way. The weights are the **$\mathcal{B}$-coordinates** of $\mathbf{x}$, collected in the coordinate vector

$$[\mathbf{x}]_{\mathcal{B}} = ${vec("c_1", "\\vdots", "c_n")}.$$

In $\mathbb{R}^n$, put the basis vectors in a matrix $P_{\mathcal{B}} = [\,\mathbf{b}_1 \cdots \mathbf{b}_n\,]$; then $\mathbf{x} = P_{\mathcal{B}}[\mathbf{x}]_{\mathcal{B}}$, and since $P_{\mathcal{B}}$ is invertible, $[\mathbf{x}]_{\mathcal{B}} = P_{\mathcal{B}}^{-1}\mathbf{x}$.

Below, $\mathbf{b}_1 = (2, 1)$ and $\mathbf{b}_2 = (1, 2)$. The sliders are the $\mathcal{B}$-coordinates; the green vector is the point they name.`,
      {
        title: "Coordinates relative to a basis",
        visual: {
          kind: "vectors",
          config: {
            vectors: [
              { id: "b1", x: 2, y: 1, color: "blue", label: "b₁" },
              { id: "b2", x: 1, y: 2, color: "orange", label: "b₂" },
            ],
            show: ["combination"],
            combination: { of: ["b1", "b2"], a: 1, b: 1, sliders: true, min: -3, max: 3, step: 0.5 },
          },
        },
      },
    ),
    matrix("coords-of-x", {
      question: r`With $\mathcal{B} = \left\{${vec(2, 1)}, ${vec(1, 2)}\right\}$, find $[\mathbf{x}]_{\mathcal{B}}$ for $\mathbf{x} = ${vec(4, 5)}$.`,
      answer: [[1], [2]],
      hint: r`Solve $c_1${vec(2, 1)} + c_2${vec(1, 2)} = ${vec(4, 5)}$ — row reduce $${aug([
        [2, 1, 4],
        [1, 2, 5],
      ])}$.`,
      explanation: r`$2c_1 + c_2 = 4$ and $c_1 + 2c_2 = 5$ give $c_1 = 1$, $c_2 = 2$: $[\mathbf{x}]_{\mathcal{B}} = ${vec(1, 2)}$. Same vector, different description — $(4, 5)$ in standard coordinates, $(1, 2)$ in $\mathcal{B}$-coordinates.`,
      tags: ["coordinates"],
    }),
    matrix("x-from-coords", {
      question: r`Same $\mathcal{B}$. If $[\mathbf{x}]_{\mathcal{B}} = ${vec(3, -1)}$, what is $\mathbf{x}$?`,
      answer: [[5], [1]],
      hint: r`$\mathbf{x} = 3\mathbf{b}_1 - \mathbf{b}_2$.`,
      explanation: r`$\mathbf{x} = 3${vec(2, 1)} - 1${vec(1, 2)} = ${vec(5, 1)}$. This direction (coordinates → vector) is just a linear combination; the other direction requires solving a system.`,
      tags: ["coordinates"],
    }),
    goal("find-coords-sliders", {
      question: r`Now $\mathcal{B} = \left\{${vec(1, 1)}, ${vec(1, -1)}\right\}$. Use the sliders to find $[\mathbf{x}]_{\mathcal{B}}$ for $\mathbf{x} = ${vec(3, 1)}$ — land the green vector on the target.`,
      visual: {
        kind: "vectors",
        config: {
          vectors: [
            { id: "b1", x: 1, y: 1, color: "blue", label: "b₁" },
            { id: "b2", x: 1, y: -1, color: "orange", label: "b₂" },
          ],
          show: ["combination"],
          combination: { of: ["b1", "b2"], a: 1, b: 1, sliders: true, min: -3, max: 3, step: 0.5 },
          goal: { type: "combination-equals", target: [3, 1] },
        },
      },
      hint: r`$c_1 + c_2 = 3$ and $c_1 - c_2 = 1$. Add the equations.`,
      explanation: r`$c_1 = 2$, $c_2 = 1$: $2${vec(1, 1)} + 1${vec(1, -1)} = ${vec(3, 1)}$, so $[\mathbf{x}]_{\mathcal{B}} = ${vec(2, 1)}$. The $\mathcal{B}$-grid is just the standard grid rotated and stretched; coordinates say how many steps along each basis vector.`,
      tags: ["coordinates"],
    }),
    reading(
      "other-spaces",
      r`Coordinates make sense in any vector space with a basis. In $\mathbb{P}_2$ with the standard basis $\{1, t, t^2\}$, the polynomial $p(t) = 2 + 3t - t^2$ has coordinate vector $[p]_{\mathcal{B}} = (2, 3, -1)$.

The **coordinate mapping** $\mathbf{x} \mapsto [\mathbf{x}]_{\mathcal{B}}$ is linear, one-to-one and onto $\mathbb{R}^n$ — an **isomorphism**. So any question about linear combinations, independence or spanning in $V$ can be answered by moving to $\mathbb{R}^n$ and row reducing.`,
      { title: "Coordinates in ℙₙ and the isomorphism" },
    ),
    matrix("poly-coords", {
      question: r`Find the coordinate vector of $p(t) = 4 - t^2$ relative to the standard basis $\{1, t, t^2\}$ of $\mathbb{P}_2$.`,
      answer: [[4], [0], [-1]],
      hint: r`Write $p$ as $a_0\cdot 1 + a_1 t + a_2 t^2$ and read off $(a_0, a_1, a_2)$.`,
      explanation: r`$4 - t^2 = 4\cdot1 + 0\cdot t + (-1)\cdot t^2$, so $[p]_{\mathcal{B}} = ${vec(4, 0, -1)}$. Don't forget the $0$ for the missing $t$ term.`,
      tags: ["coordinates"],
    }),
    mc("poly-independent", {
      question: r`Are $1 + t$, $1 - t$ and $t^2$ linearly independent in $\mathbb{P}_2$?`,
      choices: [
        ["yes", r`Yes — their coordinate vectors $(1, 1, 0)$, $(1, -1, 0)$, $(0, 0, 1)$ are independent in $\mathbb{R}^3$, so they form a basis for $\mathbb{P}_2$.`, undefined],
        ["no", r`No — $1 + t$ and $1 - t$ both involve $1$ and $t$.`, "Sharing terms isn't dependence. Check whether one is a combination of the others via coordinates."],
        ["cant", "Independence isn't defined for polynomials.", "It is — $\\mathbb{P}_2$ is a vector space. Use the coordinate mapping."],
      ],
      correct: "yes",
      hint: "Map each polynomial to its coordinate vector and test independence there.",
      explanation: r`The coordinate matrix $${mat([
        [1, 1, 0],
        [1, -1, 0],
        [0, 0, 1],
      ])}$ has three pivots, so the coordinate vectors are independent, hence so are the polynomials. Three independent vectors in the 3-dimensional space $\mathbb{P}_2$ form a basis.`,
      tags: ["coordinates"],
    }),
    tf("pb-invertible", {
      statement: r`If $\mathcal{B}$ is a basis for $\mathbb{R}^n$, then the change-of-coordinates matrix $P_{\mathcal{B}} = [\mathbf{b}_1 \cdots \mathbf{b}_n]$ is invertible.`,
      answer: true,
      feedback: "Its columns are n independent vectors in ℝⁿ.",
      hint: "Square matrix with linearly independent columns.",
      explanation: r`True: $P_{\mathcal{B}}$ is $n \times n$ with independent columns, so it's invertible by the Invertible Matrix Theorem, and $[\mathbf{x}]_{\mathcal{B}} = P_{\mathcal{B}}^{-1}\mathbf{x}$.`,
      tags: ["coordinates"],
    }),
    tf("coord-map-one-to-one", {
      statement: r`Two different vectors in $V$ can have the same $\mathcal{B}$-coordinate vector.`,
      answer: false,
      feedback: "The coordinate mapping is one-to-one.",
      hint: r`If $[\mathbf{x}]_{\mathcal{B}} = [\mathbf{y}]_{\mathcal{B}}$, rebuild $\mathbf{x}$ and $\mathbf{y}$ from the same weights.`,
      explanation: r`False. Equal coordinate vectors mean the same combination of the basis vectors, hence the same vector. The coordinate map is an isomorphism — one-to-one and onto $\mathbb{R}^n$.`,
      tags: ["coordinates"],
    }),
    reading(
      "summary",
      r`**What you did:** converted between vectors and their coordinates in both directions, read coordinates of polynomials, and used the coordinate map to test independence in $\mathbb{P}_2$.

**Remember:** $\mathbf{x} = P_{\mathcal{B}}[\mathbf{x}]_{\mathcal{B}}$; coordinates → vector is a combination, vector → coordinates is a system to solve.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 5 · Dimension and rank (Lay §4.5)                             */
/* ------------------------------------------------------------------ */

const l5 = lesson(
  {
    id: "u6-l5-dimension-rank",
    unitId: "u6",
    title: "Dimension and rank",
    summary: "Every basis of a space has the same size. The Rank Theorem, the Basis Theorem, and the true/false statements exams love.",
    textbook: "Lay §4.5",
    minutes: 14,
  },
  [
    reading(
      "dimension",
      r`All bases of a vector space $V$ have the same number of vectors; that number is the **dimension** $\dim V$ (and $\dim\{\mathbf{0}\} = 0$). So $\dim\mathbb{R}^n = n$, $\dim\mathbb{P}_n = n + 1$, and the subspaces of $\mathbb{R}^3$ come in four flavours: $\{\mathbf{0}\}$ (dimension 0), lines through the origin (1), planes through the origin (2), and $\mathbb{R}^3$ itself (3).

For a matrix:

- $\dim\operatorname{Nul}A$ = number of **free variables** in $A\mathbf{x} = \mathbf{0}$;
- $\dim\operatorname{Col}A$ = number of **pivot columns**; this number is the **rank** of $A$;
- $\dim\operatorname{Row}A = \operatorname{rank}A$ as well.`,
      { title: "Dimension" },
    ),
    reading(
      "theorems",
      r`**Rank Theorem.** For an $m \times n$ matrix, $\operatorname{rank}A + \dim\operatorname{Nul}A = n$ (the number of columns). Pivot columns plus free columns account for every column.

**Basis Theorem.** If $\dim V = p$, then any linearly independent set of exactly $p$ vectors in $V$ is automatically a basis, and any set of exactly $p$ vectors that spans $V$ is automatically a basis. Once you know the size is right, you only need to check *one* of the two conditions.`,
      { title: "The Rank Theorem and the Basis Theorem" },
    ),
    numeric("nullity", {
      question: r`$A$ is $4 \times 7$ with rank $3$. What is $\dim\operatorname{Nul}A$?`,
      answer: 4,
      hint: "Rank Theorem: rank + nullity = number of columns.",
      explanation: r`$\dim\operatorname{Nul}A = 7 - 3 = 4$.`,
      tags: ["rank"],
    }),
    numeric("nul-of-transpose", {
      question: r`$A$ is $6 \times 4$ and $\dim\operatorname{Nul}A = 1$. What is $\dim\operatorname{Nul}A^T$?`,
      answer: 3,
      hint: r`First find $\operatorname{rank}A$ from the Rank Theorem; $A^T$ has the same rank and $6$ columns.`,
      explanation: r`$\operatorname{rank}A = 4 - 1 = 3$, and $\operatorname{rank}A^T = \operatorname{rank}A = 3$. $A^T$ is $4 \times 6$, so $\dim\operatorname{Nul}A^T = 6 - 3 = 3$.`,
      tags: ["rank"],
    }),
    mc("5x7-rank5", {
      question: r`$A$ is $5 \times 7$ with rank $5$. Which is true?`,
      choices: [
        ["col-all", r`$\operatorname{Col}A = \mathbb{R}^5$ and $\dim\operatorname{Nul}A = 2$.`, undefined],
        ["nul0", r`$\operatorname{Nul}A = \{\mathbf{0}\}$.`, "Seven columns and only five pivots leave two free variables."],
        ["col-dim7", r`$\dim\operatorname{Col}A = 7$.`, "$\\operatorname{Col}A$ sits inside $\\mathbb{R}^5$, so its dimension is at most 5."],
        ["rank-max", "The rank could be larger with different entries.", "Rank is at most min(5, 7) = 5 — this matrix already has the maximum."],
      ],
      correct: "col-all",
      hint: "Five pivots in five rows; seven columns.",
      explanation: r`Rank 5 means a pivot in every row, so $\operatorname{Col}A$ is a 5-dimensional subspace of $\mathbb{R}^5$, i.e. all of it. By the Rank Theorem, $\dim\operatorname{Nul}A = 7 - 5 = 2$.`,
      tags: ["rank"],
    }),
    mc("basis-theorem", {
      question: r`Is $\left\{${vec(1, 2, 3)}, ${vec(0, 1, 1)}, ${vec(1, 0, 0)}\right\}$ a basis for $\mathbb{R}^3$?`,
      choices: [
        ["yes", r`Yes — the three vectors are linearly independent, and three independent vectors in the 3-dimensional space $\mathbb{R}^3$ form a basis.`, undefined],
        ["no-span", "No — you'd also have to check that they span ℝ³, and they don't.", "By the Basis Theorem, independence alone suffices when the count matches the dimension."],
        ["no-dep", "No — they are linearly dependent.", "Put them in a matrix: its determinant is nonzero."],
      ],
      correct: "yes",
      hint: "Check independence (e.g. a determinant), then invoke the Basis Theorem.",
      explanation: r`$\det${mat([
        [1, 0, 1],
        [2, 1, 0],
        [3, 1, 0],
      ])} = 1(0 - 0) - 0 + 1(2 - 3) = -1 \neq 0$, so the vectors are independent. Three independent vectors in $\mathbb{R}^3$ automatically span it (Basis Theorem) — no separate spanning check needed.`,
      tags: ["bases", "rank"],
    }),
    tf("nul-dim-variables", {
      statement: r`The dimension of $\operatorname{Nul}A$ is the number of variables in the equation $A\mathbf{x} = \mathbf{0}$.`,
      answer: false,
      feedback: "It's the number of *free* variables.",
      hint: "Which variables get their own basis vector in the parametric form?",
      explanation: r`False — it's the number of **free** variables, not all variables. (Total variables = rank + nullity.)`,
      tags: ["rank"],
    }),
    tf("spanning-n-basis", {
      statement: r`If $\dim V = n$, then any set of $n$ vectors that spans $V$ is a basis for $V$.`,
      answer: true,
      feedback: "This is half of the Basis Theorem.",
      hint: "Basis Theorem.",
      explanation: r`True. A spanning set can be shrunk to a basis; if it already has exactly $\dim V$ vectors, nothing can be removed, so it's already independent.`,
      tags: ["rank"],
    }),
    tf("plane-subspace", {
      statement: r`A plane in $\mathbb{R}^3$ is a two-dimensional subspace of $\mathbb{R}^3$.`,
      answer: false,
      feedback: "Does every plane pass through the origin?",
      hint: "Subspaces contain the zero vector.",
      explanation: r`False as stated: only planes **through the origin** are subspaces. A plane like $x_3 = 1$ doesn't contain $\mathbf{0}$ and isn't a subspace at all. (Planes through the origin *are* 2-dimensional subspaces.)`,
      tags: ["subspaces", "rank"],
    }),
    tf("more-than-spanning", {
      statement: r`If a set $\{\mathbf{v}_1, \dots, \mathbf{v}_p\}$ spans a finite-dimensional space $V$ and $T$ is a set of more than $p$ vectors in $V$, then $T$ is linearly dependent.`,
      answer: true,
      feedback: "dim V ≤ p, and any independent set has at most dim V vectors.",
      hint: r`A spanning set of size $p$ gives $\dim V \le p$. How large can an independent set be?`,
      explanation: r`True. $\dim V \le p$ (a spanning set contains a basis), and no independent set can exceed $\dim V$ vectors, so a set with more than $p$ vectors is dependent.`,
      tags: ["rank"],
    }),
    numeric("poly-subspace-dim", {
      question: r`What is the dimension of the subspace of $\mathbb{P}_3$ consisting of polynomials with $p(0) = 0$?`,
      answer: 3,
      hint: r`$p(0) = 0$ kills the constant term. What's left?`,
      explanation: r`$p(0) = 0$ means $p(t) = a_1t + a_2t^2 + a_3t^3$, so $\{t, t^2, t^3\}$ is a basis and the dimension is $3$ — one less than $\dim\mathbb{P}_3 = 4$.`,
      tags: ["rank"],
    }),
    tf("row-col-same-dim", {
      statement: r`For any matrix $A$, $\dim\operatorname{Row}A = \dim\operatorname{Col}A$.`,
      answer: true,
      feedback: "Both equal the rank.",
      hint: "Both are the number of pivots.",
      explanation: r`True: both equal $\operatorname{rank}A$, the number of pivot positions — even when $A$ is not square. (Equivalently, $\operatorname{rank}A^T = \operatorname{rank}A$.)`,
      tags: ["rank"],
    }),
    reading(
      "summary",
      r`**What you did:** computed dimensions of null, column and row spaces, applied the Rank and Basis Theorems, and sorted true from false on the classic statements.

**Remember:** $\operatorname{rank}A + \dim\operatorname{Nul}A = n$; $\operatorname{rank}A = \operatorname{rank}A^T$; in a $p$-dimensional space, $p$ independent vectors (or $p$ spanning vectors) form a basis.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 6 · Change of basis (Lay §4.6)                                */
/* ------------------------------------------------------------------ */

const l6 = lesson(
  {
    id: "u6-l6-change-of-basis",
    unitId: "u6",
    title: "Change of basis",
    summary: "Translating coordinates between two bases with one matrix, and how to compute it by row reduction.",
    textbook: "Lay §4.6",
    minutes: 11,
  },
  [
    reading(
      "pcb",
      r`Let $\mathcal{B} = \{\mathbf{b}_1, \dots, \mathbf{b}_n\}$ and $\mathcal{C} = \{\mathbf{c}_1, \dots, \mathbf{c}_n\}$ be bases of $V$. The **change-of-coordinates matrix from $\mathcal{B}$ to $\mathcal{C}$** is

$$\underset{\mathcal{C}\leftarrow\mathcal{B}}{P} = \big[\,[\mathbf{b}_1]_{\mathcal{C}} \;\; [\mathbf{b}_2]_{\mathcal{C}} \;\cdots\; [\mathbf{b}_n]_{\mathcal{C}}\,\big],$$

and it satisfies $[\mathbf{x}]_{\mathcal{C}} = \underset{\mathcal{C}\leftarrow\mathcal{B}}{P}[\mathbf{x}]_{\mathcal{B}}$ for every $\mathbf{x}$. Its columns are the old basis vectors written in the new coordinates. It is invertible, and its inverse is the matrix going the other way: $\underset{\mathcal{B}\leftarrow\mathcal{C}}{P} = \big(\underset{\mathcal{C}\leftarrow\mathcal{B}}{P}\big)^{-1}$.

**Computing it in $\mathbb{R}^n$:** row reduce $[\,\mathbf{c}_1 \cdots \mathbf{c}_n \mid \mathbf{b}_1 \cdots \mathbf{b}_n\,]$ to $[\,I \mid \underset{\mathcal{C}\leftarrow\mathcal{B}}{P}\,]$ — solving all $n$ systems $\mathbf{c}$-weights $= \mathbf{b}_j$ at once.`,
      { title: "One matrix to translate coordinates" },
    ),
    matrix("compute-pcb", {
      question: r`Let $\mathcal{B} = \left\{${vec(1, 2)}, ${vec(-1, 1)}\right\}$ and $\mathcal{C} = \left\{${vec(1, 0)}, ${vec(1, 1)}\right\}$. Find $\underset{\mathcal{C}\leftarrow\mathcal{B}}{P}$.`,
      answer: [
        [-1, -2],
        [2, 1],
      ],
      hint: r`Column 1 is $[\mathbf{b}_1]_{\mathcal{C}}$: solve $x${vec(1, 0)} + y${vec(1, 1)} = ${vec(1, 2)}$. The second entry gives $y$ immediately.`,
      explanation: r`$[\mathbf{b}_1]_{\mathcal{C}}$: $y = 2$, $x = 1 - 2 = -1$, so $(-1, 2)$. $[\mathbf{b}_2]_{\mathcal{C}}$: $y = 1$, $x = -1 - 1 = -2$, so $(-2, 1)$. Hence $\underset{\mathcal{C}\leftarrow\mathcal{B}}{P} = ${mat([
        [-1, -2],
        [2, 1],
      ])}$. Row reducing $\left[\begin{array}{cc|cc}1&1&1&-1\\0&1&2&1\end{array}\right]$ gives the same right half.`,
      tags: ["change-of-basis"],
    }),
    matrix("convert", {
      question: r`With that matrix, if $[\mathbf{x}]_{\mathcal{B}} = ${vec(1, 1)}$, find $[\mathbf{x}]_{\mathcal{C}}$.`,
      answer: [[-3], [3]],
      hint: r`$[\mathbf{x}]_{\mathcal{C}} = P[\mathbf{x}]_{\mathcal{B}}$.`,
      explanation: r`$${mat([
        [-1, -2],
        [2, 1],
      ])}${vec(1, 1)} = ${vec(-3, 3)}$. Sanity check: $\mathbf{x} = \mathbf{b}_1 + \mathbf{b}_2 = (0, 3)$, and $-3${vec(1, 0)} + 3${vec(1, 1)} = (0, 3)$ ✓.`,
      tags: ["change-of-basis"],
    }),
    mc("inverse-direction", {
      question: r`What is $\underset{\mathcal{B}\leftarrow\mathcal{C}}{P}$ for the same bases?`,
      choices: [
        ["inv", r`$\tfrac13${mat([
          [1, 2],
          [-2, -1],
        ])}$`, undefined],
        ["transpose", r`$${mat([
          [-1, 2],
          [-2, 1],
        ])}$`, "That's the transpose. Going the other way requires the *inverse*."],
        ["same", r`$${mat([
          [-1, -2],
          [2, 1],
        ])}$`, "That's the matrix from $\\mathcal{B}$ to $\\mathcal{C}$. The reverse direction is its inverse."],
      ],
      correct: "inv",
      hint: r`Invert $${mat([
        [-1, -2],
        [2, 1],
      ])}$: $ad - bc = -1 + 4 = 3$.`,
      explanation: r`$\underset{\mathcal{B}\leftarrow\mathcal{C}}{P} = \big(\underset{\mathcal{C}\leftarrow\mathcal{B}}{P}\big)^{-1} = \tfrac13${mat([
        [1, 2],
        [-2, -1],
      ])}$. Check: $\tfrac13${mat([
        [1, 2],
        [-2, -1],
      ])}${vec(-3, 3)} = ${vec(1, 1)}$ ✓.`,
      tags: ["change-of-basis"],
    }),
    reading(
      "standard",
      r`When $\mathcal{C}$ is the standard basis $\mathcal{E}$ of $\mathbb{R}^n$, the change-of-coordinates matrix is just $P_{\mathcal{B}} = [\mathbf{b}_1 \cdots \mathbf{b}_n]$ from last lesson, because $[\mathbf{b}_j]_{\mathcal{E}} = \mathbf{b}_j$. And in general

$$\underset{\mathcal{C}\leftarrow\mathcal{B}}{P} = P_{\mathcal{C}}^{-1}P_{\mathcal{B}}:$$

convert $\mathcal{B}$-coordinates to standard coordinates ($P_{\mathcal{B}}$), then standard to $\mathcal{C}$ ($P_{\mathcal{C}}^{-1}$). The row-reduction recipe $[P_{\mathcal{C}} \mid P_{\mathcal{B}}] \to [I \mid P_{\mathcal{C}}^{-1}P_{\mathcal{B}}]$ is exactly this product.`,
      { title: "Through the standard basis" },
    ),
    tf("columns-are-coords", {
      statement: r`The columns of $\underset{\mathcal{C}\leftarrow\mathcal{B}}{P}$ are the $\mathcal{C}$-coordinate vectors of the vectors in $\mathcal{B}$.`,
      answer: true,
      feedback: "That's the definition.",
      hint: "Re-read the definition of the change-of-coordinates matrix.",
      explanation: r`True by definition: column $j$ is $[\mathbf{b}_j]_{\mathcal{C}}$. (A common slip is to put the $\mathcal{B}$-coordinates of the $\mathcal{C}$ vectors instead — that gives the inverse matrix.)`,
      tags: ["change-of-basis"],
    }),
    tf("always-invertible", {
      statement: r`$\underset{\mathcal{C}\leftarrow\mathcal{B}}{P}$ is always invertible.`,
      answer: true,
      feedback: "Its columns are the coordinates of a basis — independent.",
      hint: r`What is $\underset{\mathcal{B}\leftarrow\mathcal{C}}{P}\,\underset{\mathcal{C}\leftarrow\mathcal{B}}{P}$?`,
      explanation: r`True: the columns are the $\mathcal{C}$-coordinates of $n$ independent vectors, hence independent, so the square matrix is invertible — with inverse $\underset{\mathcal{B}\leftarrow\mathcal{C}}{P}$.`,
      tags: ["change-of-basis"],
    }),
    reading(
      "summary",
      r`**What you did:** built a change-of-coordinates matrix column by column, used it to translate coordinates, and inverted it for the reverse direction.

**Remember:** columns of $\underset{\mathcal{C}\leftarrow\mathcal{B}}{P}$ are $[\mathbf{b}_j]_{\mathcal{C}}$; compute via $[\,\mathcal{C} \mid \mathcal{B}\,] \to [\,I \mid P\,]$. That wraps up Unit 6 — take the Level Check.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit                                                                */
/* ------------------------------------------------------------------ */

export const unit6: Unit = {
  id: "u6",
  title: "Vector spaces",
  subtitle: "Subspaces, bases, dimension and coordinates",
  description: "Abstract vector spaces and subspaces, null and column spaces, bases, coordinate systems, dimension and rank, and change of basis.",
  textbook: "Lay §4.1–4.6",
  lessons: [l1, l2, l3, l4, l5, l6],
  practice: [
    mc("p-subspace", {
      question: r`Which set is a subspace of $\mathbb{R}^3$?`,
      choices: [
        ["plane", r`$\{(a, 2a, b) : a, b \in \mathbb{R}\}$`],
        ["shift", r`$\{(a, b, 1) : a, b \in \mathbb{R}\}$`, "Doesn't contain the zero vector."],
        ["product", r`$\{(a, b, c) : abc = 0\}$`, "Not closed under addition: $(1,0,0) + (0,1,1) = (1,1,1)$."],
      ],
      correct: "plane",
      hint: "Write each as a span if you can.",
      explanation: r`$(a, 2a, b) = a(1, 2, 0) + b(0, 0, 1)$ is a span, hence a subspace.`,
      tags: ["subspaces"],
    }),
    matrix("p-nul-vector", {
      question: r`$A = ${mat([
        [1, 0, -2],
        [0, 1, 3],
      ])}$. Find the vector in $\operatorname{Nul}A$ with $x_3 = 1$.`,
      answer: [[2], [-3], [1]],
      hint: "x₁ = 2x₃, x₂ = −3x₃.",
      explanation: r`$x_1 = 2$, $x_2 = -3$, giving $(2, -3, 1)$; indeed $A(2, -3, 1)^T = \mathbf{0}$.`,
      tags: ["null-space"],
    }),
    mc("p-col-basis", {
      question: r`$A = ${mat([
        [1, 3, 2],
        [2, 6, 4],
        [0, 0, 1],
      ])}$ has pivot columns 1 and 3. A basis for $\operatorname{Col}A$ is…`,
      choices: [
        ["orig", r`$\left\{${vec(1, 2, 0)}, ${vec(2, 4, 1)}\right\}$`],
        ["rref", r`$\left\{${vec(1, 0, 0)}, ${vec(0, 0, 1)}\right\}$`, "Columns of the reduced form aren't in Col A."],
        ["two", r`$\left\{${vec(1, 2, 0)}, ${vec(3, 6, 0)}\right\}$`, "Those two columns are parallel."],
      ],
      correct: "orig",
      hint: "Pivot columns of the original matrix.",
      explanation: r`Take columns 1 and 3 of $A$ itself.`,
      tags: ["bases"],
    }),
    numeric("p-rank", {
      question: r`$A$ is $5 \times 8$ with $\dim\operatorname{Nul}A = 5$. What is $\operatorname{rank}A$?`,
      answer: 3,
      hint: "Rank Theorem.",
      explanation: r`$8 - 5 = 3$.`,
      tags: ["rank"],
    }),
    matrix("p-coords", {
      question: r`$\mathcal{B} = \left\{${vec(1, 0)}, ${vec(1, 1)}\right\}$. Find $[\mathbf{x}]_{\mathcal{B}}$ for $\mathbf{x} = ${vec(5, 2)}$.`,
      answer: [[3], [2]],
      hint: "The second entry of x fixes the weight on (1, 1).",
      explanation: r`$c_2 = 2$, then $c_1 + 2 = 5$ gives $c_1 = 3$.`,
      tags: ["coordinates"],
    }),
    numeric("p-dim-p4", {
      question: r`What is $\dim\mathbb{P}_4$?`,
      answer: 5,
      hint: "Count the standard basis {1, t, …, t⁴}.",
      explanation: r`$\{1, t, t^2, t^3, t^4\}$ has 5 elements.`,
      tags: ["rank"],
    }),
    tf("p-tf-basis-count", {
      statement: r`Any four linearly independent vectors in $\mathbb{R}^4$ form a basis for $\mathbb{R}^4$.`,
      answer: true,
      hint: "Basis Theorem.",
      explanation: r`True — count matches the dimension, so independence suffices.`,
      tags: ["rank"],
    }),
    tf("p-tf-nul-rm", {
      statement: r`If $A$ is $3 \times 5$, then $\operatorname{Col}A$ is a subspace of $\mathbb{R}^5$.`,
      answer: false,
      hint: "Columns have 3 entries.",
      explanation: r`False — $\operatorname{Col}A \subseteq \mathbb{R}^3$; it's $\operatorname{Nul}A$ that lives in $\mathbb{R}^5$.`,
      tags: ["column-space"],
    }),
    matrix("p-change-basis", {
      question: r`$\mathcal{B} = \left\{${vec(2, 0)}, ${vec(0, 3)}\right\}$ and $\mathcal{E}$ is the standard basis. Find $\underset{\mathcal{E}\leftarrow\mathcal{B}}{P}$.`,
      answer: [
        [2, 0],
        [0, 3],
      ],
      hint: "Columns are the B vectors in standard coordinates — i.e. themselves.",
      explanation: r`$\underset{\mathcal{E}\leftarrow\mathcal{B}}{P} = P_{\mathcal{B}} = ${mat([
        [2, 0],
        [0, 3],
      ])}$.`,
      tags: ["change-of-basis"],
    }),
    mc("p-kernel", {
      question: r`$T : \mathbb{R}^3 \to \mathbb{R}^2$, $T(\mathbf{x}) = A\mathbf{x}$ with $\operatorname{rank}A = 2$. The kernel of $T$ has dimension…`,
      choices: [
        ["one", "1"],
        ["zero", "0", "Three columns, two pivots: one free variable."],
        ["two", "2", "Rank Theorem: 3 − 2 = 1."],
      ],
      correct: "one",
      hint: "The kernel is Nul A; use the Rank Theorem.",
      explanation: r`$\dim\ker T = \dim\operatorname{Nul}A = 3 - 2 = 1$.`,
      tags: ["kernel", "rank"],
    }),
  ],
  generators: ["gen.rank-nullity", "gen.coordinates"],
};
