import type { QuestionStep, Unit } from "../types";
import { lesson, mc, multi, numeric, order, r, reading, tf } from "../dsl";

/*
 * Unit sm10 · Stability and buckling (Govindjee §12.1–12.3, Lectures 39–43).
 *
 * Conventions are the book's:
 *   - A conservative system with one coordinate θ is in equilibrium where dΠ/dθ = 0;
 *     the equilibrium is stable when d²Π/dθ² > 0.
 *   - Rigid link of length L on a torsional spring k under a vertical load P:
 *     Π = ½kθ² − PL(1 − cos θ), critical load k/L. With a lateral spring k at the top: kL.
 *   - Column: EI v'''' + P v'' = 0 (P compressive). Pinned–pinned: P_cr = π²EI/L².
 *     Other ends through the effective length KL: clamped–free K = 2, clamped–pinned K ≈ 0.7,
 *     clamped–clamped K = 0.5.
 *   - Critical stress σ_cr = π²E/(L/r)², r = √(I/A).
 * Units are N, mm and MPa unless a problem says otherwise. Every numeric answer carries a "check" comment.
 */

/* ------------------------------------------------------------------ */
/* Lesson 1 · Stable or unstable? (Govindjee §12.1)                    */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "sm10-l1-stability-and-energy",
    unitId: "sm10",
    title: "Stable or unstable?",
    summary: "Buckling is a failure of balance, not of material. Potential energy tells you whether an equilibrium survives a nudge.",
    textbook: "Govindjee §12.1",
    minutes: 11,
  },
  [
    reading(
      "new-failure",
      r`Stand a plastic ruler on end and press down on it. At first nothing happens. Press harder and, at a definite load, it suddenly **bows out sideways**. Let go and it springs back, undamaged.

Nothing yielded and nothing broke. The stress in the ruler was far below what the plastic can take. What failed was the ruler's ability to **stay straight**. This is **buckling**, and it is a different kind of failure from everything so far in the course.

- Yield and fracture are failures of the **material**. You check them by comparing a stress with a strength.
- Buckling is a failure of **equilibrium**. The straight shape is still a possible resting position, but it has stopped being a stable one.

It threatens anything slender that is pushed along its length: columns, bicycle spokes, the legs of a chair, the thin wall of a drinks can. It is dangerous because it gives little warning and can happen at a small fraction of the load that would crush the material.`,
      { title: "A different way to fail" },
    ),
    reading(
      "ball",
      r`Picture a ball resting in three places: at the bottom of a bowl, balanced on top of a dome, and on a flat table. In all three it is in equilibrium: the forces on it balance. Now give it a small nudge.

- **In the bowl** it rolls back. The equilibrium is **stable**.
- **On the dome** it rolls away and does not return. **Unstable.**
- **On the table** it stays wherever you leave it. **Neutral.**

Potential energy makes the test precise. Let one number $\theta$ describe the position of a system, and let $\Pi(\theta)$ be its total potential energy.

$$\text{Equilibrium:}\quad \frac{\mathrm{d}\Pi}{\mathrm{d}\theta} = 0 \qquad \text{(the energy curve is flat there)}$$

$$\frac{\mathrm{d}^2\Pi}{\mathrm{d}\theta^2} > 0 \ \ \text{stable (a valley)}, \qquad \frac{\mathrm{d}^2\Pi}{\mathrm{d}\theta^2} < 0 \ \ \text{unstable (a hilltop)}, \qquad \frac{\mathrm{d}^2\Pi}{\mathrm{d}\theta^2} = 0 \ \ \text{neutral}.$$

A system sitting at a minimum of its potential energy has to be given energy to move away, so it comes back. At a maximum, moving away releases energy, so it keeps going.`,
      { title: "The nudge test" },
    ),
    mc("dome", {
      question: "A ball is balanced exactly on top of a smooth dome. Which description is right?",
      choices: [
        ["unstable", "It is in equilibrium, but the equilibrium is unstable"],
        ["not-eq", "It is not in equilibrium", "At the very top the surface is level, so the ball's weight and the push of the dome do balance. What happens after a small nudge is a separate question."],
        ["stable", "It is in stable equilibrium", "Nudge it slightly. Does it come back?"],
        ["neutral", "It is in neutral equilibrium", "Neutral means it stays wherever you put it. Does a ball stay put partway down a dome?"],
      ],
      correct: "unstable",
      shuffle: true,
      hint: "Ask two separate questions. Do the forces balance at the top? And after a small nudge, does it return?",
      explanation: "At the top the forces balance, so it is an equilibrium. But the top of a dome is a maximum of height, and so of potential energy. Any nudge lowers the energy and the ball rolls away. Equilibrium and stability are different things: the first asks whether it can rest there, the second whether it stays.",
      tags: ["stability", "energy"],
    }),
    reading(
      "pendulum",
      r`**Worked example: a pendulum.** A weight $W$ swings on a rigid rod of length $L$. Let $\theta$ be the angle from hanging straight down. When the rod turns by $\theta$, the weight rises by $L(1 - \cos\theta)$, so

$$\Pi(\theta) = W L\,(1 - \cos\theta).$$

**Equilibrium.** $\dfrac{\mathrm{d}\Pi}{\mathrm{d}\theta} = WL\sin\theta = 0$ at $\theta = 0$ (hanging down) and at $\theta = \pi$ (balanced straight up).

**Stability.** $\dfrac{\mathrm{d}^2\Pi}{\mathrm{d}\theta^2} = WL\cos\theta$.

- At $\theta = 0$ this is $+WL$: positive, so hanging down is **stable**.
- At $\theta = \pi$ this is $-WL$: negative, so balanced upright is **unstable**.

That matches what you know about pendulums, and the same two-step recipe works on structures.`,
      { title: "Worked example: a pendulum" },
    ),
    numeric("pendulum-second", {
      question: r`A pendulum has a weight of $20\ \mathrm{N}$ on a rod $0.5\ \mathrm{m}$ long. What is the value of $\dfrac{\mathrm{d}^2\Pi}{\mathrm{d}\theta^2}$ when it is balanced straight up, at $\theta = \pi$? Include the sign.`,
      answer: -10, // check: WL cos π = −(20 × 0.5) = −10 N·m
      tolerance: 0.1,
      suffix: r`$\mathrm{N \cdot m}$`,
      answerDisplay: r`-10\ \mathrm{N \cdot m}`,
      hint: r`The second derivative is $WL\cos\theta$. Evaluate it at $\theta = \pi$.`,
      explanation: r`$WL\cos\pi = -(20 \times 0.5) = -10\ \mathrm{N \cdot m}$. Negative, so the upright position is unstable. The size, $10\ \mathrm{N \cdot m}$, says how strongly a small tilt is pushed further.`,
      tags: ["stability", "energy"],
    }),
    numeric("door-closer", {
      body: r`A door closer is a torsional spring of stiffness $k = 4\ \mathrm{N \cdot m/rad}$. Someone pushes the door with a steady moment $M_0 = 2\ \mathrm{N \cdot m}$. With $\theta$ the angle the door has opened (in radians), the potential energy is $\Pi = \tfrac12 k\theta^2 - M_0\theta$.`,
      question: r`At what angle $\theta$ is the door in equilibrium?`,
      answer: 0.5, // check: dΠ/dθ = kθ − M0 = 0 → θ = 2/4 = 0.5 rad
      tolerance: 0.005,
      prefix: r`$\theta =$`,
      suffix: "rad",
      hint: r`Differentiate $\Pi$ with respect to $\theta$ and set the result to zero.`,
      explanation: r`$\dfrac{\mathrm{d}\Pi}{\mathrm{d}\theta} = k\theta - M_0 = 0$ gives $\theta = M_0/k = 2/4 = 0.5\ \mathrm{rad}$. That is just moment balance: the spring's moment $k\theta$ equals the applied moment. And $\dfrac{\mathrm{d}^2\Pi}{\mathrm{d}\theta^2} = k > 0$, so the door rests there stably. Setting the derivative of the energy to zero always reproduces the equilibrium equations.`,
      tags: ["stability", "energy", "equilibrium"],
    }),
    mc("classify", {
      question: r`A system has potential energy $\Pi(\theta) = 3\theta^2 - \theta^4$. Is $\theta = 0$ an equilibrium, and if so, what kind?`,
      choices: [
        ["stable", "Yes, and it is stable"],
        ["unstable", "Yes, but it is unstable", r`Differentiate twice and evaluate at $\theta = 0$. What sign do you get?`],
        ["not", "No, it is not an equilibrium", r`Check the first derivative at $\theta = 0$.`],
        ["neutral", "Yes, and it is neutral", r`Neutral needs the second derivative to be zero at that point. Is it?`],
      ],
      correct: "stable",
      shuffle: true,
      hint: r`First check that $\mathrm{d}\Pi/\mathrm{d}\theta = 0$ at $\theta = 0$. Then look at the sign of the second derivative there.`,
      explanation: r`$\dfrac{\mathrm{d}\Pi}{\mathrm{d}\theta} = 6\theta - 4\theta^3$, which is zero at $\theta = 0$: an equilibrium. $\dfrac{\mathrm{d}^2\Pi}{\mathrm{d}\theta^2} = 6 - 12\theta^2$, which is $+6$ at $\theta = 0$: positive, so stable. The energy curve is a valley there, even though it turns downward further out.`,
      tags: ["stability", "energy"],
    }),
    tf("maximum", {
      statement: "An equilibrium that sits at a local maximum of the potential energy is stable.",
      answer: false,
      feedback: "Think of the ball on the dome. Is a hilltop a place a nudged ball returns to?",
      hint: "At a maximum, does moving away raise or lower the potential energy? Which way does a system tend to go?",
      explanation: "False. At a maximum any small movement lowers the potential energy, so the system keeps moving away. Stable equilibria are at minima, where a small movement raises the energy and the system is pushed back.",
      tags: ["stability", "energy"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Tell buckling (a loss of stable equilibrium) apart from yield and fracture (failures of the material).
- Find equilibrium from the energy: $\dfrac{\mathrm{d}\Pi}{\mathrm{d}\theta} = 0$.
- Test it: $\dfrac{\mathrm{d}^2\Pi}{\mathrm{d}\theta^2} > 0$ stable, $< 0$ unstable, $= 0$ neutral.

Next: the simplest structure that buckles, and the load at which it does.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · The rigid link and the critical load (Govindjee §12.2)   */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "sm10-l2-rigid-link",
    unitId: "sm10",
    title: "The critical load",
    summary: "A rigid link on a spring, pushed down from the top, is the simplest thing that buckles. It stays upright only below a critical load.",
    textbook: "Govindjee §12.2",
    minutes: 14,
  },
  [
    reading(
      "model",
      r`Here is the simplest structure that can buckle. A **rigid link** of length $L$ stands upright on a pivot. A **torsional spring** of stiffness $k$ at the pivot resists any tilt: tilting by $\theta$ (in radians) needs a moment $k\theta$. A vertical load $P$ pushes straight down on the top.

Two things store or release energy when the link tilts by $\theta$.

- **The spring** stores $\tfrac12 k\theta^2$.
- **The load** moves down. The top of the link drops by $L(1 - \cos\theta)$, so the load's potential energy falls by $P L (1 - \cos\theta)$.

$$\Pi(\theta) = \tfrac12 k\theta^2 - P L\,(1 - \cos\theta).$$

The spring makes a valley. The load digs a pit under it. Which one wins near $\theta = 0$ decides whether the link stays up.

Use the sliders below. Raise the load and watch the energy curve at $\theta = 0$ change from a valley into a hilltop.`,
      { title: "The simplest thing that buckles", visual: { kind: "link-stability", config: { load: 0.6, theta: 15, sliders: true } } },
    ),
    numeric("drop", {
      question: r`A link $2\ \mathrm{m}$ long tilts by $\theta = 0.2\ \mathrm{rad}$. By how much does its top drop? Answer in millimetres.`,
      answer: 39.87, // check: L(1 − cos θ) = 2000 × (1 − cos 0.2) = 2000 × 0.0199334 = 39.87 mm
      tolerance: 0.4,
      suffix: "mm",
      hint: r`The height of the top above the pivot goes from $L$ to $L\cos\theta$. Set your calculator to radians.`,
      explanation: r`Drop $= L(1 - \cos\theta) = 2000 \times (1 - \cos 0.2) = 2000 \times 0.01993 = 39.9\ \mathrm{mm}$. The top moves sideways by $L\sin\theta = 397\ \mathrm{mm}$, ten times as far. The drop is small, but it is what lets the load do work.`,
      tags: ["rigid-link", "geometry"],
    }),
    reading(
      "critical",
      r`Apply the recipe from the last lesson.

**Equilibrium.**

$$\frac{\mathrm{d}\Pi}{\mathrm{d}\theta} = k\theta - P L\sin\theta = 0.$$

This is moment balance about the pivot: the spring's restoring moment $k\theta$ against the load's overturning moment $P \times L\sin\theta$. It has two kinds of solution:

- $\theta = 0$, for **any** load: the link stands straight.
- $P = \dfrac{k}{L}\,\dfrac{\theta}{\sin\theta}$: the link rests tilted.

**Stability of the upright position.**

$$\frac{\mathrm{d}^2\Pi}{\mathrm{d}\theta^2} = k - P L\cos\theta, \qquad\text{which at } \theta = 0 \text{ is } \ k - P L.$$

That is positive only while $P < k/L$. So the upright link is stable up to a definite load and unstable beyond it:

$$P_{crit} = \frac{k}{L}.$$

This is the **critical load**. A stiffer spring raises it. A longer link lowers it, because the load gets more leverage.`,
      { title: "The critical load" },
    ),
    numeric("p-crit", {
      question: r`A link $1.5\ \mathrm{m}$ long stands on a torsional spring of stiffness $600\ \mathrm{N \cdot m/rad}$. What is its critical load?`,
      answer: 400, // check: k/L = 600/1.5 = 400 N
      tolerance: 4,
      prefix: r`$P_{crit} =$`,
      suffix: "N",
      hint: "Spring stiffness divided by the length of the link. Check that the units come out as a force.",
      explanation: r`$P_{crit} = k/L = 600/1.5 = 400\ \mathrm{N}$. The units work: $\mathrm{N \cdot m}$ per radian divided by metres leaves newtons, because radians are a pure number.`,
      tags: ["rigid-link", "critical-load"],
    }),
    mc("below", {
      question: r`That link carries $300\ \mathrm{N}$, below its critical load of $400\ \mathrm{N}$. Someone bumps it so it tilts slightly. What happens?`,
      choices: [
        ["returns", "It swings back to upright"],
        ["falls", "It keeps tilting until it falls over", "At this load, which is larger for a small tilt: the spring's restoring moment or the load's overturning moment?"],
        ["stays", "It stays at whatever small angle it was bumped to", "That would be neutral equilibrium, which happens only exactly at the critical load."],
        ["snaps", "The spring breaks", "Nothing has been said about the spring's strength. Compare the two moments acting on the tilted link."],
      ],
      correct: "returns",
      shuffle: true,
      hint: r`For a small tilt the restoring moment is $k\theta$ and the overturning moment is about $PL\theta$. Compare $k$ with $PL$.`,
      explanation: r`For a small tilt, the spring's moment is $k\theta = 600\,\theta$ and the load's is about $PL\theta = 450\,\theta$. The spring wins, so the link returns. In energy terms, $k - PL = 150 > 0$: a valley.`,
      tags: ["rigid-link", "stability"],
    }),
    mc("above", {
      question: r`The load on that link is raised to $500\ \mathrm{N}$, above the critical load. Which statement is right?`,
      choices: [
        ["unstable-eq", "Upright is still an equilibrium, but an unstable one: the slightest disturbance sends the link to a tilted resting position"],
        ["no-eq", "Upright is no longer an equilibrium at all", r`Put $\theta = 0$ into the equilibrium equation. Is it satisfied whatever $P$ is?`],
        ["stable", "Upright is still stable, just less so", r`Check the sign of $k - PL$ at this load.`],
        ["nothing", "Nothing changes at the critical load", "The second derivative of the energy changes sign there. What does that do to the nudge test?"],
      ],
      correct: "unstable-eq",
      shuffle: true,
      hint: r`Two separate checks. Is $\theta = 0$ still a solution of $k\theta - PL\sin\theta = 0$? And what is the sign of $k - PL$ now?`,
      explanation: r`$\theta = 0$ satisfies the equilibrium equation for any load, so the link can in principle stay upright. But $k - PL = 600 - 750 < 0$: a hilltop. Any disturbance tips it, and it comes to rest on the tilted branch, where the equilibrium is stable. A perfectly upright link above the critical load is like a pencil balanced on its point.`,
      tags: ["rigid-link", "stability"],
    }),
    numeric("tilted-load", {
      question: r`On the tilted branch, $P = \dfrac{k}{L}\,\dfrac{\theta}{\sin\theta}$. For the same link ($k/L = 400\ \mathrm{N}$), what load holds it in equilibrium tilted at $\theta = 0.5\ \mathrm{rad}$ (about $29^\circ$)?`,
      answer: 417.2, // check: 400 × 0.5/sin(0.5) = 400 × 1.042915 = 417.17 N
      tolerance: 2,
      prefix: r`$P =$`,
      suffix: "N",
      hint: r`Substitute $\theta = 0.5$ into the formula, with the sine taken in radians.`,
      explanation: r`$P = 400 \times \dfrac{0.5}{\sin 0.5} = 400 \times 1.0429 = 417\ \mathrm{N}$. Only $4\%$ above the critical load, and the link is already leaning $29^\circ$. After buckling, a small extra load produces a large movement.`,
      tags: ["rigid-link", "post-buckling"],
    }),
    reading(
      "bifurcation",
      r`Plot load against tilt and you see two paths.

- The **straight path**, $\theta = 0$, runs up the load axis. It is stable below $P_{crit}$ and unstable above.
- The **tilted path**, $P = \dfrac{k}{L}\dfrac{\theta}{\sin\theta}$, branches off sideways at exactly $P_{crit}$, in both directions. It is stable.

The point where they meet is called a **bifurcation**: the place where the structure's behaviour forks.

Because the tilted path is nearly flat near the fork, a structure loaded just past its critical load deflects a great deal. For practical purposes **the critical load is the failure load**, even though the material is undamaged.

**A shortcut.** If all you want is the critical load, you do not need the full equations. For small angles $\sin\theta \approx \theta$, and equilibrium becomes

$$(k - P L)\,\theta = 0.$$

Either $\theta = 0$, or $P = k/L$ with $\theta$ left undetermined. This **linearised** analysis finds the critical load quickly. What it cannot tell you is how far the structure moves afterwards.`,
      { title: "Two paths and a shortcut" },
    ),
    numeric("lateral-spring", {
      body: r`Change the model. Remove the torsional spring and instead tie the **top** of the link to a wall with a horizontal spring of stiffness $k = 2\ \mathrm{kN/m}$. The link is $3\ \mathrm{m}$ long. For a small tilt $\theta$ the top moves sideways by $L\theta$, so the spring pulls back with a force $kL\theta$ acting at a height $L$ above the pivot.`,
      question: r`What is the critical load?`,
      answer: 6, // check: restoring moment kLθ × L = kL²θ; overturning PLθ; P_crit = kL = 2 × 3 = 6 kN
      tolerance: 0.06,
      prefix: r`$P_{crit} =$`,
      suffix: "kN",
      hint: r`Balance moments about the pivot for a small tilt: the spring force times its height, against the load times the sideways shift of the top.`,
      explanation: r`Restoring moment: $(kL\theta) \times L = kL^2\theta$. Overturning moment: $P \times L\theta$. They balance when $P = kL$, so $P_{crit} = kL = 2 \times 3 = 6\ \mathrm{kN}$. With a sideways spring, a longer link is *more* stable, because the spring gains leverage faster than the load does.`,
      tags: ["rigid-link", "critical-load"],
    }),
    mc("units", {
      question: r`A classmate cannot remember whether the critical load for that sideways-spring model is $kL$, $k/L$ or $kL^2$, with $k$ in N/m. Which can it be?`,
      choices: [
        ["kl", r`$kL$, because it is the only one with units of force`],
        ["k-over-l", r`$k/L$`, r`Its units are $\mathrm{N/m^2}$. Is that a force?`],
        ["kl2", r`$kL^2$`, r`Its units are $\mathrm{N \cdot m}$, a moment. Is that a force?`],
        ["any", "Any of them: you cannot tell without doing the analysis", "Units alone rule two of them out. Work out the units of each."],
      ],
      correct: "kl",
      hint: r`Write out the units of each expression with $k$ in N/m and $L$ in m. A load must come out in newtons.`,
      explanation: r`$kL$ has units $\mathrm{(N/m) \times m = N}$, a force. $k/L$ is $\mathrm{N/m^2}$ and $kL^2$ is $\mathrm{N \cdot m}$. Only $kL$ can be a load. The torsional-spring model has $k$ in $\mathrm{N \cdot m/rad}$, which is why its answer is $k/L$ instead.`,
      tags: ["rigid-link", "dimensional-analysis"],
    }),
    tf("linear-limits", {
      statement: "The linearised analysis, which uses the small-angle approximation, tells you how far the link tilts once the critical load is exceeded.",
      answer: false,
      feedback: r`Look at the linearised equation $(k - PL)\theta = 0$ at $P = k/L$. What does it say about $\theta$?`,
      hint: r`At the critical load the linearised equation reads $0 \times \theta = 0$. What values of $\theta$ satisfy that?`,
      explanation: r`False. At $P = k/L$ the linearised equation is satisfied by every $\theta$, so it says nothing about the amount of tilt. It gives the critical load and the shape of the buckled structure, not the size of the movement. For that you need the full equation, as you used for the $0.5\ \mathrm{rad}$ tilt.`,
      tags: ["rigid-link", "linearisation"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Write the energy of a rigid link on a torsional spring: $\Pi = \tfrac12 k\theta^2 - PL(1 - \cos\theta)$.
- Find its critical load, $P_{crit} = k/L$, and explain why upright is unstable beyond it.
- Describe the two equilibrium paths and the bifurcation where they meet.
- Use the small-angle shortcut, and know its limit: load and shape, but not amount.
- Handle a sideways spring at the top: $P_{crit} = kL$.

Next: structures that can move in more than one way.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · More than one way to move (Govindjee §12.2)              */
/* ------------------------------------------------------------------ */

const TWO_LINKS = r`Two rigid links, each of length $L$, are stacked end to end and stand upright. A torsional spring of stiffness $k_1$ joins the lower link to the ground, and one of stiffness $k_2$ joins the two links at the hinge between them. A vertical load $P$ pushes down on the top. $\theta_1$ and $\theta_2$ are the tilts of the lower and upper link from the vertical.`;

const l3 = lesson(
  {
    id: "sm10-l3-two-link-systems",
    unitId: "sm10",
    title: "More than one way to move",
    summary: "With two links there are two angles and two equilibrium equations. The critical load is where their determinant vanishes, and the eigenvector is the buckled shape.",
    textbook: "Govindjee §12.2",
    minutes: 14,
  },
  [
    reading(
      "two-angles",
      r`One link needed one number, $\theta$, to say where it was. Stack two links and you need two numbers. Each independent way a structure can move is a **degree of freedom**.

${TWO_LINKS}

For small tilts, balance moments on each link in its tilted position (or differentiate the energy with respect to each angle). The lower spring is turned by $\theta_1$. The hinge spring is turned by the *difference* $\theta_2 - \theta_1$. The result is two equations:

$$\begin{bmatrix} k_1 + k_2 - PL & -k_2 \\ -k_2 & k_2 - PL \end{bmatrix} \begin{bmatrix} \theta_1 \\ \theta_2 \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \end{bmatrix}.$$

$\theta_1 = \theta_2 = 0$ always works: the straight stack. A **tilted** solution exists only if the matrix cannot be inverted, that is, when

$$\det = 0.$$

That condition picks out special values of $P$. The **smallest** one is the critical load.`,
      { title: "Two links, two angles" },
    ),
    reading(
      "worked",
      r`**Worked example.** Take $k_1 = 3k$ at the base and $k_2 = 2k$ at the hinge. Write $p = PL$ to keep things tidy.

**Determinant.**

$$(3k + 2k - p)(2k - p) - (2k)^2 = p^2 - 7kp + 6k^2 = (p - k)(p - 6k) = 0.$$

So $PL = k$ or $PL = 6k$:

$$P = \frac{k}{L} \qquad\text{or}\qquad P = \frac{6k}{L}.$$

**Critical load.** The smaller one: $P_{crit} = k/L$.

**Buckled shape.** Put $PL = k$ into the second equation, $-2k\,\theta_1 + (2k - k)\,\theta_2 = 0$, which gives $\theta_2 = 2\theta_1$. Both links lean the same way, the upper one twice as far.

The equations fix the **ratio** of the angles, not their size. That ratio is the **buckling mode**. In the language of linear algebra, the loads are eigenvalues and the modes are eigenvectors.`,
      { title: "Worked example" },
    ),
    mc("which-root", {
      question: r`The determinant gave two loads, $k/L$ and $6k/L$. Why is the critical load the smaller one?`,
      choices: [
        ["first", "As the load rises from zero, the structure buckles as soon as it reaches the first of them"],
        ["average", "It is not: the critical load is the average of the two", "Think about slowly increasing the load from zero. Which special value is reached first?"],
        ["larger", "It is not: the structure holds until the larger one", "At the smaller value a tilted equilibrium already exists and the straight one has become unstable."],
        ["either", "Either can be the critical load, depending on how the load is applied", "The load is simply increased from zero. Which value does it meet first?"],
      ],
      correct: "first",
      shuffle: true,
      hint: "Imagine turning the load up slowly from zero. What happens at the first special value it reaches?",
      explanation: "A real structure is loaded from zero upward. At the smallest special load the straight position stops being stable and the structure moves into its buckled shape. It never gets the chance to reach the larger one. Higher values matter only if the first mode is physically prevented.",
      tags: ["multi-dof", "critical-load"],
    }),
    numeric("mode-ratio", {
      question: r`In the worked example, the second equation is $-2k\,\theta_1 + (2k - PL)\,\theta_2 = 0$. At the **higher** load, $PL = 6k$, what is the ratio $\theta_2/\theta_1$? Include the sign.`,
      answer: -0.5, // check: −2k θ1 + (2k − 6k) θ2 = 0 → θ2 = −θ1/2
      tolerance: 0.005,
      prefix: r`$\theta_2/\theta_1 =$`,
      hint: r`Substitute $PL = 6k$, then solve the equation for $\theta_2$ in terms of $\theta_1$.`,
      explanation: r`$-2k\,\theta_1 + (2k - 6k)\,\theta_2 = 0$ gives $-4k\,\theta_2 = 2k\,\theta_1$, so $\theta_2/\theta_1 = -0.5$. The negative sign means the links lean opposite ways.`,
      tags: ["multi-dof", "buckling-mode"],
    }),
    mc("mode-shape", {
      question: r`At the higher load the mode has $\theta_2/\theta_1 = -0.5$. What does that buckled shape look like?`,
      choices: [
        ["zigzag", "A zig-zag: the lower link leans one way and the upper link leans back the other way"],
        ["same", "Both links lean the same way, the upper one less", "A negative ratio means the two angles have opposite signs."],
        ["straight", "The stack stays straight", "A straight stack has both angles zero. A mode is a tilted shape."],
        ["upper-only", "Only the upper link moves", r`If only the upper link moved, $\theta_1$ would be zero and the ratio would not be defined.`],
      ],
      correct: "zigzag",
      shuffle: true,
      hint: "The ratio is negative. What does it mean for two tilt angles to have opposite signs?",
      explanation: "Opposite signs mean opposite leans: a zig-zag. This shape bends the hinge spring sharply, so it takes much more load to produce. The first mode, with both links leaning the same way, bends the springs least and so appears first.",
      tags: ["multi-dof", "buckling-mode"],
    }),
    numeric("own-critical", {
      body: TWO_LINKS,
      question: r`Now take $k_1 = 8k$ and $k_2 = 3k$. What is the critical load, as a multiple of $k/L$?`,
      answer: 2, // check: p² − (k1 + 2k2)p + k1k2 = p² − 14kp + 24k² = (p − 2k)(p − 12k) → P_crit = 2k/L
      tolerance: 0.02,
      prefix: r`$P_{crit} =$`,
      suffix: r`$\times\ k/L$`,
      answerDisplay: r`2\,k/L`,
      hint: r`Put the two stiffnesses into the matrix from the first reading, with $p = PL$, and set its determinant to zero. You get a quadratic in $p$. Take its smaller root.`,
      explanation: r`$(8k + 3k - p)(3k - p) - (3k)^2 = p^2 - 14kp + 24k^2 = (p - 2k)(p - 12k) = 0$. The roots are $PL = 2k$ and $PL = 12k$, so $P_{crit} = 2k/L$.`,
      tags: ["multi-dof", "critical-load"],
    }),
    numeric("own-numbers", {
      question: r`For that stack, with $k = 50\ \mathrm{N \cdot m/rad}$ and links $0.5\ \mathrm{m}$ long, what is the critical load in newtons?`,
      answer: 200, // check: 2k/L = 2 × 50/0.5 = 200 N
      tolerance: 2,
      prefix: r`$P_{crit} =$`,
      suffix: "N",
      hint: r`You found $P_{crit}$ as a multiple of $k/L$. Put the numbers in.`,
      explanation: r`$P_{crit} = 2k/L = 2 \times 50/0.5 = 200\ \mathrm{N}$.`,
      tags: ["multi-dof", "critical-load"],
    }),
    mc("not-told", {
      question: "What does this determinant analysis **not** tell you?",
      choices: [
        ["size", "How large the tilt angles are after buckling"],
        ["load", "The load at which the stack buckles", "That is exactly what the smallest root of the determinant gives."],
        ["ratio", "The ratio of the two tilt angles", "The equations fix that ratio once the load is known."],
        ["which", "Which shape the stack buckles into", "The ratio of the angles is the shape."],
      ],
      correct: "size",
      shuffle: true,
      hint: "The equations are linear with zero on the right-hand side. If one set of angles solves them, what about twice those angles?",
      explanation: "The equations are linear and equal to zero, so any multiple of a solution is also a solution. They give the load and the shape (the ratio of the angles) but not the amplitude. As with the single link, the size of the movement needs the full nonlinear equations.",
      tags: ["multi-dof", "linearisation"],
    }),
    mc("eigen", {
      question: r`In linear algebra terms, what is the condition "$\det = 0$" doing here?`,
      choices: [
        ["eigenvalues", "Finding eigenvalues: the special loads at which a non-zero solution for the angles exists"],
        ["inverse", "Computing the inverse of the stiffness matrix", "When the determinant is zero the matrix has no inverse. That is the point."],
        ["rank", "Checking that the matrix has full rank", "Full rank would mean the only solution is all angles zero. Buckling needs the opposite."],
        ["trace", "Finding the trace of the matrix", "The trace is the sum of the diagonal entries. Which quantity must vanish for a non-zero solution?"],
      ],
      correct: "eigenvalues",
      shuffle: true,
      hint: "A square system with zero on the right has a non-zero solution only in a special case. What is that case called when a parameter is being varied?",
      explanation: r`The equations have the form $(\mathbf{K} - PL\,\mathbf{I})\boldsymbol{\theta} = \mathbf{0}$, with $\mathbf{K}$ built from the spring stiffnesses. A non-zero $\boldsymbol{\theta}$ exists only when $PL$ is an eigenvalue of $\mathbf{K}$, and $\boldsymbol{\theta}$ is then the eigenvector. Buckling loads are eigenvalues, and buckling modes are eigenvectors.`,
      tags: ["multi-dof", "eigenvalues"],
    }),
    order("recipe", {
      question: "Put the steps for a rigid-link buckling problem in order.",
      items: [
        ["dof", "Choose the degrees of freedom: one angle for each link that can tilt independently"],
        ["equations", "Write moment balance for each link in its tilted position, or the potential energy"],
        ["linearise", "Linearise for small angles"],
        ["det", "Write the equations as a matrix times the angles equal to zero, and set the determinant to zero"],
        ["smallest", "Take the smallest root as the critical load; its eigenvector is the buckling mode"],
      ],
      hint: "You cannot write equations before choosing what the unknowns are, and you cannot take a determinant before the equations are linear.",
      explanation: "Choose the angles, write equilibrium in the tilted position, linearise, set the determinant to zero, and take the smallest root. For a single link the determinant step collapses to solving one equation for the load.",
      tags: ["multi-dof", "rigid-link"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Count degrees of freedom and write one equilibrium equation for each.
- Find the special loads from $\det = 0$ and pick the smallest as the critical load.
- Read the buckling mode from the ratio of the angles, and recognise it as an eigenvector.
- State what linearised analysis leaves out: the amplitude.

Next: a real column can bend at every point along its length. That is infinitely many degrees of freedom, and the matrix becomes a differential equation.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Euler buckling of columns (Govindjee §12.3)              */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "sm10-l4-euler-buckling",
    unitId: "sm10",
    title: "Euler buckling of columns",
    summary: "Write equilibrium on the bent column and a sine wave appears. The Euler load π²EI/L² and the effective length cover the standard end conditions.",
    textbook: "Govindjee §12.3",
    minutes: 15,
  },
  [
    reading(
      "column",
      r`A real column is not a rigid link on a spring. It is elastic all the way along and can bend at every point. The spring is now the column's own bending stiffness $EI$, spread along its length.

The key step is the same as for the link: **write equilibrium in the bent position.** Take a column of length $L$, pinned at both ends, carrying a compressive load $P$. Suppose it has bowed sideways by $v(x)$. Cut it at $x$. The load $P$ no longer passes through the cut. It is offset by $v$, so it produces a bending moment of size $P\,v$ there.

Combine that with the moment–curvature relation $M = EI\,v''$ from beam theory, and the bent column must satisfy

$$EI\,v'' + P\,v = 0, \qquad\text{or}\qquad v'' + \lambda^2 v = 0 \quad\text{with}\quad \lambda^2 = \frac{P}{EI}.$$

In beam theory the load never appeared multiplied by the deflection. Here it does, and that one term is the whole of buckling.

(For other supports the book starts one step back, from $EI\,v'''' + P\,v'' = 0$, which needs four boundary conditions.)`,
      { title: "From links to a column" },
    ),
    reading(
      "solve",
      r`The equation $v'' + \lambda^2 v = 0$ is the one for a vibrating spring, and its solutions are sines and cosines:

$$v(x) = A\sin\lambda x + B\cos\lambda x.$$

**Apply the pins.**

- $v(0) = 0$ gives $B = 0$.
- $v(L) = 0$ gives $A\sin\lambda L = 0$.

The last equation can be satisfied in two ways. Either $A = 0$, which is the straight column, always a solution. Or

$$\sin\lambda L = 0 \quad\Longrightarrow\quad \lambda L = n\pi \quad\Longrightarrow\quad P = \frac{n^2\pi^2 EI}{L^2}, \qquad n = 1, 2, 3, \dots$$

The smallest, $n = 1$, is the **Euler buckling load**:

$$P_{cr} = \frac{\pi^2 EI}{L^2}, \qquad\text{with shape}\qquad v = A\sin\frac{\pi x}{L}.$$

The buckled shape is half a sine wave. Its amplitude $A$ is left undetermined, just as the link's tilt was.

Notice what is in the formula: the stiffness $E$, the shape of the cross-section through $I$, and the length. The **strength** of the material is not there at all.`,
      { title: "The Euler load" },
    ),
    numeric("euler", {
      question: r`A steel rod is pinned at both ends. It has $E = 200\ \mathrm{GPa}$, $I = 2000\ \mathrm{mm^4}$ and length $1\ \mathrm{m}$. What is its Euler buckling load, in kN?`,
      answer: 3.948, // check: π² × 200 000 × 2000 / 1000² = π² × 400 = 3947.8 N
      tolerance: 0.04,
      prefix: r`$P_{cr} =$`,
      suffix: "kN",
      hint: r`Use $P_{cr} = \pi^2 EI/L^2$ with $E$ in MPa and lengths in mm. The answer comes out in newtons.`,
      explanation: r`$P_{cr} = \dfrac{\pi^2 \times 200\,000 \times 2000}{1000^2} = \pi^2 \times 400 = 3948\ \mathrm{N} = 3.95\ \mathrm{kN}$. A rod about as thick as a finger, a metre long, buckles under roughly the weight of four people.`,
      tags: ["euler", "critical-load"],
    }),
    mc("double-length", {
      question: "The rod is replaced by one twice as long, otherwise identical. What happens to its buckling load?",
      choices: [
        ["quarter", "It falls to a quarter"],
        ["half", "It halves", "The length is squared in the formula."],
        ["same", "It does not change", r`$L$ appears in the Euler formula. Where?`],
        ["eighth", "It falls to an eighth", r`That would need $L^3$ in the denominator. Check the power.`],
      ],
      correct: "quarter",
      hint: r`Look at how $L$ enters $\pi^2 EI/L^2$.`,
      explanation: r`$P_{cr}$ goes as $1/L^2$, so doubling the length divides the load by four. Length is the most damaging variable for a column, which is why long compression members are braced partway along.`,
      tags: ["euler", "scaling"],
    }),
    mc("stronger-steel", {
      question: "Two slender columns have the same dimensions. One is ordinary steel that yields at 250 MPa. The other is a high-strength steel that yields at 700 MPa. Both have the same Young's modulus. How do their buckling loads compare?",
      choices: [
        ["same", "They are the same"],
        ["stronger", "The high-strength column carries almost three times as much", "Which material property appears in the Euler formula: strength or stiffness?"],
        ["weaker", "The high-strength column carries less", "The two steels differ only in when they yield. Does yield stress appear in the formula?"],
        ["cannot", "It cannot be said without the cross-section", "They have the same dimensions, so the same I and the same L. What is left to compare?"],
      ],
      correct: "same",
      shuffle: true,
      hint: r`List the quantities in $P_{cr} = \pi^2 EI/L^2$. Is the yield stress among them?`,
      explanation: "The Euler load depends on E, I and L only. The two columns share all three, so they buckle at the same load. Paying for stronger steel does nothing for a slender column. This surprises people more than anything else in the unit.",
      tags: ["euler", "material"],
    }),
    numeric("braced", {
      question: r`The $1\ \mathrm{m}$ rod ($P_{cr} = 3.948\ \mathrm{kN}$) is now held sideways at mid-height, so it can only buckle into two half-waves ($n = 2$). What is its buckling load now, in kN?`,
      answer: 15.79, // check: 4 × 3.948 = 15.79 kN
      tolerance: 0.16,
      prefix: r`$P_{cr} =$`,
      suffix: "kN",
      hint: r`Use $P = n^2\pi^2 EI/L^2$ with $n = 2$, or think of each half as its own pinned column of half the length.`,
      explanation: r`With $n = 2$ the load is $2^2 = 4$ times the Euler load: $4 \times 3.948 = 15.8\ \mathrm{kN}$. A single brace at mid-height, carrying almost no force itself, quadruples the capacity.`,
      tags: ["euler", "bracing"],
    }),
    reading(
      "ends",
      r`A column pinned at both ends is one case. Hold the ends differently and the buckled shape changes, and so does the load. All the standard cases fit one formula:

$$P_{cr} = \frac{\pi^2 EI}{(KL)^2}.$$

$KL$ is the **effective length**: the length of the pinned–pinned column that would buckle at the same load. It is the length of one half sine wave in the buckled shape.

$$\begin{array}{lcc}
\textbf{Ends} & \quad K \quad & \textbf{Load factor} \\[2pt] \hline
\text{Pinned–pinned} & 1 & 1 \\[3pt]
\text{Clamped–free (a flagpole)} & 2 & 0.25 \\[3pt]
\text{Clamped–pinned} & 0.7 & 2.05 \\[3pt]
\text{Clamped–clamped} & 0.5 & 4
\end{array}$$

The load factor is the buckling load as a multiple of the pinned–pinned value, $\pi^2 EI/L^2$. It equals $1/K^2$.

The pattern: **the more the ends are restrained, the higher the buckling load.** A flagpole is free to sway at the top, so it behaves like half of a pinned column twice as long.

Try the four cases below and raise the load until each one buckles.`,
      { title: "Other end conditions", visual: { kind: "column-buckling", config: { ends: "pinned-pinned", load: 0.5, sliders: true } } },
    ),
    numeric("flagpole", {
      question: r`The same rod ($\pi^2 EI/L^2 = 3948\ \mathrm{N}$) is now clamped at its base and free at the top, like a flagpole. What is its buckling load, in newtons?`,
      answer: 987, // check: K = 2 → 3948/4 = 987 N
      tolerance: 10,
      prefix: r`$P_{cr} =$`,
      suffix: "N",
      hint: r`Find $K$ for clamped–free in the table. The effective length is squared.`,
      explanation: r`$K = 2$, so $P_{cr} = \dfrac{\pi^2 EI}{(2L)^2} = \dfrac{3948}{4} = 987\ \mathrm{N}$. Freeing one end costs three quarters of the capacity.`,
      tags: ["euler", "effective-length"],
    }),
    numeric("ratio", {
      question: "How many times larger is the buckling load of a clamped–clamped column than that of the same column clamped–free?",
      answer: 16, // check: 4 ÷ ¼ = 16
      tolerance: 0.2,
      hint: "Read the two load factors from the last column of the table and divide one by the other.",
      explanation: r`Clamped–clamped is $4$ times the Euler load and clamped–free is a quarter of it: $4 \div 0.25 = 16$. The same piece of material carries sixteen times as much, depending only on how its ends are held.`,
      tags: ["euler", "effective-length"],
    }),
    mc("weak-axis", {
      question: r`A column with a $20\ \mathrm{mm} \times 60\ \mathrm{mm}$ rectangular cross-section is pinned at both ends and free to bend in any direction. Which way does it buckle?`,
      choices: [
        ["thin", "It bends in the thin, 20 mm direction, about the axis with the smaller second moment of area"],
        ["thick", "It bends in the thick, 60 mm direction", "Buckling takes the easiest route. Which direction has the lower bending stiffness?"],
        ["diagonal", "It bends along the diagonal", "The lowest stiffness of a rectangle is about one of its two axes of symmetry."],
        ["random", "Either way is equally likely", r`The two directions have very different values of $I$. Compare them.`],
      ],
      correct: "thin",
      shuffle: true,
      hint: r`$P_{cr}$ is proportional to $I$. The column will buckle at the lowest load available to it.`,
      explanation: r`The two second moments of area are $60 \times 20^3/12 = 40\,000\ \mathrm{mm^4}$ and $20 \times 60^3/12 = 360\,000\ \mathrm{mm^4}$. Buckling happens at the lowest possible load, so the column bends the easy way, about the axis with the smaller $I$. Always use the smaller $I$ unless something prevents that mode.`,
      tags: ["euler", "weak-axis"],
    }),
    numeric("weak-axis-load", {
      question: r`That $20 \times 60\ \mathrm{mm}$ column is aluminium ($E = 70\ \mathrm{GPa}$), $800\ \mathrm{mm}$ long and pinned at both ends. What is its buckling load, in kN?`,
      answer: 43.18, // check: I = 60 × 20³/12 = 40 000 mm⁴; π² × 70 000 × 40 000 / 800² = π² × 4375 = 43 180 N
      tolerance: 0.45,
      prefix: r`$P_{cr} =$`,
      suffix: "kN",
      hint: r`Use the smaller of the two second moments of area, with $E$ in MPa and lengths in mm.`,
      explanation: r`$I_{\min} = 60 \times 20^3/12 = 40\,000\ \mathrm{mm^4}$. $P_{cr} = \dfrac{\pi^2 \times 70\,000 \times 40\,000}{800^2} = \pi^2 \times 4375 = 43\,180\ \mathrm{N} = 43.2\ \mathrm{kN}$. Using the larger $I$ would overestimate the capacity nine times.`,
      tags: ["euler", "weak-axis"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Explain where buckling comes from: the load acting through the sideways deflection, $EI\,v'' + P\,v = 0$.
- Use the Euler load for a pinned–pinned column, $P_{cr} = \dfrac{\pi^2 EI}{L^2}$.
- Handle other ends with the effective length: $P_{cr} = \dfrac{\pi^2 EI}{(KL)^2}$, with $K = 1$, $2$, $0.7$, $0.5$.
- Use the smaller $I$, and know that strength does not enter.

Next: when can you trust these formulas, and how do you design with them?`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 5 · Slenderness and design (Govindjee §12.3.3)               */
/* ------------------------------------------------------------------ */

const l5 = lesson(
  {
    id: "sm10-l5-slenderness-and-design",
    unitId: "sm10",
    title: "Slenderness and design",
    summary: "The Euler formula holds only for slender columns. The slenderness ratio tells you whether a column buckles or yields first.",
    textbook: "Govindjee §12.3.3",
    minutes: 13,
  },
  [
    reading(
      "critical-stress",
      r`Divide the Euler load by the cross-section area and you get the **critical stress**: the average compressive stress in the column at the moment it buckles.

$$\sigma_{cr} = \frac{P_{cr}}{A} = \frac{\pi^2 E I}{A L^2} = \frac{\pi^2 E}{(L/r)^2}, \qquad\text{where}\qquad r = \sqrt{\frac{I}{A}}.$$

$r$ is the **radius of gyration**. It is a length that says how far, on average, the material of the cross-section sits from the axis it bends about.

$L/r$ is the **slenderness ratio**: a pure number that says how long the column is compared with how spread-out its cross-section is. For other end conditions use the effective length, $KL/r$.

The whole of Euler buckling is now one statement: the critical stress depends on the material's stiffness $E$ and on the slenderness ratio, and on nothing else.`,
      { title: "Critical stress and slenderness" },
    ),
    numeric("radius-of-gyration", {
      question: r`A $20\ \mathrm{mm} \times 60\ \mathrm{mm}$ rectangle has area $1200\ \mathrm{mm^2}$ and smaller second moment of area $I = 40\,000\ \mathrm{mm^4}$. What is its radius of gyration about that axis?`,
      answer: 5.774, // check: √(40 000/1200) = √33.33 = 5.774 mm
      tolerance: 0.06,
      prefix: r`$r =$`,
      suffix: "mm",
      hint: r`$r = \sqrt{I/A}$. Divide first, then take the square root.`,
      explanation: r`$r = \sqrt{40\,000/1200} = \sqrt{33.3} = 5.77\ \mathrm{mm}$. For any rectangle bending the thin way, $r$ is the thin dimension divided by $\sqrt{12}$.`,
      tags: ["slenderness", "radius-of-gyration"],
    }),
    numeric("slenderness", {
      question: r`That section is used for a pinned–pinned column $800\ \mathrm{mm}$ long. What is its slenderness ratio $L/r$?`,
      answer: 138.6, // check: 800/5.774 = 138.56
      tolerance: 1.4,
      prefix: r`$L/r =$`,
      hint: "Divide the length by the radius of gyration you just found. Both are in mm, so the result is a pure number.",
      explanation: r`$L/r = 800/5.774 = 138.6$. A number over about a hundred means a slender column.`,
      tags: ["slenderness"],
    }),
    numeric("sigma-cr", {
      question: r`The column is aluminium, $E = 70\ \mathrm{GPa}$. What is its critical stress?`,
      answer: 35.98, // check: π² × 70 000 / 138.56² = 690 872 / 19 200 = 35.98 MPa
      tolerance: 0.4,
      prefix: r`$\sigma_{cr} =$`,
      suffix: "MPa",
      hint: r`$\sigma_{cr} = \pi^2 E/(L/r)^2$, with $E$ in MPa. The slenderness ratio is squared.`,
      explanation: r`$\sigma_{cr} = \dfrac{\pi^2 \times 70\,000}{138.6^2} = 36.0\ \mathrm{MPa}$. That matches the last lesson: $43\,180\ \mathrm{N}/1200\ \mathrm{mm^2} = 36.0\ \mathrm{MPa}$. Aluminium yields somewhere above $200\ \mathrm{MPa}$, so this column buckles at a small fraction of its strength.`,
      tags: ["slenderness", "critical-stress"],
    }),
    reading(
      "limits",
      r`The Euler analysis assumed the column is **elastic**. That is true only if the critical stress is below the yield stress:

$$\sigma_{cr} < \sigma_Y.$$

- A **slender** column (large $L/r$) has a low critical stress. It buckles elastically, and Euler's formula applies.
- A **stocky** column (small $L/r$) would need a stress above yield to buckle. It never gets there: it **yields** first, and its capacity is simply $\sigma_Y A$.

The slenderness ratio where the two limits meet comes from setting $\sigma_{cr} = \sigma_Y$:

$$\Big(\frac{L}{r}\Big)_{\text{transition}} = \pi\sqrt{\frac{E}{\sigma_Y}}.$$

Above it, Euler governs. Below it, yield governs.`,
      { title: "Slender or stocky?" },
    ),
    numeric("transition", {
      question: r`For structural steel with $E = 200\ \mathrm{GPa}$ and $\sigma_Y = 250\ \mathrm{MPa}$, at what slenderness ratio does the Euler critical stress equal the yield stress?`,
      answer: 88.86, // check: π √(200 000/250) = π × 28.284 = 88.86
      tolerance: 0.9,
      prefix: r`$L/r =$`,
      hint: r`Use the transition formula, with $E$ and $\sigma_Y$ both in MPa so the ratio is a pure number.`,
      explanation: r`$\pi\sqrt{200\,000/250} = \pi\sqrt{800} = 88.9$. Steel columns more slender than about $89$ buckle before they yield.`,
      tags: ["slenderness", "yield"],
    }),
    mc("stocky", {
      question: r`A column of that steel has a slenderness ratio of $40$. How does it fail as the load is increased?`,
      choices: [
        ["yields", "It yields before it can buckle, at a load of about σY times the area"],
        ["buckles", "It buckles elastically at the Euler load", "Compare its slenderness with the transition value you just computed. Which side is it on?"],
        ["both", "It yields and buckles at exactly the same load", "That happens only at the transition slenderness, about 89 for this steel."],
        ["never", "It cannot fail in compression", "Every material has a yield stress."],
      ],
      correct: "yields",
      shuffle: true,
      hint: "Compare 40 with the transition slenderness of about 89. Is the Euler stress for this column above or below the yield stress?",
      explanation: r`$40$ is well below the transition value of $89$. The Euler stress would be $\pi^2 \times 200\,000/40^2 = 1234\ \mathrm{MPa}$, far above the yield stress of $250\ \mathrm{MPa}$, so the steel yields long before that. Applying Euler's formula to a stocky column gives a wildly optimistic answer.`,
      tags: ["slenderness", "yield"],
    }),
    reading(
      "caveats",
      r`Two more cautions before you use Euler's formula in earnest.

**It describes an ideal column.** The analysis assumed a perfectly straight column with the load exactly along its centreline. Real columns are slightly crooked and real loads are slightly off-centre. A real column therefore bends a little from the very start, and it reaches its limit **below** the Euler load. Design codes cover this with safety factors and with formulas fitted to tests.

**It says nothing about what happens afterwards.** Like the linearised link, it gives the load and the buckled shape but not how far the column moves.

So in design the Euler load is an upper limit to stay well clear of:

$$P_{\text{allowed}} = \frac{P_{cr}}{SF}.$$`,
      { title: "Two cautions" },
    ),
    numeric("design-length", {
      body: r`An aluminium strut ($E = 70\ \mathrm{GPa}$) is a solid round bar of diameter $20\ \mathrm{mm}$, so $I = \pi d^4/64 = 7854\ \mathrm{mm^4}$. It is pinned at both ends and must carry $5\ \mathrm{kN}$ in compression with a safety factor of $2$ against buckling.`,
      question: "What is the longest it can be?",
      answer: 736.6, // check: P_cr = 10 000 N; L = √(π² E I / P_cr) = √(π² × 70 000 × 7854 / 10 000) = √542 610 = 736.6 mm
      tolerance: 7.5,
      prefix: r`$L =$`,
      suffix: "mm",
      hint: r`The Euler load must be at least the working load times the safety factor. Then solve $P_{cr} = \pi^2 EI/L^2$ for $L$.`,
      explanation: r`The strut needs $P_{cr} \ge 2 \times 5 = 10\ \mathrm{kN}$. From $P_{cr} = \pi^2 EI/L^2$: $L = \sqrt{\dfrac{\pi^2 \times 70\,000 \times 7854}{10\,000}} = \sqrt{542\,600} = 737\ \mathrm{mm}$.`,
      tags: ["euler", "design"],
    }),
    numeric("design-i", {
      question: r`A steel column ($E = 200\ \mathrm{GPa}$) is $3\ \mathrm{m}$ long and pinned at both ends. It must carry $100\ \mathrm{kN}$ with a safety factor of $2.5$ against buckling. What is the smallest second moment of area it can have? Answer in units of $10^{6}\ \mathrm{mm^4}$.`,
      answer: 1.14, // check: P_cr = 250 000 N; I = P_cr L²/(π² E) = 250 000 × 3000² / (π² × 200 000) = 2.25e12 / 1.97392e6 = 1.1399e6 mm⁴
      tolerance: 0.012,
      prefix: r`$I \ge$`,
      suffix: r`$\times 10^{6}\ \mathrm{mm^4}$`,
      answerDisplay: r`1.14 \times 10^{6}\ \mathrm{mm^4}`,
      hint: r`Find the Euler load the column must reach, then solve $P_{cr} = \pi^2 EI/L^2$ for $I$. Work in N and mm.`,
      explanation: r`Required $P_{cr} = 2.5 \times 100 = 250\ \mathrm{kN}$. $I = \dfrac{P_{cr} L^2}{\pi^2 E} = \dfrac{250\,000 \times 3000^2}{\pi^2 \times 200\,000} = 1.14 \times 10^{6}\ \mathrm{mm^4}$. This must be the column's **smaller** second moment of area.`,
      tags: ["euler", "design"],
    }),
    mc("best-shape", {
      question: "You have a fixed amount of steel for a slender column. Which cross-section gives the highest buckling load?",
      choices: [
        ["tube", "A thin-walled round tube"],
        ["solid", "A solid round bar", "The area is the same either way. What does moving material away from the centre do to I?"],
        ["flat", "A wide flat strip", "A strip has a very small second moment of area in its thin direction, and a column buckles the easy way."],
        ["same", "All shapes with the same area are equal", r`$P_{cr}$ depends on $I$, and shapes with the same area can have very different $I$.`],
      ],
      correct: "tube",
      shuffle: true,
      hint: r`For a fixed area you want the largest possible smallest $I$. Where should the material be placed relative to the centre?`,
      explanation: "A tube puts all its material far from the centre, which gives a large second moment of area in every direction for the same area. A solid bar wastes material near the middle, and a flat strip is stiff one way and floppy the other. This is why scaffolding, bicycle frames and bones are tubes.",
      tags: ["euler", "design", "cross-section"],
    }),
    tf("strength-slender", {
      statement: "For a slender column, switching to a steel with a higher yield stress raises the load at which it buckles.",
      answer: false,
      feedback: r`Which material property appears in $\sigma_{cr} = \pi^2 E/(L/r)^2$?`,
      hint: "Check which material property is in the critical-stress formula, and whether different steels differ much in it.",
      explanation: "False. A slender column's buckling stress depends on Young's modulus and slenderness only, and all steels have nearly the same Young's modulus. Higher strength helps only stocky columns, which fail by yielding. To make a slender column carry more, shorten it, brace it, restrain its ends, or increase its second moment of area.",
      tags: ["euler", "material"],
    }),
    reading(
      "summary",
      r`**The unit in one place**

Stability: equilibrium where $\dfrac{\mathrm{d}\Pi}{\mathrm{d}\theta} = 0$; stable when $\dfrac{\mathrm{d}^2\Pi}{\mathrm{d}\theta^2} > 0$.

Rigid link: $\Pi = \tfrac12 k\theta^2 - PL(1 - \cos\theta)$, $P_{crit} = k/L$ (torsional spring) or $kL$ (sideways spring at the top). Several links: $\det = 0$, smallest root.

Columns:
$$P_{cr} = \frac{\pi^2 EI}{(KL)^2}, \qquad K = 1,\ 2,\ 0.7,\ 0.5 \qquad\qquad \sigma_{cr} = \frac{\pi^2 E}{(KL/r)^2}, \qquad r = \sqrt{I/A}$$

Euler applies when $\sigma_{cr} < \sigma_Y$, that is for $L/r > \pi\sqrt{E/\sigma_Y}$. Use the smaller $I$. Strength does not enter.

**That is the course.** You started with a force on a body and can now find the stress, strain and deflection in bars, shafts and beams, describe stress from any direction, and check a design against yielding and buckling. The level checks and the review queue are there to make it stick.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Level check                                                         */
/* ------------------------------------------------------------------ */

const practice: QuestionStep[] = [
  mc("p-classify", {
    question: r`A system has potential energy $\Pi(\theta) = -2\theta^2 + \theta^4$. What kind of equilibrium is $\theta = 0$?`,
    choices: [
      ["unstable", "Unstable"],
      ["stable", "Stable", r`Differentiate twice and check the sign at $\theta = 0$.`],
      ["neutral", "Neutral", r`Neutral needs the second derivative to vanish at $\theta = 0$.`],
      ["none", "It is not an equilibrium", r`Check the first derivative at $\theta = 0$.`],
    ],
    correct: "unstable",
    shuffle: true,
    hint: "First derivative zero means equilibrium. The sign of the second derivative there gives its kind.",
    explanation: r`$\Pi' = -4\theta + 4\theta^3$ is zero at $\theta = 0$, and $\Pi'' = -4 + 12\theta^2 = -4 < 0$ there: a hilltop, so unstable.`,
    tags: ["stability", "energy"],
  }),
  numeric("p-link", {
    question: r`A rigid link $0.8\ \mathrm{m}$ long stands on a torsional spring of stiffness $240\ \mathrm{N \cdot m/rad}$. What is its critical load?`,
    answer: 300, // check: k/L = 240/0.8 = 300 N
    tolerance: 3,
    prefix: r`$P_{crit} =$`,
    suffix: "N",
    hint: "For a torsional spring at the base, the critical load is the stiffness divided by the length.",
    explanation: r`$P_{crit} = k/L = 240/0.8 = 300\ \mathrm{N}$.`,
    tags: ["rigid-link", "critical-load"],
  }),
  numeric("p-lateral", {
    question: r`A rigid link $2\ \mathrm{m}$ long is pivoted at its base and held at the top by a horizontal spring of stiffness $1.5\ \mathrm{kN/m}$. What is its critical load, in kN?`,
    answer: 3, // check: kL = 1.5 × 2 = 3 kN
    tolerance: 0.03,
    prefix: r`$P_{crit} =$`,
    suffix: "kN",
    hint: "For a sideways spring at the top, balance the spring's moment about the pivot against the load's, for a small tilt.",
    explanation: r`Restoring moment $kL^2\theta$ against overturning moment $PL\theta$ gives $P_{crit} = kL = 1.5 \times 2 = 3\ \mathrm{kN}$.`,
    tags: ["rigid-link", "critical-load"],
  }),
  numeric("p-two-link", {
    body: TWO_LINKS,
    question: r`With $k_1 = 5k$ and $k_2 = 6k$, what is the critical load as a multiple of $k/L$?`,
    answer: 2, // check: p² − (5 + 12)kp + 30k² = (p − 2k)(p − 15k) → 2
    tolerance: 0.02,
    prefix: r`$P_{crit} =$`,
    suffix: r`$\times\ k/L$`,
    answerDisplay: r`2\,k/L`,
    hint: r`The matrix is $\begin{bmatrix} k_1 + k_2 - PL & -k_2 \\ -k_2 & k_2 - PL \end{bmatrix}$. Set its determinant to zero and take the smaller root.`,
    explanation: r`With $p = PL$: $(11k - p)(6k - p) - 36k^2 = p^2 - 17kp + 30k^2 = (p - 2k)(p - 15k) = 0$. The smaller root gives $P_{crit} = 2k/L$.`,
    tags: ["multi-dof", "critical-load"],
  }),
  numeric("p-euler", {
    question: r`A pinned–pinned timber post has $E = 10\ \mathrm{GPa}$, $I = 5 \times 10^{6}\ \mathrm{mm^4}$ and length $2.5\ \mathrm{m}$. What is its Euler load, in kN?`,
    answer: 78.96, // check: π² × 10 000 × 5e6 / 2500² = π² × 8000 = 78 957 N
    tolerance: 0.8,
    prefix: r`$P_{cr} =$`,
    suffix: "kN",
    hint: r`$P_{cr} = \pi^2 EI/L^2$, with $E$ in MPa and lengths in mm.`,
    explanation: r`$P_{cr} = \dfrac{\pi^2 \times 10\,000 \times 5 \times 10^{6}}{2500^2} = \pi^2 \times 8000 = 78\,960\ \mathrm{N} = 79.0\ \mathrm{kN}$.`,
    tags: ["euler"],
  }),
  numeric("p-clamped-free", {
    question: r`A column has $\pi^2 EI/L^2 = 120\ \mathrm{kN}$. It is clamped at the base and free at the top. What is its buckling load, in kN?`,
    answer: 30, // check: K = 2 → 120/4 = 30 kN
    tolerance: 0.3,
    prefix: r`$P_{cr} =$`,
    suffix: "kN",
    hint: "A clamped–free column has an effective length of twice its real length.",
    explanation: r`$K = 2$, so $P_{cr} = 120/2^2 = 30\ \mathrm{kN}$.`,
    tags: ["euler", "effective-length"],
  }),
  numeric("p-clamped-clamped", {
    question: r`The same column ($\pi^2 EI/L^2 = 120\ \mathrm{kN}$) is clamped at both ends instead. What is its buckling load, in kN?`,
    answer: 480, // check: K = 0.5 → 120 × 4 = 480 kN
    tolerance: 4.8,
    prefix: r`$P_{cr} =$`,
    suffix: "kN",
    hint: "A clamped–clamped column has an effective length of half its real length.",
    explanation: r`$K = 0.5$, so $P_{cr} = 120/0.5^2 = 480\ \mathrm{kN}$.`,
    tags: ["euler", "effective-length"],
  }),
  numeric("p-slenderness", {
    question: r`A solid round bar of diameter $40\ \mathrm{mm}$ has radius of gyration $r = d/4 = 10\ \mathrm{mm}$. It is used as a pinned–pinned steel column ($E = 200\ \mathrm{GPa}$) $1.5\ \mathrm{m}$ long. What is its critical stress?`,
    answer: 87.73, // check: L/r = 150; π² × 200 000 / 150² = 1 973 921 / 22 500 = 87.73 MPa
    tolerance: 0.9,
    prefix: r`$\sigma_{cr} =$`,
    suffix: "MPa",
    hint: r`Find the slenderness ratio first, then use $\sigma_{cr} = \pi^2 E/(L/r)^2$.`,
    explanation: r`$L/r = 1500/10 = 150$. $\sigma_{cr} = \dfrac{\pi^2 \times 200\,000}{150^2} = 87.7\ \mathrm{MPa}$.`,
    tags: ["slenderness", "critical-stress"],
  }),
  mc("p-governs", {
    question: r`An aluminium column has $E = 70\ \mathrm{GPa}$ and $\sigma_Y = 280\ \mathrm{MPa}$, so its transition slenderness is $\pi\sqrt{E/\sigma_Y} \approx 50$. Its actual slenderness ratio is $120$. What governs its failure?`,
    choices: [
      ["buckling", "Elastic buckling, at the Euler load"],
      ["yield", "Yielding, at the yield stress times the area", "Compare 120 with the transition value. Is this column slender or stocky?"],
      ["both", "Both at the same load", "That happens only at the transition slenderness itself."],
      ["neither", "Neither: it is safe at any load", "Every column has a limit."],
    ],
    correct: "buckling",
    shuffle: true,
    hint: "A slenderness ratio above the transition value means the Euler stress is below the yield stress.",
    explanation: r`$120 > 50$, so the column is slender. Its Euler stress, $\pi^2 \times 70\,000/120^2 = 48\ \mathrm{MPa}$, is far below the yield stress, so it buckles elastically.`,
    tags: ["slenderness", "yield"],
  }),
  multi("p-raise", {
    question: "Which changes raise the buckling load of a slender pinned–pinned steel column?",
    choices: [
      ["shorter", "Making it shorter"],
      ["brace", "Bracing it sideways at mid-height"],
      ["clamp", "Clamping its ends instead of pinning them"],
      ["tube", "Reshaping the same steel into a tube with a larger second moment of area"],
      ["strong", "Using a steel with a higher yield stress and the same Young's modulus"],
    ],
    correct: ["shorter", "brace", "clamp", "tube"],
    hint: r`Look at $P_{cr} = \pi^2 EI/(KL)^2$. Which changes alter $E$, $I$, $K$ or $L$?`,
    explanation: r`Shortening reduces $L$, bracing halves the buckling length, clamping reduces $K$, and a tube raises $I$. Yield stress does not appear in the formula, so a stronger steel with the same $E$ changes nothing.`,
    tags: ["euler", "design"],
  }),
  tf("p-amplitude", {
    statement: "Euler's analysis predicts the sideways deflection of the column once the buckling load is exceeded.",
    answer: false,
    feedback: r`In the solution $v = A\sin(\pi x/L)$, what did the boundary conditions say about $A$?`,
    hint: r`Look at the buckled shape $v = A\sin(\pi x/L)$. Was $A$ ever determined?`,
    explanation: "False. The analysis is linearised: it gives the load and the shape, but the amplitude is left undetermined.",
    tags: ["euler", "linearisation"],
  }),
];

export const sm10: Unit = {
  id: "sm10",
  title: "Stability and buckling",
  subtitle: "When a straight column stops being a stable place to rest",
  description: "Buckling is a failure of equilibrium, not of material. Use potential energy to test stability, find the critical load of spring-and-link models, and apply Euler's formula to columns.",
  textbook: "Govindjee §12.1–12.3",
  lessons: [l1, l2, l3, l4, l5],
  practice,
  generators: ["gen.sm.link-critical", "gen.sm.euler-load", "gen.sm.critical-stress", "gen.sm.column-length"],
};
