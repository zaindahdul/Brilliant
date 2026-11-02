import type { PressureVesselConfig, Unit } from "../types";
import { lesson, matrix, mc, multi, numeric, r, reading, tf } from "../dsl";

/*
 * Unit sm5 · Pressure vessels and Saint-Venant (Govindjee ch. 6).
 * Conventions follow the book: tension positive, sigma_rr ~ 0 in thin walls, first stress index = cut normal.
 * Every numeric answer carries a `// check:` comment with its arithmetic (lengths in mm, stresses in MPa = N/mm^2).
 */

const VESSEL_UNITS: PressureVesselConfig["units"] = { pressure: "MPa", length: "mm", stress: "MPa" };
const BAR_UNITS = { length: "mm", force: "N", stress: "MPa", displacement: "mm" };

/** Shared setups (restated in each step so questions also make sense on their own in review). */
const COMPOSITE_BAR = r`A $500\,\mathrm{mm}$ long bar is a steel core ($A_s = 200\,\mathrm{mm^2}$, $E_s = 200\,\mathrm{GPa}$) bonded inside an aluminium shell ($A_a = 300\,\mathrm{mm^2}$, $E_a = 70\,\mathrm{GPa}$), both running the full length. Rigid end plates apply a tension $F = 50\,\mathrm{kN}$.`;
const PARTLY_YIELDED_BAR = r`A slender round composite bar has an inner rod (material 1: $A_1 = 300\,\mathrm{mm^2}$, $\sigma_{Y1} = 100\,\mathrm{MPa}$) bonded inside an outer tube (material 2: $A_2 = 500\,\mathrm{mm^2}$, $\sigma_{Y2} = 300\,\mathrm{MPa}$). Both are elastic–perfectly plastic with the same $E = 200\,\mathrm{GPa}$.`;
const TANK = r`A closed steel cylinder has $R = 500\,\mathrm{mm}$, $t = 10\,\mathrm{mm}$ and internal pressure $p = 2\,\mathrm{MPa}$ (so $R/t = 50$).`;
const TANK_STEEL = r`The closed cylinder with $R = 500\,\mathrm{mm}$, $t = 10\,\mathrm{mm}$, $p = 2\,\mathrm{MPa}$ (so $\sigma_{\theta\theta} = 100\,\mathrm{MPa}$, $\sigma_{zz} = 50\,\mathrm{MPa}$) is steel: $E = 200\,\mathrm{GPa}$, $\nu = 0.3$.`;
const SPHERE_TANK = r`A spherical gas tank has $R = 800\,\mathrm{mm}$, $t = 6\,\mathrm{mm}$ and internal pressure $p = 1.2\,\mathrm{MPa}$.`;
const WELDED_TANK = r`A closed cylinder with $R = 500\,\mathrm{mm}$, $t = 10\,\mathrm{mm}$ and $p = 2\,\mathrm{MPa}$ (so $\sigma_{\theta\theta} = 100\,\mathrm{MPa}$, $\sigma_{zz} = 50\,\mathrm{MPa}$) is rolled from strip and joined by a helical weld.`;
const HOLE_BAR = r`A flat bar $w = 100\,\mathrm{mm}$ wide and $t = 10\,\mathrm{mm}$ thick has a central hole of diameter $d = 20\,\mathrm{mm}$ and carries a tension $P = 40\,\mathrm{kN}$.`;

