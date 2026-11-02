import type { QuestionStep, Unit } from "../types";
import { lesson, matrix, mc, numeric, r, reading, tf } from "../dsl";

/*
 * Unit sm4 · Generalized Hooke's law (Govindjee ch. 5)
 *
 * Conventions used throughout (they match the book):
 *   - normal strains  eps_xx = sigma_xx/E - nu(sigma_yy + sigma_zz)/E + alpha dT   (and cyclic)
 *   - shear           gamma_xy = tau_xy / G   (ENGINEERING shear strain), G = E / (2(1 + nu))
 *   - the strain MATRIX carries the tensor component eps_xy = gamma_xy / 2 off the diagonal
 *   - pressure        p = (sigma_xx + sigma_yy + sigma_zz)/3, POSITIVE IN TENSION
 *   - volume strain   theta = eps_xx + eps_yy + eps_zz = p/K (+ 3 alpha dT), K = E / (3(1 - 2 nu))
 * Units: MPa and mm (E = 200 GPa = 200 000 MPa); strains quoted in micro-strain (1e-6) where asked.
 */

/* ------------------------------------------------------------------ */
/* Lesson 1 · Poisson's ratio and the 3-D law (Govindjee §5.1)          */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "sm4-l1-poisson-and-3d-hooke",
    unitId: "sm4",
    title: "Poisson's ratio and the 3-D law",
    summary: "Two elastic constants, the shear modulus, thermal strain, and the six equations linking stress to strain, run forwards and backwards.",
    textbook: "Govindjee §5.1",
    minutes: 15,
  },
  [
    reading(
      "constants",
      r`In Chapter 2 a bar needed one elastic constant: $\sigma = E\varepsilon$. A real block is three-dimensional, and for an **isotropic** solid (same properties in every direction: most metals, many plastics) linear thermo-elasticity needs only **two elastic constants plus one thermal one**:

- **Young's modulus** $E$: normal stress to normal strain in the same direction.
- **Poisson's ratio** $\nu$: how much the material contracts *sideways* when you pull it.
- The **coefficient of thermal expansion** $\alpha$.

Pull in $x$ with $\sigma_{xx}$ alone and the block stretches in $x$ but contracts in $y$ and $z$:

$$\varepsilon_{xx} = \frac{\sigma_{xx}}{E}, \qquad \varepsilon_{yy} = \varepsilon_{zz} = -\nu\,\frac{\sigma_{xx}}{E}.$$

Thermodynamics only allows $-1 \le \nu < \tfrac12$. Common metals have $\nu \approx 0.3$, polymers about $0.45$ or a bit more, rubber about $0.49$, and some structured (auxetic) foams have $\nu < 0$: they **expand** sideways when stretched.

The element below uses the book's convention: the first index names the face (its outward normal), the second the direction of the force. Drag the sliders to load it.`,
      {
        title: "Two constants (plus α)",
        visual: { kind: "stress-element", config: { sxx: 80, syy: 0, sxy: 0, sliders: true, max: 150, unit: "MPa" } },
      },
    ),
    mc("nu-negative", {
      question: r`A rod made of a structured foam with $\nu = -0.4$ is pulled in tension along its axis. What happens to its diameter?`,
      choices: [
        ["grows", "It increases: the rod gets fatter."],
        ["shrinks", "It decreases, like a steel rod.", r`That is what a positive $\nu$ does. The lateral strain is $-\nu\,\varepsilon_{\text{axial}}$; put in $\nu = -0.4$ and check its sign.`],
        ["same", "It does not change.", r`That would be $\nu = 0$ (cork comes close). Here $\nu \ne 0$.`],
        ["depends", "It depends on how large $E$ is.", r`$E$ sets how much axial strain you get, but the *sign* of the lateral strain is set by $\nu$ alone.`],
      ],
      correct: "grows",
      hint: r`Write the lateral strain as $\varepsilon_{\text{lat}} = -\nu\,\varepsilon_{\text{axial}}$ and put in the signs: tension means $\varepsilon_{\text{axial}} > 0$.`,
      explanation: r`In tension $\varepsilon_{\text{axial}} > 0$, so $\varepsilon_{\text{lat}} = -\nu\,\varepsilon_{\text{axial}} = -(-0.4)\,\varepsilon_{\text{axial}} = +0.4\,\varepsilon_{\text{axial}} > 0$: the diameter **grows**. Negative-$\nu$ (auxetic) materials fatten when stretched and get thinner when compressed, the opposite of steel (Govindjee Exercise 5.1 asks exactly this).`,
      tags: ["poisson"],
    }),
    mc("nu-range", {
      question: r`Which of these values of $\nu$ is **impossible** for a stable isotropic linear elastic material?`,
      choices: [
        ["p06", r`$\nu = 0.6$`],
        ["m05", r`$\nu = -0.5$`, "Allowed: negative values describe auxetic foams, and the lower limit is −1."],
        ["zero", r`$\nu = 0$`, "Allowed: cork is close to this. Pulling it produces no lateral strain."],
        ["p049", r`$\nu = 0.49$`, "Allowed: that is rubber, just below the upper limit."],
      ],
      correct: "p06",
      shuffle: true,
      hint: "The book quotes the thermodynamically allowed interval for ν right after defining it. Which option lies outside it?",
      explanation: r`Thermodynamics restricts $-1 \le \nu < \tfrac12$, so $\nu = 0.6$ is impossible. With $\nu > \tfrac12$ a bar would *lose* volume when pulled ($\theta = (1 - 2\nu)\sigma/E < 0$), and, as Lesson 2 shows, its bulk modulus $K = E/(3(1 - 2\nu))$ would be negative. The upper limit $\nu \to \tfrac12$ is the incompressible limit.`,
      tags: ["poisson"],
    }),
    reading(
      "shear-heat",
      r`Normal stresses make normal strains. **Shear** stresses make shear strains, and in an isotropic material *only the matching one*:

$$\gamma_{xy} = \frac{\tau_{xy}}{G}, \qquad \gamma_{yz} = \frac{\tau_{yz}}{G}, \qquad \gamma_{zx} = \frac{\tau_{zx}}{G}, \qquad G = \frac{E}{2(1+\nu)}.$$

Here $\gamma_{xy}$ is the **engineering** shear strain, the decrease of the right angle between the $x$ and $y$ fibres. The tensor component that goes into the strain matrix is $\varepsilon_{xy} = \tfrac12\gamma_{xy}$. The **shear modulus** $G$ is not a third independent constant: it is fixed by $E$ and $\nu$ (proved in Govindjee ch. 9).

**Heating** a free isotropic body by $\Delta T$ expands it equally in every direction and does not distort angles:

$$\varepsilon_{xx} = \varepsilon_{yy} = \varepsilon_{zz} = \alpha\,\Delta T, \qquad \gamma_{xy} = \gamma_{yz} = \gamma_{zx} = 0.$$

The grid shows a pure shear with a hugely exaggerated $\gamma_{xy} = 0.1$: the square becomes a rhombus, its sides keep their length, and the right angle closes by 0.1 rad.`,
      {
        title: "Shear pairs and heating",
        visual: { kind: "strain-grid", config: { grad: [[0, 0.05], [0.05, 0]], sliders: true } },
      },
    ),
    numeric("g-steel", {
      question: r`Steel: $E = 200\,\mathrm{GPa}$, $\nu = 0.3$. What is the shear modulus $G$, in GPa, to three significant figures?`,
      answer: 76.92, // check: 200 / (2·1.3) = 200/2.6 = 76.923 GPa
      tolerance: 0.8,
      suffix: "GPa",
      answerDisplay: r`76.9\,\mathrm{GPa}`,
      hint: "Use the relation between G, E and ν from the reading, and watch where the factor 2 goes.",
      explanation: r`$G = \dfrac{E}{2(1+\nu)} = \dfrac{200}{2(1.3)} = \dfrac{200}{2.6} = 76.9\,\mathrm{GPa}$. (Tables often round steel to $G \approx 80\,\mathrm{GPa}$. When a problem gives you $G$, use the given value.)`,
      tags: ["shear-modulus"],
    }),
    numeric("nu-from-eg", {
      question: r`A material is specified by $E = 100\,\mathrm{GPa}$ and $G = 45\,\mathrm{GPa}$ instead of $E$ and $\nu$. What is its Poisson's ratio, to three significant figures?`,
      answer: 0.1111, // check: E/(2G) − 1 = 100/90 − 1 = 0.11111 (= 1/9)
      tolerance: 0.002,
      prefix: r`$\nu =$`,
      answerDisplay: r`\nu = \tfrac{1}{9} \approx 0.111`,
      hint: r`Solve $G = E/(2(1+\nu))$ for $\nu$.`,
      explanation: r`$1 + \nu = \dfrac{E}{2G}$, so $\nu = \dfrac{E}{2G} - 1 = \dfrac{100}{90} - 1 = 0.111$. This is the first move whenever a problem hands you $E$ and $G$: every normal-strain equation needs $\nu$.`,
      tags: ["shear-modulus", "poisson"],
    }),
    tf("shear-only", {
      statement: r`In an isotropic linear elastic material a normal stress $\sigma_{xx}$ alone produces no shear strain $\gamma_{xy}$, and a shear stress $\tau_{xy}$ alone produces no normal strains.`,
      answer: true,
      feedback: r`Each shear strain depends only on its own shear stress, $\gamma_{xy} = \tau_{xy}/G$, and shear stresses never appear in the normal-strain equations.`,
      hint: r`Look at which stresses appear on the right of $\gamma_{xy} = \tau_{xy}/G$, and which appear in the $\varepsilon_{xx}$ equation.`,
      explanation: r`True. The six equations split cleanly: normal strains depend only on normal stresses (plus heating), and each shear strain only on its own shear stress. That is isotropy at work: with no preferred direction, pulling along $x$ has no reason to skew the right angle one way rather than the other. (Anisotropic materials, such as a fibre composite loaded off its fibre axis, *do* couple them.)`,
      tags: ["hooke-3d"],
    }),
    numeric("thermal-free", {
      question: r`An unrestrained aluminium block ($\alpha = 24\times10^{-6}\,/^{\circ}\mathrm{C}$) is heated by $\Delta T = 40^{\circ}\mathrm{C}$, with no stress anywhere. What is $\varepsilon_{xx}$, in micro-strain ($10^{-6}$)?`,
      answer: 960, // check: αΔT = 24e-6 · 40 = 960e-6
      tolerance: 1,
      suffix: "μ",
      hint: "With all stresses zero, only one term of the εxx equation survives.",
      explanation: r`$\varepsilon_{xx} = \alpha\Delta T = 24\times10^{-6} \times 40 = 960\times10^{-6}$, and the same in $y$ and $z$. All shear strains are zero: heating changes size, not shape, so the block stays rectangular. No stress develops because nothing resists the expansion.`,
      tags: ["thermal"],
    }),
    reading(
      "six",
      r`Each effect is linear, so they simply **add**: the strain in $x$ is its own stretch, minus the Poisson contractions caused by the other two normal stresses, plus heating. These are Govindjee eqns (5.1)–(5.6):

$$\varepsilon_{xx} = \frac{\sigma_{xx}}{E} - \frac{\nu}{E}(\sigma_{yy} + \sigma_{zz}) + \alpha\,\Delta T$$

$$\varepsilon_{yy} = \frac{\sigma_{yy}}{E} - \frac{\nu}{E}(\sigma_{zz} + \sigma_{xx}) + \alpha\,\Delta T$$

$$\varepsilon_{zz} = \frac{\sigma_{zz}}{E} - \frac{\nu}{E}(\sigma_{xx} + \sigma_{yy}) + \alpha\,\Delta T$$

$$\gamma_{xy} = \frac{\tau_{xy}}{G}, \qquad \gamma_{yz} = \frac{\tau_{yz}}{G}, \qquad \gamma_{zx} = \frac{\tau_{zx}}{G}$$

They are the six equations that were missing in Govindjee §4.4: in 3-D there are 18 unknowns (6 strains, 3 displacements, 9 stresses) but only 12 equations (6 equilibrium, 6 strain–displacement). Hooke's law closes the system.

> Pattern: **own stress over E, minus ν over E times the other two, plus αΔT.** Keep the signs: a *compressive* neighbour ($\sigma_{zz} < 0$) makes the Poisson term *add* to $\varepsilon_{xx}$.`,
      { title: "Superpose: six equations" },
    ),
    numeric("exx-3d", {
      body: r`At a point in an aluminium part ($E = 70\,\mathrm{GPa}$, $\nu = 0.33$, no temperature change) the stresses are $\sigma_{xx} = 100\,\mathrm{MPa}$, $\sigma_{yy} = 50\,\mathrm{MPa}$, $\sigma_{zz} = -30\,\mathrm{MPa}$, and there is no shear.`,
      question: r`Find $\varepsilon_{xx}$ in micro-strain ($10^{-6}$), to three significant figures.`,
      answer: 1334.3, // check: (100 − 0.33·(50 − 30))/70 000 = 93.4/70 000 = 1334.3e-6
      tolerance: 14,
      suffix: "μ",
      answerDisplay: r`1334\times10^{-6}`,
      hint: r`Work in MPa with $E = 70\,000\,\mathrm{MPa}$. The Poisson term uses the *sum* of the other two normal stresses, signs included.`,
      explanation: r`$$\varepsilon_{xx} = \frac{100 - 0.33\,(50 + (-30))}{70\,000} = \frac{100 - 6.6}{70\,000} = \frac{93.4}{70\,000} = 1334\times10^{-6}.$$

The compressive $\sigma_{zz}$ partly cancels the Poisson contraction from $\sigma_{yy}$. (For the record, $\varepsilon_{yy} = (50 - 0.33 \times 70)/70\,000 = 384\times10^{-6}$.)`,
      tags: ["hooke-3d"],
    }),
    numeric("ezz-3d", {
      body: "Same point, same stresses.",
      question: r`Now find $\varepsilon_{zz}$ in micro-strain, using the sign convention (a contraction is negative).`,
      answer: -1135.7, // check: (−30 − 0.33·(100 + 50))/70 000 = −79.5/70 000 = −1135.7e-6
      tolerance: 12,
      suffix: "μ",
      answerDisplay: r`-1136\times10^{-6}`,
      hint: r`$\sigma_{zz}$ is compressive and both of the other normal stresses are tensile. Do their Poisson terms add to the direct term or cancel it?`,
      explanation: r`$$\varepsilon_{zz} = \frac{-30 - 0.33\,(100 + 50)}{70\,000} = \frac{-30 - 49.5}{70\,000} = \frac{-79.5}{70\,000} = -1136\times10^{-6}.$$

Both effects shorten the $z$ fibres: the direct compression and the Poisson contraction caused by the two tensile stresses.`,
      tags: ["hooke-3d"],
    }),
    numeric("gamma-al", {
      question: r`The same aluminium has $G = E/(2(1+\nu)) = 70/2.66 = 26.3\,\mathrm{GPa}$ and carries a shear stress $\tau_{xy} = 40\,\mathrm{MPa}$. What is the engineering shear strain $\gamma_{xy}$, in micro-strain (μrad), to three significant figures?`,
      answer: 1520.9, // check: 40 / 26 300 = 1.5209e-3 = 1520.9e-6
      tolerance: 15,
      suffix: "μ",
      answerDisplay: r`1521\times10^{-6}`,
      hint: "A shear strain needs only its own shear stress and the shear modulus. Convert GPa to MPa first.",
      explanation: r`$\gamma_{xy} = \tau_{xy}/G = 40/26\,300 = 1521\times10^{-6}$ rad: the right angle between the $x$ and $y$ fibres closes by about 0.0015 rad. The tensor component that goes into the strain matrix is half of that, $\varepsilon_{xy} \approx 760\times10^{-6}$.`,
      tags: ["shear-modulus", "hooke-3d"],
    }),
    reading(
      "worked",
      r`A steel point ($E = 200\,\mathrm{GPa}$, $\nu = 0.25$, so $G = 200/2.5 = 80\,\mathrm{GPa}$; $\alpha = 12\times10^{-6}/^{\circ}\mathrm{C}$) is heated by $\Delta T = 10^{\circ}\mathrm{C}$ while carrying

$$\boldsymbol{\sigma} = \begin{bmatrix} 60 & 24 & 0 \\ 24 & -60 & 0 \\ 0 & 0 & 0 \end{bmatrix}\mathrm{MPa}.$$

The thermal strain is $\alpha\Delta T = 120\times10^{-6}$ in every direction. Then:

- $\varepsilon_{xx} = \dfrac{60 - 0.25(-60 + 0)}{200\,000} + 120\times10^{-6} = (300 + 75 + 120)\times10^{-6} = 495\times10^{-6}$
- $\varepsilon_{yy} = \dfrac{-60 - 0.25(60 + 0)}{200\,000} + 120\times10^{-6} = (-300 - 75 + 120)\times10^{-6} = -255\times10^{-6}$
- $\varepsilon_{zz} = \dfrac{0 - 0.25(60 - 60)}{200\,000} + 120\times10^{-6} = 120\times10^{-6}$
- $\gamma_{xy} = 24/80\,000 = 300\times10^{-6}$, so $\varepsilon_{xy} = 150\times10^{-6}$; $\gamma_{yz} = \gamma_{zx} = 0$

$$\boldsymbol{\varepsilon} = \begin{bmatrix} 495 & 150 & 0 \\ 150 & -255 & 0 \\ 0 & 0 & 120 \end{bmatrix}\times10^{-6}.$$

Notice $\varepsilon_{zz} \ne 0$ even though $\sigma_{zz} = 0$: the Poisson terms cancel here, but the heating does not.

> The strain **matrix** carries the tensor shear strain $\varepsilon_{xy} = \tfrac12\gamma_{xy}$ off the diagonal, while the right angle between the $x$ and $y$ fibres closes by the full $\gamma_{xy} = 300\,\mu\mathrm{rad}$. Printed solutions sometimes mix the two, so always say which one you mean.`,
      {
        title: "Worked example: stress plus heat",
        visual: { kind: "stress-element", config: { sxx: 60, syy: -60, sxy: 24, max: 100, unit: "MPa" } },
      },
    ),
    matrix("strain-matrix", {
      body: r`Same steel ($E = 200\,\mathrm{GPa}$, $\nu = 0.25$, $G = 80\,\mathrm{GPa}$), no temperature change, now with

$$\boldsymbol{\sigma} = \begin{bmatrix} 80 & 20 & 0 \\ 20 & -40 & 0 \\ 0 & 0 & 20 \end{bmatrix}\mathrm{MPa}.$$`,
      question: r`Enter the strain matrix in micro-strain ($10^{-6}$). These are tensor components, so the off-diagonal entries are $\varepsilon_{ij} = \tfrac12\gamma_{ij}$.`,
      answer: [
        [425, 125, 0],
        [125, -325, 0],
        [0, 0, 50],
      ], // check: εxx = (80 − 0.25(−40 + 20))/200 000 = 85/200 000 = 425e-6; εyy = (−40 − 0.25(80 + 20))/200 000 = −65/200 000 = −325e-6; εzz = (20 − 0.25(80 − 40))/200 000 = 10/200 000 = 50e-6; γxy = 20/80 000 = 250e-6 → εxy = 125e-6
      tolerance: 2,
      prefix: r`$\boldsymbol{\varepsilon}\times10^{6} =$`,
      hint: "Three normal strains from the 3-D law (no heating this time), then halve the engineering shear strain for the off-diagonal entries.",
      explanation: r`- $\varepsilon_{xx} = \dfrac{80 - 0.25(-40 + 20)}{200\,000} = \dfrac{85}{200\,000} = 425\times10^{-6}$
- $\varepsilon_{yy} = \dfrac{-40 - 0.25(80 + 20)}{200\,000} = \dfrac{-65}{200\,000} = -325\times10^{-6}$
- $\varepsilon_{zz} = \dfrac{20 - 0.25(80 - 40)}{200\,000} = \dfrac{10}{200\,000} = 50\times10^{-6}$
- $\gamma_{xy} = 20/80\,000 = 250\times10^{-6}$, so $\varepsilon_{xy} = 125\times10^{-6}$; the other shears are zero

If you typed 250 off the diagonal, you entered $\gamma_{xy}$: the matrix wants half of it.`,
      tags: ["hooke-3d", "strain-matrix"],
    }),
    numeric("inverse-uniaxial", {
      body: r`Now run the law **backwards**. Measurements on a steel part ($E = 200\,\mathrm{GPa}$, $\nu = 0.3$) give

$$\varepsilon_{xx} = 1000\times10^{-6}, \qquad \varepsilon_{yy} = \varepsilon_{zz} = -300\times10^{-6},$$

with no shear strains and no temperature change.`,
      question: r`What stress state produced these strains? Enter $\sigma_{xx}$ in MPa.`,
      answer: 200, // check: uniaxial guess σxx = Eεxx = 200 000·1e-3 = 200 MPa; then εyy = −0.3·200/200 000 = −300e-6 ✓ (σyy = σzz = 0)
      tolerance: 2,
      suffix: "MPa",
      hint: r`Compare $\varepsilon_{yy}/\varepsilon_{xx}$ with $\nu$. Which simple stress state gives exactly that ratio? Then check it in all three normal equations.`,
      explanation: r`The lateral strains are exactly $-\nu$ times the axial one, which is the fingerprint of **uniaxial stress**. Try $\sigma_{yy} = \sigma_{zz} = 0$: then $\sigma_{xx} = E\varepsilon_{xx} = 200\,000 \times 0.001 = 200\,\mathrm{MPa}$, and $\varepsilon_{yy} = -0.3(200)/200\,000 = -300\times10^{-6}$ ✓. Hooke's law is an invertible linear map, so this is the *only* answer. In general you must invert all three equations at once; Lesson 2 shows a fast way using the pressure.`,
      tags: ["inverse-hooke"],
    }),
    reading(
      "summary",
      r`**What you did:** related all six strains to all six stresses in an isotropic solid with heating, found $G$ from $E$ and $\nu$ (and $\nu$ from $E$ and $G$), and ran the law forwards and backwards.

$$\varepsilon_{xx} = \frac{\sigma_{xx} - \nu(\sigma_{yy} + \sigma_{zz})}{E} + \alpha\Delta T \quad (\text{and cyclic})$$

$$\gamma_{xy} = \frac{\tau_{xy}}{G}, \qquad G = \frac{E}{2(1+\nu)}, \qquad \nu = \frac{E}{2G} - 1, \qquad -1 \le \nu < \tfrac12$$

- Heating adds $\alpha\Delta T$ to every normal strain and nothing to the shear strains.
- The off-diagonal entries of the strain matrix are $\varepsilon_{xy} = \tfrac12\gamma_{xy}$.
- Negative $\nu$: the material fattens when stretched.

Next: what the *sum* of the normal stresses tells you (pressure and volume change), and how much energy is stored.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Pressure, volume change and strain energy (§5.1.1–5.1.2)  */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "sm4-l2-pressure-volume-energy",
    unitId: "sm4",
    title: "Pressure, volume change and strain energy",
    summary: "Mean stress and volume change through the bulk modulus, incompressibility, confined heating, negative Poisson's ratio, strain energy, and inverting Hooke's law.",
    textbook: "Govindjee §5.1.1–5.1.2",
    minutes: 15,
  },
  [
    reading(
      "pressure",
      r`The **pressure** at a point is the mean normal stress (Govindjee eqn 5.15):

$$p = \tfrac13(\sigma_{xx} + \sigma_{yy} + \sigma_{zz}).$$

> In this book (and most of solid mechanics) $p$ is **positive in tension**. Fluid mechanics and geotechnical engineering use the opposite sign, $p = -\tfrac13(\sigma_{xx} + \sigma_{yy} + \sigma_{zz})$, so a submerged body has a *negative* $p$ here.

The **volumetric strain** (change in volume per unit volume) is $\theta = \varepsilon_{xx} + \varepsilon_{yy} + \varepsilon_{zz}$. Add the three normal-strain equations: each normal stress appears once with $1/E$ and twice with $-\nu/E$, so

$$\theta = \frac{1 - 2\nu}{E}(\sigma_{xx} + \sigma_{yy} + \sigma_{zz}) = \frac{p}{K}, \qquad K = \frac{E}{3(1 - 2\nu)},$$

where $K$ is the **bulk modulus** (eqn 5.16, no heating; a temperature change adds $3\alpha\Delta T$ to $\theta$). Shear stresses never change the volume. As $\nu \to \tfrac12$, $K \to \infty$: no finite pressure can change the volume, and the material is called **incompressible**.

The element below is squeezed equally on all faces. Turn the cut: the traction always pushes straight in, perpendicular to the cut, because a hydrostatic state has no shear on any plane.`,
      {
        title: "Pressure and volume change",
        visual: { kind: "stress-element", config: { sxx: -50, syy: -50, sxy: 0, cut: { theta: 30, slider: true }, max: 100, unit: "MPa" } },
      },
    ),
    numeric("p-mean", {
      question: r`At a point $\sigma_{xx} = 90\,\mathrm{MPa}$, $\sigma_{yy} = -30\,\mathrm{MPa}$, $\sigma_{zz} = 30\,\mathrm{MPa}$, plus some shear stresses. What is the pressure $p$, in MPa, in this book's sign convention?`,
      answer: 30, // check: (90 − 30 + 30)/3 = 90/3 = 30 MPa
      tolerance: 0.3,
      prefix: r`$p =$`,
      suffix: "MPa",
      hint: "Shear stresses don't enter p. Average the three normal stresses, signs included.",
      explanation: r`$p = \tfrac13(90 - 30 + 30) = \tfrac{90}{3} = 30\,\mathrm{MPa}$. It is positive, so on average the point is in tension and its volume grows ($\theta = p/K > 0$).`,
      tags: ["pressure"],
    }),
    mc("p-underwater", {
      question: r`A steel ball rests at the bottom of a deep tank and the water squeezes it equally from all sides: $\sigma_{xx} = \sigma_{yy} = \sigma_{zz} = -2\,\mathrm{MPa}$. In Govindjee's convention the pressure $p$ is…`,
      choices: [
        ["neg", r`$-2\,\mathrm{MPa}$ (negative)`],
        ["pos", r`$+2\,\mathrm{MPa}$ (positive)`, "That is the fluid-mechanics sign. Here p is the plain average of the normal stresses, and these are compressive."],
        ["zero", "0, because water cannot carry shear", "Shear has nothing to do with p: it is the mean normal stress."],
        ["six", r`$-6\,\mathrm{MPa}$`, "p is the *mean* normal stress: divide the sum by 3."],
      ],
      correct: "neg",
      hint: "Use the definition literally: average the three normal stresses, signs included.",
      explanation: r`$p = \tfrac13(-2 - 2 - 2) = -2\,\mathrm{MPa}$. Compression is negative in solid mechanics, so a body under water has $p < 0$ and its volume shrinks ($\theta = p/K < 0$). A fluid dynamicist would say "a pressure of +2 MPa": same physics, opposite sign convention. Check the convention before you read the number.`,
      tags: ["pressure", "sign-convention"],
    }),
    numeric("k-steel", {
      question: r`Steel: $E = 200\,\mathrm{GPa}$, $\nu = 0.3$. What is the bulk modulus $K$, in GPa, to three significant figures?`,
      answer: 166.67, // check: 200 / (3·(1 − 0.6)) = 200/1.2 = 166.67 GPa
      tolerance: 1.7,
      prefix: r`$K =$`,
      suffix: "GPa",
      answerDisplay: r`166.7\,\mathrm{GPa}`,
      hint: r`Compute the bracket $1 - 2\nu$ first, then use the bulk-modulus formula from the reading.`,
      explanation: r`$K = \dfrac{E}{3(1 - 2\nu)} = \dfrac{200}{3(1 - 0.6)} = \dfrac{200}{1.2} = 166.7\,\mathrm{GPa}$. Compare $G = 76.9\,\mathrm{GPa}$: steel is more than twice as stiff against volume change as against shape change.`,
      tags: ["bulk-modulus"],
    }),
    numeric("theta-from-p", {
      question: r`That steel ($K = 166.7\,\mathrm{GPa}$) is under a hydrostatic compression with $p = -50\,\mathrm{MPa}$. What is the volumetric strain $\theta$, in micro-strain?`,
      answer: -300, // check: θ = p/K = −50 / 166 667 = −3.00e-4 = −300e-6
      tolerance: 3,
      prefix: r`$\theta =$`,
      suffix: "μ",
      hint: "Volume change responds only to the pressure. Mind the GPa to MPa conversion.",
      explanation: r`$\theta = p/K = -50/166\,667 = -300\times10^{-6}$: the volume shrinks by 0.03 %. Each normal strain is a third of that, $-100\times10^{-6}$ (check: $-50(1 - 0.6)/200\,000 = -100\times10^{-6}$), because a hydrostatic state strains every direction equally.`,
      tags: ["pressure", "bulk-modulus"],
    }),
    mc("incompressible", {
      question: r`Why is a material called **incompressible** when $\nu \to \tfrac12$?`,
      choices: [
        ["k", r`Because $K = E/(3(1 - 2\nu)) \to \infty$, so a finite pressure gives zero volume change $\theta = p/K$.`],
        ["e", r`Because $E \to \infty$, so it cannot deform at all.`, "E stays finite: rubber (ν ≈ 0.49) is very soft in tension. Only its volume is stiff."],
        ["g", r`Because $G \to 0$, so it flows like a liquid.`, r`$G = E/(2(1+\nu)) \to E/3$, which is finite.`],
        ["lat", "Because its lateral strains become zero.", r`At $\nu = \tfrac12$ the lateral strains are $-\tfrac12$ of the axial strain, not zero. That is exactly what keeps the volume constant.`],
      ],
      correct: "k",
      shuffle: true,
      hint: r`*Incompressible* is about volume, not shape. Which elastic modulus links pressure to volume change, and what does it do as $\nu \to \tfrac12$?`,
      explanation: r`At $\nu = \tfrac12$ the factor $1 - 2\nu$ vanishes, so $K \to \infty$ and $\theta = p/K \to 0$ (Govindjee Exercise 5.10). Equivalently, under uniaxial stress $\theta = (1 - 2\nu)\sigma/E = 0$: the two lateral contractions of $-\tfrac12\varepsilon$ exactly cancel the axial stretch $\varepsilon$. The material still changes **shape**, it just cannot change **volume**. Rubber, with $\nu \approx 0.49$, is nearly incompressible.`,
      tags: ["bulk-modulus", "poisson"],
    }),
    tf("hydro-no-shear", {
      statement: r`A hydrostatic stress state ($\sigma_{xx} = \sigma_{yy} = \sigma_{zz}$, all shear stresses zero) produces no shear strains in an isotropic solid: a small cube stays a cube and only its size changes.`,
      answer: true,
      feedback: "In an isotropic material shear strains come only from shear stresses, and there are none here. The three normal strains are also equal.",
      hint: r`Which stresses appear in $\gamma_{xy} = \tau_{xy}/G$? And are the three normal strains equal?`,
      explanation: r`True. All the shear stresses are zero, so all the shear strains are zero; and with equal normal stresses each normal strain is $\sigma(1 - 2\nu)/E$, the same in every direction. The result is uniform expansion or contraction with no distortion, which is why a rubber ball squeezed by a fluid shrinks into a smaller ball.`,
      tags: ["pressure"],
    }),
    numeric("rubber-ball", {
      body: r`A solid rubber ball of radius $R = 60\,\mathrm{mm}$ ($E = 2\,\mathrm{MPa}$, $\nu = 0.49$) is lowered into a tank of pressurised oil, which squeezes it uniformly until its radius is $59.4\,\mathrm{mm}$.`,
      question: r`What oil pressure is needed, in MPa (give the magnitude)? Use small-strain theory: for a uniformly shrinking sphere $\theta \approx 3\,\Delta R/R$.`,
      answer: 1.0, // check: θ = 3(−0.6/60) = −0.03; K = 2/(3·0.02) = 33.33 MPa; p = Kθ = −1.00 MPa → magnitude 1.0 (exact volume ratio gives 0.990)
      tolerance: 0.015,
      suffix: "MPa",
      answerDisplay: r`1.0\,\mathrm{MPa}\ \ (p = -1.0\,\mathrm{MPa})`,
      hint: r`Get $\theta$ from the radius change, then the bulk modulus. With $\nu = 0.49$ the bracket $1 - 2\nu$ is small, so be careful.`,
      explanation: r`$\Delta R/R = -0.6/60 = -0.01$, so $\theta \approx 3(-0.01) = -0.03$. The bulk modulus is $K = \dfrac{2}{3(1 - 0.98)} = \dfrac{2}{0.06} = 33.3\,\mathrm{MPa}$, far larger than $E$ because rubber is nearly incompressible. Then $p = K\theta = 33.3 \times (-0.03) = -1.0\,\mathrm{MPa}$: the stress state is $\sigma_{xx} = \sigma_{yy} = \sigma_{zz} = -1.0\,\mathrm{MPa}$, i.e. an oil pressure of 1.0 MPa (about 10 atmospheres) to shrink the radius by just 1 %. (The exact volume ratio $(59.4/60)^3 - 1 = -0.0297$ gives 0.99 MPa, the same to small-strain accuracy.)`,
      tags: ["pressure", "bulk-modulus"],
    }),
    numeric("constrained-thermal", {
      body: r`A steel block ($E = 200\,\mathrm{GPa}$, $\nu = 0.3$, $\alpha = 12\times10^{-6}/^{\circ}\mathrm{C}$) is confined so that **all** of its strains stay zero, and then it is heated.`,
      question: r`What temperature rise $\Delta T$, in °C, produces the compressive state $\sigma_{xx} = \sigma_{yy} = \sigma_{zz} = -90\,\mathrm{MPa}$?`,
      answer: 15, // check: σ = −EαΔT/(1 − 2ν) → ΔT = 90·0.4/(200 000·12e-6) = 36/2.4 = 15 °C
      tolerance: 0.15,
      prefix: r`$\Delta T =$`,
      suffix: "°C",
      hint: r`By symmetry all three normal stresses are equal; call them $\sigma$. Set $\varepsilon_{xx} = 0$ in the 3-D law with heating and solve for $\Delta T$.`,
      explanation: r`With $\sigma_{xx} = \sigma_{yy} = \sigma_{zz} = \sigma$:

$$0 = \frac{\sigma - \nu(2\sigma)}{E} + \alpha\Delta T \quad\Rightarrow\quad \sigma = -\frac{E\alpha\Delta T}{1 - 2\nu}.$$

So $\Delta T = -\dfrac{\sigma(1 - 2\nu)}{E\alpha} = \dfrac{90 \times 0.4}{200\,000 \times 12\times10^{-6}} = \dfrac{36}{2.4} = 15^{\circ}\mathrm{C}$. The same result follows from volume: $\theta = p/K + 3\alpha\Delta T = 0$. Notice the factor $1/(1 - 2\nu) = 2.5$: full confinement gives 2.5 times the stress of a bar held only at its ends ($-E\alpha\Delta T = -36\,\mathrm{MPa}$).`,
      tags: ["thermal", "pressure"],
    }),
    numeric("foam-insert", {
      body: r`An auxetic foam rod (diameter $20\,\mathrm{mm}$, $E = 5\,\mathrm{MPa}$, $\nu = -0.5$) has to be slid into a rigid hole of diameter $19\,\mathrm{mm}$. Squeezing an ordinary ($\nu > 0$) rod along its axis makes it fatter, which would not help; this foam gets thinner instead. So the plan is to compress it axially until its diameter is $19\,\mathrm{mm}$.`,
      question: r`How much axial compressive stress is needed, in MPa (give the magnitude)? Treat the rod as being in uniaxial stress.`,
      answer: 0.5, // check: εlat = (19 − 20)/20 = −0.05 = −ν·εax = 0.5·εax → εax = −0.10; σ = Eεax = 5·(−0.10) = −0.5 MPa
      tolerance: 0.005,
      suffix: "MPa",
      answerDisplay: r`0.5\,\mathrm{MPa}\ \ (\sigma_{xx} = -0.5\,\mathrm{MPa})`,
      hint: r`First find the lateral strain you need, $\Delta d/d$. Then $\varepsilon_{\text{lat}} = -\nu\,\varepsilon_{\text{axial}}$ gives the axial strain, and Hooke's law gives the stress.`,
      explanation: r`Required lateral strain: $\varepsilon_{\text{lat}} = (19 - 20)/20 = -0.05$. With $\varepsilon_{\text{lat}} = -\nu\,\varepsilon_{\text{ax}} = 0.5\,\varepsilon_{\text{ax}}$ we need $\varepsilon_{\text{ax}} = -0.10$ (10 % shorter). Then $\sigma = E\varepsilon_{\text{ax}} = 5 \times (-0.10) = -0.5\,\mathrm{MPa}$: a compression of 0.5 MPa. With $\nu > 0$ the trick would fail, because compressing would fatten the rod. (Lesson 4 finishes the problem: the stress left in the rod once it is in the hole and released. Govindjee Exercise 5.11 is this archetype.)`,
      tags: ["poisson", "uniaxial"],
    }),
    reading(
      "energy",
      r`A stressed bar stores energy $w = \tfrac12\sigma\varepsilon$ per unit volume (Govindjee §2.5). In 3-D every **matching stress–strain pair** contributes its own term (eqn 5.17, no heating):

$$w = \tfrac12\left(\sigma_{xx}\varepsilon_{xx} + \sigma_{yy}\varepsilon_{yy} + \sigma_{zz}\varepsilon_{zz} + \tau_{xy}\gamma_{xy} + \tau_{yz}\gamma_{yz} + \tau_{zx}\gamma_{zx}\right).$$

The shear terms use the **engineering** strains $\gamma$. Two special cases worth writing down instantly:

- uniaxial stress: $w = \tfrac12\sigma\varepsilon = \dfrac{\sigma^2}{2E}$ (the Poisson strains have no partner stress, so they add nothing);
- pure shear: $w = \tfrac12\tau\gamma = \dfrac{\tau^2}{2G}$.

Units: $1\,\mathrm{MPa} = 1\,\mathrm{N/mm^2} = 1\,\mathrm{N\cdot mm/mm^3} = 1\,\mathrm{MJ/m^3}$. Multiply $w$ by the volume to get the total stored energy.`,
      { title: "Strain energy in 3-D" },
    ),
    numeric("w-uniaxial", {
      question: r`A steel rod ($E = 200\,\mathrm{GPa}$) carries a uniaxial stress $\sigma = 100\,\mathrm{MPa}$. What is the strain-energy density $w$, in $\mathrm{N\cdot mm/mm^3}$ (the same as $\mathrm{MJ/m^3}$)?`,
      answer: 0.025, // check: σ²/(2E) = 100²/(2·200 000) = 10 000/400 000 = 0.025 N·mm/mm³
      tolerance: 0.0003,
      prefix: r`$w =$`,
      answerDisplay: r`0.025\,\mathrm{N\cdot mm/mm^3}`,
      hint: "Only one stress is nonzero, so only one term of the 3-D sum survives. Which strain goes with it?",
      explanation: r`$w = \tfrac12\sigma_{xx}\varepsilon_{xx} = \dfrac{\sigma^2}{2E} = \dfrac{100^2}{2(200\,000)} = 0.025\,\mathrm{N\cdot mm/mm^3} = 25\,\mathrm{kJ/m^3}$. The lateral Poisson strains contribute nothing because their partner stresses are zero.`,
      tags: ["strain-energy"],
    }),
    numeric("w-shear", {
      question: r`The surface of a steel shaft ($G = 80\,\mathrm{GPa}$) is in pure shear with $\tau_{xy} = 50\,\mathrm{MPa}$. What is $w$, in $\mathrm{N\cdot mm/mm^3}$, to three significant figures?`,
      answer: 0.015625, // check: γ = 50/80 000 = 625e-6; w = ½·50·625e-6 = τ²/(2G) = 2500/160 000 = 0.015625
      tolerance: 0.0002,
      prefix: r`$w =$`,
      answerDisplay: r`0.0156\,\mathrm{N\cdot mm/mm^3}`,
      hint: r`Find $\gamma_{xy} = \tau_{xy}/G$ first, then use the matching pair in the energy sum.`,
      explanation: r`$\gamma_{xy} = 50/80\,000 = 625\times10^{-6}$, so $w = \tfrac12\tau_{xy}\gamma_{xy} = \tfrac12(50)(625\times10^{-6}) = 0.0156\,\mathrm{N\cdot mm/mm^3}$, which is $\tau^2/2G = 2500/160\,000$. Putting the tensor strain $\varepsilon_{xy}$ into this six-term formula would give half the right answer.`,
      tags: ["strain-energy"],
    }),
    reading(
      "inverse",
      r`Exam problems often give strains and ask for stresses (Govindjee Exercise 5.3 type). Inverting three coupled equations by brute force is slow; use the pressure instead:

1. If you are given $E$ and $G$, first get $\nu = E/(2G) - 1$.
2. Add the normal strains to get $\theta$; then $\sigma_{xx} + \sigma_{yy} + \sigma_{zz} = 3p = 3K\theta = E\theta/(1 - 2\nu)$.
3. Rewrite $E\varepsilon_{xx} = (1 + \nu)\sigma_{xx} - \nu(\sigma_{xx} + \sigma_{yy} + \sigma_{zz})$ and solve: $\sigma_{xx} = (E\varepsilon_{xx} + 3\nu p)/(1 + \nu)$, and the same for $yy$ and $zz$.
4. Shear is uncoupled: $\tau_{xy} = G\gamma_{xy} = 2G\varepsilon_{xy}$.

$$\sigma_{xx} = \frac{E\,\varepsilon_{xx} + 3\nu p}{1 + \nu}, \qquad p = K\theta, \qquad \tau_{xy} = G\gamma_{xy}$$

Check it on Lesson 1: $E = 200\,\mathrm{GPa}$, $\nu = 0.3$, $\varepsilon = \mathrm{diag}(1000, -300, -300)\times10^{-6}$. Then $\theta = 400\times10^{-6}$, $3p = 200\,000 \times 400\times10^{-6}/0.4 = 200\,\mathrm{MPa}$, so $\sigma_{xx} = (200 + 0.3 \times 200)/1.3 = 200\,\mathrm{MPa}$ and $\sigma_{yy} = (-60 + 60)/1.3 = 0$: the uniaxial state found there.`,
      { title: "Running the law backwards" },
    ),
    matrix("inverse-general", {
      body: r`A material is specified by $E = 100\,\mathrm{GPa}$ and $G = 40\,\mathrm{GPa}$. At a point the strain matrix (tensor components, no heating) is

$$\boldsymbol{\varepsilon} = \begin{bmatrix} 500 & 150 & 0 \\ 150 & 200 & -50 \\ 0 & -50 & -100 \end{bmatrix}\times10^{-6}.$$`,
      question: "Find the stress matrix, in MPa.",
      answer: [
        [64, 12, 0],
        [12, 40, -4],
        [0, -4, 16],
      ], // check: ν = 100/80 − 1 = 0.25; θ = 600e-6; 3p = 100 000·600e-6/0.5 = 120 → p = 40, 3νp = 30; σxx = (50 + 30)/1.25 = 64, σyy = (20 + 30)/1.25 = 40, σzz = (−10 + 30)/1.25 = 16; τxy = 40 000·(2·150e-6) = 12; τyz = 40 000·(2·(−50e-6)) = −4; τzx = 0
      tolerance: 0.5,
      prefix: r`$\boldsymbol{\sigma} =$`,
      hint: r`Follow the recipe: $\nu$ from $E$ and $G$, then $\theta$ and $p$, then each normal stress. For the shear entries remember the matrix holds $\tfrac12\gamma$.`,
      explanation: r`1. $\nu = 100/80 - 1 = 0.25$, so $K = 100\,000/(3 \times 0.5) = 66\,667\,\mathrm{MPa}$.
2. $\theta = 500 + 200 - 100 = 600\times10^{-6}$, so $p = K\theta = 40\,\mathrm{MPa}$ and $3\nu p = 30\,\mathrm{MPa}$.
3. $\sigma_{xx} = (100\,000 \times 500\times10^{-6} + 30)/1.25 = (50 + 30)/1.25 = 64$, $\sigma_{yy} = (20 + 30)/1.25 = 40$, $\sigma_{zz} = (-10 + 30)/1.25 = 16\,\mathrm{MPa}$. Check: $(64 + 40 + 16)/3 = 40 = p$ ✓.
4. $\tau_{xy} = G\gamma_{xy} = 40\,000 \times 300\times10^{-6} = 12\,\mathrm{MPa}$, $\tau_{yz} = 40\,000 \times (-100\times10^{-6}) = -4\,\mathrm{MPa}$, $\tau_{zx} = 0$.

If you got 6 and −2 off the diagonal, you used $G\varepsilon_{xy}$ instead of $G\gamma_{xy} = 2G\varepsilon_{xy}$.`,
      tags: ["inverse-hooke", "strain-matrix"],
    }),
    reading(
      "summary",
      r`**What you did:** computed pressures and volume changes, saw why $\nu \to \tfrac12$ means incompressible, confined and heated a block, used a negative Poisson's ratio, stored energy in matching stress–strain pairs, and inverted Hooke's law with the pressure trick.

$$p = \tfrac13(\sigma_{xx} + \sigma_{yy} + \sigma_{zz}) \ (\text{tension positive}), \qquad \theta = \varepsilon_{xx} + \varepsilon_{yy} + \varepsilon_{zz} = \frac{p}{K} + 3\alpha\Delta T, \qquad K = \frac{E}{3(1 - 2\nu)}$$

$$w = \tfrac12\left(\sigma_{xx}\varepsilon_{xx} + \sigma_{yy}\varepsilon_{yy} + \sigma_{zz}\varepsilon_{zz} + \tau_{xy}\gamma_{xy} + \tau_{yz}\gamma_{yz} + \tau_{zx}\gamma_{zx}\right)$$

- Fully confined and heated: $\sigma = -E\alpha\Delta T/(1 - 2\nu)$ in every direction.
- Inverse: $\sigma_{xx} = (E\varepsilon_{xx} + 3\nu p)/(1 + \nu)$ with $p = K\theta$, and $\tau = G\gamma$.
- Negative $\nu$: compress the rod to make it thinner.

Next: the two ways of turning the 3-D law into a 2-D one, plane stress and plane strain.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Plane stress and plane strain (Govindjee §5.2)            */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "sm4-l3-plane-stress-and-plane-strain",
    unitId: "sm4",
    title: "Plane stress and plane strain",
    summary: "The two ways to make the 3-D law two-dimensional, their inverses, and the out-of-plane strain or stress you compute afterwards.",
    textbook: "Govindjee §5.2",
    minutes: 15,
  },
  [
    reading(
      "plane-stress",
      r`Most problems are easier in 2-D. **Plane stress** assumes

$$\sigma_{zz} = \tau_{yz} = \tau_{zx} = 0,$$

which is accurate for **thin plates loaded in their own plane** and near a **free surface** whose normal is $z$ (Govindjee §5.2.1). Put these zeros into the 3-D law:

$$\varepsilon_{xx} = \frac{\sigma_{xx}}{E} - \frac{\nu\,\sigma_{yy}}{E} + \alpha\Delta T, \qquad \varepsilon_{yy} = \frac{\sigma_{yy}}{E} - \frac{\nu\,\sigma_{xx}}{E} + \alpha\Delta T$$

$$\gamma_{xy} = \frac{\tau_{xy}}{G}$$

These three in-plane equations are the ones a 2-D problem needs. The out-of-plane strain is computed **afterwards**, and it is *not* zero:

$$\varepsilon_{zz} = -\frac{\nu}{E}(\sigma_{xx} + \sigma_{yy}) + \alpha\Delta T.$$

Solving the in-plane pair for the stresses (no heating) gives the **inverse** form (Exercise 5.13):

$$\sigma_{xx} = \frac{E}{1 - \nu^2}(\varepsilon_{xx} + \nu\,\varepsilon_{yy}), \qquad \sigma_{yy} = \frac{E}{1 - \nu^2}(\varepsilon_{yy} + \nu\,\varepsilon_{xx}), \qquad \tau_{xy} = G\gamma_{xy}.$$`,
      {
        title: "Plane stress: thin and free in z",
        visual: { kind: "stress-element", config: { sxx: 120, syy: 40, sxy: 0, sliders: true, max: 150, unit: "MPa" } },
      },
    ),
    numeric("ps-exx", {
      body: r`A thin steel plate ($E = 200\,\mathrm{GPa}$, $\nu = 0.3$, plane stress, no heating) carries $\sigma_{xx} = 120\,\mathrm{MPa}$ and $\sigma_{yy} = 40\,\mathrm{MPa}$, no shear.`,
      question: r`Find $\varepsilon_{xx}$ in micro-strain.`,
      answer: 540, // check: (120 − 0.3·40)/200 000 = 108/200 000 = 540e-6
      tolerance: 5,
      prefix: r`$\varepsilon_{xx} =$`,
      suffix: "μ",
      hint: r`In plane stress only $\sigma_{yy}$ causes Poisson contraction in $x$, because $\sigma_{zz} = 0$.`,
      explanation: r`$\varepsilon_{xx} = (120 - 0.3 \times 40)/200\,000 = 108/200\,000 = 540\times10^{-6}$. (Also $\varepsilon_{yy} = (40 - 0.3 \times 120)/200\,000 = 4/200\,000 = 20\times10^{-6}$: the Poisson effect of the large $\sigma_{xx}$ almost cancels the direct stretch in $y$.)`,
      tags: ["plane-stress"],
    }),
    numeric("ps-ezz", {
      body: "Same plate, same stresses.",
      question: r`How much does the plate thin? Find $\varepsilon_{zz}$ in micro-strain, using the sign convention.`,
      answer: -240, // check: −ν(σxx + σyy)/E = −0.3·160/200 000 = −48/200 000 = −240e-6
      tolerance: 3,
      prefix: r`$\varepsilon_{zz} =$`,
      suffix: "μ",
      hint: r`$\sigma_{zz} = 0$, but the in-plane stresses still squeeze the thickness through Poisson's ratio.`,
      explanation: r`$\varepsilon_{zz} = -\nu(\sigma_{xx} + \sigma_{yy})/E = -0.3 \times 160/200\,000 = -240\times10^{-6}$. A 10 mm plate gets $240\times10^{-6} \times 10\,\mathrm{mm} = 0.0024\,\mathrm{mm}$ thinner.`,
      tags: ["plane-stress"],
    }),
    tf("ps-ezz-zero", {
      statement: r`In plane stress the out-of-plane strain $\varepsilon_{zz}$ is zero.`,
      answer: false,
      feedback: r`Plane stress sets $\sigma_{zz} = 0$, not $\varepsilon_{zz}$. The thickness changes through the Poisson effect.`,
      hint: "Which quantity does the assumption set to zero: the stress or the strain?",
      explanation: r`False. Plane stress sets the **stresses** $\sigma_{zz}$, $\tau_{yz}$, $\tau_{zx}$ to zero. The plate is free to change thickness, so $\varepsilon_{zz} = -\nu(\sigma_{xx} + \sigma_{yy})/E + \alpha\Delta T \ne 0$ in general. It is the out-of-plane *shear* strains $\gamma_{yz}$, $\gamma_{zx}$ that vanish, because their stresses do.`,
      tags: ["plane-stress"],
    }),
    numeric("ps-inverse", {
      body: r`Strain gauges on a thin aluminium panel ($E = 70\,\mathrm{GPa}$, $\nu = 0.33$, plane stress) read $\varepsilon_{xx} = 800\times10^{-6}$ and $\varepsilon_{yy} = -200\times10^{-6}$.`,
      question: r`What is $\sigma_{xx}$, in MPa, to three significant figures?`,
      answer: 57.66, // check: 70 000·(800e-6 + 0.33·(−200e-6))/(1 − 0.1089) = 70 000·734e-6/0.8911 = 51.38/0.8911 = 57.659 MPa
      tolerance: 0.6,
      prefix: r`$\sigma_{xx} =$`,
      suffix: "MPa",
      answerDisplay: r`57.7\,\mathrm{MPa}`,
      hint: r`Use the inverse plane-stress form, and don't forget to divide by $1 - \nu^2$.`,
      explanation: r`$$\sigma_{xx} = \frac{E(\varepsilon_{xx} + \nu\varepsilon_{yy})}{1 - \nu^2} = \frac{70\,000\,(800 - 66)\times10^{-6}}{1 - 0.1089} = \frac{51.38}{0.8911} = 57.7\,\mathrm{MPa}.$$

The naive $E\varepsilon_{xx} = 56\,\mathrm{MPa}$ assumes uniaxial stress, which would make the $y$ gauge read $-\nu\varepsilon_{xx} = -264\times10^{-6}$. It reads less contraction than that, so the panel also carries a tensile $\sigma_{yy} = 70\,000\,(-200 + 264)\times10^{-6}/0.8911 = 5.0\,\mathrm{MPa}$, and its Poisson effect is what the $1/(1 - \nu^2)$ formula accounts for.`,
      tags: ["plane-stress", "inverse-hooke"],
    }),
    matrix("ps-thermal", {
      body: r`A thin steel plate ($E = 200\,\mathrm{GPa}$, $\nu = 0.3$, so $G = E/(2(1+\nu)) = 76.9\,\mathrm{GPa}$; $\alpha = 12\times10^{-6}/^{\circ}\mathrm{C}$) carries the plane-stress state $\sigma_{xx} = 60\,\mathrm{MPa}$, $\sigma_{yy} = -40\,\mathrm{MPa}$, $\tau_{xy} = 30\,\mathrm{MPa}$ and is heated by $\Delta T = 20^{\circ}\mathrm{C}$.`,
      question: r`Find the full $3\times3$ strain matrix in micro-strain (tensor components off the diagonal).`,
      answer: [
        [600, 195, 0],
        [195, -50, 0],
        [0, 0, 210],
      ], // check: αΔT = 240e-6; εxx = (60 + 0.3·40)/200 000 + 240e-6 = 300 + 60 + 240 = 600e-6; εyy = (−40 − 0.3·60)/200 000 + 240e-6 = −200 − 90 + 240 = −50e-6; εzz = −0.3·(60 − 40)/200 000 + 240e-6 = −30 + 240 = 210e-6; γxy = 30·2.6/200 000 = 390e-6 → εxy = 195e-6
      tolerance: 2,
      prefix: r`$\boldsymbol{\varepsilon}\times10^{6} =$`,
      hint: r`Compute $\alpha\Delta T$ once and add it to each of the three normal strains, $\varepsilon_{zz}$ included, but never to the shear entries.`,
      explanation: r`$\alpha\Delta T = 12\times10^{-6} \times 20 = 240\times10^{-6}$. Then:

- $\varepsilon_{xx} = \dfrac{60 - 0.3(-40)}{200\,000} + 240\times10^{-6} = (300 + 60 + 240)\times10^{-6} = 600\times10^{-6}$
- $\varepsilon_{yy} = \dfrac{-40 - 0.3(60)}{200\,000} + 240\times10^{-6} = (-200 - 90 + 240)\times10^{-6} = -50\times10^{-6}$
- $\varepsilon_{zz} = \dfrac{-0.3(60 - 40)}{200\,000} + 240\times10^{-6} = (-30 + 240)\times10^{-6} = 210\times10^{-6}$
- $\gamma_{xy} = 30/76\,923 = 390\times10^{-6}$, so $\varepsilon_{xy} = 195\times10^{-6}$; $\varepsilon_{yz} = \varepsilon_{zx} = 0$

The plate gets *thicker* ($\varepsilon_{zz} > 0$) because the heating beats the Poisson thinning. This is the Govindjee Exercise 5.4 archetype.`,
      visual: { kind: "stress-element", config: { sxx: 60, syy: -40, sxy: 30, max: 100, unit: "MPa" } },
      tags: ["plane-stress", "thermal", "strain-matrix"],
    }),
    reading(
      "plane-strain",
      r`**Plane strain** assumes instead

$$\varepsilon_{zz} = \gamma_{yz} = \gamma_{zx} = 0,$$

which amounts to no $z$-displacement ($w = 0$) and nothing varying with $z$. It fits bodies that are **long in $z$ and restrained** there: dams, tunnels, retaining walls, long buried pipes (Govindjee §5.2.2). Setting $\varepsilon_{zz} = 0$ in the third 3-D equation gives the **constraint stress**

$$\sigma_{zz} = \nu(\sigma_{xx} + \sigma_{yy}) - E\alpha\Delta T,$$

and substituting it back into the other two:

$$\varepsilon_{xx} = \frac{1 - \nu^2}{E}\sigma_{xx} - \frac{\nu(1 + \nu)}{E}\sigma_{yy} + (1 + \nu)\alpha\Delta T$$

$$\varepsilon_{yy} = \frac{1 - \nu^2}{E}\sigma_{yy} - \frac{\nu(1 + \nu)}{E}\sigma_{xx} + (1 + \nu)\alpha\Delta T, \qquad \gamma_{xy} = \frac{\tau_{xy}}{G}$$

Again three in-plane equations close the 2-D problem, and $\sigma_{zz}$ is computed afterwards.

> **Which one?** Thin and free in $z$: plane stress ($\sigma_{zz} = 0$, $\varepsilon_{zz} \ne 0$). Long and held in $z$: plane strain ($\varepsilon_{zz} = 0$, $\sigma_{zz} \ne 0$).`,
      { title: "Plane strain: long and held in z" },
    ),
    numeric("pe-szz", {
      body: r`A long prismatic body is held between rigid end walls so that $w = 0$ everywhere (plane strain, $\nu = 0.3$, no heating). At a point $\sigma_{xx} = 100\,\mathrm{MPa}$ and $\sigma_{yy} = 50\,\mathrm{MPa}$.`,
      question: r`What is the constraint stress $\sigma_{zz}$, in MPa?`,
      answer: 45, // check: σzz = ν(σxx + σyy) = 0.3·150 = 45 MPa
      tolerance: 0.5,
      prefix: r`$\sigma_{zz} =$`,
      suffix: "MPa",
      hint: r`Set $\varepsilon_{zz} = 0$ in the 3-D equation for $\varepsilon_{zz}$ and solve it for $\sigma_{zz}$.`,
      explanation: r`$0 = \sigma_{zz}/E - \nu(\sigma_{xx} + \sigma_{yy})/E$, so $\sigma_{zz} = \nu(\sigma_{xx} + \sigma_{yy}) = 0.3 \times 150 = 45\,\mathrm{MPa}$ (tension). The walls have to pull on the ends to stop the Poisson contraction in $z$.`,
      tags: ["plane-strain"],
    }),
    tf("pe-szz-zero", {
      statement: r`In plane strain $\sigma_{zz}$ is zero, because nothing is loaded in the $z$-direction.`,
      answer: false,
      feedback: r`Plane strain sets $\varepsilon_{zz} = 0$. Holding the length fixed against the Poisson effect takes a stress $\sigma_{zz} = \nu(\sigma_{xx} + \sigma_{yy}) - E\alpha\Delta T$.`,
      hint: "Plane strain constrains a strain. What does enforcing that constraint cost?",
      explanation: r`False. Plane strain sets $\varepsilon_{zz} = 0$, and holding the length fixed generally needs a **constraint stress** $\sigma_{zz} = \nu(\sigma_{xx} + \sigma_{yy}) - E\alpha\Delta T$, supplied by the supports or by the neighbouring material. It vanishes only in special cases, such as $\sigma_{xx} + \sigma_{yy} = 0$ with no heating.`,
      tags: ["plane-strain"],
    }),
    numeric("pe-exx", {
      body: r`Same body and stresses ($\sigma_{xx} = 100\,\mathrm{MPa}$, $\sigma_{yy} = 50\,\mathrm{MPa}$, plane strain), now with $E = 200\,\mathrm{GPa}$ and $\nu = 0.3$.`,
      question: r`Find $\varepsilon_{xx}$ in micro-strain, to three significant figures.`,
      answer: 357.5, // check: ((1 − 0.09)·100 − 0.3·1.3·50)/200 000 = (91 − 19.5)/200 000 = 71.5/200 000 = 357.5e-6
      tolerance: 4,
      prefix: r`$\varepsilon_{xx} =$`,
      suffix: "μ",
      answerDisplay: r`357.5\times10^{-6}`,
      hint: r`Either use the plane-strain formula with $(1 - \nu^2)$ and $\nu(1 + \nu)$, or use the 3-D law with the $\sigma_{zz}$ you just found. They must agree.`,
      explanation: r`$$\varepsilon_{xx} = \frac{(1 - 0.09)(100) - 0.3(1.3)(50)}{200\,000} = \frac{91 - 19.5}{200\,000} = 357.5\times10^{-6}.$$

Check with the 3-D law and $\sigma_{zz} = 45\,\mathrm{MPa}$: $[100 - 0.3(50 + 45)]/200\,000 = 71.5/200\,000$ ✓. In plane stress the same stresses would give $(100 - 15)/200\,000 = 425\times10^{-6}$: the $z$-constraint makes the body stiffer.`,
      tags: ["plane-strain"],
    }),
    mc("pe-inverse", {
      question: r`For plane strain with no heating, which expression gives $\sigma_{xx}$ in terms of the in-plane strains?`,
      choices: [
        ["a", r`$\sigma_{xx} = \dfrac{E}{(1 + \nu)(1 - 2\nu)}\left[(1 - \nu)\varepsilon_{xx} + \nu\varepsilon_{yy}\right]$`],
        ["b", r`$\sigma_{xx} = \dfrac{E}{1 - \nu^2}\left(\varepsilon_{xx} + \nu\varepsilon_{yy}\right)$`, r`That is the plane-**stress** inverse ($\sigma_{zz} = 0$). In plane strain the extra $\sigma_{zz}$ pushes back and stiffens the response.`],
        ["c", r`$\sigma_{xx} = E\,\varepsilon_{xx}$`, r`That ignores both the Poisson coupling to $\varepsilon_{yy}$ and the $z$-constraint.`],
        ["d", r`$\sigma_{xx} = \dfrac{E}{(1 + \nu)(1 - 2\nu)}\left[\nu\varepsilon_{xx} + (1 - \nu)\varepsilon_{yy}\right]$`, r`That is $\sigma_{yy}$: the factor $(1 - \nu)$ belongs to the strain in the same direction as the stress.`],
      ],
      correct: "a",
      shuffle: true,
      hint: r`Write the two plane-strain equations without heating, multiply both by $E/(1 + \nu)$, and solve the $2\times2$ system for $\sigma_{xx}$.`,
      explanation: r`Without heating the plane-strain pair is $E\varepsilon_{xx}/(1 + \nu) = (1 - \nu)\sigma_{xx} - \nu\sigma_{yy}$ and $E\varepsilon_{yy}/(1 + \nu) = (1 - \nu)\sigma_{yy} - \nu\sigma_{xx}$. The determinant is $(1 - \nu)^2 - \nu^2 = 1 - 2\nu$, so

$$\sigma_{xx} = \frac{E}{(1 + \nu)(1 - 2\nu)}\left[(1 - \nu)\varepsilon_{xx} + \nu\varepsilon_{yy}\right],$$

likewise for $\sigma_{yy}$; then $\sigma_{zz} = \nu(\sigma_{xx} + \sigma_{yy})$ and $\tau_{xy} = G\gamma_{xy}$ (Govindjee Exercise 5.12). The $1 - 2\nu$ in the denominator blows up as $\nu \to \tfrac12$: a confined, incompressible material is infinitely stiff.`,
      tags: ["plane-strain", "inverse-hooke"],
    }),
    numeric("stretch-ps", {
      body: r`A block of thermoplastic ($E = 3\,\mathrm{GPa}$, $\nu = 0.35$) is pulled homogeneously in $x$ until its length has grown by 1 % ($\varepsilon_{xx} = 0.01$). Its $y$-faces stay traction-free ($\sigma_{yy} = 0$).`,
      question: r`If the block is a thin sheet (plane stress), what $\sigma_{xx}$ is needed, in MPa?`,
      answer: 30, // check: σyy = σzz = 0 → uniaxial: σxx = Eεxx = 3000·0.01 = 30 MPa
      tolerance: 0.3,
      prefix: r`$\sigma_{xx} =$`,
      suffix: "MPa",
      hint: r`With $\sigma_{yy} = 0$ and $\sigma_{zz} = 0$, which single term is left in the $\varepsilon_{xx}$ equation?`,
      explanation: r`Plane stress with $\sigma_{yy} = 0$ is just uniaxial stress: $\sigma_{xx} = E\varepsilon_{xx} = 3000 \times 0.01 = 30\,\mathrm{MPa}$.`,
      tags: ["plane-stress"],
    }),
    numeric("stretch-pe", {
      body: r`Now the same material is a thick slab held so that $\varepsilon_{zz} = 0$ (plane strain), still with $\sigma_{yy} = 0$, stretched to the same $\varepsilon_{xx} = 0.01$.`,
      question: r`What $\sigma_{xx}$ is needed now, in MPa, to three significant figures?`,
      answer: 34.19, // check: εxx = (1 − ν²)σxx/E → σxx = 3000·0.01/(1 − 0.1225) = 30/0.8775 = 34.188 MPa
      tolerance: 0.35,
      prefix: r`$\sigma_{xx} =$`,
      suffix: "MPa",
      answerDisplay: r`34.2\,\mathrm{MPa}`,
      hint: r`Use the plane-strain $\varepsilon_{xx}$ equation with $\sigma_{yy} = 0$. Which factor multiplies $\sigma_{xx}$?`,
      explanation: r`$\varepsilon_{xx} = (1 - \nu^2)\sigma_{xx}/E$, so $\sigma_{xx} = \dfrac{E\varepsilon_{xx}}{1 - \nu^2} = \dfrac{30}{1 - 0.1225} = \dfrac{30}{0.8775} = 34.2\,\mathrm{MPa}$, about 14 % more than in plane stress. The extra stress is needed because the constraint stress $\sigma_{zz} = \nu\sigma_{xx} = 12.0\,\mathrm{MPa}$ resists the Poisson thinning in $z$ (Govindjee Exercise 5.5 archetype).`,
      tags: ["plane-strain", "plane-stress"],
    }),
    mc("which-assumption", {
      question: "A long concrete gravity dam, and a thin aluminium aircraft skin panel loaded in its own plane. Which 2-D assumptions fit?",
      choices: [
        ["right", "Dam: plane strain. Skin: plane stress."],
        ["swap", "Dam: plane stress. Skin: plane strain.", r`Reversed. The skin is free to change thickness ($\sigma_{zz} = 0$); a slice of the dam is held by its neighbours ($\varepsilon_{zz} = 0$).`],
        ["both-ps", "Both plane stress.", "A slice of a long dam cannot lengthen or shorten along the dam: the neighbouring slices hold it. That is a constraint on strain."],
        ["both-pe", "Both plane strain.", r`Nothing stops the thin skin from thinning: its faces are traction-free, so $\sigma_{zz} = 0$ through the small thickness.`],
      ],
      correct: "right",
      shuffle: true,
      hint: "For each body ask: is the z-direction thin and free (so the stress is zero) or long and held (so the strain is zero)?",
      explanation: r`The skin is thin with traction-free faces, so $\sigma_{zz} = \tau_{zx} = \tau_{zy} \approx 0$ through its thickness: **plane stress**. A slice of a long dam is held by the slices on either side, so $w \approx 0$ and nothing varies along the dam: **plane strain**, with a constraint stress $\sigma_{zz}$ along the dam's length.`,
      tags: ["plane-stress", "plane-strain"],
    }),
    mc("which-three", {
      question: r`A 2-D problem (plane stress *or* plane strain) has 9 unknowns (3 strains, 2 displacements, 4 stresses) but only 6 equations from equilibrium and kinematics. Which constitutive equations close it?`,
      choices: [
        ["inplane", r`The three in-plane ones: the $\varepsilon_{xx}$ and $\varepsilon_{yy}$ equations and $\gamma_{xy} = \tau_{xy}/G$.`],
        ["zonly", r`The $\varepsilon_{zz}$ (or $\sigma_{zz}$) equation alone.`, "That one is extra: it is evaluated after the 2-D problem has been solved."],
        ["all6", "All six 3-D equations.", "Only three are needed for the in-plane unknowns; the rest either vanish or are evaluated afterwards."],
        ["normals", r`The $\varepsilon_{xx}$, $\varepsilon_{yy}$ and $\varepsilon_{zz}$ equations.`, r`The shear unknown needs $\gamma_{xy} = \tau_{xy}/G$, and the $z$ equation is post-processing.`],
      ],
      correct: "inplane",
      shuffle: true,
      hint: "How many equations are missing, and which unknowns are the 2-D ones?",
      explanation: r`$9 - 6 = 3$ equations are missing, and they must relate the in-plane strains $(\varepsilon_{xx}, \varepsilon_{yy}, \gamma_{xy})$ to the in-plane stresses: eqns (5.18), (5.19), (5.21) for plane stress or (5.24), (5.25), (5.27) for plane strain. The $z$ equation gives $\varepsilon_{zz}$ (plane stress) or $\sigma_{zz}$ (plane strain) **after** the 2-D solution.`,
      tags: ["plane-stress", "plane-strain"],
    }),
    reading(
      "summary",
      r`**What you did:** reduced the 3-D law to 2-D in two ways, computed in-plane strains, inverted them, and found the leftover out-of-plane quantity afterwards.

- **Plane stress** ($\sigma_{zz} = \tau_{yz} = \tau_{zx} = 0$; thin, free faces): $\varepsilon_{xx} = (\sigma_{xx} - \nu\sigma_{yy})/E + \alpha\Delta T$, and afterwards $\varepsilon_{zz} = -\nu(\sigma_{xx} + \sigma_{yy})/E + \alpha\Delta T$.
- Plane-stress inverse: $\sigma_{xx} = E(\varepsilon_{xx} + \nu\varepsilon_{yy})/(1 - \nu^2)$.
- **Plane strain** ($\varepsilon_{zz} = \gamma_{yz} = \gamma_{zx} = 0$; long, held): $\varepsilon_{xx} = [(1 - \nu^2)\sigma_{xx} - \nu(1 + \nu)\sigma_{yy}]/E + (1 + \nu)\alpha\Delta T$, and afterwards $\sigma_{zz} = \nu(\sigma_{xx} + \sigma_{yy}) - E\alpha\Delta T$.
- Plane-strain inverse: $\sigma_{xx} = E[(1 - \nu)\varepsilon_{xx} + \nu\varepsilon_{yy}]/((1 + \nu)(1 - 2\nu))$.
- Shear in both: $\gamma_{xy} = \tau_{xy}/G$.

Next: the one-dimensional reduction you have used since Chapter 2, uniaxial stress, and the same law in polar coordinates.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Uniaxial stress and other coordinates (Govindjee §5.3–5.4) */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "sm4-l4-uniaxial-and-other-coordinates",
    unitId: "sm4",
    title: "Uniaxial stress and other coordinates",
    summary: "Transverse strains, diameter and volume changes of rods, and Hooke's law in cylindrical coordinates: a twisted rod and a foam rod jammed in a hole.",
    textbook: "Govindjee §5.3–5.4",
    minutes: 12,
  },
  [
    reading(
      "uniaxial",
      r`The third common reduction keeps **only** $\sigma_{xx}$ (Govindjee §5.3). It suits slender bodies under axial load, and the fibres of a bent beam. The 3-D law becomes

$$\varepsilon_{xx} = \frac{\sigma_{xx}}{E} + \alpha\Delta T, \qquad \varepsilon_{yy} = \varepsilon_{zz} = -\frac{\nu\,\sigma_{xx}}{E} + \alpha\Delta T, \qquad \gamma_{xy} = \gamma_{yz} = \gamma_{zx} = 0.$$

The first equation is exactly the rod law of Chapter 2. The other two are new information: once a 1-D analysis is done, they give the **transverse (Poisson) strains**, i.e. how much the bar's width or diameter changes, $\Delta d = \varepsilon_{yy}\,d$.

The grid shows a uniaxially stretched element with $\nu = 0.3$, hugely exaggerated: 10 % longer and 3 % narrower.`,
      {
        title: "Uniaxial stress",
        visual: { kind: "strain-grid", config: { grad: [[0.1, 0], [0, -0.03]], sliders: true } },
      },
    ),
    mc("nonzero-uniaxial", {
      question: "In a state of uniaxial stress along x (no heating), which components are nonzero?",
      choices: [
        ["right", r`Stress: only $\sigma_{xx}$. Strain: $\varepsilon_{xx}$, $\varepsilon_{yy}$ and $\varepsilon_{zz}$.`],
        ["one-strain", r`Stress: only $\sigma_{xx}$. Strain: only $\varepsilon_{xx}$.`, r`The Poisson effect makes the transverse strains $\varepsilon_{yy} = \varepsilon_{zz} = -\nu\sigma_{xx}/E$ nonzero.`],
        ["reversed", r`Stress: $\sigma_{xx}$, $\sigma_{yy}$ and $\sigma_{zz}$. Strain: only $\varepsilon_{xx}$.`, "Reversed: uniaxial means one stress, and it produces three normal strains."],
        ["shear", r`Stress: $\sigma_{xx}$ and $\tau_{xy}$. Strain: $\varepsilon_{xx}$ and $\gamma_{xy}$.`, "There is no shear stress, so there is no shear strain."],
      ],
      correct: "right",
      shuffle: true,
      hint: "'Uniaxial' describes the stress. Then use the 3-D law to see which strains that one stress produces.",
      explanation: r`Uniaxial **stress**: $\sigma_{xx} \ne 0$ and every other stress component is zero. The strain is still three-dimensional: $\varepsilon_{xx} = \sigma_{xx}/E$ and $\varepsilon_{yy} = \varepsilon_{zz} = -\nu\sigma_{xx}/E$, with no shear strains. Uniaxial stress and uniaxial strain are different states.`,
      tags: ["uniaxial"],
    }),
    tf("transverse-zero", {
      statement: r`In a rod under uniaxial stress the transverse strains $\varepsilon_{yy}$ and $\varepsilon_{zz}$ are zero, since there is no stress in those directions.`,
      answer: false,
      feedback: "No stress in y does not mean no strain in y: the Poisson effect of σxx contracts the rod sideways.",
      hint: r`Write the $\varepsilon_{yy}$ equation with $\sigma_{yy} = \sigma_{zz} = 0$. What is left?`,
      explanation: r`False. With $\sigma_{yy} = \sigma_{zz} = 0$ we still have $\varepsilon_{yy} = -\nu\sigma_{xx}/E \ne 0$. Zero stress in a direction means the material is *free* to strain in that direction, not that it doesn't.`,
      tags: ["uniaxial", "poisson"],
    }),
    numeric("lateral-steel", {
      question: r`A steel rod ($E = 200\,\mathrm{GPa}$, $\nu = 0.3$) carries $\sigma_{xx} = 150\,\mathrm{MPa}$. What is its lateral strain $\varepsilon_{yy}$, in micro-strain? Use the sign convention.`,
      answer: -225, // check: −νσ/E = −0.3·150/200 000 = −45/200 000 = −225e-6
      tolerance: 2.5,
      prefix: r`$\varepsilon_{yy} =$`,
      suffix: "μ",
      hint: r`Only one term of the $\varepsilon_{yy}$ equation survives in uniaxial stress.`,
      explanation: r`$\varepsilon_{yy} = -\nu\sigma_{xx}/E = -0.3 \times 150/200\,000 = -225\times10^{-6}$. The axial strain is $750\times10^{-6}$, and the lateral strain is $-0.3$ times it.`,
      tags: ["uniaxial", "poisson"],
    }),
    numeric("diameter-change", {
      body: r`The rod's diameter is $30\,\mathrm{mm}$.`,
      question: r`By how much does the diameter change, in micrometres (μm)? Use the sign convention.`,
      answer: -6.75, // check: Δd = εyy·d = −225e-6 · 30 mm = −0.00675 mm = −6.75 μm
      tolerance: 0.07,
      prefix: r`$\Delta d =$`,
      suffix: "μm",
      answerDisplay: r`-6.75\,\mu\mathrm{m}`,
      hint: "The lateral strain is the relative change of every transverse length, the diameter included. Watch the mm to μm conversion.",
      explanation: r`$\Delta d = \varepsilon_{yy}\,d = -225\times10^{-6} \times 30\,\mathrm{mm} = -0.00675\,\mathrm{mm} = -6.75\,\mu\mathrm{m}$. Tiny, but easily measured with a micrometer.`,
      tags: ["uniaxial", "poisson"],
    }),
    numeric("thermal-uniaxial", {
      body: r`An aluminium rod ($E = 70\,\mathrm{GPa}$, $\nu = 0.33$, $\alpha = 24\times10^{-6}/^{\circ}\mathrm{C}$) carries $\sigma_{xx} = 70\,\mathrm{MPa}$ while it is heated by $20^{\circ}\mathrm{C}$.`,
      question: r`What is the transverse strain $\varepsilon_{yy}$, in micro-strain? Use the sign convention.`,
      answer: 150, // check: −0.33·70/70 000 + 24e-6·20 = −330e-6 + 480e-6 = +150e-6
      tolerance: 2,
      prefix: r`$\varepsilon_{yy} =$`,
      suffix: "μ",
      hint: "Two effects act sideways: the Poisson contraction and the thermal expansion. Compute both and add them with their signs.",
      explanation: r`$\varepsilon_{yy} = -\nu\sigma_{xx}/E + \alpha\Delta T = -0.33(70)/70\,000 + 24\times10^{-6}(20) = (-330 + 480)\times10^{-6} = +150\times10^{-6}$. The heating wins: the rod gets slightly *fatter* even though it is being pulled. (Axially, $\varepsilon_{xx} = (1000 + 480)\times10^{-6} = 1480\times10^{-6}$.)`,
      tags: ["uniaxial", "thermal"],
    }),
    numeric("volume-uniaxial", {
      question: r`A steel bar ($E = 200\,\mathrm{GPa}$, $\nu = 0.3$) is in uniaxial tension, $\sigma = 100\,\mathrm{MPa}$, no heating. What is its volumetric strain $\theta$, in micro-strain?`,
      answer: 200, // check: θ = (1 − 2ν)σ/E = 0.4·100/200 000 = 200e-6 (= 500 − 150 − 150)
      tolerance: 2,
      prefix: r`$\theta =$`,
      suffix: "μ",
      hint: "Add the axial strain and the two equal transverse strains.",
      explanation: r`$\theta = \varepsilon_{xx} + 2\varepsilon_{yy} = \dfrac{\sigma}{E}(1 - 2\nu) = \dfrac{100}{200\,000}(0.4) = 200\times10^{-6}$: axial $500\times10^{-6}$ and lateral $-150\times10^{-6}$ twice. The pressure route agrees: $p = 100/3\,\mathrm{MPa}$ and $K = 166.7\,\mathrm{GPa}$ give $p/K = 200\times10^{-6}$. A bar in tension gains volume whenever $\nu < \tfrac12$.`,
      tags: ["uniaxial", "pressure"],
    }),
    reading(
      "polar",
      r`Nothing in the derivation used Cartesian geometry, only three mutually perpendicular directions at a point. So the same law holds in **cylindrical** $(r, \theta, z)$ and **spherical** $(r, \theta, \phi)$ coordinates: just rename the indices (Govindjee §5.4). In cylindrical coordinates:

$$\varepsilon_{rr} = \frac{\sigma_{rr} - \nu(\sigma_{\theta\theta} + \sigma_{zz})}{E} + \alpha\Delta T, \qquad \varepsilon_{\theta\theta} = \frac{\sigma_{\theta\theta} - \nu(\sigma_{zz} + \sigma_{rr})}{E} + \alpha\Delta T$$

$$\varepsilon_{zz} = \frac{\sigma_{zz} - \nu(\sigma_{rr} + \sigma_{\theta\theta})}{E} + \alpha\Delta T, \qquad \gamma_{r\theta} = \frac{\tau_{r\theta}}{G}, \quad \gamma_{\theta z} = \frac{\tau_{\theta z}}{G}, \quad \gamma_{zr} = \frac{\tau_{zr}}{G}$$

**Example: a twisted rod.** The displacement field $u_r = 0$, $u_\theta = \beta r z$, $u_z = 0$ (a twist of $\beta$ radians per unit length) has only one nonzero strain, $\gamma_{\theta z} = \partial u_\theta/\partial z + (1/r)\,\partial u_z/\partial\theta = \beta r$ (Govindjee ch. 4). Hooke's law then gives the only nonzero stress, $\tau_{\theta z} = G\beta r$, growing linearly from the axis. This is the starting point of torsion theory (Govindjee Exercise 5.9 is this archetype).`,
      { title: "Other coordinates" },
    ),
    mc("polar-hooke", {
      question: "In cylindrical coordinates, which is the correct hoop-strain equation?",
      choices: [
        ["right", r`$\varepsilon_{\theta\theta} = \dfrac{\sigma_{\theta\theta}}{E} - \dfrac{\nu}{E}(\sigma_{rr} + \sigma_{zz}) + \alpha\Delta T$`],
        ["no-zz", r`$\varepsilon_{\theta\theta} = \dfrac{\sigma_{\theta\theta}}{E} - \dfrac{\nu}{E}\sigma_{rr} + \alpha\Delta T$`, r`That drops the Poisson effect of $\sigma_{zz}$. It is only the plane-stress special case ($\sigma_{zz} = 0$), not the general law.`],
        ["plus", r`$\varepsilon_{\theta\theta} = \dfrac{\sigma_{\theta\theta}}{E} + \dfrac{\nu}{E}(\sigma_{rr} + \sigma_{zz}) + \alpha\Delta T$`, "Sign error: for ν > 0 the other stresses cause contraction, so their term is subtracted."],
        ["over-r", r`$\varepsilon_{\theta\theta} = \dfrac{\sigma_{\theta\theta}}{rE} - \dfrac{\nu}{E}(\sigma_{rr} + \sigma_{zz})$`, r`The $1/r$ belongs in the strain–displacement relation ($\varepsilon_{\theta\theta} = u_r/r + \dots$), not in Hooke's law, and the heating term is missing.`],
      ],
      correct: "right",
      shuffle: true,
      hint: r`Rename $x, y, z \to r, \theta, z$ in the Cartesian $\varepsilon_{yy}$ equation.`,
      explanation: r`Hooke's law relates components in three perpendicular directions at a point, so renaming $(x, y, z) \to (r, \theta, z)$ gives $\varepsilon_{\theta\theta} = [\sigma_{\theta\theta} - \nu(\sigma_{rr} + \sigma_{zz})]/E + \alpha\Delta T$. The geometry (the $1/r$ factors) lives in the strain–displacement relations, never in the constitutive law.`,
      tags: ["polar", "hooke-3d"],
    }),
    numeric("torsion-tau", {
      body: r`A steel rod ($G = 80\,\mathrm{GPa}$) of radius $10\,\mathrm{mm}$ is twisted with the displacement field $u_r = 0$, $u_\theta = \beta r z$, $u_z = 0$, where $\beta = 1.5\times10^{-4}\,\mathrm{rad/mm}$.`,
      question: r`What is the shear stress $\tau_{\theta z}$ at the outer surface ($r = 10\,\mathrm{mm}$), in MPa?`,
      answer: 120, // check: γθz = βr = 1.5e-4 · 10 = 1.5e-3; τ = Gγ = 80 000 · 1.5e-3 = 120 MPa
      tolerance: 1.2,
      prefix: r`$\tau_{\theta z} =$`,
      suffix: "MPa",
      hint: r`Find $\gamma_{\theta z}$ from the displacement field first (it is the only nonzero strain), then apply the shear law.`,
      explanation: r`$\gamma_{\theta z} = \partial u_\theta/\partial z + (1/r)\,\partial u_z/\partial\theta = \beta r = 1.5\times10^{-4} \times 10 = 1.5\times10^{-3}$. Then $\tau_{\theta z} = G\gamma_{\theta z} = 80\,000 \times 1.5\times10^{-3} = 120\,\mathrm{MPa}$. Every other stress is zero, and $\tau_{\theta z}$ falls linearly to zero at the axis (60 MPa at $r = 5\,\mathrm{mm}$).`,
      tags: ["polar", "shear-modulus"],
    }),
    numeric("foam-release", {
      body: r`Back to the auxetic foam rod of Lesson 2 (diameter $20\,\mathrm{mm}$, $E = 5\,\mathrm{MPa}$, $\nu = -0.5$). Compressed to a diameter of $19\,\mathrm{mm}$, it is slid into the rigid $19\,\mathrm{mm}$ hole and the axial load is **released**. The hole is frictionless, so $\sigma_{zz} = 0$. The wall holds the radius at $9.5\,\mathrm{mm}$, so $\varepsilon_{\theta\theta} = u_r/r = -0.5/10 = -0.05$ at the wall, relative to the unstressed rod. A solid rod squeezed uniformly around its rim is in a uniform equal-biaxial state: $\sigma_{rr} = \sigma_{\theta\theta} = \sigma$ and $\varepsilon_{rr} = \varepsilon_{\theta\theta} = -0.05$ at every point.`,
      question: r`What is $\sigma = \sigma_{rr} = \sigma_{\theta\theta}$ in the rod after release, in MPa, to three significant figures? Use the sign convention.`,
      answer: -0.1667, // check: εθθ = (σ − ν(σ + 0))/E = (1 − ν)σ/E = −0.05 → σ = −0.05·5/1.5 = −0.25/1.5 = −0.16667 MPa
      tolerance: 0.002,
      prefix: r`$\sigma =$`,
      suffix: "MPa",
      answerDisplay: r`-0.167\,\mathrm{MPa}`,
      hint: r`Write the cylindrical $\varepsilon_{\theta\theta}$ equation with $\sigma_{zz} = 0$ and $\sigma_{rr} = \sigma_{\theta\theta} = \sigma$, set it equal to the strain the wall imposes, and solve for $\sigma$.`,
      explanation: r`$$\varepsilon_{\theta\theta} = \frac{\sigma - \nu(\sigma + 0)}{E} = \frac{(1 - \nu)\,\sigma}{E} = -0.05 \quad\Rightarrow\quad \sigma = \frac{-0.05 \times 5}{1 - (-0.5)} = \frac{-0.25}{1.5} = -0.167\,\mathrm{MPa}.$$

So the wall squeezes the rod with a contact pressure of 0.167 MPa, $\sigma_{zz} = 0$, and there is no shear. This uniform state really is the solution: $u_r = -0.05\,r$ gives $\varepsilon_{rr} = \partial u_r/\partial r = -0.05$ and $\varepsilon_{\theta\theta} = u_r/r = -0.05$ (compatible), a uniform stress with $\sigma_{rr} = \sigma_{\theta\theta}$ is in equilibrium, the ends carry no load, and $\sigma < 0$ confirms the rod is pushing on the wall (a positive $\sigma$ would have meant it pulls away). The rod also lengthens, though not all the way back: $\varepsilon_{zz} = -\nu(2\sigma)/E = -(-0.5)(-0.333)/5 = -0.033$, i.e. 3.3 % shorter than unstressed (it was 10 % shorter during insertion). Releasing the axial load let the rod lengthen, and with $\nu < 0$ lengthening means fattening, which jams it against the wall.`,
      tags: ["polar", "poisson"],
    }),
    reading(
      "summary",
      r`**What you did:** used the uniaxial reduction to get transverse strains, diameter changes and the volume change of rods; carried Hooke's law into cylindrical coordinates; and finished the foam-rod problem.

$$\varepsilon_{xx} = \frac{\sigma_{xx}}{E} + \alpha\Delta T, \qquad \varepsilon_{yy} = \varepsilon_{zz} = -\frac{\nu\,\sigma_{xx}}{E} + \alpha\Delta T, \qquad \theta = \frac{(1 - 2\nu)\,\sigma_{xx}}{E} \ \ (\Delta T = 0)$$

- Diameter change: $\Delta d = \varepsilon_{\text{lat}}\, d$.
- Polar and spherical coordinates: rename $(x, y, z) \to (r, \theta, z)$ or $(r, \theta, \phi)$; the law is unchanged.
- Torsion preview: $\gamma_{\theta z} = \beta r$ gives $\tau_{\theta z} = G\beta r$.

You've finished Unit 4. Take the **Level Check** to see what sticks when the hints are gone.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit practice bank (Level Check)                                     */
/* ------------------------------------------------------------------ */

const practice: QuestionStep[] = [
  numeric("p-g-titanium", {
    question: r`Titanium: $E = 105\,\mathrm{GPa}$, $\nu = 0.33$. What is its shear modulus $G$, in GPa (three significant figures)?`,
    answer: 39.47, // check: 105 / (2·1.33) = 105/2.66 = 39.474 GPa
    tolerance: 0.4,
    prefix: r`$G =$`,
    suffix: "GPa",
    answerDisplay: r`39.5\,\mathrm{GPa}`,
    hint: "G, E and ν are tied together by one formula.",
    explanation: r`$G = E/(2(1 + \nu)) = 105/2.66 = 39.5\,\mathrm{GPa}$.`,
    tags: ["shear-modulus"],
  }),
  numeric("p-exx-copper", {
    question: r`Copper ($E = 120\,\mathrm{GPa}$, $\nu = 0.34$) at a point with $\sigma_{xx} = 60$, $\sigma_{yy} = -40$, $\sigma_{zz} = 20\,\mathrm{MPa}$, no heating. Find $\varepsilon_{xx}$ in micro-strain (three significant figures).`,
    answer: 556.7, // check: (60 − 0.34·(−40 + 20))/120 000 = (60 + 6.8)/120 000 = 66.8/120 000 = 556.7e-6
    tolerance: 6,
    prefix: r`$\varepsilon_{xx} =$`,
    suffix: "μ",
    answerDisplay: r`557\times10^{-6}`,
    hint: "The Poisson term is ν times the sum of the other two normal stresses, signs included.",
    explanation: r`$\varepsilon_{xx} = [60 - 0.34(-40 + 20)]/120\,000 = (60 + 6.8)/120\,000 = 66.8/120\,000 = 557\times10^{-6}$.`,
    tags: ["hooke-3d"],
  }),
  numeric("p-gamma-yz", {
    question: r`A steel part ($G = 80\,\mathrm{GPa}$) carries $\tau_{yz} = -30\,\mathrm{MPa}$. What is the engineering shear strain $\gamma_{yz}$, in micro-strain? Use the sign convention.`,
    answer: -375, // check: γyz = τyz/G = −30/80 000 = −375e-6
    tolerance: 4,
    prefix: r`$\gamma_{yz} =$`,
    suffix: "μ",
    hint: "Each shear strain depends only on its own shear stress.",
    explanation: r`$\gamma_{yz} = \tau_{yz}/G = -30/80\,000 = -375\times10^{-6}$; the strain-matrix entry is $\varepsilon_{yz} = -187.5\times10^{-6}$. The negative sign means the right angle between the $y$ and $z$ fibres opens up.`,
    tags: ["shear-modulus"],
  }),
  numeric("p-theta", {
    question: r`Steel ($E = 200\,\mathrm{GPa}$, $\nu = 0.3$) at a point with $\sigma_{xx} = 40$, $\sigma_{yy} = 20$, $\sigma_{zz} = -30\,\mathrm{MPa}$ and some shear stresses. What is the volumetric strain $\theta$, in micro-strain?`,
    answer: 60, // check: p = (40 + 20 − 30)/3 = 10 MPa; K = 200 000/1.2 = 166 667 MPa; θ = 10/166 667 = 60e-6
    tolerance: 0.6,
    prefix: r`$\theta =$`,
    suffix: "μ",
    hint: "Volume change depends only on the pressure; shear stresses don't enter.",
    explanation: r`$p = (40 + 20 - 30)/3 = 10\,\mathrm{MPa}$ and $K = 200/1.2 = 166.7\,\mathrm{GPa}$, so $\theta = p/K = 10/166\,667 = 60\times10^{-6}$. (Same as $(1 - 2\nu)(30)/E = 0.4 \times 30/200\,000$.)`,
    tags: ["pressure", "bulk-modulus"],
  }),
  numeric("p-bulk-al", {
    question: r`Aluminium: $E = 70\,\mathrm{GPa}$, $\nu = 0.33$. What is its bulk modulus $K$, in GPa (three significant figures)?`,
    answer: 68.63, // check: 70 / (3·(1 − 0.66)) = 70/1.02 = 68.627 GPa
    tolerance: 0.7,
    prefix: r`$K =$`,
    suffix: "GPa",
    answerDisplay: r`68.6\,\mathrm{GPa}`,
    hint: r`The bulk modulus has $1 - 2\nu$ in its denominator.`,
    explanation: r`$K = E/(3(1 - 2\nu)) = 70/(3 \times 0.34) = 70/1.02 = 68.6\,\mathrm{GPa}$.`,
    tags: ["bulk-modulus"],
  }),
  numeric("p-ps-inverse", {
    question: r`A thin steel plate ($E = 200\,\mathrm{GPa}$, $\nu = 0.3$, plane stress) has $\varepsilon_{xx} = 600\times10^{-6}$ and $\varepsilon_{yy} = 400\times10^{-6}$. What is $\sigma_{yy}$, in MPa (three significant figures)?`,
    answer: 127.5, // check: 200 000·(400e-6 + 0.3·600e-6)/(1 − 0.09) = 200 000·580e-6/0.91 = 116/0.91 = 127.47 MPa
    tolerance: 1.3,
    prefix: r`$\sigma_{yy} =$`,
    suffix: "MPa",
    answerDisplay: r`127.5\,\mathrm{MPa}`,
    hint: "Use the plane-stress inverse for the y-direction: the strain in y comes first, the Poisson partner second.",
    explanation: r`$\sigma_{yy} = E(\varepsilon_{yy} + \nu\varepsilon_{xx})/(1 - \nu^2) = 200\,000\,(400 + 180)\times10^{-6}/0.91 = 116/0.91 = 127.5\,\mathrm{MPa}$.`,
    tags: ["plane-stress", "inverse-hooke"],
  }),
  numeric("p-pe-szz-thermal", {
    question: r`A long steel body in plane strain ($E = 200\,\mathrm{GPa}$, $\nu = 0.3$, $\alpha = 12\times10^{-6}/^{\circ}\mathrm{C}$) has $\sigma_{xx} = -20\,\mathrm{MPa}$ and $\sigma_{yy} = -10\,\mathrm{MPa}$ at a point and is heated by $30^{\circ}\mathrm{C}$. What is $\sigma_{zz}$, in MPa?`,
    answer: -81, // check: ν(σxx + σyy) − EαΔT = 0.3·(−30) − 200 000·12e-6·30 = −9 − 72 = −81 MPa
    tolerance: 0.8,
    prefix: r`$\sigma_{zz} =$`,
    suffix: "MPa",
    hint: r`Set $\varepsilon_{zz} = 0$ in the 3-D equation, thermal term included, and solve for $\sigma_{zz}$.`,
    explanation: r`$\sigma_{zz} = \nu(\sigma_{xx} + \sigma_{yy}) - E\alpha\Delta T = 0.3(-30) - 200\,000(12\times10^{-6})(30) = -9 - 72 = -81\,\mathrm{MPa}$. Heating a body whose length is held fixed builds a large axial compression.`,
    tags: ["plane-strain", "thermal"],
  }),
  numeric("p-lateral-al", {
    question: r`An aluminium rod ($E = 70\,\mathrm{GPa}$, $\nu = 0.33$) is in uniaxial compression, $\sigma_{xx} = -84\,\mathrm{MPa}$. What is its lateral strain, in micro-strain? Use the sign convention.`,
    answer: 396, // check: −νσ/E = −0.33·(−84)/70 000 = 27.72/70 000 = +396e-6
    tolerance: 4,
    prefix: r`$\varepsilon_{yy} =$`,
    suffix: "μ",
    hint: "The lateral strain is −ν times the axial strain, and the axial strain is negative here.",
    explanation: r`$\varepsilon_{yy} = -\nu\sigma_{xx}/E = -0.33(-84)/70\,000 = 27.72/70\,000 = +396\times10^{-6}$: a compressed rod gets fatter.`,
    tags: ["uniaxial", "poisson"],
  }),
  numeric("p-constrained", {
    question: r`A steel block ($E = 200\,\mathrm{GPa}$, $\nu = 0.3$, $\alpha = 12\times10^{-6}/^{\circ}\mathrm{C}$) is confined so that all its strains are zero, then heated by $20^{\circ}\mathrm{C}$. What is $\sigma = \sigma_{xx} = \sigma_{yy} = \sigma_{zz}$, in MPa?`,
    answer: -120, // check: σ = −EαΔT/(1 − 2ν) = −200 000·12e-6·20/0.4 = −48/0.4 = −120 MPa
    tolerance: 1.2,
    prefix: r`$\sigma =$`,
    suffix: "MPa",
    hint: "By symmetry the three normal stresses are equal. Set one normal strain to zero and solve.",
    explanation: r`$0 = \sigma(1 - 2\nu)/E + \alpha\Delta T$, so $\sigma = -E\alpha\Delta T/(1 - 2\nu) = -200\,000(12\times10^{-6})(20)/0.4 = -48/0.4 = -120\,\mathrm{MPa}$ (Govindjee Exercise 5.6 archetype).`,
    tags: ["thermal", "pressure"],
  }),
  mc("p-nu-range", {
    question: "Which statement about Poisson's ratio of an isotropic linear elastic material is correct?",
    choices: [
      ["right", r`It lies in $-1 \le \nu < \tfrac12$, and $\nu \to \tfrac12$ makes the material incompressible.`],
      ["zero-one", r`It lies between $0$ and $1$.`, r`Negative values are allowed (auxetic foams), and $\nu \ge \tfrac12$ is not.`],
      ["always03", r`It is always about $0.3$.`, "Metals are near 0.3, but polymers are near 0.45, rubber 0.49, and some foams are negative."],
      ["positive", "It must be positive, because a stretched bar always gets thinner.", "Auxetic foams (ν < 0) get fatter when stretched."],
    ],
    correct: "right",
    shuffle: true,
    hint: "Think of rubber, and of auxetic foams.",
    explanation: r`Thermodynamics requires $-1 \le \nu < \tfrac12$. At the top end $K = E/(3(1 - 2\nu)) \to \infty$, which is the incompressible limit; negative values describe auxetic materials that expand sideways when stretched.`,
    tags: ["poisson"],
  }),
  mc("p-ps-vs-pe", {
    question: "Which pair of statements is correct?",
    choices: [
      ["right", r`Plane stress: $\sigma_{zz} = 0$ and $\varepsilon_{zz} \ne 0$. Plane strain: $\varepsilon_{zz} = 0$ and $\sigma_{zz} = \nu(\sigma_{xx} + \sigma_{yy}) - E\alpha\Delta T$.`],
      ["ps-both-zero", r`Plane stress: $\sigma_{zz} = 0$ and $\varepsilon_{zz} = 0$.`, r`A thin plate is free to change thickness: $\varepsilon_{zz} = -\nu(\sigma_{xx} + \sigma_{yy})/E + \alpha\Delta T$.`],
      ["pe-both-zero", r`Plane strain: $\varepsilon_{zz} = 0$ and $\sigma_{zz} = 0$.`, "Holding the length fixed against the Poisson effect takes a constraint stress."],
      ["swapped", "Plane stress suits long dams; plane strain suits thin plates.", "Reversed: thin and free means plane stress, long and held means plane strain."],
    ],
    correct: "right",
    shuffle: true,
    hint: r`Each assumption sets one member of the pair $(\sigma_{zz}, \varepsilon_{zz})$ to zero; the other is computed afterwards.`,
    explanation: r`Plane stress (thin, free faces) sets $\sigma_{zz} = 0$ and leaves $\varepsilon_{zz} = -\nu(\sigma_{xx} + \sigma_{yy})/E + \alpha\Delta T$. Plane strain (long, held) sets $\varepsilon_{zz} = 0$ and needs $\sigma_{zz} = \nu(\sigma_{xx} + \sigma_{yy}) - E\alpha\Delta T$.`,
    tags: ["plane-stress", "plane-strain"],
  }),
  tf("p-matrix-shear", {
    statement: r`With $\tau_{xy} = 40\,\mathrm{MPa}$ and $G = 80\,\mathrm{GPa}$, the $xy$ entry of the strain matrix is $500\times10^{-6}$.`,
    answer: false,
    feedback: r`$500\times10^{-6}$ is $\gamma_{xy}$. The strain matrix holds the tensor component $\varepsilon_{xy} = \tfrac12\gamma_{xy}$.`,
    hint: r`Is the strain-matrix entry $\gamma_{xy}$ or $\varepsilon_{xy}$?`,
    explanation: r`False: $\gamma_{xy} = 40/80\,000 = 500\times10^{-6}$, but the matrix entry is $\varepsilon_{xy} = \tfrac12\gamma_{xy} = 250\times10^{-6}$.`,
    tags: ["strain-matrix", "shear-modulus"],
  }),
];

/* ------------------------------------------------------------------ */
/* Unit                                                                 */
/* ------------------------------------------------------------------ */

export const sm4: Unit = {
  id: "sm4",
  title: "Generalized Hooke's law",
  subtitle: "Linking stress and strain in three dimensions",
  description: "Young's modulus, Poisson's ratio and the shear modulus tie the six stresses to the six strains. Learn the 3-D law, the plane-stress and plane-strain reductions, pressure, and strain energy.",
  textbook: "Govindjee ch. 5",
  lessons: [l1, l2, l3, l4],
  practice,
  generators: [
    "gen.sm.hooke-3d",
    "gen.sm.hooke-shear",
    "gen.sm.plane-stress-inverse",
    "gen.sm.plane-strain-sigma-zz",
    "gen.sm.volumetric",
    "gen.sm.thermal-constrained",
  ],
};
