import type { Unit } from "../types";
import { aug, goal, lesson, mat, matrix, mc, multi, numeric, order, r, reading, tf, vec } from "../dsl";

/* ------------------------------------------------------------------ */
/* Lesson 1 · When lines meet (Lay §1.1)                                */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "u1-l1-when-lines-meet",
    unitId: "u1",
    title: "When lines meet",
    summary: "What a linear system is, what a solution is, and why there are only three possibilities.",
    textbook: "Lay §1.1",
    minutes: 10,
  },
  [
    reading(
      "intro",
      r`A **linear equation** in the variables $x_1, \dots, x_n$ looks like

$$a_1 x_1 + a_2 x_2 + \cdots + a_n x_n = b,$$

where the coefficients $a_i$ and the constant $b$ are numbers. A **system of linear equations** is a collection of such equations that must all hold at once, and a **solution** is a list of numbers $(s_1, \dots, s_n)$ that makes every equation true.

In two variables each equation is a line, so a solution of a two-equation system is a point lying on *both* lines. Below, the blue line is $x + y = 3$ and the orange line is $x - y = 1$. The green dot is the one point they share.`,
      {
        title: "Two equations, one picture",
        visual: {
          kind: "lines",
          config: {
            lines: [
              { a: 1, b: 1, c: 3 },
              { a: 1, b: -1, c: 1 },
            ],
            range: 5,
          },
        },
      },
    ),
    mc("which-linear", {
      question: "Which of these is a **linear** equation in $x_1, x_2, x_3$?",
      choices: [
        ["a", r`$3x_1 - 2x_2 + x_3 = 7$`],
        ["b", r`$x_1 x_2 + x_3 = 4$`, "The product $x_1 x_2$ multiplies two variables together — that's not allowed in a linear equation."],
        ["c", r`$x_1^2 + x_2 = 1$`, "A squared variable isn't linear. Each variable may only appear to the first power."],
        ["d", r`$\sqrt{x_1} + x_2 - x_3 = 2$`, "A square root of a variable isn't linear."],
      ],
      correct: "a",
      hint: "In a linear equation every variable appears alone, to the first power, multiplied only by a constant. Which option breaks that rule the least?",
      explanation: r`Only $3x_1 - 2x_2 + x_3 = 7$ has the shape $a_1x_1 + a_2x_2 + a_3x_3 = b$. Products of variables, powers and roots all make an equation non-linear — and everything in this course depends on that linearity.`,
      tags: ["definitions"],
    }),
    numeric("solve-2x2", {
      question: r`Solve the system from the picture, $x + y = 3$ and $x - y = 1$. What is $x$?`,
      answer: 2,
      prefix: "x =",
      hint: "You don't need to isolate anything fancy. What happens if you add the two equations together?",
      explanation: r`Adding the equations kills $y$: $(x + y) + (x - y) = 3 + 1$, so $2x = 4$ and $x = 2$. Then $y = 3 - x = 1$. The single solution is $(2, 1)$ — exactly where the two lines cross.`,
      tags: ["solving"],
    }),
    mc("parallel", {
      body: r`Change one number and the picture changes completely. Consider

$$x + y = 3, \qquad x + y = 5.$$`,
      question: "How many solutions does this system have?",
      choices: [
        ["none", "No solution", undefined],
        ["one", "Exactly one solution", "Two different parallel lines never cross, so there is no point on both."],
        ["inf", "Infinitely many solutions", "That would need the two equations to describe the *same* line — but $x + y$ can't be both 3 and 5."],
        ["two", "Exactly two solutions", "Two different lines can't cross twice."],
      ],
      correct: "none",
      hint: r`Both lines have the same slope. Can a point have $x + y = 3$ and $x + y = 5$ at the same time?`,
      explanation: r`No point can satisfy both equations: $x + y$ can't equal 3 and 5 simultaneously. Geometrically the lines are parallel and distinct. A system with no solution is called **inconsistent**.`,
      tags: ["consistency"],
    }),
    goal("make-infinite", {
      question: r`The blue line is fixed at $2x - y = 2$. Use the sliders to change the orange line so the system has **infinitely many** solutions.`,
      visual: {
        kind: "lines",
        config: {
          lines: [
            { a: 2, b: -1, c: 2 },
            { a: 1, b: 1, c: 1, editable: true },
          ],
          range: 5,
          goal: { type: "solutions", target: "infinite" },
        },
      },
      hint: "Infinitely many solutions means every point on the blue line also lies on the orange one. What equation describes the *same* line as $2x - y = 2$?",
      explanation: r`Any nonzero multiple of the blue equation works: $2x - y = 2$ itself, $4x - 2y = 4$, or $-2x + y = -2$. Each describes the same set of points, so the two "lines" coincide and every point on them is a solution. This is what an infinite solution set looks like in two dimensions.`,
      tags: ["consistency", "geometry"],
    }),
    mc("why-not-two", {
      question: "A linear system never has exactly two solutions. What is the real reason?",
      choices: [
        ["line", "If two different points both satisfy every equation, then so does every point on the line through them.", undefined],
        ["cross", "Two lines can only cross once.", "True for two lines in the plane, but the claim holds for *any* number of equations in *any* number of unknowns. The real reason is about the solution set itself."],
        ["unique", "Linear equations always have unique solutions.", "They don't — a single equation in two unknowns has a whole line of solutions."],
        ["can", "It can; the statement is false.", "It never can. Try to imagine a system whose solution set is exactly two points — something forces a third."],
      ],
      correct: "line",
      hint: r`Suppose $\mathbf{p}$ and $\mathbf{q}$ are both solutions. Plug the midpoint $\tfrac12(\mathbf{p} + \mathbf{q})$ into a linear equation — what do you get?`,
      explanation: r`If $\mathbf{p}$ and $\mathbf{q}$ both satisfy $a_1x_1 + \cdots + a_nx_n = b$, then so does every point $\mathbf{p} + t(\mathbf{q} - \mathbf{p})$: the left side is linear, so it evaluates to $(1-t)b + tb = b$. Two solutions force a whole line of them. That is why the only possibilities are **no solution, exactly one, or infinitely many**.`,
      tags: ["theory"],
    }),
    mc("consistent-def", {
      question: "A system is called **consistent** when…",
      choices: [
        ["atleast", "it has at least one solution.", undefined],
        ["exactly", "it has exactly one solution.", "That's too strict — a system with infinitely many solutions is still consistent."],
        ["square", "it has as many equations as unknowns.", "Shape has nothing to do with it; a square system can easily be inconsistent."],
        ["noparallel", "none of its equations are parallel.", "Parallel lines are one way to be inconsistent, but consistency is defined by solutions, not pictures."],
      ],
      correct: "atleast",
      hint: "The textbook defines consistent/inconsistent purely in terms of whether a solution exists.",
      explanation: r`**Consistent** means the solution set is non-empty: one solution or infinitely many both count. **Inconsistent** means no solution at all. Keep the two independent questions separate — *does a solution exist?* (existence) and *is it the only one?* (uniqueness).`,
      tags: ["definitions"],
    }),
    numeric("triangular", {
      body: r`Systems that are already "triangular" are easy to solve from the bottom up:

$$\begin{aligned} x_1 + x_2 + x_3 &= 6 \\ x_2 + x_3 &= 4 \\ x_3 &= 1 \end{aligned}$$`,
      question: r`What is $x_1$?`,
      answer: 2,
      prefix: "x_1 =",
      hint: r`The last equation hands you $x_3$. Substitute it into the middle equation to get $x_2$, then into the top one.`,
      explanation: r`From the bottom: $x_3 = 1$. Then $x_2 = 4 - 1 = 3$. Finally $x_1 = 6 - 3 - 1 = 2$. This "back-substitution" is the payoff of row reduction — the next lessons are about turning *any* system into this triangular shape.`,
      tags: ["solving"],
    }),
    tf("three-eq-two-unknowns", {
      statement: "If a system of three equations in two unknowns has a solution, that solution must be unique.",
      answer: false,
      feedback: "Three lines through a common point *usually* pin down one solution — but what if all three equations describe the same line?",
      hint: "Could all three equations be multiples of each other?",
      explanation: r`False. The three equations could all describe the same line (e.g. $x + y = 1$, $2x + 2y = 2$, $3x + 3y = 3$), giving infinitely many solutions. More equations don't guarantee uniqueness; what matters is how many *independent* constraints they impose — a theme that will return as *pivots*.`,
      tags: ["theory"],
    }),
    reading(
      "summary",
      r`**What you did:** you solved small systems by hand, saw that the solution set of a system is the intersection of its equations' lines or planes, and argued why that set is always empty, a single point, or infinite.

**Two questions to keep asking about any system:**

- *Existence* — is the system consistent (at least one solution)?
- *Uniqueness* — if so, is the solution the only one?

Next: a bookkeeping device (the **augmented matrix**) and three moves (**row operations**) that let you answer both questions systematically for systems of any size.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Row operations (Lay §1.1)                                 */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "u1-l2-row-operations",
    unitId: "u1",
    title: "Row operations",
    summary: "Encode a system as an augmented matrix and learn the three moves that never change its solutions.",
    textbook: "Lay §1.1",
    minutes: 12,
  },
  [
    reading(
      "aug-intro",
      r`Writing the variables over and over is wasteful. The system

$$\begin{aligned} x_1 - 2x_2 &= -1 \\ -x_1 + 3x_2 &= 3 \end{aligned}$$

is captured completely by its **augmented matrix**

$$${aug([
        [1, -2, -1],
        [-1, 3, 3],
      ])},$$

one row per equation, one column per variable, and a last column for the constants. The matrix of coefficients alone, $${mat([
        [1, -2],
        [-1, 3],
      ])}$, is the **coefficient matrix**. Sizes are quoted as *rows × columns*: this augmented matrix is $2 \times 3$.`,
      { title: "The augmented matrix" },
    ),
    matrix("write-aug", {
      question: r`Write the augmented matrix of the system $\;2x_1 + x_2 = 5,\; x_1 - 3x_2 = -1.$`,
      answer: [
        [2, 1, 5],
        [1, -3, -1],
      ],
      augmented: true,
      hint: "Each row is one equation: the coefficients of $x_1$ and $x_2$, then the constant on the right.",
      explanation: r`Row 1 is $(2, 1 \mid 5)$ and row 2 is $(1, -3 \mid -1)$. Watch the sign on $-3$: a coefficient of $-3x_2$ goes in as $-3$. Missing variables get a $0$.`,
      tags: ["augmented-matrix"],
    }),
    reading(
      "ops",
      r`Three **elementary row operations** turn a system into an easier one with *exactly the same* solution set:

1. **Replacement** — replace one row by the sum of itself and a multiple of another row: $R_i \to R_i + c\,R_j$.
2. **Interchange** — swap two rows: $R_i \leftrightarrow R_j$.
3. **Scaling** — multiply a row by a *nonzero* constant: $R_i \to c\,R_i$.

Why don't they change the solutions? Each move is **reversible** (undo a replacement by subtracting, undo a swap by swapping back, undo scaling by $1/c$), so any solution of the old system solves the new one and vice versa. Two matrices connected by row operations are called **row equivalent**.`,
      { title: "Three legal moves" },
    ),
    mc("illegal-op", {
      question: "Which of these is **not** a legal row operation?",
      choices: [
        ["rep", r`$R_2 \to R_2 + 3R_1$`, "That's a replacement — perfectly legal and reversible."],
        ["zero", r`$R_1 \to 0 \cdot R_1$`, undefined],
        ["swap", r`$R_1 \leftrightarrow R_2$`, "Swapping rows just reorders the equations."],
        ["half", r`$R_2 \to -\tfrac12 R_2$`, "Scaling by any nonzero constant is fine, negative fractions included."],
      ],
      correct: "zero",
      hint: "Each legal move must be reversible. Which one throws information away forever?",
      explanation: r`Multiplying a row by $0$ wipes out an equation — you can't undo it, and the new system can have solutions the old one didn't. Scaling is only allowed by a **nonzero** constant.`,
      tags: ["row-operations"],
    }),
    goal("reduce-2x3", {
      body: r`Now do it yourself. Each operation you apply is checked exactly (fractions are fine, e.g. \`-1/2\`).`,
      question: r`Use row operations to put this augmented matrix in **echelon form** — the entry below the leading $1$ must become $0$.`,
      visual: {
        kind: "row-reducer",
        config: {
          matrix: [
            [1, -2, -1],
            [-1, 3, 3],
          ],
          augmented: true,
          target: "ref",
        },
      },
      hint: r`You want to cancel the $-1$ in row 2 using row 1. What multiple of $R_1$ should you add to $R_2$?`,
      explanation: r`One replacement does it: $R_2 \to R_2 + R_1$ gives $${aug([
        [1, -2, -1],
        [0, 1, 2],
      ])}.$ The bottom row now reads $x_2 = 2$, and the system is triangular.`,
      tags: ["row-operations"],
    }),
    numeric("back-sub", {
      body: r`After that operation the matrix is $${aug([
        [1, -2, -1],
        [0, 1, 2],
      ])}$.`,
      question: r`What is $x_1$?`,
      answer: 3,
      prefix: "x_1 =",
      hint: r`Row 2 says $x_2 = 2$. Row 1 says $x_1 - 2x_2 = -1$. Substitute.`,
      explanation: r`From row 2, $x_2 = 2$. Row 1 gives $x_1 - 2(2) = -1$, so $x_1 = 3$. Check in the original system: $3 - 4 = -1$ ✓ and $-3 + 6 = 3$ ✓.`,
      tags: ["solving"],
    }),
    mc("row-of-contradiction", {
      question: r`While reducing an augmented matrix you produce the row $\;[\,0 \;\; 0 \;\; 0 \mid 5\,]$. What does it tell you?`,
      choices: [
        ["incons", "The system is inconsistent — it has no solution.", undefined],
        ["x3", r`$x_3 = 5$.`, "Read the row as an equation: $0x_1 + 0x_2 + 0x_3 = 5$. The coefficient of $x_3$ is $0$, not $1$."],
        ["inf", "The system has infinitely many solutions.", "A row of zeros *with a zero on the right* would suggest that. The 5 on the right is the opposite situation."],
        ["homog", "The system is homogeneous.", "Homogeneous means all constants are 0 — this row has a 5."],
      ],
      correct: "incons",
      hint: r`Translate the row back into an equation: $0 \cdot x_1 + 0\cdot x_2 + 0 \cdot x_3 = 5$. Can any numbers satisfy that?`,
      explanation: r`The row says $0 = 5$, which no choice of variables can fix. Because row operations preserve solutions, the *original* system has no solution either: it is **inconsistent**. A row $[\,0\ 0\ 0 \mid 0\,]$, by contrast, is harmless — it's just $0 = 0$.`,
      tags: ["consistency"],
    }),
    goal("reduce-3x4", {
      question: r`Bring this $3 \times 4$ augmented matrix to **echelon form** (zeros below each leading entry; a zero row, if any, at the bottom).`,
      visual: {
        kind: "row-reducer",
        config: {
          matrix: [
            [1, 1, 1, 6],
            [0, 1, 1, 4],
            [1, 2, 3, 11],
          ],
          augmented: true,
          target: "ref",
        },
      },
      hint: r`Work column by column. First clear the $1$ at the bottom of column 1 using row 1; then look at column 2.`,
      explanation: r`$R_3 \to R_3 - R_1$ gives row 3 $= (0, 1, 2 \mid 5)$; then $R_3 \to R_3 - R_2$ gives $(0, 0, 1 \mid 1)$. The result $${aug([
        [1, 1, 1, 6],
        [0, 1, 1, 4],
        [0, 0, 1, 1],
      ])}$ is in echelon form. Different sequences of operations can reach different echelon forms — that's fine.`,
      tags: ["row-operations"],
    }),
    numeric("solve-3x4", {
      body: r`From the echelon form $${aug([
        [1, 1, 1, 6],
        [0, 1, 1, 4],
        [0, 0, 1, 1],
      ])}$ the system is triangular.`,
      question: r`What is $x_1$?`,
      answer: 2,
      prefix: "x_1 =",
      hint: "Back-substitute from the bottom row upward.",
      explanation: r`$x_3 = 1$, then $x_2 = 4 - 1 = 3$, then $x_1 = 6 - 3 - 1 = 2$. The solution is $(2, 3, 1)$.`,
      tags: ["solving"],
    }),
    tf("row-equiv-same-solutions", {
      statement: "If two augmented matrices are row equivalent, the systems they represent have the same solution set.",
      answer: true,
      feedback: "Think about what each elementary row operation does to the solutions — and whether it can be undone.",
      hint: "Each row operation is reversible. What does that imply about the solution sets before and after?",
      explanation: r`True — this is the whole point of row reduction. Every elementary row operation is reversible, so the two systems constrain the variables in exactly the same way. (This is Lay's Theorem 1-style fact and you will use it constantly.)`,
      tags: ["theory"],
    }),
    reading(
      "summary",
      r`**What you did:** translated systems into augmented matrices, applied the three elementary row operations yourself, and used the resulting triangular shape to back-substitute.

**Remember:**

- Replacement, interchange and scaling (by a nonzero number) never change the solution set.
- A row $[\,0 \cdots 0 \mid b\,]$ with $b \neq 0$ means **inconsistent**.

Next: a precise definition of the "triangular" target — **echelon form** — and its unique cousin, **reduced echelon form**.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Echelon forms and pivots (Lay §1.2)                        */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "u1-l3-echelon-forms",
    unitId: "u1",
    title: "Echelon forms and pivots",
    summary: "Recognise echelon and reduced echelon form, and locate pivot positions.",
    textbook: "Lay §1.2",
    minutes: 12,
  },
  [
    reading(
      "defs",
      r`A matrix is in **echelon form** (row echelon form) when:

1. all nonzero rows are above any rows of all zeros;
2. each leading entry (the first nonzero entry) of a row is in a column to the **right** of the leading entry of the row above it;
3. all entries in a column below a leading entry are zero.

It is in **reduced echelon form** when additionally:

4. the leading entry in each nonzero row is $1$;
5. each leading $1$ is the **only** nonzero entry in its column.

For example $${mat([
        [1, 2, 0, 4],
        [0, 0, 1, -3],
        [0, 0, 0, 0],
      ])}$ is in reduced echelon form, while $${mat([
        [2, 1, 5],
        [0, 3, 1],
      ])}$ is in echelon form but not reduced.`,
      { title: "Echelon and reduced echelon form" },
    ),
    mc("which-ref", {
      question: "Which matrix is in echelon form but **not** reduced echelon form?",
      choices: [
        [
          "a",
          r`$${mat([
            [1, 2, 0],
            [0, 1, 3],
            [0, 0, 0],
          ])}$`,
          undefined,
        ],
        [
          "b",
          r`$${mat([
            [0, 1, 2],
            [1, 0, 3],
          ])}$`,
          "Row 2's leading entry is to the *left* of row 1's. That violates condition 2 — it isn't even in echelon form.",
        ],
        [
          "c",
          r`$${mat([
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
          ])}$`,
          "The identity matrix satisfies all five conditions — it's fully reduced.",
        ],
        [
          "d",
          r`$${mat([
            [1, 2, 3],
            [0, 0, 0],
            [0, 0, 4],
          ])}$`,
          "A zero row sitting above a nonzero row breaks condition 1.",
        ],
      ],
      correct: "a",
      hint: "First rule out the ones that fail echelon form (zero row placement, staircase of leading entries). Then check whether every leading 1 is alone in its column.",
      explanation: r`Matrix (a) has the staircase shape, so it's in echelon form, but the $2$ sits above the leading $1$ of row 2 — condition 5 fails, so it isn't reduced. (b) and (d) fail echelon form outright, and (c) is reduced.`,
      tags: ["echelon-form"],
    }),
    mc("which-rref", {
      question: "Which matrix is in **reduced** echelon form?",
      choices: [
        [
          "a",
          r`$${mat([
            [1, 0, 2],
            [0, 1, -1],
          ])}$`,
          undefined,
        ],
        [
          "b",
          r`$${mat([
            [1, 1, 0],
            [0, 1, 0],
          ])}$`,
          "Look at column 2: the leading 1 of row 2 has a 1 above it. Reduced form needs zeros above *and* below each leading 1.",
        ],
        [
          "c",
          r`$${mat([
            [2, 0, 0],
            [0, 1, 0],
          ])}$`,
          "The leading entry of row 1 is 2, not 1.",
        ],
        [
          "d",
          r`$${mat([
            [0, 0, 0],
            [0, 0, 1],
          ])}$`,
          "The zero row must be at the bottom.",
        ],
      ],
      correct: "a",
      hint: "Check the two extra conditions: leading entries equal to 1, and nothing else nonzero in a pivot column.",
      explanation: r`In (a) both leading entries are $1$ and each is alone in its column; the $2$ and $-1$ live in a *non-pivot* column, which is allowed. The others each break one condition.`,
      tags: ["echelon-form"],
    }),
    reading(
      "pivots",
      r`A matrix can have many echelon forms, but **its reduced echelon form is unique**. That lets us define things that depend only on the matrix:

- a **pivot position** is a location that holds a leading $1$ in the reduced echelon form;
- a **pivot column** is a column containing a pivot position.

Any echelon form reveals the pivot positions — the leading entries sit in the same spots. Counting pivots is the single most useful skill in this chapter: it answers existence, uniqueness, independence, invertibility and rank questions later on.`,
      { title: "Pivots" },
    ),
    matrix("rref-2x3", {
      question: r`Find the reduced echelon form of $${mat([
        [1, 2, 3],
        [2, 4, 7],
      ])}$.`,
      answer: [
        [1, 2, 0],
        [0, 0, 1],
      ],
      hint: r`Start with $R_2 \to R_2 - 2R_1$. Then look at what's left in row 2 and clear *above* its leading entry.`,
      explanation: r`$R_2 \to R_2 - 2R_1$ gives $${mat([
        [1, 2, 3],
        [0, 0, 1],
      ])}$. The leading entry of row 2 is in column 3, so clear above it: $R_1 \to R_1 - 3R_2$ gives $${mat([
        [1, 2, 0],
        [0, 0, 1],
      ])}$. Column 2 is not a pivot column — the $2$ there can't be removed.`,
      tags: ["rref"],
    }),
    mc("pivot-cols", {
      question: r`For the matrix $${mat([
        [1, 2, 3],
        [2, 4, 7],
      ])}$ from the previous step, which columns are pivot columns?`,
      choices: [
        ["13", "Columns 1 and 3", undefined],
        ["12", "Columns 1 and 2", "Column 2 of the reduced form is $(2, 0)$ — no leading 1 there."],
        ["23", "Columns 2 and 3", "Column 1 holds the leading 1 of row 1."],
        ["1", "Column 1 only", "There are two nonzero rows in the reduced form, so there are two pivots."],
      ],
      correct: "13",
      hint: "Look at the reduced echelon form you just found. Where are the leading 1s?",
      explanation: r`The reduced form $${mat([
        [1, 2, 0],
        [0, 0, 1],
      ])}$ has leading 1s in columns 1 and 3. Column 2 is a non-pivot column — a sign that $x_2$ will be a *free variable* when this is a coefficient matrix.`,
      tags: ["pivots"],
    }),
    goal("to-rref", {
      question: r`Row reduce this matrix all the way to **reduced** echelon form.`,
      visual: {
        kind: "row-reducer",
        config: {
          matrix: [
            [2, 4, -2],
            [1, 3, 0],
          ],
          target: "rref",
        },
      },
      hint: r`A leading $1$ is easiest to get by swapping so the row starting with $1$ is on top. Then clear below, scale, and clear above.`,
      explanation: r`One route: $R_1 \leftrightarrow R_2$ gives $${mat([
        [1, 3, 0],
        [2, 4, -2],
      ])}$; $R_2 \to R_2 - 2R_1$ gives $${mat([
        [1, 3, 0],
        [0, -2, -2],
      ])}$; $R_2 \to -\tfrac12 R_2$ gives $${mat([
        [1, 3, 0],
        [0, 1, 1],
      ])}$; finally $R_1 \to R_1 - 3R_2$ gives $${mat([
        [1, 0, -3],
        [0, 1, 1],
      ])}$. Whatever route you took, you must land on this same matrix — reduced echelon form is unique.`,
      tags: ["rref"],
    }),
    numeric("max-pivots", {
      question: r`What is the largest number of pivot positions a $3 \times 5$ matrix can have?`,
      answer: 3,
      hint: "Each pivot needs its own row *and* its own column. Which is scarcer here?",
      explanation: r`At most one pivot per row and at most one per column, so the count is at most $\min(3, 5) = 3$. A $3\times 5$ matrix with 3 pivots has a pivot in every row — a fact that will matter when we ask whether $A\mathbf{x} = \mathbf{b}$ is solvable for every $\mathbf{b}$.`,
      tags: ["pivots"],
    }),
    tf("ref-unique", {
      statement: "The echelon form of a matrix is unique.",
      answer: false,
      feedback: "Careful — one of the two forms is unique and the other is not. Which word is missing from the statement?",
      hint: r`Take any echelon form and scale a nonzero row by 2. Is the result still in echelon form?`,
      explanation: r`False: scaling a nonzero row of an echelon form by $2$ yields a different echelon form of the same matrix. It is the **reduced** echelon form that is unique (Lay's Theorem 1 in §1.2). Exam T/F questions love this distinction.`,
      tags: ["theory"],
    }),
    reading(
      "summary",
      r`**What you did:** classified matrices by the five echelon conditions, reduced matrices by hand, and read off pivot positions.

**Remember:**

- Echelon form: staircase of leading entries, zeros below, zero rows at the bottom.
- Reduced: leading entries are $1$ and alone in their columns. Unique.
- Pivot columns are determined by the matrix, not by how you reduced it.

Next: using the reduced form to write down **every** solution of a system.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Reading off solutions (Lay §1.2)                           */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "u1-l4-reading-solutions",
    unitId: "u1",
    title: "Reading off solutions",
    summary: "Basic vs. free variables, the general solution, and the existence & uniqueness theorem.",
    textbook: "Lay §1.2",
    minutes: 12,
  },
  [
    reading(
      "basic-free",
      r`Suppose the augmented matrix of a system in $x_1, x_2, x_3$ reduces to

$$${aug([
        [1, 0, -3, 2],
        [0, 1, 1, 4],
      ])}.$$

Columns 1 and 2 are pivot columns, so $x_1$ and $x_2$ are **basic variables**. Column 3 is not, so $x_3$ is a **free variable** — it can be anything. Solving each row for its basic variable gives the **general solution**:

$$x_1 = 2 + 3x_3, \qquad x_2 = 4 - x_3, \qquad x_3 \text{ free}.$$

Every choice of $x_3$ produces a different solution, so the system has infinitely many.`,
      { title: "Basic and free variables" },
    ),
    mc("which-free", {
      body: r`An augmented matrix reduces to $${aug([
        [1, 0, 5, -1],
        [0, 1, -2, 3],
        [0, 0, 0, 0],
      ])}$ (variables $x_1, x_2, x_3$).`,
      question: "Which variable is free?",
      choices: [
        ["x1", r`$x_1$`, "Column 1 has a pivot, so $x_1$ is basic."],
        ["x2", r`$x_2$`, "Column 2 has a pivot, so $x_2$ is basic."],
        ["x3", r`$x_3$`, undefined],
        ["none", "No variable is free; the solution is unique.", "Count pivots: two pivots, three variables. The leftover variable is free."],
      ],
      correct: "x3",
      hint: "Free variables correspond to the columns of the coefficient matrix that are *not* pivot columns.",
      explanation: r`Pivots sit in columns 1 and 2, so $x_3$ is free. The zero row $[\,0\ 0\ 0 \mid 0\,]$ is just $0 = 0$ and doesn't restrict anything. General solution: $x_1 = -1 - 5x_3,\; x_2 = 3 + 2x_3,\; x_3$ free.`,
      tags: ["free-variables"],
    }),
    numeric("particular", {
      question: r`In that same system, if you choose $x_3 = 2$, what is $x_1$?`,
      answer: -11,
      prefix: "x_1 =",
      hint: r`Row 1 reads $x_1 + 5x_3 = -1$. Substitute $x_3 = 2$.`,
      explanation: r`$x_1 = -1 - 5x_3 = -1 - 10 = -11$ (and $x_2 = 3 + 4 = 7$). The point $(-11, 7, 2)$ is one of infinitely many solutions.`,
      tags: ["free-variables"],
    }),
    mc("inconsistent-form", {
      body: r`**Existence & uniqueness theorem.** A system is consistent **if and only if** the rightmost column of its augmented matrix is *not* a pivot column — i.e. no echelon form has a row $[\,0 \cdots 0 \mid b\,]$ with $b \ne 0$. A consistent system has a unique solution when there are no free variables, and infinitely many when there is at least one.`,
      question: "Which augmented matrix (in echelon form) represents an **inconsistent** system?",
      choices: [
        [
          "a",
          r`$${aug([
            [1, 2, 3],
            [0, 0, 4],
          ])}$`,
          undefined,
        ],
        [
          "b",
          r`$${aug([
            [1, 2, 3],
            [0, 0, 0],
          ])}$`,
          "The bottom row is $0 = 0$. That's consistent with a free variable — infinitely many solutions.",
        ],
        [
          "c",
          r`$${aug([
            [1, 2, 3],
            [0, 1, 4],
          ])}$`,
          "Two pivots, two variables, no contradiction: a unique solution.",
        ],
        [
          "d",
          r`$${aug([
            [1, 0, 0],
            [0, 1, 0],
          ])}$`,
          "This is the unique solution $x_1 = x_2 = 0$.",
        ],
      ],
      correct: "a",
      hint: "Look for a pivot in the augmented (rightmost) column.",
      explanation: r`In (a) the bottom row says $0x_1 + 0x_2 = 4$, impossible — the pivot is in the augmented column. (b) has a free variable (infinitely many), (c) and (d) have unique solutions.`,
      tags: ["consistency"],
    }),
    mc("unique-when", {
      question: "A **consistent** system has exactly one solution precisely when…",
      choices: [
        ["nofree", "there are no free variables — every column of the coefficient matrix is a pivot column.", undefined],
        ["square", "the number of equations equals the number of unknowns.", "Square systems can have infinitely many solutions (or none). Shape alone decides nothing."],
        ["everyrow", "the augmented matrix has a pivot in every row.", "A pivot in every row is about *existence* for every right-hand side, not about uniqueness."],
        ["zerorow", "its reduced echelon form has a zero row.", "A zero row means an equation was redundant; it says nothing about free variables."],
      ],
      correct: "nofree",
      hint: "Uniqueness fails exactly when some variable can be chosen freely.",
      explanation: r`Each free variable is a dial you can turn to produce new solutions. No free variables ⟺ every variable is basic ⟺ every column of the coefficient matrix has a pivot. This is the uniqueness half of the theorem.`,
      tags: ["uniqueness"],
    }),
    numeric("count-free", {
      question: r`A consistent system has 5 unknowns, and its coefficient matrix has 3 pivot columns. How many free variables are there?`,
      answer: 2,
      hint: "Every variable is either basic (pivot column) or free (non-pivot column).",
      explanation: r`$5$ variables $- 3$ basic $= 2$ free variables, so the solution set has two free parameters (geometrically, a plane inside $\mathbb{R}^5$).`,
      tags: ["free-variables"],
    }),
    order("procedure", {
      question: "Put the steps of the row-reduction algorithm for solving a system in order.",
      items: [
        ["aug", "Write the augmented matrix of the system."],
        ["ref", "Row reduce to an echelon form and decide whether the system is consistent."],
        ["rref", "Continue to the reduced echelon form."],
        ["gen", "Write the general solution, expressing each basic variable in terms of the free variables."],
      ],
      hint: "You can't decide consistency until you have an echelon form, and you don't want to reduce all the way if the system turns out to be inconsistent.",
      explanation: r`Augmented matrix → echelon form (check for a $[\,0\cdots0 \mid b\,]$ row) → reduced form → general solution. Stopping at echelon form to check consistency saves work on inconsistent systems.`,
      tags: ["procedure"],
    }),
    matrix("solve-unique", {
      question: r`Solve $\;x_1 + 2x_2 = 5,\; 3x_1 + 7x_2 = 16\;$ and enter the solution as a column vector $${vec("x_1", "x_2")}$.`,
      answer: [[3], [1]],
      prefix: r`$\mathbf{x} =$`,
      hint: r`Row reduce $${aug([
        [1, 2, 5],
        [3, 7, 16],
      ])}$: start with $R_2 \to R_2 - 3R_1$.`,
      explanation: r`$R_2 \to R_2 - 3R_1$ gives $${aug([
        [1, 2, 5],
        [0, 1, 1],
      ])}$, then $R_1 \to R_1 - 2R_2$ gives $${aug([
        [1, 0, 3],
        [0, 1, 1],
      ])}$. So $x_1 = 3,\ x_2 = 1$. Two pivots, two variables, no free variables — a unique solution.`,
      tags: ["solving"],
    }),
    tf("pivot-every-row-consistent", {
      statement: "If the **augmented** matrix of a system has a pivot in every row, the system is consistent.",
      answer: false,
      feedback: "Where could the pivot of the last row be sitting?",
      hint: r`Consider $${aug([
        [1, 0, 0],
        [0, 0, 1],
      ])}$. It has a pivot in every row. Is the system consistent?`,
      explanation: r`False. The pivot of a row might be in the augmented column, e.g. $${aug([
        [1, 0, 0],
        [0, 0, 1],
      ])}$ has pivots in both rows yet says $0 = 1$. The true statement is about the **coefficient** matrix: if $A$ has a pivot in every row, then $A\mathbf{x} = \mathbf{b}$ is consistent for every $\mathbf{b}$ (coming in Unit 2).`,
      tags: ["theory"],
    }),
    reading(
      "summary",
      r`**What you did:** separated variables into basic and free, wrote general solutions, and applied the existence & uniqueness theorem.

**The two-question checklist, now precise:**

- *Existence:* consistent ⟺ no pivot in the augmented column.
- *Uniqueness:* unique ⟺ no free variables.

Next: the classic exam problem — a system containing an unknown parameter $h$.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 5 · Systems with a parameter (Lay §1.1–1.2)                    */
/* ------------------------------------------------------------------ */

const l5 = lesson(
  {
    id: "u1-l5-parameters",
    unitId: "u1",
    title: "Systems with a parameter",
    summary: "For which values of h is the system consistent, unique, or infinite? Reduce symbolically.",
    textbook: "Lay §1.1–1.2",
    minutes: 12,
  },
  [
    reading(
      "intro",
      r`Exams love this question: *"For which values of $h$ does the system have (a) no solution, (b) exactly one, (c) infinitely many?"*

The method is the same as always — row reduce — except one entry is a letter. Keep $h$ as a symbol, reduce to echelon form, and then read the pivot structure **case by case**: an entry like $h - 6$ is a pivot when $h \neq 6$ and a zero when $h = 6$.`,
      { title: "A letter in the matrix" },
    ),
    numeric("h-infinite", {
      body: r`Consider

$$\begin{aligned} x_1 + 3x_2 &= 4 \\ 2x_1 + h\,x_2 &= 8 \end{aligned}$$`,
      question: r`For which value of $h$ does the system have **infinitely many** solutions?`,
      answer: 6,
      prefix: "h =",
      hint: r`Apply $R_2 \to R_2 - 2R_1$ to $${aug([
        [1, 3, 4],
        [2, "h", 8],
      ])}$ and look at the new row 2.`,
      explanation: r`$R_2 \to R_2 - 2R_1$ gives $${aug([
        [1, 3, 4],
        [0, "h-6", 0],
      ])}$. When $h = 6$ the second row is all zeros: one pivot, two variables, so $x_2$ is free and there are infinitely many solutions.`,
      tags: ["parameters"],
    }),
    mc("h-otherwise", {
      question: r`In the same system, what happens when $h \neq 6$?`,
      choices: [
        ["one", "Exactly one solution.", undefined],
        ["none", "No solution.", "The right-hand entry of row 2 is $0$, so there's never a contradiction $0 = b$ with $b \neq 0$."],
        ["inf", "Infinitely many solutions.", "When $h - 6 \neq 0$ it is a pivot, so $x_2$ is no longer free."],
        ["depends", "It depends on the sign of $h$.", "Only whether $h - 6$ is zero matters, not its sign."],
      ],
      correct: "one",
      hint: r`If $h - 6 \neq 0$, then column 2 gets a pivot. How many pivots, how many variables?`,
      explanation: r`For $h \neq 6$ the reduced row 2 is $(h - 6)x_2 = 0$, so $x_2 = 0$ and then $x_1 = 4$: two pivots, two variables, a unique solution. Note this system is consistent for **every** $h$.`,
      tags: ["parameters"],
    }),
    numeric("h-inconsistent", {
      body: r`Now the parameter is in a different spot:

$$\begin{aligned} x_1 + h\,x_2 &= 2 \\ 2x_1 + 4x_2 &= 7 \end{aligned}$$`,
      question: r`For which value of $h$ is the system **inconsistent**?`,
      answer: 2,
      prefix: "h =",
      hint: r`Again $R_2 \to R_2 - 2R_1$. This time watch the right-hand side of the new row 2 as well.`,
      explanation: r`$R_2 \to R_2 - 2R_1$ gives $${aug([
        [1, "h", 2],
        [0, "4-2h", 3],
      ])}$. If $4 - 2h = 0$, i.e. $h = 2$, row 2 reads $0 = 3$: inconsistent. For every other $h$ the system has a unique solution. No value of $h$ gives infinitely many — the $3$ on the right never vanishes.`,
      tags: ["parameters"],
    }),
    numeric("k-3x3", {
      body: r`A $3\times3$ version:

$$\begin{aligned} x_1 - x_2 + 2x_3 &= 1 \\ 2x_1 - x_2 + 5x_3 &= 4 \\ x_1 + 2x_2 + k\,x_3 &= 7 \end{aligned}$$`,
      question: r`For which value of $k$ does the system have **infinitely many** solutions?`,
      answer: 5,
      prefix: "k =",
      hint: r`Clear column 1 with $R_2 \to R_2 - 2R_1$ and $R_3 \to R_3 - R_1$, then clear column 2 using the new row 2.`,
      explanation: r`After $R_2 \to R_2 - 2R_1$ and $R_3 \to R_3 - R_1$: $${aug([
        [1, -1, 2, 1],
        [0, 1, 1, 2],
        [0, 3, "k-2", 6],
      ])}$. Then $R_3 \to R_3 - 3R_2$: row 3 becomes $(0, 0, k - 5 \mid 0)$. When $k = 5$ the row vanishes, leaving a free variable $x_3$ and infinitely many solutions.`,
      tags: ["parameters"],
    }),
    mc("k-inconsistent", {
      question: r`For the same $3\times 3$ system, is there a value of $k$ that makes it **inconsistent**?`,
      choices: [
        ["no", r`No — it is consistent for every $k$.`, undefined],
        ["k5", r`Yes, $k = 5$.`, "At $k = 5$ the last row is $0 = 0$, which is harmless. Inconsistency needs a nonzero number on the right."],
        ["k0", r`Yes, $k = 0$.`, "Try it: with $k = 0$ the last row is $-5x_3 = 0$ — a pivot, giving a unique solution."],
        ["k2", r`Yes, $k = 2$.`, "The reduced row 3 is $(0, 0, k-5 \mid 0)$; $k = 2$ just makes the pivot $-3$."],
      ],
      correct: "no",
      hint: r`The reduced row 3 is $(0,\,0,\,k - 5 \mid 0)$. What's on the right-hand side, whatever $k$ is?`,
      explanation: r`The right-hand entry of the reduced row 3 is $0$ for every $k$, so a contradiction $0 = b \neq 0$ can never appear. Unique solution for $k \neq 5$, infinitely many for $k = 5$, inconsistent for no $k$.`,
      tags: ["parameters"],
    }),
    numeric("h-and-k", {
      body: r`Two parameters: $$\begin{aligned} x_1 + 2x_2 &= h \\ 3x_1 + 6x_2 &= k \end{aligned}$$`,
      question: r`If $h = 2$, what must $k$ be for the system to be consistent?`,
      answer: 6,
      prefix: "k =",
      hint: r`$R_2 \to R_2 - 3R_1$ produces the row $(0, 0 \mid k - 3h)$. When is that row harmless?`,
      explanation: r`The reduced row 2 is $0 = k - 3h$, so the system is consistent exactly when $k = 3h$. With $h = 2$ that means $k = 6$, and then the solutions are infinite ($x_2$ free). For $k \neq 6$ there is no solution at all.`,
      tags: ["parameters"],
    }),
    tf("more-unknowns", {
      statement: "If a consistent linear system has more unknowns than equations, it has infinitely many solutions.",
      answer: true,
      feedback: "Count pivots: there can't be more pivots than equations. What does that leave for the variables?",
      hint: "There is at most one pivot per row (equation). If there are fewer pivots than variables, what kind of variable must exist?",
      explanation: r`True. Pivots $\le$ number of equations $<$ number of unknowns, so at least one column of the coefficient matrix has no pivot — a free variable — and a consistent system with a free variable has infinitely many solutions. (Without "consistent" the statement would be false: such a system can also have no solution.)`,
      tags: ["theory"],
    }),
    reading(
      "summary",
      r`**What you did:** reduced systems with a symbolic entry and read off the cases.

**The pattern:**

1. Row reduce, treating $h$ as a number you can't simplify.
2. Find the row where $h$ ends up: $(0, \dots, 0, \,\square(h) \mid \triangle(h))$.
3. $\square(h) \neq 0$ → pivot → (usually) unique. $\square(h) = 0$ and $\triangle(h) \neq 0$ → inconsistent. Both zero → free variable → infinitely many.

You've finished Unit 1. Take the **Level Check** to see what sticks when the hints are gone.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit practice bank                                                   */
/* ------------------------------------------------------------------ */

export const unit1: Unit = {
  id: "u1",
  title: "Linear systems",
  subtitle: "Row reduction and echelon forms",
  description: "Solve systems of any size with three row operations, and learn to answer the two questions that run through the whole course: does a solution exist, and is it unique?",
  textbook: "Lay §1.1–1.2",
  lessons: [l1, l2, l3, l4, l5],
  practice: [
    mc("p-consistency-row", {
      question: r`An augmented matrix has been reduced to $${aug([
        [1, 0, 2, 4],
        [0, 1, -1, 3],
        [0, 0, 0, 2],
      ])}$. The system is…`,
      choices: [
        ["incons", "inconsistent", undefined],
        ["unique", "consistent with a unique solution", "Look at the last row."],
        ["inf", "consistent with infinitely many solutions", "Look at the last row before counting free variables."],
      ],
      correct: "incons",
      hint: "Translate the last row into an equation.",
      explanation: r`The last row says $0 = 2$ — impossible. Inconsistent.`,
      tags: ["consistency"],
    }),
    matrix("p-rref", {
      question: r`Find the reduced echelon form of $${mat([
        [1, 3, 1],
        [2, 6, 5],
      ])}$.`,
      answer: [
        [1, 3, 0],
        [0, 0, 1],
      ],
      hint: r`$R_2 \to R_2 - 2R_1$ first.`,
      explanation: r`$R_2 \to R_2 - 2R_1$ gives $(0, 0, 3)$; scale to $(0, 0, 1)$; then $R_1 \to R_1 - R_2$ gives $(1, 3, 0)$.`,
      tags: ["rref"],
    }),
    numeric("p-free-count", {
      question: r`A consistent system has 6 unknowns and its coefficient matrix has 4 pivot columns. How many free variables does it have?`,
      answer: 2,
      hint: "Variables are either basic or free.",
      explanation: r`$6 - 4 = 2$ free variables.`,
      tags: ["free-variables"],
    }),
    numeric("p-param", {
      question: r`For which $h$ does $\;x_1 + 2x_2 = 3,\; 4x_1 + h\,x_2 = 12\;$ have infinitely many solutions?`,
      answer: 8,
      prefix: "h =",
      hint: r`$R_2 \to R_2 - 4R_1$.`,
      explanation: r`Row 2 becomes $(0, h - 8 \mid 0)$; it vanishes when $h = 8$.`,
      tags: ["parameters"],
    }),
    tf("p-tf-square", {
      statement: "A system of 3 equations in 3 unknowns always has exactly one solution.",
      answer: false,
      hint: "Can three planes fail to share a single point?",
      explanation: r`False — three planes can be parallel (no solution) or share a common line (infinitely many). Only when the coefficient matrix has 3 pivots is the solution unique.`,
      tags: ["theory"],
    }),
    tf("p-tf-rref-unique", {
      statement: "Every matrix is row equivalent to exactly one matrix in reduced echelon form.",
      answer: true,
      hint: "This is the uniqueness theorem for reduced echelon form.",
      explanation: r`True (Lay §1.2, Theorem 1). Echelon forms are not unique, but the reduced one is.`,
      tags: ["theory"],
    }),
    multi("p-ops", {
      question: "Select **every** operation that preserves the solution set of a system.",
      choices: [
        ["swap", r`$R_1 \leftrightarrow R_3$`],
        ["scale", r`$R_2 \to 5R_2$`],
        ["rep", r`$R_3 \to R_3 - 4R_1$`],
        ["zero", r`$R_1 \to 0\cdot R_1$`],
        ["mult", r`$R_2 \to R_1 \cdot R_2$ (entrywise product)`],
      ],
      correct: ["swap", "scale", "rep"],
      hint: "Only the three elementary row operations are allowed, and scaling must be by a nonzero number.",
      explanation: r`Interchange, scaling by a nonzero constant, and replacement are the elementary row operations. Scaling by $0$ destroys an equation, and multiplying rows entrywise is not linear at all.`,
      tags: ["row-operations"],
    }),
    numeric("p-solve", {
      question: r`Solve $\;2x_1 + x_2 = 7,\; x_1 - x_2 = -1.\;$ What is $x_2$?`,
      answer: 3,
      prefix: "x_2 =",
      hint: "Add the equations to eliminate $x_2$, or swap and reduce.",
      explanation: r`Adding gives $3x_1 = 6$, so $x_1 = 2$ and $x_2 = 7 - 4 = 3$.`,
      tags: ["solving"],
    }),
  ],
  generators: ["gen.solve-2x2", "gen.rref-2x3", "gen.param-h", "gen.pivot-count"],
};