/* ------------------------------------------------------------------ */
/* Lesson 1 · The axial rod, seen in 3-D (Govindjee §6.1)               */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "sm5-l1-axial-rod-in-3d",
    unitId: "sm5",
    title: "The axial rod, seen in 3-D",
    summary: "One kinematic and one stress assumption turn the 3-D equations into bar theory — and solve composite and partly yielded bars.",
    textbook: "Govindjee §6.1",
    minutes: 15,
  },
  [
    reading(
      "three-ingredients",
      r`The full 3-D theory couples displacements, strains and stresses through partial differential equations — hard to solve by hand. **Engineering mechanics** makes problems tractable with three ingredients:

1. a **kinematic assumption** — how the body is allowed to deform;
2. a **stress assumption** — which stress components may be non-zero;
3. a **constitutive law** — here linear elastic Hooke's law.

For an axially loaded bar, observation says that a cross-section which is flat and perpendicular to the axis before loading is still flat and perpendicular afterwards: it has only slid along $x$. Engineers say **plane sections remain plane**. In equations

$$u = u(x), \qquad v = w = 0,$$

so of the six 3-D strain–displacement relations only one survives:

$$\varepsilon_{xx}(x) = \frac{du}{dx}, \qquad \text{all other strains} = 0.$$

The strain is the same at every point of a cross-section. Remarkably, the observation holds even when the bar is inhomogeneous (several materials) or has a varying cross-section.`,
      {
        title: "Kinematics + stress + material",
        visual: {
          kind: "axial-bar",
          config: {
            segments: [{ length: 500, E: 200000, A: 200, label: "steel, A = 200 mm²" }],
            loads: [{ x: 500, P: 30000, label: "F" }],
            fixed: "left",
            show: ["sigma"],
            sliders: true,
            units: BAR_UNITS,
          },
        },
      },
    ),
    mc("plane-sections", {
      question: r`In the 3-D view of an axial bar, what exactly does *plane sections remain plane* assume?`,
      choices: [
        ["kin", r`Each cross-section stays flat and perpendicular to the axis and only translates along $x$: $u = u(x)$, $v = w = 0$.`],
        ["stress", r`The stress $\sigma_{xx}$ is the same at every point of the bar.`, "That's a statement about stress — and it isn't even true in a composite or tapered bar. The assumption is kinematic: it is about how points move."],
        ["area", "The cross-sectional area does not change under load.", "The area does change slightly (Poisson effect); the theory computes that afterwards. The assumption is about how sections move, not about their size."],
        ["homog", "The bar is made of a single homogeneous material.", "The observation holds for inhomogeneous bars too — that is exactly what makes composite bars easy."],
      ],
      correct: "kin",
      shuffle: true,
      hint: "It is the *kinematic* ingredient — a statement about displacements, not forces.",
      explanation: r`It is a kinematic assumption: every cross-section translates rigidly along the axis, so $u = u(x)$ and $v = w = 0$. The only surviving strain is $\varepsilon_{xx} = du/dx$, uniform over each cross-section even when the section contains several materials. Uniform *stress* is not assumed — a composite bar has a different stress in each material.`,
      tags: ["plane-sections", "kinematics"],
    }),
    reading(
      "uniaxial",
      r`Now the stress assumption. The bar is slender and nothing presses on its lateral surfaces, so $\sigma_{yy} = \sigma_{zz} = 0$ (and the lateral shears vanish) there. Because the bar is thin we assume this holds throughout: a **uniaxial stress** state, with $\sigma_{xx}$ the only non-zero component. Hooke's law then gives the strain matrix

$$\boldsymbol{\varepsilon} = \begin{bmatrix} \sigma_{xx}/E & 0 & 0 \\ 0 & -\nu\sigma_{xx}/E & 0 \\ 0 & 0 & -\nu\sigma_{xx}/E \end{bmatrix}.$$

But the transverse (Poisson) strains $\varepsilon_{yy} = \varepsilon_{zz} = -\nu\sigma_{xx}/E$ contradict $v = w = 0$! Incompatible assumptions are common in engineering mechanics; only full 3-D solutions or experiments can judge them. This pair passes: the transverse stresses are zero, so the transverse strains store **no strain energy** ($\sigma_{yy}\varepsilon_{yy} = \sigma_{zz}\varepsilon_{zz} = 0$) and cannot change the axial results.

> Workflow: solve the 1-D problem as if $v = w = 0$, then compute the lateral strains afterwards from $\varepsilon_{yy} = \varepsilon_{zz} = -\nu\sigma_{xx}/E$.`,
      { title: "Uniaxial stress — and the Poisson strains" },
    ),
    mc("why-poisson-ok", {
      question: r`Uniaxial stress predicts $\varepsilon_{yy} = \varepsilon_{zz} = -\nu\sigma_{xx}/E \neq 0$, while the kinematic assumption says $v = w = 0$. Why is the resulting bar theory still trusted?`,
      choices: [
        ["energy", "The transverse stresses are zero, so the transverse strains carry no strain energy and don't change the axial results; 3-D solutions and tests confirm this."],
        ["nu-zero", r`Because $\nu \approx 0$ for engineering materials.`, r`Metals have $\nu \approx 0.3$ and rubber almost $0.5$ — Poisson strains are real and measurable.`],
        ["real-zero", "Because real bars don't actually get thinner when they are stretched.", r`They do: a stretched bar contracts laterally by $\nu$ times its axial strain.`],
        ["ends", "Because the kinematic assumption is only used at the two ends of the bar.", "Plane sections remain plane is used along the whole bar — and the ends are where it is *least* accurate (Saint-Venant)."],
      ],
      correct: "energy",
      shuffle: true,
      hint: r`Think about the strain-energy density $\tfrac12(\sigma_{xx}\varepsilon_{xx} + \sigma_{yy}\varepsilon_{yy} + \sigma_{zz}\varepsilon_{zz} + \dots)$. What do the transverse strains contribute to it?`,
      explanation: r`The strain-energy density is $w = \tfrac12(\sigma_{xx}\varepsilon_{xx} + \sigma_{yy}\varepsilon_{yy} + \sigma_{zz}\varepsilon_{zz} + \tau_{xy}\gamma_{xy} + \tau_{yz}\gamma_{yz} + \tau_{zx}\gamma_{zx})$. With $\sigma_{yy} = \sigma_{zz} = 0$ the transverse strains multiply zero stresses: they store no energy, so allowing them changes nothing in the axial response. That such assumptions are acceptable is ultimately confirmed by full 3-D solutions and experiments — and for slender bars they are.`,
      tags: ["poisson", "assumptions"],
    }),
    matrix("strain-matrix", {
      body: r`A $20\,\mathrm{mm} \times 25\,\mathrm{mm}$ aluminium bar ($E = 70\,\mathrm{GPa}$, $\nu = 0.33$) carries an axial tension of $35\,\mathrm{kN}$ along $x$.`,
      question: r`Enter its strain matrix $\boldsymbol{\varepsilon}$ (axes $x, y, z$) **in micro-strain** ($10^{-6}$).`,
      answer: [
        [1000, 0, 0],
        [0, -330, 0],
        [0, 0, -330],
      ], // check: σ = 35 000 N / (20·25 = 500 mm²) = 70 MPa; εxx = 70/70 000 = 1.0e-3 = 1000 μ; εyy = εzz = −0.33·1000 = −330 μ; no shear
      tolerance: 3,
      prefix: r`$\boldsymbol{\varepsilon} \times 10^{6} =$`,
      hint: r`Start from $\sigma_{xx} = R/A$, get $\varepsilon_{xx}$ from Hooke's law, then the two lateral strains from Poisson's ratio. Is there any shear?`,
      explanation: r`$\sigma_{xx} = 35\,000/(20 \times 25) = 35\,000/500 = 70\,\mathrm{MPa}$. Then $\varepsilon_{xx} = \sigma_{xx}/E = 70/70\,000 = 1.0 \times 10^{-3} = 1000\,\mu$ and $\varepsilon_{yy} = \varepsilon_{zz} = -\nu\varepsilon_{xx} = -0.33 \times 1000 = -330\,\mu$. All shear strains are zero. The $25\,\mathrm{mm}$ side shrinks by only $330 \times 10^{-6} \times 25 = 0.0083\,\mathrm{mm}$ — tiny, which is why the 1-D theory may ignore it while it is being solved.`,
      tags: ["poisson", "strain-matrix"],
    }),
    reading(
      "composite",
      r`With only $\sigma_{xx}$ non-zero, the three 3-D equilibrium equations collapse to one, $\partial\sigma_{xx}/\partial x + b_x = 0$. Integrating it over the cross-section, with

$$R(x) = \int_A \sigma_{xx}\,\mathrm{d}A, \qquad b(x) = \int_A b_x\,\mathrm{d}A,$$

gives back the bar equations of Govindjee ch. 2: $\varepsilon = du/dx$, $dR/dx + b = 0$, $\sigma_{xx} = E\varepsilon$ — with $R = \int_A \sigma_{xx}\,\mathrm{d}A$ generalising $R = \sigma A$.

**Composite bar.** Two materials bonded side by side, both spanning the full length. Plane sections remain plane, so at any cross-section both materials have the **same strain** $\varepsilon$. Then

$$R = \int_{A_1} E_1\varepsilon\,\mathrm{d}A + \int_{A_2} E_2\varepsilon\,\mathrm{d}A = (E_1A_1 + E_2A_2)\,\varepsilon,$$

$$(EA)_{\mathrm{eff}} = E_1A_1 + E_2A_2, \qquad \varepsilon = \frac{R}{(EA)_{\mathrm{eff}}}, \qquad \sigma_i = E_i\,\varepsilon, \qquad \delta = \frac{FL}{(EA)_{\mathrm{eff}}}.$$

The strain is uniform over the section; the stress is not — it jumps at the interface in proportion to $E$.`,
      { title: "Back to 1-D — and composite bars" },
    ),
    tf("same-stress", {
      statement: "In a bar made of steel and aluminium bonded side by side and loaded axially, the axial stress is the same in both materials.",
      answer: false,
      feedback: "Plane sections remain plane forces one quantity to be shared by both materials — but it is a kinematic quantity. Which one?",
      hint: r`Which quantity does $u = u(x)$ make identical at every point of a cross-section: $\varepsilon_{xx}$ or $\sigma_{xx}$?`,
      explanation: r`False. $u = u(x)$ makes the **strain** $\varepsilon = du/dx$ the same at every point of a cross-section. Hooke's law then gives $\sigma = E\varepsilon$ in each material, so $\sigma_{\mathrm{steel}}/\sigma_{\mathrm{al}} = E_{\mathrm{steel}}/E_{\mathrm{al}} = 200/70 \approx 2.9$: the stress jumps at the interface.`,
      tags: ["composite-bar", "plane-sections"],
    }),
    numeric("core-strain", {
      body: r`A rod has a steel core ($E_s = 200\,\mathrm{GPa}$) inside a bonded aluminium casing ($E_a = 70\,\mathrm{GPa}$) and carries some axial load. At one cross-section the stress in the steel is found to be $\sigma_s = 140\,\mathrm{MPa}$.`,
      question: r`What is the axial strain $\varepsilon_{xx}$ at this cross-section? Answer **in micro-strain** ($10^{-6}$).`,
      answer: 700, // check: 140 MPa / 200 000 MPa = 7.0e-4 = 700 μ
      tolerance: 7,
      suffix: "μ",
      answerDisplay: r`700 \times 10^{-6}`,
      hint: "Hooke's law in the steel gives the strain there. What does *plane sections remain plane* then say about the casing?",
      explanation: r`$\varepsilon = \sigma_s/E_s = 140/200\,000 = 7.0 \times 10^{-4} = 700\,\mu$. Because plane sections remain plane, the aluminium at the same cross-section has exactly the same strain.`,
      tags: ["composite-bar"],
    }),
    numeric("casing-stress", {
      body: r`Same rod: steel core ($E_s = 200\,\mathrm{GPa}$) with $\sigma_s = 140\,\mathrm{MPa}$, bonded aluminium casing ($E_a = 70\,\mathrm{GPa}$).`,
      question: r`What is $\sigma_{xx}$ in the aluminium casing at that cross-section (MPa)?`,
      answer: 49, // check: 70 000 MPa · 7.0e-4 = 49 MPa (= 140 · 70/200)
      tolerance: 0.5,
      suffix: "MPa",
      answerDisplay: r`49\,\mathrm{MPa}`,
      hint: "Same strain, different modulus.",
      explanation: r`$\sigma_a = E_a\varepsilon = 70\,000 \times 7.0 \times 10^{-4} = 49\,\mathrm{MPa}$. Equivalently $\sigma_a/\sigma_s = E_a/E_s = 70/200 = 0.35$, so $\sigma_a = 0.35 \times 140 = 49\,\mathrm{MPa}$. The stress ratio is the modulus ratio — no areas needed.`,
      tags: ["composite-bar"],
    }),
    numeric("composite-strain", {
      body: COMPOSITE_BAR,
      question: r`What is the axial strain in the bar? Answer **in micro-strain**, to three significant figures.`,
      answer: 819.7, // check: (EA)eff = 200 000·200 + 70 000·300 = 40e6 + 21e6 = 61e6 N; ε = 50 000/61e6 = 8.1967e-4 = 819.7 μ
      tolerance: 8,
      suffix: "μ",
      answerDisplay: r`819.7 \times 10^{-6}`,
      hint: "Both materials share one strain. Write the total force as the sum of what each material carries, each in terms of that strain.",
      explanation: r`$F = (E_sA_s + E_aA_a)\,\varepsilon$ with $(EA)_{\mathrm{eff}} = 200\,000 \times 200 + 70\,000 \times 300 = 40 \times 10^{6} + 21 \times 10^{6} = 61 \times 10^{6}\,\mathrm{N}$. So $\varepsilon = 50\,000/(61 \times 10^{6}) = 8.197 \times 10^{-4} \approx 819.7\,\mu$.`,
      tags: ["composite-bar"],
    }),
    numeric("composite-steel", {
      body: COMPOSITE_BAR,
      question: r`What is the stress in the steel core (MPa)?`,
      answer: 163.9, // check: σs = 200 000 · 8.1967e-4 = 163.93 MPa
      tolerance: 1.6,
      suffix: "MPa",
      answerDisplay: r`163.9\,\mathrm{MPa}`,
      hint: "Hooke's law, with the steel's modulus and the shared strain.",
      explanation: r`$\sigma_s = E_s\varepsilon = 200\,000 \times 8.197 \times 10^{-4} = 163.9\,\mathrm{MPa}$ — well above the "average" $F/(A_s + A_a) = 50\,000/500 = 100\,\mathrm{MPa}$. The stiff core does most of the work.`,
      tags: ["composite-bar"],
    }),
    numeric("composite-al", {
      body: COMPOSITE_BAR,
      question: r`What is the stress in the aluminium shell (MPa)?`,
      answer: 57.38, // check: σa = 70 000 · 8.1967e-4 = 57.377 MPa; equilibrium 163.93·200 + 57.377·300 = 32 787 + 17 213 = 50 000 N ✓
      tolerance: 0.6,
      suffix: "MPa",
      answerDisplay: r`57.4\,\mathrm{MPa}`,
      hint: "Same strain as the core, but the aluminium modulus.",
      explanation: r`$\sigma_a = E_a\varepsilon = 70\,000 \times 8.197 \times 10^{-4} = 57.4\,\mathrm{MPa}$. Equilibrium check: $163.9 \times 200 + 57.4 \times 300 = 32.8\,\mathrm{kN} + 17.2\,\mathrm{kN} = 50.0\,\mathrm{kN}$ ✓.`,
      tags: ["composite-bar"],
    }),
    numeric("composite-delta", {
      body: COMPOSITE_BAR,
      question: r`By how much does the bar lengthen (mm)?`,
      answer: 0.4098, // check: δ = FL/(EA)eff = 50 000·500/61e6 = 0.40984 mm (= 8.1967e-4 · 500)
      tolerance: 0.004,
      suffix: "mm",
      answerDisplay: r`0.410\,\mathrm{mm}`,
      hint: "The strain is uniform along the bar — or use the effective axial stiffness.",
      explanation: r`$\delta = \varepsilon L = 8.197 \times 10^{-4} \times 500 = 0.410\,\mathrm{mm}$, or directly $\delta = FL/(E_sA_s + E_aA_a) = 50\,000 \times 500/(61 \times 10^{6}) = 0.410\,\mathrm{mm}$.`,
      tags: ["composite-bar", "elongation"],
    }),
    mc("stiffer-carries", {
      body: COMPOSITE_BAR,
      question: r`Which material carries the larger **stress**?`,
      choices: [
        ["steel", r`The steel — larger $E$ at the same strain.`],
        ["al", "The aluminium.", r`Same strain, $\sigma = E\varepsilon$: the smaller modulus gives the smaller stress.`],
        ["same", "Neither — the stresses are equal.", "Equal stresses would need equal moduli. The shared quantity is the strain."],
        ["area", "Whichever material has the larger cross-sectional area (here the aluminium).", r`Area decides how much *force* each material carries ($\sigma_iA_i$), not its stress.`],
      ],
      correct: "steel",
      shuffle: true,
      hint: "Both materials see the same strain. Which property then sets the stress?",
      explanation: r`The stiffer material carries the larger stress: $\sigma_i = E_i\varepsilon$ with a common $\varepsilon$, so $\sigma_s/\sigma_a = 200/70 \approx 2.9$ whatever the areas. The **force** share is $E_iA_i/(EA)_{\mathrm{eff}}$: here the steel carries $40/61$, about 66 % of the load ($32.8\,\mathrm{kN}$), even though it has the smaller area.`,
      tags: ["composite-bar"],
    }),
    reading(
      "plastic",
      r`Now let each material be **elastic–perfectly plastic**: $\sigma = E\varepsilon$ up to its yield strain $\varepsilon_Y = \sigma_Y/E$, then $\sigma = \sigma_Y$ however much further it is strained. Plane sections still remain plane, so both materials still share one strain $\varepsilon$, and $R = \int_A \sigma_{xx}\,\mathrm{d}A$ still holds. Suppose material 1 yields first ($\varepsilon_{Y1} < \varepsilon_{Y2}$):

- $\varepsilon \le \varepsilon_{Y1}$: both elastic, $R = (E_1A_1 + E_2A_2)\,\varepsilon$.
- $\varepsilon_{Y1} < \varepsilon < \varepsilon_{Y2}$: material 1 is capped at $\sigma_{Y1}$, material 2 is still elastic, $R = \sigma_{Y1}A_1 + E_2\,\varepsilon\,A_2$.
- $\varepsilon \ge \varepsilon_{Y2}$: both at yield, $R = \sigma_{Y1}A_1 + \sigma_{Y2}A_2$.

The last value is the **ultimate load** — the largest force the bar can carry. A single strain measurement anywhere on the section (say at its centre) tells you the strain in *every* material.`,
      { title: "Past yield: elastic–perfectly plastic layers" },
    ),
    numeric("partly-yielded", {
      body: r`${PARTLY_YIELDED_BAR} Under an end load, the axial strain measured at the centre of the bar is $\varepsilon = 1000 \times 10^{-6}$.`,
      question: r`What axial force is being applied (kN)?`,
      answer: 130, // check: εY1 = 100/200 000 = 500 μ < 1000 μ (core yielded); εY2 = 300/200 000 = 1500 μ > 1000 μ (tube elastic); F = 100·300 + 200 000·0.001·500 = 30 000 + 100 000 = 130 000 N
      tolerance: 1.3,
      suffix: "kN",
      hint: r`First compare the measured strain with each material's yield strain $\sigma_Y/E$. Why does a strain measured at the centre apply to the outer tube too?`,
      explanation: r`Yield strains: $\varepsilon_{Y1} = 100/200\,000 = 500\,\mu$ and $\varepsilon_{Y2} = 300/200\,000 = 1500\,\mu$. The measured $1000\,\mu$ lies between them, and (plane sections remain plane) it is the strain everywhere on the section. So the core is yielded at $\sigma_{Y1} = 100\,\mathrm{MPa}$ while the tube is elastic at $E\varepsilon = 200\,000 \times 0.001 = 200\,\mathrm{MPa}$:

$$F = \sigma_{Y1}A_1 + E\varepsilon A_2 = 100 \times 300 + 200 \times 500 = 30\,000 + 100\,000 = 130\,000\,\mathrm{N} = 130\,\mathrm{kN}.$$`,
      tags: ["composite-bar", "plasticity"],
    }),
    numeric("ultimate", {
      body: PARTLY_YIELDED_BAR,
      question: r`What is the ultimate load of this bar (kN)?`,
      answer: 180, // check: σY1·A1 + σY2·A2 = 100·300 + 300·500 = 30 000 + 150 000 = 180 000 N
      tolerance: 1.8,
      suffix: "kN",
      hint: "At the ultimate load every material in the section has reached its yield stress.",
      explanation: r`$R_{\mathrm{ult}} = \sigma_{Y1}A_1 + \sigma_{Y2}A_2 = 100 \times 300 + 300 \times 500 = 30\,000 + 150\,000 = 180\,000\,\mathrm{N} = 180\,\mathrm{kN}$, reached once $\varepsilon \ge \varepsilon_{Y2} = 1500\,\mu$.`,
      tags: ["composite-bar", "plasticity"],
    }),
    reading(
      "summary",
      r`**What you did:** rebuilt bar theory from the 3-D equations with one kinematic and one stress assumption, computed Poisson strains after the fact, and solved composite bars — elastic and partly yielded.

- Kinematics: $u = u(x)$, $v = w = 0$, so $\varepsilon_{xx} = du/dx$, the same over the whole cross-section.
- Stress: uniaxial ($\sigma_{xx}$ only); lateral strains afterwards, $\varepsilon_{yy} = \varepsilon_{zz} = -\nu\sigma_{xx}/E$.
- Equilibrium: $dR/dx + b = 0$ with $R = \int_A \sigma_{xx}\,\mathrm{d}A$.
- Composite, elastic: $\varepsilon = R/(E_1A_1 + E_2A_2)$, $\sigma_i = E_i\varepsilon$, $\delta = FL/(E_1A_1 + E_2A_2)$.
- Elastic–perfectly plastic: a yielded material carries $\sigma_Y A$; ultimate load $\sigma_{Y1}A_1 + \sigma_{Y2}A_2$.

Next: thinness, and its most famous application — the pressure vessel.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Thin-walled cylindrical pressure vessels (Govindjee §6.2.1) */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "sm5-l2-cylindrical-pressure-vessels",
    unitId: "sm5",
    title: "Thin-walled cylindrical pressure vessels",
    summary: "Two free-body diagrams give the hoop and axial stresses; plane-stress Hooke's law gives the strains and the changes in radius, length and thickness.",
    textbook: "Govindjee §6.2–6.2.1",
    minutes: 15,
  },
  [
    reading(
      "thin",
      r`A closed cylinder of radius $R$ and wall thickness $t$ holds an internal (gauge) pressure $p$. We call the wall **thin** when

$$\frac{R}{t} > 10.$$

Across such a wall $r$ changes by less than 10 %, so we assume the strains — and hence the stresses — are **constant through the thickness** (independent of $r$). By symmetry nothing depends on $\theta$ either: the problem is axisymmetric. The wall carries three normal stresses in cylindrical components:

- $\sigma_{\theta\theta}$, the **hoop** stress, acting around the circumference;
- $\sigma_{zz}$, the **axial** stress, acting along the axis;
- $\sigma_{rr}$, the **radial** stress, acting through the thickness.

Because each stress is constant over the wall, the force on any cut through the wall is simply stress × area. Move the sliders and watch the ratio of the two wall stresses.`,
      {
        title: "What makes a wall thin",
        visual: { kind: "pressure-vessel", config: { kind: "cylinder", p: 2, r: 500, t: 10, sliders: true, units: VESSEL_UNITS } },
      },
    ),
    multi("thin-check", {
      question: r`Select **every** vessel that qualifies as thin-walled by the criterion $R/t > 10$.`,
      choices: [
        ["a", r`$R = 500\,\mathrm{mm}$, $t = 10\,\mathrm{mm}$`],
        ["b", r`$R = 60\,\mathrm{mm}$, $t = 10\,\mathrm{mm}$`],
        ["c", r`diameter $D = 200\,\mathrm{mm}$, $t = 15\,\mathrm{mm}$`],
        ["d", r`diameter $D = 600\,\mathrm{mm}$, $t = 20\,\mathrm{mm}$`],
        ["e", r`$R = 1.2\,\mathrm{m}$, $t = 25\,\mathrm{mm}$`],
      ],
      correct: ["a", "d", "e"],
      hint: r`Compute $R/t$ for each — with the *radius* (half the diameter) and the same length unit on top and bottom.`,
      explanation: r`$R/t$: (a) $500/10 = 50$ ✓; (b) $60/10 = 6$ ✗; (c) $R = 100\,\mathrm{mm}$, so $100/15 = 6.7$ ✗ (using $D/t = 13.3$ would wrongly pass it); (d) $R = 300\,\mathrm{mm}$, $300/20 = 15$ ✓; (e) $1200/25 = 48$ ✓.`,
      tags: ["pressure-vessel", "thinness"],
    }),
    reading(
      "fbds",
      r`**Axial stress.** Cut the vessel with a plane normal to $z$ and keep one end. The pressure pushes on the end over the area $\pi R^2$; the ring of wall, area $\approx 2\pi R t$, pulls back with $\sigma_{zz}$:

$$\sum F_z = 0 = -p\,\pi R^2 + \sigma_{zz}\,2\pi R t \quad\Rightarrow\quad \sigma_{zz} = \frac{pR}{2t}.$$

**Hoop stress.** Take a length $L$ of the cylinder and cut it in half with a plane through the axis (cut normals $\pm\mathbf{e}_\theta$). The pressure on the half-shell adds up to $p \cdot 2RL$ (pressure times the *projected* area); the two wall strips, each of area $Lt$, resist it:

$$\sum F = 0 = -p\,2RL + 2\,\sigma_{\theta\theta}\,L t \quad\Rightarrow\quad \sigma_{\theta\theta} = \frac{pR}{t}.$$

**Radial stress.** $\sigma_{rr} = -p$ on the inner surface and $0$ on the outer, so $|\sigma_{rr}| \le p$, while $\sigma_{\theta\theta} = (R/t)\,p > 10p$ and $\sigma_{zz} > 5p$ when $R/t > 10$. The convention is $\sigma_{rr} \approx 0$ — questionable at $R/t = 10$, quickly better as $R/t$ grows.`,
      { title: "Two free-body diagrams" },
    ),
    numeric("hoop", {
      body: TANK,
      question: r`What is the hoop stress $\sigma_{\theta\theta}$ (MPa)?`,
      answer: 100, // check: pR/t = 2·500/10 = 100 MPa
      tolerance: 1,
      suffix: "MPa",
      hint: "Use the half-cylinder free body: the pressure force across the cut is balanced by two strips of wall.",
      explanation: r`$\sigma_{\theta\theta} = pR/t = 2 \times 500/10 = 100\,\mathrm{MPa}$. ($R/t = 50 > 10$, so the thin-wall formulas apply.)`,
      tags: ["pressure-vessel", "hoop-stress"],
    }),
    numeric("axial", {
      body: TANK,
      question: r`What is the axial stress $\sigma_{zz}$ (MPa)?`,
      answer: 50, // check: pR/(2t) = 2·500/20 = 50 MPa
      tolerance: 0.5,
      suffix: "MPa",
      hint: r`Cut normal to the axis: the end-cap pressure force $p\pi R^2$ is carried by the ring of wall $2\pi Rt$.`,
      explanation: r`$\sigma_{zz} = pR/(2t) = 2 \times 500/20 = 50\,\mathrm{MPa}$ — exactly half the hoop stress.`,
      tags: ["pressure-vessel", "axial-stress"],
    }),
    mc("which-twice", {
      question: "For a thin closed cylinder under internal pressure, how do the two wall stresses compare?",
      choices: [
        ["hoop2", r`$\sigma_{\theta\theta} = 2\sigma_{zz}$`],
        ["axial2", r`$\sigma_{zz} = 2\sigma_{\theta\theta}$`, r`Flip it: the end-cap force $p\pi R^2$ is spread over the whole ring $2\pi Rt$, which halves the stress.`],
        ["equal", r`$\sigma_{\theta\theta} = \sigma_{zz}$`, "Equal wall stresses are the sphere's property (a cylinder gets them only if an extra axial force is applied)."],
        ["depends", "It depends on the length of the cylinder.", r`Neither FBD leaves the length in the answer — $L$ cancels.`],
      ],
      correct: "hoop2",
      shuffle: true,
      hint: "Recall the two free-body diagrams: which pressure force is resisted by which area of wall?",
      explanation: r`$\sigma_{\theta\theta} = pR/t$ and $\sigma_{zz} = pR/(2t)$, so the hoop stress is twice the axial stress. That is why an over-pressurised pipe (or a boiled sausage) splits **lengthwise**: the hoop stress opens a longitudinal crack.`,
      tags: ["pressure-vessel", "hoop-stress"],
    }),
    mc("hoop-cut", {
      question: r`On which cut through the wall does the hoop stress $\sigma_{\theta\theta}$ act?`,
      choices: [
        ["long", r`A longitudinal cut — a plane containing the axis, with normal $\mathbf{e}_\theta$.`],
        ["cross", r`A cross-section — a plane perpendicular to the axis, with normal $\mathbf{e}_z$.`, r`On that cut the normal stress is $\sigma_{zz}$, the axial stress.`],
        ["cyl", r`A cylindrical surface concentric with the wall, with normal $\mathbf{e}_r$.`, r`That cut carries $\sigma_{rr}$, the (negligible) radial stress.`],
        ["all", "Every cut through the wall.", "Each normal-stress component lives on the cut whose normal matches its first index."],
      ],
      correct: "long",
      shuffle: true,
      hint: r`First index = normal of the cut. Which unit vector is the normal for $\sigma_{\theta\theta}$?`,
      explanation: r`By the book's convention the first index names the normal of the cut: $\sigma_{\theta\theta}$ acts on cuts with normal $\pm\mathbf{e}_\theta$ — planes that contain the axis. That is exactly the cut in the half-cylinder FBD, and it is why longitudinal seams are the critical ones.`,
      tags: ["pressure-vessel", "stress-notation"],
    }),
    tf("length-matters", {
      statement: r`Doubling the length of a closed thin cylindrical vessel (same $p$, $R$ and $t$) doubles its hoop stress.`,
      answer: false,
      feedback: r`Redo the half-cylinder FBD for a length $L$: where does $L$ appear?`,
      hint: r`In the hoop FBD both the pressure force and the resisting wall force are proportional to $L$.`,
      explanation: r`False. In $-p\,2RL + 2\sigma_{\theta\theta}Lt = 0$ the length cancels: $\sigma_{\theta\theta} = pR/t$ for any $L$. A longer vessel has more pressure force *and* more wall to resist it. (Length matters only near the end caps — a Saint-Venant effect.)`,
      tags: ["pressure-vessel", "hoop-stress"],
    }),
    mc("why-srr", {
      question: r`Why may the radial stress $\sigma_{rr}$ be neglected in a thin-walled vessel?`,
      choices: [
        ["small", r`It lies between $-p$ and $0$, while $\sigma_{\theta\theta} > 10p$ and $\sigma_{zz} > 5p$ when $R/t > 10$.`],
        ["zero", r`It is exactly zero throughout the wall.`, r`Not at the inner surface: the gas pushes on the wall there, so $\sigma_{rr} = -p$.`],
        ["strain", r`Because the radial strain $\varepsilon_{rr}$ is zero.`, r`It isn't — the wall thins, $\varepsilon_{rr} = -\nu(\sigma_{\theta\theta} + \sigma_{zz})/E$. Neglecting a *stress* says nothing about the strain.`],
        ["caps", "Because the pressure acts only on the end caps.", "Pressure acts on the whole inner surface — that is what creates the hoop stress."],
      ],
      correct: "small",
      shuffle: true,
      hint: r`What is $\sigma_{rr}$ at the inner surface? At the outer surface? Compare with $pR/t$.`,
      explanation: r`At the inner surface $\sigma_{rr} = -p$ (the gas presses on the wall) and at the outer surface $\sigma_{rr} = 0$. So $|\sigma_{rr}| \le p$, whereas $\sigma_{\theta\theta} = (R/t)\,p > 10p$ and $\sigma_{zz} > 5p$. Taking $\sigma_{rr} \approx 0$ is a small error that shrinks as $R/t$ grows.`,
      tags: ["pressure-vessel", "thinness"],
    }),
    numeric("design-t", {
      body: r`A cylindrical air receiver will have $R = 400\,\mathrm{mm}$ and operate at $p = 3\,\mathrm{MPa}$. The hoop stress must not exceed $150\,\mathrm{MPa}$.`,
      question: r`What is the minimum wall thickness $t$ (mm)?`,
      answer: 8, // check: t = pR/σ = 3·400/150 = 8 mm (R/t = 50 > 10 ✓)
      tolerance: 0.08,
      suffix: "mm",
      hint: r`The hoop stress is the larger wall stress; solve its formula for $t$.`,
      explanation: r`$\sigma_{\theta\theta} = pR/t \le 150 \Rightarrow t \ge pR/150 = 3 \times 400/150 = 8\,\mathrm{mm}$. Check: $R/t = 50 > 10$, so the thin-wall assumption holds; the axial stress is then only $75\,\mathrm{MPa}$.`,
      tags: ["pressure-vessel", "vessel-design"],
    }),
    reading(
      "strains",
      r`With $\sigma_{rr} \approx 0$ the wall is in **plane stress** in the $\theta$–$z$ plane. Hooke's law (Govindjee §5.2 with $(x, y, z) \to (\theta, z, r)$) gives

$$\varepsilon_{\theta\theta} = \frac{\sigma_{\theta\theta} - \nu\sigma_{zz}}{E} = \frac{pR}{tE}\left(1 - \frac{\nu}{2}\right), \qquad \varepsilon_{zz} = \frac{\sigma_{zz} - \nu\sigma_{\theta\theta}}{E} = \frac{pR}{tE}\left(\frac{1}{2} - \nu\right),$$

$$\varepsilon_{rr} = -\frac{\nu(\sigma_{\theta\theta} + \sigma_{zz})}{E} = -\frac{3\nu pR}{2tE}.$$

The strains are constant, so each dimension changes by strain × dimension:

- circumference $\Delta C = \varepsilon_{\theta\theta} \cdot 2\pi R$, radius $\Delta R = \varepsilon_{\theta\theta} R$, diameter $\Delta D = \varepsilon_{\theta\theta} D$ (recall $\varepsilon_{\theta\theta} = u_r/r$);
- length $\Delta L = \varepsilon_{zz} L$;
- thickness $\Delta t = \varepsilon_{rr}\, t$ (negative: the wall thins).`,
      {
        title: "Strains and dimension changes",
        visual: { kind: "pressure-vessel", config: { kind: "cylinder", p: 1.5, r: 400, t: 8, sliders: true, units: VESSEL_UNITS } },
      },
    ),
    numeric("hoop-strain", {
      body: TANK_STEEL,
      question: r`What is the hoop strain $\varepsilon_{\theta\theta}$? Answer **in micro-strain** ($10^{-6}$).`,
      answer: 425, // check: (σθθ − νσzz)/E = (100 − 0.3·50)/200 000 = 85/200 000 = 4.25e-4 = 425 μ
      tolerance: 4,
      suffix: "μ",
      answerDisplay: r`425 \times 10^{-6}`,
      hint: "Plane-stress Hooke's law: the axial stress reduces the hoop strain through Poisson's ratio.",
      explanation: r`$\varepsilon_{\theta\theta} = (\sigma_{\theta\theta} - \nu\sigma_{zz})/E = (100 - 0.3 \times 50)/200\,000 = 85/200\,000 = 4.25 \times 10^{-4} = 425\,\mu$ — the same as $\frac{pR}{tE}(1 - \nu/2) = 5 \times 10^{-4} \times 0.85$. Forgetting the Poisson term would give $500\,\mu$.`,
      tags: ["pressure-vessel", "vessel-strain"],
    }),
    numeric("delta-r", {
      body: TANK_STEEL,
      question: r`By how much does the radius increase (mm)?`,
      answer: 0.2125, // check: ΔR = εθθ·R = 4.25e-4 · 500 = 0.2125 mm
      tolerance: 0.002,
      suffix: "mm",
      answerDisplay: r`0.2125\,\mathrm{mm}`,
      hint: r`$\varepsilon_{\theta\theta}$ is the relative change of the circumference — and therefore of the radius.`,
      explanation: r`$\Delta R = \varepsilon_{\theta\theta} R = 4.25 \times 10^{-4} \times 500 = 0.2125\,\mathrm{mm}$ (diameter $+0.425\,\mathrm{mm}$, circumference $+2\pi \times 0.2125 = 1.34\,\mathrm{mm}$). Since $C = 2\pi R$, $\Delta C/C = \Delta R/R = \varepsilon_{\theta\theta}$.`,
      tags: ["pressure-vessel", "vessel-strain"],
    }),
    numeric("delta-l", {
      body: r`${TANK_STEEL} It is $L = 2\,\mathrm{m}$ long.`,
      question: r`By how much does its length increase (mm)?`,
      answer: 0.2, // check: εzz = (50 − 0.3·100)/200 000 = 20/200 000 = 1.0e-4; ΔL = 1.0e-4 · 2000 = 0.2 mm
      tolerance: 0.002,
      suffix: "mm",
      answerDisplay: r`0.2\,\mathrm{mm}`,
      hint: r`Find $\varepsilon_{zz}$ first — this time the *hoop* stress acts through Poisson's ratio, and it is the larger stress.`,
      explanation: r`$\varepsilon_{zz} = (\sigma_{zz} - \nu\sigma_{\theta\theta})/E = (50 - 0.3 \times 100)/200\,000 = 20/200\,000 = 1.0 \times 10^{-4}$, so $\Delta L = 1.0 \times 10^{-4} \times 2000 = 0.2\,\mathrm{mm}$. Notice how small $\varepsilon_{zz}$ is: it carries the factor $\tfrac12 - \nu = 0.2$, and a material with $\nu = 0.5$ would not lengthen at all.`,
      tags: ["pressure-vessel", "vessel-strain"],
    }),
    numeric("radial-strain", {
      body: TANK_STEEL,
      question: r`What is the through-thickness strain $\varepsilon_{rr}$? Answer **in micro-strain**, using the sign convention.`,
      answer: -225, // check: −ν(σθθ + σzz)/E = −0.3·150/200 000 = −45/200 000 = −2.25e-4 = −225 μ
      tolerance: 2.5,
      suffix: "μ",
      answerDisplay: r`-225 \times 10^{-6}`,
      hint: r`$\sigma_{rr} \approx 0$, so $\varepsilon_{rr}$ is pure Poisson contraction caused by the two in-plane stresses.`,
      explanation: r`$\varepsilon_{rr} = -\nu(\sigma_{\theta\theta} + \sigma_{zz})/E = -0.3 \times 150/200\,000 = -2.25 \times 10^{-4} = -225\,\mu$ (formula: $-3\nu pR/(2tE)$). The wall thins by $225 \times 10^{-6} \times 10 = 0.00225\,\mathrm{mm}$.`,
      tags: ["pressure-vessel", "vessel-strain"],
    }),
    numeric("circ-pressure", {
      body: r`A steel cylinder ($E = 200\,\mathrm{GPa}$, $\nu = 0.3$) with welded end caps has $R = 400\,\mathrm{mm}$ and $t = 8\,\mathrm{mm}$.`,
      question: r`What internal pressure increases its circumference by 0.05 %? Answer in MPa to three significant figures.`,
      answer: 2.353, // check: εθθ = 5e-4 = (pR/(tE))(1 − ν/2) ⇒ p = 5e-4·8·200 000/(400·0.85) = 800/340 = 2.3529 MPa
      tolerance: 0.024,
      suffix: "MPa",
      answerDisplay: r`2.35\,\mathrm{MPa}`,
      hint: r`The relative change of circumference is $\varepsilon_{\theta\theta}$. Write it in terms of $p$ and solve.`,
      explanation: r`$\Delta C/C = \varepsilon_{\theta\theta} = \frac{pR}{tE}\left(1 - \frac{\nu}{2}\right) = 5 \times 10^{-4}$, so

$$p = \frac{5 \times 10^{-4}\,tE}{R(1 - \nu/2)} = \frac{5 \times 10^{-4} \times 8 \times 200\,000}{400 \times 0.85} = \frac{800}{340} = 2.35\,\mathrm{MPa}.$$

The hoop stress is then $pR/t = 118\,\mathrm{MPa}$ — still elastic. In general, a fractional circumference change $e$ needs $p = 2e\,tE/(R(2 - \nu))$.`,
      tags: ["pressure-vessel", "vessel-strain"],
    }),
    numeric("equal-stresses", {
      body: r`A long closed cylinder ($R = 300\,\mathrm{mm}$, $t = 6\,\mathrm{mm}$) holds $p = 1.5\,\mathrm{MPa}$ and is also pulled by an axial tensile force $F$ applied to its end caps. The force adds $F/(2\pi Rt)$ to the axial wall stress:

$$\sigma_{zz} = \frac{pR}{2t} + \frac{F}{2\pi R t}, \qquad \sigma_{\theta\theta} = \frac{pR}{t}.$$`,
      question: r`What force $F$ makes the axial and hoop stresses equal in the main part of the vessel? Answer in kN.`,
      answer: 424.1, // check: F = πR²p = π·300²·1.5 = π·135 000 = 424 115 N = 424.1 kN (t cancels; both stresses then 75 MPa)
      tolerance: 4,
      suffix: "kN",
      answerDisplay: r`424\,\mathrm{kN}`,
      hint: r`Set the two expressions equal and solve for $F$. Watch what happens to $t$.`,
      explanation: r`$\frac{pR}{2t} + \frac{F}{2\pi Rt} = \frac{pR}{t} \Rightarrow \frac{F}{2\pi Rt} = \frac{pR}{2t} \Rightarrow F = \pi R^2 p$ — the thickness cancels. Numerically $F = \pi \times 300^2 \times 1.5 = 424\,115\,\mathrm{N} \approx 424\,\mathrm{kN}$: the extra pull equals the pressure force on one end cap, which doubles the axial stress to match the hoop stress ($75\,\mathrm{MPa}$ each).`,
      tags: ["pressure-vessel", "combined-loading"],
    }),
    reading(
      "summary",
      r`**What you did:** used two free-body diagrams for the wall stresses of a thin cylinder, plane-stress Hooke's law for its strains and dimension changes, and combined pressure with an axial force.

$$\sigma_{\theta\theta} = \frac{pR}{t}, \qquad \sigma_{zz} = \frac{pR}{2t}, \qquad \sigma_{rr} \approx 0 \qquad (R/t > 10)$$

$$\varepsilon_{\theta\theta} = \frac{pR}{tE}\left(1 - \frac{\nu}{2}\right), \qquad \varepsilon_{zz} = \frac{pR}{tE}\left(\frac{1}{2} - \nu\right), \qquad \varepsilon_{rr} = -\frac{3\nu pR}{2tE}$$

- $\Delta R = \varepsilon_{\theta\theta}R$, $\Delta C = \varepsilon_{\theta\theta}\,2\pi R$, $\Delta L = \varepsilon_{zz}L$, $\Delta t = \varepsilon_{rr}t$.
- Extra axial force: $\sigma_{zz} = pR/(2t) + F/(2\pi Rt)$; the stresses are equal when $F = \pi R^2 p$.
- Design: the hoop stress governs, $t \ge pR/\sigma_{\mathrm{allow}}$.

Next: spheres, wall design and welds.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Spherical vessels and vessel design (Govindjee §6.2.2)    */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "sm5-l3-spheres-and-design",
    unitId: "sm5",
    title: "Spherical vessels and vessel design",
    summary: "The sphere's equal membrane stresses, sizing a wall against yield, choosing the lightest material, and the stress on a helical weld.",
    textbook: "Govindjee §6.2.2",
    minutes: 15,
  },
  [
    reading(
      "sphere",
      r`A sphere of radius $R$ and wall thickness $t$ (again $R/t > 10$) holds internal pressure $p$. Thinness makes the strains, and so the stresses, constant through the wall; symmetry makes them the same at every point and in every direction tangent to the wall.

Cut the sphere through its centre and keep one half. The pressure on the hemisphere adds up to $p\,\pi R^2$ normal to the cut (projected area); the ring of wall, area $\approx 2\pi R t$, resists it:

$$\sum F_n = 0 = p\,\pi R^2 - \sigma_{\phi\phi}\,2\pi R t \quad\Rightarrow\quad \sigma_{\theta\theta} = \sigma_{\phi\phi} = \frac{pR}{2t}, \qquad \sigma_{rr} \approx 0.$$

Every diametral cut gives the same answer, so the two in-plane stresses are equal (**equal biaxial tension**). Plane-stress Hooke's law with $\sigma_{\theta\theta} = \sigma_{\phi\phi} = \sigma$:

$$\varepsilon_{\theta\theta} = \varepsilon_{\phi\phi} = \frac{\sigma - \nu\sigma}{E} = \frac{pR}{2tE}(1 - \nu), \qquad \varepsilon_{rr} = -\frac{2\nu\sigma}{E} = -\frac{\nu pR}{tE}.$$

Dimension changes follow as before: $\Delta R = \varepsilon_{\theta\theta}R$ and $\Delta t = \varepsilon_{rr}t$.`,
      {
        title: "The spherical vessel",
        visual: { kind: "pressure-vessel", config: { kind: "sphere", p: 1.5, r: 600, t: 6, sliders: true, units: VESSEL_UNITS } },
      },
    ),
    numeric("sphere-stress", {
      body: SPHERE_TANK,
      question: r`What is the membrane stress $\sigma_{\theta\theta} = \sigma_{\phi\phi}$ in its wall (MPa)?`,
      answer: 80, // check: pR/(2t) = 1.2·800/12 = 80 MPa (R/t = 133 > 10)
      tolerance: 0.8,
      suffix: "MPa",
      hint: "Hemisphere free body: pressure on the projected circle against the ring of wall.",
      explanation: r`$\sigma = pR/(2t) = 1.2 \times 800/(2 \times 6) = 960/12 = 80\,\mathrm{MPa}$, in every tangential direction. ($R/t = 133$, comfortably thin.)`,
      tags: ["pressure-vessel", "sphere"],
    }),
    tf("equal-biaxial", {
      statement: r`In a thin spherical pressure vessel the two in-plane wall stresses $\sigma_{\theta\theta}$ and $\sigma_{\phi\phi}$ are equal.`,
      answer: true,
      feedback: "Cut the sphere along any plane through its centre: is any direction special?",
      hint: "A sphere looks the same from every direction. Compare the FBDs for two different diametral cuts.",
      explanation: r`True. Every diametral cut gives $p\pi R^2 = \sigma\,2\pi Rt$, so $\sigma_{\theta\theta} = \sigma_{\phi\phi} = pR/(2t)$ — an equal biaxial state. (A cylinder, by contrast, has $\sigma_{\theta\theta} = 2\sigma_{zz}$.)`,
      tags: ["pressure-vessel", "sphere"],
    }),
    mc("sphere-vs-cylinder", {
      question: r`A sphere and a long closed cylinder have the same $p$, $R$ and $t$. Compared with the cylinder's hoop stress, the sphere's wall stress is…`,
      choices: [
        ["half", "half as large (it equals the cylinder's axial stress)"],
        ["same", "the same", r`The sphere's FBD spreads $p\pi R^2$ over $2\pi Rt$ — that is the cylinder's *axial* FBD, not its hoop one.`],
        ["double", "twice as large", "The other way round: the sphere is the more efficient shape for a given wall."],
        ["quarter", "a quarter as large", r`Check the factor: $pR/(2t)$ versus $pR/t$.`],
      ],
      correct: "half",
      shuffle: true,
      hint: "The sphere's hemisphere free-body diagram looks exactly like one of the cylinder's two free-body diagrams. Which one?",
      explanation: r`Sphere: $pR/(2t)$; cylinder hoop: $pR/t$. The sphere's stress is half — it equals the cylinder's axial stress, because both come from the same balance ($p\pi R^2$ against $2\pi Rt$). For a given pressure and allowable stress, a sphere needs only half the wall thickness of a cylinder of the same radius.`,
      tags: ["pressure-vessel", "sphere"],
    }),
    numeric("sphere-strain", {
      body: r`${SPHERE_TANK} It is steel: $E = 200\,\mathrm{GPa}$, $\nu = 0.3$.`,
      question: r`What is the hoop strain $\varepsilon_{\theta\theta}$ in the wall? Answer **in micro-strain** ($10^{-6}$).`,
      answer: 280, // check: σ = 80 MPa; σ(1 − ν)/E = 80·0.7/200 000 = 56/200 000 = 2.8e-4 = 280 μ
      tolerance: 3,
      suffix: "μ",
      answerDisplay: r`280 \times 10^{-6}`,
      hint: r`Both in-plane stresses equal $\sigma$, and each one reduces the strain in the other direction through Poisson's ratio.`,
      explanation: r`$\sigma = pR/(2t) = 80\,\mathrm{MPa}$, so $\varepsilon_{\theta\theta} = (\sigma_{\theta\theta} - \nu\sigma_{\phi\phi})/E = \sigma(1 - \nu)/E = 80 \times 0.7/200\,000 = 2.8 \times 10^{-4} = 280\,\mu$. The radius grows by $\Delta R = 2.8 \times 10^{-4} \times 800 = 0.224\,\mathrm{mm}$.`,
      tags: ["pressure-vessel", "sphere", "vessel-strain"],
    }),
    mc("thinning-formula", {
      question: r`What internal pressure thins the wall of a thin spherical vessel by 0.5 %? (Linear elastic, modulus $E$, Poisson ratio $\nu$.)`,
      choices: [
        ["right", r`$p = \dfrac{0.005\,tE}{\nu R}$`],
        ["cyl", r`$p = \dfrac{0.01\,tE}{3\nu R}$`, r`That is the *cylinder* (its $\varepsilon_{rr} = -3\nu pR/(2tE)$). A sphere has two equal stresses $pR/(2t)$.`],
        ["radius", r`$p = \dfrac{0.01\,tE}{(1 - \nu)R}$`, r`That pressure grows the *radius* by 0.5 % ($\varepsilon_{\theta\theta} = 0.005$). Thinning is governed by $\varepsilon_{rr}$.`],
        ["nonu", r`$p = \dfrac{0.01\,tE}{R}$`, r`With $\sigma_{rr} \approx 0$ the thinning is pure Poisson contraction — $\nu$ must appear.`],
      ],
      correct: "right",
      shuffle: true,
      hint: r`Thinning by 0.5 % means $\varepsilon_{rr} = -0.005$. Write the sphere's $\varepsilon_{rr}$ in terms of $p$.`,
      explanation: r`$\varepsilon_{rr} = -\nu(\sigma_{\theta\theta} + \sigma_{\phi\phi})/E = -2\nu\,\frac{pR}{2tE} = -\frac{\nu pR}{tE}$. Setting $\varepsilon_{rr} = -0.005$ gives $p = 0.005\,tE/(\nu R)$; in general a thinning fraction $e$ needs $p = e\,tE/(\nu R)$ (so $0.01\,tE/(\nu R)$ for 1 %). For steel that would mean a wall stress $pR/(2t) = 0.005E/(2\nu) \approx 1700\,\mathrm{MPa}$ — far beyond yield, so such thinning is not elastic for metals.`,
      tags: ["pressure-vessel", "sphere", "vessel-strain"],
    }),
    numeric("thinning-pressure", {
      body: r`A steel sphere ($E = 200\,\mathrm{GPa}$, $\nu = 0.3$) has $R = 500\,\mathrm{mm}$ and $t = 10\,\mathrm{mm}$.`,
      question: r`What internal pressure makes its wall 0.03 % thinner (MPa)?`,
      answer: 4, // check: εrr = −3e-4 = −νpR/(tE) ⇒ p = 3e-4·10·200 000/(0.3·500) = 600/150 = 4 MPa (wall stress pR/2t = 100 MPa, elastic)
      tolerance: 0.04,
      suffix: "MPa",
      hint: r`Set the sphere's $\varepsilon_{rr}$ equal to $-3 \times 10^{-4}$ and solve for $p$.`,
      explanation: r`$\varepsilon_{rr} = -\nu pR/(tE) = -3 \times 10^{-4}$, so

$$p = \frac{3 \times 10^{-4}\,tE}{\nu R} = \frac{3 \times 10^{-4} \times 10 \times 200\,000}{0.3 \times 500} = \frac{600}{150} = 4\,\mathrm{MPa}.$$

Check: the wall stress is $pR/(2t) = 100\,\mathrm{MPa}$, still elastic for steel.`,
      tags: ["pressure-vessel", "sphere", "vessel-strain"],
    }),
    numeric("balloon", {
      body: r`A balloon satellite is a thin plastic-film sphere of radius $R = 12\,\mathrm{m}$ with a wall only $t = 0.015\,\mathrm{mm}$ thick; the film yields at $\sigma_Y = 30\,\mathrm{MPa}$.`,
      question: r`What differential pressure would make the film yield? Answer **in pascals** (Pa).`,
      answer: 75, // check: p = 2tσY/R = 2·0.015·30/12 000 = 0.9/12 000 = 7.5e-5 MPa = 75 Pa
      tolerance: 0.75,
      suffix: "Pa",
      hint: r`Set the sphere's wall stress equal to $\sigma_Y$ and solve for $p$. Keep lengths in one unit, and remember $1\,\mathrm{MPa} = 10^6\,\mathrm{Pa}$.`,
      explanation: r`$\sigma = pR/(2t) = \sigma_Y \Rightarrow p = 2t\sigma_Y/R = 2 \times 0.015 \times 30/12\,000 = 7.5 \times 10^{-5}\,\mathrm{MPa} = 75\,\mathrm{Pa}$ — less than a thousandth of atmospheric pressure. With $R/t = 800\,000$ this is about as thin as a wall gets.`,
      tags: ["pressure-vessel", "sphere", "vessel-design"],
    }),
    numeric("sphere-thickness", {
      body: r`A spherical vessel of radius $R = 500\,\mathrm{mm}$ must hold $p = 2\,\mathrm{MPa}$ with a wall stress no higher than $100\,\mathrm{MPa}$.`,
      question: r`What is the minimum wall thickness (mm)?`,
      answer: 5, // check: t = pR/(2σ) = 2·500/(2·100) = 5 mm (R/t = 100)
      tolerance: 0.05,
      suffix: "mm",
      hint: r`Solve the sphere formula for $t$.`,
      explanation: r`$t \ge pR/(2\sigma_{\mathrm{allow}}) = 2 \times 500/(2 \times 100) = 5\,\mathrm{mm}$ ($R/t = 100$, thin). A cylinder of the same radius would need $pR/\sigma = 10\,\mathrm{mm}$.`,
      tags: ["pressure-vessel", "sphere", "vessel-design"],
    }),
    reading(
      "design",
      r`**Sizing against yield.** With a safety factor SF, the largest wall stress may reach only $\sigma_{\mathrm{allow}} = \sigma_Y/\mathrm{SF}$. For a cylinder with spherical end caps of the same thickness $t$:

- cylinder: $\sigma_{\theta\theta} = pR/t$ is the largest stress, so $t \ge \mathrm{SF}\,pR/\sigma_Y$;
- caps: $pR/(2t)$, which needs only half that — **the cylinder governs**.

If a problem specifies a multi-axial yield criterion instead (Govindjee's Exercise 6.10 uses one of the form $(\sigma_{rr}-\sigma_{\theta\theta})^2 + (\sigma_{\theta\theta}-\sigma_{zz})^2 + (\sigma_{zz}-\sigma_{rr})^2 \le 2\sigma_Y^2$), substitute the wall stresses with $\sigma_{rr} = 0$, replace $\sigma_Y$ by $\sigma_Y/\mathrm{SF}$, and solve for $t$ the same way — in the cylinder *and* in the caps.

**Choosing the lightest material.** The wall's mass is $\rho \times (\text{wall area}) \times t$; the area is fixed by $R$ and $L$, and the required $t$ is proportional to $1/\sigma_Y$. So

$$m \propto \rho\,t \propto \frac{\rho}{\sigma_Y}.$$

Pick the material with the largest **specific strength** $\sigma_Y/\rho$ — not simply the strongest or the least dense one.`,
      {
        title: "Designing the wall",
        visual: { kind: "pressure-vessel", config: { kind: "cylinder", p: 3, r: 400, t: 10, sliders: true, units: VESSEL_UNITS } },
      },
    ),
    numeric("cylinder-design", {
      body: r`A cylinder with spherical end caps (same thickness everywhere) has $R = 250\,\mathrm{mm}$ and will hold $p = 4\,\mathrm{MPa}$. The steel yields at $\sigma_Y = 250\,\mathrm{MPa}$ and the design safety factor is $\mathrm{SF} = 2$. Use the simple criterion: largest normal stress $\le \sigma_Y/\mathrm{SF}$.`,
      question: r`What wall thickness is required (mm)?`,
      answer: 8, // check: σallow = 250/2 = 125 MPa; cylinder governs: t = pR/σallow = 4·250/125 = 8 mm (caps then 4·250/(2·8) = 62.5 MPa ≤ 125 ✓)
      tolerance: 0.08,
      suffix: "mm",
      hint: "Find the allowable stress first, then decide which part of the vessel has the largest stress for a given wall.",
      explanation: r`$\sigma_{\mathrm{allow}} = 250/2 = 125\,\mathrm{MPa}$. The cylinder's hoop stress governs: $pR/t \le 125 \Rightarrow t \ge 4 \times 250/125 = 8\,\mathrm{mm}$. With $t = 8\,\mathrm{mm}$ the caps see only $pR/(2t) = 62.5\,\mathrm{MPa}$.`,
      tags: ["pressure-vessel", "vessel-design", "safety-factor"],
    }),
    numeric("cylinder-design-vm", {
      body: r`Same vessel ($R = 250\,\mathrm{mm}$, $p = 4\,\mathrm{MPa}$, $\sigma_Y = 250\,\mathrm{MPa}$, $\mathrm{SF} = 2$), but now the specification uses the multi-axial yield criterion

$$(\sigma_{rr}-\sigma_{\theta\theta})^2 + (\sigma_{\theta\theta}-\sigma_{zz})^2 + (\sigma_{zz}-\sigma_{rr})^2 \le 2\left(\frac{\sigma_Y}{\mathrm{SF}}\right)^2$$

with $\sigma_{rr} = 0$ in the wall.`,
      question: r`What wall thickness is required now (mm)? Give three significant figures.`,
      answer: 6.928, // check: cylinder s = pR/t: s² + (s/2)² + (s/2)² = 1.5 s² ≤ 2·125² ⇒ s ≤ 125·√(4/3) = 144.34 ⇒ t ≥ 1000/144.34 = 6.928 mm; caps 2(pR/2t)² ≤ 2·125² ⇒ t ≥ 4 mm ⇒ cylinder governs
      tolerance: 0.07,
      suffix: "mm",
      answerDisplay: r`6.93\,\mathrm{mm}`,
      hint: r`In the cylinder write $s = pR/t$, so $\sigma_{\theta\theta} = s$ and $\sigma_{zz} = s/2$. Substitute, solve for $s$, then for $t$ — and check the caps too.`,
      explanation: r`Cylinder: $(0 - s)^2 + (s - s/2)^2 + (s/2 - 0)^2 = 1.5\,s^2 \le 2(125)^2$, so $s \le 125\sqrt{4/3} = 144.3\,\mathrm{MPa}$ and $t \ge pR/144.3 = 1000/144.3 = 6.93\,\mathrm{mm}$ — in general $t = \tfrac{\sqrt{3}}{2}\,\mathrm{SF}\,pR/\sigma_Y$. Caps ($\sigma_{\theta\theta} = \sigma_{\phi\phi} = pR/(2t)$, $\sigma_{rr} = 0$): $2\,(pR/2t)^2 \le 2(125)^2 \Rightarrow t \ge 4\,\mathrm{mm}$. The cylinder governs: $t = 6.93\,\mathrm{mm}$, a little thinner than the $8\,\mathrm{mm}$ from the largest-normal-stress rule.`,
      tags: ["pressure-vessel", "vessel-design", "safety-factor"],
    }),
    mc("lightest", {
      body: r`You must choose the wall material for a vessel with given $p$, $R$, $L$ and SF, the wall being sized against yield. Candidates:

- aluminium alloy: $\sigma_Y = 480\,\mathrm{MPa}$, $\rho = 2800\,\mathrm{kg/m^3}$
- titanium alloy: $\sigma_Y = 900\,\mathrm{MPa}$, $\rho = 4500\,\mathrm{kg/m^3}$
- maraging steel: $\sigma_Y = 1760\,\mathrm{MPa}$, $\rho = 8000\,\mathrm{kg/m^3}$
- structural steel: $\sigma_Y = 250\,\mathrm{MPa}$, $\rho = 7850\,\mathrm{kg/m^3}$`,
      question: "Which material gives the **lightest** vessel?",
      choices: [
        ["al", "The aluminium alloy", r`Lowest density is not the criterion: $\sigma_Y/\rho = 480/2800 = 0.171$ — compare with the others.`],
        ["ti", "The titanium alloy", r`Close, but $900/4500 = 0.200$ is not the largest $\sigma_Y/\rho$.`],
        ["ms", "The maraging steel"],
        ["ss", "The structural steel", r`$250/7850 = 0.032$ — by far the worst: weak *and* dense.`],
      ],
      correct: "ms",
      shuffle: true,
      hint: r`For a fixed design, $t \propto 1/\sigma_Y$ and the mass $\propto \rho t$. Compute $\sigma_Y/\rho$ for each candidate.`,
      explanation: r`Mass $\propto \rho t \propto \rho/\sigma_Y$, so rank by specific strength $\sigma_Y/\rho$ (in $\mathrm{MPa}$ per $\mathrm{kg/m^3}$): aluminium $0.171$, titanium $0.200$, **maraging steel $0.220$**, structural steel $0.032$. The dense but very strong steel wins: its wall is so thin that it more than makes up for the density. The aluminium vessel would be $0.220/0.171 \approx 1.28$ times heavier.`,
      tags: ["pressure-vessel", "vessel-design", "materials"],
    }),
    reading(
      "weld",
      r`Tanks and pipes are often rolled from strip and joined by a **helical weld**. What stress acts on it? Unroll the wall: locally it is a flat sheet in the $\theta$–$z$ plane with (components ordered $\theta, z$)

$$\boldsymbol{\sigma} = \begin{bmatrix} \sigma_{\theta\theta} & 0 \\ 0 & \sigma_{zz} \end{bmatrix} = \frac{pR}{2t}\begin{bmatrix} 2 & 0 \\ 0 & 1 \end{bmatrix}.$$

Let the weld line make angle $\varphi$ with the cylinder's **axis**. Its unit tangent is $\mathbf{s} = (-\sin\varphi, \cos\varphi)$ and its unit normal $\mathbf{n} = (\cos\varphi, \sin\varphi)$ — the normal makes the same angle $\varphi$ with the hoop direction. Cauchy's law (Govindjee §3.2.2) gives the traction on the weld, $\mathbf{t} = \boldsymbol{\sigma}^{T}\mathbf{n} = \boldsymbol{\sigma}\mathbf{n}$ (bold $\mathbf{t}$ — not the thickness $t$). Its normal and shear parts are

$$\sigma_n = \mathbf{n}\cdot\mathbf{t} = \sigma_{\theta\theta}\cos^2\varphi + \sigma_{zz}\sin^2\varphi,$$

$$|\tau| = |\mathbf{s}\cdot\mathbf{t}| = (\sigma_{\theta\theta} - \sigma_{zz})\sin\varphi\cos\varphi = \frac{pR}{2t}\sin\varphi\cos\varphi.$$

Checks: $\varphi = 0$ (a longitudinal seam) feels the full hoop stress and no shear; $\varphi = 90^\circ$ (a circumferential seam) feels $\sigma_{zz}$ and no shear. (The sign of $\tau$ just depends on which way $\mathbf{s}$ points, i.e. on the helix's handedness; the magnitude does not.)

The element below shows a vessel wall with $\sigma_{\theta\theta} = 120\,\mathrm{MPa}$ and $\sigma_{zz} = 60\,\mathrm{MPa}$: its $x$ axis plays the hoop direction $\theta$ and its $y$ axis the axial direction $z$, and the cut is the weld plane. The slider's angle $\theta$ is the direction of the cut's outward **normal**, measured from $+x$ (the hoop direction): it plays the role of $\varphi$ here (it is not the hoop coordinate), and the weld line itself then makes that same angle with the $y$ (axial) direction. Turn the cut and watch the traction change.

> Always find the weld's **normal** first. If the angle is given from the circumferential direction instead of the axis, $\cos$ and $\sin$ swap places in $\sigma_n$.`,
      {
        title: "Stress on a helical weld",
        visual: { kind: "stress-element", config: { sxx: 120, syy: 60, sxy: 0, cut: { theta: 30, slider: true }, max: 150, unit: "MPa" } },
      },
    ),
    numeric("weld-shear", {
      body: r`${WELDED_TANK} The weld line makes $\varphi = 30^\circ$ with the cylinder's axis.`,
      question: r`What is the magnitude of the shear stress on the weld (MPa)? Give three significant figures.`,
      answer: 21.65, // check: (100 − 50)·sin30°·cos30° = 50·0.5·0.86603 = 21.651 MPa
      tolerance: 0.22,
      suffix: "MPa",
      answerDisplay: r`21.65\,\mathrm{MPa}`,
      hint: r`Write $\mathbf{n}$ and $\mathbf{s}$ for the weld, compute the traction $\boldsymbol{\sigma}\mathbf{n}$, and project it onto the weld direction.`,
      explanation: r`$\mathbf{n} = (\cos 30^\circ, \sin 30^\circ) = (0.866, 0.5)$ in $(\theta, z)$ components, so $\mathbf{t} = \boldsymbol{\sigma}\mathbf{n} = (100 \times 0.866,\; 50 \times 0.5) = (86.6, 25)\,\mathrm{MPa}$. Projecting on $\mathbf{s} = (-\sin 30^\circ, \cos 30^\circ) = (-0.5, 0.866)$: $\tau = -86.6 \times 0.5 + 25 \times 0.866 = -43.3 + 21.65 = -21.65\,\mathrm{MPa}$, so $|\tau| = 21.65\,\mathrm{MPa}$. Formula check: $(\sigma_{\theta\theta} - \sigma_{zz})\sin\varphi\cos\varphi = 50 \times 0.5 \times 0.866 = 21.65\,\mathrm{MPa}$.`,
      tags: ["pressure-vessel", "weld", "cauchy"],
    }),
    numeric("weld-normal", {
      body: r`${WELDED_TANK} The weld line makes $\varphi = 30^\circ$ with the cylinder's axis.`,
      question: r`What is the normal stress pulling the weld apart (MPa)?`,
      answer: 87.5, // check: σθθ cos²30° + σzz sin²30° = 100·0.75 + 50·0.25 = 75 + 12.5 = 87.5 MPa
      tolerance: 0.9,
      suffix: "MPa",
      answerDisplay: r`87.5\,\mathrm{MPa}`,
      hint: r`$\sigma_n = \mathbf{n}\cdot\boldsymbol{\sigma}\mathbf{n}$. A weld only $30^\circ$ off the axis behaves much like a longitudinal seam — which stress should dominate?`,
      explanation: r`$\sigma_n = \sigma_{\theta\theta}\cos^2\varphi + \sigma_{zz}\sin^2\varphi = 100 \times 0.75 + 50 \times 0.25 = 75 + 12.5 = 87.5\,\mathrm{MPa}$ (also $\mathbf{n}\cdot\mathbf{t} = 0.866 \times 86.6 + 0.5 \times 25 = 75 + 12.5$). It is close to the hoop stress, as expected for a weld near the axial direction.`,
      tags: ["pressure-vessel", "weld", "cauchy"],
    }),
    numeric("weld-normal-hoop", {
      body: r`${WELDED_TANK} This time the drawing gives the helix angle as $30^\circ$ measured from the **circumferential** direction.`,
      question: r`What is the normal stress on the weld now (MPa)?`,
      answer: 62.5, // check: angle to the axis φ = 90° − 30° = 60°: 100·cos²60° + 50·sin²60° = 25 + 37.5 = 62.5 MPa
      tolerance: 0.6,
      suffix: "MPa",
      answerDisplay: r`62.5\,\mathrm{MPa}`,
      hint: "Convert to the angle between the weld and the axis first — or find the weld's normal directly.",
      explanation: r`$30^\circ$ from the circumferential direction is $\varphi = 60^\circ$ from the axis, so $\sigma_n = 100\cos^2 60^\circ + 50\sin^2 60^\circ = 100 \times 0.25 + 50 \times 0.75 = 25 + 37.5 = 62.5\,\mathrm{MPa}$. The shear magnitude is unchanged, $50 \sin 60^\circ \cos 60^\circ = 21.65\,\mathrm{MPa}$, because $\sin\varphi\cos\varphi$ is symmetric about $45^\circ$ — only the normal stress tells the two readings of the drawing apart.`,
      tags: ["pressure-vessel", "weld", "cauchy"],
    }),
    mc("weld-max", {
      question: "Over all possible helix angles, what is the largest shear stress a weld in a closed thin cylinder can see?",
      choices: [
        ["q45", r`$pR/(4t)$, at $\varphi = 45^\circ$`],
        ["h45", r`$pR/(2t)$, at $\varphi = 45^\circ$`, r`At $45^\circ$, $\sin\varphi\cos\varphi = \tfrac12$, which halves $\sigma_{\theta\theta} - \sigma_{zz} = pR/(2t)$.`],
        ["hoop0", r`$pR/t$, at $\varphi = 0$`, "A longitudinal seam carries the hoop stress as a *normal* stress; its shear is zero."],
        ["q90", r`$pR/(4t)$, at $\varphi = 90^\circ$`, r`At $90^\circ$ (a circumferential seam) $\sin\varphi\cos\varphi = 0$: no shear at all.`],
      ],
      correct: "q45",
      shuffle: true,
      hint: r`Maximise $\sin\varphi\cos\varphi = \tfrac12\sin 2\varphi$.`,
      explanation: r`$|\tau| = \frac{pR}{2t}\sin\varphi\cos\varphi = \frac{pR}{4t}\sin 2\varphi$, largest at $\varphi = 45^\circ$ with $|\tau|_{\max} = pR/(4t)$ — half the difference of the two wall stresses. For the tank above that is $2 \times 500/40 = 25\,\mathrm{MPa}$.`,
      tags: ["pressure-vessel", "weld"],
    }),
    reading(
      "summary",
      r`**What you did:** derived the sphere's membrane stress and strains, sized walls against yield and chose the lightest material, and resolved the wall stress onto an inclined weld with Cauchy's law.

$$\sigma_{\theta\theta} = \sigma_{\phi\phi} = \frac{pR}{2t}, \qquad \varepsilon_{\theta\theta} = \varepsilon_{\phi\phi} = \frac{pR}{2tE}(1 - \nu), \qquad \varepsilon_{rr} = -\frac{\nu pR}{tE} \qquad \text{(sphere)}$$

- Pressure at which the wall yields: sphere $p = 2t\sigma_Y/R$, cylinder (hoop) $p = t\sigma_Y/R$.
- Design with a safety factor: $t \ge \mathrm{SF}\,pR/\sigma_Y$ for the cylinder (governs) and $\mathrm{SF}\,pR/(2\sigma_Y)$ for a sphere or the caps.
- Lightest wall: largest specific strength $\sigma_Y/\rho$.
- Weld at angle $\varphi$ to the axis: $\sigma_n = \sigma_{\theta\theta}\cos^2\varphi + \sigma_{zz}\sin^2\varphi$, $|\tau| = \frac{pR}{2t}\sin\varphi\cos\varphi \le \frac{pR}{4t}$.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Saint-Venant's principle and stress concentrations (§6.3) */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "sm5-l4-saint-venant",
    unitId: "sm5",
    title: "Saint-Venant's principle and stress concentrations",
    summary: "Where the engineering formulas stop being accurate — near loads and supports, and near holes, notches and fillets — and how to correct the peak stress.",
    textbook: "Govindjee §6.3",
    minutes: 10,
  },
  [
    reading(
      "saint-venant",
      r`Every formula so far — $\sigma = R/A$, $pR/t$, $pR/(2t)$ — assumes the stress is spread **uniformly** over the cross-section. That cannot be exactly true where a load enters the body, unless the load itself is uniformly distributed. A point force, a pin, a clamp or a support pushes on a small patch, and the stress must *transition* from that concentrated pattern to the uniform one further in.

**Saint-Venant's principle** (Govindjee §6.3):

> The manner in which loads are applied only matters near the points of application.

How near is "near"? For slender bodies, about **one characteristic length** — a representative dimension of the cross-section (for a 2-D bar, its width $w$). Quantitatively: for a linear elastic 2-D bar loaded by a single point force at its end, the exact stresses one width away from the end differ from the uniform $R/A$ by only about 2.5 %. Supports apply loads too, so the same caveat holds at both ends of a bar.`,
      {
        title: "Loads matter only locally",
        visual: {
          kind: "axial-bar",
          config: {
            segments: [{ length: 400, E: 70000, A: 800, label: "aluminium, 20 mm × 40 mm" }],
            loads: [{ x: 400, P: 32000, label: "P" }],
            fixed: "left",
            show: ["R", "sigma"],
            units: BAR_UNITS,
          },
        },
      },
    ),
    tf("sv-concentrations", {
      statement: "Saint-Venant's principle says that stress concentrations at holes and fillets can be ignored.",
      answer: false,
      feedback: "The principle is about how loads are *applied*. Does it promise anything about holes?",
      hint: "The principle compares different ways of applying the same resultant load. What does it say happens *near* the point of application?",
      explanation: r`False. The principle says the *details of load application* matter only near the load — far away, statically equivalent loads give the same stresses. Near loads, and near rapid changes of geometry such as holes and fillets, the uniform-stress formulas are inaccurate; there the true peak stress can be several times $R/A$, which is exactly what stress concentration factors quantify.`,
      tags: ["saint-venant"],
    }),
    mc("how-far", {
      body: r`A $20\,\mathrm{mm} \times 40\,\mathrm{mm}$ steel bar, $1.5\,\mathrm{m}$ long, is pulled by grips that clamp its ends.`,
      question: r`From roughly what distance from each grip can you trust $\sigma = R/A$?`,
      choices: [
        ["one", r`About $40\,\mathrm{mm}$ — one cross-section dimension (the larger one, to be safe).`],
        ["tiny", r`About $2\,\mathrm{mm}$ — the disturbance dies out almost immediately.`, "The transition zone scales with the cross-section, not with some tiny fixed length."],
        ["tenth", r`About $150\,\mathrm{mm}$ — a tenth of the bar's length.`, "The relevant length is a *cross-section* dimension, not the bar's length."],
        ["never", "Nowhere — a clamped bar never reaches a uniform stress.", "It does: the stress becomes practically uniform about one characteristic length from the grips."],
      ],
      correct: "one",
      shuffle: true,
      hint: r`"Sufficiently far" is measured in characteristic lengths — and the characteristic length of a slender bar is a dimension of its cross-section.`,
      explanation: r`For slender bodies "sufficiently far" means about one characteristic length, a representative cross-section dimension. Here that is $20$–$40\,\mathrm{mm}$; the larger value, $40\,\mathrm{mm}$, is the safe choice. Beyond it the stress is within a few percent of $R/A$; closer to the grips it is not.`,
      tags: ["saint-venant"],
    }),
    mc("two-point-five", {
      question: "What does the 2.5 % figure quoted with Saint-Venant's principle refer to?",
      choices: [
        ["sv", r`For a 2-D elastic bar loaded by a point force at its end, the exact stress one width from the end differs from $R/A$ by about 2.5 %.`],
        ["yield", "The amount by which a point load raises the yield stress of the material.", "Saint-Venant's principle is about stress distributions, not material properties."],
        ["k", "A small circular hole raises the stress by 2.5 %.", r`Far more than that: a small circular hole has $K = 3$, a 200 % increase.`],
        ["poisson", "The lateral contraction of a bar at its yield load.", "Unrelated — the figure measures how quickly a concentrated load spreads out."],
      ],
      correct: "sv",
      shuffle: true,
      hint: "It quantifies how quickly a concentrated end load spreads into a uniform stress.",
      explanation: r`Solving the full 2-D elasticity equations for a bar loaded by a single point force at one end shows that, one characteristic distance (the width) from the end, the stresses differ from the uniform engineering value $R/A$ by only about 2.5 %. That is the quantitative backing for "one characteristic length is far enough".`,
      tags: ["saint-venant"],
    }),
    reading(
      "concentrations",
      r`The same theories also fail near **rapid changes of geometry** (or of modulus): holes, notches, grooves, keyways, the fillet where a shaft steps down. There the true peak stress is a factor $K$, the **stress concentration factor**, above the engineering ("nominal") value:

$$\sigma_{\max} = K\,\sigma_{\mathrm{nom}}, \qquad \sigma_{\mathrm{nom}} = \frac{P}{t(w - d)} \quad \text{for a bar with a hole,}$$

with $t$ the thickness, $w$ the width and $d$ the hole diameter, so $t(w - d)$ is the net area left at the hole.

For an elliptical hole with axis $a$ **across** the load and axis $b$ **along** it (valid while $a$ is small compared with $w$):

$$K = 1 + \frac{2a}{b}.$$

A circular hole ($a = b$) gives $K = 3$. A slit across the load ($b \to 0$) gives an enormous $K$ — which is why cracks are so dangerous — while an ellipse elongated along the load is milder. The peak sits at the edge of the hole, on the section through its centre across the load. For a stepped bar, $K$ depends on the fillet ratio $r/d$: the sharper the fillet (smaller $r/d$), the larger $K$. In practice $K$ comes from numerical solutions of the full equations or from handbook charts.`,
      { title: "Stress concentrations" },
    ),
    numeric("nominal", {
      body: HOLE_BAR,
      question: r`What is the nominal stress at the section through the hole (MPa)?`,
      answer: 50, // check: P/(t(w − d)) = 40 000/(10·80) = 40 000/800 = 50 MPa
      tolerance: 0.5,
      suffix: "MPa",
      hint: "The nominal stress uses the net area that remains at the hole.",
      explanation: r`$\sigma_{\mathrm{nom}} = P/(t(w - d)) = 40\,000/(10 \times 80) = 50\,\mathrm{MPa}$. (Away from the hole the stress is $P/(tw) = 40\,\mathrm{MPa}$.)`,
      tags: ["stress-concentration"],
    }),
    numeric("peak", {
      body: r`${HOLE_BAR} For $d/w = 0.2$ a handbook chart gives $K = 2.5$ (based on the net-section stress).`,
      question: r`What is the peak stress at the edge of the hole (MPa)?`,
      answer: 125, // check: σmax = K·σnom = 2.5 · 50 = 125 MPa
      tolerance: 1.25,
      suffix: "MPa",
      hint: "The factor multiplies the nominal (net-section) stress, not the stress far from the hole.",
      explanation: r`$\sigma_{\max} = K\sigma_{\mathrm{nom}} = 2.5 \times 50 = 125\,\mathrm{MPa}$ — two and a half times what the engineering formula predicts at that section. Yielding or fatigue cracking starts right there.`,
      tags: ["stress-concentration"],
    }),
    numeric("k-circle", {
      question: r`Using $K = 1 + 2a/b$, what is the stress concentration factor of a small circular hole in a wide plate?`,
      answer: 3, // check: a = b ⇒ K = 1 + 2 = 3
      tolerance: 0.01,
      prefix: r`$K =$`,
      hint: "A circle is an ellipse with equal axes.",
      explanation: r`$a = b \Rightarrow K = 1 + 2 = 3$: the stress at the edge of a small circular hole is three times the stress far away — whatever the hole's size, as long as it is small compared with the width.`,
      tags: ["stress-concentration"],
    }),
    numeric("k-ellipse", {
      question: r`An elliptical hole has its long axis across the load, four times its short axis ($a = 4b$). What is $K$?`,
      answer: 9, // check: K = 1 + 2·(a/b) = 1 + 2·4 = 9
      tolerance: 0.01,
      prefix: r`$K =$`,
      hint: r`Which of $a$ and $b$ is the axis across the load? Substitute the ratio.`,
      explanation: r`$K = 1 + 2a/b = 1 + 2 \times 4 = 9$. Turned the other way (long axis along the load, $a = b/4$) the same hole would give only $1 + 0.5 = 1.5$.`,
      tags: ["stress-concentration"],
    }),
    tf("narrow-ellipse", {
      statement: r`Keeping the hole's width $a$ across the load fixed, making the ellipse narrower along the load (smaller $b$) increases the stress concentration factor.`,
      answer: true,
      feedback: r`Look at where $b$ sits in $K = 1 + 2a/b$.`,
      hint: "A narrower ellipse has sharper ends. What does sharpness do to the peak stress?",
      explanation: r`True. $K = 1 + 2a/b$ grows as $b$ shrinks: the ends of the ellipse get sharper. In the limit $b \to 0$ (a crack across the load) the elastic $K$ becomes unbounded — which is why cracks are so dangerous, and why a round "stop hole" is sometimes drilled at a crack tip.`,
      tags: ["stress-concentration"],
    }),
    mc("where-max", {
      question: "A plate with a small circular hole is pulled in tension. Where is the stress highest?",
      choices: [
        ["sides", "At the edge of the hole, at the two points on the section through its centre perpendicular to the load."],
        ["poles", "At the edge of the hole, at the two points in line with the load.", "There the stress along the hole's edge is actually compressive (about minus the remote stress). The peak is 90° away."],
        ["edges", "At the outer edges of the plate, level with the hole.", "On the net section the stress is highest right next to the hole, not at the plate's edges."],
        ["far", "Far from the hole, where the full load is carried.", r`Far away the stress is just the remote value $P/(tw)$ — the lowest of these options.`],
      ],
      correct: "sides",
      shuffle: true,
      hint: "Picture the lines of force flowing along the plate and detouring around the hole. Where do they crowd together?",
      explanation: r`The lines of force must detour around the hole and crowd together at its sides, on the cross-section through the hole perpendicular to the load. There the stress reaches $K\sigma_{\mathrm{nom}}$ (three times the remote stress for a small circular hole). At the two points in line with the load it is actually compressive.`,
      tags: ["stress-concentration"],
    }),
    multi("need-k", {
      question: r`Select **every** location where $\sigma = R/A$ is **not** a reliable estimate of the local stress.`,
      choices: [
        ["hole", "The edge of a bolt hole in a tie bar"],
        ["fillet", "The fillet where a shaft steps down to a smaller diameter"],
        ["groove", "The bottom of a groove machined for a retaining ring"],
        ["grip", "Right under the grips that apply the load"],
        ["middle", "Mid-length of a long, uniform, homogeneous bar, far from its ends"],
      ],
      correct: ["hole", "fillet", "groove", "grip"],
      hint: "Look for rapid changes of geometry and for points where load is applied. Which location has neither?",
      explanation: r`Holes, fillets and grooves are rapid changes of geometry (stress concentrations, $K > 1$); right under the grips the load enters over a small patch (a Saint-Venant zone). Only far from the ends of a uniform, homogeneous bar is the stress really uniform and equal to $R/A$.`,
      tags: ["stress-concentration", "saint-venant"],
    }),
    numeric("max-load", {
      body: r`A steel tie bar $w = 50\,\mathrm{mm}$ wide and $t = 10\,\mathrm{mm}$ thick has a central hole of diameter $d = 10\,\mathrm{mm}$; for $d/w = 0.2$ the chart gives $K = 2.5$ (net-section basis). The steel yields at $\sigma_Y = 250\,\mathrm{MPa}$.`,
      question: r`What is the largest tension the bar can carry without the peak stress exceeding yield (kN)?`,
      answer: 40, // check: P = σY·t(w − d)/K = 250·10·40/2.5 = 100 000/2.5 = 40 000 N = 40 kN
      tolerance: 0.4,
      suffix: "kN",
      hint: r`Require the *peak* stress, not the nominal one, to stay at or below yield; then solve for $P$.`,
      explanation: r`$K\,P/(t(w - d)) \le \sigma_Y \Rightarrow P \le \sigma_Y\,t(w - d)/K = 250 \times 10 \times 40/2.5 = 40\,000\,\mathrm{N} = 40\,\mathrm{kN}$. Ignoring the concentration would allow $100\,\mathrm{kN}$ — two and a half times too much.`,
      tags: ["stress-concentration", "design"],
    }),
    reading(
      "summary",
      r`**What you did:** located where the engineering formulas break down, and corrected the peak stress near geometric changes.

- Saint-Venant: "The manner in which loads are applied only matters near the points of application." Trust $R/A$ from about one cross-section dimension away from loads and supports (about 2.5 % error one width from an end point load in 2-D).
- Stress concentration: $\sigma_{\max} = K\sigma_{\mathrm{nom}}$; for a bar with a hole $\sigma_{\mathrm{nom}} = P/(t(w - d))$.
- Elliptical hole (axis $a$ across the load, $b$ along it): $K = 1 + 2a/b$; circle $K = 3$; sharper means larger $K$.
- Fillets and other details: $K$ from charts (versus $r/d$) or numerical solutions.

You've finished the unit — take the **Level Check**.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit practice bank                                                   */
/* ------------------------------------------------------------------ */

export const sm5: Unit = {
  id: "sm5",
  title: "Pressure vessels and Saint-Venant",
  subtitle: "Axial rods as 3-D objects, thin-walled vessels, local effects",
  description: "Use the full stress–strain machinery on three classic problems: the axial rod seen in 3-D, thin-walled cylindrical and spherical pressure vessels, and Saint-Venant's principle.",
  textbook: "Govindjee ch. 6",
  lessons: [l1, l2, l3, l4],
  practice: [
    mc("p-composite-share", {
      question: r`A rod has a copper core ($E = 120\,\mathrm{GPa}$) bonded inside a steel tube ($E = 200\,\mathrm{GPa}$). At some cross-section the copper carries $\sigma = 60\,\mathrm{MPa}$. What is the axial stress in the steel there?`,
      choices: [
        ["c36", r`$36\,\mathrm{MPa}$`, "That's the modulus ratio upside down: the stiffer steel carries *more* stress."],
        ["c60", r`$60\,\mathrm{MPa}$`, "Equal stresses would need equal moduli; the shared quantity is the strain."],
        ["c100", r`$100\,\mathrm{MPa}$`],
        ["c200", r`$200\,\mathrm{MPa}$`, "That's the steel's modulus in GPa, not a stress."],
      ],
      correct: "c100",
      shuffle: true,
      hint: "Plane sections remain plane: what do the two materials share?",
      explanation: r`Same strain: $\varepsilon = 60/120\,000 = 5 \times 10^{-4}$, so $\sigma_{\mathrm{steel}} = 200\,000 \times 5 \times 10^{-4} = 100\,\mathrm{MPa}$ (i.e. $60 \times 200/120$).`,
      tags: ["composite-bar"],
    }),
    numeric("p-composite-ultimate", {
      question: r`A bar is made of two bonded elastic–perfectly plastic materials running its full length: $A_1 = 400\,\mathrm{mm^2}$ with $\sigma_{Y1} = 250\,\mathrm{MPa}$, and $A_2 = 600\,\mathrm{mm^2}$ with $\sigma_{Y2} = 150\,\mathrm{MPa}$. What is its ultimate axial load (kN)?`,
      answer: 190, // check: 250·400 + 150·600 = 100 000 + 90 000 = 190 000 N
      tolerance: 1.9,
      suffix: "kN",
      hint: "At the ultimate load every part of the section is at its own yield stress.",
      explanation: r`$R_{\mathrm{ult}} = \sigma_{Y1}A_1 + \sigma_{Y2}A_2 = 250 \times 400 + 150 \times 600 = 100\,000 + 90\,000 = 190\,000\,\mathrm{N} = 190\,\mathrm{kN}$.`,
      tags: ["composite-bar", "plasticity"],
    }),
    tf("p-no-lateral", {
      statement: r`Because the axial-bar theory assumes $v = w = 0$, it predicts that a stretched bar does not get any thinner.`,
      answer: false,
      feedback: "Which of the two assumptions produces the Poisson strains?",
      hint: "After the 1-D problem is solved, which assumption gives you the lateral strains?",
      explanation: r`False. The kinematic assumption $v = w = 0$ is used to build the 1-D theory, but the uniaxial-stress assumption with Hooke's law then gives the lateral strains $\varepsilon_{yy} = \varepsilon_{zz} = -\nu\sigma_{xx}/E$, computed after the fact. The mismatch is harmless because those strains carry no strain energy.`,
      tags: ["poisson", "assumptions"],
    }),
    numeric("p-cyl-axial", {
      question: r`A closed cylindrical boiler of **diameter** $1.5\,\mathrm{m}$ with a $15\,\mathrm{mm}$ wall holds $p = 2.4\,\mathrm{MPa}$. What is the axial wall stress (MPa)?`,
      answer: 60, // check: R = 750 mm; pR/(2t) = 2.4·750/30 = 60 MPa
      tolerance: 0.6,
      suffix: "MPa",
      hint: "The thin-wall formulas use the radius.",
      explanation: r`$R = 750\,\mathrm{mm}$, so $\sigma_{zz} = pR/(2t) = 2.4 \times 750/30 = 60\,\mathrm{MPa}$ (and $\sigma_{\theta\theta} = 120\,\mathrm{MPa}$). Using the diameter in place of $R$ would double the answer.`,
      tags: ["pressure-vessel", "axial-stress"],
    }),
    numeric("p-vessel-thickness", {
      question: r`A cylindrical tank of diameter $800\,\mathrm{mm}$ must hold $p = 5\,\mathrm{MPa}$. The steel yields at $300\,\mathrm{MPa}$ and the safety factor is $1.5$. Using largest normal stress $\le \sigma_Y/\mathrm{SF}$, what wall thickness is required (mm)?`,
      answer: 10, // check: σallow = 300/1.5 = 200 MPa; t = pR/σallow = 5·400/200 = 10 mm
      tolerance: 0.1,
      suffix: "mm",
      hint: "Find the allowable stress first; the hoop stress governs.",
      explanation: r`$\sigma_{\mathrm{allow}} = 300/1.5 = 200\,\mathrm{MPa}$ and $t = pR/\sigma_{\mathrm{allow}} = 5 \times 400/200 = 10\,\mathrm{mm}$ ($R/t = 40$, thin).`,
      tags: ["pressure-vessel", "vessel-design", "safety-factor"],
    }),
    numeric("p-hoop-dr", {
      question: r`A closed aluminium cylinder ($E = 70\,\mathrm{GPa}$, $\nu = 0.33$) has $R = 300\,\mathrm{mm}$ and $t = 6\,\mathrm{mm}$ and holds $p = 1.4\,\mathrm{MPa}$. By how much does its radius grow (mm)? Give three significant figures.`,
      answer: 0.2505, // check: σθθ = 1.4·300/6 = 70 MPa, σzz = 35 MPa; εθθ = (70 − 0.33·35)/70 000 = 58.45/70 000 = 8.35e-4; ΔR = 8.35e-4·300 = 0.2505 mm
      tolerance: 0.0025,
      suffix: "mm",
      answerDisplay: r`0.251\,\mathrm{mm}`,
      hint: "Hoop strain from plane-stress Hooke's law (don't forget the axial stress), then multiply by the radius.",
      explanation: r`$\sigma_{\theta\theta} = pR/t = 70\,\mathrm{MPa}$ and $\sigma_{zz} = 35\,\mathrm{MPa}$. $\varepsilon_{\theta\theta} = (70 - 0.33 \times 35)/70\,000 = 58.45/70\,000 = 8.35 \times 10^{-4}$, so $\Delta R = 8.35 \times 10^{-4} \times 300 = 0.251\,\mathrm{mm}$.`,
      tags: ["pressure-vessel", "vessel-strain"],
    }),
    mc("p-sphere-stress", {
      question: r`A spherical tank ($R = 600\,\mathrm{mm}$, $t = 8\,\mathrm{mm}$) holds $p = 2\,\mathrm{MPa}$. Its wall stress is…`,
      choices: [
        ["s37", r`$37.5\,\mathrm{MPa}$`, r`That is $pR/(4t)$ — the largest weld shear in a cylinder, not the sphere's membrane stress.`],
        ["s75", r`$75\,\mathrm{MPa}$`],
        ["s150", r`$150\,\mathrm{MPa}$`, r`That is $pR/t$, the hoop stress of a *cylinder* with the same $R$ and $t$.`],
        ["s300", r`$300\,\mathrm{MPa}$`, "Too large by a factor of four — redo the hemisphere FBD."],
      ],
      correct: "s75",
      shuffle: true,
      hint: "Hemisphere free-body diagram.",
      explanation: r`$\sigma_{\theta\theta} = \sigma_{\phi\phi} = pR/(2t) = 2 \times 600/16 = 75\,\mathrm{MPa}$, the same in every tangential direction.`,
      tags: ["pressure-vessel", "sphere"],
    }),
    numeric("p-weld-shear", {
      question: r`A closed cylinder ($R = 480\,\mathrm{mm}$, $t = 8\,\mathrm{mm}$, $p = 2.5\,\mathrm{MPa}$) has a helical weld whose line makes $30^\circ$ with the cylinder's axis. What is the magnitude of the shear stress on the weld (MPa)?`,
      answer: 32.48, // check: σθθ = 2.5·480/8 = 150, σzz = 75; |τ| = (150 − 75)·sin30°·cos30° = 75·0.43301 = 32.476 MPa
      tolerance: 0.33,
      suffix: "MPa",
      answerDisplay: r`32.5\,\mathrm{MPa}`,
      hint: r`Find $\sigma_{\theta\theta}$ and $\sigma_{zz}$, then resolve the traction $\boldsymbol{\sigma}\mathbf{n}$ along the weld.`,
      explanation: r`$\sigma_{\theta\theta} = pR/t = 150\,\mathrm{MPa}$ and $\sigma_{zz} = 75\,\mathrm{MPa}$, so $|\tau| = (\sigma_{\theta\theta} - \sigma_{zz})\sin\varphi\cos\varphi = 75 \times 0.5 \times 0.866 = 32.5\,\mathrm{MPa}$.`,
      tags: ["pressure-vessel", "weld"],
    }),
    numeric("p-balloon", {
      question: r`A spherical balloon of radius $4\,\mathrm{m}$ is made of film $0.02\,\mathrm{mm}$ thick that yields at $20\,\mathrm{MPa}$. At what differential pressure does the film yield? Answer **in pascals**.`,
      answer: 200, // check: p = 2tσY/R = 2·0.02·20/4000 = 2.0e-4 MPa = 200 Pa
      tolerance: 2,
      suffix: "Pa",
      hint: "Set the sphere's wall stress equal to the yield stress; keep lengths in mm and convert MPa to Pa at the end.",
      explanation: r`$p = 2t\sigma_Y/R = 2 \times 0.02 \times 20/4000 = 2 \times 10^{-4}\,\mathrm{MPa} = 200\,\mathrm{Pa}$.`,
      tags: ["pressure-vessel", "sphere"],
    }),
    numeric("p-hole", {
      question: r`A plate $80\,\mathrm{mm}$ wide and $12\,\mathrm{mm}$ thick with a central $20\,\mathrm{mm}$ hole carries $54\,\mathrm{kN}$ of tension. With $K = 2.4$ (net-section basis), what is the peak stress at the hole (MPa)?`,
      answer: 180, // check: σnom = 54 000/(12·(80 − 20)) = 54 000/720 = 75 MPa; σmax = 2.4·75 = 180 MPa
      tolerance: 1.8,
      suffix: "MPa",
      hint: "Nominal stress on the net section first, then the factor.",
      explanation: r`$\sigma_{\mathrm{nom}} = 54\,000/(12 \times 60) = 75\,\mathrm{MPa}$ and $\sigma_{\max} = 2.4 \times 75 = 180\,\mathrm{MPa}$.`,
      tags: ["stress-concentration"],
    }),
    tf("p-saint-venant", {
      statement: "Replacing a point force on the end of a bar by a uniform pressure with the same resultant changes the stresses noticeably only within about one cross-section dimension of the end.",
      answer: true,
      feedback: "Two statically equivalent ways of applying the same load — what does Saint-Venant's principle say about them far from the end?",
      hint: "This is Saint-Venant's principle at work.",
      explanation: r`True. Statically equivalent loads give practically the same stresses beyond about one characteristic length — about 2.5 % difference one width away for a 2-D bar.`,
      tags: ["saint-venant"],
    }),
    numeric("p-equal-stresses", {
      question: r`A closed cylinder ($R = 200\,\mathrm{mm}$, $t = 5\,\mathrm{mm}$) holds $p = 2\,\mathrm{MPa}$. What additional axial tension $F$ on its end caps makes $\sigma_{zz} = \sigma_{\theta\theta}$ (kN)?`,
      answer: 251.3, // check: F = πR²p = π·200²·2 = π·80 000 = 251 327 N = 251.3 kN
      tolerance: 2.5,
      suffix: "kN",
      answerDisplay: r`251\,\mathrm{kN}`,
      hint: r`The force adds $F/(2\pi Rt)$ to the axial stress; set the two stresses equal.`,
      explanation: r`$pR/(2t) + F/(2\pi Rt) = pR/t \Rightarrow F = \pi R^2 p = \pi \times 200^2 \times 2 = 251\,327\,\mathrm{N} \approx 251\,\mathrm{kN}$ — independent of $t$.`,
      tags: ["pressure-vessel", "combined-loading"],
    }),
  ],
  generators: [
    "gen.sm.poisson-lateral",
    "gen.sm.vessel-cyl",
    "gen.sm.vessel-sphere",
    "gen.sm.vessel-thickness",
    "gen.sm.vessel-strain",
    "gen.sm.composite-bar",
  ],
};
