import type { QuestionStep, Unit } from "../types";
import { lesson, mc, multi, numeric, order, r, reading, tf } from "../dsl";

/*
 * Unit sm0 · Foundations (Govindjee ch. 1, Lecture 11).
 *
 * Written for someone who has never taken statics: what a force and a moment are,
 * how loads are summarised, what equilibrium demands, how a free-body diagram is
 * drawn, and how a section cut exposes the internal forces the rest of the course
 * is about. Sign conventions follow the book: counter-clockwise moments positive,
 * internal axial force R positive in tension. Every numeric answer carries a
 * "check" comment.
 */

/* ------------------------------------------------------------------ */
/* Lesson 1 · Forces, tractions and units (Govindjee §1.1, §1.5)       */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "sm0-l1-forces-and-units",
    unitId: "sm0",
    title: "Forces and units",
    summary: "What solid mechanics is for, the two ways a force reaches a body, and the unit system the whole course runs on.",
    textbook: "Govindjee §1.1, §1.5",
    minutes: 10,
  },
  [
    reading(
      "what-is",
      r`Stand on a wooden plank laid across a stream. Two questions decide whether you stay dry: **will the plank break**, and **how far will it sag**? Solid mechanics is the set of tools that answers both, for planks, bridges, bones, aircraft wings and bike frames alike.

Everything starts with a **force**: a push or a pull. A force has a size and a direction, so it is a vector. Its unit is the **newton**:

$$1\ \mathrm{N} = 1\ \mathrm{kg\cdot m/s^2}.$$

One newton is small, about the weight of an apple. The weight of any object is its mass times $g = 9.81\ \mathrm{m/s^2}$, so a 1 kg bag of rice weighs $9.81\ \mathrm{N}$. Engineers usually work in kilonewtons: $1\ \mathrm{kN} = 1000\ \mathrm{N}$, roughly the weight of a 100 kg person.`,
      { title: "What this course is about" },
    ),
    numeric("weight", {
      question: r`A toolbox has a mass of $20\ \mathrm{kg}$. What is its weight?`,
      answer: 196.2, // check: 20 kg × 9.81 m/s² = 196.2 N
      tolerance: 2,
      suffix: "N",
      hint: r`Weight is a force: mass times $g$, with $g = 9.81\ \mathrm{m/s^2}$.`,
      explanation: r`$W = mg = 20\ \mathrm{kg} \times 9.81\ \mathrm{m/s^2} = 196.2\ \mathrm{N}$, about $0.2\ \mathrm{kN}$. Mass (kg) says how much stuff there is. Weight (N) is the force gravity puts on it.`,
      tags: ["units", "force"],
    }),
    reading(
      "kinds",
      r`A force reaches a body in one of two ways.

- A **surface traction** acts on the outside of the body, spread over an area: water pressing on a dam, a tyre pressing on the road, your hand on a door. It is measured as force per area, $\mathrm{N/m^2}$, which has its own name, the **pascal** (Pa).
- A **body force** acts on every particle inside the body: gravity is the one you will meet. It is measured as force per volume, $\mathrm{N/m^3}$.

A "point force" drawn as a single arrow is a convenient fiction. Really it is a traction on a small patch, added up. Adding up is easy when the traction is uniform:

$$\text{total force} = \text{traction} \times \text{area}.$$

One more fact you already know from daily life: forces come in pairs. If a wall pushes on a beam with $500\ \mathrm{N}$, the beam pushes back on the wall with $500\ \mathrm{N}$ the other way.`,
      { title: "Two kinds of force" },
    ),
    mc("classify", {
      question: "Which of these is a body force?",
      choices: [
        ["gravity", "Gravity pulling on every part of a concrete beam"],
        ["wind", "Wind pressing on the side of a building", "Wind touches only the outside surface. Which kind of force acts on a surface?"],
        ["bolt", "A bolt head pressing on a steel plate", "The bolt touches the plate over a small patch of its surface."],
        ["water", "Water pressing on the wall of a tank", "Water pressure acts where the water touches the wall, not inside the wall."],
      ],
      correct: "gravity",
      shuffle: true,
      hint: "Ask where the force acts: on the outside surface only, or on all the material inside as well?",
      explanation: "Gravity acts on every particle of the beam, so it is a body force (force per volume). Wind, the bolt and the water all act where something touches the surface, so they are surface tractions (force per area).",
      tags: ["force"],
    }),
    numeric("traction-to-force", {
      question: r`Snow presses down on a flat roof panel, $3\ \mathrm{m}$ by $4\ \mathrm{m}$, with a uniform traction of $2\ \mathrm{kPa}$ (that is, $2000\ \mathrm{N/m^2}$). What is the total force on the panel?`,
      answer: 24, // check: 2000 N/m² × 12 m² = 24 000 N = 24 kN
      tolerance: 0.25,
      suffix: "kN",
      hint: "A uniform traction times the area it acts on gives the total force. Find the area first, then convert newtons to kilonewtons.",
      explanation: r`Area $= 3 \times 4 = 12\ \mathrm{m^2}$. Force $= 2000\ \mathrm{N/m^2} \times 12\ \mathrm{m^2} = 24\,000\ \mathrm{N} = 24\ \mathrm{kN}$. A traction that sounds small adds up to a large force over a large area.`,
      tags: ["traction", "units"],
    }),
    reading(
      "units",
      r`A pascal is tiny, so you will mostly see its multiples:

$$1\ \mathrm{kPa} = 10^3\ \mathrm{Pa}, \qquad 1\ \mathrm{MPa} = 10^6\ \mathrm{Pa}, \qquad 1\ \mathrm{GPa} = 10^9\ \mathrm{Pa}.$$

The one conversion worth memorising:

$$1\ \mathrm{MPa} = 1\ \mathrm{N/mm^2}.$$

So if you put **forces in newtons and lengths in millimetres**, anything that is force per area comes out directly in MPa. Most of this course uses that N, mm, MPa system.

> **Check your units at every step.** Every term in a correct equation carries the same units. If one side is a length and the other is a force per length, the equation is wrong, no matter how carefully the algebra was done. This is called dimensional homogeneity.`,
      { title: "The N, mm, MPa system" },
    ),
    numeric("mpa", {
      question: r`A force of $5000\ \mathrm{N}$ is spread evenly over an area of $250\ \mathrm{mm^2}$. What is the force per area?`,
      answer: 20, // check: 5000 N / 250 mm² = 20 N/mm² = 20 MPa
      tolerance: 0.2,
      suffix: "MPa",
      hint: r`Divide the force by the area. With newtons and square millimetres, what unit comes out?`,
      explanation: r`$5000\ \mathrm{N} / 250\ \mathrm{mm^2} = 20\ \mathrm{N/mm^2} = 20\ \mathrm{MPa}$. No powers of ten to track, which is the point of working in N and mm.`,
      tags: ["units"],
    }),
    numeric("safe-force", {
      question: r`A steel rod can safely carry $150\ \mathrm{MPa}$ (force per area). Its cross-section is $80\ \mathrm{mm^2}$. What is the largest force it can safely carry?`,
      answer: 12, // check: 150 N/mm² × 80 mm² = 12 000 N = 12 kN
      tolerance: 0.12,
      suffix: "kN",
      hint: r`Rearrange force per area $=$ force $/$ area. Remember $1\ \mathrm{MPa} = 1\ \mathrm{N/mm^2}$, and the answer is asked in kN.`,
      explanation: r`Force $=$ (force per area) $\times$ area $= 150\ \mathrm{N/mm^2} \times 80\ \mathrm{mm^2} = 12\,000\ \mathrm{N} = 12\ \mathrm{kN}$. That is a rod thinner than a pencil holding up more than a tonne.`,
      tags: ["units"],
    }),
    mc("homogeneity", {
      body: r`A classmate claims that a bar of length $L$ and cross-section area $A$, pulled by a force $P$, stretches by $\delta = PL/A$.`,
      question: "Without knowing any mechanics, how can you tell the formula is wrong?",
      choices: [
        ["units", r`Its units are $\mathrm{N \cdot m / m^2} = \mathrm{N/m}$, but a stretch must be a length.`],
        ["big", r`$P$ could be very large, which would make $\delta$ too big.`, "A formula is not wrong just because it can give a large number. Look at what kind of quantity each side is."],
        ["mm", r`$A$ has to be in $\mathrm{mm^2}$, not $\mathrm{m^2}$.`, "Changing the unit system rescales the number. It cannot turn a force per length into a length."],
        ["fine", "You cannot tell. It might be right.", r`Write the units of $P$, $L$ and $A$ and combine them. Is the result a length?`],
      ],
      correct: "units",
      shuffle: true,
      hint: r`Write the units of the right-hand side and compare them with the units of a stretch.`,
      explanation: r`$PL/A$ has units $\mathrm{N \cdot m/m^2} = \mathrm{N/m}$. The left side, a stretch, is in metres. The units do not match, so the formula cannot be right. (The correct one, which the next unit builds, has a stiffness in the denominator that fixes the units.)`,
      tags: ["units", "dimensional-analysis"],
    }),
    tf("newton3", {
      statement: r`A bracket holds up a shelf by pushing on it with $300\ \mathrm{N}$ upward. The shelf therefore pushes on the bracket with $300\ \mathrm{N}$ downward.`,
      answer: true,
      feedback: "Forces between two bodies in contact always come as a pair. What does the pair look like?",
      hint: "Think about the pair of forces where the two bodies touch: same size, which directions?",
      explanation: r`True. Every force has an equal and opposite reaction on the body that causes it. This is why, when you isolate one body in a diagram, you must be clear whose force on whom you are drawing.`,
      tags: ["force"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Turn a mass into a weight: $W = mg$.
- Tell a surface traction (force per area, Pa) from a body force (force per volume).
- Turn a uniform traction into a total force: traction $\times$ area.
- Work in N, mm and MPa, using $1\ \mathrm{MPa} = 1\ \mathrm{N/mm^2}$.
- Reject a formula whose units do not match.

Next: what a force does when it does not pass through the point you care about. It turns things.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Moments and resultants (Govindjee §1.1)                  */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "sm0-l2-moments-and-resultants",
    unitId: "sm0",
    title: "Moments and resultants",
    summary: "The turning effect of a force, and how any set of loads boils down to one force and one moment.",
    textbook: "Govindjee §1.1",
    minutes: 12,
  },
  [
    reading(
      "moment",
      r`Push on a door near the hinge and it barely moves. Push with the same force at the handle and it swings easily. The force is the same. What changed is its **moment**: its turning effect about the hinge.

$$M = F \times d$$

Here $d$ is the **perpendicular distance** from the point (the hinge) to the line the force acts along, called its line of action. The unit is the newton-metre, $\mathrm{N \cdot m}$.

A moment also has a direction of turning. The convention used throughout this course: **counter-clockwise is positive**, clockwise is negative.

Example: you pull on a spanner with $50\ \mathrm{N}$, at right angles to the handle, $0.3\ \mathrm{m}$ from the bolt. The moment about the bolt is $50 \times 0.3 = 15\ \mathrm{N \cdot m}$.`,
      { title: "The turning effect of a force" },
    ),
    numeric("wrench", {
      question: r`You push with $80\ \mathrm{N}$ at right angles to a spanner, $0.25\ \mathrm{m}$ from the bolt. What is the size of the moment about the bolt?`,
      answer: 20, // check: 80 N × 0.25 m = 20 N·m
      tolerance: 0.2,
      suffix: r`$\mathrm{N \cdot m}$`,
      answerDisplay: r`20\ \mathrm{N \cdot m}`,
      hint: "Moment is force times the perpendicular distance from the point to the force's line of action.",
      explanation: r`$M = F d = 80\ \mathrm{N} \times 0.25\ \mathrm{m} = 20\ \mathrm{N \cdot m}$. A longer spanner gives a larger moment for the same push, which is why stuck bolts get a longer handle.`,
      tags: ["moment"],
    }),
    mc("line-of-action", {
      question: r`Now you push with the same $80\ \mathrm{N}$, but **along** the handle, straight toward the bolt. What is the moment about the bolt?`,
      choices: [
        ["zero", "Zero"],
        ["same", r`Still $20\ \mathrm{N \cdot m}$`, "The force is the same size, but the distance that matters is the perpendicular distance from the bolt to the line the force acts along. What is that distance now?"],
        ["eighty", r`$80\ \mathrm{N \cdot m}$`, "A moment is a force times a distance. Which distance, and how big is it when the force points straight at the bolt?"],
        ["depends", "It depends on how hard the bolt resists", "The moment of a force about a point depends only on the force and the geometry."],
      ],
      correct: "zero",
      hint: "Extend the force's line of action. How far does that line pass from the bolt?",
      explanation: "The line of action passes straight through the bolt, so the perpendicular distance is zero and so is the moment. You are just pushing the spanner into the bolt, not turning it. A force has no moment about any point on its own line of action.",
      tags: ["moment"],
    }),
    numeric("signed", {
      body: r`A horizontal bar is pivoted at point $O$. Two forces act on it, both pointing **down**: $30\ \mathrm{N}$ at $2\ \mathrm{m}$ to the right of $O$, and $40\ \mathrm{N}$ at $1\ \mathrm{m}$ to the left of $O$.`,
      question: r`What is the total moment about $O$? Use counter-clockwise as positive.`,
      answer: -20, // check: right force turns clockwise: −30×2 = −60; left force turns counter-clockwise: +40×1 = +40; sum −20 N·m
      tolerance: 0.2,
      suffix: r`$\mathrm{N \cdot m}$`,
      answerDisplay: r`-20\ \mathrm{N \cdot m}`,
      hint: "Find each moment separately. For the sign, imagine the bar free to spin about O: which way would each force alone turn it?",
      explanation: r`The $30\ \mathrm{N}$ force on the right would turn the bar clockwise: $-30 \times 2 = -60\ \mathrm{N \cdot m}$. The $40\ \mathrm{N}$ force on the left would turn it counter-clockwise: $+40 \times 1 = +40\ \mathrm{N \cdot m}$. Total: $-20\ \mathrm{N \cdot m}$, a net clockwise turning effect.`,
      tags: ["moment", "sign-convention"],
    }),
    reading(
      "resultant",
      r`A real structure carries many loads at once. For questions about the body as a whole, the whole set can be replaced by just two things:

- the **resultant force** $\mathbf{R}$: all the forces added up as vectors, and
- the **resultant moment** $M_O$: all their moments about one chosen point $O$, added up.

Two sets of loads with the same resultant force and the same resultant moment are called **statically equivalent**. As far as overall balance goes, they are interchangeable.

The most useful case is a **distributed load**: a load spread along a length, measured in force per length (N/m or kN/m). A uniform load $q$ over a length $b$ is statically equivalent to

$$\text{a single force } qb \text{ acting at the middle of the loaded length.}$$

The size $qb$ is the area of the load diagram. The middle is its centroid.`,
      { title: "Boiling loads down" },
    ),
    numeric("udl-resultant", {
      question: r`A shelf carries books that load it uniformly with $3\ \mathrm{kN/m}$ along $4\ \mathrm{m}$. What single force is this equivalent to?`,
      answer: 12, // check: 3 kN/m × 4 m = 12 kN
      tolerance: 0.12,
      suffix: "kN",
      hint: "Force per length times the length it acts over.",
      explanation: r`$qb = 3\ \mathrm{kN/m} \times 4\ \mathrm{m} = 12\ \mathrm{kN}$. The metres cancel, leaving a force.`,
      tags: ["resultant", "distributed-load"],
    }),
    numeric("udl-moment", {
      question: r`That load runs from $x = 0$ to $x = 4\ \mathrm{m}$. What is the size of its moment about the point $x = 0$?`,
      answer: 24, // check: 12 kN acting at x = 2 m → 12 × 2 = 24 kN·m
      tolerance: 0.24,
      suffix: r`$\mathrm{kN \cdot m}$`,
      answerDisplay: r`24\ \mathrm{kN \cdot m}`,
      hint: "Replace the distributed load by its single equivalent force first. Where along the shelf does that force act?",
      explanation: r`The equivalent force is $12\ \mathrm{kN}$ at the middle of the loaded length, $x = 2\ \mathrm{m}$. Its moment about $x = 0$ is $12 \times 2 = 24\ \mathrm{kN \cdot m}$. Using the far end ($4\ \mathrm{m}$) as the distance is the classic mistake.`,
      tags: ["resultant", "distributed-load", "moment"],
    }),
    reading(
      "moving",
      r`What if you want to describe the same load at a different point?

**Moving a force sideways costs a moment.** A force $F$ acting at a distance $a$ from a point is statically equivalent to the same force acting *at* that point, plus a moment of size $Fa$ turning the same way the original force would turn the body about that point.

So the uniform load $q$ over a length $b$ is also equivalent to a force $qb$ at one **end** of the loaded length together with a moment $qb \times b/2 = qb^2/2$.

A special case: two equal and opposite forces a distance $d$ apart add up to zero force but not zero moment. This is a **couple**. Its moment is $Fd$, and it is the same about every point. Turning a tap or a steering wheel with two hands applies a couple.`,
      { title: "Moving a force, and couples" },
    ),
    numeric("couple", {
      question: r`Two hands push on a steering wheel with equal and opposite forces of $200\ \mathrm{N}$, along parallel lines $0.4\ \mathrm{m}$ apart. What is the size of the moment they apply?`,
      answer: 80, // check: couple = F d = 200 × 0.4 = 80 N·m
      tolerance: 0.8,
      suffix: r`$\mathrm{N \cdot m}$`,
      answerDisplay: r`80\ \mathrm{N \cdot m}`,
      hint: "For a couple, the moment is one of the forces times the distance between the two lines of action.",
      explanation: r`$M = Fd = 200 \times 0.4 = 80\ \mathrm{N \cdot m}$. Check it about the wheel's centre: each force is $0.2\ \mathrm{m}$ away and both turn the wheel the same way, so $200 \times 0.2 + 200 \times 0.2 = 80\ \mathrm{N \cdot m}$. Any other point gives the same answer.`,
      tags: ["couple", "moment"],
    }),
    mc("equivalent", {
      body: r`A beam sticks out $2\ \mathrm{m}$ from a wall. A weight of $100\ \mathrm{N}$ hangs from its free end, pulling down. The beam points to the right, away from the wall.`,
      question: "Which load, applied at the wall end of the beam, is statically equivalent to the hanging weight?",
      choices: [
        ["both", r`$100\ \mathrm{N}$ down together with a clockwise moment of $200\ \mathrm{N \cdot m}$`],
        ["force", r`$100\ \mathrm{N}$ down, and nothing else`, "The force is right, but a force at the wall and a force at the tip do not turn the beam the same way about the wall."],
        ["moment", r`A clockwise moment of $200\ \mathrm{N \cdot m}$, and nothing else`, "The moment is right, but the two systems must also have the same total force."],
        ["half", r`$100\ \mathrm{N}$ down together with a clockwise moment of $100\ \mathrm{N \cdot m}$`, "Moving a force sideways costs a moment of force times the distance moved. How far was it moved?"],
      ],
      correct: "both",
      shuffle: true,
      hint: "Statically equivalent means the same total force and the same total moment about any one point. Compare both, taking moments about the wall end.",
      explanation: r`Moving the $100\ \mathrm{N}$ force $2\ \mathrm{m}$ sideways to the wall keeps the force and adds a moment of $100 \times 2 = 200\ \mathrm{N \cdot m}$. A downward force to the right of the wall would turn the beam clockwise about the wall, so the moment is clockwise. This is exactly what the wall has to resist.`,
      tags: ["resultant", "moment"],
    }),
    tf("centroid", {
      statement: "A uniform pressure on a flat rectangular plate is statically equivalent to a single force acting at the centre of the plate.",
      answer: true,
      feedback: "Think of the uniform load on the shelf. Where did its single equivalent force act?",
      hint: "This is the two-dimensional version of the uniform load on a length. Where did that one act?",
      explanation: "True. A uniform traction acts through the centroid of the area it covers, and the centroid of a rectangle is its centre. The size of the force is the pressure times the area.",
      tags: ["resultant", "traction"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Find the moment of a force about a point: $M = Fd$, with $d$ the perpendicular distance to the line of action. Counter-clockwise is positive.
- Replace a uniform distributed load $q$ over a length $b$ by a force $qb$ at its middle.
- Move a force to another point by adding a moment $Fa$.
- Recognise a couple: zero net force, moment $Fd$ about every point.

Next: the rule every structure at rest has to obey, and the diagram that makes it usable.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Equilibrium and free-body diagrams (Govindjee §1.2–1.3)  */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "sm0-l3-equilibrium-and-free-body-diagrams",
    unitId: "sm0",
    title: "Equilibrium and free-body diagrams",
    summary: "A body at rest has zero net force and zero net moment. Free-body diagrams turn that into equations for the support reactions.",
    textbook: "Govindjee §1.2–1.3",
    minutes: 13,
  },
  [
    reading(
      "equilibrium",
      r`A body that stays at rest is in **static equilibrium**. Two things must be true of all the forces acting on it:

$$\sum \mathbf{F} = \mathbf{0}, \qquad \sum M_O = 0.$$

No net force, or it would start to move. No net moment, or it would start to spin. The moment sum can be taken about any point you like. If it is zero about one point, it is zero about all of them.

For a flat (two-dimensional) problem that makes **three equations**:

$$\sum F_x = 0, \qquad \sum F_y = 0, \qquad \sum M_O = 0.$$

One sentence from the textbook carries the rest of the course: a body is in equilibrium only if **every piece of it** is in equilibrium. Cut off any part you like, and the forces on that part must balance too.`,
      { title: "The rule for a body at rest" },
    ),
    reading(
      "fbd",
      r`To use equilibrium you need a **free-body diagram**: a sketch of the body on its own, with everything it touches replaced by the forces those things exert on it.

Supports are replaced by **reactions**. What a support can push with depends on what motion it prevents:

- A **roller** stops motion in one direction: **1** unknown force, perpendicular to the surface it rolls on.
- A **pin** stops motion in both directions but lets the body rotate: **2** unknown force components.
- A **built-in** (fixed) support stops motion and rotation: **2** force components and **1** moment.

Draw each unknown in a direction you guess. If the answer comes out negative, it simply acts the other way.

The beam below sits on a pin at the left end ($A$) and a roller at the right end ($B$). Slide the load along and watch the two reactions share it.`,
      {
        title: "Free-body diagrams",
        visual: { kind: "shear-moment", config: { length: 6, support: "simple", loads: [{ kind: "point", x: 2, P: 12 }], sliders: true, units: { length: "m", force: "kN" } } },
      },
    ),
    mc("support-count", {
      question: "A flagpole is built into the ground. In a flat (two-dimensional) problem, how many unknown reactions does the ground supply?",
      choices: [
        ["three", "Three: two force components and a moment"],
        ["one", "One: a vertical force", "A single vertical force could hold up the pole's weight. Could it stop the pole falling over in the wind?"],
        ["two", "Two: a horizontal and a vertical force", "That is what a pin supplies. A pin lets the body rotate freely. Does the ground let the flagpole rotate?"],
        ["none", "None: the pole holds itself up", "Without the ground, nothing balances the pole's weight."],
      ],
      correct: "three",
      shuffle: true,
      hint: "List the motions the ground prevents at the base of the pole: sideways, up and down, and one more.",
      explanation: "A built-in support prevents sideways motion, vertical motion and rotation, so it supplies a horizontal force, a vertical force and a moment: three unknowns. Three unknowns and three equilibrium equations means they can all be found.",
      tags: ["free-body-diagram", "supports"],
    }),
    numeric("ss-reaction-b", {
      body: r`A beam $6\ \mathrm{m}$ long rests on a pin at its left end $A$ and a roller at its right end $B$. A $12\ \mathrm{kN}$ load pushes down on it $2\ \mathrm{m}$ from $A$.`,
      question: r`What is the upward reaction at $B$?`,
      answer: 4, // check: ΣM about A: B×6 − 12×2 = 0 → B = 4 kN
      tolerance: 0.04,
      prefix: r`$B =$`,
      suffix: "kN",
      hint: r`Take moments about $A$. The reaction at $A$ has no moment about $A$, so only the load and $B$ appear in the equation.`,
      explanation: r`Taking moments about $A$, counter-clockwise positive: $B \times 6 - 12 \times 2 = 0$, so $B = 4\ \mathrm{kN}$. The load is closer to $A$, so $B$ carries the smaller share.`,
      tags: ["equilibrium", "reactions"],
    }),
    numeric("ss-reaction-a", {
      question: r`Same beam: what is the upward reaction at $A$?`,
      answer: 8, // check: ΣFy: A + 4 − 12 = 0 → A = 8 kN
      tolerance: 0.08,
      prefix: r`$A =$`,
      suffix: "kN",
      hint: "You already know one of the two upward forces. Use the vertical force balance.",
      explanation: r`Vertical balance: $A + B - 12 = 0$ with $B = 4\ \mathrm{kN}$ gives $A = 8\ \mathrm{kN}$. Check with moments about $B$: $12 \times 4 - A \times 6 = 0$ also gives $A = 8\ \mathrm{kN}$. An unused equation is a free check.`,
      tags: ["equilibrium", "reactions"],
    }),
    mc("why-about-a", {
      question: r`Why was it smart to take moments about $A$ first, rather than writing the vertical force balance first?`,
      choices: [
        ["one-unknown", r`The unknown reaction at $A$ has no moment about $A$, so the equation has only one unknown.`],
        ["must", "Moments must always be taken about the left end of a beam.", "Equilibrium holds about any point. The choice is yours, so make it a useful one."],
        ["zero", r`The reaction at $B$ has no moment about $A$.`, r`$B$ acts $6\ \mathrm{m}$ from $A$, so it certainly has a moment about $A$. Which force passes through $A$?`],
        ["only", "A moment equation is the only equation that holds for a beam.", "The force balances hold as well. They were used for the second reaction."],
      ],
      correct: "one-unknown",
      shuffle: true,
      hint: "Count the unknowns in each possible equation. Which choice of point removes one of them?",
      explanation: r`A force has no moment about a point on its own line of action. Taking moments about $A$ removes the reaction at $A$ from the equation and leaves $B$ as the only unknown. The vertical balance alone has two unknowns. Choosing the moment point to kill unknowns is the main trick of statics.`,
      tags: ["equilibrium"],
    }),
    numeric("cantilever-moment", {
      question: r`A diving board is built into a wall and sticks out $3\ \mathrm{m}$. A diver weighing $0.8\ \mathrm{kN}$ stands at the free end. What size of moment must the wall supply?`,
      answer: 2.4, // check: M = 0.8 kN × 3 m = 2.4 kN·m
      tolerance: 0.03,
      suffix: r`$\mathrm{kN \cdot m}$`,
      answerDisplay: r`2.4\ \mathrm{kN \cdot m}`,
      hint: "Draw the board on its own. The wall supplies an upward force and a moment. Take moments about the wall end.",
      explanation: r`Moments about the wall end: the diver's weight has a moment of $0.8 \times 3 = 2.4\ \mathrm{kN \cdot m}$, and the wall's reaction moment must cancel it. The wall also pushes up with $0.8\ \mathrm{kN}$ to balance the weight.`,
      tags: ["equilibrium", "reactions", "moment"],
    }),
    numeric("udl-reactions", {
      question: r`A beam $8\ \mathrm{m}$ long sits on a pin at one end and a roller at the other. It carries a uniform load of $2\ \mathrm{kN/m}$ along its whole length. What is each support reaction?`,
      answer: 8, // check: total 2×8 = 16 kN at mid-span → 8 kN each by symmetry
      tolerance: 0.08,
      suffix: "kN",
      hint: "Replace the distributed load by its single equivalent force. Where does it act, relative to the two supports?",
      explanation: r`The load is equivalent to $2 \times 8 = 16\ \mathrm{kN}$ at mid-span. That is exactly halfway between the supports, so they share it equally: $8\ \mathrm{kN}$ each.`,
      tags: ["equilibrium", "reactions", "distributed-load"],
    }),
    numeric("udl-partial", {
      body: r`A beam $6\ \mathrm{m}$ long sits on a pin at $A$ ($x = 0$) and a roller at $B$ ($x = 6\ \mathrm{m}$). A uniform load of $4\ \mathrm{kN/m}$ covers only the left half, from $x = 0$ to $x = 3\ \mathrm{m}$.`,
      question: r`What is the reaction at $B$?`,
      answer: 3, // check: resultant 4×3 = 12 kN at x = 1.5 m; ΣM_A: B×6 − 12×1.5 = 0 → B = 3 kN
      tolerance: 0.03,
      prefix: r`$B =$`,
      suffix: "kN",
      hint: r`First replace the distributed load by one force: how big, and at what $x$? Then take moments about $A$.`,
      explanation: r`The load is equivalent to $4 \times 3 = 12\ \mathrm{kN}$ at the middle of the loaded part, $x = 1.5\ \mathrm{m}$. Moments about $A$: $B \times 6 - 12 \times 1.5 = 0$, so $B = 3\ \mathrm{kN}$ (and $A = 9\ \mathrm{kN}$).`,
      tags: ["equilibrium", "reactions", "distributed-load"],
    }),
    order("fbd-steps", {
      question: "Put the steps for finding support reactions in order.",
      items: [
        ["isolate", "Sketch the body on its own, cut free from its supports"],
        ["loads", "Draw the applied loads, replacing each distributed load by its equivalent force"],
        ["reactions", "Draw the unknown reactions each support can supply"],
        ["equations", "Write the equilibrium equations, choosing a moment point that removes unknowns"],
        ["check", "Solve, then check with an equation you have not used"],
      ],
      hint: "You cannot write equations until every force is on the diagram, and you cannot draw the forces until the body is isolated.",
      explanation: "Isolate the body, add the applied loads, add the reactions, then write and solve the equilibrium equations, and finish with an independent check. Most wrong answers in statics come from a force missing from the diagram, not from the algebra.",
      tags: ["free-body-diagram"],
    }),
    tf("indeterminate", {
      statement: "A beam held by a pin at each end has four unknown reactions, so the three equilibrium equations alone cannot find all of them.",
      answer: true,
      feedback: "Count: how many unknowns does each pin supply, and how many equations does a flat problem give?",
      hint: "Two pins, two unknown components each. Compare with the number of equilibrium equations in two dimensions.",
      explanation: "True. Each pin supplies two force components, four in all, against three equations. Such a problem is called statically indeterminate. The missing equation comes from how the body deforms, which is why this course studies deformation and not just balance.",
      tags: ["equilibrium", "indeterminate"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- State equilibrium: $\sum F_x = 0$, $\sum F_y = 0$, $\sum M_O = 0$, for a body and for every piece of it.
- Draw a free-body diagram, replacing a roller by 1 unknown, a pin by 2, and a built-in support by 3.
- Find reactions, taking moments about a point that removes unknowns.
- Spot when equilibrium alone is not enough.

Next: the reactions hold the body up from outside. What is happening inside it?`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Internal forces by section cuts (Govindjee §1.3)         */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "sm0-l4-internal-forces",
    unitId: "sm0",
    title: "Internal forces: the section cut",
    summary: "Cut a body with an imaginary plane and equilibrium of one piece tells you the force and moment carried inside.",
    textbook: "Govindjee §1.3",
    minutes: 13,
  },
  [
    reading(
      "cut",
      r`A rope in a tug-of-war does not move, but it is clearly carrying something. Every part of the rope pulls on the part next to it. That pull is an **internal force**, and it is what eventually snaps the rope.

To find it, use the idea from the last lesson: every piece of a body in equilibrium is itself in equilibrium.

1. **Cut** the body with an imaginary plane at the place you care about.
2. Throw one piece away and draw a free-body diagram of the other.
3. On the cut face, draw the forces the thrown-away piece was exerting.
4. Find them from equilibrium of the piece you kept.

For a straight bar loaded along its length, the cut face carries one force along the bar: the **internal axial force** $R$. The sign convention for the whole course:

$$R > 0 \ \text{means tension (the cut face is being pulled)}, \qquad R < 0 \ \text{means compression}.$$

Always draw the unknown $R$ pulling on the cut face. Then a negative answer tells you it is compression.`,
      { title: "Looking inside" },
    ),
    numeric("bar-tension", {
      question: r`A bar is fixed to a wall at its left end. A force of $8\ \mathrm{kN}$ pulls its right end to the right. What is the internal axial force $R$ at a cut halfway along?`,
      answer: 8, // check: right-hand piece: −R + 8 = 0 → R = +8 kN (tension)
      tolerance: 0.08,
      prefix: r`$R =$`,
      suffix: "kN",
      hint: r`Keep the piece to the right of the cut. Two forces act on it along the bar: the $8\ \mathrm{kN}$ pull and $R$ on the cut face. They must balance.`,
      explanation: r`On the right-hand piece, $R$ pulls on the cut face to the left and the applied force pulls to the right: $-R + 8 = 0$, so $R = +8\ \mathrm{kN}$. Positive means tension. The cut could be anywhere along the bar and the answer would be the same.`,
      tags: ["internal-force", "section-cut"],
    }),
    numeric("bar-compression", {
      question: r`Now the force at the right end is $5\ \mathrm{kN}$ and **pushes** the bar toward the wall. What is $R$, with its sign?`,
      answer: -5, // check: right-hand piece: −R − 5 = 0 → R = −5 kN (compression)
      tolerance: 0.05,
      prefix: r`$R =$`,
      suffix: "kN",
      hint: r`Draw $R$ pulling on the cut face as before, and let the balance equation give you its sign.`,
      explanation: r`On the right-hand piece, $R$ (drawn as a pull) points left and the applied push also points left: $-R - 5 = 0$, so $R = -5\ \mathrm{kN}$. The minus sign says the bar is in compression. You did not have to guess the direction in advance.`,
      tags: ["internal-force", "section-cut", "sign-convention"],
    }),
    reading(
      "diagram",
      r`With more than one load, the internal force depends on **where** you cut. Plotting $R$ against the position of the cut, $x$, gives the **internal force diagram**.

Worked example. A bar $2\ \mathrm{m}$ long is fixed at its left end. A $10\ \mathrm{kN}$ force pulls to the right at its middle ($x = 1\ \mathrm{m}$), and a $4\ \mathrm{kN}$ force pulls to the right at its free end.

- Cut anywhere between $x = 1$ and $x = 2$. The right-hand piece carries only the $4\ \mathrm{kN}$ force, so $R = 4\ \mathrm{kN}$.
- Cut anywhere between $x = 0$ and $x = 1$. Now the right-hand piece carries both forces, so $R = 10 + 4 = 14\ \mathrm{kN}$.

The diagram is flat between loads and **jumps at each load**, by the size of that load. Using the right-hand piece meant the wall's reaction never had to be found.

Change the two loads below and watch the diagram follow.`,
      {
        title: "The internal force diagram",
        visual: {
          kind: "axial-bar",
          config: {
            segments: [{ length: 2, E: 1, A: 1 }],
            loads: [
              { x: 1, P: 10 },
              { x: 2, P: 4 },
            ],
            fixed: "left",
            show: ["R"],
            sliders: true,
            units: { length: "m", force: "kN" },
          },
        },
      },
    ),
    numeric("two-load-outer", {
      body: r`A bar $3\ \mathrm{m}$ long is fixed at its left end ($x = 0$). A $6\ \mathrm{kN}$ force pulls to the **right** at $x = 1\ \mathrm{m}$. A $9\ \mathrm{kN}$ force pushes to the **left** at the free end, $x = 3\ \mathrm{m}$.`,
      question: r`What is $R$ at a cut at $x = 2\ \mathrm{m}$?`,
      answer: -9, // check: right piece (2..3 m) carries only the 9 kN push: −R − 9 = 0 → R = −9 kN
      tolerance: 0.09,
      prefix: r`$R =$`,
      suffix: "kN",
      hint: r`Keep the piece to the right of the cut. Which of the two applied forces act on that piece?`,
      explanation: r`The piece from $x = 2$ to $x = 3$ carries only the $9\ \mathrm{kN}$ push at the free end. Balance: $-R - 9 = 0$, so $R = -9\ \mathrm{kN}$, compression. The $6\ \mathrm{kN}$ force is on the other side of the cut and does not appear.`,
      tags: ["internal-force", "section-cut"],
    }),
    numeric("two-load-inner", {
      question: r`Same bar: what is $R$ at a cut at $x = 0.5\ \mathrm{m}$?`,
      answer: -3, // check: right piece carries +6 and −9: −R + 6 − 9 = 0 → R = −3 kN
      tolerance: 0.03,
      prefix: r`$R =$`,
      suffix: "kN",
      hint: "The piece to the right of this cut is longer. Both applied forces now act on it. Mind their directions.",
      explanation: r`The piece to the right of $x = 0.5$ carries the $6\ \mathrm{kN}$ pull to the right and the $9\ \mathrm{kN}$ push to the left: $-R + 6 - 9 = 0$, so $R = -3\ \mathrm{kN}$. The diagram jumps by $6\ \mathrm{kN}$ at $x = 1\ \mathrm{m}$, from $-3$ to $-9$.`,
      tags: ["internal-force", "section-cut"],
    }),
    mc("which-piece", {
      question: "After a cut, you may keep either piece. Which statement is right?",
      choices: [
        ["either", "Both pieces give the same internal force. Choose the one with fewer unknowns on it."],
        ["left", "Only the piece attached to the support gives the right answer.", "Each piece is a body in equilibrium in its own right. Why would one of them be special?"],
        ["differ", "The two pieces give different internal forces, and the true one is their average.", "The force one piece exerts on the other is equal and opposite to the force coming back. Same size."],
        ["right", "You must always keep the right-hand piece.", "It was convenient in the examples because it avoided the wall reaction. Is that a rule, or a choice?"],
      ],
      correct: "either",
      shuffle: true,
      hint: "The two pieces push or pull on each other across the cut. What does Newton's third law say about that pair?",
      explanation: "The force the left piece exerts on the right piece is equal and opposite to the force the right exerts on the left, so both pieces give the same $R$. The piece that includes a support also carries the unknown reaction, so the other piece is usually less work.",
      tags: ["internal-force", "section-cut"],
    }),
    reading(
      "beam-cut",
      r`A **beam** is loaded across its length instead of along it. Cut a beam and the face has to carry two more things:

- a **shear force** $V$, acting across the beam, and
- a **bending moment** $M$, turning the cut face.

Take a beam built into a wall, of length $L$, with a downward load $P$ at its free end. Cut it a distance $x$ from the wall and keep the right-hand piece, which has length $L - x$.

- Vertical balance: the cut face must push up on the piece with a force of size $P$. That is the shear force.
- Moment balance about the cut: the load $P$ acts at a distance $L - x$, so the cut face must supply a moment of size $P(L - x)$. That is the bending moment.

The shear force is the same at every cut. The bending moment is not: it grows as the cut moves toward the wall.

The diagrams below plot $V$ and $M$ along the beam. They use plus and minus signs that the beam unit will explain. For now, read their sizes.`,
      {
        title: "Cutting a beam",
        visual: { kind: "shear-moment", config: { length: 2, support: "cantilever-left", loads: [{ kind: "point", x: 2, P: 3 }], sliders: true, units: { length: "m", force: "kN" } } },
      },
    ),
    numeric("cantilever-m", {
      question: r`A beam built into a wall is $2\ \mathrm{m}$ long and carries $3\ \mathrm{kN}$ downward at its free end. What is the size of the bending moment at a cut $0.5\ \mathrm{m}$ from the wall?`,
      answer: 4.5, // check: |M| = P(L − x) = 3 × (2 − 0.5) = 4.5 kN·m
      tolerance: 0.05,
      suffix: r`$\mathrm{kN \cdot m}$`,
      answerDisplay: r`4.5\ \mathrm{kN \cdot m}`,
      hint: "Keep the piece between the cut and the free end. How long is it, and so how far is the load from the cut?",
      explanation: r`The piece beyond the cut is $2 - 0.5 = 1.5\ \mathrm{m}$ long, so the load acts $1.5\ \mathrm{m}$ from the cut: $|M| = 3 \times 1.5 = 4.5\ \mathrm{kN \cdot m}$. Using $0.5\ \mathrm{m}$, the distance from the wall, is the common slip.`,
      tags: ["internal-force", "bending-moment"],
    }),
    mc("where-max", {
      question: "Where along that beam is the bending moment largest?",
      choices: [
        ["wall", "At the wall"],
        ["tip", "At the free end, under the load", "At the free end the piece beyond the cut has no length. What moment can the load have about a cut it sits on?"],
        ["middle", "At the middle", r`The size of the moment is $P(L - x)$. Does that have a peak in the middle?`],
        ["same", "It is the same everywhere", "That is true of the shear force. The moment depends on the distance from the cut to the load."],
      ],
      correct: "wall",
      hint: r`The size of the moment is $P(L - x)$, where $x$ is the distance of the cut from the wall. For which $x$ is that largest?`,
      explanation: r`$|M| = P(L - x)$ is largest at $x = 0$, the wall, where it equals $PL$. This is why a branch or a diving board snaps where it joins the support, not out at the loaded end.`,
      tags: ["internal-force", "bending-moment"],
    }),
    numeric("simple-m", {
      body: r`Back to the beam from the last lesson: $6\ \mathrm{m}$ long, pin at $A$ on the left, roller at $B$ on the right, $12\ \mathrm{kN}$ downward load $2\ \mathrm{m}$ from $A$. You found the reactions: $A = 8\ \mathrm{kN}$ and $B = 4\ \mathrm{kN}$, both upward.`,
      question: "What is the size of the bending moment at the cut directly under the load?",
      answer: 16, // check: left piece (0..2 m): only A acts, at 2 m from the cut → 8 × 2 = 16 kN·m (right piece: 4 × 4 = 16 ✓)
      tolerance: 0.16,
      suffix: r`$\mathrm{kN \cdot m}$`,
      answerDisplay: r`16\ \mathrm{kN \cdot m}`,
      hint: r`Cut just to the left of the load and keep the left-hand piece. Only one force acts on it besides what is on the cut face.`,
      explanation: r`The left-hand piece is $2\ \mathrm{m}$ long and carries only the reaction $A = 8\ \mathrm{kN}$ at its far end: $|M| = 8 \times 2 = 16\ \mathrm{kN \cdot m}$. The right-hand piece agrees: $B \times 4 = 4 \times 4 = 16\ \mathrm{kN \cdot m}$. Here the reactions had to be found first, because both pieces include a support.`,
      tags: ["internal-force", "bending-moment"],
    }),
    reading(
      "summary",
      r`**The recipe you will use in every unit from here on**

1. Free-body diagram of the whole body. Find the reactions if you need them.
2. Cut where you want to know what is happening inside.
3. Free-body diagram of one piece, with the unknown internal forces drawn on the cut face.
4. Equilibrium of that piece gives the internal forces.
5. Repeat for other cuts, or keep $x$ as a variable, to get the internal force diagram.

Internal axial force $R$: positive in tension. Beams also carry a shear force $V$ and a bending moment $M$.

Next: one last tool, used later for energy methods and for stability.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 5 · Work, energy and power (Govindjee §1.1.3)                */
/* ------------------------------------------------------------------ */

const l5 = lesson(
  {
    id: "sm0-l5-work-and-energy",
    unitId: "sm0",
    title: "Work, energy and power",
    summary: "Work is force times distance moved along the force. Springs and gravity store it as potential energy.",
    textbook: "Govindjee §1.1.3",
    minutes: 9,
  },
  [
    reading(
      "work",
      r`Push a stalled car along a flat road and you get tired. You have done **work** on the car:

$$W = F \times (\text{distance moved in the direction of the force}).$$

The unit is the **joule**: $1\ \mathrm{J} = 1\ \mathrm{N \cdot m}$. Only motion *along* the force counts. A force at right angles to the motion does no work at all.

**Power** is how fast work is done: force times speed.

$$P = F \times v, \qquad 1\ \mathrm{W} = 1\ \mathrm{J/s}.$$

A kilowatt is $1000\ \mathrm{W}$. One horsepower is about $746\ \mathrm{W}$.`,
      { title: "Work and power" },
    ),
    numeric("work-done", {
      question: r`You push a crate with a steady $200\ \mathrm{N}$ and it slides $3\ \mathrm{m}$ in the direction you push. How much work have you done?`,
      answer: 600, // check: 200 N × 3 m = 600 J
      tolerance: 6,
      suffix: "J",
      hint: "Force times the distance moved along the force.",
      explanation: r`$W = 200\ \mathrm{N} \times 3\ \mathrm{m} = 600\ \mathrm{J}$.`,
      tags: ["work"],
    }),
    numeric("work-perpendicular", {
      question: r`You carry a box weighing $100\ \mathrm{N}$ across a level floor for $5\ \mathrm{m}$, keeping it at the same height. How much work does **gravity** do on the box?`,
      answer: 0, // check: weight is vertical, motion horizontal → zero work
      tolerance: 0.001,
      suffix: "J",
      hint: "Which way does gravity pull, and which way does the box move? Only motion along the force counts.",
      explanation: "Gravity pulls straight down and the box moves sideways. There is no motion along the force, so gravity does zero work. (Your arms get tired for biological reasons, not mechanical ones.)",
      tags: ["work"],
    }),
    numeric("power", {
      question: r`A hoist lifts a $500\ \mathrm{N}$ load straight up at a steady $0.4\ \mathrm{m/s}$. What power is it delivering to the load?`,
      answer: 200, // check: P = F v = 500 × 0.4 = 200 W
      tolerance: 2,
      suffix: "W",
      hint: "Power is force times speed, when the motion is along the force.",
      explanation: r`$P = Fv = 500\ \mathrm{N} \times 0.4\ \mathrm{m/s} = 200\ \mathrm{W}$. Later, the same idea in rotating form (power equals torque times angular speed) sizes drive shafts.`,
      tags: ["power"],
    }),
    reading(
      "potential",
      r`Some forces give back the work done against them. Lift a weight and gravity will return the work when you lower it. Stretch a spring and it returns the work when released. Such forces are called **conservative**, and the stored work is **potential energy**.

- **Gravity:** raising a weight $W$ through a height $h$ stores $Wh$.
- **A linear spring** of stiffness $k$ (force per unit stretch, N/m): stretching it by $\Delta$ needs a force that grows steadily from $0$ to $F = k\Delta$. The work is the area under that straight line:

$$\text{stored energy} = \tfrac12 F \Delta = \tfrac12 k \Delta^2.$$

The factor of one half is there because the force was not at its full value the whole way. It built up from zero.

Elastic solids behave like very stiff springs. Loading one stores this same kind of energy inside it, which later units use to find deflections.`,
      { title: "Potential energy" },
    ),
    numeric("gravity-pe", {
      question: r`You lift a $50\ \mathrm{N}$ weight $2\ \mathrm{m}$ straight up. By how much does its potential energy rise?`,
      answer: 100, // check: W h = 50 × 2 = 100 J
      tolerance: 1,
      suffix: "J",
      hint: "Weight times the height gained.",
      explanation: r`$Wh = 50\ \mathrm{N} \times 2\ \mathrm{m} = 100\ \mathrm{J}$. That is exactly the work you did against gravity.`,
      tags: ["energy"],
    }),
    numeric("spring", {
      question: r`A spring of stiffness $k = 400\ \mathrm{N/m}$ is stretched by $0.1\ \mathrm{m}$. How much energy does it store?`,
      answer: 2, // check: ½ k Δ² = 0.5 × 400 × 0.1² = 2 J
      tolerance: 0.02,
      suffix: "J",
      hint: r`Use the spring energy formula. Square the stretch before multiplying, and do not forget the one half.`,
      explanation: r`$\tfrac12 k\Delta^2 = \tfrac12 \times 400 \times 0.1^2 = 2\ \mathrm{J}$. The final force is $k\Delta = 40\ \mathrm{N}$, and $\tfrac12 \times 40 \times 0.1 = 2\ \mathrm{J}$ as well.`,
      tags: ["energy", "spring"],
    }),
    mc("half", {
      question: r`A spring is stretched slowly until the force reaches $F$ and the stretch reaches $\Delta$. Why is the work done $\tfrac12 F\Delta$ and not $F\Delta$?`,
      choices: [
        ["average", r`The force grew steadily from $0$ to $F$, so on average it was $F/2$.`],
        ["loss", "Half of the work is always lost as heat.", "An ideal spring loses nothing. All the work done is stored. Think about how big the force was at the start of the stretch."],
        ["two-ends", "The spring has two ends, and each end gets half.", "The work is done where the force moves. Think about the size of the force during the stretch."],
        ["convention", "It is only a convention. Either is acceptable.", "Work is a measurable quantity. Sketch force against stretch and look at the area under the line."],
      ],
      correct: "average",
      shuffle: true,
      hint: "Sketch the force against the stretch. Work is the area under that line. What shape is the area?",
      explanation: r`Force against stretch is a straight line from $(0, 0)$ to $(\Delta, F)$. The work is the area under it, a triangle: $\tfrac12 F\Delta$. $F\Delta$ would be right only if the full force $F$ acted from the very start, as it does for a weight you lift.`,
      tags: ["energy", "spring"],
    }),
    tf("bowl", {
      statement: "A marble resting at the bottom of a bowl sits at a minimum of its potential energy.",
      answer: true,
      feedback: "Nudge the marble a little in any direction. Does it go up or down, and what does that do to its potential energy?",
      hint: "Gravitational potential energy rises with height. Compare the bottom of the bowl with any nearby spot.",
      explanation: "True. Anywhere else in the bowl is higher, so the potential energy is larger there. Push the marble aside and it rolls back. An equilibrium at a minimum of potential energy is stable. Balance the marble on top of an upturned bowl, a maximum, and the slightest nudge sends it away. The last unit of the course turns this picture into a test for buckling.",
      tags: ["energy", "stability"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Work: $W = F \times$ distance along the force, in joules.
- Power: $P = Fv$, in watts.
- Potential energy of a raised weight: $Wh$. Of a stretched linear spring: $\tfrac12 k\Delta^2 = \tfrac12 F\Delta$.
- A resting position at a minimum of potential energy is stable.

That completes the toolkit: forces, moments, equilibrium, free-body diagrams, section cuts and energy. The next unit puts them to work on the simplest deformable body there is, a bar pulled along its length.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Level check                                                         */
/* ------------------------------------------------------------------ */

const practice: QuestionStep[] = [
  numeric("p-weight", {
    question: r`A steel beam has a mass of $150\ \mathrm{kg}$. What is its weight in kN? Use $g = 9.81\ \mathrm{m/s^2}$.`,
    answer: 1.4715, // check: 150 × 9.81 = 1471.5 N = 1.4715 kN
    tolerance: 0.015,
    suffix: "kN",
    hint: "Weight is mass times g. Then convert newtons to kilonewtons.",
    explanation: r`$W = 150 \times 9.81 = 1471.5\ \mathrm{N} \approx 1.47\ \mathrm{kN}$.`,
    tags: ["units", "force"],
  }),
  numeric("p-mpa", {
    question: r`A force of $18\ \mathrm{kN}$ is spread evenly over $120\ \mathrm{mm^2}$. What is the force per area, in MPa?`,
    answer: 150, // check: 18 000 N / 120 mm² = 150 MPa
    tolerance: 1.5,
    suffix: "MPa",
    hint: "Convert the force to newtons first. Newtons over square millimetres gives MPa.",
    explanation: r`$18\,000\ \mathrm{N} / 120\ \mathrm{mm^2} = 150\ \mathrm{N/mm^2} = 150\ \mathrm{MPa}$.`,
    tags: ["units"],
  }),
  numeric("p-moment", {
    body: r`A horizontal bar is pivoted at $O$. A $60\ \mathrm{N}$ force pushes **up** on it $1.5\ \mathrm{m}$ to the right of $O$, and a $20\ \mathrm{N}$ force pushes **down** on it $3\ \mathrm{m}$ to the right of $O$.`,
    question: "What is the total moment about $O$, with counter-clockwise positive?",
    answer: 30, // check: +60×1.5 = +90 (ccw); −20×3 = −60 (cw); sum +30 N·m
    tolerance: 0.3,
    suffix: r`$\mathrm{N \cdot m}$`,
    answerDisplay: r`30\ \mathrm{N \cdot m}`,
    hint: "Work out each moment and its turning direction separately, then add with signs.",
    explanation: r`An upward force to the right of $O$ turns the bar counter-clockwise: $+60 \times 1.5 = +90$. A downward force to the right turns it clockwise: $-20 \times 3 = -60$. Total $+30\ \mathrm{N \cdot m}$.`,
    tags: ["moment", "sign-convention"],
  }),
  numeric("p-udl", {
    question: r`A uniform load of $5\ \mathrm{kN/m}$ acts on a beam from $x = 2\ \mathrm{m}$ to $x = 6\ \mathrm{m}$. What is the size of its moment about $x = 0$?`,
    answer: 80, // check: resultant 5×4 = 20 kN at x = 4 m → 20 × 4 = 80 kN·m
    tolerance: 0.8,
    suffix: r`$\mathrm{kN \cdot m}$`,
    answerDisplay: r`80\ \mathrm{kN \cdot m}`,
    hint: "Replace the load by one force at the middle of the loaded length. Where is that middle, measured from x = 0?",
    explanation: r`The load is equivalent to $5 \times 4 = 20\ \mathrm{kN}$ at the middle of the loaded length, $x = 4\ \mathrm{m}$. Moment about $x = 0$: $20 \times 4 = 80\ \mathrm{kN \cdot m}$.`,
    tags: ["resultant", "distributed-load"],
  }),
  numeric("p-reaction", {
    body: r`A beam $10\ \mathrm{m}$ long sits on a pin at $A$ ($x = 0$) and a roller at $B$ ($x = 10\ \mathrm{m}$). Downward loads of $20\ \mathrm{kN}$ at $x = 3\ \mathrm{m}$ and $10\ \mathrm{kN}$ at $x = 8\ \mathrm{m}$ act on it.`,
    question: r`What is the reaction at $A$?`,
    answer: 16, // check: ΣM_A: B×10 = 20×3 + 10×8 = 140 → B = 14; A = 30 − 14 = 16 kN
    tolerance: 0.16,
    prefix: r`$A =$`,
    suffix: "kN",
    hint: r`Take moments about $B$ to get $A$ in one step, or about $A$ to get $B$ and then use the vertical balance.`,
    explanation: r`Moments about $A$: $B \times 10 = 20 \times 3 + 10 \times 8 = 140$, so $B = 14\ \mathrm{kN}$. Vertical balance: $A = 20 + 10 - 14 = 16\ \mathrm{kN}$.`,
    tags: ["equilibrium", "reactions"],
  }),
  numeric("p-internal", {
    body: r`A bar is fixed at its left end ($x = 0$) and is $4\ \mathrm{m}$ long. Forces act along it: $12\ \mathrm{kN}$ to the right at $x = 1\ \mathrm{m}$, $5\ \mathrm{kN}$ to the left at $x = 3\ \mathrm{m}$, and $3\ \mathrm{kN}$ to the right at the free end.`,
    question: r`What is the internal axial force $R$ at $x = 2\ \mathrm{m}$?`,
    answer: -2, // check: right piece (2..4): −5 + 3 = −2 → R = −2 kN
    tolerance: 0.02,
    prefix: r`$R =$`,
    suffix: "kN",
    hint: "Keep the piece to the right of the cut and add up, with signs, only the forces that act on it.",
    explanation: r`To the right of $x = 2$ there are the $5\ \mathrm{kN}$ force to the left and the $3\ \mathrm{kN}$ force to the right: $-R - 5 + 3 = 0$, so $R = -2\ \mathrm{kN}$, compression.`,
    tags: ["internal-force", "section-cut"],
  }),
  numeric("p-cantilever", {
    question: r`A beam built into a wall is $4\ \mathrm{m}$ long. It carries a downward load of $2\ \mathrm{kN}$ at its free end. What is the size of the bending moment at a cut $1\ \mathrm{m}$ from the wall?`,
    answer: 6, // check: 2 × (4 − 1) = 6 kN·m
    tolerance: 0.06,
    suffix: r`$\mathrm{kN \cdot m}$`,
    answerDisplay: r`6\ \mathrm{kN \cdot m}`,
    hint: "Keep the piece beyond the cut. How far is the load from the cut?",
    explanation: r`The load is $4 - 1 = 3\ \mathrm{m}$ from the cut: $|M| = 2 \times 3 = 6\ \mathrm{kN \cdot m}$.`,
    tags: ["internal-force", "bending-moment"],
  }),
  numeric("p-spring", {
    question: r`A spring stores $9\ \mathrm{J}$ when stretched by $0.15\ \mathrm{m}$. What is its stiffness $k$, in N/m?`,
    answer: 800, // check: k = 2E/Δ² = 18 / 0.0225 = 800 N/m
    tolerance: 8,
    prefix: r`$k =$`,
    suffix: "N/m",
    hint: r`Start from the spring energy $\tfrac12 k\Delta^2$ and solve for $k$.`,
    explanation: r`$\tfrac12 k\Delta^2 = 9$ gives $k = 2 \times 9 / 0.15^2 = 18/0.0225 = 800\ \mathrm{N/m}$.`,
    tags: ["energy", "spring"],
  }),
  multi("p-supports", {
    question: "Which statements about supports in a flat (two-dimensional) problem are true?",
    choices: [
      ["roller", "A roller supplies one unknown reaction force."],
      ["pin", "A pin supplies two unknown force components and no moment."],
      ["fixed", "A built-in support supplies two force components and a moment."],
      ["pin-moment", "A pin supplies a moment, because it stops the body rotating."],
      ["roller-two", "A roller stops motion in every direction."],
    ],
    correct: ["roller", "pin", "fixed"],
    hint: "For each support, list which motions it prevents: sideways, up and down, rotation. One unknown reaction per motion prevented.",
    explanation: "A roller prevents motion in one direction (1 unknown). A pin prevents motion in two directions but allows rotation (2 unknowns, no moment). A built-in support prevents both motions and rotation (3 unknowns).",
    tags: ["supports", "free-body-diagram"],
  }),
  tf("p-couple", {
    statement: "A couple has the same moment about every point, and its resultant force is zero.",
    answer: true,
    feedback: "Add the two forces of a couple as vectors. Then compute the moment about two different points and compare.",
    hint: "A couple is two equal and opposite forces on parallel lines. What do they add up to?",
    explanation: "True. The two forces cancel as a force, and their combined moment is the force times the distance between their lines of action, whichever point you choose.",
    tags: ["couple"],
  }),
  mc("p-max-moment", {
    question: "A fishing rod is held at one end and a fish pulls down on the other. Where in the rod is the bending moment largest?",
    choices: [
      ["hand", "At the hand"],
      ["tip", "At the tip", "At the tip, the piece of rod beyond a cut has no length. How big can the moment be there?"],
      ["mid", "At the middle", "The moment is the pull times the distance from the cut to the tip. Does that peak in the middle?"],
      ["uniform", "It is the same all along", "The shear force is the same all along. The moment is the force times a distance that changes."],
    ],
    correct: "hand",
    hint: "The rod is like a beam built in at the hand with a load at the tip. The moment at a cut is the load times its distance from the cut.",
    explanation: "The moment at a cut equals the pull times the distance from the cut to the tip, which is largest at the hand. Rods are thickest there for this reason.",
    tags: ["internal-force", "bending-moment"],
  }),
];

export const sm0: Unit = {
  id: "sm0",
  title: "Foundations",
  subtitle: "Forces, moments, equilibrium and the cut that shows what a body carries inside",
  description: "Start here if statics is new to you. What forces and moments are, how loads are summarised, what equilibrium demands, how to draw a free-body diagram, and how a section cut exposes internal forces.",
  textbook: "Govindjee ch. 1",
  lessons: [l1, l2, l3, l4, l5],
  practice,
  generators: ["gen.sm.moment-about-point", "gen.sm.udl-moment", "gen.sm.beam-reaction", "gen.sm.axial-cut", "gen.sm.stress-units"],
};
