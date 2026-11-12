import type { QuestionStep, Unit, VisualSpec } from "../types";
import { lesson, mc, multi, numeric, order, r, reading, tf } from "../dsl";

/*
 * Unit sm8 · Beam deflections, bending about two axes, and shear (Govindjee §8.4–8.6, Lectures 31–33).
 *
 * Conventions are the book's, the same as unit sm7:
 *   - x along the beam, y UP, z out of the page; v(x) is the deflection, positive up.
 *   - q(x) = load per length, positive UP; a downward load w is q = −w.
 *   - M = EI v'', V = −EI v''', EI v'''' = q. Positive M is sagging.
 *   - Two-axis bending: σxx = P/A − Mz y/Iz + My z/Iy.
 *   - Shear: τ = VQ/(Ib), shear flow q = VQ/I.
 * Units are N, mm and MPa unless a problem says otherwise. Every numeric answer carries a "check" comment.
 */

const MM = { length: "mm", force: "N", deflection: "mm" };

const cantileverDemo: VisualSpec = { kind: "beam-deflection", config: { length: 2000, support: "cantilever", load: { kind: "point", x: 2000, P: 1200 }, EI: 1.6e12, sliders: true, units: MM } };
const simpleDemo: VisualSpec = { kind: "beam-deflection", config: { length: 4000, support: "simple", load: { kind: "udl", w: 6 }, EI: 2e13, sliders: true, units: MM } };

