import type { AxialBarConfig, QuestionStep, Unit, VisualSpec } from "../types";
import { lesson, mc, numeric, order, r, reading, tf } from "../dsl";

/*
 * Unit sm1 · Axial bars (Govindjee ch. 2).
 *
 * Sign conventions follow the book: x along the bar, u(x) positive toward +x,
 * internal force R(x) positive in tension, b(x) = applied force per unit length
 * positive toward +x, dR/dx + b = 0. Units are N, mm and MPa (= N/mm²) unless a
 * problem says otherwise. Every numeric answer carries a "check" comment.
 */

const UNITS = { length: "mm", force: "N", stress: "MPa", displacement: "mm" };

/** Axial-bar visual with raw numbers in N, mm and N/mm² (so stresses read in MPa, displacements in mm). */
function bar(config: Omit<AxialBarConfig, "units">): VisualSpec {
  return { kind: "axial-bar", config: { ...config, units: UNITS } };
}

/* ------------------------------------------------------------------ */
/* Lesson 1 · Displacement and strain (Govindjee §2.1)                 */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "sm1-l1-displacement-and-strain",
    unitId: "sm1",
    title: "Displacement and strain",
    summary: "Describe how a bar deforms with a displacement field u(x), and measure deformation with average and pointwise strain.",
    textbook: "Govindjee §2.1",
    minutes: 10,
  },
  [
    reading(
      "displacement",
      r`Pull on a bar that is built into a wall and every material point moves a little along the bar's axis. Label each particle by where it sat before loading, $x$. The **displacement field**

$$u = u(x)$$

says how far the particle that started at $x$ has moved (positive toward $+x$). In the picture, points at the wall have $u = 0$ and the loaded end moves the most.

Loads don't just move a body — they cause *differential* motion. The change in length of the whole bar is $\delta = u(L) - u(0)$, and the simplest measure of deformation is the **average strain**, the engineer's "delta ell over ell":

$$\varepsilon_{\text{avg}} = \frac{\Delta\ell}{\ell}.$$

Strain is length per length, so it is **dimensionless**. A rigid motion (the same $u$ for every point) moves the bar without straining it.

> Metals in the elastic range have strains of order $10^{-6}$ to $10^{-3}$, so strains are quoted in **micro-strain**: $1\,\mu = 10^{-6}$ (so $750\,\mu = 0.00075$). Rubber and soft tissue easily reach strains of order 1.`,
      {
        title: "Where does each point go?",
        visual: bar({
          segments: [{ length: 1000, E: 200000, A: 100 }],
          loads: [{ x: 1000, P: 10000, label: "P" }],
          fixed: "left",
          show: ["u"],
          sliders: true,
        }),
      },
    ),
    numeric("avg-strain", {
      question: r`A 2 m long steel bar stretches by 1.5 mm under load. What is its average strain? Give it in micro-strain ($10^{-6}$).`,
      answer: 750, // check: 1.5 mm / 2000 mm = 7.5e-4 = 750 μ
      tolerance: 5,
      suffix: "μ",
      answerDisplay: r`750\,\mu`,
      hint: "Put both lengths in the same unit first. Strain is the change in length divided by the original length.",
      explanation: r`$\varepsilon = \Delta\ell/\ell = 1.5\,\mathrm{mm} / 2000\,\mathrm{mm} = 7.5\times10^{-4} = 750\,\mu$. The units cancel — which is exactly why both lengths must be in the same unit (2 m = 2000 mm).`,
      tags: ["strain", "units"],
    }),
    tf("strain-units", {
      statement: "Strain has units of millimetres.",
      answer: false,
      feedback: "Strain is a change in length *divided by* a length. What happens to the units?",
      hint: r`Write out the units of $\Delta\ell/\ell$.`,
      explanation: r`False. $\varepsilon = \Delta\ell/\ell$ is length per unit length: dimensionless. You will see it written as mm/mm, in/in or micro-strain ($\mu = 10^{-6}$), but those are bookkeeping labels — the same strain is $750\,\mu$ whether you measured in millimetres or in inches.`,
      tags: ["strain", "units"],
    }),
    numeric("rubber", {
      body: "Elastomers and biological tissue are different: their strains are not small.",
      question: "A 100 mm rubber band is stretched to 250 mm. What is its average strain, as a plain decimal?",
      answer: 1.5, // check: (250 − 100)/100 = 1.5
      tolerance: 0.015,
      answerDisplay: "1.5",
      hint: "Use the change in length, not the new length.",
      explanation: r`$\varepsilon = (250 - 100)/100 = 1.5$, i.e. 150 %. That is a strain of order 1 — thousands of times larger than typical elastic strains in steel.`,
      tags: ["strain"],
    }),
    mc("rigid", {
      question: r`Every point of a bar moves by the same amount, $u(x) = 3\,\mathrm{mm}$. What is the strain in the bar?`,
      choices: [
        ["zero", "$0$ everywhere"],
        ["three", "$3$ everywhere", "3 mm is a displacement, not a strain. Strain measures how much *neighbouring* points move relative to each other."],
        ["3L", "$3/L$ (3 mm divided by the bar length)", "That would be right if one end stayed put while the other moved 3 mm. Here both ends move 3 mm, so the length doesn't change."],
        ["cant", "It can't be found without knowing the load", "Strain is pure kinematics — the displacement field is all you need."],
      ],
      correct: "zero",
      shuffle: true,
      hint: "Does the bar get any longer?",
      explanation: r`The change in length is $u(L) - u(0) = 3 - 3 = 0$, and $du/dx = 0$ at every point, so the strain is zero. A uniform displacement is a **rigid translation**: strain is only non-zero when the motion is not rigid.`,
      tags: ["strain", "kinematics"],
    }),
    reading(
      "pointwise",
      r`Average strain treats the whole bar as one piece. To get strain **at a point**, look at a short segment from $x$ to $x + \Delta x$. Its ends move by $u(x)$ and $u(x + \Delta x)$, so it stretches by $u(x + \Delta x) - u(x)$ and its average strain is

$$\varepsilon = \frac{u(x + \Delta x) - u(x)}{\Delta x}.$$

Letting $\Delta x \to 0$ gives the pointwise strain — the **strain–displacement relation**, the kinematic equation of every bar problem:

$$\varepsilon(x) = \frac{du}{dx}.$$

- Sign convention: $\varepsilon > 0$ is elongation, $\varepsilon < 0$ is contraction.
- Going backwards, the stretch of any piece $a \le x \le b$ is $u(b) - u(a) = \int_a^b \varepsilon\,dx$.`,
      { title: "Strain at a point" },
    ),
    numeric("eps-from-u", {
      body: r`A loaded bar has the displacement field $u(x) = 2\times10^{-3}\,x + 4\times10^{-6}\,x^2$, with $u$ and $x$ in mm.`,
      question: r`What is the strain at $x = 250\,\mathrm{mm}$? Give it in micro-strain.`,
      answer: 4000, // check: du/dx = 2e-3 + 2·4e-6·x = 2e-3 + 8e-6·250 = 2e-3 + 2e-3 = 4e-3 = 4000 μ
      tolerance: 40,
      suffix: "μ",
      answerDisplay: r`4000\,\mu`,
      hint: r`Differentiate $u(x)$, then substitute $x = 250$. Both terms contribute.`,
      explanation: r`$\varepsilon = du/dx = 2\times10^{-3} + 8\times10^{-6}\,x$. At $x = 250$: $0.002 + 0.002 = 0.004 = 4000\,\mu$. Because $u$ is quadratic, the strain here varies linearly along the bar — it is not the same everywhere.`,
      tags: ["strain", "kinematics"],
    }),
    mc("linear-u", {
      question: r`If the displacement field is linear, $u(x) = c_0 + c_1 x$, the strain in the bar is…`,
      choices: [
        ["const", r`constant, equal to $c_1$`],
        ["lin", r`linear in $x$`, "Differentiate: the derivative of a linear function is a constant."],
        ["zero", "zero", r`Only if $c_1 = 0$. The constant $c_0$ is a rigid translation and drops out, but $c_1 x$ stretches the bar.`],
        ["c0", r`constant, equal to $c_0$`, r`$c_0$ is the same shift for every point — a rigid translation — and strains nothing.`],
      ],
      correct: "const",
      shuffle: true,
      hint: r`Apply $\varepsilon = du/dx$.`,
      explanation: r`$\varepsilon = du/dx = c_1$ at every point: uniform strain. Conversely, uniform strain means $u$ is linear in $x$. The constant $c_0$ is a rigid translation.`,
      tags: ["strain", "kinematics"],
    }),
    numeric("elongation-integral", {
      question: r`A 3 m bar has a uniform strain of $500\,\mu$. By how much does it stretch? Answer in mm.`,
      answer: 1.5, // check: 500e-6 × 3000 mm = 1.5 mm
      tolerance: 0.015,
      suffix: "mm",
      answerDisplay: r`1.5\,\mathrm{mm}`,
      hint: r`$u(L) - u(0) = \int_0^L \varepsilon\,dx$ — and here the strain is constant.`,
      explanation: r`$\delta = \int_0^L \varepsilon\,dx = \varepsilon L = (500\times10^{-6})(3000\,\mathrm{mm}) = 1.5\,\mathrm{mm}$.`,
      tags: ["strain", "elongation"],
    }),
    numeric("shortening-sign", {
      question: "A 400.00 mm strut is squeezed to 399.80 mm. What is its strain in micro-strain? Use the sign convention.",
      answer: -500, // check: (399.80 − 400.00)/400 = −0.20/400 = −5e-4 = −500 μ
      tolerance: 5,
      suffix: "μ",
      answerDisplay: r`-500\,\mu`,
      hint: "Strain is (new length − original length)/(original length). Which sign does that give when the strut gets shorter?",
      explanation: r`$\varepsilon = (399.80 - 400.00)/400 = -0.20/400 = -5\times10^{-4} = -500\,\mu$. Negative strain means **contraction**.`,
      tags: ["strain", "sign-convention"],
    }),
    numeric("gauges", {
      body: r`Two scribed marks on a bar sit at $x = 100\,\mathrm{mm}$ and $x = 300\,\mathrm{mm}$. After loading, the first has moved $u = 0.08\,\mathrm{mm}$ and the second $u = 0.20\,\mathrm{mm}$.`,
      question: "What is the average strain of the segment between the marks, in micro-strain?",
      answer: 600, // check: (0.20 − 0.08)/(300 − 100) = 0.12/200 = 6e-4 = 600 μ
      tolerance: 6,
      suffix: "μ",
      answerDisplay: r`600\,\mu`,
      hint: "The segment's change in length is the *difference* of the two displacements; its original length is the spacing of the marks.",
      explanation: r`$\varepsilon = \dfrac{u(300) - u(100)}{300 - 100} = \dfrac{0.20 - 0.08}{200} = 6\times10^{-4} = 600\,\mu$. Dividing $0.20$ by $300$ instead would wrongly mix in the stretch of the first 100 mm of bar.`,
      tags: ["strain"],
    }),
    mc("max-u-vs-max-eps", {
      body: r`A uniform bar is built into a wall at $x = 0$ and pulled by a force $P$ at its free end $x = L$ — the bar in the first picture.`,
      question: "Where is the displacement largest, and where is the strain largest?",
      choices: [
        ["a", "Displacement: at the free end. Strain: the same everywhere."],
        ["b", "Both are largest at the free end.", "The free end moves the most, but every segment is stretched by the same fraction — each one carries the same pull $P$."],
        ["c", "Both are largest at the wall.", r`Points at the wall don't move at all: $u(0) = 0$.`],
        ["d", "Displacement: at the free end. Strain: at the wall.", "That's the pattern of a bar hanging under its own weight. With only an end load, every segment carries the same force."],
      ],
      correct: "a",
      shuffle: true,
      hint: r`Displacement accumulates along the bar; strain is the local rate $du/dx$. Is any segment stretched more than another?`,
      explanation: r`Every segment carries the same pull $P$, so every segment stretches by the same fraction: $\varepsilon$ is uniform and $u(x)$ grows linearly from $0$ at the wall to its maximum at the free end. "Largest displacement" and "largest strain" are different questions — keep them apart.`,
      tags: ["strain", "kinematics"],
    }),
    reading(
      "summary",
      r`**What you did:** described deformation with a displacement field, turned it into average and pointwise strain, and went back from strain to elongation.

- Displacement field $u(x)$: how far the particle that started at $x$ moves; $u = 0$ at a wall.
- Average strain: $\varepsilon = \Delta\ell/\ell$, dimensionless; $1\,\mu = 10^{-6}$.
- Strain at a point: $\varepsilon = du/dx$; positive = elongation, negative = contraction.
- Elongation of a piece: $u(b) - u(a) = \int_a^b \varepsilon\,dx$; a rigid motion ($u$ constant) has zero strain.

Next: the forces that cause the motion — internal force and stress.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Stress and pointwise equilibrium (Govindjee §2.2)        */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "sm1-l2-stress-and-equilibrium",
    unitId: "sm1",
    title: "Stress and pointwise equilibrium",
    summary: "Find the internal force R(x) with section cuts, turn it into stress, and derive dR/dx + b = 0.",
    textbook: "Govindjee §2.2",
    minutes: 12,
  },
  [
    reading(
      "stress",
      r`Cut the bar at position $x$. The two pieces pull (or push) on each other with an **internal force** $R(x)$, found from equilibrium of either piece. The force per unit area on the cut is the **stress**:

$$\sigma(x) = \frac{R(x)}{A(x)}.$$

- Sign convention: $R > 0$ (and $\sigma > 0$) is **tension**; $R < 0$ ($\sigma < 0$) is **compression**.
- Section-cut rule: draw $R$ as a pull on the cut. For the piece to the right of the cut, $R$ = the sum of the loads on that piece, counted positive toward $+x$.
- Units: psi or ksi in US units; in SI, $1\,\mathrm{MPa} = 1\,\mathrm{N/mm^2} = 10^6\,\mathrm{N/m^2}$, and $1\,\mathrm{GPa} = 1000\,\mathrm{MPa}$.

In the picture a bar with $A = 250\,\mathrm{mm^2}$ is pulled by 40 kN at mid-length and pushed back toward the wall by 15 kN at its tip. A cut left of mid-length has both loads on its right: $R = 40 - 15 = 25\,\mathrm{kN}$ ($\sigma = 100\,\mathrm{MPa}$). A cut right of mid-length has only the 15 kN push: $R = -15\,\mathrm{kN}$ ($\sigma = -60\,\mathrm{MPa}$).`,
      {
        title: "Force per area on a cut",
        visual: bar({
          segments: [{ length: 1000, E: 200000, A: 250 }],
          loads: [
            { x: 500, P: 40000, label: "40 kN" },
            { x: 1000, P: -15000, label: "15 kN" },
          ],
          fixed: "left",
          show: ["R", "sigma"],
        }),
      },
    ),
    numeric("area-d20", {
      question: r`What is the cross-sectional area of a solid round bar of diameter $d = 20\,\mathrm{mm}$? Answer in $\mathrm{mm^2}$ to three significant figures.`,
      answer: 314.16, // check: π·20²/4 = 100π = 314.159 mm²
      tolerance: 3,
      suffix: "mm²",
      answerDisplay: r`314\,\mathrm{mm^2}`,
      hint: r`$A = \pi d^2/4$ — make sure you use the diameter, not the radius, in that form.`,
      explanation: r`$A = \pi d^2/4 = \pi(20)^2/4 = 100\pi = 314.2\,\mathrm{mm^2}$. A classic slip is $\pi d^2 = 1257\,\mathrm{mm^2}$, four times too big.`,
      tags: ["stress", "geometry"],
    }),
    numeric("sigma-round", {
      question: "That bar carries an axial pull of 50 kN. What is the normal stress? Answer in MPa to three significant figures.",
      answer: 159.15, // check: 50 000 N / 314.159 mm² = 159.155 MPa
      tolerance: 2,
      suffix: "MPa",
      answerDisplay: r`159\,\mathrm{MPa}`,
      hint: "Convert kN to N and keep the area in mm²; then N/mm² is already MPa.",
      explanation: r`$\sigma = R/A = 50\,000\,\mathrm{N} / 314.2\,\mathrm{mm^2} = 159\,\mathrm{N/mm^2} = 159\,\mathrm{MPa}$, positive because the bar is in tension.`,
      tags: ["stress"],
    }),
    numeric("unit-conv", {
      question: r`Aluminium has $E = 70\,\mathrm{GPa}$. Write it in $\mathrm{N/mm^2}$ — the unit you need when lengths are in mm and forces in N.`,
      answer: 70000, // check: 70 GPa = 70 000 MPa = 70 000 N/mm²
      tolerance: 1,
      suffix: "N/mm²",
      answerDisplay: r`70\,000\,\mathrm{N/mm^2}`,
      hint: r`$1\,\mathrm{GPa} = 1000\,\mathrm{MPa}$ and $1\,\mathrm{MPa} = 1\,\mathrm{N/mm^2}$.`,
      explanation: r`$70\,\mathrm{GPa} = 70\times10^9\,\mathrm{N/m^2}$, and $1\,\mathrm{m^2} = 10^6\,\mathrm{mm^2}$, so $E = 70\times10^9/10^6 = 70\,000\,\mathrm{N/mm^2}$. Shortcut: GPa to MPa multiplies by 1000, and MPa is N/mm².`,
      tags: ["units"],
    }),
    mc("negative-sigma", {
      question: r`A calculation gives $\sigma = -85\,\mathrm{MPa}$ in part of a bar. What does the minus sign tell you?`,
      choices: [
        ["comp", "That part of the bar is in compression."],
        ["side", "The section cut was analysed from the wrong side.", r`Either piece gives the same $R(x)$ — that is what makes $R$ a well-defined internal force. The sign is physical.`],
        ["error", "There is an arithmetic error: stresses can't be negative.", "Stress carries a sign on purpose: in this course tension is positive and compression negative."],
        ["yield", "The material has yielded.", "Yield depends on the magnitude compared with the yield stress, not on the sign."],
      ],
      correct: "comp",
      shuffle: true,
      hint: r`Recall the sign convention for $R$ and $\sigma$.`,
      explanation: r`By convention $R > 0$ is tension and $R < 0$ compression, and $\sigma = R/A$ inherits the sign. $\sigma = -85\,\mathrm{MPa}$ means that segment is being squeezed with $85\,\mathrm{N/mm^2}$.`,
      tags: ["stress", "sign-convention"],
    }),
    numeric("piecewise-R", {
      body: r`A bar is built into a wall at its left end $x = 0$. At mid-length a force of 50 kN pushes it **toward the wall**, and at the free right end a force of 30 kN pulls it **away from the wall**.`,
      question: r`What is the internal force $R$ in the half next to the wall? Answer in kN, using the sign convention (tension positive).`,
      answer: -20, // check: cut at x < L/2, right piece carries +30 − 50 = −20 kN ⇒ R = −20 kN
      tolerance: 0.2,
      suffix: "kN",
      hint: "Cut between the wall and the mid-length load and keep the piece to the *right* of the cut, so the unknown wall reaction never appears. Which loads act on that piece, and in which directions?",
      explanation: r`Cut at $x < L/2$ and keep the right piece. With $R$ drawn as a pull on the cut, equilibrium gives $R = (+30) + (-50) = -20\,\mathrm{kN}$: compression. A cut beyond mid-length sees only the 30 kN pull, so $R = +30\,\mathrm{kN}$ there. Check with the left piece: overall balance says the wall pushes the bar with 20 kN toward $+x$, and the left piece needs $20 + R = 0$, so $R = -20\,\mathrm{kN}$ ✓.`,
      tags: ["internal-force", "sign-convention"],
    }),
    reading(
      "equilibrium",
      r`Loads can also be spread along the bar: $b(x)$ is the applied force **per unit length** (N/mm), positive toward $+x$ — the weight of a hanging bar, soil friction on a pile, the centrifugal pull on a spinning rod.

Cut out a slice from $x$ to $x + \Delta x$. Force balance on it:

$$R(x + \Delta x) + b(x)\,\Delta x - R(x) = 0.$$

Divide by $\Delta x$ and let $\Delta x \to 0$:

$$\frac{dR}{dx} + b = 0 \qquad\Longleftrightarrow\qquad \frac{d}{dx}(A\sigma) + b = 0.$$

- With no distributed load, $R$ is constant between point loads.
- A point force $P$ toward $+x$ at $x = a$ makes $R$ **drop** by $P$ as you move past it in the $+x$ direction.
- For a bar whose end $x = L$ is free and unloaded, $R(x) = \int_x^L b(s)\,ds$: the total distributed load beyond the cut.

Stress can only be found through equilibrium: $\sigma = R/A$, and $R$ comes from cuts or from $dR/dx = -b$.`,
      { title: "Equilibrium of a slice" },
    ),
    mc("pointwise-eq", {
      question: "Which equation expresses **equilibrium at a point** of an axial bar?",
      choices: [
        ["eq", r`$\dfrac{dR}{dx} + b = 0$`],
        ["kin", r`$\varepsilon = \dfrac{du}{dx}$`, "That's kinematics — the strain–displacement relation."],
        ["con", r`$\sigma = E\varepsilon$`, "That's a constitutive law (Hooke's law, next lesson)."],
        ["def", r`$\sigma = \dfrac{R}{A}$`, "That's the definition of stress, not a balance of forces."],
      ],
      correct: "eq",
      shuffle: true,
      hint: "Which equation came from summing forces on a slice?",
      explanation: r`$dR/dx + b = 0$ is force balance on an infinitesimal slice (equivalently $d(A\sigma)/dx + b = 0$). The others are the remaining ingredients of every mechanics problem: kinematics, the constitutive law, and the definition of stress.`,
      tags: ["equilibrium"],
    }),
    tf("constant-between", {
      statement: r`If there is no distributed load ($b = 0$) on a stretch of bar, the internal force is constant along that stretch.`,
      answer: true,
      feedback: r`Look at $dR/dx + b = 0$ with $b = 0$.`,
      hint: r`What does $dR/dx = 0$ say about $R$?`,
      explanation: r`True: with $b = 0$, $dR/dx = 0$, so $R$ is constant between point loads. That's why $R(x)$ diagrams for point-loaded bars are flat steps with jumps at the loads.`,
      tags: ["equilibrium"],
    }),
    mc("jump", {
      question: r`A point force of 12 kN pointing toward $+x$ acts at $x = a$. As you move along the bar in the $+x$ direction past $x = a$, the internal force $R$…`,
      choices: [
        ["down", "drops by 12 kN"],
        ["up", "rises by 12 kN", r`Write force balance for a thin slice around $x = a$: $R(a^+) - R(a^-) + 12 = 0$.`],
        ["none", "doesn't change", "A point load always produces a jump; only a distributed load changes $R$ gradually."],
        ["depends", "rises or drops depending on which end is fixed", "The jump comes from equilibrium of a thin slice around the load, which doesn't care where the supports are."],
      ],
      correct: "down",
      shuffle: true,
      hint: r`Draw a thin slice around $x = a$ with $R(a^-)$ on its left face and $R(a^+)$ on its right face, both drawn as pulls.`,
      explanation: r`On the slice, $R(a^+)$ pulls toward $+x$, $R(a^-)$ pulls toward $-x$, and the load adds $+12$: $R(a^+) - R(a^-) + 12 = 0$, so $R(a^+) = R(a^-) - 12\,\mathrm{kN}$. Example: a bar fixed at the left and pulled by 12 kN at its tip carries $R = 12\,\mathrm{kN}$ just left of the tip and $0$ beyond it — a drop of 12.`,
      tags: ["equilibrium", "sign-convention"],
    }),
    numeric("hanging-bar", {
      body: r`A steel rod hangs from the ceiling, with $x$ measured **down** from the support. Its weight acts as a distributed load $b = \gamma A$ ($\gamma$ = weight per unit volume), so a cut at $x$ must hold up the part below it: $R(x) = \gamma A(L - x)$.`,
      question: r`Find $R$ at the support for $\gamma = 77\,\mathrm{kN/m^3}$, $A = 500\,\mathrm{mm^2}$ and $L = 4\,\mathrm{m}$. Answer in N.`,
      answer: 154, // check: R(0) = γAL = 77 000 N/m³ × 500e-6 m² × 4 m = 38.5 N/m × 4 m = 154 N
      tolerance: 1.5,
      suffix: "N",
      hint: r`Work in metres: $500\,\mathrm{mm^2} = 500\times10^{-6}\,\mathrm{m^2}$. The support is at $x = 0$.`,
      explanation: r`$R(0) = \gamma A L = (77\,000\,\mathrm{N/m^3})(5\times10^{-4}\,\mathrm{m^2})(4\,\mathrm{m}) = 154\,\mathrm{N}$ — simply the rod's weight. The stress there is $154/500 = 0.31\,\mathrm{MPa}$: self-weight stresses in short metal bars are tiny. $R$ falls linearly to zero at the free bottom end, consistent with $dR/dx = -\gamma A$.`,
      tags: ["internal-force", "distributed-load"],
    }),
    numeric("uniform-b0", {
      body: r`A bar built in at $x = 0$ and free at $x = L$ carries a uniform distributed load $b_0$ pulling toward $+x$ (away from the wall).`,
      question: r`For $b_0 = 2.5\,\mathrm{N/mm}$ and $L = 1.2\,\mathrm{m}$, what is the internal force at $x = 400\,\mathrm{mm}$? Answer in kN.`,
      answer: 2, // check: R(x) = b0(L − x) = 2.5 × (1200 − 400) = 2.5 × 800 = 2000 N = 2 kN
      tolerance: 0.02,
      suffix: "kN",
      hint: r`Cut at $x = 400\,\mathrm{mm}$ and keep the piece beyond the cut (free end, no reaction). How much distributed load sits on it?`,
      explanation: r`The piece beyond the cut is $L - x = 800\,\mathrm{mm}$ long and carries $b_0(L - x) = 2.5\times800 = 2000\,\mathrm{N}$ toward $+x$, so $R(400) = 2\,\mathrm{kN}$ (tension). In general $R(x) = b_0(L - x)$: it satisfies $dR/dx = -b_0$ and $R(L) = 0$, and at the wall $R(0) = b_0L = 3\,\mathrm{kN}$, the total load.`,
      tags: ["internal-force", "distributed-load"],
    }),
    numeric("linear-b", {
      body: r`Now the distributed load grows along the bar: $b(x) = c\,x$ with $c = 2\,\mathrm{N/mm^2}$ ($x$ in mm, $b$ in N/mm), pulling toward $+x$ (away from the wall). The bar is built in at $x = 0$ and free at $x = L = 300\,\mathrm{mm}$.`,
      question: r`What is the internal force at the wall, $R(0)$? Answer in kN.`,
      answer: 90, // check: R(x) = ∫_x^L c s ds = c(L² − x²)/2; R(0) = 2 × 300²/2 = 90 000 N = 90 kN
      tolerance: 0.9,
      suffix: "kN",
      hint: r`Integrate $dR/dx = -c\,x$ and use the free-end condition $R(L) = 0$ — or add up all the load beyond the cut, $\int_x^L b\,ds$.`,
      explanation: r`$R(x) = \int_x^L c\,s\,ds = \tfrac{c}{2}(L^2 - x^2)$, so $R(0) = \tfrac12(2)(300)^2 = 90\,000\,\mathrm{N} = 90\,\mathrm{kN}$. $R$ is *not* linear here: at mid-length $R = \tfrac{c}{2}(L^2 - L^2/4) = 67.5\,\mathrm{kN}$, three quarters of the wall value, because most of the load sits near the free end.`,
      tags: ["internal-force", "distributed-load"],
    }),
    reading(
      "summary",
      r`**What you did:** found internal forces with section cuts, turned them into stresses, and derived equilibrium at a point.

- Stress: $\sigma = R/A$; tension positive, compression negative; $1\,\mathrm{MPa} = 1\,\mathrm{N/mm^2}$, $1\,\mathrm{GPa} = 1000\,\mathrm{MPa}$.
- Section cut: with $R$ drawn as a pull, $R$ = the sum of the loads on the piece to the right of the cut, each counted positive toward $+x$.
- Pointwise equilibrium: $dR/dx + b = 0$, i.e. $(A\sigma)' + b = 0$.
- No distributed load: $R$ constant. A point force $P$ toward $+x$: $R$ drops by $P$.
- Free end at $L$: $R(x) = \int_x^L b\,ds$. Hanging bar $\gamma A(L - x)$; uniform $b_0(L - x)$; linear load $\tfrac{c}{2}(L^2 - x^2)$.

Next: how stress relates to strain — Hooke's law.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Hooke's law and thermal strain (Govindjee §2.3)          */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "sm1-l3-hookes-law",
    unitId: "sm1",
    title: "Hooke's law and thermal strain",
    summary: "Link stress to strain with σ = Eε, add thermal strain αΔT, and treat a bar as a spring of stiffness AE/L.",
    textbook: "Govindjee §2.3",
    minutes: 12,
  },
  [
    reading(
      "hooke",
      r`Kinematics ($\varepsilon = du/dx$) and equilibrium ($dR/dx + b = 0$) hold for every material. To close a problem you also need a **constitutive law** linking stress to strain — measured, not derived, by testing specimens.

The simplest is **Hooke's law**:

$$\sigma = E\,\varepsilon,$$

where **Young's modulus** $E$ is the slope of the stress–strain curve in a uniaxial test. It is a material property, independent of the loads and the geometry. Typical values (Govindjee Table 2.1): tungsten 350 GPa, steel 210 GPa ($30\times10^6$ psi), aluminium 70 GPa ($10\times10^6$ psi), wood 14 GPa. Problems in this course often round steel to 200 GPa — always use the value stated.

The model is **linear elastic**: linear in $\sigma$ and $\varepsilon$, and on unloading the curve retraces the loading curve. In the picture the same 7 kN load gives the same 70 MPa stress in the steel half and the aluminium half, but the aluminium strains almost three times as much, so $u(x)$ climbs faster there.`,
      {
        title: "Hooke's law",
        visual: bar({
          segments: [
            { length: 500, E: 200000, A: 100, label: "steel" },
            { length: 500, E: 70000, A: 100, label: "aluminium" },
          ],
          loads: [{ x: 1000, P: 7000, label: "7 kN" }],
          fixed: "left",
          show: ["sigma", "u"],
        }),
      },
    ),
    numeric("sigma-from-eps", {
      question: r`A steel bar ($E = 200\,\mathrm{GPa}$) is measured at a strain of $300\,\mu$. What is the stress? Answer in MPa.`,
      answer: 60, // check: σ = Eε = 200 000 MPa × 300e-6 = 60 MPa
      tolerance: 0.6,
      suffix: "MPa",
      hint: "Write $E$ in MPa and the strain as a plain decimal.",
      explanation: r`$\sigma = E\varepsilon = (200\,000\,\mathrm{MPa})(300\times10^{-6}) = 60\,\mathrm{MPa}$.`,
      tags: ["hooke"],
    }),
    numeric("E-from-test", {
      question: r`In a tension test an alloy specimen, still in its linear range, reads $\sigma = 140\,\mathrm{MPa}$ at $\varepsilon = 2000\,\mu$. What is Young's modulus? Answer in GPa.`,
      answer: 70, // check: E = 140 MPa / 0.002 = 70 000 MPa = 70 GPa
      tolerance: 0.7,
      suffix: "GPa",
      hint: r`$E$ is the slope $\sigma/\varepsilon$. Convert $2000\,\mu$ to a decimal first.`,
      explanation: r`$E = \sigma/\varepsilon = 140/0.002 = 70\,000\,\mathrm{MPa} = 70\,\mathrm{GPa}$ — an aluminium alloy.`,
      tags: ["hooke"],
    }),
    mc("material-property", {
      question: "Which of these is a **material property**, the same for a short stubby bar and a long thin bar made of the same metal?",
      choices: [
        ["E", r`Young's modulus $E$`],
        ["R", r`The internal force $R(x)$`, r`$R(x)$ comes from equilibrium and depends on the loads.`],
        ["k", r`The axial stiffness $AE/L$`, "Stiffness depends on the geometry ($A$ and $L$) as well as on the material."],
        ["d", r`The elongation $\delta$`, "Elongation depends on the load and on the geometry."],
      ],
      correct: "E",
      shuffle: true,
      hint: "Which quantity would stay the same if you changed both the loads and the dimensions?",
      explanation: r`$E$ is a constitutive (material) property: independent of equilibrium and kinematics. $R(x)$ is set by the loads, while the stiffness $AE/L$ and the elongation $\delta = PL/AE$ mix the material with the geometry.`,
      tags: ["hooke"],
    }),
    tf("plastic-unload", {
      body: r`Not every material is linear elastic. Ceramics are **brittle**: linear until they fracture. Elastomers reach strains of hundreds of percent but still unload along their loading curves, so they are elastic too. Metals such as low-carbon steel are **elastic–plastic**; the course idealization is **elastic–perfectly plastic**: slope $E$ up to the yield stress $\sigma_Y$, then flat at $\sigma_Y$. Unloading from the flat part runs parallel to the initial slope $E$, and pushing far enough into compression causes reverse yield.`,
      statement: "For an elastic–perfectly plastic material loaded past yield, the unloading curve retraces the loading curve back to the origin.",
      answer: false,
      feedback: r`Picture the flat part of the curve. If you unload from there along a line of slope $E$, where are you when $\sigma = 0$?`,
      hint: "Unloading from yield runs parallel to the initial elastic line.",
      explanation: r`False. Unloading from a yielded state follows a line of slope $E$ that is shifted from the origin, so at $\sigma = 0$ a **residual (plastic) strain** remains — the bar is permanently longer. Only elastic materials, linear or not, retrace their loading curves.`,
      tags: ["constitutive", "plasticity"],
    }),
    reading(
      "thermal",
      r`Heating a bar makes it longer even with no load. The **linear thermo-elastic** law adds a thermal strain to Hooke's law:

$$\varepsilon = \frac{\sigma}{E} + \alpha\,\Delta T,$$

where $\alpha$ is the coefficient of thermal expansion and $\Delta T$ is the temperature change from a reference state. Typical values (Govindjee Table 2.2, in $10^{-6}/^\circ\mathrm{C}$): iron 12, diamond 1.2, aluminium 24, graphite $-0.6$ (it shrinks when heated).

Two limiting cases:

- **Free** bar ($\sigma = 0$): $\varepsilon = \alpha\,\Delta T$, so it lengthens by $\delta = \alpha\,\Delta T\,L$ with no stress at all.
- **Fully constrained** bar ($\varepsilon = 0$, e.g. between rigid walls): $\sigma = -E\alpha\,\Delta T$ — compression when heated, tension when cooled.`,
      { title: "Thermal strain" },
    ),
    numeric("thermal-strain", {
      question: r`A steel bar ($\alpha = 12\times10^{-6}/^\circ\mathrm{C}$), free to expand, is heated by $50^\circ\mathrm{C}$. What is its strain, in micro-strain?`,
      answer: 600, // check: ε = αΔT = 12e-6 × 50 = 6.0e-4 = 600 μ
      tolerance: 6,
      suffix: "μ",
      answerDisplay: r`600\,\mu`,
      hint: "With no stress, only the thermal term survives.",
      explanation: r`$\varepsilon = \alpha\,\Delta T = (12\times10^{-6})(50) = 6\times10^{-4} = 600\,\mu$, with $\sigma = 0$.`,
      tags: ["thermal"],
    }),
    numeric("free-al-bar", {
      question: r`An aluminium rod 2 m long ($\alpha = 24\times10^{-6}/^\circ\mathrm{C}$), free at one end, is heated by $50^\circ\mathrm{C}$. How much longer does it get? Answer in mm.`,
      answer: 2.4, // check: δ = αΔT·L = 24e-6 × 50 × 2000 mm = 2.4 mm
      tolerance: 0.024,
      suffix: "mm",
      answerDisplay: r`2.4\,\mathrm{mm}`,
      hint: r`$\delta = \varepsilon L$ with $\varepsilon = \alpha\,\Delta T$; keep $L$ in mm.`,
      explanation: r`$\delta = \alpha\,\Delta T\,L = (24\times10^{-6})(50)(2000\,\mathrm{mm}) = 2.4\,\mathrm{mm}$ — and the stress stays zero, because nothing resists the expansion.`,
      tags: ["thermal"],
    }),
    numeric("walls-steel", {
      question: r`A steel bar ($E = 200\,\mathrm{GPa}$, $\alpha = 12\times10^{-6}/^\circ\mathrm{C}$) fits snugly between two rigid walls and is heated by $50^\circ\mathrm{C}$. What is the stress? Answer in MPa, using the sign convention.`,
      answer: -120, // check: σ = −EαΔT = −200 000 × 12e-6 × 50 = −120 MPa
      tolerance: 1.2,
      suffix: "MPa",
      hint: r`Rigid walls keep the length fixed, so the total strain is $\varepsilon = 0$. Solve $0 = \sigma/E + \alpha\,\Delta T$ for $\sigma$.`,
      explanation: r`$0 = \sigma/E + \alpha\,\Delta T \Rightarrow \sigma = -E\alpha\,\Delta T = -(200\,000)(12\times10^{-6})(50) = -120\,\mathrm{MPa}$. Compression: the walls push back on a bar that wants to grow by $600\,\mu$. Notice that the bar's length and area don't matter.`,
      tags: ["thermal", "sign-convention"],
    }),
    numeric("combined", {
      question: r`A steel member ($E = 200\,\mathrm{GPa}$, $\alpha = 12\times10^{-6}/^\circ\mathrm{C}$) carries $\sigma = 100\,\mathrm{MPa}$ while it is cooled by $25^\circ\mathrm{C}$ ($\Delta T = -25^\circ\mathrm{C}$). What is its total strain, in micro-strain?`,
      answer: 200, // check: ε = σ/E + αΔT = 100/200 000 + 12e-6·(−25) = 500e-6 − 300e-6 = 200e-6 = 200 μ
      tolerance: 2,
      suffix: "μ",
      answerDisplay: r`200\,\mu`,
      hint: r`Add the mechanical part $\sigma/E$ and the thermal part $\alpha\,\Delta T$ — and keep the sign of $\Delta T$.`,
      explanation: r`$\varepsilon = \sigma/E + \alpha\,\Delta T = 100/200\,000 + (12\times10^{-6})(-25) = 500\,\mu - 300\,\mu = 200\,\mu$. The tension stretches the member while the cooling shrinks it.`,
      tags: ["thermal", "hooke"],
    }),
    numeric("tape", {
      body: r`A surveyor's steel tape ($\alpha = 12\times10^{-6}/^\circ\mathrm{C}$, cross-section $12\,\mathrm{mm}\times0.2\,\mathrm{mm}$) is calibrated at $20^\circ\mathrm{C}$ and used on a $50^\circ\mathrm{C}$ day to measure a 30 m distance.`,
      question: "By how much is the reading wrong? Answer in mm.",
      answer: 10.8, // check: αΔT·D = 12e-6 × 30 × 30 000 mm = 10.8 mm (exact D(1 − 1/(1+αΔT)) = 10.796 mm)
      tolerance: 0.11,
      suffix: "mm",
      answerDisplay: r`10.8\,\mathrm{mm}`,
      hint: "The tape is unstressed, so it simply expands thermally. How much does a 30 m stretch of tape grow? The cross-section is a distractor.",
      explanation: r`Every graduation spreads by the factor $1 + \alpha\,\Delta T$ with $\Delta T = 30^\circ\mathrm{C}$, so over 30 m the error is $\alpha\,\Delta T\,D = (12\times10^{-6})(30)(30\,000\,\mathrm{mm}) = 10.8\,\mathrm{mm}$. The hot tape **reads short**: its "30 m" mark now sits 10.8 mm beyond 30 m, so the true distance is about 10.8 mm more than the reading. The area never enters — no stress, no $A$.`,
      tags: ["thermal"],
    }),
    mc("tape-depends", {
      question: "Does the error of that hot tape depend on the distance being measured?",
      choices: [
        ["prop", r`Yes — it is proportional to the distance: $\alpha\,\Delta T$ times the length measured.`],
        ["const", "No — it is a fixed 10.8 mm whatever you measure.", "10.8 mm was for 30 m. Measuring 10 m uses only a third of the tape, which has expanded only a third as much."],
        ["full", "It depends only on the total length of the tape.", "Only the part of the tape between zero and the reading matters."],
        ["area", "It depends on the cross-sectional area of the tape.", r`A free bar's thermal strain $\alpha\,\Delta T$ has nothing to do with its area.`],
      ],
      correct: "prop",
      shuffle: true,
      hint: "The thermal strain is uniform. How does the elongation of a piece of tape depend on its length?",
      explanation: r`The thermal strain $\alpha\,\Delta T = 360\,\mu$ is the same all along the tape, so the error is a fixed *fraction* of the distance read: 3.6 mm over 10 m, 10.8 mm over 30 m.`,
      tags: ["thermal"],
    }),
    numeric("k-bar", {
      body: r`For a uniform bar with an end load the elongation is $\delta = PL/AE$ (derived in the next lesson), so the bar behaves like a linear spring:

$$k = \frac{P}{\delta} = \frac{AE}{L} \;\;\text{(axial stiffness)}, \qquad f = \frac{\delta}{P} = \frac{L}{AE} \;\;\text{(flexibility)}.$$`,
      question: r`What is the axial stiffness of a steel rod with $A = 100\,\mathrm{mm^2}$, $E = 200\,\mathrm{GPa}$ and $L = 500\,\mathrm{mm}$? Answer in kN/mm.`,
      answer: 40, // check: k = AE/L = 100 × 200 000 / 500 = 40 000 N/mm = 40 kN/mm
      tolerance: 0.4,
      suffix: "kN/mm",
      hint: r`Use $E = 200\,000\,\mathrm{N/mm^2}$; the result comes out in N/mm.`,
      explanation: r`$k = AE/L = (100)(200\,000)/500 = 40\,000\,\mathrm{N/mm} = 40\,\mathrm{kN/mm}$: it takes 40 kN to stretch this rod by 1 mm. Its flexibility is $f = 1/k = 0.025\,\mathrm{mm/kN}$. Halving $L$ or doubling $A$ doubles $k$.`,
      tags: ["stiffness"],
    }),
    reading(
      "summary",
      r`**What you did:** used Hooke's law forward and backward, added thermal strain, and treated a bar as a spring.

- Hooke's law: $\sigma = E\varepsilon$; $E$ is a material property (steel 200–210 GPa, aluminium 70 GPa).
- Thermo-elastic: $\varepsilon = \sigma/E + \alpha\,\Delta T$.
- Free bar: $\delta = \alpha\,\Delta T\,L$ and $\sigma = 0$. Fully constrained bar: $\sigma = -E\alpha\,\Delta T$.
- Elastic–perfectly plastic: flat at $\sigma_Y$; unloading parallel to $E$ leaves a residual strain.
- Axial stiffness $k = AE/L$, flexibility $f = L/AE$.

Next: put kinematics, equilibrium and Hooke's law together to find the elongation of any bar.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Axial response: the recipe (Govindjee §2.4.1)            */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "sm1-l4-axial-response",
    unitId: "sm1",
    title: "Axial response: the recipe",
    summary: "Combine kinematics, Hooke's law and equilibrium into δ = ∫R/(AE) dx for end-loaded, self-weighted and stepped bars, and superpose load cases.",
    textbook: "Govindjee §2.4.1",
    minutes: 13,
  },
  [
    reading(
      "recipe",
      r`Every bar problem uses the same three ingredients:

1. Kinematics: $\varepsilon = du/dx$.
2. Constitutive law: $\sigma = E\varepsilon$.
3. Definition of stress: $\sigma = R/A$.

Chain them, $du/dx = \varepsilon = \sigma/E = R/(AE)$, and integrate over the bar to get its change in length:

$$\delta = u(L) - u(0) = \int_0^L \frac{R(x)}{A(x)E(x)}\,dx.$$

The one missing piece is $R(x)$, which comes from **equilibrium** (section cuts, or $dR/dx + b = 0$). With a wall at $x = 0$, $u(0) = 0$ and $\delta$ is the end displacement; integrating only from $0$ to $x$ gives $u(x)$. In the picture each segment carries the same 30 kN, but the thinner one stretches faster.`,
      {
        title: "Three ingredients, one integral",
        visual: bar({
          segments: [
            { length: 600, E: 200000, A: 300, label: "A = 300" },
            { length: 400, E: 200000, A: 150, label: "A = 150" },
          ],
          loads: [{ x: 1000, P: 30000, label: "30 kN" }],
          fixed: "left",
          show: ["R", "u"],
        }),
      },
    ),
    mc("why-statics", {
      question: r`For a bar built in at one end and free at the other, why can $R(x)$ be found from statics alone?`,
      choices: [
        ["count", "There is one unknown reaction and one useful equilibrium equation (force balance along the bar)."],
        ["small", "Because the strains are small.", "Small strains keep the problem linear, but they don't decide whether statics suffices."],
        ["elastic", "Because the material is linear elastic.", r`Statics never needs the material law: for a determinate bar, $R(x)$ is the same for steel, rubber or a yielding metal.`],
        ["always", r`Statics always gives $R(x)$ for any axial bar.`, "Not for a bar between two walls: two unknown reactions and still only one equation (next lesson)."],
      ],
      correct: "count",
      shuffle: true,
      hint: "Count the unknown support reactions and the independent equilibrium equations for an axial bar.",
      explanation: r`Only forces along $x$ act, so there is one equilibrium equation, $\sum F_x = 0$. One wall means one unknown reaction: the problem is **statically determinate**, and section cuts give $R(x)$ without knowing anything about the material. Two walls mean two unknowns, and statics alone is no longer enough.`,
      tags: ["equilibrium", "determinacy"],
    }),
    reading(
      "examples",
      r`**End-loaded bar** (uniform $A$ and $E$, force $P$ at the free end): every cut gives $R = P$, so

$$\delta = \frac{PL}{AE}, \qquad u(x) = \frac{Px}{AE}.$$

**Bar under its own weight** (hanging from $x = 0$, weight density $\gamma$): a cut at $x$ holds up the part below, $R(x) = \gamma A(L - x)$, so

$$u(x) = \frac{\gamma}{E}\Big(Lx - \frac{x^2}{2}\Big), \qquad \delta = \frac{\gamma L^2}{2E}.$$

The area cancels: a thicker bar is heavier *and* stiffer by the same factor.

**Stepped or segmented bar**: $R$, $A$ and $E$ are constant on each segment, so the integral becomes a sum,

$$\delta = \sum_i \frac{R_i L_i}{A_i E_i}.$$`,
      { title: "Three standard cases" },
    ),
    numeric("end-load-delta", {
      question: r`A steel rod ($E = 200\,\mathrm{GPa}$), 1.2 m long and 25 mm in diameter, carries an end pull of 40 kN. How much does it stretch? Answer in mm to three significant figures.`,
      answer: 0.4889, // check: A = π·25²/4 = 490.87 mm²; δ = 40 000·1200/(490.87·200 000) = 4.8e7/9.8175e7 = 0.4889 mm
      tolerance: 0.005,
      suffix: "mm",
      answerDisplay: r`0.489\,\mathrm{mm}`,
      hint: r`Area first ($\pi d^2/4$), then $\delta = PL/AE$ in N, mm and $\mathrm{N/mm^2}$.`,
      explanation: r`$A = \pi(25)^2/4 = 490.9\,\mathrm{mm^2}$, so $\delta = \dfrac{PL}{AE} = \dfrac{(40\,000)(1200)}{(490.9)(200\,000)} = 0.489\,\mathrm{mm}$. Sanity check: $\sigma = 81.5\,\mathrm{MPa}$, $\varepsilon = 407\,\mu$, and $407\,\mu\times1200\,\mathrm{mm} = 0.489\,\mathrm{mm}$ ✓.`,
      tags: ["elongation"],
    }),
    numeric("midpoint", {
      question: "For the same rod, how far does the point at mid-length move? Answer in mm.",
      answer: 0.2445, // check: u(L/2) = P(L/2)/(AE) = 40 000·600/(490.87·200 000) = 0.24446 mm
      tolerance: 0.0025,
      suffix: "mm",
      answerDisplay: r`0.244\,\mathrm{mm}`,
      hint: r`$u(x) = Px/AE$ grows linearly from the wall.`,
      explanation: r`$u(L/2) = P(L/2)/(AE) = \tfrac12(0.489) = 0.244\,\mathrm{mm}$. The displacement is linear in $x$ because the strain is uniform.`,
      tags: ["elongation", "displacement"],
    }),
    numeric("gravity-column", {
      question: r`A 10 m concrete column ($\gamma = 24\,\mathrm{kN/m^3}$, $E = 25\,\mathrm{GPa}$) stands on a rigid foundation and carries only its own weight. By how much does it shorten? Answer in mm.`,
      answer: 0.048, // check: γL²/2E = 24e3 N/m³ × (10 m)² / (2 × 25e9 Pa) = 2.4e6/5e10 = 4.8e-5 m = 0.048 mm
      tolerance: 0.0005,
      suffix: "mm",
      answerDisplay: r`0.048\,\mathrm{mm}`,
      hint: r`A column standing on its base is the hanging bar turned upside down: the same $\gamma L^2/2E$, but in compression. Work in N and m, then convert.`,
      explanation: r`Measure $x$ down from the top. A cut there supports the column above it, $R = -\gamma A x$ (compression), and the shortening is $\int_0^L \gamma x/E\,dx = \gamma L^2/2E = (24\,000)(10)^2/[2(25\times10^9)] = 4.8\times10^{-5}\,\mathrm{m} = 0.048\,\mathrm{mm}$. Self-weight deformation is tiny for ordinary structures.`,
      tags: ["elongation", "distributed-load"],
    }),
    tf("gravity-indep-A", {
      statement: "The elongation of a uniform bar hanging under its own weight is independent of its cross-sectional area.",
      answer: true,
      feedback: r`Write the elongation in terms of $\gamma$, $L$, $E$ and $A$ — then look for $A$.`,
      hint: "A thicker bar is heavier. Is it also stiffer?",
      explanation: r`True. Doubling $A$ doubles the weight, so $R(x) = \gamma A(L - x)$ doubles — but the stiffness $AE$ doubles too, and $A$ cancels: $\delta = \gamma L^2/2E$. Only the length, the weight density and the modulus matter.`,
      tags: ["elongation", "distributed-load"],
    }),
    mc("hanging-max-strain", {
      question: "In a bar hanging under its own weight, where is the strain largest?",
      choices: [
        ["top", "At the support (top)"],
        ["bottom", "At the free (bottom) end", r`The bottom end holds up nothing: $R = 0$ there, so the strain is zero.`],
        ["mid", "At mid-length", r`$R(x) = \gamma A(L - x)$ is linear, so its largest value is at an end.`],
        ["uniform", "It is the same everywhere", "That's the end-loaded bar. Here each cut holds up a different weight."],
      ],
      correct: "top",
      shuffle: true,
      hint: r`$\varepsilon = R/(AE)$. Which cut has to hold up the most weight?`,
      explanation: r`$\varepsilon(x) = \gamma(L - x)/E$: largest at $x = 0$, the support, where the cut carries the whole weight, and zero at the free end. The *displacement*, by contrast, is largest at the bottom.`,
      tags: ["strain", "distributed-load"],
    }),
    numeric("stepped", {
      body: r`An aluminium bar ($E = 70\,\mathrm{GPa}$) is built in at the left. Segment 1 (next to the wall) has $A_1 = 200\,\mathrm{mm^2}$, $L_1 = 400\,\mathrm{mm}$; segment 2 has $A_2 = 100\,\mathrm{mm^2}$, $L_2 = 300\,\mathrm{mm}$. A 20 kN pull acts at the free end.`,
      question: "What is the elongation of the whole bar? Answer in mm to three significant figures.",
      answer: 1.4286, // check: δ = (20 000/70 000)(400/200 + 300/100) = 0.28571 × 5 = 1.4286 mm
      tolerance: 0.014,
      suffix: "mm",
      answerDisplay: r`1.43\,\mathrm{mm}`,
      visual: bar({
        segments: [
          { length: 400, E: 70000, A: 200, label: "1" },
          { length: 300, E: 70000, A: 100, label: "2" },
        ],
        loads: [{ x: 700, P: 20000, label: "20 kN" }],
        fixed: "left",
        show: ["R"],
      }),
      hint: r`$R = 20\,\mathrm{kN}$ in both segments; add $RL/(AE)$ for each.`,
      explanation: r`$\delta = \dfrac{R_1L_1}{A_1E} + \dfrac{R_2L_2}{A_2E} = \dfrac{20\,000}{70\,000}\Big(\dfrac{400}{200} + \dfrac{300}{100}\Big) = 0.2857\times5 = 1.43\,\mathrm{mm}$. The thin segment is shorter but contributes more: $0.857\,\mathrm{mm}$ against $0.571\,\mathrm{mm}$.`,
      tags: ["stepped-bar", "elongation"],
    }),
    numeric("junction-R1", {
      body: r`Same bar, new loads: a 20 kN pull at the junction ($x = 400\,\mathrm{mm}$) and a 10 kN pull at the free end.`,
      question: "What is the internal force in segment 1, next to the wall? Answer in kN.",
      answer: 30, // check: cut in segment 1, right piece carries 20 + 10 = 30 kN ⇒ R1 = 30 kN
      tolerance: 0.3,
      suffix: "kN",
      hint: "Cut segment 1 and keep everything to the right of the cut. Which loads are on that piece?",
      explanation: r`A cut in segment 1 has both loads on its right: $R_1 = 20 + 10 = 30\,\mathrm{kN}$. A cut in segment 2 has only the end load: $R_2 = 10\,\mathrm{kN}$. $R$ drops by 20 kN at the junction, where the 20 kN load acts.`,
      tags: ["stepped-bar", "internal-force"],
    }),
    numeric("junction-delta", {
      question: "What is the elongation of the bar under these two loads? Answer in mm to three significant figures.",
      answer: 1.2857, // check: (30 000·400/200 + 10 000·300/100)/70 000 = (60 000 + 30 000)/70 000 = 1.2857 mm
      tolerance: 0.013,
      suffix: "mm",
      answerDisplay: r`1.29\,\mathrm{mm}`,
      visual: bar({
        segments: [
          { length: 400, E: 70000, A: 200, label: "1" },
          { length: 300, E: 70000, A: 100, label: "2" },
        ],
        loads: [
          { x: 400, P: 20000, label: "20 kN" },
          { x: 700, P: 10000, label: "10 kN" },
        ],
        fixed: "left",
        show: ["R"],
      }),
      hint: r`Same sum as before, but now $R_1 \neq R_2$.`,
      explanation: r`$\delta = \dfrac{(30\,000)(400)}{(200)(70\,000)} + \dfrac{(10\,000)(300)}{(100)(70\,000)} = 0.857 + 0.429 = 1.29\,\mathrm{mm}$.`,
      tags: ["stepped-bar", "elongation"],
    }),
    reading(
      "superpose-idea",
      r`Every equation in the recipe is **linear**: $\varepsilon = du/dx$, $\sigma = E\varepsilon$, $dR/dx + b = 0$. So if load case 1 produces $(u_1, \varepsilon_1, \sigma_1, R_1)$ and load case 2 produces $(u_2, \varepsilon_2, \sigma_2, R_2)$, both loads together produce the sums $u_1 + u_2$, $\varepsilon_1 + \varepsilon_2$, $\sigma_1 + \sigma_2$, $R_1 + R_2$.

For example, a bar built in at $x = 0$ with a uniform load $b_0$ **and** an end force $P$:

$$\delta = \frac{b_0 L^2}{2AE} + \frac{PL}{AE}.$$

Superposition needs linearity. It fails once a material yields, or for a non-linear elastic law such as $\sigma = C\varepsilon^n$.`,
      { title: "Superposition" },
    ),
    numeric("superpose-calc", {
      question: r`A steel rod ($E = 200\,\mathrm{GPa}$, $A = 100\,\mathrm{mm^2}$, $L = 1\,\mathrm{m}$) is built in at one end. It carries a uniform distributed load $b_0 = 12\,\mathrm{N/mm}$ pulling away from the wall plus an 8 kN pull at the free end. What is the end displacement? Answer in mm.`,
      answer: 0.7, // check: AE = 2e7 N; b0L²/(2AE) = 12·1e6/4e7 = 0.3 mm; PL/AE = 8000·1000/2e7 = 0.4 mm; total 0.7 mm
      tolerance: 0.007,
      suffix: "mm",
      answerDisplay: r`0.7\,\mathrm{mm}`,
      hint: "Solve the distributed-load case and the end-load case separately, then add.",
      explanation: r`$AE = (100)(200\,000) = 2\times10^7\,\mathrm{N}$. Distributed load alone: $b_0L^2/(2AE) = (12)(1000)^2/(4\times10^7) = 0.3\,\mathrm{mm}$. End load alone: $PL/AE = (8000)(1000)/(2\times10^7) = 0.4\,\mathrm{mm}$. Together: $0.7\,\mathrm{mm}$. The internal forces add too: $R(x) = b_0(L - x) + P$, so $R(0) = 12 + 8 = 20\,\mathrm{kN}$.`,
      tags: ["superposition", "elongation"],
    }),
    reading(
      "summary",
      r`**What you did:** combined kinematics, Hooke's law and the definition of stress into one integral, and applied it to end loads, self-weight, stepped bars and combined load cases.

- Elongation: $\delta = \int_0^L R/(AE)\,dx$, with $R(x)$ from equilibrium.
- End load: $\delta = PL/AE$ and $u(x) = Px/AE$.
- Self-weight: $R = \gamma A(L - x)$, $\delta = \gamma L^2/2E$ (independent of $A$); strain largest at the support.
- Stepped bar: $\delta = \sum R_iL_i/(A_iE_i)$ — find each $R_i$ with a cut.
- Superposition: for linear elastic bars, add the solutions of separate load cases.

Next: bars between two walls, where statics alone is not enough.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 5 · Statically indeterminate bars (Govindjee §2.4.1)         */
/* ------------------------------------------------------------------ */

const l5 = lesson(
  {
    id: "sm1-l5-indeterminate-bars",
    unitId: "sm1",
    title: "Statically indeterminate bars",
    summary: "Bars between two walls: assume a reaction, solve in terms of it, and pin it down with u(L) = 0 — for point loads, body forces and temperature changes.",
    textbook: "Govindjee §2.4.1",
    minutes: 14,
  },
  [
    reading(
      "procedure",
      r`Fix a uniform bar at **both** ends and load it with a force $P$ (toward $+x$) at $x = a$. The free-body diagram has two unknown wall reactions, but an axial bar offers only one equilibrium equation: the bar is **statically indeterminate**. The general procedure:

1. Assume enough reactions are known to make the problem determinate.
2. Solve the problem in terms of the assumed reactions.
3. Eliminate them using the kinematic information at the supports.

Here, call the internal force at the left end $R_1$. Cuts give $R(x) = R_1$ for $x < a$ and $R(x) = R_1 - P$ for $x > a$. Integrate $R/(AE)$ along the bar and use $u(0) = u(L) = 0$:

$$\frac{R_1 a}{AE} + \frac{(R_1 - P)(L - a)}{AE} = 0 \quad\Rightarrow\quad R_1 = P\Big(1 - \frac{a}{L}\Big).$$

The part left of the load is in **tension**, the part right of it in **compression** ($R = -Pa/L$), and every point moves toward $+x$.`,
      {
        title: "Two walls, one equation",
        visual: bar({
          segments: [{ length: 1000, E: 200000, A: 300 }],
          loads: [{ x: 600, P: 30000, label: "P" }],
          fixed: "both",
          show: ["R", "u"],
          sliders: true,
        }),
      },
    ),
    order("procedure-order", {
      question: "Put the steps for solving a statically indeterminate bar in order.",
      items: [
        ["count", "Draw the free-body diagram and count: two unknown reactions, one equilibrium equation."],
        ["assume", r`Treat one reaction (say $R_1$) as if it were known.`],
        ["solve", r`Find $R(x)$, $\sigma(x)$, $\varepsilon(x)$ and $u(x)$ in terms of $R_1$.`],
        ["compat", r`Impose the kinematic condition $u(L) = 0$ and solve for $R_1$.`],
      ],
      hint: r`You can't use the support condition until you have an expression for $u$ that contains the unknown reaction.`,
      explanation: r`Count unknowns, assume $R_1$, solve in terms of $R_1$, then eliminate $R_1$ with the kinematic (compatibility) condition $u(0) = u(L) = 0$. The same idea works for linear and non-linear materials, with or without temperature changes.`,
      tags: ["indeterminate"],
    }),
    tf("unsolvable", {
      statement: "“Statically indeterminate” means the internal forces cannot be determined.",
      answer: false,
      feedback: "Indeterminate means statics *alone* is not enough. What extra information do the walls give you?",
      hint: "What does a wall tell you about the displacement there?",
      explanation: r`False. Statics alone can't find the reactions, but adding the kinematic information — the walls don't move, $u(0) = u(L) = 0$ — together with Hooke's law makes the problem solvable. Indeterminate problems need all three ingredients from the start.`,
      tags: ["indeterminate"],
    }),
    numeric("R1-third", {
      body: r`A uniform steel bar ($E = 200\,\mathrm{GPa}$, $A = 400\,\mathrm{mm^2}$, $L = 900\,\mathrm{mm}$) is fixed at both ends. A force $P = 60\,\mathrm{kN}$ toward $+x$ acts at $a = 300\,\mathrm{mm}$, one third of the way along.`,
      question: r`What is the internal force $R_1$ in the left segment? Answer in kN.`,
      answer: 40, // check: R1 = P(1 − a/L) = 60(1 − 300/900) = 40 kN
      tolerance: 0.4,
      suffix: "kN",
      hint: r`Use the compatibility result $R_1 = P(1 - a/L)$ — or re-derive it: the stretch of the left part must cancel the shortening of the right part.`,
      explanation: r`$R_1 = P(1 - a/L) = 60(1 - 300/900) = 40\,\mathrm{kN}$ (tension). The right segment carries $R_1 - P = -20\,\mathrm{kN}$. Compatibility check: $(40)(300) + (-20)(600) = 0$ ✓. The two segments act like springs in parallel ($k = AE/\ell$), so the shorter, stiffer left segment takes the larger share.`,
      tags: ["indeterminate"],
    }),
    numeric("sigma-left", {
      question: "What is the stress in the left segment? Answer in MPa.",
      answer: 100, // check: 40 000 N / 400 mm² = 100 MPa
      tolerance: 1,
      suffix: "MPa",
      hint: r`$\sigma = R/A$ with $R$ in N and $A$ in $\mathrm{mm^2}$.`,
      explanation: r`$\sigma_{\text{left}} = 40\,000/400 = 100\,\mathrm{MPa}$ (tension).`,
      tags: ["indeterminate", "stress"],
    }),
    numeric("sigma-right", {
      question: "And the stress in the right segment? Answer in MPa, using the sign convention.",
      answer: -50, // check: R = 40 − 60 = −20 kN; −20 000 N / 400 mm² = −50 MPa
      tolerance: 0.5,
      suffix: "MPa",
      hint: r`The right segment carries $R_1 - P$.`,
      explanation: r`$R = R_1 - P = 40 - 60 = -20\,\mathrm{kN}$, so $\sigma_{\text{right}} = -20\,000/400 = -50\,\mathrm{MPa}$: compression. The material ahead of the load is pushed, the material behind it is pulled.`,
      tags: ["indeterminate", "stress", "sign-convention"],
    }),
    numeric("u-at-a", {
      question: r`How far does the loaded point $x = a$ move? Answer in mm.`,
      answer: 0.15, // check: u(a) = R1·a/(AE) = 40 000·300/(400·200 000) = 1.2e7/8e7 = 0.15 mm
      tolerance: 0.0015,
      suffix: "mm",
      answerDisplay: r`0.15\,\mathrm{mm}`,
      visual: bar({
        segments: [{ length: 900, E: 200000, A: 400 }],
        loads: [{ x: 300, P: 60000, label: "60 kN" }],
        fixed: "both",
        show: ["R"],
      }),
      hint: r`$u(a) = u(0) + \int_0^a R/(AE)\,dx$, and the left segment carries $R_1$.`,
      explanation: r`$u(a) = R_1a/(AE) = (40\,000)(300)/[(400)(200\,000)] = 0.15\,\mathrm{mm}$ toward $+x$. In general $u(a) = Pa(L - a)/(LAE)$. Coming from the right wall gives the same number: the right segment shortens by $(20\,000)(600)/(8\times10^7) = 0.15\,\mathrm{mm}$ ✓.`,
      tags: ["indeterminate", "displacement"],
    }),
    mc("signs-reversed", {
      question: r`Now reverse the load: the force at $x = a$ points toward $-x$. Which segment is in tension?`,
      choices: [
        ["right", r`The right segment ($x > a$)`],
        ["left", r`The left segment ($x < a$)`, r`Replace $P$ by $-P$ in $R_1 = P(1 - a/L)$. What sign does $R_1$ get?`],
        ["both", "Both segments", "The walls must together resist the load, so the bar is pulled on one side of the load and pushed on the other."],
        ["neither", "Neither — both are in compression", "The loaded point moves while both ends stay put, so the material on one side of it must get longer."],
      ],
      correct: "right",
      shuffle: true,
      hint: r`Which way does the loaded point move now? Which side of it is stretched?`,
      explanation: r`With the load toward $-x$, $R_1 = -P(1 - a/L) < 0$: the left part is in compression. The right part carries $R_1 + P = Pa/L > 0$: tension. The loaded point moves toward $-x$, squeezing the material on its left and stretching the material on its right.`,
      tags: ["indeterminate", "sign-convention"],
    }),
    reading(
      "body-force",
      r`Now fix a uniform bar at a ceiling and a floor ($x$ measured down from the top) and let its weight act as a constant body force $b_0$. Assume the internal force at the top, $R_2$, is known. A cut at $x$ gives

$$R(x) = R_2 - b_0 x, \qquad u(x) = \frac{R_2 x - b_0 x^2/2}{AE}.$$

The floor says $u(L) = 0$, so $R_2 = b_0 L/2$ and

$$R(x) = b_0\Big(\frac{L}{2} - x\Big), \qquad u(x) = \frac{b_0\,x(L - x)}{2AE}.$$

Each support carries half the weight. The top half hangs (tension), the bottom half rests on the floor (compression), and every point moves down.`,
      {
        title: "A body force between two walls",
        visual: bar({
          segments: [{ length: 1200, E: 200000, A: 100 }],
          distributed: 3,
          fixed: "both",
          show: ["R", "u"],
        }),
      },
    ),
    numeric("body-max-R", {
      question: r`For such a bar with $b_0 = 5\,\mathrm{N/mm}$ and $L = 2\,\mathrm{m}$, what is the largest magnitude of the internal force? Answer in kN.`,
      answer: 5, // check: |R|max = b0L/2 = 5 × 2000/2 = 5000 N = 5 kN (at both ends)
      tolerance: 0.05,
      suffix: "kN",
      hint: r`$R(x) = b_0(L/2 - x)$ is linear. Check both ends.`,
      explanation: r`$|R|_{\max} = b_0L/2 = (5)(2000)/2 = 5000\,\mathrm{N} = 5\,\mathrm{kN}$, reached at both ends: $+5\,\mathrm{kN}$ (tension) at the top, $-5\,\mathrm{kN}$ (compression) at the bottom. Hung from the top only, the same bar would carry $R(0) = b_0L = 10\,\mathrm{kN}$: the second support halves the peak force.`,
      tags: ["indeterminate", "distributed-load"],
    }),
    mc("body-max-u", {
      question: "Where is the displacement largest in that bar?",
      choices: [
        ["mid", "At mid-length"],
        ["ends", "At the two ends", "Both ends are fixed: $u = 0$ there."],
        ["bottom", "At the bottom support", "The bottom is fixed. Which point is farthest from both supports?"],
        ["quarter", "At the quarter points", r`$u$ is extreme where $du/dx = 0$, i.e. where $R = 0$. Where does $R(x) = b_0(L/2 - x)$ vanish?`],
      ],
      correct: "mid",
      shuffle: true,
      hint: r`$u$ has its maximum where $du/dx = \varepsilon = 0$, i.e. where $R = 0$.`,
      explanation: r`$du/dx = R/(AE) = 0$ at $x = L/2$, so $u$ peaks at mid-length: $u_{\max} = b_0L^2/(8AE)$. The parabola $b_0x(L - x)/(2AE)$ is symmetric about the middle.`,
      tags: ["indeterminate", "displacement"],
    }),
    reading(
      "thermal-indet",
      r`A temperature change only alters step 2 of the procedure: the strain is now $\varepsilon = R/(AE) + \alpha\,\Delta T$. For the two-wall bar with a load $P$ at $x = a$:

$$u(L) = \frac{R_1 a}{AE} + \frac{(R_1 - P)(L - a)}{AE} + \alpha\,\Delta T\,L = 0 \quad\Rightarrow\quad R_1 = P\Big(1 - \frac{a}{L}\Big) - \alpha\,\Delta T\,AE.$$

With no mechanical load ($P = 0$): $R = -\alpha\,\Delta T\,AE$ and $\sigma = -E\alpha\,\Delta T$ everywhere — heating compresses a bar trapped between walls.`,
      { title: "Adding a temperature change" },
    ),
    numeric("thermal-R", {
      question: r`A steel bar ($E = 200\,\mathrm{GPa}$, $\alpha = 12\times10^{-6}/^\circ\mathrm{C}$, $A = 500\,\mathrm{mm^2}$) is fixed between rigid walls and heated by $40^\circ\mathrm{C}$. What is the internal force? Answer in kN, using the sign convention.`,
      answer: -48, // check: R = −αΔT·AE = −12e-6 × 40 × 500 × 200 000 = −48 000 N = −48 kN
      tolerance: 0.5,
      suffix: "kN",
      hint: r`Set $P = 0$ in $R_1 = P(1 - a/L) - \alpha\,\Delta T\,AE$.`,
      explanation: r`$R = -\alpha\,\Delta T\,AE = -(12\times10^{-6})(40)(500)(200\,000) = -48\,000\,\mathrm{N} = -48\,\mathrm{kN}$ (compression). The stress is $\sigma = R/A = -96\,\mathrm{MPa} = -E\alpha\,\Delta T$, independent of the bar's length.`,
      tags: ["indeterminate", "thermal"],
    }),
    numeric("thermal-plus-load", {
      question: r`Return to the 900 mm steel bar between walls ($E = 200\,\mathrm{GPa}$, $A = 400\,\mathrm{mm^2}$, $P = 60\,\mathrm{kN}$ toward $+x$ at $a = 300\,\mathrm{mm}$) and also heat it by $20^\circ\mathrm{C}$ ($\alpha = 12\times10^{-6}/^\circ\mathrm{C}$). What is $R_1$ now? Answer in kN.`,
      answer: 20.8, // check: P(1 − a/L) = 40 kN; αΔT·AE = 12e-6·20·400·200 000 = 19 200 N; R1 = 40 − 19.2 = 20.8 kN
      tolerance: 0.2,
      suffix: "kN",
      answerDisplay: r`20.8\,\mathrm{kN}`,
      hint: r`Superpose: the mechanical part is the 40 kN you found before; the thermal part is $-\alpha\,\Delta T\,AE$.`,
      explanation: r`$\alpha\,\Delta T\,AE = (12\times10^{-6})(20)(400)(200\,000) = 19\,200\,\mathrm{N}$, so $R_1 = 40 - 19.2 = 20.8\,\mathrm{kN}$. The right segment carries $20.8 - 60 = -39.2\,\mathrm{kN}$: heating removed 19.2 kN of tension from the left part and added 19.2 kN of compression to the right part.`,
      tags: ["indeterminate", "thermal", "superposition"],
    }),
    reading(
      "summary",
      r`**What you did:** solved bars with two supports by adding a compatibility condition to statics — with a point load, a body force and a temperature change.

- Procedure: assume a reaction, solve in terms of it, impose $u(L) = 0$.
- Point load $P$ at $x = a$: $R_1 = P(1 - a/L)$ (tension), right part $-Pa/L$; $u(a) = Pa(L - a)/(LAE)$.
- Constant body force: $R = b_0(L/2 - x)$, $u = b_0x(L - x)/(2AE)$, $u_{\max} = b_0L^2/(8AE)$ at mid-length.
- Thermal: $R_1 = P(1 - a/L) - \alpha\,\Delta T\,AE$; with no load, $\sigma = -E\alpha\,\Delta T$.

Next: a single differential equation that handles determinate and indeterminate bars alike.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 6 · The differential-equation approach (Govindjee §2.4.2)    */
/* ------------------------------------------------------------------ */

const l6 = lesson(
  {
    id: "sm1-l6-differential-equation",
    unitId: "sm1",
    title: "The differential-equation approach",
    summary: "Solve any bar from (AEu′)′ + b = 0 with two boundary conditions, using delta functions and Macaulay brackets for point loads.",
    textbook: "Govindjee §2.4.2",
    minutes: 14,
  },
  [
    reading(
      "ode",
      r`Instead of guessing reactions, combine the three ingredients into one equation. Substitute $\varepsilon = u'$ into $\sigma = E\varepsilon$, then into $(A\sigma)' + b = 0$:

$$\frac{d}{dx}\Big(A(x)E(x)\,\frac{du}{dx}\Big) + b(x) = 0.$$

It is a second-order ODE for $u(x)$, so it needs **two boundary conditions**, one at each end:

- **Displacement BC**: $u$ is prescribed, e.g. $u = 0$ at a wall.
- **Force BC**: the end force is prescribed. Since $R = A\sigma = AE\,u'$, a force $P$ toward $+x$ at the end $x = L$ means $AE\,u'(L) = P$, and a free end has $AE\,u' = 0$. (At the left end $x = 0$, a force $P$ toward $+x$ gives $AE\,u'(0) = -P$.)

Determinate or indeterminate makes no difference: integrate twice and let the boundary conditions fix the two constants. In the picture a uniform $b$ makes $R$ linear and $u$ quadratic.`,
      {
        title: "One equation for u",
        visual: bar({
          segments: [{ length: 1000, E: 200000, A: 100 }],
          distributed: 4,
          fixed: "left",
          show: ["R", "u"],
        }),
      },
    ),
    mc("free-end-bc", {
      question: r`A bar is built in at $x = 0$ and its end $x = L$ is free (no applied force). Which pair of boundary conditions is correct?`,
      choices: [
        ["ok", r`$u(0) = 0$ and $AE\,u'(L) = 0$`],
        ["uu", r`$u(0) = 0$ and $u(L) = 0$`, r`$u(L) = 0$ would hold that end in place — a second wall, not a free end.`],
        ["pp", r`$AE\,u'(0) = 0$ and $AE\,u'(L) = 0$`, "The built-in end fixes the displacement, not the force."],
        ["second", r`$u(0) = 0$ and $u''(L) = 0$`, r`The force is $AE\,u'$, so a free end is a condition on the first derivative.`],
      ],
      correct: "ok",
      shuffle: true,
      hint: r`A wall fixes $u$. A free end means zero force, and the force is $R = AE\,u'$.`,
      explanation: r`At the wall, $u(0) = 0$ (displacement BC). At the free end the internal force vanishes, $R(L) = AE\,u'(L) = 0$ (force BC) — so the strain is zero there too.`,
      tags: ["ode", "boundary-conditions"],
    }),
    mc("poly-order", {
      question: r`With $AE$ constant and $b(x) = c\,x$, what is the polynomial degree of $u(x)$?`,
      choices: [
        ["1", "1 (linear)", r`Linear $u$ is the $b = 0$ case. Here the load itself depends on $x$.`],
        ["2", "2 (quadratic)", r`Quadratic is the constant-$b$ case. Integrate $c\,x$ twice.`],
        ["3", "3 (cubic)"],
        ["dep", "It depends on the boundary conditions", r`The BCs only fix the two integration constants in $C_1x + C_2$; they never change the highest power.`],
      ],
      correct: "3",
      hint: r`Integrate $AE\,u'' = -c\,x$ twice.`,
      explanation: r`$AE\,u'' = -cx \Rightarrow AE\,u' = -\tfrac{c}{2}x^2 + C_1 \Rightarrow AE\,u = -\tfrac{c}{6}x^3 + C_1x + C_2$: a cubic. The same argument shows that $b = 0$ forces $u$ to be linear and a constant $b_0$ forces it to be quadratic, *whatever* the boundary conditions — they only choose $C_1$ and $C_2$.`,
      tags: ["ode"],
    }),
    reading(
      "translate",
      r`Each earlier example becomes a load function plus two boundary conditions:

- End-loaded bar: $b = 0$, $u(0) = 0$, $AE\,u'(L) = P$.
- Hanging bar: $b = \gamma A$, $u(0) = 0$, $AE\,u'(L) = 0$.
- Two walls, point load at $a$: $b = P\,\delta(x - a)$, $u(0) = 0$, $u(L) = 0$.
- Thermal: the force is $R = AE(u' - \alpha\,\Delta T)$, so the ODE becomes $\big(AE(u' - \alpha\,\Delta T)\big)' + b = 0$, and an end force $P$ gives $AE\,u'(L) = P + AE\alpha\,\Delta T$.

**Solution method**: integrate both sides step by step, adding a constant each time, then apply the BCs. For the end-loaded bar, $(AE\,u')' = 0$ gives $AE\,u' = C_1 = P$, then $AE\,u = Px + C_2$ with $C_2 = 0$, so $u = Px/AE$.`,
      { title: "Translating problems into b and BCs" },
    ),
    numeric("cx-free-end", {
      body: r`A bar is built in at $x = 0$ and free at $x = L = 100\,\mathrm{mm}$, with $AE = 2\times10^5\,\mathrm{N}$ and a distributed load $b(x) = c\,x$ toward $+x$, with $c = 0.6\,\mathrm{N/mm^2}$.`,
      question: r`Find the tip displacement $u(L)$. Answer in mm.`,
      answer: 1, // check: AEu′ = −cx²/2 + cL²/2; AEu = −cx³/6 + cL²x/2; u(L) = cL³/(3AE) = 0.6·1e6/(6e5) = 1.000 mm
      tolerance: 0.01,
      suffix: "mm",
      answerDisplay: r`1.00\,\mathrm{mm}`,
      hint: r`Integrate $AE\,u'' = -c\,x$ twice. Use $AE\,u'(L) = 0$ for $C_1$ and $u(0) = 0$ for $C_2$.`,
      explanation: r`$AE\,u' = -\tfrac{c}{2}x^2 + C_1$, and the free end gives $C_1 = \tfrac{c}{2}L^2$. Then $AE\,u = -\tfrac{c}{6}x^3 + \tfrac{c}{2}L^2x + C_2$ with $C_2 = 0$ from $u(0) = 0$. At the tip, $u(L) = \dfrac{cL^3}{3AE} = \dfrac{(0.6)(100)^3}{3(2\times10^5)} = \dfrac{6\times10^5}{6\times10^5} = 1.00\,\mathrm{mm}$.`,
      tags: ["ode", "distributed-load"],
    }),
    numeric("b0-free-end", {
      question: r`A bar built in at $x = 0$ and free at $x = L = 400\,\mathrm{mm}$ carries a uniform load $b_0 = 20\,\mathrm{N/mm}$ toward $+x$, with $AE = 4\times10^6\,\mathrm{N}$. Find $u(L)$ in mm.`,
      answer: 0.4, // check: u(L) = b0L²/(2AE) = 20·160 000/(8e6) = 3.2e6/8e6 = 0.4 mm
      tolerance: 0.004,
      suffix: "mm",
      answerDisplay: r`0.4\,\mathrm{mm}`,
      visual: bar({
        segments: [{ length: 400, E: 200000, A: 20 }],
        distributed: 20,
        fixed: "left",
        show: ["R"],
      }),
      hint: r`$AE\,u'' = -b_0$, and the free end gives $AE\,u'(L) = 0$.`,
      explanation: r`$AE\,u' = b_0(L - x)$ (which is $R(x)$), then $AE\,u = b_0(Lx - x^2/2)$. At the tip, $u(L) = \dfrac{b_0L^2}{2AE} = \dfrac{(20)(400)^2}{8\times10^6} = 0.4\,\mathrm{mm}$ — the gravity-bar result with $\gamma A$ replaced by $b_0$.`,
      tags: ["ode", "distributed-load"],
    }),
    reading(
      "delta-fn",
      r`A point force is the limit of a load squeezed into a vanishing width with a fixed total. That limit is the **Dirac delta** $\delta(x)$, so a force $P$ toward $+x$ at $x = a$ is $b(x) = P\,\delta(x - a)$. The integration rules:

- $\int \delta(x)\,dx = H(x) + C$, with the Heaviside step $H(x) = 0$ for $x < 0$ and $1$ for $x > 0$.
- $\int H(x)\,dx = \langle x \rangle + C$, with the Macaulay bracket $\langle x \rangle = 0$ for $x < 0$ and $x$ for $x \ge 0$.
- $\int \langle x \rangle^n\,dx = \dfrac{\langle x \rangle^{n+1}}{n+1} + C$, and $\int g(x)\,\delta(x)\,dx = g(0)$ across $x = 0$.

Two walls, point load at $a$: $AE\,u'' = -P\,\delta(x - a)$ gives $AE\,u' = -P\,H(x - a) + C_1$ and $AE\,u = -P\langle x - a\rangle + C_1x + C_2$. Then $u(0) = 0$ gives $C_2 = 0$, and $u(L) = 0$ gives $C_1 = P(L - a)/L$:

$$u(x) = \frac{P}{AE}\Big(-\langle x - a\rangle + \frac{(L - a)\,x}{L}\Big).$$

Note $C_1 = AE\,u'(0) = R_1 = P(1 - a/L)$: the reaction of the last lesson, found without guessing anything.`,
      { title: "Point forces: delta functions and Macaulay brackets" },
    ),
    mc("macaulay", {
      question: r`What is $\langle x - a \rangle^2$ for $x < a$?`,
      choices: [
        ["0", "$0$"],
        ["sq", "$(x - a)^2$", r`That's its value for $x \ge a$. The bracket switches off before $x = a$.`],
        ["neg", "$-(x - a)^2$", "Macaulay brackets never produce negative values: they are either zero or a power of a non-negative number."],
        ["one", "$1$", r`You may be thinking of $H(x - a)$, which is 1 for $x > a$ — and 0 for $x < a$.`],
      ],
      correct: "0",
      shuffle: true,
      hint: r`Go back to the definition of the Macaulay bracket: what does $\langle x - a\rangle$ equal when its argument $x - a$ is negative?`,
      explanation: r`For $x < a$ the argument is negative, so $\langle x - a\rangle = 0$, and any positive power of it is $0$ too. That switch is what lets one formula describe both sides of a point load.`,
      tags: ["dirac-delta"],
    }),
    mc("point-force-b", {
      question: r`Which distributed-load function represents a point force $P$ at $x = a$ pulling toward $+x$?`,
      choices: [
        ["d", r`$b(x) = P\,\delta(x - a)$`],
        ["md", r`$b(x) = -P\,\delta(x - a)$`, r`$b$ is positive toward $+x$ — the same direction as this force.`],
        ["H", r`$b(x) = P\,H(x - a)$`, r`That's a uniform load of $P$ per unit length on all of $x > a$, not a concentrated force.`],
        ["mac", r`$b(x) = P\langle x - a\rangle$`, r`That's a load growing linearly beyond $x = a$, not a concentrated force.`],
      ],
      correct: "d",
      shuffle: true,
      hint: r`The function must vanish everywhere except at $x = a$, and its integral across $x = a$ must be $P$.`,
      explanation: r`$P\,\delta(x - a)$ is zero away from $x = a$ and integrates to $P$ across it: a concentrated force of magnitude $P$, toward $+x$ because $b$ is measured positive toward $+x$.`,
      tags: ["dirac-delta", "sign-convention"],
    }),
    numeric("delta-u-at-a", {
      question: r`For the two-wall bar with a point load, evaluate $u(a)$ for $P = 10\,\mathrm{kN}$, $a = 200\,\mathrm{mm}$, $L = 500\,\mathrm{mm}$ and $AE = 10^6\,\mathrm{N}$. Answer in mm.`,
      answer: 1.2, // check: u(a) = (P/AE)(0 + (L − a)a/L) = (10 000/1e6)(300·200/500) = 0.01 × 120 = 1.2 mm
      tolerance: 0.012,
      suffix: "mm",
      answerDisplay: r`1.2\,\mathrm{mm}`,
      hint: r`At $x = a$ the bracket $\langle x - a\rangle$ is zero.`,
      explanation: r`$u(a) = \dfrac{P}{AE}\cdot\dfrac{(L - a)\,a}{L} = \dfrac{10\,000}{10^6}\cdot\dfrac{(300)(200)}{500} = 0.01\times120 = 1.2\,\mathrm{mm}$ — the same as $Pa(L - a)/(LAE)$ from the assume-a-reaction method.`,
      tags: ["ode", "dirac-delta", "indeterminate"],
    }),
    tf("same-method", {
      statement: "The differential-equation method handles statically determinate and indeterminate bars in exactly the same way.",
      answer: true,
      feedback: "Where does indeterminacy show up in the ODE method — in the equation or in the boundary conditions?",
      hint: "Compare the end-loaded bar and the two-wall bar: what is different?",
      explanation: r`True. You always integrate $(AEu')' + b = 0$ twice and apply two BCs. A fixed–free bar has one displacement BC and one force BC; a two-wall bar has two displacement BCs. No reaction needs to be guessed in either case.`,
      tags: ["ode", "indeterminate"],
    }),
    mc("thermal-bc", {
      question: r`A bar with a temperature change $\Delta T$ is pulled by a force $P$ at its end $x = L$. What is the force boundary condition there?`,
      choices: [
        ["ok", r`$AE\,u'(L) = P + AE\alpha\,\Delta T$`],
        ["plain", r`$AE\,u'(L) = P$`, r`With thermal strain the force is $R = AE(u' - \alpha\,\Delta T)$, not $AE\,u'$.`],
        ["minus", r`$AE\,u'(L) = P - AE\alpha\,\Delta T$`, r`Solve $AE(u' - \alpha\,\Delta T) = P$ for $AE\,u'$ — watch the sign.`],
        ["disp", r`$u(L) = \alpha\,\Delta T\,L$`, r`That's a displacement condition, and it ignores the force $P$.`],
      ],
      correct: "ok",
      shuffle: true,
      hint: r`Only the mechanical part of the strain, $u' - \alpha\,\Delta T$, produces stress.`,
      explanation: r`$R = A\sigma = AE(\varepsilon - \alpha\,\Delta T) = AE(u' - \alpha\,\Delta T)$. Setting $R(L) = P$ gives $AE\,u'(L) = P + AE\alpha\,\Delta T$. With $P = 0$ a hot free end still has $u' = \alpha\,\Delta T$: it expands without stress.`,
      tags: ["ode", "thermal", "boundary-conditions"],
    }),
    mc("spin-where", {
      body: r`A rod of length $L$ (constant $A$, $E$ and density $\rho$) spins at angular speed $\omega$ about a pivot at $x = 0$; its far end is free. The centrifugal force acts as a distributed load $b(x) = \rho A\omega^2 x$, so

$$R(x) = \int_x^L \rho A\omega^2 s\,ds = \frac{\rho A\omega^2}{2}\,(L^2 - x^2).$$`,
      question: "Where is the strain largest?",
      choices: [
        ["pivot", r`At the pivot, $x = 0$`],
        ["tip", r`At the free end, $x = L$`, r`The tip moves fastest, but nothing beyond it has to be held in: $R(L) = 0$.`],
        ["mid", "At mid-length", r`$L^2 - x^2$ is largest at $x = 0$ and decreases all the way to the tip.`],
        ["uniform", "It is uniform", r`$b$ varies along the rod, so $R$ varies too.`],
      ],
      correct: "pivot",
      shuffle: true,
      hint: r`$\varepsilon = R/(AE)$. Which cut has to hold in the most spinning material?`,
      explanation: r`$\varepsilon(x) = \dfrac{\rho\omega^2}{2E}(L^2 - x^2)$: maximum $\rho\omega^2L^2/(2E)$ at the pivot and minimum $0$ at the free end. The strain is positive everywhere — the whole rod is in tension.`,
      tags: ["ode", "distributed-load"],
    }),
    numeric("spin-strain", {
      question: r`Evaluate that maximum strain for a steel rod with $\rho = 8000\,\mathrm{kg/m^3}$ (rounded), $E = 200\,\mathrm{GPa}$ and $L = 0.5\,\mathrm{m}$, spinning at $\omega = 400\,\mathrm{rad/s}$. Answer in micro-strain.`,
      answer: 800, // check: ρω²L²/(2E) = 8000·160 000·0.25/(2·2e11) = 3.2e8/4e11 = 8.0e-4 = 800 μ (σmax = 160 MPa)
      tolerance: 8,
      suffix: "μ",
      answerDisplay: r`800\,\mu`,
      hint: r`Use SI throughout: $\rho\omega^2L^2$ comes out in Pa, the same unit as $E$.`,
      explanation: r`$\varepsilon_{\max} = \dfrac{\rho\omega^2L^2}{2E} = \dfrac{(8000)(400)^2(0.5)^2}{2(200\times10^9)} = \dfrac{3.2\times10^8}{4\times10^{11}} = 8\times10^{-4} = 800\,\mu$, so $\sigma_{\max} = 160\,\mathrm{MPa}$ at the pivot. Since $\sigma_{\max} = \rho\omega^2L^2/2$ doesn't involve $A$, the spin rate at which a rod of a given material fails scales as $1/L$.`,
      tags: ["ode", "distributed-load"],
    }),
    reading(
      "summary",
      r`**What you did:** turned bar problems into one ODE with two boundary conditions, and handled point loads with delta functions.

- Governing equation: $(AE\,u')' + b = 0$; with temperature, $\big(AE(u' - \alpha\,\Delta T)\big)' + b = 0$.
- BCs: $u = 0$ at a wall; a force $P$ toward $+x$ gives $AE\,u'(L) = P$ at the right end but $AE\,u'(0) = -P$ at the left end; a free end has $AE\,u' = 0$; thermal: $AE\,u'(L) = P + AE\alpha\,\Delta T$.
- Polynomial degree of $u$: $b = 0$ linear, $b = b_0$ quadratic, $b = cx$ cubic.
- Point force $b = P\,\delta(x - a)$; $\int\delta = H$, $\int H = \langle x\rangle$, $\int\langle x\rangle^n = \langle x\rangle^{n+1}/(n+1)$.
- Fixed–free results: $b = cx$ gives $u(L) = cL^3/(3AE)$; $b = b_0$ gives $u(L) = b_0L^2/(2AE)$; spinning rod $\varepsilon_{\max} = \rho\omega^2L^2/(2E)$ at the pivot.

Next: energy methods, and designing bars against a stress limit.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 7 · Energy methods and stress-based design (Govindjee §2.5–2.6) */
/* ------------------------------------------------------------------ */

const l7 = lesson(
  {
    id: "sm1-l7-energy-and-design",
    unitId: "sm1",
    title: "Energy methods and stress-based design",
    summary: "Use W_in = W_stored for deflections of bars and trusses and for impact loads, then size bars against stress and stretch limits.",
    textbook: "Govindjee §2.5–2.6",
    minutes: 14,
  },
  [
    reading(
      "energy",
      r`For an **elastic** system nothing is dissipated, so the work done by the loads is stored in the material:

$$W_{\text{in}} = W_{\text{stored}}.$$

The work in is the area under the force–deflection curve; for a linear elastic bar loaded slowly from zero up to $P$ it is a triangle, $W_{\text{in}} = \tfrac12 P\delta$. Per unit volume, the stored **strain-energy density** is

$$w = \int_0^{\varepsilon} \sigma\,d\varepsilon = \tfrac12\sigma\varepsilon = \tfrac12 E\varepsilon^2 = \frac{\sigma^2}{2E},$$

and $W_{\text{stored}} = \int_V w\,dV$. In a uniform bar with an end load, $\sigma = P/A$ everywhere, so

$$W_{\text{stored}} = \frac{P^2 L}{2AE}.$$

Setting $\tfrac12 P\delta = P^2L/(2AE)$ and cancelling $\tfrac12 P$ recovers $\delta = PL/AE$.`,
      {
        title: "Work in = energy stored",
        visual: bar({
          segments: [{ length: 1500, E: 200000, A: 300 }],
          loads: [{ x: 1500, P: 30000, label: "P" }],
          fixed: "left",
          show: ["sigma", "u"],
          sliders: true,
        }),
      },
    ),
    numeric("U-bar", {
      question: r`How much strain energy is stored in a steel bar ($E = 200\,\mathrm{GPa}$, $A = 200\,\mathrm{mm^2}$, $L = 2\,\mathrm{m}$) carrying an end load of 20 kN? Answer in J ($1\,\mathrm{J} = 1000\,\mathrm{N\cdot mm}$).`,
      answer: 10, // check: P²L/(2AE) = 20 000²·2000/(2·200·200 000) = 8e11/8e7 = 10 000 N·mm = 10 J
      tolerance: 0.1,
      suffix: "J",
      hint: r`Use $P^2L/(2AE)$ in N and mm; the result is in N·mm.`,
      explanation: r`$W = \dfrac{P^2L}{2AE} = \dfrac{(20\,000)^2(2000)}{2(200)(200\,000)} = \dfrac{8\times10^{11}}{8\times10^{7}} = 10\,000\,\mathrm{N\cdot mm} = 10\,\mathrm{J}$. Equivalently: $\sigma = 100\,\mathrm{MPa}$, $w = \sigma^2/2E = 100^2/400\,000 = 0.025\,\mathrm{N\cdot mm/mm^3}$, times the volume $400\,000\,\mathrm{mm^3}$.`,
      tags: ["energy"],
    }),
    numeric("delta-energy", {
      question: r`Using $W_{\text{in}} = W_{\text{stored}}$, find the elongation of that bar. Answer in mm.`,
      answer: 1, // check: ½Pδ = 10 000 N·mm ⇒ δ = 2·10 000/20 000 = 1.0 mm (= PL/AE = 4e7/4e7)
      tolerance: 0.01,
      suffix: "mm",
      answerDisplay: r`1.0\,\mathrm{mm}`,
      hint: r`$W_{\text{in}} = \tfrac12 P\delta$.`,
      explanation: r`$\tfrac12(20\,000)\,\delta = 10\,000 \Rightarrow \delta = 1.0\,\mathrm{mm}$, matching $PL/AE = (20\,000)(2000)/[(200)(200\,000)] = 1.0\,\mathrm{mm}$.`,
      tags: ["energy", "elongation"],
    }),
    numeric("truss-force", {
      body: r`Energy really pays off for **trusses**. Each bar $i$ stores $F_i^2L_i/(2A_iE_i)$, so

$$\tfrac12 P\delta = \sum_i \frac{F_i^2 L_i}{2A_iE_i},$$

where $\delta$ is the deflection of the loaded joint **in the direction of the load**.

The truss: joint $C$ is connected to a wall pin $A$ by a horizontal bar $AC$ of length $L$, and to a wall pin $B$ — a height $L$ above $A$ — by a bar $BC$ at $45^\circ$, of length $L\sqrt2$. A downward load $P$ hangs from $C$. Both bars have the same $A$ and $E$.`,
      question: r`For $P = 10\,\mathrm{kN}$, what is the force in bar $BC$? Answer in kN, tension positive.`,
      answer: 14.142, // check: ΣFy at C: F_BC·sin45° = P ⇒ F_BC = P√2 = 14.142 kN (tension)
      tolerance: 0.14,
      suffix: "kN",
      answerDisplay: r`14.1\,\mathrm{kN}`,
      hint: r`Method of joints at $C$: only $BC$ has a vertical component. The horizontal balance then gives $AC$.`,
      explanation: r`Vertical balance at $C$: $F_{BC}\sin45^\circ = P$, so $F_{BC} = P\sqrt2 = 14.1\,\mathrm{kN}$ (tension — $BC$ holds $C$ up). Horizontal balance: $F_{AC} + F_{BC}\cos45^\circ = 0$, so $F_{AC} = -P = -10\,\mathrm{kN}$ (compression — $AC$ pushes $C$ away from the wall).`,
      tags: ["energy", "truss"],
    }),
    numeric("truss-delta", {
      question: r`With $L = 1\,\mathrm{m}$, $A = 200\,\mathrm{mm^2}$, $E = 200\,\mathrm{GPa}$ and $P = 10\,\mathrm{kN}$, what is the vertical deflection of $C$? Answer in mm.`,
      answer: 0.9571, // check: W = [(P√2)²·L√2 + P²L]/(2AE) = P²L(2√2 + 1)/(2AE); δ = (2√2 + 1)PL/AE = 3.8284 × 0.25 = 0.9571 mm, PL/AE = 1e7/4e7 = 0.25
      tolerance: 0.0096,
      suffix: "mm",
      answerDisplay: r`0.957\,\mathrm{mm}`,
      hint: r`Add the energies of both bars — the compressed bar stores energy too, since $F^2 > 0$. Remember $BC$ is $L\sqrt2$ long.`,
      explanation: r`$W_{\text{stored}} = \dfrac{(P\sqrt2)^2(L\sqrt2)}{2AE} + \dfrac{(-P)^2L}{2AE} = \dfrac{P^2L}{2AE}\big(2\sqrt2 + 1\big)$. Setting this equal to $\tfrac12P\delta$: $\delta = (2\sqrt2 + 1)\dfrac{PL}{AE} = 3.828\times\dfrac{(10\,000)(1000)}{(200)(200\,000)} = 3.828\times0.25 = 0.957\,\mathrm{mm}$, downward.`,
      tags: ["energy", "truss"],
    }),
    mc("energy-component", {
      question: r`Joint $C$ of that truss also moves horizontally. What does $\tfrac12P\delta = W_{\text{stored}}$ tell you about the horizontal motion?`,
      choices: [
        ["nothing", "Nothing — the method only gives the deflection component along the load."],
        ["zero", "That it is zero.", r`Bar $AC$ shortens by $PL/AE$, so $C$ does move sideways. The energy balance just doesn't see it.`],
        ["same", "That it equals the vertical deflection.", r`There is only one equation, $\tfrac12 P\delta = W$, and it contains one unknown: the displacement along $P$.`],
        ["total", r`That $\delta$ is the total (resultant) displacement of $C$.`, "The work done by $P$ involves only the component of the motion along $P$."],
      ],
      correct: "nothing",
      shuffle: true,
      hint: "A load does work only through the part of the motion parallel to it.",
      explanation: r`$W_{\text{in}} = \tfrac12 P\delta$ involves only the displacement component along $P$, so one energy balance yields one number: the vertical deflection. The horizontal motion — here $C$ moves $0.25\,\mathrm{mm}$ toward the wall, because $AC$ shortens by $PL/AE$ — needs geometry or another method.`,
      tags: ["energy", "truss"],
    }),
    reading(
      "impact-idea",
      r`A weight $W$ falls from a height $h$ onto an elastic bar ($L$, $A$, $E$). At maximum compression $\delta$ the weight is momentarily at rest, so all the potential energy it has lost is stored in the bar:

$$W(h + \delta) = \frac{P^2L}{2AE}, \qquad \delta = \frac{PL}{AE}.$$

Eliminating $\delta$ gives $P^2 - 2WP - 2WhAE/L = 0$, whose positive root is

$$P_{\max} = W\Big(1 + \sqrt{1 + 2h/\delta_s}\Big), \qquad \delta_s = \frac{WL}{AE},$$

where $\delta_s$ is the static deflection under $W$. Even with $h = 0$ — the weight released at contact — the peak force is $2W$, twice the static load.`,
      { title: "Dropped weights" },
    ),
    numeric("impact-h0", {
      question: r`A 500 N weight is set on top of a short post and released suddenly from contact ($h = 0$). What peak force does the post feel? Answer in N.`,
      answer: 1000, // check: P = W(1 + √(1 + 0)) = 2W = 1000 N
      tolerance: 10,
      suffix: "N",
      hint: r`Set $h = 0$ in the impact formula.`,
      explanation: r`$P_{\max} = W(1 + \sqrt{1 + 0}) = 2W = 1000\,\mathrm{N}$. A suddenly applied load overshoots to twice its static effect (and, with a little damping, eventually settles at $W$).`,
      tags: ["energy", "impact"],
    }),
    numeric("impact-drop", {
      question: r`A 200 N weight is dropped from $h = 50\,\mathrm{mm}$ onto a bar whose static deflection under that weight is $\delta_s = 0.5\,\mathrm{mm}$. What is the peak force? Answer in N to three significant figures.`,
      answer: 3035.5, // check: 200(1 + √(1 + 2·50/0.5)) = 200(1 + √201) = 200(1 + 14.1774) = 3035.5 N
      tolerance: 30,
      suffix: "N",
      answerDisplay: r`3035\,\mathrm{N}`,
      hint: r`Compute $2h/\delta_s = 2(50)/0.5$ first.`,
      explanation: r`$2h/\delta_s = 200$, so $P_{\max} = 200\,(1 + \sqrt{201}) = 200(1 + 14.18) = 3035\,\mathrm{N}$ — about 15 times the weight. Impact is dangerous precisely because stiff structures have a small $\delta_s$.`,
      tags: ["energy", "impact"],
    }),
    reading(
      "design",
      r`Analysis gives the **design stress** $\sigma_d$ in a member. Design compares it with an **allowable stress** $\sigma_a$ — usually the yield stress $\sigma_Y$ or the ultimate stress $\sigma_u$ — through the **safety factor**

$$SF = \frac{\sigma_a}{\sigma_d}.$$

Typical values: mechanical engineering about 3 on yield (4 on ultimate); civil 1.6–2.0 on yield; aerospace 1.2–1.5 on yield.

Sizing a bar with an end load $P$: a stress limit requires $A \ge P/\sigma_{\text{allow}}$; a stretch limit $\delta \le \delta_{\max}$ requires $A \ge PL/(E\,\delta_{\max})$. The **larger** required area governs.`,
      { title: "Stress-based design" },
    ),
    numeric("SF", {
      question: r`A steel tie with $\sigma_Y = 250\,\mathrm{MPa}$ has a design stress of $100\,\mathrm{MPa}$. What is its safety factor on yield?`,
      answer: 2.5, // check: SF = 250/100 = 2.5
      tolerance: 0.025,
      answerDisplay: "2.5",
      hint: "Allowable stress over design stress.",
      explanation: r`$SF = \sigma_Y/\sigma_d = 250/100 = 2.5$ — comfortable for a civil structure (1.6–2.0), but below the typical mechanical-design value of 3.`,
      tags: ["design", "safety-factor"],
    }),
    numeric("design-area-stretch", {
      body: r`An 8 m steel linkage ($E = 200\,\mathrm{GPa}$) must carry 3 kN with an allowable stress of $150\,\mathrm{MPa}$ and a stretch of no more than 4 mm. It is made of solid round stock.`,
      question: r`What minimum area does the **stretch** limit require? Answer in $\mathrm{mm^2}$.`,
      answer: 30, // check: A ≥ PL/(Eδ) = 3000·8000/(200 000·4) = 2.4e7/8e5 = 30 mm²
      tolerance: 0.3,
      suffix: "mm²",
      hint: r`Solve $PL/(AE) \le \delta_{\max}$ for $A$.`,
      explanation: r`$A \ge \dfrac{PL}{E\,\delta_{\max}} = \dfrac{(3000)(8000)}{(200\,000)(4)} = 30\,\mathrm{mm^2}$. The stress limit only asks for $A \ge P/\sigma_{\text{allow}} = 3000/150 = 20\,\mathrm{mm^2}$.`,
      tags: ["design"],
    }),
    numeric("design-diameter", {
      question: "What is the minimum diameter of the linkage? Answer in mm to three significant figures.",
      answer: 6.18, // check: governing A = 30 mm² (stretch) > 20 mm² (stress); d = √(4·30/π) = √38.197 = 6.1804 mm
      tolerance: 0.06,
      suffix: "mm",
      answerDisplay: r`6.18\,\mathrm{mm}`,
      hint: r`Take the larger of the two required areas, then invert $A = \pi d^2/4$.`,
      explanation: r`The stretch limit governs: $30\,\mathrm{mm^2}$ beats $20\,\mathrm{mm^2}$. Then $d = \sqrt{4A/\pi} = \sqrt{120/\pi} = 6.18\,\mathrm{mm}$. Designing for stress alone would give $d = \sqrt{80/\pi} = 5.05\,\mathrm{mm}$, and that linkage would stretch $6\,\mathrm{mm}$ — too much.`,
      tags: ["design"],
    }),
    numeric("femur", {
      body: r`Estimate the axial crushing load of a femur shaft, modelled as a tube of cortical bone with outer diameter 28 mm, inner diameter 14 mm and compressive strength $190\,\mathrm{MPa}$.`,
      question: "What force crushes it? Answer in kN.",
      answer: 87.74, // check: A = π(28² − 14²)/4 = π·588/4 = 461.81 mm²; F = 190 × 461.81 = 87 745 N = 87.7 kN
      tolerance: 0.88,
      suffix: "kN",
      answerDisplay: r`87.7\,\mathrm{kN}`,
      hint: r`The crushing force is strength times area; for a tube $A = \pi(d_o^2 - d_i^2)/4$.`,
      explanation: r`$A = \tfrac{\pi}{4}(28^2 - 14^2) = \tfrac{\pi}{4}(588) = 461.8\,\mathrm{mm^2}$, so $F = \sigma A = (190)(461.8) = 87\,700\,\mathrm{N} \approx 87.7\,\mathrm{kN}$ — about 9 tonnes. The hollow core removes a quarter of the solid area, so it costs only a quarter of the crushing strength.`,
      tags: ["design", "stress"],
    }),
    reading(
      "summary",
      r`**What you did:** used energy conservation to find deflections and impact forces, and sized bars against stress and stretch limits.

- Elastic systems: $W_{\text{in}} = W_{\text{stored}}$; linear: $W_{\text{in}} = \tfrac12P\delta$.
- Strain-energy density $w = \tfrac12\sigma\varepsilon = \sigma^2/2E$; uniform bar $W = P^2L/(2AE)$.
- Trusses: $\tfrac12P\delta = \sum F_i^2L_i/(2A_iE_i)$ gives only the deflection along $P$.
- Impact: $P_{\max} = W(1 + \sqrt{1 + 2h/\delta_s})$ with $\delta_s = WL/AE$; never less than $2W$.
- Design: $SF = \sigma_a/\sigma_d$; $A \ge P/\sigma_{\text{allow}}$ and $A \ge PL/(E\delta_{\max})$ — the larger governs.

You've finished Unit 1. Take the **Level Check** to see what sticks without hints.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit practice bank (Level Check)                                    */
/* ------------------------------------------------------------------ */

const practice: QuestionStep[] = [
  numeric("p-stress-ksi", {
    question: r`A $\tfrac12$-in diameter steel rod carries an axial tension of 3 kip. What is the normal stress? Answer in ksi.`,
    answer: 15.279, // check: A = π(0.5)²/4 = 0.19635 in²; σ = 3 kip / 0.19635 in² = 15.279 ksi
    tolerance: 0.15,
    suffix: "ksi",
    answerDisplay: r`15.3\,\mathrm{ksi}`,
    hint: r`$A = \pi d^2/4$, and kip per square inch is ksi.`,
    explanation: r`$A = \pi(0.5)^2/4 = 0.1963\,\mathrm{in^2}$, so $\sigma = 3/0.1963 = 15.3\,\mathrm{ksi}$ (tension).`,
    tags: ["stress", "units"],
  }),
  numeric("p-elongation", {
    question: r`An aluminium rod ($E = 70\,\mathrm{GPa}$), 1.5 m long and 10 mm in diameter, carries an end load of 5.5 kN. What is its elongation? Answer in mm.`,
    answer: 1.5006, // check: A = π·10²/4 = 78.540 mm²; δ = 5500·1500/(78.540·70 000) = 8.25e6/5.4978e6 = 1.5006 mm
    tolerance: 0.015,
    suffix: "mm",
    answerDisplay: r`1.50\,\mathrm{mm}`,
    hint: r`$\delta = PL/AE$ with $A = \pi d^2/4$, in N, mm and $\mathrm{N/mm^2}$.`,
    explanation: r`$A = \pi(10)^2/4 = 78.54\,\mathrm{mm^2}$, so $\delta = \dfrac{(5500)(1500)}{(78.54)(70\,000)} = 1.50\,\mathrm{mm}$.`,
    tags: ["elongation"],
  }),
  numeric("p-stepped", {
    question: r`A steel bar ($E = 200\,\mathrm{GPa}$) built in at the left has segment 1 ($A_1 = 600\,\mathrm{mm^2}$, $L_1 = 500\,\mathrm{mm}$) next to the wall and segment 2 ($A_2 = 300\,\mathrm{mm^2}$, $L_2 = 250\,\mathrm{mm}$). A 45 kN pull acts at the free end, and a 15 kN force pushes toward the wall at the junction. Find the end displacement in mm.`,
    answer: 0.3125, // check: R2 = 45 kN, R1 = 45 − 15 = 30 kN; δ = 30 000·500/(600·200 000) + 45 000·250/(300·200 000) = 0.125 + 0.1875 = 0.3125 mm
    tolerance: 0.003,
    suffix: "mm",
    answerDisplay: r`0.3125\,\mathrm{mm}`,
    hint: "Find $R$ in each segment with a cut, keeping the piece to the right of the cut.",
    explanation: r`Segment 2: $R_2 = 45\,\mathrm{kN}$. Segment 1: $R_1 = 45 - 15 = 30\,\mathrm{kN}$. $\delta = \dfrac{(30\,000)(500)}{(600)(200\,000)} + \dfrac{(45\,000)(250)}{(300)(200\,000)} = 0.125 + 0.1875 = 0.3125\,\mathrm{mm}$.`,
    tags: ["stepped-bar", "elongation"],
  }),
  numeric("p-distributed-R", {
    question: r`A bar built in at $x = 0$ and free at $x = L = 600\,\mathrm{mm}$ carries a distributed load $b(x) = c\,x$ toward $+x$ (away from the wall), with $c = 0.05\,\mathrm{N/mm^2}$. What is the internal force at mid-length? Answer in kN.`,
    answer: 6.75, // check: R(x) = c(L² − x²)/2 = 0.025·(360 000 − 90 000) = 6750 N = 6.75 kN
    tolerance: 0.07,
    suffix: "kN",
    answerDisplay: r`6.75\,\mathrm{kN}`,
    hint: r`For a bar with a load-free end at $x = L$, $R(x) = \int_x^L b(s)\,ds$.`,
    explanation: r`$R(x) = \tfrac{c}{2}(L^2 - x^2)$, so $R(300) = 0.025\,(360\,000 - 90\,000) = 6750\,\mathrm{N} = 6.75\,\mathrm{kN}$ (tension).`,
    tags: ["internal-force", "distributed-load"],
  }),
  numeric("p-indeterminate", {
    question: r`A uniform bar is fixed at both ends, $x = 0$ and $x = L$. A force of 90 kN toward $+x$ acts at $x = 0.4L$. What is the internal force in the part $x > 0.4L$? Answer in kN, using the sign convention.`,
    answer: -36, // check: R1 = P(1 − a/L) = 90·0.6 = 54 kN; right part R1 − P = 54 − 90 = −36 kN (= −Pa/L)
    tolerance: 0.4,
    suffix: "kN",
    hint: r`$R_1 = P(1 - a/L)$ to the left of the load; the right part carries $R_1 - P$.`,
    explanation: r`$R_1 = 90(1 - 0.4) = 54\,\mathrm{kN}$ (tension) left of the load, and $R_1 - P = 54 - 90 = -36\,\mathrm{kN}$ (compression) to the right — equivalently $-Pa/L = -0.4(90)$.`,
    tags: ["indeterminate"],
  }),
  numeric("p-thermal", {
    question: r`An aluminium bar ($E = 70\,\mathrm{GPa}$, $\alpha = 24\times10^{-6}/^\circ\mathrm{C}$) is fixed between rigid walls with no stress and then **cooled** by $30^\circ\mathrm{C}$. What is the stress? Answer in MPa, using the sign convention.`,
    answer: 50.4, // check: σ = −EαΔT = −70 000 × 24e-6 × (−30) = +50.4 MPa (tension)
    tolerance: 0.5,
    suffix: "MPa",
    answerDisplay: r`50.4\,\mathrm{MPa}`,
    hint: r`$\sigma = -E\alpha\,\Delta T$ with $\Delta T < 0$.`,
    explanation: r`$\sigma = -E\alpha\,\Delta T = -(70\,000)(24\times10^{-6})(-30) = +50.4\,\mathrm{MPa}$: tension. The walls hold the bar at its original length while it tries to shrink.`,
    tags: ["thermal", "sign-convention"],
  }),
  mc("p-free-end-bc", {
    question: r`A bar is built in at $x = L$ and free at $x = 0$, with a distributed load $b(x)$. Which boundary conditions apply?`,
    choices: [
      ["ok", r`$u(L) = 0$ and $AE\,u'(0) = 0$`],
      ["swap", r`$u(0) = 0$ and $AE\,u'(L) = 0$`, r`That's the bar fixed at $x = 0$. Here the wall is at $x = L$.`],
      ["uu", r`$u(0) = 0$ and $u(L) = 0$`, "Only one end is fixed."],
      ["pp", r`$AE\,u'(0) = 0$ and $AE\,u'(L) = 0$`, "The wall fixes the displacement, not the force."],
    ],
    correct: "ok",
    shuffle: true,
    hint: "Wall: displacement BC. Free end: zero force.",
    explanation: r`At the wall $x = L$: $u(L) = 0$. At the free end $x = 0$ the force vanishes: $R(0) = AE\,u'(0) = 0$.`,
    tags: ["ode", "boundary-conditions"],
  }),
  mc("p-poly-order", {
    question: r`For constant $AE$ and $b(x) = c\,x^2$, what is the polynomial degree of $u(x)$?`,
    choices: [
      ["2", "2", "Degree 2 comes from a constant load."],
      ["3", "3", r`Degree 3 comes from a linear load $c\,x$.`],
      ["4", "4"],
      ["5", "5", "Integrating twice raises the degree by exactly two."],
    ],
    correct: "4",
    hint: "Each integration raises the degree by one.",
    explanation: r`$AE\,u'' = -cx^2 \Rightarrow AE\,u = -\tfrac{c}{12}x^4 + C_1x + C_2$: degree 4, whatever the boundary conditions.`,
    tags: ["ode"],
  }),
  numeric("p-energy", {
    question: r`How much energy does it take to compress a steel bar ($E = 200\,\mathrm{GPa}$) of diameter 10 mm and length 250 mm by 0.1 mm? Answer in N·mm.`,
    answer: 314.16, // check: A = 78.540 mm²; P = AEδ/L = 78.540·200 000·0.1/250 = 6283.2 N; W = ½Pδ = 314.16 N·mm (= AEδ²/2L)
    tolerance: 3,
    suffix: "N·mm",
    answerDisplay: r`314\,\mathrm{N\cdot mm}`,
    hint: r`Find the force from $\delta = PL/AE$, then $W = \tfrac12 P\delta$ — or use $W = AE\delta^2/(2L)$ directly.`,
    explanation: r`$A = 78.54\,\mathrm{mm^2}$, $P = AE\delta/L = (78.54)(200\,000)(0.1)/250 = 6283\,\mathrm{N}$, and $W = \tfrac12P\delta = \tfrac12(6283)(0.1) = 314\,\mathrm{N\cdot mm} = 0.314\,\mathrm{J}$.`,
    tags: ["energy"],
  }),
  numeric("p-design", {
    question: r`A solid round steel tie ($E = 200\,\mathrm{GPa}$), 2 m long, must carry 25 kN with $\sigma \le 160\,\mathrm{MPa}$ and $\delta \le 1\,\mathrm{mm}$. What is its minimum diameter? Answer in mm.`,
    answer: 17.841, // check: stress A ≥ 25 000/160 = 156.25 mm² (d ≥ 14.10); stretch A ≥ 25 000·2000/(200 000·1) = 250 mm² ⇒ d = √(4·250/π) = 17.841 mm governs
    tolerance: 0.18,
    suffix: "mm",
    answerDisplay: r`17.8\,\mathrm{mm}`,
    hint: "Compute the area each limit requires; the larger one governs.",
    explanation: r`Stress: $A \ge 25\,000/160 = 156\,\mathrm{mm^2}$. Stretch: $A \ge PL/(E\,\delta_{\max}) = (25\,000)(2000)/[(200\,000)(1)] = 250\,\mathrm{mm^2}$, which governs. $d = \sqrt{4(250)/\pi} = 17.8\,\mathrm{mm}$.`,
    tags: ["design"],
  }),
  tf("p-superposition", {
    statement: "For a linear elastic bar, the end displacement under a distributed load and an end force acting together equals the sum of the end displacements under each load acting alone.",
    answer: true,
    feedback: "Are all the governing equations linear in the loads?",
    hint: "Superposition needs linear kinematics, equilibrium and constitutive law.",
    explanation: r`True: $\varepsilon = u'$, $\sigma = E\varepsilon$ and $R' + b = 0$ are all linear, so solutions for separate load cases add. It would fail for a yielding or non-linear elastic material.`,
    tags: ["superposition"],
  }),
  tf("p-sign-u", {
    statement: r`If every point of a bar moves toward $-x$ (so $u \le 0$ everywhere), the bar must be in compression.`,
    answer: false,
    feedback: r`Compression means $du/dx < 0$. Can $u$ be negative while still increasing along the bar?`,
    hint: r`Think of a bar fixed at its right end $x = L$ and pulled toward $-x$ at its left end.`,
    explanation: r`False. Compression means $\varepsilon = du/dx < 0$ — it is about how $u$ *changes*, not its sign. A bar fixed at $x = L$ and pulled toward $-x$ at $x = 0$ has $u(x) = -P(L - x)/AE \le 0$ everywhere, yet $du/dx = P/AE > 0$: tension.`,
    tags: ["sign-convention", "strain"],
  }),
];

/* ------------------------------------------------------------------ */
/* Unit                                                                */
/* ------------------------------------------------------------------ */

export const sm1: Unit = {
  id: "sm1",
  title: "Axial bars",
  subtitle: "The one-dimensional model: kinematics, equilibrium, constitution",
  description:
    "Everything in the course in miniature: displacement and strain, internal force and stress, Hooke's law, and the three-step recipe (kinematics, equilibrium, constitutive law) that solves any bar — determinate or not.",
  textbook: "Govindjee ch. 2",
  lessons: [l1, l2, l3, l4, l5, l6, l7],
  practice,
  generators: [
    "gen.sm.axial-stress",
    "gen.sm.axial-elongation",
    "gen.sm.stepped-bar",
    "gen.sm.strain-from-u",
    "gen.sm.thermal-bar",
    "gen.sm.indeterminate-bar",
    "gen.sm.design-diameter",
    "gen.sm.strain-energy",
  ],
};
