import type { Unit } from "../types";
import { lesson, matrix, mc, multi, numeric, order, r, reading, tf } from "../dsl";

/*
 * Unit sm2 · Stress (Govindjee ch. 3).
 * Conventions (match the book): sigma_ij = force per area in direction j on the cut whose normal is e_i;
 * oblique cut of a bar: theta = angle between the CUT and the bar AXIS, n = sin(theta) e_x + cos(theta) e_y,
 * t = -cos(theta) e_x + sin(theta) e_y; Cauchy t = sigma^T n; units N, mm, MPa (1 MPa = 1 N/mm^2).
 * Every numeric answer carries a "check:" comment with its arithmetic.
 */

/* ------------------------------------------------------------------ */
/* Lesson 1 · Average normal and shear stress (Govindjee §3.1–3.1.1)   */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "sm2-l1-average-stress",
    unitId: "sm2",
    title: "Average normal and shear stress",
    summary: "Split the force on a cut into normal and tangential parts, and watch one loaded bar show different stresses on differently angled cuts.",
    textbook: "Govindjee §3.1",
    minutes: 14,
  },
  [
    reading(
      "force-on-a-cut",
      r`In Unit 1 stress was force over area, $\sigma = R/A$. That number is really the **average normal stress** on one particular cut. In general the force $\mathbf{F}$ on a section cut of area $A$ is not perpendicular to the cut, so first split it along the cut's unit normal $\mathbf{n}$ and a unit tangent $\mathbf{t}$:

$$F_n = \mathbf{F}\cdot\mathbf{n}, \qquad F_t = \mathbf{F}\cdot\mathbf{t}.$$

Dividing by the area of the cut gives the two **average stresses**:

$$\sigma = \frac{F_n}{A}, \qquad \tau = \frac{F_t}{A}.$$

- $\sigma$ is the **average normal stress** (positive = tension, the cut is pulled apart).
- $\tau$ is the **average shear stress** (the force slides along the cut).

Already one number is not enough: the answer depends on the force *and* on how the cut is oriented. Stress is a **tensor**; "force over area" relates to it roughly the way speed relates to velocity. In the element below the material state is fixed (a pull along $x$). Turn the cut and watch the same state split differently into normal and tangential parts.`,
      {
        title: "Force on a cut",
        visual: { kind: "stress-element", config: { sxx: 150, syy: 0, sxy: 0, cut: { theta: 0, slider: true }, max: 200, unit: "MPa" } },
      },
    ),
    numeric("bolt-stress", {
      question: r`A bolt with a 12 mm diameter shank carries a tensile force of 20 kN. What is the average normal stress on its cross-section, in MPa (three significant figures)?`,
      answer: 176.8, // check: A = π·12²/4 = 113.10 mm²; σ = 20 000 N / 113.10 mm² = 176.84 MPa
      tolerance: 2,
      suffix: "MPa",
      answerDisplay: r`176.8\,\mathrm{MPa}`,
      hint: "On the cross-section the normal points along the bolt, so the whole force is normal to the cut. Work in N and mm² and the answer comes out in MPa directly.",
      explanation: r`On the cross-section $\mathbf{n}$ is along the bolt, so $F_n = 20$ kN and $F_t = 0$. The area is $A = \pi d^2/4 = \pi(12)^2/4 = 113.1\,\mathrm{mm^2}$, so

$$\sigma = \frac{F_n}{A} = \frac{20\,000\,\mathrm{N}}{113.1\,\mathrm{mm^2}} = 176.8\,\mathrm{MPa},$$

and $\tau = 0$ on this particular cut. ($1\,\mathrm{N/mm^2} = 1$ MPa.)`,
      tags: ["average-stress"],
    }),
    numeric("decomp-sigma", {
      body: r`A force $\mathbf{F} = 30\,\mathbf{e}_x + 40\,\mathbf{e}_y$ kN acts on a flat cut of area $A = 400\,\mathrm{mm^2}$. The cut's unit normal is $\mathbf{n} = 0.8\,\mathbf{e}_x + 0.6\,\mathbf{e}_y$ and a unit tangent is $\mathbf{t} = -0.6\,\mathbf{e}_x + 0.8\,\mathbf{e}_y$.`,
      question: r`What is the average normal stress $\sigma$ on the cut, in MPa?`,
      answer: 120, // check: Fn = 30·0.8 + 40·0.6 = 24 + 24 = 48 kN; σ = 48 000 / 400 = 120 MPa
      tolerance: 1,
      suffix: "MPa",
      answerDisplay: r`120\,\mathrm{MPa}`,
      hint: r`Dot the force with the normal first, $F_n = F_x n_x + F_y n_y$, then divide by the area of the cut.`,
      explanation: r`$F_n = \mathbf{F}\cdot\mathbf{n} = 30(0.8) + 40(0.6) = 24 + 24 = 48$ kN, so $\sigma = 48\,000/400 = 120$ MPa. The force has magnitude $|\mathbf{F}| = 50$ kN, but only 48 kN of it pulls straight out of the cut.`,
      tags: ["average-stress", "decomposition"],
    }),
    numeric("decomp-tau", {
      body: r`Same cut: $\mathbf{F} = 30\,\mathbf{e}_x + 40\,\mathbf{e}_y$ kN, $A = 400\,\mathrm{mm^2}$, $\mathbf{n} = 0.8\,\mathbf{e}_x + 0.6\,\mathbf{e}_y$, $\mathbf{t} = -0.6\,\mathbf{e}_x + 0.8\,\mathbf{e}_y$.`,
      question: r`What is the average shear stress $\tau = F_t/A$ on the cut, in MPa?`,
      answer: 35, // check: Ft = 30·(−0.6) + 40·0.8 = −18 + 32 = 14 kN; τ = 14 000 / 400 = 35 MPa; check 48² + 14² = 2500 = 50²
      tolerance: 0.5,
      suffix: "MPa",
      answerDisplay: r`35\,\mathrm{MPa}`,
      hint: r`Same idea with the tangent: $F_t = \mathbf{F}\cdot\mathbf{t}$. You can check both components with Pythagoras, $F_n^2 + F_t^2 = |\mathbf{F}|^2$.`,
      explanation: r`$F_t = \mathbf{F}\cdot\mathbf{t} = 30(-0.6) + 40(0.8) = -18 + 32 = 14$ kN, so $\tau = 14\,000/400 = 35$ MPa. Check: $48^2 + 14^2 = 2304 + 196 = 2500 = 50^2$ ✓.

Had we chosen the opposite tangent $-\mathbf{t}$ we would get $\tau = -35$ MPa: the sign of an average shear stress only means something once the tangent direction is fixed.`,
      tags: ["average-stress", "decomposition"],
    }),
    reading(
      "angled-cut",
      r`Now the classic case (Govindjee §3.1.1). A bar of cross-sectional area $A_0$ is pulled by $\mathbf{F} = F\,\mathbf{e}_x$ along its axis. Cut it with a plane that makes an angle $\theta$ **with the bar axis**, so $\theta = 90^\circ$ is the ordinary cross-section. The book's unit normal and tangent are

$$\mathbf{n} = \sin\theta\,\mathbf{e}_x + \cos\theta\,\mathbf{e}_y, \qquad \mathbf{t} = -\cos\theta\,\mathbf{e}_x + \sin\theta\,\mathbf{e}_y.$$

The force components are $F_n = F\sin\theta$ and $F_t = -F\cos\theta$, and the slanted cut is *larger* than the cross-section, $A = A_0/\sin\theta$. Dividing,

$$\sigma = \frac{F}{A_0}\sin^2\theta, \qquad \tau = -\frac{F}{A_0}\sin\theta\cos\theta.$$

One factor $\sin\theta$ comes from the force component, the other from the bigger area. The element shows the bar's uniaxial state with $F/A_0 = 150$ MPa (60 kN on 400 mm², the bar in the next questions).

> The visual's slider sets the angle of the **normal** $\mathbf{n}$ measured from $+x$, which is $90^\circ - \theta$. At $45^\circ$ the two angles agree.`,
      {
        title: "The angled cut of a bar",
        visual: { kind: "stress-element", config: { sxx: 150, syy: 0, sxy: 0, cut: { theta: 45, slider: true }, max: 200, unit: "MPa" } },
      },
    ),
    numeric("cut-area", {
      body: r`The bar has $A_0 = 400\,\mathrm{mm^2}$ and carries $F = 60$ kN of tension. Make a cut at $\theta = 30^\circ$ to the bar axis.`,
      question: r`What is the area of the slanted cut, in mm²?`,
      answer: 800, // check: A = A0/sin30° = 400/0.5 = 800 mm²
      tolerance: 5,
      suffix: "mm²",
      answerDisplay: r`800\,\mathrm{mm^2}`,
      hint: r`A shallow cut (small $\theta$) slices the bar along a long diagonal. Which function of $\theta$ brings the area back to exactly $A_0$ at $\theta = 90^\circ$?`,
      explanation: r`$A = A_0/\sin\theta = 400/\sin 30^\circ = 400/0.5 = 800\,\mathrm{mm^2}$. A cut at $30^\circ$ to the axis is twice as long as the cross-section, so it has twice the area.`,
      tags: ["oblique-cut"],
    }),
    numeric("sigma-30", {
      body: r`Same bar: $F = 60$ kN, $A_0 = 400\,\mathrm{mm^2}$, cut at $\theta = 30^\circ$ to the axis.`,
      question: r`What is the average normal stress $\sigma$ on the $30^\circ$ cut, in MPa?`,
      answer: 37.5, // check: F/A0 = 60 000/400 = 150 MPa; σ = 150·sin²30° = 150·0.25 = 37.5 MPa (= Fn/A = 30 000/800)
      tolerance: 0.4,
      suffix: "MPa",
      answerDisplay: r`37.5\,\mathrm{MPa}`,
      hint: r`Either use $\sigma = (F/A_0)\sin^2\theta$, or do it from scratch: $F_n = F\sin\theta$ divided by the area you just found.`,
      explanation: r`$F/A_0 = 60\,000/400 = 150$ MPa, so $\sigma = 150\sin^2 30^\circ = 150(0.25) = 37.5$ MPa. From scratch: $F_n = 60\sin 30^\circ = 30$ kN over $800\,\mathrm{mm^2}$ gives $30\,000/800 = 37.5$ MPa ✓.`,
      tags: ["oblique-cut"],
    }),
    numeric("tau-30", {
      body: r`Same bar: $F = 60$ kN, $A_0 = 400\,\mathrm{mm^2}$, cut at $\theta = 30^\circ$ to the axis.`,
      question: r`What is the magnitude $|\tau|$ of the average shear stress on the $30^\circ$ cut, in MPa?`,
      answer: 64.95, // check: |τ| = 150·sin30°·cos30° = 150·0.5·0.8660 = 64.95 MPa (= |Ft|/A = 51 962/800)
      tolerance: 0.7,
      suffix: "MPa",
      answerDisplay: r`64.95\,\mathrm{MPa}`,
      hint: r`$|\tau| = (F/A_0)\sin\theta\cos\theta$. Or: the tangential force has size $F\cos\theta$ and acts on the same $800\,\mathrm{mm^2}$.`,
      explanation: r`$|\tau| = 150\sin 30^\circ\cos 30^\circ = 150(0.5)(0.866) = 64.95$ MPa. Check: $|F_t| = 60\cos 30^\circ = 51.96$ kN and $51\,960/800 = 64.95$ MPa ✓. On this cut the shear stress is much larger than the normal stress (37.5 MPa), even though the bar is "only" in tension.`,
      tags: ["oblique-cut"],
    }),
    mc("tau-sign", {
      question: r`For a bar in tension ($F > 0$) and $0^\circ < \theta < 90^\circ$, the book's formula gives $\tau = -\frac{F}{A_0}\sin\theta\cos\theta < 0$. What does the minus sign mean?`,
      choices: [
        ["minus-t", r`The tangential force on the cut points along $-\mathbf{t}$; with the opposite choice of tangent, $\tau$ would come out positive.`],
        ["compress", "The cut is in compression.", r`Compression would be a negative *normal* stress. Here $\sigma = (F/A_0)\sin^2\theta > 0$: the cut is pulled apart.`],
        ["error", "It is a sign slip in the formula: shear stresses are always positive.", r`Shear components can have either sign. The sign comes straight from $F_t = \mathbf{F}\cdot\mathbf{t} = -F\cos\theta$.`],
        ["smaller", "The shear stress is smaller than the normal stress on that cut.", r`A sign says nothing about size: at $\theta = 30^\circ$, $|\tau| = 65$ MPa while $\sigma = 37.5$ MPa.`],
      ],
      correct: "minus-t",
      hint: r`Compute $F_t = \mathbf{F}\cdot\mathbf{t}$ with $\mathbf{F} = F\,\mathbf{e}_x$ and $\mathbf{t} = -\cos\theta\,\mathbf{e}_x + \sin\theta\,\mathbf{e}_y$. Which way does the force point relative to $\mathbf{t}$?`,
      explanation: r`$F_t = F\,\mathbf{e}_x\cdot(-\cos\theta\,\mathbf{e}_x + \sin\theta\,\mathbf{e}_y) = -F\cos\theta$: the tangential part of the force points opposite to the chosen $\mathbf{t}$. The sign of an average shear stress is tied to the chosen tangent; for design you use $|\tau|$. (In Lesson 3 the two-subscript names fix the direction once and for all.)`,
      tags: ["oblique-cut", "sign-convention"],
    }),
    reading(
      "extremes",
      r`The load is fixed, but the stresses depend on the cut. Where are they largest?

- **Normal stress** $\sigma = (F/A_0)\sin^2\theta$ is largest on the cross-section, $\theta = 90^\circ$: $\sigma_{\max} = F/A_0$, with no shear there.
- **Shear stress** $|\tau| = (F/A_0)\sin\theta\cos\theta = \frac{F}{2A_0}\sin 2\theta$ is largest at $\theta = 45^\circ$: $|\tau|_{\max} = F/(2A_0)$.

Why care? Materials are sensitive to different kinds of stress. Loosely, **brittle** materials (cast iron, concrete, chalk) fail when the *tensile normal* stress is too large, so in tension they snap straight across the cross-section. **Ductile** materials (mild steel, aluminium) yield by *shear*, so slip happens on planes near $45^\circ$ to the load; the $45^\circ$ shear lip of a cup-and-cone fracture is the visible trace.`,
      { title: "Which cut is worst?" },
    ),
    mc("max-shear-angle", {
      question: r`On which cut is $|\tau|$ largest, and how large is it there?`,
      choices: [
        ["45-half", r`$\theta = 45^\circ$, $|\tau|_{\max} = F/(2A_0)$`],
        ["45-full", r`$\theta = 45^\circ$, $|\tau|_{\max} = F/A_0$`, r`At $45^\circ$, $\sin\theta\cos\theta = \tfrac12$, so a factor $\tfrac12$ survives.`],
        ["90-full", r`$\theta = 90^\circ$, $|\tau|_{\max} = F/A_0$`, r`$\theta = 90^\circ$ is the cross-section, where $\cos\theta = 0$: no shear at all. $F/A_0$ is the largest *normal* stress.`],
        ["30", r`$\theta = 30^\circ$, $|\tau|_{\max} = 0.433\,F/A_0$`, r`$0.433\,F/A_0$ is the value at $30^\circ$ (and at $60^\circ$), but $\sin\theta\cos\theta$ keeps growing until $45^\circ$.`],
      ],
      correct: "45-half",
      shuffle: true,
      hint: r`Rewrite $\sin\theta\cos\theta = \tfrac12\sin 2\theta$. Where does $\sin 2\theta$ peak, and what is its peak value?`,
      explanation: r`$|\tau| = \frac{F}{A_0}\sin\theta\cos\theta = \frac{F}{2A_0}\sin 2\theta$, which peaks when $2\theta = 90^\circ$, i.e. $\theta = 45^\circ$, with value $F/(2A_0)$: half the largest normal stress.`,
      tags: ["oblique-cut", "extremes"],
    }),
    numeric("max-shear-value", {
      body: r`The bar again: $F = 60$ kN, $A_0 = 400\,\mathrm{mm^2}$.`,
      question: r`What is the largest average shear stress on **any** cut through the bar, in MPa?`,
      answer: 75, // check: |τ|max = F/(2A0) = 60 000/(2·400) = 75 MPa at θ = 45°
      tolerance: 0.5,
      suffix: "MPa",
      answerDisplay: r`75\,\mathrm{MPa}`,
      hint: r`You don't need to try angles: the maximum of $|\tau|$ over all cuts has a closed form in terms of $F/A_0$.`,
      explanation: r`$|\tau|_{\max} = F/(2A_0) = 60\,000/800 = 75$ MPa, on the $45^\circ$ cut. Compare: the largest normal stress is $F/A_0 = 150$ MPa on the cross-section, and the $30^\circ$ cut had 64.95 MPa of shear.`,
      tags: ["oblique-cut", "extremes"],
    }),
    tf("half-at-45", {
      statement: r`On the $45^\circ$ cut, the normal stress is exactly half of $F/A_0$.`,
      answer: true,
      feedback: r`Evaluate $\sin^2\theta$ at $45^\circ$.`,
      hint: r`$\sigma = (F/A_0)\sin^2\theta$. What is $\sin 45^\circ$?`,
      explanation: r`True: $\sin^2 45^\circ = (1/\sqrt2)^2 = \tfrac12$, so $\sigma = \tfrac12 F/A_0$, the same size as $|\tau| = F/(2A_0)$ on that cut. For the 60 kN bar both are 75 MPa.`,
      tags: ["oblique-cut"],
    }),
    mc("no-shear-cut", {
      question: "On which cuts through an axially loaded bar is the average shear stress zero?",
      choices: [
        ["cross", r`On the cross-section, $\theta = 90^\circ$ (and in the limit $\theta \to 0$, a cut parallel to the axis, which carries no stress at all).`],
        ["45", r`On the $45^\circ$ cut.`, "That is where the shear stress is largest, not zero."],
        ["none", "On none of them: every cut carries some shear.", r`Check $\theta = 90^\circ$: $\cos 90^\circ = 0$.`],
        ["all", "On all of them: an axial load produces no shear.", r`The $30^\circ$ cut above carried 65 MPa of shear. An axial load leaves the *cross-section* free of shear, not every cut.`],
      ],
      correct: "cross",
      hint: r`$\tau \propto \sin\theta\cos\theta$. For which angles between $0^\circ$ and $90^\circ$ is that product zero?`,
      explanation: r`$\sin\theta\cos\theta = 0$ only at $\theta = 90^\circ$ (the cross-section, where all of $F$ is normal) and at $\theta = 0$ (a cut along the axis, where $\sigma = 0$ too: neighbouring fibres of a pulled bar don't push on each other). Every other cut carries both normal and shear stress.`,
      tags: ["oblique-cut"],
    }),
    mc("brittle-ductile", {
      question: "A cast-iron bar and a mild-steel bar are each pulled in tension until they fail. Which description fits best?",
      choices: [
        ["right", r`Cast iron breaks straight across the cross-section (largest normal stress); mild steel slips on planes near $45^\circ$ (largest shear).`],
        ["swapped", r`Cast iron breaks at $45^\circ$; mild steel breaks straight across.`, "That's swapped: brittle materials are sensitive to tensile normal stress, which peaks on the cross-section."],
        ["same-90", r`Both break on the cross-section, where the stress is $F/A_0$.`, r`The *normal* stress peaks there, but ductile metals respond to shear, which peaks at $45^\circ$.`],
        ["area", r`Both fail on the cut with the largest area.`, r`The cut area $A_0/\sin\theta$ is largest for shallow cuts, where both stresses are small. Area alone doesn't decide failure.`],
      ],
      correct: "right",
      shuffle: true,
      hint: "Which kind of stress does each class of material respond to, and on which cut is that stress largest?",
      explanation: r`Brittle materials (cast iron, concrete) fail in tension on the plane of largest **normal** stress: the cross-section, $\sigma = F/A_0$. Ductile metals yield by **shear**, largest at $45^\circ$ where $|\tau| = F/(2A_0)$, which is why ductile fracture surfaces show $45^\circ$ shear lips.`,
      tags: ["failure", "extremes"],
    }),
    reading(
      "summary",
      r`**What you did:** split the force on a cut into normal and tangential parts, computed average stresses on cross-sections and on slanted cuts of a bar, and found the worst cuts.

**Formulas:**

$$F_n = \mathbf{F}\cdot\mathbf{n}, \qquad F_t = \mathbf{F}\cdot\mathbf{t}, \qquad \sigma = \frac{F_n}{A}, \qquad \tau = \frac{F_t}{A}$$

For a bar under $F$, cut at $\theta$ to the axis ($\mathbf{n} = \sin\theta\,\mathbf{e}_x + \cos\theta\,\mathbf{e}_y$):

$$A = \frac{A_0}{\sin\theta}, \qquad \sigma = \frac{F}{A_0}\sin^2\theta, \qquad \tau = -\frac{F}{A_0}\sin\theta\cos\theta$$

- $\sigma_{\max} = F/A_0$ at $\theta = 90^\circ$, the cross-section (no shear there).
- $|\tau|_{\max} = F/(2A_0)$ at $\theta = 45^\circ$ (where $\sigma = F/2A_0$ too).
- Brittle: watch tensile $\sigma$. Ductile: watch $|\tau|$.

Next: use average stresses to size keys, welds, pins and glue joints.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Design with average stresses (Govindjee §3.1.2)          */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "sm2-l2-design-with-average-stresses",
    unitId: "sm2",
    title: "Design with average stresses",
    summary: "The four-step recipe for determinate parts, applied to a lever, shear keys, fillet welds, pins in single and double shear, and glued joints.",
    textbook: "Govindjee §3.1.2",
    minutes: 15,
  },
  [
    reading(
      "four-steps",
      r`For a statically determinate structure, average stresses already give a quick and very useful design check (Govindjee §3.1.2):

1. Use equilibrium (statics) to find the **support reactions**.
2. Make section cuts and find the **internal forces** on them.
3. Resolve each internal force into its **normal and tangential** components on the cut.
4. Divide by the area of the cut to get the **average normal and shear stresses**.

Then compare with the material. The book's **safety factor** is $SF = \sigma_a/\sigma_d$: the allowable (failure, e.g. yield) stress of the material over the design stress your analysis computes. So a design is acceptable when

$$\sigma_d \le \frac{\sigma_Y}{SF}, \qquad \tau_d \le \frac{\tau_Y}{SF}.$$

The skill is in steps 2–3: finding the cut that carries the force over the **smallest** area.`,
      { title: "A recipe for determinate parts" },
    ),
    order("order-four-steps", {
      question: "Put the steps of an average-stress design check in order.",
      items: [
        ["reactions", "Find the support reactions from equilibrium of the whole structure"],
        ["internal", "Cut the part and find the internal force on the cut"],
        ["resolve", "Resolve the internal force into components normal and tangential to the cut"],
        ["stresses", "Divide by the cut area to get the average normal and shear stresses"],
        ["compare", "Compare with the failure stress divided by the safety factor"],
      ],
      hint: "You can't find the force on a cut before you know every force acting on the free body, and you can't compare a stress you haven't computed.",
      explanation: r`Reactions → internal forces → normal/tangential components → average stresses $\sigma = F_n/A$, $\tau = F_t/A$ → check $\sigma \le \sigma_Y/SF$ and $\tau \le \tau_Y/SF$. Steps 1–2 are pure statics; steps 3–4 are the new part.`,
      tags: ["design-procedure"],
    }),
    numeric("lever-rod", {
      body: r`A rigid horizontal bar $ABC$ is pinned to a wall at $A$ and held up by a vertical steel rod attached at $B$, $1.2$ m from $A$ (the rod's top end is fixed to the ceiling). A load $P = 9$ kN hangs from the free end $C$, $1.8$ m from $A$. The rod has a diameter of 10 mm.`,
      question: "What is the average normal stress in the rod, in MPa?",
      answer: 171.9, // check: ΣM_A: T·1.2 = 9·1.8 ⇒ T = 13.5 kN; A = π·10²/4 = 78.54 mm²; σ = 13 500/78.54 = 171.9 MPa
      tolerance: 2,
      suffix: "MPa",
      answerDisplay: r`171.9\,\mathrm{MPa}`,
      hint: "Step 1 first: take moments about the pin A to find the rod force. It is not 9 kN.",
      explanation: r`1. Moments about $A$: $T(1.2) = 9(1.8)$, so $T = 13.5$ kN. (The pin at $A$ then pulls the bar down with $13.5 - 9 = 4.5$ kN.)
2. A cut across the rod carries $R = T = 13.5$ kN of tension.
3. That force is entirely normal to the rod's cross-section.
4. $\sigma = 13\,500/(\pi\cdot 10^2/4) = 13\,500/78.54 = 171.9$ MPa.

The lever amplifies the load by $1.8/1.2 = 1.5$: always do the statics before the stresses.`,
      tags: ["design-procedure", "average-stress"],
    }),
    reading(
      "shear-key",
      r`**Example: a shear key.** A gear is locked to a drive shaft of radius $R$ by two **shear keys**, each of length $L$ (along the shaft) and width $t$. Keys are designed as the weakest link, so an overload shears a cheap key instead of the shaft or the gear.

Cut both keys at the shaft surface and isolate the shaft with half of each key. Each key half carries a tangential force $F$ at lever arm $R$, so moment equilibrium about the shaft axis gives $2FR = M$. That force acts parallel to a key surface of area $Lt$:

$$\tau = \frac{F}{Lt} = \frac{M}{2LRt}.$$

With the key's shear yield stress $\tau_Y$ and a safety factor, $\tau \le \tau_Y/SF$, so the largest torque the keys may transmit is

$$M_{\max} = \frac{2LRt\,\tau_Y}{SF}.$$`,
      { title: "Shear keys" },
    ),
    numeric("shear-key-torque", {
      body: r`Two keys, each $L = 20$ mm long and $t = 5$ mm wide, lock a gear to a shaft of radius $R = 15$ mm. The key steel yields in shear at $\tau_Y = 150$ MPa and the design uses $SF = 3$.`,
      question: "What is the largest torque the shaft may transmit through the keys, in N·m?",
      answer: 150, // check: Mmax = 2·L·R·t·τY/SF = 2·20·15·5·150/3 = 150 000 N·mm = 150 N·m
      tolerance: 1.5,
      suffix: "N·m",
      answerDisplay: r`150\,\mathrm{N\,m}`,
      hint: r`Work in N and mm, then convert: $1\,\mathrm{N\,m} = 1000\,\mathrm{N\,mm}$. Two keys share the torque, each through a force at lever arm $R$.`,
      explanation: r`$M_{\max} = \dfrac{2LRt\,\tau_Y}{SF} = \dfrac{2(20)(15)(5)(150)}{3} = \dfrac{450\,000}{3} = 150\,000$ N·mm $= 150$ N·m.

Check: each key then carries $F = M/(2R) = 150\,000/30 = 5000$ N on $Lt = 100\,\mathrm{mm^2}$, so $\tau = 50$ MPa $= \tau_Y/3$ ✓.`,
      tags: ["shear-key", "design"],
    }),
    reading(
      "welds-and-pins",
      r`**Fillet welds.** Two overlapping plates are joined by two $45^\circ$ fillet welds of length $L$ and leg width $w$. Pulling with $P$, equilibrium of a cut through both welds says each weld carries $P/2$ in shear. The obvious area $Lw$ is *not* the critical one: of all the cuts through a weld, the one through the **throat** has the smallest area, $Lt$ with $t = w/\sqrt2$. So

$$\tau = \frac{P/2}{Lt}, \qquad P_a = 2\,\tau_Y\,L\,t, \qquad t = \frac{w}{\sqrt2}.$$

**Pins and bolts.** A pin joining two lapped plates is cut on one plane (**single shear**). In a clevis (a fork on one member, a tongue on the other) the pin is cut on two planes (**double shear**) and each plane carries $F/2$:

$$\tau_{\text{single}} = \frac{F}{A}, \qquad \tau_{\text{double}} = \frac{F}{2A}, \qquad A = \frac{\pi d^2}{4}.$$

**Glued lap joints** work the same way: count the glue planes, share the load among them, and use the area that is actually glued.`,
      { title: "Welds and pins: find the smallest area" },
    ),
    mc("weld-governs", {
      question: "To find the shear stress that limits a fillet weld, which cut through the weld do you use?",
      choices: [
        ["throat", r`The cut through the throat, area $Lw/\sqrt2$: the smallest area carrying the force gives the largest average stress.`],
        ["leg", r`The cut along a leg, area $Lw$, where the weld meets the plate.`, "That cut is real, but it isn't critical: the same force over a smaller area gives a larger stress."],
        ["largest", "The cut with the largest area, because it carries the most force.", r`Every cut through one weld carries the same force $P/2$; the stress is largest where the area is smallest.`],
        ["plate", "A cut through the plate, because the weld is stronger than the plate.", "The question is about the weld; the plate is checked separately, in tension."],
      ],
      correct: "throat",
      shuffle: true,
      hint: "All the cuts through one weld carry the same force. Which one makes the stress largest?",
      explanation: r`Each weld carries $P/2$ no matter how you cut it, so the critical cut is the one with the least area: the throat, $t = w/\sqrt2$ for a $45^\circ$ fillet, area $Lt = Lw/\sqrt2$. Using $Lw$ would overestimate the capacity by $\sqrt2 \approx 41\%$.`,
      tags: ["weld", "design"],
    }),
    numeric("weld-load", {
      body: r`Two plates are joined by two $45^\circ$ fillet welds, each $L = 50$ mm long with leg width $w = 6$ mm. The weld metal yields in shear at $\tau_Y = 140$ MPa.`,
      question: "What is the allowed load $P_a$ (no extra safety factor), in kN?",
      answer: 59.4, // check: t = 6/√2 = 4.243 mm; Pa = 2·τY·L·t = 2·140·50·4.243 = 59 397 N = 59.4 kN
      tolerance: 0.6,
      suffix: "kN",
      answerDisplay: r`59.4\,\mathrm{kN}`,
      hint: r`Each weld carries $P/2$ over its throat area $Lt$, with $t = w/\sqrt2$.`,
      explanation: r`Throat $t = 6/\sqrt2 = 4.243$ mm, so each weld's critical area is $Lt = 50(4.243) = 212.1\,\mathrm{mm^2}$. Setting $\tau = (P/2)/(Lt) = \tau_Y$:

$$P_a = 2\tau_Y L t = 2(140)(212.1) = 59\,400\,\mathrm{N} = 59.4\,\mathrm{kN}.$$

Using the leg area $Lw$ instead would give 84 kN, an unsafe overestimate.`,
      tags: ["weld", "design"],
    }),
    numeric("pin-double", {
      body: r`A clevis pin of diameter $d = 16$ mm transmits a load $F = 40$ kN and is in **double shear**.`,
      question: "What is the average shear stress in the pin, in MPa?",
      answer: 99.47, // check: A = π·16²/4 = 201.06 mm²; τ = (40 000/2)/201.06 = 99.47 MPa
      tolerance: 1,
      suffix: "MPa",
      answerDisplay: r`99.5\,\mathrm{MPa}`,
      hint: "How many shear planes cut the pin, and how much of F does each one carry?",
      explanation: r`$A = \pi(16)^2/4 = 201.1\,\mathrm{mm^2}$. Two shear planes each carry $F/2 = 20$ kN, so $\tau = 20\,000/201.1 = 99.5$ MPa.`,
      tags: ["pin", "double-shear"],
    }),
    numeric("pin-single", {
      body: r`The same 16 mm pin and the same 40 kN load are now used in a lap joint: two plates overlap and the pin is cut on **one** plane (single shear).`,
      question: "What is the average shear stress in the pin now, in MPa?",
      answer: 198.9, // check: τ = 40 000/201.06 = 198.94 MPa
      tolerance: 2,
      suffix: "MPa",
      answerDisplay: r`198.9\,\mathrm{MPa}`,
      hint: "One shear plane must carry the whole load.",
      explanation: r`With one shear plane the full 40 kN crosses $201.1\,\mathrm{mm^2}$: $\tau = 40\,000/201.1 = 198.9$ MPa, twice the double-shear value. A clevis is the cheap way to halve the pin stress.`,
      tags: ["pin", "single-shear"],
    }),
    tf("double-half", {
      statement: "For the same pin and the same load, the average shear stress in double shear is half of that in single shear.",
      answer: true,
      feedback: "Count the planes that share the load.",
      hint: "In double shear, how many cross-sections of the pin carry the load at the same time?",
      explanation: r`True. In double shear two cross-sections of the pin share the load, each carrying $F/2$: $\tau = F/(2A)$ versus $F/A$ in single shear (99.5 vs 198.9 MPa above).`,
      tags: ["pin", "double-shear"],
    }),
    numeric("pin-diameter", {
      body: r`A pin in double shear must carry $F = 30$ kN, and its average shear stress may not exceed $80$ MPa.`,
      question: "What is the smallest pin diameter that works, in mm?",
      answer: 15.45, // check: A ≥ (30 000/2)/80 = 187.5 mm²; d = √(4·187.5/π) = √238.7 = 15.45 mm
      tolerance: 0.15,
      suffix: "mm",
      answerDisplay: r`15.45\,\mathrm{mm}`,
      hint: r`First find the area each shear plane needs, $A = (F/2)/\tau$, then solve $A = \pi d^2/4$ for $d$.`,
      explanation: r`Each plane carries $15$ kN, so $A \ge 15\,000/80 = 187.5\,\mathrm{mm^2}$. Then $d = \sqrt{4A/\pi} = \sqrt{4(187.5)/\pi} = \sqrt{238.7} = 15.45$ mm. In practice you would pick the next standard size up, e.g. 16 mm.`,
      tags: ["pin", "double-shear", "design"],
    }),
    numeric("glue-three-plates", {
      body: r`A lap joint is made by gluing three plates: a middle plate pulled by $P$ is sandwiched between two outer plates, each pulled back by $P/2$. Each of the two glue layers covers $L \times w$ with $L = 100$ mm and $w = 40$ mm. The glue can carry a shear stress of at most $\tau_{\max} = 2$ MPa, and the design uses a safety factor $SF = 2$.`,
      question: "What is the largest allowed load $P$, in kN?",
      answer: 8, // check: each glue plane carries P/2; (P/2)/(L·w) ≤ τmax/SF ⇒ P ≤ 2·τmax·L·w/SF = 2·2·100·40/2 = 8000 N = 8 kN
      tolerance: 0.08,
      suffix: "kN",
      answerDisplay: r`8\,\mathrm{kN}`,
      hint: r`How many glue planes share the load, and what force does each carry? The stress on each may be at most $\tau_{\max}/SF$.`,
      explanation: r`Each glue layer carries $P/2$ in shear over $Lw = 100(40) = 4000\,\mathrm{mm^2}$. Require

$$\frac{P/2}{Lw} \le \frac{\tau_{\max}}{SF} \quad\Rightarrow\quad P \le \frac{2\,\tau_{\max}\,L\,w}{SF} = \frac{2(2)(4000)}{2} = 8000\,\mathrm{N} = 8\,\mathrm{kN}.$$

With $SF = 2$ the formula collapses to $P = \tau_{\max} L w$.`,
      tags: ["lap-joint", "design"],
    }),
    mc("glue-narrow", {
      body: r`Same three-plate joint ($L = 100$ mm, $\tau_{\max} = 2$ MPa, $SF = 2$), but now the two outer plates are only 30 mm wide while the middle plate is still 40 mm wide. Glue only bonds where the plates overlap.`,
      question: "What is the largest allowed load now?",
      choices: [
        ["6", "6 kN"],
        ["8", "8 kN", "Glue only bonds where the plates overlap: each glued area is now 100 mm × 30 mm, not 100 mm × 40 mm."],
        ["3", "3 kN", r`There are two glue layers, each carrying $P/2$, not one layer carrying $P$.`],
        ["12", "12 kN", r`That is $2\tau_{\max}Lw$ without the safety factor of 2.`],
      ],
      correct: "6",
      shuffle: true,
      hint: "Which width sets the glued area of each layer?",
      explanation: r`Each layer now bonds $100 \times 30 = 3000\,\mathrm{mm^2}$. With two layers each carrying $P/2$: $(P/2)/3000 \le 2/2 = 1$ MPa, so $P \le 6000$ N $= 6$ kN. The narrower plate sets the glued area.`,
      tags: ["lap-joint", "design"],
    }),
    numeric("scarf-joint", {
      body: r`Two pieces of a $50 \times 50$ mm timber bar are glued end to end along a slanted **scarf joint** whose plane makes $\theta = 30^\circ$ with the bar axis. The glue line can carry at most $3$ MPa in shear and $4$ MPa in normal tension.`,
      question: "What is the largest axial tensile force the joint can carry, in kN?",
      answer: 17.32, // check: A0 = 2500 mm²; shear: F ≤ 3·2500/(sin30°·cos30° = 0.4330) = 17 321 N; normal: F ≤ 4·2500/sin²30° = 40 000 N; shear governs ⇒ 17.32 kN
      tolerance: 0.2,
      suffix: "kN",
      answerDisplay: r`17.3\,\mathrm{kN}`,
      hint: r`The glue line is an oblique cut. Write $\sigma$ and $|\tau|$ on it in terms of $F/A_0$, impose each limit separately, and keep the smaller force.`,
      explanation: r`With $A_0 = 2500\,\mathrm{mm^2}$ and $\theta = 30^\circ$ (Lesson 1):

- Shear: $|\tau| = \frac{F}{A_0}\sin\theta\cos\theta \le 3$ gives $F \le \frac{3(2500)}{0.5(0.866)} = 17\,320$ N.
- Normal: $\sigma = \frac{F}{A_0}\sin^2\theta \le 4$ gives $F \le \frac{4(2500)}{0.25} = 40\,000$ N.

Shear governs: $F_{\max} = 17.3$ kN. A shallow scarf keeps the normal stress low, which is why it is used, but the shear on the glue then decides the design.`,
      tags: ["oblique-cut", "lap-joint", "design"],
    }),
    reading(
      "summary",
      r`**What you did:** sized parts with the four-step recipe: reactions, internal forces, normal/tangential split, average stresses, then the safety-factor check.

**Formulas:**

$$SF = \frac{\sigma_a}{\sigma_d}, \qquad \tau \le \frac{\tau_Y}{SF}$$

$$\text{shear key: } \tau = \frac{M}{2LRt}, \quad M_{\max} = \frac{2LRt\,\tau_Y}{SF} \qquad \text{fillet weld: } t = \frac{w}{\sqrt2}, \quad P_a = 2\tau_Y L t$$

$$\text{pins: } \tau_{\text{single}} = \frac{F}{A}, \quad \tau_{\text{double}} = \frac{F}{2A}, \quad A = \frac{\pi d^2}{4}$$

- Glued lap joints: share the load among the glue planes; use the area that is actually bonded.
- Always look for the cut with the **smallest** area: it gives the largest average stress.

Next: average stresses cannot describe a cut that carries a moment. We need stress at a point.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Stress at a point: the tensor (Govindjee §3.2–3.2.1)     */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "sm2-l3-stress-at-a-point",
    unitId: "sm2",
    title: "Stress at a point: the tensor",
    summary: "Shrink the cut to a point, name each stress component with two subscripts (cut, then direction), and write the stress matrix.",
    textbook: "Govindjee §3.2–3.2.1",
    minutes: 14,
  },
  [
    reading(
      "cut-to-point",
      r`Average stresses can't describe a cut that carries a **moment**. A pure moment $M$ on a cut has no net force, so "force over area" gives zero, yet the material is clearly stressed. The moment is carried by a *distribution* of forces that varies over the cut. One statically equivalent picture (Govindjee Fig. 3.6): on a cut of height $h$, a pull and a push of size $2M/h$ at the quarter points $\pm h/4$, a lever arm of $h/2$ apart.

To capture such variations, chop the cut into small patches. Patch $k$ has area $\Delta A_k$ and carries a force $\Delta\mathbf{F}_k$, with $\sum_k \Delta\mathbf{F}_k = \mathbf{F}$ and $\sum_k \Delta A_k = A$. On each patch define

$$\sigma = \frac{\Delta F_n}{\Delta A}, \qquad \tau = \frac{\Delta F_t}{\Delta A},$$

with $\mathbf{n}$ the patch's outward normal and $\mathbf{t}$ a tangent direction. Let $\Delta A \to 0$: the patches shrink to points and we get the **stress at a point**, which can vary from point to point over the cut.`,
      { title: "From a cut to a point" },
    ),
    numeric("equivalent-forces", {
      body: r`A rectangular cut of height $h = 200$ mm carries an internal moment $M = 6$ kN·m and no net force.`,
      question: r`If the moment is represented by two equal and opposite forces acting at $y = +h/4$ and $y = -h/4$, how large is each force, in kN?`,
      answer: 60, // check: separation of the forces = h/2 = 100 mm; F = M/(h/2) = 2M/h = 2·6×10⁶ N·mm / 200 mm = 60 000 N = 60 kN
      tolerance: 0.6,
      suffix: "kN",
      answerDisplay: r`60\,\mathrm{kN}`,
      hint: r`Two equal and opposite forces $F$ a distance $d$ apart form a couple of moment $Fd$. How far apart are the quarter points? Keep units consistent (N and mm).`,
      explanation: r`The forces sit at $\pm h/4$, so they are $h/2 = 100$ mm apart. A couple: $M = F\,(h/2)$, so

$$F = \frac{2M}{h} = \frac{2(6\times10^6\,\mathrm{N\,mm})}{200\,\mathrm{mm}} = 60\,000\,\mathrm{N} = 60\,\mathrm{kN}.$$

Infinitely many other distributions (a linear one, say) carry the same moment. Which one actually acts is decided by how the body deforms, which is why we need the stress at every point and not just totals.`,
      tags: ["stress-at-a-point", "resultants"],
    }),
    reading(
      "two-subscripts",
      r`At a point there are infinitely many cuts, but the stresses on **three mutually orthogonal cuts** (two in 2-D) determine the stresses on every other cut through that point. Each component carries two subscripts:

$$\sigma_{ij}: \qquad i = \text{normal of the cut}, \qquad j = \text{direction of the force component}.$$

- $\sigma_{xx}$: normal stress on the cut whose normal is $\mathbf{e}_x$.
- $\sigma_{xy}$: shear stress in the $y$-direction on the cut whose normal is $\mathbf{e}_x$. With numbered axes, $\sigma_{12}$ is the shear in the 2-direction on the 1-cut.
- For unequal subscripts you will also see $\tau_{xy} \equiv \sigma_{xy}$; for equal ones, $\sigma_x \equiv \sigma_{xx}$.

The components are reported in a matrix with **row = cut, column = force direction**:

$$\boldsymbol{\sigma} = \begin{bmatrix} \sigma_{xx} & \sigma_{xy} & \sigma_{xz} \\ \sigma_{yx} & \sigma_{yy} & \sigma_{yz} \\ \sigma_{zx} & \sigma_{zy} & \sigma_{zz} \end{bmatrix}.$$

In pictures: on a **positive face** (outward normal along $+x$, $+y$ or $+z$) a positive component points in the **positive** coordinate direction; on a **negative face** a positive component points the **negative** way. Try the sliders: positive $\sigma_{xy}$ pushes the right face up and the left face down.`,
      {
        title: "Two subscripts: cut, then direction",
        visual: { kind: "stress-element", config: { sxx: 50, syy: -20, sxy: 30, sliders: true, max: 100, unit: "MPa" } },
      },
    ),
    mc("syx-meaning", {
      question: r`By definition, what does $\sigma_{yx}$ describe?`,
      choices: [
        ["right", r`The force per area in the $x$-direction on the cut whose normal is $\mathbf{e}_y$`],
        ["swap", r`The force per area in the $y$-direction on the cut whose normal is $\mathbf{e}_x$`, r`That is the definition of $\sigma_{xy}$. First subscript = cut normal, second = force direction. (Lesson 5 shows the two are equal in value, but they are defined on different cuts.)`],
        ["zx", r`The force per area in the $x$-direction on the cut whose normal is $\mathbf{e}_z$`, r`That is $\sigma_{zx}$: its cut has normal $\mathbf{e}_z$.`],
        ["normal", r`The normal stress on the cut whose normal is $\mathbf{e}_y$`, r`That is $\sigma_{yy}$: normal stresses have repeated subscripts.`],
      ],
      correct: "right",
      shuffle: true,
      hint: "Read the subscripts in order: the first names the cut (through its normal), the second names the direction of the force.",
      explanation: r`$\sigma_{yx}$: first subscript $y$, so the cut has normal $\mathbf{e}_y$ (a horizontal cut in a 2-D picture); second subscript $x$, so it is the $x$-component of the force per unit area on that cut, a shear stress.`,
      tags: ["nomenclature"],
    }),
    mc("entry-zx", {
      question: r`By the naming convention, which symbol and matrix position belong to the shear stress in the $x$-direction on the cut whose normal is $\mathbf{e}_z$?`,
      choices: [
        ["zx", r`$\sigma_{zx}$, row 3, column 1`],
        ["xz", r`$\sigma_{xz}$, row 1, column 3`, r`Row (first subscript) is the cut, column (second) is the direction. The cut has normal $\mathbf{e}_z$, so it is row 3.`],
        ["zz", r`$\sigma_{zz}$, row 3, column 3`, r`$\sigma_{zz}$ is the *normal* stress on the $z$-cut, not a shear.`],
        ["xx", r`$\sigma_{xx}$, row 1, column 1`, r`$\sigma_{xx}$ is the normal stress on the $x$-cut.`],
      ],
      correct: "zx",
      shuffle: true,
      hint: "Cut first, direction second; in the matrix, the row is the cut and the column the direction.",
      explanation: r`Cut normal $\mathbf{e}_z$ → first subscript $z$ → row 3. Force direction $x$ → second subscript $x$ → column 1. So it is $\sigma_{zx}$ in row 3, column 1. (By symmetry it will equal $\sigma_{xz}$ in value, but the component *on the z-cut* is named $\sigma_{zx}$.)`,
      tags: ["nomenclature", "stress-matrix"],
    }),
    tf("tau-sigma-same", {
      statement: r`$\tau_{xy}$ and $\sigma_{xy}$ denote the same stress component.`,
      answer: true,
      feedback: r`The letter $\tau$ is just a common alternative for shear components.`,
      hint: "Is the choice of Greek letter part of the definition, or just a label for shear components?",
      explanation: r`True. $\tau$ is commonly used instead of $\sigma$ when the subscripts are unequal (shear components): $\tau_{xy} \equiv \sigma_{xy}$. The subscripts carry all the information.`,
      tags: ["nomenclature"],
    }),
    tf("negative-face", {
      statement: r`On the face of an element whose outward normal is $-\mathbf{e}_x$, a positive $\sigma_{xx}$ is drawn as an arrow pointing in the $+x$ direction.`,
      answer: false,
      feedback: "Positive normal stress is tension. Which way does tension pull on the left face of an element?",
      hint: "Positive normal stress is tension. Picture a small square being pulled apart along x: which way does the pull act on its left face?",
      explanation: r`False. Positive $\sigma_{xx}$ is tension, so on both $x$-faces the arrows point away from the element: $+x$ on the right face, $-x$ on the left face (outward normal $-\mathbf{e}_x$). A positive component points the positive way only on a positive face. This is Newton's third law across a cut: the two sides of a cut act on each other with equal and opposite tractions.`,
      tags: ["sign-convention"],
    }),
    mc("positive-shear", {
      question: r`Which arrangement of arrows is a **positive** $\tau_{xy}$ (with $\tau_{yx} = \tau_{xy}$) on a square element?`,
      choices: [
        ["pos", "Right face: arrow up (+y). Left face: arrow down (−y). Top face: arrow to the right (+x). Bottom face: arrow to the left (−x)."],
        ["neg", "Right face: down. Left face: up. Top face: to the left. Bottom face: to the right.", r`Every arrow is reversed: that is a *negative* $\tau_{xy}$.`],
        ["spin", "Right face: up. Left face: down. Top face: to the left. Bottom face: to the right.", r`These four arrows all turn the element the same way, so it would spin. With $\tau_{yx} = \tau_{xy} > 0$ the top-face arrow must point $+x$.`],
        ["normal", "All four arrows point outward, perpendicular to the faces.", "Arrows perpendicular to the faces are normal stresses (tension in x and in y), not shear."],
      ],
      correct: "pos",
      shuffle: true,
      hint: r`Start with the right face: its outward normal is $+\mathbf{e}_x$, so which way does a positive $\tau_{xy}$ point there, and what changes on the left face, whose normal is $-\mathbf{e}_x$? Then ask the same about $\tau_{yx}$ on the top and bottom faces.`,
      explanation: r`On the right face (normal $+\mathbf{e}_x$) positive $\tau_{xy}$ points $+y$; on the left face (normal $-\mathbf{e}_x$) it points $-y$. On the top face (normal $+\mathbf{e}_y$) positive $\tau_{yx}$ points $+x$; on the bottom face, $-x$. The pairs form two opposite couples that balance, and the element is stretched along the diagonal from bottom-left to top-right.`,
      tags: ["sign-convention", "shear"],
    }),
    matrix("write-2d", {
      question: r`Write the 2-D stress matrix $\begin{bmatrix}\sigma_{xx} & \sigma_{xy} \\ \sigma_{yx} & \sigma_{yy}\end{bmatrix}$ for $\sigma_{xx} = 40$ MPa, $\sigma_{yy} = -20$ MPa, $\tau_{xy} = 15$ MPa (entries in MPa).`,
      answer: [
        [40, 15],
        [15, -20],
      ], // check: row x = (σxx, σxy) = (40, 15); row y = (σyx, σyy) = (15, −20) with σyx = τxy = 15
      tolerance: 0.01,
      prefix: r`$\boldsymbol{\sigma} =$`,
      hint: r`Row = cut, column = direction. The off-diagonal entries are the shear stresses, and $\sigma_{yx} = \tau_{xy}$.`,
      explanation: r`Row 1 is the $x$-cut: $(\sigma_{xx}, \sigma_{xy}) = (40, 15)$. Row 2 is the $y$-cut: $(\sigma_{yx}, \sigma_{yy}) = (15, -20)$. The matrix is symmetric, and the negative $\sigma_{yy}$ means compression in $y$.`,
      tags: ["stress-matrix"],
    }),
    numeric("y-cut-normal", {
      body: r`At a point, $\boldsymbol{\sigma} = \begin{bmatrix} 40 & -10 & 0 \\ -10 & 25 & 15 \\ 0 & 15 & -30 \end{bmatrix}$ MPa.`,
      question: r`What is the normal stress on the cut whose normal is $\mathbf{e}_y$, in MPa?`,
      answer: 25, // check: normal stress on the y-cut = σyy = row 2, column 2 = 25 MPa
      tolerance: 0.1,
      suffix: "MPa",
      answerDisplay: r`25\,\mathrm{MPa}`,
      hint: "The cut picks the row; the normal direction of that same cut picks the column.",
      explanation: r`The $y$-cut is row 2, $(\sigma_{yx}, \sigma_{yy}, \sigma_{yz}) = (-10, 25, 15)$. Its normal component is $\sigma_{yy} = 25$ MPa (tension).`,
      tags: ["stress-matrix"],
    }),
    numeric("y-cut-shear", {
      body: r`Same point: $\boldsymbol{\sigma} = \begin{bmatrix} 40 & -10 & 0 \\ -10 & 25 & 15 \\ 0 & 15 & -30 \end{bmatrix}$ MPa.`,
      question: r`The $y$-cut carries two shear components. What is the magnitude of the resultant shear stress on that cut, in MPa?`,
      answer: 18.03, // check: row 2 shears σyx = −10, σyz = 15 (both lie in the cut); √(10² + 15²) = √325 = 18.03 MPa
      tolerance: 0.2,
      suffix: "MPa",
      answerDisplay: r`18.0\,\mathrm{MPa}`,
      hint: "The two shear components on the y-cut point in perpendicular directions within the cut. How do you combine perpendicular components?",
      explanation: r`On the $y$-cut the in-plane components are $\sigma_{yx} = -10$ MPa (along $x$) and $\sigma_{yz} = 15$ MPa (along $z$). They are perpendicular, so the resultant shear is $\sqrt{(-10)^2 + 15^2} = \sqrt{325} = 18.0$ MPa.`,
      tags: ["stress-matrix", "shear"],
    }),
    reading(
      "counting",
      r`In 3-D the matrix has 9 entries, but they are not independent. Moment equilibrium of a tiny element (Lesson 5) forces it to be **symmetric**:

$$\sigma_{xy} = \sigma_{yx}, \qquad \sigma_{yz} = \sigma_{zy}, \qquad \sigma_{zx} = \sigma_{xz}.$$

So a 3-D state of stress has **6** independent components (3 normal, 3 shear), and a 2-D state has **3** ($\sigma_{xx}$, $\sigma_{yy}$, $\tau_{xy}$).

A special case is the **hydrostatic** state $\boldsymbol{\sigma} = -p\,\mathbf{I}$: equal normal stresses and no shear, like a small body deep under water. Every cut through such a point carries the same compression $p$ and no shear at all, whatever its orientation (Lesson 4 proves it).`,
      { title: "How many numbers?" },
    ),
    mc("independent-count", {
      question: "Using the symmetry of the stress matrix, how many independent stress components are there at a point in 3-D, and in 2-D?",
      choices: [
        ["6-3", "6 in 3-D, 3 in 2-D"],
        ["9-4", "9 in 3-D, 4 in 2-D", "That counts every matrix entry. Symmetry pairs up the off-diagonal ones."],
        ["3-2", "3 in 3-D, 2 in 2-D", "That counts only the normal stresses; the shear components are independent of them."],
        ["6-4", "6 in 3-D, 4 in 2-D", r`In 2-D, $\tau_{xy} = \tau_{yx}$, so there is only one independent shear component.`],
      ],
      correct: "6-3",
      shuffle: true,
      hint: "Count the diagonal entries, then count the off-diagonal entries and pair them up.",
      explanation: r`3-D: 3 normal + 6 shear entries, and symmetry pairs the shears into 3 → $3 + 3 = 6$. 2-D: 2 normal + 2 shear entries with $\tau_{xy} = \tau_{yx}$ → $2 + 1 = 3$.`,
      tags: ["stress-matrix", "symmetry"],
    }),
    mc("hydrostatic", {
      question: "Which matrix describes a hydrostatic state of stress?",
      choices: [
        ["hyd", r`$\begin{bmatrix} -8 & 0 & 0 \\ 0 & -8 & 0 \\ 0 & 0 & -8 \end{bmatrix}$ MPa`],
        ["diag", r`$\begin{bmatrix} -8 & 0 & 0 \\ 0 & -4 & 0 \\ 0 & 0 & -2 \end{bmatrix}$ MPa`, "Diagonal, but the normal stresses are unequal, so tilted cuts would carry shear."],
        ["shear", r`$\begin{bmatrix} 0 & -8 & 0 \\ -8 & 0 & 0 \\ 0 & 0 & 0 \end{bmatrix}$ MPa`, r`That is pure shear in the $xy$-plane.`],
        ["all", r`$\begin{bmatrix} -8 & -8 & -8 \\ -8 & -8 & -8 \\ -8 & -8 & -8 \end{bmatrix}$ MPa`, "The off-diagonal entries are shear stresses; a hydrostatic state has none."],
      ],
      correct: "hyd",
      shuffle: true,
      hint: "Think of a small body deep under water. Does the pressure on it depend on the direction of the face, and does the water drag sideways on any face?",
      explanation: r`A hydrostatic state is $\boldsymbol{\sigma} = -p\,\mathbf{I}$: equal normal stresses on the diagonal and zeros elsewhere. Here $p = 8$ MPa of compression. Unequal diagonal entries or nonzero off-diagonal entries both mean some cut carries shear.`,
      tags: ["hydrostatic", "stress-matrix"],
    }),
    matrix("write-3d", {
      question: r`Write the 3-D stress matrix for a state with $\sigma_{xx} = 50$ MPa, $\sigma_{zz} = -30$ MPa, $\tau_{xz} = 20$ MPa and every other component zero (entries in MPa).`,
      answer: [
        [50, 0, 20],
        [0, 0, 0],
        [20, 0, -30],
      ], // check: σxx at (1,1) = 50; σxz = σzx = 20 at (1,3) and (3,1); σzz at (3,3) = −30; the y row and column are zero
      tolerance: 0.01,
      prefix: r`$\boldsymbol{\sigma} =$`,
      hint: r`Place each component by (row = cut, column = direction), and remember that $\tau_{xz}$ comes with its symmetric partner $\tau_{zx}$.`,
      explanation: r`$\sigma_{xx}$ goes in (1,1), $\sigma_{zz}$ in (3,3), and the shear appears twice, $\sigma_{xz}$ in (1,3) and $\sigma_{zx}$ in (3,1), both 20. Nothing acts on the $y$-cut, so row 2 and column 2 are zero.

$$\boldsymbol{\sigma} = \begin{bmatrix} 50 & 0 & 20 \\ 0 & 0 & 0 \\ 20 & 0 & -30 \end{bmatrix}\ \mathrm{MPa}$$`,
      tags: ["stress-matrix"],
    }),
    reading(
      "summary",
      r`**What you did:** saw why a moment needs stress *at a point*, learned the two-subscript names, and wrote stress matrices.

**The rules:**

- $\sigma_{ij}$ = force per unit area in direction $j$ on the cut whose normal is $\mathbf{e}_i$ (first index = cut, second = direction). $\tau_{ij} \equiv \sigma_{ij}$ for $i \ne j$.
- Matrix: row = cut, column = direction.
- Positive components point in $+$ directions on positive faces and in $-$ directions on negative faces (tension is positive).
- Symmetry $\sigma_{ij} = \sigma_{ji}$: 6 independent components in 3-D, 3 in 2-D.
- Hydrostatic: $\boldsymbol{\sigma} = -p\,\mathbf{I}$, no shear on any cut.

$$\boldsymbol{\sigma} = \begin{bmatrix} \sigma_{xx} & \sigma_{xy} & \sigma_{xz} \\ \sigma_{yx} & \sigma_{yy} & \sigma_{yz} \\ \sigma_{zx} & \sigma_{zy} & \sigma_{zz} \end{bmatrix}$$

Next: integrate the stresses on a cut to get forces and moments, and find the traction on *any* cut with Cauchy's law.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Cauchy's law and internal resultants (Govindjee §3.2.2)  */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "sm2-l4-cauchy-and-resultants",
    unitId: "sm2",
    title: "Cauchy's law and internal resultants",
    summary: "Integrate the stresses on a cut to get its forces and moments, and find the traction on any plane with Cauchy's law t = σᵀn.",
    textbook: "Govindjee §3.2.2",
    minutes: 15,
  },
  [
    reading(
      "resultants",
      r`Stresses are force intensities, so integrating them over a cut gives the internal force and moment. On a cut with normal $\mathbf{e}_y$, the components $\sigma_{yy}$, $\sigma_{yx}$, $\sigma_{yz}$ are the forces per area in the $y$, $x$ and $z$ directions:

$$F_y = \int_A \sigma_{yy}\,\mathrm{d}A, \qquad F_x = \int_A \sigma_{yx}\,\mathrm{d}A, \qquad F_z = \int_A \sigma_{yz}\,\mathrm{d}A.$$

For moments about the origin (a point on the cut), the patch force at $(x, 0, z)$ contributes $\mathbf{x}\times\mathrm{d}\mathbf{F}$. The $y$-force has lever arms $-z$ about the $x$-axis and $x$ about the $z$-axis; the two shear forces twist about the $y$-axis with arms $z$ and $-x$:

$$M_x = -\int_A z\,\sigma_{yy}\,\mathrm{d}A, \qquad M_y = \int_A \left(z\,\sigma_{yx} - x\,\sigma_{yz}\right)\mathrm{d}A, \qquad M_z = \int_A x\,\sigma_{yy}\,\mathrm{d}A.$$

The same cross product on a cut with normal $\mathbf{e}_x$ (points $(0, y, z)$, traction $(\sigma_{xx}, \sigma_{xy}, \sigma_{xz})$) gives

$$F_x = \int_A \sigma_{xx}\,\mathrm{d}A, \qquad M_y = \int_A z\,\sigma_{xx}\,\mathrm{d}A, \qquad M_z = -\int_A y\,\sigma_{xx}\,\mathrm{d}A.$$

Don't memorize the signs: redo $\mathbf{x}\times\mathrm{d}\mathbf{F}$ with the right-hand rule. The section below carries a linear $\sigma_{xx}$ (tension at the bottom, compression at the top): zero net force but a net moment $M_z$, the stress picture of a bent beam.`,
      {
        title: "From stresses to forces and moments",
        visual: { kind: "beam-section", config: { M: 2000000, section: { kind: "rect", b: 50, h: 100 }, units: { moment: "N·mm", length: "mm", stress: "MPa" } } },
      },
    ),
    mc("x-cut-shear-force", {
      question: r`On a cut with normal $\mathbf{e}_x$, which integral gives the shear force in the $y$-direction?`,
      choices: [
        ["xy", r`$\int_A \sigma_{xy}\,\mathrm{d}A$`],
        ["yy", r`$\int_A \sigma_{yy}\,\mathrm{d}A$`, r`$\sigma_{yy}$ is the normal stress on cuts with normal $\mathbf{e}_y$; it doesn't act on the $x$-cut at all.`],
        ["xx", r`$\int_A \sigma_{xx}\,\mathrm{d}A$`, r`That is the normal force $F_x$ on the $x$-cut.`],
        ["moment", r`$-\int_A y\,\sigma_{xx}\,\mathrm{d}A$`, r`That is a moment ($M_z$), not a force.`],
      ],
      correct: "xy",
      shuffle: true,
      hint: "The cut fixes the first subscript; the force direction you want fixes the second.",
      explanation: r`On the $x$-cut the traction is $(\sigma_{xx}, \sigma_{xy}, \sigma_{xz})$, so $F_x = \int\sigma_{xx}\,\mathrm{d}A$, $F_y = \int\sigma_{xy}\,\mathrm{d}A$, $F_z = \int\sigma_{xz}\,\mathrm{d}A$. In a beam, $F_y$ on the cross-section is the shear force $V$.`,
      tags: ["resultants"],
    }),
    mc("twisting-moment", {
      question: r`On the cut with normal $\mathbf{e}_y$, which stresses produce the moment $M_y$ about the cut's own normal (the twisting moment)?`,
      choices: [
        ["shear", r`Only the shear stresses: $M_y = \int_A (z\,\sigma_{yx} - x\,\sigma_{yz})\,\mathrm{d}A$`],
        ["normal", r`Only the normal stress $\sigma_{yy}$`, r`$\sigma_{yy}$ acts along $y$, parallel to the $y$-axis, and a force parallel to an axis has no moment about it.`],
        ["all", "All three components on the cut", r`$\sigma_{yy}$ is parallel to the $y$-axis, so it contributes nothing to $M_y$.`],
        ["none", "None: a cut cannot carry a moment about its own normal", "A shaft in torsion does exactly that: a torque about its axis, carried by shear stresses on the cross-section."],
      ],
      correct: "shear",
      shuffle: true,
      hint: "A force produces no moment about an axis it is parallel to. Which components on the y-cut are not parallel to the y-axis?",
      explanation: r`$M_y$ comes from $\mathbf{x}\times\mathrm{d}\mathbf{F}$ with $\mathbf{x} = (x, 0, z)$: the $y$-component of the cross product is $z\,\mathrm{d}F_x - x\,\mathrm{d}F_z = (z\sigma_{yx} - x\sigma_{yz})\,\mathrm{d}A$. Only shear stresses enter: this is the torque of torsion.`,
      tags: ["resultants"],
    }),
    numeric("linear-resultant", {
      body: r`A rectangular cut with normal $\mathbf{e}_x$ is $b = 50$ mm wide and $h = 80$ mm tall, with $y$ measured from its centroid ($-40 \le y \le 40$ mm). On it, $\sigma_{xx} = 40 + 0.5\,y$ MPa ($y$ in mm), and there are no shear stresses.`,
      question: r`What is the total normal force $F_x$ on the cut, in kN?`,
      answer: 160, // check: Fx = ∫(40 + 0.5y) dA = 40·(50·80) + 0.5·∫y dA = 160 000 N + 0 (y from the centroid) = 160 kN
      tolerance: 1.6,
      suffix: "kN",
      answerDisplay: r`160\,\mathrm{kN}`,
      hint: r`Split the integral into the constant part and the part proportional to $y$. What is $\int_A y\,\mathrm{d}A$ when $y$ is measured from the centroid?`,
      explanation: r`$F_x = \int_A (40 + 0.5y)\,\mathrm{d}A = 40A + 0.5\int_A y\,\mathrm{d}A = 40(50 \cdot 80) + 0 = 160\,000$ N $= 160$ kN. The linear part integrates to zero about the centroid, but it does produce a moment: $M_z = -\int_A y(0.5y)\,\mathrm{d}A = -0.5\,\frac{bh^3}{12} = -0.5(2.133\times10^6) = -1.07$ kN·m.`,
      tags: ["resultants"],
    }),
    tf("hw-force-zero", {
      body: r`A rectangular cut with normal $\mathbf{e}_x$ has width $b = 60$ mm (along $z$) and height $h = 100$ mm (along $y$, measured from the centroid, $-50 \le y \le 50$ mm). It carries $\sigma_{xx} = -c\,y/h$ with $c = 120$ MPa, and no other stresses.`,
      statement: "The total force on this cut is zero.",
      answer: true,
      feedback: r`Integrate $\sigma_{xx}$ over the cut: what is $\int_A y\,\mathrm{d}A$ about the centroid?`,
      hint: r`The force is $\int_A \sigma_{xx}\,\mathrm{d}A$. Is $\sigma_{xx}$ an even or an odd function of $y$, and is the cut symmetric about $y = 0$?`,
      explanation: r`True. $F_x = -\frac{c}{h}\int_A y\,\mathrm{d}A = 0$ because $y$ is measured from the centroid: the tension below ($y < 0$) exactly cancels the compression above. There are no shear stresses, so $F_y = F_z = 0$ as well. Had $y$ been measured from the bottom edge ($0 \le y \le h$), $\int_A y\,\mathrm{d}A = bh^2/2 \ne 0$ and the cut would carry a net force $-cbh/2$: always check where the origin is.`,
      tags: ["resultants"],
    }),
    numeric("hw-moment", {
      body: r`Same cut: normal $\mathbf{e}_x$, $b = 60$ mm, $h = 100$ mm, $y$ from the centroid, $\sigma_{xx} = -c\,y/h$ with $c = 120$ MPa.`,
      question: r`What is the moment $M_z$ on the cut about its centroid, in kN·m?`,
      answer: 6, // check: Mz = −∫y·σxx dA = (c/h)∫y² dA = (c/h)(b·h³/12) = c·b·h²/12 = 120·60·100²/12 = 6×10⁶ N·mm = 6 kN·m
      tolerance: 0.06,
      suffix: "kN·m",
      answerDisplay: r`6\,\mathrm{kN\,m}`,
      hint: r`On a cut with normal $\mathbf{e}_x$, $M_z = -\int_A y\,\sigma_{xx}\,\mathrm{d}A$. You will need $\int_A y^2\,\mathrm{d}A = bh^3/12$ for a rectangle about its centroid.`,
      explanation: r`$$M_z = -\int_A y\left(-\frac{c\,y}{h}\right)\mathrm{d}A = \frac{c}{h}\int_A y^2\,\mathrm{d}A = \frac{c}{h}\cdot\frac{bh^3}{12} = \frac{c\,b\,h^2}{12} = \frac{120(60)(100)^2}{12} = 6\times10^6\ \mathrm{N\,mm} = 6\ \mathrm{kN\,m}.$$

Sign check: at the bottom ($y < 0$) the stress is tension, a force in $+x$ below the origin; at the top it is compression, a force in $-x$ above. Both turn counterclockwise about $+z$, so $M_z > 0$. The other moments vanish: $M_y = \int z\,\sigma_{xx}\,\mathrm{d}A = 0$ by symmetry in $z$, and $M_x = 0$ with no shear.`,
      tags: ["resultants", "moment"],
    }),
    reading(
      "cauchy",
      r`For a cut with any unit normal $\mathbf{n}$, the force and the moment about a point $\mathbf{x}_o$ are (Govindjee eqs. 3.26–3.27)

$$\mathbf{F} = \int_A \boldsymbol{\sigma}^T\mathbf{n}\,\mathrm{d}A, \qquad \mathbf{M} = \int_A (\mathbf{x} - \mathbf{x}_o)\times\boldsymbol{\sigma}^T\mathbf{n}\,\mathrm{d}A.$$

So the force per unit area on the cut, the **traction** $\mathbf{t}$ (not the tangent of Lesson 1), is given by **Cauchy's law**

$$\mathbf{t} = \boldsymbol{\sigma}^T\mathbf{n}, \qquad t_j = \sigma_{xj}\,n_x + \sigma_{yj}\,n_y + \sigma_{zj}\,n_z.$$

The book proves it with force balance on a tiny triangular wedge: the forces on its faces scale with the face sizes, the body force with the much smaller volume, so as the wedge shrinks the body force drops out and $\mathbf{t} = \boldsymbol{\sigma}^T\mathbf{n}$ remains. Because $\boldsymbol{\sigma}$ is symmetric, $\boldsymbol{\sigma}^T\mathbf{n} = \boldsymbol{\sigma}\mathbf{n}$: multiply the matrix by the normal.

Split the traction into its part along $\mathbf{n}$ and its part in the cut:

$$\sigma_n = \mathbf{t}\cdot\mathbf{n}, \qquad \tau = \sqrt{|\mathbf{t}|^2 - \sigma_n^2}.$$`,
      {
        title: "Any cut: Cauchy's law",
        visual: { kind: "stress-element", config: { sxx: 80, syy: 20, sxy: 30, cut: { theta: 45, slider: true }, max: 100, unit: "MPa" } },
      },
    ),
    numeric("traction-2d-x", {
      body: r`A 2-D state: $\sigma_{xx} = 50$ MPa, $\sigma_{yy} = -30$ MPa, $\tau_{xy} = 20$ MPa. A cut has unit normal at $30^\circ$ from the $x$-axis, $\mathbf{n} = (\cos 30^\circ, \sin 30^\circ) = (0.866, 0.5)$.`,
      question: r`What is the $x$-component $t_x$ of the traction on the cut, in MPa?`,
      answer: 53.3, // check: tx = σxx·nx + σyx·ny = 50·0.8660 + 20·0.5 = 43.30 + 10 = 53.30 MPa
      tolerance: 0.5,
      suffix: "MPa",
      answerDisplay: r`53.3\,\mathrm{MPa}`,
      hint: r`Multiply the stress matrix by $\mathbf{n}$: $t_x$ is the first row dotted with $\mathbf{n}$.`,
      explanation: r`$$\mathbf{t} = \begin{bmatrix} 50 & 20 \\ 20 & -30 \end{bmatrix}\begin{bmatrix} 0.866 \\ 0.5 \end{bmatrix} = \begin{bmatrix} 43.30 + 10 \\ 17.32 - 15 \end{bmatrix} = \begin{bmatrix} 53.30 \\ 2.32 \end{bmatrix}\ \mathrm{MPa}.$$

So $t_x = 53.3$ MPa (and $t_y = 2.32$ MPa).`,
      tags: ["cauchy", "traction"],
    }),
    numeric("traction-2d-normal", {
      body: r`Same state ($\sigma_{xx} = 50$, $\sigma_{yy} = -30$, $\tau_{xy} = 20$ MPa) and the same cut, $\mathbf{n} = (0.866, 0.5)$, with traction $\mathbf{t} = (53.30, 2.32)$ MPa.`,
      question: r`What is the normal stress $\sigma_n = \mathbf{t}\cdot\mathbf{n}$ on that cut, in MPa?`,
      answer: 47.32, // check: σn = 53.30·0.8660 + 2.32·0.5 = 46.16 + 1.16 = 47.32 MPa (= 50·0.75 − 30·0.25 + 2·20·0.433)
      tolerance: 0.5,
      suffix: "MPa",
      answerDisplay: r`47.3\,\mathrm{MPa}`,
      hint: "Dot the traction with the same unit normal.",
      explanation: r`$\sigma_n = 53.30(0.866) + 2.32(0.5) = 46.16 + 1.16 = 47.3$ MPa. Same thing in one line, with $\alpha = 30^\circ$ the angle of $\mathbf{n}$ from the $x$-axis: $\sigma_n = \sigma_{xx}\cos^2\alpha + \sigma_{yy}\sin^2\alpha + 2\tau_{xy}\sin\alpha\cos\alpha = 37.5 - 7.5 + 17.32 = 47.3$ MPa. The shear on the cut is $|\tau| = \sqrt{|\mathbf{t}|^2 - \sigma_n^2} = \sqrt{2846.4 - 2239.2} = 24.6$ MPa.`,
      tags: ["cauchy", "traction"],
    }),
    numeric("traction-3d-x", {
      body: r`At a point, $\boldsymbol{\sigma} = \begin{bmatrix} 20 & 10 & 0 \\ 10 & -10 & 5 \\ 0 & 5 & 30 \end{bmatrix}$ MPa. Consider the cut with unit normal $\mathbf{n} = \frac{1}{\sqrt2}(\mathbf{e}_x + \mathbf{e}_y)$.`,
      question: r`What is the traction component $t_x$ on that cut, in MPa?`,
      answer: 21.21, // check: t = σn = (1/√2)(20 + 10, 10 − 10, 0 + 5) = (21.21, 0, 3.536); tx = 30/√2 = 21.21 MPa
      tolerance: 0.2,
      suffix: "MPa",
      answerDisplay: r`21.2\,\mathrm{MPa}`,
      hint: r`$\mathbf{t} = \boldsymbol{\sigma}\mathbf{n}$. With $\mathbf{n} = (1, 1, 0)/\sqrt2$, each component of $\mathbf{t}$ is (first entry + second entry of that row)$/\sqrt2$.`,
      explanation: r`$$\mathbf{t} = \frac{1}{\sqrt2}\begin{bmatrix} 20 + 10 \\ 10 - 10 \\ 0 + 5 \end{bmatrix} = \begin{bmatrix} 21.21 \\ 0 \\ 3.54 \end{bmatrix}\ \mathrm{MPa}.$$

So $t_x = 30/\sqrt2 = 21.2$ MPa. Note $t_z = 3.54$ MPa even though $n_z = 0$: $\mathbf{n}$ lies in the $xy$-plane, but the traction need not.`,
      tags: ["cauchy", "traction"],
    }),
    numeric("traction-3d-normal", {
      body: r`Same point and cut: $\mathbf{n} = \frac{1}{\sqrt2}(1, 1, 0)$, traction $\mathbf{t} = (21.21, 0, 3.54)$ MPa.`,
      question: r`What is the normal stress $\sigma_n$ on the cut, in MPa?`,
      answer: 15, // check: σn = t·n = (21.21·1 + 0·1 + 3.54·0)/√2 = 15.0 MPa (= (σxx + 2σxy + σyy)/2 = (20 + 20 − 10)/2)
      tolerance: 0.2,
      suffix: "MPa",
      answerDisplay: r`15\,\mathrm{MPa}`,
      hint: r`$\sigma_n = \mathbf{t}\cdot\mathbf{n}$. Only the components of $\mathbf{t}$ along directions where $\mathbf{n}$ is nonzero matter.`,
      explanation: r`$\sigma_n = \mathbf{t}\cdot\mathbf{n} = (21.21 + 0)/\sqrt2 + 3.54(0) = 15.0$ MPa (tension). Shortcut: $\sigma_n = \mathbf{n}^T\boldsymbol{\sigma}\mathbf{n} = \tfrac12(\sigma_{xx} + 2\sigma_{xy} + \sigma_{yy}) = \tfrac12(20 + 20 - 10) = 15$ MPa.`,
      tags: ["cauchy", "normal-shear"],
    }),
    numeric("traction-3d-shear", {
      body: r`Same cut: $\mathbf{t} = (21.21, 0, 3.54)$ MPa and $\sigma_n = 15$ MPa.`,
      question: "Is there shear on this cut? Give the magnitude of the shear stress, in MPa (enter 0 if there is none).",
      answer: 15.41, // check: |t|² = 21.21² + 0² + 3.536² = 450 + 12.5 = 462.5; τ = √(462.5 − 15²) = √237.5 = 15.41 MPa
      tolerance: 0.2,
      suffix: "MPa",
      answerDisplay: r`15.4\,\mathrm{MPa}`,
      hint: r`The traction is the vector sum of its normal part and its in-plane (shear) part, and the two are perpendicular.`,
      explanation: r`$|\mathbf{t}|^2 = 21.21^2 + 0^2 + 3.54^2 = 450 + 12.5 = 462.5\ \mathrm{MPa^2}$, so

$$\tau = \sqrt{|\mathbf{t}|^2 - \sigma_n^2} = \sqrt{462.5 - 225} = \sqrt{237.5} = 15.4\ \mathrm{MPa}.$$

Yes, there is shear: $\mathbf{t}$ is not parallel to $\mathbf{n}$. Only on special (principal) planes, where $\boldsymbol{\sigma}\mathbf{n}$ is parallel to $\mathbf{n}$, is the shear zero.`,
      tags: ["cauchy", "normal-shear"],
    }),
    mc("hydrostatic-traction", {
      body: r`A small element deep in the ocean is in a hydrostatic state, $\boldsymbol{\sigma} = -p\,\mathbf{I}$ with $p = 25$ MPa.`,
      question: r`What is the traction on a cut with an arbitrary unit normal $\mathbf{n}$?`,
      choices: [
        ["minus-pn", r`$\mathbf{t} = -p\,\mathbf{n}$: 25 MPa of pure compression and no shear, on every cut`],
        ["depends", r`It depends on $\mathbf{n}$: the shear is largest on cuts at $45^\circ$`, "That is the uniaxial bar. Here all three normal stresses are equal."],
        ["fixed", r`$\mathbf{t} = -p\,(\mathbf{e}_x + \mathbf{e}_y + \mathbf{e}_z)$, whatever the cut`, r`Multiply $-p\,\mathbf{I}$ by $\mathbf{n}$: you get $-p\,\mathbf{n}$, which turns with the cut.`],
        ["zero", r`$\mathbf{t} = \mathbf{0}$, since there is no shear`, "No shear does not mean no traction: there is a normal component of size p."],
      ],
      correct: "minus-pn",
      shuffle: true,
      hint: r`Apply Cauchy's law: what is $\mathbf{I}\,\mathbf{n}$?`,
      explanation: r`$\mathbf{t} = \boldsymbol{\sigma}\mathbf{n} = -p\,\mathbf{I}\mathbf{n} = -p\,\mathbf{n}$. Then $\sigma_n = \mathbf{t}\cdot\mathbf{n} = -p = -25$ MPa and $\tau = \sqrt{p^2 - p^2} = 0$: the force per unit area parallel to *any* cut is zero.`,
      tags: ["cauchy", "hydrostatic"],
    }),
    tf("orientation", {
      statement: "At a fixed point of a loaded body, the traction vector depends on the orientation of the cut through that point.",
      answer: true,
      feedback: r`Look at Cauchy's law: which quantity on the right-hand side changes when you turn the cut?`,
      hint: r`In $\mathbf{t} = \boldsymbol{\sigma}^T\mathbf{n}$, what is fixed at the point and what changes from cut to cut?`,
      explanation: r`True. The stress $\boldsymbol{\sigma}$ at the point is fixed, but $\mathbf{t} = \boldsymbol{\sigma}^T\mathbf{n}$ changes with $\mathbf{n}$. That is exactly why stress needs a matrix (a tensor) and not a single vector. Even in the hydrostatic case $\mathbf{t} = -p\,\mathbf{n}$ turns with the cut; only its size stays fixed.`,
      tags: ["cauchy", "traction"],
    }),
    reading(
      "summary",
      r`**What you did:** computed the forces and moments on cuts from stress distributions, and the traction, normal and shear stress on arbitrary planes.

**Resultants** (cut with normal $\mathbf{e}_y$; for $\mathbf{e}_x$ redo $\mathbf{x}\times\mathrm{d}\mathbf{F}$):

$$F_y = \int_A \sigma_{yy}\,\mathrm{d}A, \quad F_x = \int_A \sigma_{yx}\,\mathrm{d}A, \quad F_z = \int_A \sigma_{yz}\,\mathrm{d}A$$

$$M_x = -\int_A z\,\sigma_{yy}\,\mathrm{d}A, \quad M_y = \int_A (z\,\sigma_{yx} - x\,\sigma_{yz})\,\mathrm{d}A, \quad M_z = \int_A x\,\sigma_{yy}\,\mathrm{d}A$$

On an $x$-cut: $F_x = \int\sigma_{xx}\,\mathrm{d}A$, $M_z = -\int y\,\sigma_{xx}\,\mathrm{d}A$, $M_y = \int z\,\sigma_{xx}\,\mathrm{d}A$.

**Cauchy's law:**

$$\mathbf{t} = \boldsymbol{\sigma}^T\mathbf{n} = \boldsymbol{\sigma}\mathbf{n}, \qquad \sigma_n = \mathbf{t}\cdot\mathbf{n}, \qquad \tau = \sqrt{|\mathbf{t}|^2 - \sigma_n^2}$$

- $\mathbf{F} = \int_A \boldsymbol{\sigma}^T\mathbf{n}\,\mathrm{d}A$, $\mathbf{M} = \int_A (\mathbf{x} - \mathbf{x}_o)\times\boldsymbol{\sigma}^T\mathbf{n}\,\mathrm{d}A$.
- Hydrostatic $\boldsymbol{\sigma} = -p\,\mathbf{I}$: $\mathbf{t} = -p\,\mathbf{n}$, no shear on any cut.

Next: what equilibrium says about how the stresses may vary from point to point.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 5 · Equilibrium in terms of stresses (Govindjee §3.2.3)      */
/* ------------------------------------------------------------------ */

const l5 = lesson(
  {
    id: "sm2-l5-equilibrium-in-stresses",
    unitId: "sm2",
    title: "Equilibrium in terms of stresses",
    summary: "Force balance on a tiny element becomes partial differential equations; moment balance makes the stress matrix symmetric. Then check whether given stress fields are in equilibrium.",
    textbook: "Govindjee §3.2.3",
    minutes: 15,
  },
  [
    reading(
      "element-balance",
      r`Take a small rectangle $\Delta x \times \Delta y$ of thickness $t$ (it cancels) with its lower-left corner at $(x, y)$, and let $\mathbf{b}$ be the **body force per unit volume** (gravity, for example). Forces in the $x$-direction come from $\sigma_{xx}$ on the left and right faces, from $\sigma_{yx}$ on the bottom and top faces, and from $b_x$. Writing the values on the right and top faces as the values at $(x, y)$ plus a change $\Delta\sigma$:

$$\sum F_x = (\sigma_{xx} + \Delta\sigma_{xx})\,t\Delta y - \sigma_{xx}\,t\Delta y + (\sigma_{yx} + \Delta\sigma_{yx})\,t\Delta x - \sigma_{yx}\,t\Delta x + b_x\,t\Delta x\Delta y = 0.$$

Divide by $t\Delta x\Delta y$ and let the element shrink ($\Delta\sigma_{xx}/\Delta x \to \partial\sigma_{xx}/\partial x$, and so on):

$$\frac{\partial \sigma_{xx}}{\partial x} + \frac{\partial \sigma_{yx}}{\partial y} + b_x = 0, \qquad \frac{\partial \sigma_{xy}}{\partial x} + \frac{\partial \sigma_{yy}}{\partial y} + b_y = 0.$$

"Sum of forces equals zero" has become a pair of **partial differential equations**: equilibrium restricts how the stresses may vary from point to point.`,
      {
        title: "Force balance on a tiny element",
        visual: { kind: "stress-element", config: { sxx: 30, syy: 10, sxy: 15, sliders: true, max: 60, unit: "MPa" } },
      },
    ),
    multi("fx-forces", {
      question: r`Which forces enter the balance $\sum F_x = 0$ for the 2-D element? Select all that apply.`,
      choices: [
        ["normal-lr", r`The normal forces on the left and right faces ($\sigma_{xx}$)`],
        ["shear-tb", r`The shear forces on the bottom and top faces ($\sigma_{yx}$)`],
        ["body", r`The body force component $b_x$ times the element's volume`],
        ["shear-lr", r`The shear forces on the left and right faces ($\sigma_{xy}$)`, r`Those point in $\pm y$; they belong in $\sum F_y$.`],
        ["normal-tb", r`The normal forces on the bottom and top faces ($\sigma_{yy}$)`, r`Those point in $\pm y$ too.`],
      ],
      correct: ["normal-lr", "shear-tb", "body"],
      hint: "Go face by face and ask which way each force component points.",
      explanation: r`Only forces with an $x$-component count: $\sigma_{xx}$ on the $x$-faces, $\sigma_{yx}$ on the $y$-faces, and $b_x\,t\Delta x\Delta y$. That is why the $x$-equation reads $\partial\sigma_{xx}/\partial x + \partial\sigma_{yx}/\partial y + b_x = 0$: each stress is differentiated with respect to the coordinate of its **first** index (the direction in which its two faces are separated).`,
      tags: ["equilibrium-pde"],
    }),
    mc("body-force-units", {
      question: r`In the equilibrium PDEs, what kind of quantity is $\mathbf{b}$?`,
      choices: [
        ["volume", r`A force per unit volume, such as $\rho g$ for gravity (N/m³ or N/mm³)`],
        ["area", "A force per unit area applied on the body's surface", r`Surface loads enter through the boundary (tractions on the outer surface). $\mathbf{b}$ acts throughout the volume.`],
        ["length", "A force per unit length, as in the axial bar", "In the bar (Unit 1), b was per unit length because the cross-section had been integrated out. In 2-D and 3-D it is per unit volume."],
        ["total", "The total external force on the body", r`It is a density: multiply by the element's volume to get a force.`],
      ],
      correct: "volume",
      shuffle: true,
      hint: r`Check the units of $\partial\sigma_{xx}/\partial x$: a stress divided by a length.`,
      explanation: r`$\partial\sigma/\partial x$ has units $(\mathrm{N/m^2})/\mathrm{m} = \mathrm{N/m^3}$, so $\mathbf{b}$ is a force per unit **volume**; in the balance it is multiplied by the element volume $t\Delta x\Delta y$. Gravity with $y$ up gives $b_y = -\rho g$, about $-77\ \mathrm{kN/m^3}$ for steel, usually negligible next to applied loads.`,
      tags: ["body-force"],
    }),
    reading(
      "moment-balance",
      r`Now take moments about the lower-left corner. The shear forces on the left and bottom faces act along lines through the corner, so they drop out. The shear force on the right face ($\sigma_{xy}$, arm $\Delta x$) and on the top face ($\sigma_{yx}$, arm $\Delta y$) turn the element in opposite senses:

$$\sum M_z = (\sigma_{xy} + \Delta\sigma_{xy})\,t\Delta y\,\Delta x - (\sigma_{yx} + \Delta\sigma_{yx})\,t\Delta x\,\Delta y + \cdots = 0.$$

The dots are the normal-stress and body-force terms. Divide by $t\Delta x\Delta y$: those terms still carry a factor $\Delta x$ or $\Delta y$ and vanish as the element shrinks, leaving

$$\sigma_{xy} = \sigma_{yx}.$$

So moment equilibrium gives an **algebraic** equation, not a PDE: shear stresses on perpendicular planes are equal, and the stress matrix is symmetric.`,
      { title: "Moment balance: symmetry" },
    ),
    tf("symmetry-from-moments", {
      statement: r`The symmetry $\sigma_{xy} = \sigma_{yx}$ is a consequence of moment equilibrium of a small element.`,
      answer: true,
      feedback: r`Which balance did we write to get $\sigma_{xy} = \sigma_{yx}$: forces or moments?`,
      hint: "Recall what each balance produced: force balance gave the PDEs. What did the other one give?",
      explanation: r`True. Summing moments about a corner leaves $\sigma_{xy} - \sigma_{yx} \to 0$ as the element shrinks. The same argument about the $x$- and $y$-axes in 3-D gives $\sigma_{yz} = \sigma_{zy}$ and $\sigma_{zx} = \sigma_{xz}$.`,
      tags: ["symmetry", "equilibrium-pde"],
    }),
    mc("normal-drop-out", {
      question: "Why do the normal stresses not appear in the final result of the moment balance about the corner?",
      choices: [
        ["higher-order", r`Their moments nearly cancel in pairs; what is left is proportional to $\Delta\sigma$ times the element size squared, which still carries a factor $\Delta x$ or $\Delta y$ after dividing by $t\Delta x\Delta y$.`],
        ["through", "All normal forces act along lines through the corner.", r`The normal forces act at the middle of each face, so they do have lever arms ($\Delta y/2$ or $\Delta x/2$); they just nearly cancel in pairs.`],
        ["zero", "Normal stresses vanish in equilibrium.", "Nothing forces normal stresses to vanish; a pulled bar has a large one."],
        ["symmetric", "Because the stress matrix is symmetric.", r`Symmetry is the *result* of this moment balance, so it can't be the reason.`],
      ],
      correct: "higher-order",
      shuffle: true,
      hint: r`The normal forces on the left and right faces are almost equal and opposite, at the same height. What does their net moment look like, and how does it compare in size with the shear terms?`,
      explanation: r`The left and right normal forces are $\sigma_{xx}\,t\Delta y$ and $(\sigma_{xx} + \Delta\sigma_{xx})\,t\Delta y$ at height $\Delta y/2$: their net moment is $-\Delta\sigma_{xx}\,t\Delta y^2/2$. After dividing by $t\Delta x\Delta y$ this becomes $-\tfrac12(\Delta\sigma_{xx}/\Delta x)\,\Delta y \to 0$. The shear terms instead leave $\sigma_{xy} - \sigma_{yx}$, which does not shrink.`,
      tags: ["symmetry", "equilibrium-pde"],
    }),
    reading(
      "three-d",
      r`In 3-D the same element argument gives **three PDEs and three algebraic equations** (Govindjee eqs. 3.38–3.43):

$$\sum F_x = 0: \quad \frac{\partial \sigma_{xx}}{\partial x} + \frac{\partial \sigma_{yx}}{\partial y} + \frac{\partial \sigma_{zx}}{\partial z} + b_x = 0$$

$$\sum F_y = 0: \quad \frac{\partial \sigma_{xy}}{\partial x} + \frac{\partial \sigma_{yy}}{\partial y} + \frac{\partial \sigma_{zy}}{\partial z} + b_y = 0$$

$$\sum F_z = 0: \quad \frac{\partial \sigma_{xz}}{\partial x} + \frac{\partial \sigma_{yz}}{\partial y} + \frac{\partial \sigma_{zz}}{\partial z} + b_z = 0$$

$$\sum M_x = 0: \ \sigma_{yz} = \sigma_{zy}, \qquad \sum M_y = 0: \ \sigma_{zx} = \sigma_{xz}, \qquad \sum M_z = 0: \ \sigma_{xy} = \sigma_{yx}$$

**Pattern:** in the $j$-equation every stress has **second** index $j$, and each is differentiated with respect to its **first** index. The same equations follow, more rigorously, from the divergence theorem applied to $\int_{\partial R} \boldsymbol{\sigma}^T\mathbf{n}\,\mathrm{d}l = \mathbf{0}$ on an arbitrary region $R$, plus localization (the integrand must vanish because $R$ is arbitrary).

**To check a given stress field:** compute the derivatives, add the body force, and see whether each equation holds at *every* point.`,
      { title: "The 3-D equations" },
    ),
    mc("count-3d", {
      question: "In 3-D, what does equilibrium give you in terms of stresses?",
      choices: [
        ["3+3", "Three partial differential equations (force balance) and three algebraic equations (moment balance: symmetry)"],
        ["6pde", "Six partial differential equations", r`Moment balance doesn't produce PDEs; it gives $\sigma_{ij} = \sigma_{ji}$.`],
        ["3", "Three equations, one per coordinate direction", "That leaves out moment balance."],
        ["9", "Nine equations, one for each stress component", "Equilibrium gives one force equation per direction and one moment equation per axis."],
      ],
      correct: "3+3",
      shuffle: true,
      hint: "Count the force balances and the moment balances in 3-D separately, and recall what kind of equation each produced in 2-D.",
      explanation: r`Three force balances ($\sum F_x = \sum F_y = \sum F_z = 0$) become three PDEs; three moment balances become the three symmetry conditions $\sigma_{yz} = \sigma_{zy}$, $\sigma_{zx} = \sigma_{xz}$, $\sigma_{xy} = \sigma_{yx}$. (In 2-D: two PDEs and one algebraic equation.)`,
      tags: ["equilibrium-pde"],
    }),
    mc("which-is-fz", {
      question: r`Which equation is $\sum F_z = 0$?`,
      choices: [
        ["right", r`$\dfrac{\partial \sigma_{xz}}{\partial x} + \dfrac{\partial \sigma_{yz}}{\partial y} + \dfrac{\partial \sigma_{zz}}{\partial z} + b_z = 0$`],
        ["allz", r`$\dfrac{\partial \sigma_{zx}}{\partial z} + \dfrac{\partial \sigma_{zy}}{\partial z} + \dfrac{\partial \sigma_{zz}}{\partial z} + b_z = 0$`, "Each stress must be differentiated with respect to its first index (the direction in which its two faces are separated), not all with respect to z."],
        ["zzonly", r`$\dfrac{\partial \sigma_{zz}}{\partial x} + \dfrac{\partial \sigma_{zz}}{\partial y} + \dfrac{\partial \sigma_{zz}}{\partial z} + b_z = 0$`, r`Only one normal stress acts in $z$; the other two $z$-forces come from the shear stresses $\sigma_{xz}$ and $\sigma_{yz}$.`],
        ["xrow", r`$\dfrac{\partial \sigma_{xx}}{\partial x} + \dfrac{\partial \sigma_{xy}}{\partial y} + \dfrac{\partial \sigma_{xz}}{\partial z} + b_z = 0$`, r`Those stresses act in different directions ($x$, $y$, $z$); a force balance must use stresses that all point in $z$.`],
      ],
      correct: "right",
      shuffle: true,
      hint: r`Which stress components push in the $z$-direction, and on which pair of faces does each one act? Compare with the $x$-equation you already know.`,
      explanation: r`The $z$-direction forces on the six faces come from $\sigma_{xz}$ (on the $x$-faces), $\sigma_{yz}$ (on the $y$-faces) and $\sigma_{zz}$ (on the $z$-faces); their net values per volume are the derivatives along $x$, $y$, $z$ respectively. Add $b_z$: $\partial_x\sigma_{xz} + \partial_y\sigma_{yz} + \partial_z\sigma_{zz} + b_z = 0$.`,
      tags: ["equilibrium-pde"],
    }),
    mc("field-check", {
      body: r`A body with **no body forces** is claimed to carry the 2-D stress field (consistent units)

$$\sigma_{xx} = 3x^2 + 2y, \qquad \sigma_{xy} = \sigma_{yx} = -6xy + 4, \qquad \sigma_{yy} = 5y^2.$$`,
      question: "Is this an equilibrium state of stress?",
      choices: [
        ["no-y", r`No: the $x$-equation holds, but the $y$-equation leaves $4y \ne 0$.`],
        ["yes", "Yes: both equilibrium equations are satisfied.", r`Check the $y$-equation: $\partial\sigma_{xy}/\partial x + \partial\sigma_{yy}/\partial y = -6y + 10y$.`],
        ["no-x", r`No: the $x$-equation fails.`, r`$\partial(3x^2 + 2y)/\partial x + \partial(-6xy + 4)/\partial y = 6x - 6x = 0$, so the $x$-equation is fine.`],
        ["no-sym", "No: the field is not symmetric.", r`$\sigma_{xy} = \sigma_{yx}$ is given, so moment equilibrium holds.`],
      ],
      correct: "no-y",
      hint: r`Compute $\partial\sigma_{xx}/\partial x + \partial\sigma_{yx}/\partial y$ and $\partial\sigma_{xy}/\partial x + \partial\sigma_{yy}/\partial y$ separately. Both must vanish everywhere.`,
      explanation: r`$x$: $\dfrac{\partial\sigma_{xx}}{\partial x} + \dfrac{\partial\sigma_{yx}}{\partial y} = 6x + (-6x) = 0$ ✓.

$y$: $\dfrac{\partial\sigma_{xy}}{\partial x} + \dfrac{\partial\sigma_{yy}}{\partial y} = -6y + 10y = 4y$, which is not zero (except on the line $y = 0$). With $b_y = 0$ the $y$-equation fails, so the field is **not** in equilibrium. One failing equation anywhere in the body is enough.`,
      tags: ["equilibrium-check"],
    }),
    numeric("body-force-needed", {
      body: r`Same field: $\sigma_{xx} = 3x^2 + 2y$, $\sigma_{xy} = \sigma_{yx} = -6xy + 4$, $\sigma_{yy} = 5y^2$ (consistent units).`,
      question: r`What body force component $b_y$ would be needed for equilibrium at the point $(x, y) = (1, 2)$? Use the sign convention.`,
      answer: -8, // check: ∂σxy/∂x + ∂σyy/∂y = −6y + 10y = 4y; equilibrium needs 4y + by = 0 ⇒ by = −4y = −8 at y = 2
      tolerance: 0.05,
      prefix: r`$b_y =$`,
      answerDisplay: r`-8`,
      hint: r`The $y$-equation is $\partial\sigma_{xy}/\partial x + \partial\sigma_{yy}/\partial y + b_y = 0$. You already know the first two terms add to something in $y$.`,
      explanation: r`$-6y + 10y + b_y = 0$, so $b_y = -4y$. At $(1, 2)$: $b_y = -8$, a body force pointing in $-y$ (and growing with $y$). The $x$-equation already balances, so $b_x = 0$.`,
      tags: ["equilibrium-check", "body-force"],
    }),
    multi("which-equilibrium", {
      question: r`With no body force, which of these 2-D fields satisfy equilibrium? ($a$ and $c$ are constants; each field has $\sigma_{yx} = \sigma_{xy}$.) Select all that apply.`,
      choices: [
        ["a", r`$\sigma_{xx} = a x,\ \ \sigma_{xy} = -a y,\ \ \sigma_{yy} = 0$`],
        ["b", r`$\sigma_{xx} = a y,\ \ \sigma_{xy} = a x,\ \ \sigma_{yy} = 0$`, r`The $y$-equation gives $\partial(ax)/\partial x + 0 = a \ne 0$.`],
        ["c", r`$\sigma_{xx} = c,\ \ \sigma_{xy} = 0,\ \ \sigma_{yy} = -c$`],
        ["d", r`$\sigma_{xx} = x^2,\ \ \sigma_{xy} = -2xy,\ \ \sigma_{yy} = y^2$`],
        ["e", r`$\sigma_{xx} = y^2,\ \ \sigma_{xy} = 0,\ \ \sigma_{yy} = xy$`, r`The $y$-equation gives $0 + \partial(xy)/\partial y = x \ne 0$.`],
      ],
      correct: ["a", "c", "d"],
      hint: r`For each field compute $\partial_x\sigma_{xx} + \partial_y\sigma_{xy}$ and $\partial_x\sigma_{xy} + \partial_y\sigma_{yy}$. A constant field is easy.`,
      explanation: r`(a) $a - a = 0$ and $0 + 0 = 0$ ✓. (b) $0 + 0 = 0$ but $a + 0 \ne 0$ ✗. (c) constant stresses have zero derivatives ✓. (d) $2x - 2x = 0$ and $-2y + 2y = 0$ ✓. (e) $0 + 0 = 0$ but $0 + x \ne 0$ ✗.`,
      tags: ["equilibrium-check"],
    }),
    numeric("find-k", {
      body: r`Consider the 2-D field (no body force) $\sigma_{xx} = 3x^2 y$, $\sigma_{xy} = \sigma_{yx} = k\,x y^2$, $\sigma_{yy} = y^3$.`,
      question: r`For which value of the constant $k$ is the field in equilibrium?`,
      answer: -3, // check: x-eq: ∂(3x²y)/∂x + ∂(kxy²)/∂y = 6xy + 2kxy = 0 ⇒ k = −3; y-eq: ∂(kxy²)/∂x + ∂(y³)/∂y = ky² + 3y² = 0 ⇒ k = −3 (consistent)
      tolerance: 0.01,
      prefix: r`$k =$`,
      answerDisplay: r`-3`,
      hint: "Write out the x-equation; it must hold for all x and y, which pins down k. Then make sure the y-equation agrees.",
      explanation: r`$x$: $6xy + 2kxy = 0$ for all $x, y$ requires $k = -3$. $y$: $k y^2 + 3y^2 = 0$ also requires $k = -3$ ✓. Both equations agree, so $k = -3$ gives an equilibrium field. (If they had demanded different values, no $k$ would work.)`,
      tags: ["equilibrium-check"],
    }),
    numeric("bz-3d", {
      body: r`In a 3-D body, $\sigma_{xz} = \sigma_{zx} = 2xz$, $\sigma_{yz} = \sigma_{zy} = yz$ and $\sigma_{zz} = 4z - xy$ (consistent units; the other components don't enter this equation).`,
      question: r`What body force $b_z$ is required for $\sum F_z = 0$ at the point $(1, 1, 2)$? Use the sign convention.`,
      answer: -10, // check: ∂σxz/∂x + ∂σyz/∂y + ∂σzz/∂z = 2z + z + 4 = 3z + 4 = 10 at z = 2 ⇒ bz = −10
      tolerance: 0.05,
      prefix: r`$b_z =$`,
      answerDisplay: r`-10`,
      hint: r`Use $\partial\sigma_{xz}/\partial x + \partial\sigma_{yz}/\partial y + \partial\sigma_{zz}/\partial z + b_z = 0$. Differentiate each stress with respect to its first index.`,
      explanation: r`$\dfrac{\partial(2xz)}{\partial x} + \dfrac{\partial(yz)}{\partial y} + \dfrac{\partial(4z - xy)}{\partial z} = 2z + z + 4 = 3z + 4$. At $z = 2$ this is $10$, so $b_z = -10$. Note that the $-xy$ term in $\sigma_{zz}$ does not matter here: only $\partial\sigma_{zz}/\partial z$ enters.`,
      tags: ["equilibrium-check", "body-force"],
    }),
    reading(
      "summary",
      r`**What you did:** derived equilibrium for a tiny element, saw why the stress matrix is symmetric, and checked stress fields against the equations.

**Equilibrium in stresses** (3-D; drop the $z$ terms for 2-D):

$$\frac{\partial \sigma_{xx}}{\partial x} + \frac{\partial \sigma_{yx}}{\partial y} + \frac{\partial \sigma_{zx}}{\partial z} + b_x = 0$$

$$\frac{\partial \sigma_{xy}}{\partial x} + \frac{\partial \sigma_{yy}}{\partial y} + \frac{\partial \sigma_{zy}}{\partial z} + b_y = 0$$

$$\frac{\partial \sigma_{xz}}{\partial x} + \frac{\partial \sigma_{yz}}{\partial y} + \frac{\partial \sigma_{zz}}{\partial z} + b_z = 0$$

$$\sigma_{xy} = \sigma_{yx}, \qquad \sigma_{yz} = \sigma_{zy}, \qquad \sigma_{zx} = \sigma_{xz}$$

- $\mathbf{b}$ = body force per unit **volume**.
- $j$-equation: second index $j$; differentiate by the first index.
- To check a field: every equation must hold at every point; the leftover is $-\mathbf{b}$.

Next: the same ideas in polar and spherical coordinates.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 6 · Polar and spherical stresses (Govindjee §3.3)            */
/* ------------------------------------------------------------------ */

const l6 = lesson(
  {
    id: "sm2-l6-polar-and-spherical",
    unitId: "sm2",
    title: "Polar and spherical stresses",
    summary: "The same two-subscript rule in cylindrical and spherical coordinates, the hoop/axial/radial names, and why the polar equilibrium equations pick up extra terms.",
    textbook: "Govindjee §3.3",
    minutes: 10,
  },
  [
    reading(
      "polar-components",
      r`Shafts, pipes and pressure vessels are round, so it pays to use **cylindrical (polar)** coordinates $(r, \theta, z)$: $x = r\cos\theta$, $y = r\sin\theta$, $z = z$, with unit vectors $\mathbf{e}_r$ (outward), $\mathbf{e}_\theta$ (around) and $\mathbf{e}_z$ (along the axis). The subscript rule is unchanged: **first index = normal of the cut, second = direction of the force**.

- $\sigma_{rr}$: normal stress on a cut with normal $\mathbf{e}_r$, i.e. a **cylindrical surface** $r = \text{const}$ (the **radial** stress).
- $\sigma_{\theta\theta}$: normal stress on a cut with normal $\mathbf{e}_\theta$, i.e. a radial plane $\theta = \text{const}$ containing the axis (the **hoop** stress).
- $\sigma_{zz}$: normal stress on a cross-section $z = \text{const}$ (the **axial** stress).
- $\sigma_{r\theta}$: force per area in the $\theta$-direction on the cylindrical cut with normal $\mathbf{e}_r$; likewise $\sigma_{rz}$, $\sigma_{\theta z}$, and so on.

Moment equilibrium again makes the matrix symmetric: $\sigma_{r\theta} = \sigma_{\theta r}$, $\sigma_{rz} = \sigma_{zr}$, $\sigma_{\theta z} = \sigma_{z\theta}$.

**Spherical** coordinates $(r, \theta, \phi)$ work the same way, with two angles (the book's Fig. 3.13 fixes which is which). In the wall of a pressurized spherical tank the two in-wall normal stresses $\sigma_{\theta\theta}$ and $\sigma_{\phi\phi}$ are both hoop stresses, equal by symmetry. The tank below is a cylinder: its wall carries hoop $\sigma_{\theta\theta}$ and axial $\sigma_{zz}$ (Unit 5 derives them), while $\sigma_{rr}$ goes from $-p$ inside to $0$ outside.`,
      {
        title: "Same rule, curved coordinates",
        visual: { kind: "pressure-vessel", config: { kind: "cylinder", p: 2, r: 500, t: 10, units: { pressure: "MPa", length: "mm", stress: "MPa" } } },
      },
    ),
    mc("theta-z-surface", {
      question: r`On which surface does $\sigma_{\theta z}$ act, and in which direction?`,
      choices: [
        ["right", r`On a radial plane $\theta = \text{const}$ (normal $\mathbf{e}_\theta$), pointing along the axis, $\mathbf{e}_z$`],
        ["cyl", r`On a cylindrical surface $r = \text{const}$, pointing along $\mathbf{e}_z$`, r`That is $\sigma_{rz}$: a first index $r$ means the cut's normal is $\mathbf{e}_r$.`],
        ["hoop", r`On a radial plane $\theta = \text{const}$, pointing along $\mathbf{e}_\theta$ (perpendicular to the plane)`, r`That is the normal stress $\sigma_{\theta\theta}$, the hoop stress.`],
        ["cross", r`On a cross-section $z = \text{const}$, pointing radially, $\mathbf{e}_r$`, r`That is $\sigma_{zr}$: a first index $z$ means the cut is a cross-section.`],
      ],
      correct: "right",
      shuffle: true,
      hint: r`First index $\theta$: the cut's normal is $\mathbf{e}_\theta$. Which surface has that normal? Second index $z$: the force direction.`,
      explanation: r`The cut with normal $\mathbf{e}_\theta$ is a radial plane through the axis ($\theta = \text{const}$), and the second index says the force acts along $\mathbf{e}_z$. So $\sigma_{\theta z}$ is a shear stress on a radial plane pointing along the axis; by symmetry it equals $\sigma_{z\theta}$, the torsion shear stress on the cross-section that you will meet in torsion.`,
      tags: ["polar", "nomenclature"],
    }),
    multi("r-surface", {
      question: r`Which stress components act on a cylindrical surface $r = \text{const}$ (normal $\mathbf{e}_r$)? Select all that apply.`,
      choices: [
        ["rr", r`$\sigma_{rr}$`],
        ["rt", r`$\sigma_{r\theta}$`],
        ["rz", r`$\sigma_{rz}$`],
        ["tt", r`$\sigma_{\theta\theta}$`, r`$\sigma_{\theta\theta}$ acts on radial planes, whose normal is $\mathbf{e}_\theta$.`],
        ["zz", r`$\sigma_{zz}$`, r`$\sigma_{zz}$ acts on cross-sections, whose normal is $\mathbf{e}_z$.`],
      ],
      correct: ["rr", "rt", "rz"],
      hint: r`In $\sigma_{ab}$, which index names the cut and which names the force direction? A cylindrical surface has normal $\mathbf{e}_r$.`,
      explanation: r`On the cut with normal $\mathbf{e}_r$ the traction is $(\sigma_{rr}, \sigma_{r\theta}, \sigma_{rz})$: one normal component and two shear components, exactly like the $x$-row of the Cartesian matrix.`,
      tags: ["polar", "nomenclature"],
    }),
    tf("polar-symmetric", {
      statement: r`In cylindrical coordinates, $\sigma_{r\theta} = \sigma_{\theta r}$.`,
      answer: true,
      feedback: "Moment equilibrium of the curved element works just like the Cartesian one.",
      hint: "Is the symmetry of the stress matrix a property of Cartesian axes only, or of moment equilibrium?",
      explanation: r`True. Moment equilibrium of the polar element gives $\sigma_{r\theta} = \sigma_{\theta r}$, $\sigma_{rz} = \sigma_{zr}$, $\sigma_{\theta z} = \sigma_{z\theta}$: the polar (and spherical) stress matrices are symmetric too.`,
      tags: ["polar", "symmetry"],
    }),
    mc("vessel-components", {
      question: "In the wall of a closed cylindrical pressure vessel, which list of names is right?",
      choices: [
        ["right", r`hoop $= \sigma_{\theta\theta}$, axial $= \sigma_{zz}$, radial $= \sigma_{rr}$`],
        ["swap", r`hoop $= \sigma_{zz}$, axial $= \sigma_{\theta\theta}$, radial $= \sigma_{rr}$`, r`"Hoop" means around the circumference: the force on a radial plane that points in $\mathbf{e}_\theta$.`],
        ["swap2", r`hoop $= \sigma_{rr}$, axial $= \sigma_{zz}$, radial $= \sigma_{\theta\theta}$`, r`Radial stress acts on cylindrical surfaces ($r = \text{const}$), so it is $\sigma_{rr}$.`],
        ["shear", r`hoop $= \sigma_{r\theta}$, axial $= \sigma_{rz}$, radial $= \sigma_{rr}$`, "Hoop and axial stresses are normal stresses: both indices equal."],
      ],
      correct: "right",
      shuffle: true,
      hint: "All three are normal stresses (repeated index). Which cut does each act on?",
      explanation: r`Hoop: $\sigma_{\theta\theta}$ on radial planes, pulling around the circumference. Axial: $\sigma_{zz}$ on cross-sections. Radial: $\sigma_{rr}$ on cylindrical surfaces, from $-p$ at the inner wall to $0$ at the outer wall, small next to the other two in a thin wall.`,
      tags: ["polar", "pressure-vessel"],
    }),
    matrix("polar-matrix", {
      question: r`At a point in a thick-walled tube, $\sigma_{rr} = -p$, $\sigma_{\theta\theta} = 2p$ and $\sigma_{r\theta} = 0$, with $p = 5$ MPa. Write the 2-D polar stress matrix $\begin{bmatrix}\sigma_{rr} & \sigma_{r\theta} \\ \sigma_{\theta r} & \sigma_{\theta\theta}\end{bmatrix}$ in MPa.`,
      answer: [
        [-5, 0],
        [0, 10],
      ], // check: σrr = −5, σθθ = 2·5 = 10, σrθ = σθr = 0
      tolerance: 0.01,
      prefix: r`$\boldsymbol{\sigma} =$`,
      hint: "Same layout as the Cartesian matrix: row = cut, column = direction, with r first and θ second.",
      explanation: r`Row $r$: $(\sigma_{rr}, \sigma_{r\theta}) = (-5, 0)$. Row $\theta$: $(\sigma_{\theta r}, \sigma_{\theta\theta}) = (0, 10)$. Radial compression, hoop tension, no shear: in polar coordinates a pressurized tube has a diagonal stress matrix.`,
      tags: ["polar", "stress-matrix"],
    }),
    reading(
      "polar-equilibrium",
      r`A differential element in polar coordinates is a curved wedge: its inner and outer faces are arcs of different lengths ($r\,\Delta\theta$ and $(r + \Delta r)\,\Delta\theta$), and its two side faces are not parallel. Force balance on it gives (Govindjee eq. 3.52)

$$\frac{\partial \sigma_{rr}}{\partial r} + \frac{1}{r}\frac{\partial \sigma_{r\theta}}{\partial \theta} + \frac{\partial \sigma_{rz}}{\partial z} + \frac{\sigma_{rr} - \sigma_{\theta\theta}}{r} + b_r = 0$$

$$\frac{\partial \sigma_{r\theta}}{\partial r} + \frac{1}{r}\frac{\partial \sigma_{\theta\theta}}{\partial \theta} + \frac{\partial \sigma_{\theta z}}{\partial z} + \frac{2\sigma_{r\theta}}{r} + b_\theta = 0$$

$$\frac{\partial \sigma_{rz}}{\partial r} + \frac{1}{r}\frac{\partial \sigma_{\theta z}}{\partial \theta} + \frac{\partial \sigma_{zz}}{\partial z} + \frac{\sigma_{rz}}{r} + b_z = 0$$

The terms divided by $r$ *without* derivatives come from geometry: the outer face is larger than the inner one, and the hoop forces on the two non-parallel side faces add up to a net force pointing toward the axis (the $-\sigma_{\theta\theta}/r$ term, the same effect that lets a hoop resist internal pressure). The $1/r$ in front of $\partial/\partial\theta$ turns an angle change into an arc length. The spherical equations (eq. 3.53) have more such terms; the idea is the same.

For an **axisymmetric** problem nothing depends on $\theta$, so every $\partial/\partial\theta$ term drops out.`,
      { title: "Equilibrium in polar coordinates" },
    ),
    mc("why-extra", {
      question: r`Why does the polar $r$-equation contain the term $(\sigma_{rr} - \sigma_{\theta\theta})/r$, which has no derivative in it?`,
      choices: [
        ["geometry", "Because the element is curved: its outer face is larger than its inner face, and the hoop forces on its two non-parallel side faces have a net radial component."],
        ["body", "It is a body force that only appears in polar coordinates.", r`$b_r$ is the body force. This term comes from geometry and is there even when $\mathbf{b} = \mathbf{0}$.`],
        ["moment", "It comes from moment equilibrium.", r`Moment equilibrium only gives the symmetry $\sigma_{r\theta} = \sigma_{\theta r}$ (and its partners).`],
        ["approx", "It is an approximation that is only valid for large r.", "The equations are exact; the 1/r terms matter most at small r."],
      ],
      correct: "geometry",
      shuffle: true,
      hint: "Picture the curved element. Are its inner and outer faces the same size? Are its side faces parallel?",
      explanation: r`In Cartesian coordinates opposite faces are equal and parallel, so only *changes* of stress (derivatives) survive the force balance. In polar coordinates the outer face ($(r + \Delta r)\Delta\theta$) is bigger than the inner one ($r\Delta\theta$), giving $\sigma_{rr}/r$, and the side faces are tilted by $\Delta\theta$, so the two hoop forces $\sigma_{\theta\theta}\Delta r$ have a net inward component, giving $-\sigma_{\theta\theta}/r$.`,
      tags: ["polar", "equilibrium-pde"],
    }),
    mc("axisymmetric", {
      question: "In an axisymmetric problem (a pipe under internal pressure, a shaft in torsion), what simplifies?",
      choices: [
        ["theta", r`Nothing depends on $\theta$, so every $\partial/\partial\theta$ term vanishes.`],
        ["r", r`Nothing depends on $r$.`, r`The stresses in a thick pipe certainly vary with $r$.`],
        ["shear", "All shear stresses vanish.", r`In torsion $\sigma_{\theta z} \ne 0$ even though the problem is axisymmetric.`],
        ["hoop", r`The hoop stress $\sigma_{\theta\theta}$ is zero.`, "The hoop stress is usually the largest stress in a pressurized pipe."],
      ],
      correct: "theta",
      shuffle: true,
      hint: "What does symmetry about the axis say about how quantities change as you go around the circle?",
      explanation: r`Axisymmetry means the fields look the same at every angle, so $\partial(\cdot)/\partial\theta = 0$. The $r$-equation for a long pressurized tube (no shear, no $z$-dependence, no body force) then shrinks to the ODE $\dfrac{\mathrm{d}\sigma_{rr}}{\mathrm{d}r} + \dfrac{\sigma_{rr} - \sigma_{\theta\theta}}{r} = 0$.`,
      tags: ["polar", "axisymmetric"],
    }),
    numeric("lame-hoop", {
      body: r`In the wall of a thick-walled tube under internal pressure (axisymmetric, no shear, no body force, nothing depends on $z$) the radial stress is $\sigma_{rr} = A - B/r^2$ with $A = 5$ MPa and $B = 4000$ MPa·mm².`,
      question: r`Use the $r$-equilibrium equation to find the hoop stress $\sigma_{\theta\theta}$ at $r = 20$ mm, in MPa.`,
      answer: 15, // check: r-eq: dσrr/dr + (σrr − σθθ)/r = 0 ⇒ σθθ = σrr + r·dσrr/dr = (A − B/r²) + 2B/r² = A + B/r² = 5 + 4000/400 = 15 MPa (σrr = 5 − 10 = −5 MPa, compressive)
      tolerance: 0.15,
      suffix: "MPa",
      answerDisplay: r`15\,\mathrm{MPa}`,
      hint: r`With everything else zero, the $r$-equation is $\mathrm{d}\sigma_{rr}/\mathrm{d}r + (\sigma_{rr} - \sigma_{\theta\theta})/r = 0$. Solve it for $\sigma_{\theta\theta}$, then differentiate $A - B/r^2$.`,
      explanation: r`Solving for the hoop stress: $\sigma_{\theta\theta} = \sigma_{rr} + r\,\dfrac{\mathrm{d}\sigma_{rr}}{\mathrm{d}r}$. With $\dfrac{\mathrm{d}\sigma_{rr}}{\mathrm{d}r} = \dfrac{2B}{r^3}$:

$$\sigma_{\theta\theta} = A - \frac{B}{r^2} + \frac{2B}{r^2} = A + \frac{B}{r^2} = 5 + \frac{4000}{400} = 15\ \mathrm{MPa}.$$

At this radius $\sigma_{rr} = 5 - 10 = -5$ MPa: radial compression next to 15 MPa of hoop tension, the usual picture in a pressurized wall ($\sigma_{rr}$ reaches 0 at the free outer surface, $r = \sqrt{B/A} = 28.3$ mm). Equilibrium alone fixed $\sigma_{\theta\theta}$ once $\sigma_{rr}(r)$ was known: that is the power of the polar equations.`,
      tags: ["polar", "equilibrium-pde"],
    }),
    reading(
      "summary",
      r`**What you did:** named stresses in cylindrical and spherical coordinates and used the polar equilibrium equations.

**The rules:**

- $\sigma_{ab}$ = force per area in direction $\mathbf{e}_b$ on the cut whose normal is $\mathbf{e}_a$, for $a, b \in \{r, \theta, z\}$ (or $\{r, \theta, \phi\}$).
- Radial $\sigma_{rr}$ (on $r = \text{const}$), hoop $\sigma_{\theta\theta}$ (on $\theta = \text{const}$), axial $\sigma_{zz}$ (on $z = \text{const}$).
- Symmetric: $\sigma_{r\theta} = \sigma_{\theta r}$, $\sigma_{rz} = \sigma_{zr}$, $\sigma_{\theta z} = \sigma_{z\theta}$.
- Polar equilibrium has extra terms without derivatives, such as $(\sigma_{rr} - \sigma_{\theta\theta})/r$ and $2\sigma_{r\theta}/r$ because the element is curved; axisymmetry kills every $\partial/\partial\theta$.

$$\frac{\partial \sigma_{rr}}{\partial r} + \frac{1}{r}\frac{\partial \sigma_{r\theta}}{\partial \theta} + \frac{\partial \sigma_{rz}}{\partial z} + \frac{\sigma_{rr} - \sigma_{\theta\theta}}{r} + b_r = 0$$

You've finished the Stress unit. Take the **Level Check** to see what sticks without hints.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit practice bank (Level Check)                                     */
/* ------------------------------------------------------------------ */

const practice = [
  mc("p-oblique-cut", {
    question: r`A bar with $A_0 = 500\,\mathrm{mm^2}$ carries $F = 80$ kN of tension. On a cut that makes $\theta = 60^\circ$ with the bar axis (Govindjee's convention: $\mathbf{n} = \sin\theta\,\mathbf{e}_x + \cos\theta\,\mathbf{e}_y$, $\mathbf{t} = -\cos\theta\,\mathbf{e}_x + \sin\theta\,\mathbf{e}_y$), what are $\sigma$ and $\tau$?`,
    choices: [
      ["right", r`$\sigma = 120$ MPa, $\tau = -69.3$ MPa`],
      ["angle", r`$\sigma = 40$ MPa, $\tau = -69.3$ MPa`, r`That is $\sin^2 30^\circ$: $\theta$ is the angle between the cut and the axis, not between the normal and the axis.`],
      ["sign", r`$\sigma = 120$ MPa, $\tau = +69.3$ MPa`, r`With the book's tangent, $F_t = \mathbf{F}\cdot\mathbf{t} = -F\cos\theta < 0$, so $\tau$ is negative.`],
      ["area", r`$\sigma = 138.6$ MPa, $\tau = -80$ MPa`, r`You divided the force components by $A_0$; the slanted cut has area $A_0/\sin\theta$.`],
    ],
    correct: "right",
    shuffle: true,
    hint: r`$\sigma = (F/A_0)\sin^2\theta$ and $\tau = -(F/A_0)\sin\theta\cos\theta$, with $F/A_0$ in MPa.`,
    explanation: r`$F/A_0 = 80\,000/500 = 160$ MPa. $\sigma = 160\sin^2 60^\circ = 160(0.75) = 120$ MPa; $\tau = -160\sin 60^\circ\cos 60^\circ = -160(0.866)(0.5) = -69.3$ MPa.`,
    tags: ["oblique-cut"],
  }),
  numeric("p-max-shear", {
    question: r`A $25 \times 25$ mm square bar carries an axial tension of 100 kN. What is the largest average shear stress on any cut through the bar, in MPa?`,
    answer: 80, // check: A0 = 625 mm²; F/A0 = 100 000/625 = 160 MPa; |τ|max = F/(2A0) = 80 MPa (on the 45° cut)
    tolerance: 0.8,
    suffix: "MPa",
    answerDisplay: r`80\,\mathrm{MPa}`,
    hint: "The largest shear over all cut angles has a closed form in terms of F/A0.",
    explanation: r`$|\tau|_{\max} = F/(2A_0) = 100\,000/(2 \cdot 625) = 80$ MPa, on the cut at $45^\circ$ to the axis.`,
    tags: ["oblique-cut", "extremes"],
  }),
  numeric("p-double-shear", {
    question: r`A 20 mm diameter clevis pin in double shear transmits 50 kN. What is its average shear stress, in MPa?`,
    answer: 79.58, // check: A = π·20²/4 = 314.16 mm²; τ = (50 000/2)/314.16 = 79.58 MPa
    tolerance: 0.8,
    suffix: "MPa",
    answerDisplay: r`79.6\,\mathrm{MPa}`,
    hint: "Two shear planes share the load.",
    explanation: r`$A = \pi(20)^2/4 = 314.2\,\mathrm{mm^2}$; each plane carries $25$ kN, so $\tau = 25\,000/314.2 = 79.6$ MPa.`,
    tags: ["pin", "double-shear"],
  }),
  numeric("p-glue-joint", {
    question: r`Three plates are glued into a lap joint: the middle plate carries $P$ and each outer plate $P/2$, through two glue layers of $80 \times 50$ mm each. The glue's shear strength is $\tau_{\max} = 3$ MPa and the design uses $SF = 2$. What is the largest allowed $P$, in kN?`,
    answer: 12, // check: (P/2)/(80·50) ≤ 3/2 ⇒ P ≤ 2·3·4000/2 = 12 000 N = 12 kN
    tolerance: 0.12,
    suffix: "kN",
    answerDisplay: r`12\,\mathrm{kN}`,
    hint: r`Each glue layer carries $P/2$ and may be stressed to at most $\tau_{\max}/SF$.`,
    explanation: r`$\dfrac{P/2}{80 \cdot 50} \le \dfrac{3}{2}$ gives $P \le 2(1.5)(4000) = 12\,000$ N $= 12$ kN.`,
    tags: ["lap-joint", "design"],
  }),
  mc("p-subscripts", {
    question: r`By the naming convention, what does $\sigma_{zy}$ denote?`,
    choices: [
      ["right", r`The force per area in the $y$-direction on the cut whose normal is $\mathbf{e}_z$`],
      ["xz", r`The force per area in the $z$-direction on the cut whose normal is $\mathbf{e}_x$`, r`That is $\sigma_{xz}$.`],
      ["xy", r`The force per area in the $y$-direction on the cut whose normal is $\mathbf{e}_x$`, r`That is $\sigma_{xy}$: its cut has normal $\mathbf{e}_x$.`],
      ["yy", r`The normal stress on the cut whose normal is $\mathbf{e}_y$`, r`That is $\sigma_{yy}$.`],
    ],
    correct: "right",
    shuffle: true,
    hint: "First subscript = cut normal, second = force direction.",
    explanation: r`$\sigma_{zy}$: cut with normal $\mathbf{e}_z$ (row 3), force component along $y$ (column 2). It is a shear stress.`,
    tags: ["nomenclature"],
  }),
  numeric("p-traction", {
    question: r`In 2-D, $\sigma_{xx} = 60$ MPa, $\sigma_{yy} = 20$ MPa, $\tau_{xy} = -30$ MPa. Find the traction component $t_y$ on the cut with unit normal $\mathbf{n} = 0.6\,\mathbf{e}_x + 0.8\,\mathbf{e}_y$, in MPa (use the sign convention).`,
    answer: -2, // check: ty = σxy·nx + σyy·ny = (−30)(0.6) + 20(0.8) = −18 + 16 = −2 MPa (tx = 60·0.6 − 30·0.8 = 12)
    tolerance: 0.05,
    suffix: "MPa",
    answerDisplay: r`-2\,\mathrm{MPa}`,
    hint: r`$\mathbf{t} = \boldsymbol{\sigma}\mathbf{n}$; $t_y$ is the second row of the matrix dotted with $\mathbf{n}$.`,
    explanation: r`$t_y = \sigma_{xy}n_x + \sigma_{yy}n_y = (-30)(0.6) + 20(0.8) = -18 + 16 = -2$ MPa. (And $t_x = 60(0.6) + (-30)(0.8) = 12$ MPa.)`,
    tags: ["cauchy", "traction"],
  }),
  numeric("p-normal-shear", {
    question: r`At a point, $\boldsymbol{\sigma} = \begin{bmatrix} 30 & 0 & 10 \\ 0 & 20 & 0 \\ 10 & 0 & -10 \end{bmatrix}$ MPa. On the cut with unit normal $\mathbf{n} = 0.6\,\mathbf{e}_x + 0.8\,\mathbf{e}_z$, what is the magnitude of the shear stress, in MPa?`,
    answer: 22, // check: t = σn = (30·0.6 + 10·0.8, 0, 10·0.6 − 10·0.8) = (26, 0, −2); σn = 26·0.6 + (−2)·0.8 = 14; τ = √(26² + 2² − 14²) = √(680 − 196) = √484 = 22 MPa
    tolerance: 0.2,
    suffix: "MPa",
    answerDisplay: r`22\,\mathrm{MPa}`,
    hint: r`Find $\mathbf{t} = \boldsymbol{\sigma}\mathbf{n}$, then $\sigma_n = \mathbf{t}\cdot\mathbf{n}$, then $\tau = \sqrt{|\mathbf{t}|^2 - \sigma_n^2}$.`,
    explanation: r`$\mathbf{t} = (30(0.6) + 10(0.8),\ 0,\ 10(0.6) - 10(0.8)) = (26, 0, -2)$ MPa. $\sigma_n = 26(0.6) + (-2)(0.8) = 14$ MPa. $|\mathbf{t}|^2 = 676 + 4 = 680$, so $\tau = \sqrt{680 - 196} = \sqrt{484} = 22$ MPa.`,
    tags: ["cauchy", "normal-shear"],
  }),
  numeric("p-resultant-moment", {
    question: r`A cut with normal $\mathbf{e}_y$ spans $-30 \le x \le 30$ mm and $-15 \le z \le 15$ mm, and carries $\sigma_{yy} = 2x$ MPa ($x$ in mm) and no shear. What is the moment $M_z$ about the origin, in kN·m?`,
    answer: 1.08, // check: Mz = ∫x·σyy dA = 2∫x² dA = 2·(30 mm)·(60³/12 mm³) = 2·540 000 = 1 080 000 N·mm = 1.08 kN·m
    tolerance: 0.012,
    suffix: "kN·m",
    answerDisplay: r`1.08\,\mathrm{kN\,m}`,
    hint: r`On a $y$-cut, $M_z = \int_A x\,\sigma_{yy}\,\mathrm{d}A$. Integrate over the rectangle; $\int x^2\,\mathrm{d}A$ about the centre is (width in $z$)$\times$(length in $x$)$^3/12$.`,
    explanation: r`$M_z = \int_A x(2x)\,\mathrm{d}A = 2\int_A x^2\,\mathrm{d}A = 2\cdot\dfrac{30 \cdot 60^3}{12} = 2(540\,000) = 1\,080\,000$ N·mm $= 1.08$ kN·m. The force $F_y = \int 2x\,\mathrm{d}A = 0$ and $M_x = -\int z(2x)\,\mathrm{d}A = 0$ by symmetry.`,
    tags: ["resultants", "moment"],
  }),
  mc("p-equilibrium-check", {
    question: r`With no body force, is the 2-D field $\sigma_{xx} = x^2 y$, $\sigma_{xy} = \sigma_{yx} = -x y^2$, $\sigma_{yy} = y^3/3$ in equilibrium?`,
    choices: [
      ["yes", "Yes: both equilibrium equations hold everywhere."],
      ["no-x", r`No: the $x$-equation fails.`, r`$\partial(x^2y)/\partial x + \partial(-xy^2)/\partial y = 2xy - 2xy = 0$.`],
      ["no-y", r`No: the $y$-equation fails.`, r`$\partial(-xy^2)/\partial x + \partial(y^3/3)/\partial y = -y^2 + y^2 = 0$.`],
      ["origin", "Only at the origin.", "Both left-hand sides vanish identically, not just at one point."],
    ],
    correct: "yes",
    hint: r`Check $\partial_x\sigma_{xx} + \partial_y\sigma_{yx} = 0$ and $\partial_x\sigma_{xy} + \partial_y\sigma_{yy} = 0$.`,
    explanation: r`$x$: $2xy - 2xy = 0$ ✓. $y$: $-y^2 + y^2 = 0$ ✓. Symmetric by construction ✓. So the field is in equilibrium with $\mathbf{b} = \mathbf{0}$.`,
    tags: ["equilibrium-check"],
  }),
  numeric("p-body-force", {
    question: r`The 2-D field $\sigma_{xx} = 4xy$, $\sigma_{xy} = \sigma_{yx} = x - 2y^2$, $\sigma_{yy} = x y^2$ is given in consistent units. What body force $b_y$ is needed for equilibrium at $(x, y) = (2, 1)$? Use the sign convention.`,
    answer: -5, // check: x-eq: 4y − 4y = 0 ✓; y-eq: ∂σxy/∂x + ∂σyy/∂y = 1 + 2xy = 5 at (2, 1) ⇒ by = −5
    tolerance: 0.05,
    prefix: r`$b_y =$`,
    answerDisplay: r`-5`,
    hint: r`The $y$-equation is $\partial\sigma_{xy}/\partial x + \partial\sigma_{yy}/\partial y + b_y = 0$.`,
    explanation: r`$\partial(x - 2y^2)/\partial x + \partial(xy^2)/\partial y = 1 + 2xy = 1 + 4 = 5$ at $(2, 1)$, so $b_y = -5$. (The $x$-equation, $4y - 4y = 0$, already holds.)`,
    tags: ["equilibrium-check", "body-force"],
  }),
  tf("p-symmetry", {
    statement: r`The symmetry $\sigma_{xy} = \sigma_{yx}$ holds only when there are no body forces.`,
    answer: false,
    feedback: r`In the moment balance the body-force terms carry an extra factor of $\Delta x$ or $\Delta y$. What happens to them in the limit?`,
    hint: "Recall how the body-force terms behave in the moment balance as the element shrinks.",
    explanation: r`False. The body force contributes moments proportional to $b\,t\Delta x\Delta y \cdot \Delta x$ (or $\Delta y$); after dividing by $t\Delta x\Delta y$ they vanish as the element shrinks, so $\sigma_{xy} = \sigma_{yx}$ holds with or without body forces.`,
    tags: ["symmetry"],
  }),
  mc("p-polar", {
    question: r`In a shaft described in cylindrical coordinates, what does $\sigma_{rz}$ describe?`,
    choices: [
      ["right", r`The force per area along the axis ($\mathbf{e}_z$) on a cylindrical surface $r = \text{const}$`],
      ["rt", r`The force per area around the circle ($\mathbf{e}_\theta$) on a cylindrical surface $r = \text{const}$`, r`That is $\sigma_{r\theta}$.`],
      ["hoop", "The hoop stress", r`The hoop stress is the normal stress $\sigma_{\theta\theta}$.`],
      ["torsion", "The torsion shear stress on the cross-section", r`On the cross-section ($z$-cut) torsion shear points around the circle: that is $\sigma_{z\theta}$.`],
    ],
    correct: "right",
    shuffle: true,
    hint: "Same rule as Cartesian: the first index names the cut through its normal, the second the force direction.",
    explanation: r`First index $r$: the cut with normal $\mathbf{e}_r$, a cylindrical surface. Second index $z$: force along the axis. So $\sigma_{rz}$ is an axial shear stress on a cylindrical surface (equal to $\sigma_{zr}$ by symmetry).`,
    tags: ["polar", "nomenclature"],
  }),
];

/* ------------------------------------------------------------------ */
/* Unit                                                                 */
/* ------------------------------------------------------------------ */

export const sm2: Unit = {
  id: "sm2",
  title: "Stress",
  subtitle: "Average stresses, the stress tensor, Cauchy's law, equilibrium",
  description: "Stress is more than force over area: a tensor with a cut direction and a force direction. Learn the subscript convention, read internal resultants off a stress field, and write equilibrium as partial differential equations.",
  textbook: "Govindjee ch. 3",
  lessons: [l1, l2, l3, l4, l5, l6],
  practice,
  generators: ["gen.sm.average-shear", "gen.sm.oblique-cut", "gen.sm.traction-vector", "gen.sm.equilibrium-check", "gen.sm.stress-resultants", "gen.sm.lap-joint"],
};