/* ------------------------------------------------------------------ */
/* Lesson 1 · The beam equation (Govindjee §8.4)                       */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "sm8-l1-beam-equation",
    unitId: "sm8",
    title: "From bending moment to deflection",
    summary: "Curvature is the second derivative of the deflection, so M = EI v''. Integrate twice and use the supports to find how far a beam moves.",
    textbook: "Govindjee §8.4",
    minutes: 14,
  },
  [
    reading(
      "why",
      r`A diving board that never breaks can still be useless if it droops a metre under the diver. Floors, bridges and machine parts are very often sized by **how much they deflect**, not by whether they break. This lesson finds the deflected shape of a beam.

You already have every ingredient from the last unit.

- The deflection is $v(x)$: how far the point at $x$ moves, **positive upward**.
- Its first derivative is the **slope** of the beam, $\theta = v'$: how much the beam is tilted there.
- Its second derivative is the **curvature**, $\kappa = v''$: how sharply it bends.
- Curvature is tied to the bending moment by $M = EI\,\kappa$.

Put the last two together:

$$M(x) = EI\,\frac{\mathrm{d}^2 v}{\mathrm{d}x^2}.$$

$EI$ is the **bending stiffness**: the material's stiffness $E$ times the section's second moment of area $I$. If you know the bending moment along the beam, you can integrate twice to get the deflection.`,
      { title: "Why deflection matters" },
    ),
    mc("what-is-slope", {
      question: r`In beam theory, what does the first derivative $\mathrm{d}v/\mathrm{d}x$ tell you?`,
      choices: [
        ["slope", "The slope of the beam: how much it is tilted at that point"],
        ["curvature", "The curvature of the beam", "Curvature measures how fast the tilt changes. Which derivative of the deflection is that?"],
        ["moment", "The bending moment", r`The bending moment is tied to the curvature through $M = EI\kappa$, and curvature is not the first derivative.`],
        ["deflection", "The deflection itself", r`The deflection is $v$. What do you get when you differentiate a curve once?`],
      ],
      correct: "slope",
      shuffle: true,
      hint: r`Think of the graph of $v$ against $x$. What does the first derivative of any graph measure?`,
      explanation: r`$\mathrm{d}v/\mathrm{d}x$ is the slope of the deflected beam, written $\theta$. For the small rotations of beam theory it equals the angle (in radians) the cross-section has turned. Differentiate once more and you get the curvature.`,
      tags: ["deflection", "kinematics"],
    }),
    reading(
      "boundary",
      r`Each integration adds an unknown constant. The supports fix them. A support tells you what the beam **cannot do** there:

- **Built-in end** (clamped into a wall): it cannot move and it cannot tilt.
$$v = 0, \qquad v' = 0.$$
- **Pin or roller**: it cannot move, but it is free to tilt, so it carries no bending moment.
$$v = 0, \qquad M = EI\,v'' = 0.$$
- **Free end** with nothing attached: no bending moment and no shear force.
$$EI\,v'' = 0, \qquad EI\,v''' = 0.$$

These are called **boundary conditions**. Conditions on $v$ and $v'$ describe the motion. Conditions on $v''$ and $v'''$ describe the forces, because $M = EI\,v''$ and $V = -EI\,v'''$.`,
      { title: "What the supports tell you" },
    ),
    mc("bc-built-in", {
      question: "Which pair of conditions holds at a built-in end?",
      choices: [
        ["v-vp", r`$v = 0$ and $v' = 0$`],
        ["v-vpp", r`$v = 0$ and $v'' = 0$`, r`$v'' = 0$ says there is no bending moment. A wall is exactly what does supply a bending moment.`],
        ["vpp-vppp", r`$v'' = 0$ and $v''' = 0$`, "Those say no moment and no shear force, which describes an end with nothing holding it."],
        ["vp-vppp", r`$v' = 0$ and $v''' = 0$`, "The wall also stops the end from moving up or down. Which condition says that?"],
      ],
      correct: "v-vp",
      shuffle: true,
      hint: "A wall stops two things: the end moving, and the end tilting. Translate each into a statement about v or its derivative.",
      explanation: r`A built-in end cannot move ($v = 0$) and cannot tilt ($v' = 0$). It is free to carry whatever moment and shear force are needed, so nothing is known about $v''$ or $v'''$ there.`,
      tags: ["boundary-conditions"],
    }),
    mc("bc-pin", {
      question: "Which pair of conditions holds at a pin support with no moment applied there?",
      choices: [
        ["v-vpp", r`$v = 0$ and $v'' = 0$`],
        ["v-vp", r`$v = 0$ and $v' = 0$`, "A pin lets the beam tilt freely. Which of these two conditions would forbid tilting?"],
        ["vp-vpp", r`$v' = 0$ and $v'' = 0$`, "The pin stops the beam moving up or down there. Which condition says that?"],
        ["vpp-vppp", r`$v'' = 0$ and $v''' = 0$`, "A pin does push on the beam, so the shear force there is not zero in general."],
      ],
      correct: "v-vpp",
      shuffle: true,
      hint: r`A pin stops the beam moving but cannot resist rotation, so it cannot supply a bending moment. Use $M = EI\,v''$.`,
      explanation: r`The pin holds the beam in place, $v = 0$. It cannot resist turning, so the bending moment there is zero: $M = EI\,v'' = 0$, which means $v'' = 0$. The slope $v'$ is whatever it turns out to be.`,
      tags: ["boundary-conditions"],
    }),
    reading(
      "worked-cantilever",
      r`**Worked example.** A beam of length $L$ is built in at $x = 0$ and carries a downward load $P$ at its free end.

**Step 1: the bending moment.** From the last unit, $M(x) = P(x - L)$. It is negative everywhere (the beam hogs, its top is stretched) and largest in size at the wall.

**Step 2: integrate twice.**

$$EI\,v'' = P(x - L)$$
$$EI\,v' = P\Big(\frac{x^2}{2} - Lx\Big) + C_1$$
$$EI\,v = P\Big(\frac{x^3}{6} - \frac{Lx^2}{2}\Big) + C_1 x + C_2$$

**Step 3: use the wall.** $v'(0) = 0$ gives $C_1 = 0$. $v(0) = 0$ gives $C_2 = 0$.

**Result.**

$$v(x) = \frac{P x^2}{6EI}\,(x - 3L), \qquad v(L) = -\frac{PL^3}{3EI}, \qquad v'(L) = -\frac{PL^2}{2EI}.$$

The minus signs say the tip moves **down** and tilts downward, as it should. Drag the load below and watch the shape.`,
      { title: "Worked example: a cantilever", visual: cantileverDemo },
    ),
    numeric("tip-deflection", {
      body: r`A steel cantilever is $2\ \mathrm{m}$ long, with $E = 200\ \mathrm{GPa}$ and $I = 8 \times 10^{6}\ \mathrm{mm^4}$, so $EI = 1.6 \times 10^{12}\ \mathrm{N \cdot mm^2}$. A load of $1.2\ \mathrm{kN}$ pushes down on its free end.`,
      question: "How far does the free end move down?",
      answer: 2, // check: PL³/(3EI) = 1200 × 2000³ / (3 × 1.6e12) = 9.6e12 / 4.8e12 = 2.0 mm
      tolerance: 0.02,
      suffix: "mm",
      hint: r`Use the tip deflection from the worked example. Put everything in N and mm first: the load in newtons, the length in millimetres.`,
      explanation: r`$\delta = \dfrac{PL^3}{3EI} = \dfrac{1200 \times 2000^3}{3 \times 1.6 \times 10^{12}} = \dfrac{9.6 \times 10^{12}}{4.8 \times 10^{12}} = 2.0\ \mathrm{mm}$. Two millimetres on a two-metre beam: real deflections are small, which is why the small-slope theory works.`,
      tags: ["deflection", "cantilever"],
    }),
    numeric("tip-slope", {
      question: r`Same cantilever, same load. By what angle has the free end tilted? Give the size of the slope in milliradians ($1\ \mathrm{mrad} = 10^{-3}\ \mathrm{rad}$).`,
      answer: 1.5, // check: PL²/(2EI) = 1200 × 2000² / (2 × 1.6e12) = 4.8e9 / 3.2e12 = 1.5e-3 rad
      tolerance: 0.015,
      suffix: "mrad",
      hint: r`The worked example gives the slope at the tip as well as the deflection. The slope is a pure number, in radians.`,
      explanation: r`$|v'(L)| = \dfrac{PL^2}{2EI} = \dfrac{1200 \times 2000^2}{2 \times 1.6 \times 10^{12}} = 1.5 \times 10^{-3}\ \mathrm{rad} = 1.5\ \mathrm{mrad}$, less than a tenth of a degree.`,
      tags: ["deflection", "cantilever", "slope"],
    }),
    mc("scaling-length", {
      question: "The cantilever is replaced by one twice as long, with the same cross-section and the same tip load. How does the tip deflection change?",
      choices: [
        ["eight", "It becomes 8 times larger"],
        ["two", "It doubles", r`The deflection formula does not contain $L$ to the first power. Look at the exponent.`],
        ["four", "It becomes 4 times larger", r`That would be right if the deflection went as $L^2$. Check the exponent on $L$ in the tip deflection.`],
        ["sixteen", "It becomes 16 times larger", r`That would need $L^4$. A uniform load gives that. What does a tip load give?`],
      ],
      correct: "eight",
      hint: r`Look at how $L$ enters $PL^3/(3EI)$.`,
      explanation: r`The tip deflection goes as $L^3$, so doubling the length multiplies it by $2^3 = 8$. Length is by far the most powerful variable in deflection, which is why long spans need deep beams.`,
      tags: ["deflection", "scaling"],
    }),
    mc("scaling-stiffness", {
      question: "You need to halve the tip deflection without changing the load or the length. Which change does it?",
      choices: [
        ["double-ei", r`Double the bending stiffness $EI$`],
        ["half-ei", r`Halve the bending stiffness $EI$`, r`$EI$ is in the denominator. What does halving it do to the deflection?`],
        ["stronger", "Use a stronger steel with the same Young's modulus", "Strength decides when the material yields. Which property appears in the deflection formula?"],
        ["double-e-half-i", r`Double $E$ and halve $I$`, r`Only the product $EI$ matters. What happens to the product?`],
      ],
      correct: "double-ei",
      shuffle: true,
      hint: r`Find where $E$ and $I$ sit in $PL^3/(3EI)$.`,
      explanation: r`Deflection is inversely proportional to $EI$, so doubling $EI$ halves it. A stronger steel with the same $E$ changes nothing: deflection depends on stiffness, not strength. In practice you raise $I$ by making the section deeper.`,
      tags: ["deflection", "scaling"],
    }),
    reading(
      "fourth-order",
      r`Sometimes you are handed the **load** on the beam, not the bending moment. Two equilibrium equations from the last unit link them:

$$\frac{\mathrm{d}V}{\mathrm{d}x} + q = 0, \qquad \frac{\mathrm{d}M}{\mathrm{d}x} + V = 0.$$

Here $q(x)$ is the load per length, **positive upward**, so a downward load of size $w$ is $q = -w$. Substitute $M = EI\,v''$ and, for constant $EI$, everything collapses into one equation:

$$EI\,\frac{\mathrm{d}^4 v}{\mathrm{d}x^4} = q(x), \qquad\text{with}\qquad M = EI\,v'', \quad V = -EI\,v'''.$$

This is the **beam equation**. Integrate it four times. That makes four constants, fixed by four boundary conditions: **two at each end**.

It works the same way whether or not statics alone can find the reactions, which is its big advantage.`,
      { title: "Starting from the load instead" },
    ),
    tf("four-conditions", {
      statement: r`Solving $EI\,v'''' = q$ for a single-span beam needs four boundary conditions, two from each end.`,
      answer: true,
      feedback: "Count the integrations needed to get from the fourth derivative down to the deflection itself.",
      hint: "Each integration brings in one unknown constant. How many integrations take you from the fourth derivative to v?",
      explanation: "True. Four integrations give four constants. Every kind of end (built-in, pinned, free) supplies exactly two conditions, so the two ends of a beam supply the four that are needed.",
      tags: ["boundary-conditions", "beam-equation"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Relate the deflected shape to the bending moment: $M = EI\,v''$, with slope $v'$ and deflection $v$ (positive up).
- Translate supports into boundary conditions: built-in $v = v' = 0$; pin $v = 0$, $v'' = 0$; free end $v'' = 0$, $v''' = 0$.
- Integrate $EI\,v'' = M(x)$ twice, or $EI\,v'''' = q(x)$ four times.
- Cantilever with a tip load: $\delta = PL^3/(3EI)$, tip slope $PL^2/(2EI)$.

Next: the same method on other beams, and the handful of results worth knowing by heart.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Solving deflection problems (Govindjee §8.4)             */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "sm8-l2-deflection-problems",
    unitId: "sm8",
    title: "Solving deflection problems",
    summary: "The four-integration recipe on a simply supported beam, the standard deflection results, and sizing a beam for stiffness.",
    textbook: "Govindjee §8.4",
    minutes: 15,
  },
  [
    reading(
      "worked-simple",
      r`**Worked example.** A beam of length $L$ sits on a pin at $x = 0$ and a roller at $x = L$. It carries a uniform downward load $w$ per length, so $q = -w$.

**Integrate the beam equation twice:**

$$EI\,v'''' = -w, \qquad EI\,v''' = -wx + C_1, \qquad EI\,v'' = -\frac{wx^2}{2} + C_1 x + C_2.$$

**Use the moment conditions.** Both ends are pins, so $v'' = 0$ at $x = 0$ and at $x = L$. That gives $C_2 = 0$ and $C_1 = wL/2$, so

$$EI\,v'' = \frac{w}{2}\,x\,(L - x).$$

**Integrate twice more:**

$$EI\,v = -\frac{wx^4}{24} + \frac{wLx^3}{12} + C_3 x + C_4.$$

**Use the deflection conditions.** $v(0) = 0$ gives $C_4 = 0$. $v(L) = 0$ gives $C_3 = -wL^3/24$.

**Result:**

$$v(x) = -\frac{w\,x}{24EI}\big(L^3 - 2Lx^2 + x^3\big), \qquad v\Big(\frac{L}{2}\Big) = -\frac{5\,wL^4}{384\,EI}.$$

The largest deflection is at mid-span, downward.`,
      { title: "Worked example: a simply supported beam", visual: simpleDemo },
    ),
    mc("free-check", {
      question: r`Halfway through that solution we found $EI\,v'' = \tfrac{w}{2}\,x\,(L - x)$. What is this quantity, physically?`,
      choices: [
        ["moment", r`The bending moment $M(x)$ in the beam`],
        ["shear", r`The shear force $V(x)$`, r`The shear force is $-EI\,v'''$, one more derivative.`],
        ["slope", "The slope of the beam", r`The slope is $v'$, with no $EI$ and one fewer derivative.`],
        ["load", "The load on the beam", r`The load is $EI\,v''''$, two more derivatives.`],
      ],
      correct: "moment",
      shuffle: true,
      hint: r`Recall the relation between curvature and bending moment.`,
      explanation: r`$EI\,v'' = M$. So after two integrations you have the bending moment, here $M = \tfrac{w}{2}x(L - x)$: positive (sagging), zero at both pins and largest at mid-span, exactly what statics gives. Stopping to compare with statics at this point is a free check on your constants.`,
      tags: ["beam-equation", "bending-moment"],
    }),
    numeric("simple-udl", {
      body: r`A simply supported beam is $4\ \mathrm{m}$ long with $EI = 2 \times 10^{13}\ \mathrm{N \cdot mm^2}$. It carries a uniform load of $6\ \mathrm{kN/m}$, which is $6\ \mathrm{N/mm}$.`,
      question: "What is the deflection at mid-span? Give its size.",
      answer: 1, // check: 5wL⁴/(384EI) = 5 × 6 × 4000⁴ / (384 × 2e13) = 7.68e15 / 7.68e15 = 1.00 mm
      tolerance: 0.01,
      suffix: "mm",
      hint: r`Use the mid-span result from the worked example, with the load in N/mm and the length in mm.`,
      explanation: r`$\delta = \dfrac{5wL^4}{384EI} = \dfrac{5 \times 6 \times 4000^4}{384 \times 2 \times 10^{13}} = \dfrac{7.68 \times 10^{15}}{7.68 \times 10^{15}} = 1.0\ \mathrm{mm}$.`,
      tags: ["deflection", "simply-supported"],
    }),
    reading(
      "table",
      r`The same recipe produces a short list of results that engineers carry in their heads. All are **sizes** of the largest deflection.

$$\begin{array}{ll}
\text{Cantilever, load } P \text{ at the tip:} & \delta = \dfrac{PL^3}{3EI} \\[10pt]
\text{Cantilever, uniform load } w: & \delta = \dfrac{wL^4}{8EI} \\[10pt]
\text{Simply supported, load } P \text{ at mid-span:} & \delta = \dfrac{PL^3}{48EI} \\[10pt]
\text{Simply supported, uniform load } w: & \delta = \dfrac{5wL^4}{384EI}
\end{array}$$

Notice the pattern. Every one is a load times a power of the length, divided by a number times $EI$. A point load brings $L^3$. A uniform load brings $L^4$, because the total load $wL$ itself grows with the length.`,
      { title: "Results worth knowing" },
    ),
    numeric("simple-point", {
      question: r`A simply supported beam is $3\ \mathrm{m}$ long with $EI = 9 \times 10^{12}\ \mathrm{N \cdot mm^2}$. A load of $24\ \mathrm{kN}$ acts at mid-span. What is the size of the mid-span deflection?`,
      answer: 1.5, // check: PL³/(48EI) = 24000 × 3000³ / (48 × 9e12) = 6.48e14 / 4.32e14 = 1.5 mm
      tolerance: 0.015,
      suffix: "mm",
      hint: "Pick the row of the table that matches the supports and the load, and work in N and mm.",
      explanation: r`$\delta = \dfrac{PL^3}{48EI} = \dfrac{24\,000 \times 3000^3}{48 \times 9 \times 10^{12}} = \dfrac{6.48 \times 10^{14}}{4.32 \times 10^{14}} = 1.5\ \mathrm{mm}$.`,
      tags: ["deflection", "simply-supported"],
    }),
    numeric("cantilever-udl", {
      question: r`A cantilever is $2\ \mathrm{m}$ long with $EI = 4 \times 10^{12}\ \mathrm{N \cdot mm^2}$. It carries a uniform load of $4\ \mathrm{kN/m}$ ($4\ \mathrm{N/mm}$). What is the size of the tip deflection?`,
      answer: 2, // check: wL⁴/(8EI) = 4 × 2000⁴ / (8 × 4e12) = 6.4e13 / 3.2e13 = 2.0 mm
      tolerance: 0.02,
      suffix: "mm",
      hint: "Use the cantilever row for a uniform load. Mind the power on the length.",
      explanation: r`$\delta = \dfrac{wL^4}{8EI} = \dfrac{4 \times 2000^4}{8 \times 4 \times 10^{12}} = \dfrac{6.4 \times 10^{13}}{3.2 \times 10^{13}} = 2.0\ \mathrm{mm}$.`,
      tags: ["deflection", "cantilever"],
    }),
    mc("point-vs-spread", {
      question: r`A simply supported beam must carry a total load $W$. Is the mid-span deflection larger if $W$ is one point load at mid-span, or if it is spread uniformly along the span?`,
      choices: [
        ["point", "Larger as a single point load at mid-span"],
        ["spread", "Larger when spread uniformly", r`Put $w = W/L$ into the uniform-load formula and compare the two numbers multiplying $WL^3/EI$.`],
        ["same", "The same either way", "The total load is the same, but where it sits along the beam matters. Compare the two formulas."],
        ["depends", r`It depends on $EI$`, r`$EI$ divides both results in the same way, so it cancels from the comparison.`],
      ],
      correct: "point",
      hint: r`Write the uniform load as $w = W/L$ so both formulas are in terms of $W$, then compare $1/48$ with the other number.`,
      explanation: r`Point load: $\delta = WL^3/(48EI) = 0.0208\,WL^3/EI$. Spread: $w = W/L$, so $\delta = 5WL^3/(384EI) = 0.0130\,WL^3/EI$. Concentrating the load at mid-span gives $1.6$ times the deflection. Load near the supports does little bending.`,
      tags: ["deflection", "simply-supported"],
    }),
    reading(
      "design",
      r`**Designing for stiffness.** Building codes limit how far a floor may sag, often to the span divided by a few hundred, so that plaster does not crack and the floor does not feel bouncy. That turns a deflection formula around: given the limit, how big must $I$ be?

For a simply supported beam under a uniform load, requiring $\delta \le \delta_{\max}$ means

$$I \ \ge\ \frac{5\,wL^4}{384\,E\,\delta_{\max}}.$$

You then pick a cross-section with at least that second moment of area. Because $I$ grows with the cube of the depth, a slightly deeper beam is a much stiffer one.`,
      { title: "Sizing a beam by its deflection" },
    ),
    numeric("required-i", {
      body: r`A timber floor joist spans $4\ \mathrm{m}$, simply supported, and carries $3\ \mathrm{kN/m}$ ($3\ \mathrm{N/mm}$). The timber has $E = 12\ \mathrm{GPa}$. The mid-span deflection must not exceed $10\ \mathrm{mm}$.`,
      question: r`What is the smallest second moment of area $I$ that will do? Answer in units of $10^{6}\ \mathrm{mm^4}$.`,
      answer: 83.33, // check: I = 5wL⁴/(384 E δ) = 5×3×4000⁴ / (384 × 12000 × 10) = 3.84e15 / 4.608e7 = 8.333e7 mm⁴
      tolerance: 0.85,
      prefix: r`$I \ge$`,
      suffix: r`$\times 10^{6}\ \mathrm{mm^4}$`,
      answerDisplay: r`83.3 \times 10^{6}\ \mathrm{mm^4}`,
      hint: r`Rearrange the mid-span deflection formula for $I$. Use $E$ in MPa ($12\ \mathrm{GPa} = 12\,000\ \mathrm{MPa}$) so the units are N and mm throughout.`,
      explanation: r`$I \ge \dfrac{5wL^4}{384E\delta_{\max}} = \dfrac{5 \times 3 \times 4000^4}{384 \times 12\,000 \times 10} = \dfrac{3.84 \times 10^{15}}{4.608 \times 10^{7}} = 8.33 \times 10^{7}\ \mathrm{mm^4} = 83.3 \times 10^{6}\ \mathrm{mm^4}$. A joist $50\ \mathrm{mm}$ wide would need to be about $270\ \mathrm{mm}$ deep.`,
      tags: ["deflection", "design"],
    }),
    reading(
      "point-loads",
      r`A point load in the middle of a beam is awkward for the beam equation, because $q(x)$ is zero everywhere except one spot. The book handles this with a bookkeeping device, the **Macaulay bracket**:

$$\langle x - a\rangle^n = \begin{cases} 0 & x < a \\ (x - a)^n & x \ge a \end{cases}$$

It is a term that stays switched off until $x$ passes $a$, and then behaves like an ordinary power. It integrates like one too:

$$\int \langle x - a\rangle^n\,\mathrm{d}x = \frac{\langle x - a\rangle^{n+1}}{n + 1} + C.$$

A downward point load $P$ at $x = a$ makes the shear force jump there. In the integrals it shows up as a bracket term that switches on at $a$, so **one formula covers the whole beam** instead of one formula for each side of the load.`,
      { title: "Loads that switch on partway along" },
    ),
    mc("macaulay", {
      question: r`What are the values of $\langle x - 2\rangle^2$ at $x = 1.5$ and at $x = 5$?`,
      choices: [
        ["zero-nine", r`$0$ and $9$`],
        ["quarter-nine", r`$0.25$ and $9$`, r`Before $x$ reaches $2$ the bracket is switched off. What value does it have there?`],
        ["zero-three", r`$0$ and $3$`, "After the bracket switches on, it behaves like an ordinary power. Which power is it raised to?"],
        ["zero-zero", r`$0$ and $0$`, r`At $x = 5$ the bracket has switched on.`],
      ],
      correct: "zero-nine",
      hint: r`Decide first whether each $x$ is before or after the switch-on point $a = 2$.`,
      explanation: r`At $x = 1.5$, which is before $2$, the bracket is zero. At $x = 5$ it is $(5 - 2)^2 = 9$. Squaring the negative number $-0.5$ to get $0.25$ is the trap: the bracket is defined to be zero there.`,
      tags: ["macaulay"],
    }),
    order("recipe", {
      question: "Put the steps of the beam-equation method in order.",
      items: [
        ["load", r`Write the load $q(x)$, positive upward`],
        ["integrate", "Integrate four times, collecting four constants"],
        ["check", "Compare the second integral with the bending moment from statics, if you can"],
        ["bcs", "Apply two boundary conditions at each end to find the constants"],
        ["evaluate", "Evaluate the deflection or slope where it is asked for"],
      ],
      hint: "The constants cannot be found until they exist, and the answer cannot be evaluated until the constants are known.",
      explanation: r`Write $q(x)$, integrate four times, sanity-check the moment, apply the four boundary conditions, then evaluate. The second integral is $EI\,v'' = M$ and the first is $EI\,v''' = -V$, so both can be checked against a free-body diagram.`,
      tags: ["beam-equation"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Solve $EI\,v'''' = q$ by four integrations and four boundary conditions.
- Use the standard results: $PL^3/3EI$ and $wL^4/8EI$ for cantilevers, $PL^3/48EI$ and $5wL^4/384EI$ for simply supported beams.
- Turn a deflection limit into a required $I$.
- Read a Macaulay bracket as a term that switches on at $x = a$.

Next: what happens when a beam is pushed sideways as well as down.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Bending about two axes (Govindjee §8.5)                  */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "sm8-l3-two-axis-bending",
    unitId: "sm8",
    title: "Bending about two axes",
    summary: "An axial force and bending about both section axes simply add up: σ = P/A − Mz y/Iz + My z/Iy.",
    textbook: "Govindjee §8.5",
    minutes: 13,
  },
  [
    reading(
      "setup",
      r`A signpost in a crosswind is pushed sideways by the wind and squashed by its own weight, both at once. Real beams rarely bend about only one axis.

Look at the cross-section with $y$ pointing up and $z$ pointing sideways. Three things can act on it together:

- an axial force $P$ (tension positive),
- a bending moment $M_z$ about the $z$ axis: the bending you already know, from loads that act up and down,
- a bending moment $M_y$ about the $y$ axis, from loads that act sideways.

For a section with two lines of symmetry, made of one material, the three stresses **add**:

$$\sigma_{xx} = \frac{P}{A} - \frac{M_z\,y}{I_z} + \frac{M_y\,z}{I_y}.$$

Each bending term needs its own second moment of area:

$$I_z = \int_A y^2\,\mathrm{d}A, \qquad I_y = \int_A z^2\,\mathrm{d}A.$$

For a rectangle of height $h$ (along $y$) and width $b$ (along $z$): $I_z = bh^3/12$ and $I_y = hb^3/12$. The dimension that gets cubed is always the one **across** the axis you are bending about.`,
      { title: "More than one thing at once" },
    ),
    numeric("i-z", {
      body: r`A rectangular section is $100\ \mathrm{mm}$ tall (along $y$) and $60\ \mathrm{mm}$ wide (along $z$).`,
      question: r`What is $I_z$, for bending about the $z$ axis? Answer in units of $10^{6}\ \mathrm{mm^4}$.`,
      answer: 5, // check: Iz = b h³/12 = 60 × 100³ / 12 = 5.0e6 mm⁴
      tolerance: 0.05,
      prefix: r`$I_z =$`,
      suffix: r`$\times 10^{6}\ \mathrm{mm^4}$`,
      answerDisplay: r`5 \times 10^{6}\ \mathrm{mm^4}`,
      hint: r`$I_z$ adds up $y^2$ over the area, so the dimension along $y$ is the one that is cubed.`,
      explanation: r`$I_z = \dfrac{b h^3}{12} = \dfrac{60 \times 100^3}{12} = 5.0 \times 10^{6}\ \mathrm{mm^4}$. The height is cubed because bending about $z$ stretches and squashes fibres according to their height $y$.`,
      tags: ["second-moment", "two-axis-bending"],
    }),
    numeric("i-y", {
      question: r`Same section: what is $I_y$, for bending about the $y$ axis? Answer in units of $10^{6}\ \mathrm{mm^4}$.`,
      answer: 1.8, // check: Iy = h b³/12 = 100 × 60³ / 12 = 1.8e6 mm⁴
      tolerance: 0.02,
      prefix: r`$I_y =$`,
      suffix: r`$\times 10^{6}\ \mathrm{mm^4}$`,
      answerDisplay: r`1.8 \times 10^{6}\ \mathrm{mm^4}`,
      hint: r`Now the roles swap: $I_y$ adds up $z^2$, so the dimension along $z$ is cubed.`,
      explanation: r`$I_y = \dfrac{h b^3}{12} = \dfrac{100 \times 60^3}{12} = 1.8 \times 10^{6}\ \mathrm{mm^4}$. The section is almost three times less stiff this way, which is why a plank is easy to bend flat and hard to bend on edge.`,
      tags: ["second-moment", "two-axis-bending"],
    }),
    reading(
      "signs",
      r`The formula is only as good as the signs you feed it. Read each term on its own.

- $-\dfrac{M_z\,y}{I_z}$: a positive $M_z$ **compresses** the fibres with $y > 0$ (the top) and stretches the bottom. This is the bending stress from the last unit.
- $+\dfrac{M_y\,z}{I_y}$: a positive $M_y$ **stretches** the fibres with $z > 0$ and compresses those with $z < 0$.
- $\dfrac{P}{A}$: the same everywhere, positive for tension.

To find the stress at a point, substitute its coordinates $(y, z)$ **with their signs**. The two bending stresses can reinforce each other at one corner and partly cancel at another.`,
      { title: "Reading the formula" },
    ),
    numeric("corner-a", {
      body: r`The section from before ($I_z = 5 \times 10^{6}\ \mathrm{mm^4}$, $I_y = 1.8 \times 10^{6}\ \mathrm{mm^4}$) carries $M_z = 2\ \mathrm{kN \cdot m}$ and $M_y = 0.9\ \mathrm{kN \cdot m}$, with no axial force. Recall $1\ \mathrm{kN \cdot m} = 10^{6}\ \mathrm{N \cdot mm}$.`,
      question: r`What is the stress at the corner $(y, z) = (+50, +30)\ \mathrm{mm}$? Include the sign.`,
      answer: -5, // check: −Mz y/Iz = −2e6×50/5e6 = −20; +My z/Iy = 0.9e6×30/1.8e6 = +15; sum −5 MPa
      tolerance: 0.05,
      prefix: r`$\sigma_{xx} =$`,
      suffix: "MPa",
      hint: "Work out the two bending terms separately, each with its sign, then add them.",
      explanation: r`$-\dfrac{M_z y}{I_z} = -\dfrac{2 \times 10^{6} \times 50}{5 \times 10^{6}} = -20\ \mathrm{MPa}$ and $+\dfrac{M_y z}{I_y} = \dfrac{0.9 \times 10^{6} \times 30}{1.8 \times 10^{6}} = +15\ \mathrm{MPa}$. Total: $-5\ \mathrm{MPa}$. At this corner the two bending effects pull in opposite directions.`,
      tags: ["two-axis-bending", "bending-stress"],
    }),
    numeric("corner-b", {
      question: r`Same loading: what is the stress at the corner $(y, z) = (-50, +30)\ \mathrm{mm}$?`,
      answer: 35, // check: −2e6×(−50)/5e6 = +20; +15; sum +35 MPa
      tolerance: 0.35,
      prefix: r`$\sigma_{xx} =$`,
      suffix: "MPa",
      hint: r`Only the sign of $y$ has changed. Which term does that affect?`,
      explanation: r`Now $-\dfrac{M_z y}{I_z} = -\dfrac{2 \times 10^{6} \times (-50)}{5 \times 10^{6}} = +20\ \mathrm{MPa}$, and the $M_y$ term is still $+15\ \mathrm{MPa}$. Total: $+35\ \mathrm{MPa}$. Here both effects stretch the fibre, so this corner has the largest tension in the section.`,
      tags: ["two-axis-bending", "bending-stress"],
    }),
    mc("where-largest", {
      question: "In a rectangular section bent about both axes, where is the stress largest in size?",
      choices: [
        ["corner", "At a corner"],
        ["top-mid", "At the middle of the top edge", r`That point has the largest $|y|$ but $z = 0$. Can you find a point where both terms are at their largest?`],
        ["side-mid", "At the middle of a side edge", r`That point has the largest $|z|$ but $y = 0$.`],
        ["centre", "At the centre of the section", r`At the centre, $y = 0$ and $z = 0$. What do the bending terms give?`],
      ],
      correct: "corner",
      shuffle: true,
      hint: r`Each bending term grows with the distance from its own axis. Where are $|y|$ and $|z|$ both as large as they can be?`,
      explanation: r`Both bending terms are linear in the coordinates, so each is largest at the edge farthest from its axis. Only at a corner are $|y|$ and $|z|$ both at their maximum. Which corner depends on the signs of the moments, so in practice you evaluate the corners and compare.`,
      tags: ["two-axis-bending"],
    }),
    numeric("with-axial", {
      question: r`An axial **tension** of $60\ \mathrm{kN}$ is now added to that loading. The section's area is $100 \times 60 = 6000\ \mathrm{mm^2}$. What is the stress at $(y, z) = (-50, +30)\ \mathrm{mm}$ now?`,
      answer: 45, // check: P/A = 60 000/6000 = +10; +35 from bending; total +45 MPa
      tolerance: 0.45,
      prefix: r`$\sigma_{xx} =$`,
      suffix: "MPa",
      hint: r`The axial force adds the same stress $P/A$ at every point of the section. Add it to what you already found for this corner.`,
      explanation: r`$P/A = 60\,000/6000 = +10\ \mathrm{MPa}$ everywhere. At this corner the bending stresses already total $+35\ \mathrm{MPa}$, so $\sigma_{xx} = 45\ \mathrm{MPa}$. The three effects are found separately and added.`,
      tags: ["two-axis-bending", "combined-loading"],
    }),
    reading(
      "neutral-axis",
      r`The **neutral axis** is the line across the section where the stress is zero. With one bending moment it was the horizontal line through the centroid. With two it tilts.

Set $\sigma_{xx} = 0$ with no axial force:

$$-\frac{M_z\,y}{I_z} + \frac{M_y\,z}{I_y} = 0 \qquad\Longrightarrow\qquad y = \frac{M_y\,I_z}{M_z\,I_y}\;z.$$

This is a straight line through the centroid. Its slope depends on the ratio of the moments **and** on the ratio of the two second moments of area, so the beam does not, in general, bend about the same direction the moment points along.

The largest stresses are at the points of the section farthest from this line.`,
      { title: "The neutral axis tilts" },
    ),
    numeric("na-slope", {
      question: r`For the section and moments above ($M_z = 2\ \mathrm{kN \cdot m}$, $M_y = 0.9\ \mathrm{kN \cdot m}$, $I_z = 5 \times 10^{6}\ \mathrm{mm^4}$, $I_y = 1.8 \times 10^{6}\ \mathrm{mm^4}$), the neutral axis is the line $y = m\,z$. What is the slope $m$?`,
      answer: 1.25, // check: m = My Iz / (Mz Iy) = (0.9 × 5)/(2 × 1.8) = 4.5/3.6 = 1.25
      tolerance: 0.0125,
      prefix: r`$m =$`,
      hint: r`Use the neutral-axis line from the reading. The powers of ten in the moments and in the second moments cancel in pairs.`,
      explanation: r`$m = \dfrac{M_y I_z}{M_z I_y} = \dfrac{0.9 \times 5}{2 \times 1.8} = \dfrac{4.5}{3.6} = 1.25$. Check it against an earlier answer: the corner $(-50, +30)$ is far from this line, and that is where the stress was largest.`,
      tags: ["two-axis-bending", "neutral-axis"],
    }),
    tf("na-centroid", {
      statement: "When there is no axial force, the neutral axis of a section bent about two axes passes through the centroid.",
      answer: true,
      feedback: r`Put $y = 0$ and $z = 0$ into the stress formula with $P = 0$.`,
      hint: r`What is the stress at the centroid, where $y = 0$ and $z = 0$, when $P = 0$?`,
      explanation: r`True. At the centroid $y = z = 0$, so both bending terms vanish and the stress is zero there. The neutral axis is the line of zero stress, so it passes through the centroid. Add an axial force and the whole stress pattern shifts by $P/A$, moving the neutral axis off the centroid.`,
      tags: ["two-axis-bending", "neutral-axis"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Combine an axial force and two bending moments: $\sigma_{xx} = \dfrac{P}{A} - \dfrac{M_z y}{I_z} + \dfrac{M_y z}{I_y}$.
- Pick the right second moment for each axis: the cubed dimension runs across the bending axis.
- Evaluate the stress at any point by substituting $(y, z)$ with signs, and find the worst corner.
- Locate the tilted neutral axis: $y = \dfrac{M_y I_z}{M_z I_y}\,z$ when $P = 0$.

One caution: this simple sum holds for sections with two lines of symmetry. Lopsided sections need more care.

Next: the shear force has been along for the whole ride. What stress does it cause?`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Shear stress in beams (Govindjee §8.6)                   */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "sm8-l4-shear-stress",
    unitId: "sm8",
    title: "Shear stress in beams",
    summary: "Where the bending moment changes along a beam, layers try to slide. The shear stress that stops them is τ = VQ/(Ib).",
    textbook: "Govindjee §8.6",
    minutes: 14,
  },
  [
    reading(
      "why",
      r`Stack a few loose planks across two supports and stand on them. They bend, and their ends go out of line: each plank **slides** over the one below. Glue the planks together and the sliding stops. The stack becomes far stiffer, and the glue is now carrying a stress along the joint.

A solid beam is the glued stack with no glue line: the material itself stops the layers sliding. The stress that does it is a **shear stress**, acting along horizontal planes inside the beam.

Where does it come from? Bending stress depends on the bending moment. If the moment is different at two nearby cross-sections, the bending stresses pushing on the two ends of a layer do not balance. A shear stress on the layer's underside makes up the difference.

The moment changes along the beam at a rate set by the shear force, $\mathrm{d}M/\mathrm{d}x = -V$. So:

**Shear stress appears wherever there is a shear force $V$.**`,
      { title: "Why layers want to slide" },
    ),
    mc("pure-bending", {
      question: "Over part of a beam the bending moment is constant: it has the same value at every cross-section. What is the shear stress in that part?",
      choices: [
        ["zero", "Zero"],
        ["max", "At its largest", "Shear stress balances a change in bending stress from one section to the next. Is there a change here?"],
        ["equal", "Equal to the bending stress", "They are different stresses with different causes. One comes from the moment, the other from how fast the moment changes."],
        ["cannot", "It cannot be found without the load", r`You are told how the moment varies along the beam. Use $\mathrm{d}M/\mathrm{d}x = -V$.`],
      ],
      correct: "zero",
      shuffle: true,
      hint: r`Use $\mathrm{d}M/\mathrm{d}x = -V$. What is $V$ when $M$ does not change with $x$?`,
      explanation: r`A constant moment means $\mathrm{d}M/\mathrm{d}x = 0$, so $V = 0$ and there is no shear stress. The bending stresses on the two ends of any layer balance exactly, so nothing tries to slide. This state is called pure bending.`,
      tags: ["shear-stress"],
    }),
    reading(
      "formula",
      r`Balancing the forces on the part of the beam above a horizontal cut gives the shear stress at that level:

$$\tau = \frac{V\,Q}{I\,b}.$$

Four quantities, each with a plain meaning:

- $V$: the shear force at that cross-section.
- $I$: the second moment of area of the **whole** section about its neutral axis.
- $b$: the **width** of the section at the level of the cut.
- $Q$: the **first moment** of the area beyond the cut, about the neutral axis:

$$Q = A'\,\bar y'.$$

$A'$ is the area of the part of the section beyond the cut (above it, say). $\bar y'$ is the distance from the neutral axis to the centroid of that part.

$Q$ measures how much bending force the cut-off part collects. At the very top there is no area beyond the cut, so $Q = 0$. It grows as the cut moves toward the neutral axis and is largest there.`,
      { title: "The shear formula" },
    ),
    numeric("q-rectangle", {
      body: r`A rectangular section is $40\ \mathrm{mm}$ wide and $120\ \mathrm{mm}$ tall. Its neutral axis is at mid-height.`,
      question: r`What is $Q$ for a cut at the neutral axis? Answer in $\mathrm{mm^3}$.`,
      answer: 72000, // check: A' = 40×60 = 2400 mm²; centroid 30 mm above NA; Q = 72 000 mm³
      tolerance: 720,
      prefix: r`$Q =$`,
      suffix: r`$\mathrm{mm^3}$`,
      answerDisplay: r`72\,000\ \mathrm{mm^3}`,
      hint: "The area beyond the cut is the top half of the rectangle. Find its area, then the distance from the neutral axis to the middle of that half.",
      explanation: r`The top half has area $A' = 40 \times 60 = 2400\ \mathrm{mm^2}$. Its centroid is halfway up it, $30\ \mathrm{mm}$ above the neutral axis. So $Q = 2400 \times 30 = 72\,000\ \mathrm{mm^3}$.`,
      tags: ["shear-stress", "first-moment"],
    }),
    numeric("tau-na", {
      question: r`That section carries a shear force $V = 24\ \mathrm{kN}$. Its second moment of area is $I = 40 \times 120^3/12 = 5.76 \times 10^{6}\ \mathrm{mm^4}$. What is the shear stress at the neutral axis?`,
      answer: 7.5, // check: τ = VQ/(Ib) = 24000×72000/(5.76e6×40) = 1.728e9/2.304e8 = 7.5 MPa
      tolerance: 0.075,
      prefix: r`$\tau =$`,
      suffix: "MPa",
      hint: r`Use $\tau = VQ/(Ib)$ with $V$ in newtons, the $Q$ you just found, and $b$ the width at the cut.`,
      explanation: r`$\tau = \dfrac{VQ}{Ib} = \dfrac{24\,000 \times 72\,000}{5.76 \times 10^{6} \times 40} = \dfrac{1.728 \times 10^{9}}{2.304 \times 10^{8}} = 7.5\ \mathrm{MPa}$.`,
      tags: ["shear-stress"],
    }),
    reading(
      "rectangle",
      r`Do the same at every height $y$ of a rectangle of height $h$ and the result is a **parabola**:

$$\tau(y) = \frac{V}{2I}\Big[\Big(\frac{h}{2}\Big)^2 - y^2\Big].$$

- Zero at the top and bottom surfaces.
- Largest at the neutral axis, where

$$\tau_{\max} = \frac{3V}{2A}.$$

That is **one and a half times** the average value $V/A$ you would get by spreading the shear force evenly over the area. The simple average underestimates the peak by a third.

Compare with bending stress, which does the opposite: zero at the neutral axis and largest at the top and bottom.`,
      { title: "The rectangle: a parabola" },
    ),
    numeric("tau-average", {
      question: r`For the same section ($40 \times 120\ \mathrm{mm}$) and shear force ($24\ \mathrm{kN}$), what is the **average** shear stress $V/A$?`,
      answer: 5, // check: 24 000 / (40×120) = 24 000/4800 = 5 MPa
      tolerance: 0.05,
      suffix: "MPa",
      hint: "Shear force divided by the whole cross-section area.",
      explanation: r`$V/A = 24\,000/(40 \times 120) = 24\,000/4800 = 5\ \mathrm{MPa}$. The peak you found, $7.5\ \mathrm{MPa}$, is $1.5$ times this, as $\tau_{\max} = 3V/(2A)$ says.`,
      tags: ["shear-stress"],
    }),
    numeric("tau-quarter", {
      question: r`Same section and shear force. What is the shear stress at $y = 30\ \mathrm{mm}$, halfway between the neutral axis and the top?`,
      answer: 5.625, // check: A' = 40×30 = 1200, centroid at y = 45 → Q = 54 000; τ = 24000×54000/(5.76e6×40) = 5.625 MPa; parabola: 24000/(2×5.76e6)×(60²−30²) = 5.625 ✓
      tolerance: 0.06,
      prefix: r`$\tau =$`,
      suffix: "MPa",
      hint: r`The area beyond this cut is the strip from $y = 30$ to $y = 60\ \mathrm{mm}$. Find its area and where its centroid is, then use the shear formula again.`,
      explanation: r`The strip above the cut is $40 \times 30 = 1200\ \mathrm{mm^2}$ with its centroid at $y = 45\ \mathrm{mm}$, so $Q = 54\,000\ \mathrm{mm^3}$. Then $\tau = \dfrac{24\,000 \times 54\,000}{5.76 \times 10^{6} \times 40} = 5.63\ \mathrm{MPa}$. Halfway up, the stress is three quarters of the peak, not half: the curve is a parabola.`,
      tags: ["shear-stress", "first-moment"],
    }),
    mc("where-zero", {
      question: "Where in a rectangular section is the shear stress zero?",
      choices: [
        ["surfaces", "At the top and bottom surfaces"],
        ["na", "At the neutral axis", "That is where the bending stress is zero. For shear, ask how much area lies beyond a cut made at that level."],
        ["everywhere", "Nowhere: it is the same at every height", r`That is the average $V/A$. The real distribution depends on $Q$, which changes with height.`],
        ["quarter", "At the quarter points", r`$Q$ is zero only where there is no area beyond the cut.`],
      ],
      correct: "surfaces",
      shuffle: true,
      hint: r`$\tau$ is proportional to $Q$, the first moment of the area beyond the cut. For which cuts is there no area beyond?`,
      explanation: r`At the top or bottom surface there is no area beyond the cut, so $Q = 0$ and $\tau = 0$. That makes physical sense: the outside surface of the beam is free, with nothing pushing along it.`,
      tags: ["shear-stress"],
    }),
    tf("opposite", {
      statement: "In a rectangular beam section, the bending stress is largest where the shear stress is zero, and the shear stress is largest where the bending stress is zero.",
      answer: true,
      feedback: "Compare the two distributions: one is a straight line through zero at the neutral axis, the other a parabola that is zero at the surfaces.",
      hint: "Sketch both against height: the straight line of bending stress and the parabola of shear stress.",
      explanation: "True. Bending stress is zero at the neutral axis and largest at the top and bottom. Shear stress is zero at the top and bottom and largest at the neutral axis. The two peaks never occur at the same point of a rectangular section.",
      tags: ["shear-stress", "bending-stress"],
    }),
    reading(
      "negligible",
      r`Beam theory assumed cross-sections stay square to the beam's axis, which means it ignored shear *deformation*. Was that fair?

An energy calculation for a rectangular cantilever with a tip load gives the deflection including shear:

$$\Delta = \frac{PL^3}{3EI}\Big[1 + \frac{3E}{10G}\Big(\frac{h}{L}\Big)^2\Big].$$

The second term in the bracket is the correction. It depends on the depth-to-length ratio **squared**. For a slender beam it is tiny, so the deflection formulas of the last two lessons stand.

Shear **stress** is another matter. It matters in short, deep beams, in timber (which splits easily along the grain) and above all in the joints of beams built up from several pieces. That is the next lesson.`,
      { title: "Can shear be ignored?" },
    ),
    numeric("shear-correction", {
      question: r`For a metal with $E/G = 2.6$ and a beam ten times as long as it is deep ($h/L = 0.1$), how big is the shear correction term $\dfrac{3E}{10G}\Big(\dfrac{h}{L}\Big)^2$? Give it as a percentage.`,
      answer: 0.78, // check: 0.3 × 2.6 × 0.01 = 0.0078 = 0.78 %
      tolerance: 0.01,
      suffix: "%",
      hint: r`Substitute $E/G = 2.6$ and $h/L = 0.1$, then turn the result into a percentage.`,
      explanation: r`$\dfrac{3}{10} \times 2.6 \times 0.1^2 = 0.0078$, or $0.78\%$. Shear adds less than one percent to the deflection of a slender metal beam, which is why it is left out.`,
      tags: ["shear-deformation"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Explain why shear stress exists wherever the bending moment changes along the beam.
- Use $\tau = \dfrac{VQ}{Ib}$, with $Q = A'\bar y'$ for the area beyond the cut.
- Describe the rectangle's parabola: zero at the surfaces, $\tau_{\max} = \dfrac{3V}{2A}$ at the neutral axis.
- Judge when shear deformation is negligible (slender beams).

Next: using the same formula to design the nails, bolts and glue that hold a built-up beam together.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 5 · Built-up beams and shear flow (Govindjee §8.6.1)         */
/* ------------------------------------------------------------------ */

const T_SECTION = r`A T-shaped beam is made by nailing a flange ($120\ \mathrm{mm}$ wide, $20\ \mathrm{mm}$ thick) on top of a web ($20\ \mathrm{mm}$ wide, $120\ \mathrm{mm}$ deep). The neutral axis is $95\ \mathrm{mm}$ above the bottom of the web, and $I = 8.84 \times 10^{6}\ \mathrm{mm^4}$ for the whole section.`;

const l5 = lesson(
  {
    id: "sm8-l5-shear-flow",
    unitId: "sm8",
    title: "Built-up beams and shear flow",
    summary: "The force per length a joint must carry is the shear flow q = VQ/I. It sizes glue lines and spaces nails and bolts.",
    textbook: "Govindjee §8.6.1",
    minutes: 13,
  },
  [
    reading(
      "shear-flow",
      r`Many beams are **built up** from pieces: planks nailed into a box, a steel plate bolted to a girder, layers glued into a laminated timber beam. The pieces only work as one beam if the joints stop them sliding over each other.

How hard do the joints have to work? Take the shear formula and do not divide by the width:

$$q = \frac{V\,Q}{I}.$$

This is the **shear flow**: the force that must be passed across the joint **per unit length of beam**, in N/mm. Here $Q$ is the first moment, about the neutral axis, of the piece that the joint is holding on.

Two ways to use it:

- **Glue line** of width $b$: the stress in the glue is $\tau = q/b$.
- **Nails or bolts** spaced $s$ apart along the beam: each one collects the shear flow over its own stretch of beam, so the force on each is $F = q \times s$.`,
      { title: "What a joint has to carry" },
    ),
    reading(
      "worked",
      r`**Worked example.** Two planks, each $100\ \mathrm{mm}$ wide and $50\ \mathrm{mm}$ thick, are glued face to face into a $100 \times 100\ \mathrm{mm}$ beam. The shear force is $V = 5\ \mathrm{kN}$.

**Section.** $I = 100 \times 100^3/12 = 8.33 \times 10^{6}\ \mathrm{mm^4}$. The neutral axis is at mid-height, exactly on the glue line.

**$Q$ for the piece being held on.** The top plank has area $100 \times 50 = 5000\ \mathrm{mm^2}$, and its centroid is $25\ \mathrm{mm}$ above the neutral axis:

$$Q = 5000 \times 25 = 125\,000\ \mathrm{mm^3}.$$

**Shear flow.**

$$q = \frac{VQ}{I} = \frac{5000 \times 125\,000}{8.33 \times 10^{6}} = 75\ \mathrm{N/mm}.$$

**Glue stress.** The glue line is $100\ \mathrm{mm}$ wide: $\tau = 75/100 = 0.75\ \mathrm{MPa}$.

**Or with screws** every $60\ \mathrm{mm}$ instead of glue: each screw carries $75 \times 60 = 4500\ \mathrm{N}$.`,
      { title: "Worked example: two glued planks" },
    ),
    numeric("q-flange", {
      body: T_SECTION,
      question: r`What is $Q$ for the flange, about the neutral axis? Answer in $\mathrm{mm^3}$.`,
      answer: 84000, // check: flange area 120×20 = 2400 mm²; its centroid is at 120 + 10 = 130 mm from the bottom, 35 mm above the NA; Q = 84 000 mm³
      tolerance: 840,
      prefix: r`$Q =$`,
      suffix: r`$\mathrm{mm^3}$`,
      answerDisplay: r`84\,000\ \mathrm{mm^3}`,
      hint: "Find the flange's area, and how high its centroid is above the bottom of the web. Then subtract the height of the neutral axis.",
      explanation: r`The flange has area $120 \times 20 = 2400\ \mathrm{mm^2}$. Its centroid is in the middle of its thickness, $120 + 10 = 130\ \mathrm{mm}$ above the bottom, which is $130 - 95 = 35\ \mathrm{mm}$ above the neutral axis. $Q = 2400 \times 35 = 84\,000\ \mathrm{mm^3}$.`,
      tags: ["shear-flow", "first-moment"],
    }),
    numeric("flow", {
      question: r`The T-beam carries a shear force $V = 5\ \mathrm{kN}$. What shear flow must the nails between the flange and the web carry?`,
      answer: 47.51, // check: q = VQ/I = 5000 × 84 000 / 8.84e6 = 47.51 N/mm
      tolerance: 0.5,
      prefix: r`$q =$`,
      suffix: "N/mm",
      hint: r`Use $q = VQ/I$ with $V$ in newtons, the flange's $Q$, and $I$ of the whole section.`,
      explanation: r`$q = \dfrac{VQ}{I} = \dfrac{5000 \times 84\,000}{8.84 \times 10^{6}} = 47.5\ \mathrm{N/mm}$. Every millimetre of joint has to pass $47.5\ \mathrm{N}$ from the flange into the web.`,
      tags: ["shear-flow"],
    }),
    numeric("nail-spacing", {
      question: r`Each nail can safely carry $950\ \mathrm{N}$ in shear. With one row of nails, what is the largest spacing allowed along the beam?`,
      answer: 20, // check: s = F/q = 950/47.51 = 19.99 mm
      tolerance: 0.25,
      prefix: r`$s =$`,
      suffix: "mm",
      hint: r`Each nail collects the shear flow over one spacing: $F = q \times s$. Solve for $s$.`,
      explanation: r`$s = F/q = 950/47.5 = 20\ \mathrm{mm}$. Nails any farther apart would each have to carry more than they safely can.`,
      tags: ["shear-flow", "fasteners"],
    }),
    mc("which-area", {
      question: r`When checking the nails between the flange and the web, which area goes into $Q$?`,
      choices: [
        ["one-side", "The area on one side of the joint: here, the flange"],
        ["whole", "The whole cross-section", r`The first moment of the whole section about its own neutral axis is zero. That would say no joint ever carries anything.`],
        ["nails", "The cross-section area of the nails", r`$Q$ describes the piece of beam being held on, not the fasteners doing the holding.`],
        ["strip", r`Only the top $20\ \mathrm{mm}$ of the web, next to the joint`, "The joint has to hold on the entire piece that would otherwise slide off."],
      ],
      correct: "one-side",
      shuffle: true,
      hint: "Imagine the nails removed. Which whole piece would slide? That is the piece the joint is holding on.",
      explanation: r`$Q$ is the first moment of everything on one side of the joint, the piece that would slide off without it: here the flange. (The other side, the web, gives the same size of $Q$ with the opposite sign, because the first moment of the whole section about the neutral axis is zero.)`,
      tags: ["shear-flow", "first-moment"],
    }),
    numeric("glue", {
      question: r`Suppose the flange is glued to the web instead of nailed, over the web's full $20\ \mathrm{mm}$ width. With the same shear force, what is the shear stress in the glue?`,
      answer: 2.376, // check: τ = q/b = 47.51/20 = 2.376 MPa
      tolerance: 0.03,
      prefix: r`$\tau =$`,
      suffix: "MPa",
      hint: "The glue spreads the shear flow over its own width. Divide the shear flow by that width.",
      explanation: r`$\tau = q/b = 47.5/20 = 2.38\ \mathrm{MPa}$. This is the shear formula $\tau = VQ/(Ib)$ again, with $b$ the width of the joint.`,
      tags: ["shear-flow", "glue"],
    }),
    mc("where-close", {
      question: "A built-up beam sits on two supports and carries a uniform load. Where along it must the nails be closest together?",
      choices: [
        ["supports", "Near the supports"],
        ["mid", "At mid-span", "Mid-span is where the bending moment is largest. Which internal force does the shear flow depend on, and how big is it at mid-span?"],
        ["even", "Evenly all along", "The shear flow follows the shear force, and the shear force is not the same all along this beam."],
        ["quarter", "At the quarter points only", "The shear force grows steadily from mid-span toward each support."],
      ],
      correct: "supports",
      shuffle: true,
      hint: r`$q = VQ/I$. Where along a uniformly loaded, simply supported beam is the shear force $V$ largest in size?`,
      explanation: "Shear flow is proportional to the shear force. For a uniform load on two supports the shear force is largest at the supports and zero at mid-span, so the nails must be closest near the supports. At mid-span, where the bending moment peaks, the joint carries nothing.",
      tags: ["shear-flow", "fasteners"],
    }),
    tf("depends-on-v", {
      statement: "The shear flow in a joint at some cross-section is set by the bending moment at that cross-section.",
      answer: false,
      feedback: r`Look at $q = VQ/I$. Which internal force appears in it?`,
      hint: r`Check which internal force appears in $q = VQ/I$, and remember how that force is related to the bending moment.`,
      explanation: r`False. Shear flow depends on the shear force $V$, which is the rate at which the bending moment changes along the beam, not on the size of the moment itself. A section can have a huge bending moment and no shear flow at all, as at the middle of a uniformly loaded span.`,
      tags: ["shear-flow"],
    }),
    reading(
      "summary",
      r`**The unit in one place**

Deflection: $M = EI\,v''$ and $EI\,v'''' = q$, with two boundary conditions at each end.

$$\delta_{\text{cantilever}} = \frac{PL^3}{3EI},\ \frac{wL^4}{8EI} \qquad\qquad \delta_{\text{simple}} = \frac{PL^3}{48EI},\ \frac{5wL^4}{384EI}$$

Combined loading: $\sigma_{xx} = \dfrac{P}{A} - \dfrac{M_z y}{I_z} + \dfrac{M_y z}{I_y}$.

Shear: $\tau = \dfrac{VQ}{Ib}$, with $\tau_{\max} = \dfrac{3V}{2A}$ for a rectangle.

Joints: shear flow $q = \dfrac{VQ}{I}$; glue stress $q/b$; force per fastener $q \times s$.

Next unit: so far every stress has been described along the beam or the bar. What does the same state of stress look like from another angle?`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Level check                                                         */
/* ------------------------------------------------------------------ */

const practice: QuestionStep[] = [
  numeric("p-cantilever-tip", {
    question: r`A cantilever is $1.5\ \mathrm{m}$ long with $EI = 4.5 \times 10^{11}\ \mathrm{N \cdot mm^2}$. A load of $800\ \mathrm{N}$ acts down on its free end. What is the size of the tip deflection?`,
    answer: 2, // check: PL³/(3EI) = 800 × 1500³ / (3 × 4.5e11) = 2.7e12 / 1.35e12 = 2.0 mm
    tolerance: 0.02,
    suffix: "mm",
    hint: "Cantilever with a tip load. Work in N and mm.",
    explanation: r`$\delta = \dfrac{PL^3}{3EI} = \dfrac{800 \times 1500^3}{3 \times 4.5 \times 10^{11}} = \dfrac{2.7 \times 10^{12}}{1.35 \times 10^{12}} = 2.0\ \mathrm{mm}$.`,
    tags: ["deflection", "cantilever"],
  }),
  numeric("p-simple-udl", {
    question: r`A simply supported beam spans $6\ \mathrm{m}$ with $EI = 4.5 \times 10^{13}\ \mathrm{N \cdot mm^2}$ and carries a uniform load of $8\ \mathrm{N/mm}$. What is the size of the mid-span deflection?`,
    answer: 3, // check: 5wL⁴/(384EI) = 5 × 8 × 6000⁴ / (384 × 4.5e13) = 5.184e16 / 1.728e16 = 3.0 mm
    tolerance: 0.03,
    suffix: "mm",
    hint: "Simply supported with a uniform load. Mind the fourth power of the length.",
    explanation: r`$\delta = \dfrac{5wL^4}{384EI} = \dfrac{5 \times 8 \times 6000^4}{384 \times 4.5 \times 10^{13}} = \dfrac{5.184 \times 10^{16}}{1.728 \times 10^{16}} = 3.0\ \mathrm{mm}$.`,
    tags: ["deflection", "simply-supported"],
  }),
  mc("p-bc-free", {
    question: "Which pair of conditions holds at a free end with no load applied there?",
    choices: [
      ["vpp-vppp", r`$v'' = 0$ and $v''' = 0$`],
      ["v-vp", r`$v = 0$ and $v' = 0$`, "Those belong to an end that can neither move nor tilt."],
      ["v-vpp", r`$v = 0$ and $v'' = 0$`, "A free end is not held in place, so its deflection is not known in advance."],
      ["vp-vppp", r`$v' = 0$ and $v''' = 0$`, "Nothing stops a free end from tilting."],
    ],
    correct: "vpp-vppp",
    shuffle: true,
    hint: r`Nothing touches a free end, so it carries no bending moment and no shear force. Use $M = EI\,v''$ and $V = -EI\,v'''$.`,
    explanation: r`A free end carries no bending moment ($EI\,v'' = 0$) and no shear force ($EI\,v''' = 0$). Its deflection and slope are unknown: they are what you solve for.`,
    tags: ["boundary-conditions"],
  }),
  mc("p-scaling", {
    question: "A simply supported beam under a uniform load has its span doubled, with the same load per length and the same cross-section. By what factor does the mid-span deflection grow?",
    choices: [
      ["sixteen", "16"],
      ["eight", "8", r`That is the factor for a point load, where the deflection goes as $L^3$.`],
      ["four", "4", "Check the power of the length in the uniform-load formula."],
      ["two", "2", "Deflection is far more sensitive to length than that."],
    ],
    correct: "sixteen",
    hint: r`Look at the power of $L$ in $5wL^4/(384EI)$.`,
    explanation: r`The deflection goes as $L^4$, so doubling the span multiplies it by $2^4 = 16$.`,
    tags: ["deflection", "scaling"],
  }),
  numeric("p-two-axis", {
    body: r`A rectangular section is $80\ \mathrm{mm}$ tall (along $y$) and $40\ \mathrm{mm}$ wide (along $z$). It carries $M_z = 1.6\ \mathrm{kN \cdot m}$ and $M_y = 0.32\ \mathrm{kN \cdot m}$, with no axial force.`,
    question: r`What is the stress at the corner $(y, z) = (-40, +20)\ \mathrm{mm}$?`,
    answer: 52.5, // check: Iz = 40×80³/12 = 1.7067e6; Iy = 80×40³/12 = 4.2667e5; −Mz y/Iz = 1.6e6×40/1.7067e6 = +37.5; My z/Iy = 0.32e6×20/4.2667e5 = +15; total 52.5 MPa
    tolerance: 0.55,
    prefix: r`$\sigma_{xx} =$`,
    suffix: "MPa",
    hint: "Compute both second moments of area, then each bending term with its sign.",
    explanation: r`$I_z = 40 \times 80^3/12 = 1.707 \times 10^{6}\ \mathrm{mm^4}$ and $I_y = 80 \times 40^3/12 = 4.267 \times 10^{5}\ \mathrm{mm^4}$. Then $-\dfrac{M_z y}{I_z} = \dfrac{1.6 \times 10^{6} \times 40}{1.707 \times 10^{6}} = +37.5\ \mathrm{MPa}$ and $\dfrac{M_y z}{I_y} = \dfrac{0.32 \times 10^{6} \times 20}{4.267 \times 10^{5}} = +15\ \mathrm{MPa}$. Total $52.5\ \mathrm{MPa}$.`,
    tags: ["two-axis-bending"],
  }),
  numeric("p-axial-bending", {
    question: r`A square bar $50\ \mathrm{mm}$ on a side carries an axial **compression** of $50\ \mathrm{kN}$ together with a bending moment $M_z = 0.5\ \mathrm{kN \cdot m}$. What is the stress at the top fibre, $y = +25\ \mathrm{mm}$?`,
    answer: -44, // check: P/A = −50 000/2500 = −20; Iz = 50⁴/12 = 520 833; −Mz y/Iz = −0.5e6×25/520 833 = −24; total −44 MPa
    tolerance: 0.45,
    prefix: r`$\sigma_{xx} =$`,
    suffix: "MPa",
    hint: r`Compression means $P$ is negative. Add $P/A$ to the bending term $-M_z y/I_z$.`,
    explanation: r`$P/A = -50\,000/2500 = -20\ \mathrm{MPa}$. $I_z = 50^4/12 = 5.208 \times 10^{5}\ \mathrm{mm^4}$, so $-\dfrac{M_z y}{I_z} = -\dfrac{0.5 \times 10^{6} \times 25}{5.208 \times 10^{5}} = -24\ \mathrm{MPa}$. Total $-44\ \mathrm{MPa}$.`,
    tags: ["combined-loading"],
  }),
  numeric("p-tau-max", {
    question: r`A rectangular timber beam, $50\ \mathrm{mm}$ wide and $150\ \mathrm{mm}$ deep, carries a shear force of $10\ \mathrm{kN}$. What is the largest shear stress in the section?`,
    answer: 2, // check: 3V/(2A) = 3 × 10 000 / (2 × 7500) = 2.0 MPa
    tolerance: 0.02,
    prefix: r`$\tau_{\max} =$`,
    suffix: "MPa",
    hint: "For a rectangle the peak is one and a half times the average.",
    explanation: r`$\tau_{\max} = \dfrac{3V}{2A} = \dfrac{3 \times 10\,000}{2 \times 50 \times 150} = 2.0\ \mathrm{MPa}$, at the neutral axis.`,
    tags: ["shear-stress"],
  }),
  numeric("p-q", {
    question: r`A rectangular section is $60\ \mathrm{mm}$ wide and $200\ \mathrm{mm}$ tall. What is $Q$ for a cut $50\ \mathrm{mm}$ above the neutral axis? Answer in $\mathrm{mm^3}$.`,
    answer: 225000, // check: area above: 60 × 50 = 3000 mm² (from y = 50 to 100), centroid at y = 75 → Q = 225 000 mm³
    tolerance: 2250,
    prefix: r`$Q =$`,
    suffix: r`$\mathrm{mm^3}$`,
    answerDisplay: r`225\,000\ \mathrm{mm^3}`,
    hint: "The area beyond the cut runs from the cut to the top surface. Find its area and the height of its centroid above the neutral axis.",
    explanation: r`The top of the section is $100\ \mathrm{mm}$ above the neutral axis, so the area beyond the cut is $60 \times 50 = 3000\ \mathrm{mm^2}$, centred at $y = 75\ \mathrm{mm}$. $Q = 3000 \times 75 = 225\,000\ \mathrm{mm^3}$.`,
    tags: ["first-moment"],
  }),
  numeric("p-bolts", {
    question: r`The joint of a built-up beam carries a shear flow of $120\ \mathrm{N/mm}$. Bolts are placed every $75\ \mathrm{mm}$ along it, in a single row. What force does each bolt carry?`,
    answer: 9, // check: F = q s = 120 × 75 = 9000 N = 9 kN
    tolerance: 0.09,
    suffix: "kN",
    hint: "Each bolt collects the shear flow over one spacing.",
    explanation: r`$F = q \times s = 120 \times 75 = 9000\ \mathrm{N} = 9\ \mathrm{kN}$.`,
    tags: ["shear-flow", "fasteners"],
  }),
  multi("p-statements", {
    question: "Which statements are true?",
    choices: [
      ["ei", r`Doubling $EI$ halves every deflection in the standard table.`],
      ["tau-na", "In a rectangular section the shear stress is largest at the neutral axis."],
      ["flow-v", "Shear flow in a joint is proportional to the shear force at that section."],
      ["strength", "Using a stronger material with the same Young's modulus reduces the deflection."],
      ["tau-top", "In a rectangular section the shear stress is largest at the top and bottom."],
    ],
    correct: ["ei", "tau-na", "flow-v"],
    hint: "Check each one against its formula: where does each quantity appear?",
    explanation: r`Deflections are inversely proportional to $EI$. The rectangle's shear stress is a parabola peaking at the neutral axis and zero at the surfaces. Shear flow is $VQ/I$. Strength does not appear in any deflection formula.`,
    tags: ["deflection", "shear-stress", "shear-flow"],
  }),
];

export const sm8: Unit = {
  id: "sm8",
  title: "Beam deflection and shear",
  subtitle: "How far beams move, bending about two axes, and the shear that holds layers together",
  description: "Turn the bending moment into a deflected shape with EI v'' = M, combine axial force with bending about two axes, and find the shear stress and shear flow that the shear force causes.",
  textbook: "Govindjee §8.4–8.6",
  lessons: [l1, l2, l3, l4, l5],
  practice,
  generators: ["gen.sm.beam-deflection", "gen.sm.required-inertia", "gen.sm.two-axis-stress", "gen.sm.rect-shear", "gen.sm.fastener-spacing"],
};
