import type { Unit } from "../types";
import { lesson, mc, multi, numeric, r, reading, tf } from "../dsl";

/*
 * Unit sm7 · Bending of beams (Govindjee §8.1–8.3).
 *
 * Sign conventions follow the course text exactly:
 *   - x along the beam, y UP, z out of the page; y in ε = −κy is measured from the neutral axis.
 *   - R = ∫σxx dA, V = ∫σxy dA, M = −∫yσxx dA on the face with outward normal +e_x.
 *   - q(x) = load per length, positive UP; dV/dx + q = 0, dM/dx + V = 0.
 *   - Cantilever built in at x = 0, downward tip load P: V = −P, M = P(x − L).
 *   - This V is the NEGATIVE of the Beer & Johnston / Hibbeler shear force.
 * Units: N, mm, N/mm² = MPa unless a problem says otherwise (1 kN·m = 10⁶ N·mm, 1 kN·m² = 10⁹ N·mm²).
 */

const SECTION_UNITS = { moment: "N·mm", length: "mm", stress: "MPa" };
const BEAM_UNITS = { length: "m", force: "kN" };

/* ------------------------------------------------------------------ */
/* Lesson 1 · Kinematics of bending (Govindjee §8.1)                   */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "sm7-l1-kinematics-of-bending",
    unitId: "sm7",
    title: "Kinematics of bending",
    summary: "Plane sections stay plane and normal, so the bending strain is linear through the depth: εxx = −κy.",
    textbook: "Govindjee §8.1",
    minutes: 12,
  },
  [
    reading(
      "observations",
      r`A **beam** is a slender body loaded *transversely*, perpendicular to its axis. Take a straight prismatic beam whose cross-section has a **vertical line of symmetry**, with the book's axes: $x$ along the beam, $y$ **up**, $z$ out of the page. The loads act in the $x$–$y$ plane, so the beam bends about $z$.

When the length is at least about 10 times the depth, experiments show three things:

1. **Plane sections remain plane.** Each cross-section moves as a rigid slice, described by one vertical displacement $v(x)$ and one rotation $\theta(x)$.
2. **Normals remain normal.** Lines scribed along $x$ and $y$ stay perpendicular, so there is no shear strain in the $x$–$y$ plane: $\gamma_{xy} = 0$.
3. **All sections rotate about the same line**, the line of centres of rotation, which sits at the same height in every section.

Because each section stays perpendicular to the bent axis, $\tan\theta = \mathrm{d}v/\mathrm{d}x$, and for small rotations $\tan\theta \approx \theta$:

$$\theta = \frac{\mathrm{d}v}{\mathrm{d}x}, \qquad \kappa = \frac{\mathrm{d}\theta}{\mathrm{d}x} = \frac{\mathrm{d}^2 v}{\mathrm{d}x^2}.$$

$\kappa$ is the **curvature** (units 1/length; radius of curvature $\rho = 1/|\kappa|$). Beams that obey these assumptions are **Bernoulli–Euler beams**. The assumptions are purely kinematic: they hold for elastic, plastic and composite sections alike.

The section below is bent about $z$. Move the slider and watch the bending stress, and with it the strain, vary *linearly* with height and vanish on one line.`,
      {
        title: "Plane sections stay plane",
        visual: { kind: "beam-section", config: { M: 2000000, section: { kind: "rect", b: 40, h: 80 }, sliders: true, units: SECTION_UNITS } },
      },
    ),
    tf("normals-normal", {
      statement: r`"Normals remain normal" is the statement that the engineering shear strain $\gamma_{xy}$ is zero in a Bernoulli–Euler beam.`,
      answer: true,
      feedback: r`Which strain component measures the change of the angle between the $x$ and $y$ directions?`,
      hint: r`Engineering shear strain $\gamma_{xy}$ is the decrease of a right angle. What happens to the right angle between a line along $x$ and a line along $y$?`,
      explanation: r`True. $\gamma_{xy}$ is the decrease of the right angle between fibres that were along $x$ and $y$. If the scribed lines stay orthogonal, that decrease is zero, so $\gamma_{xy} = 0$. A real beam still carries a shear force $V$; the small shear strains that go with it are simply neglected in the kinematics (Govindjee recovers the shear stresses from equilibrium in §8.6).`,
      tags: ["kinematics"],
    }),
    mc("small-rotation", {
      question: r`Why can the rotation of a cross-section be written as $\theta = \mathrm{d}v/\mathrm{d}x$?`,
      choices: [
        ["normal", r`Normals remain normal, so the section turns through the slope angle of the bent axis, $\tan\theta = \mathrm{d}v/\mathrm{d}x$; for small rotations $\tan\theta \approx \theta$.`],
        ["plane", "Plane sections remain plane, and that alone ties the rotation to the slope.", "Plane sections alone only say each section moves rigidly; it could still tilt relative to the axis (that is what shear deformation does). The link to the slope comes from normals remaining normal."],
        ["elastic", "The material is linear elastic.", "The kinematics never use a material law; they hold for plastic and composite beams too."],
        ["degrees", r`$\theta$ is measured in degrees, and for small angles degrees equal radians.`, r`Degrees never equal radians. The small-angle step $\tan\theta \approx \theta$ needs $\theta$ in radians.`],
      ],
      correct: "normal",
      shuffle: true,
      hint: "Two ingredients: which observation ties each section to the deformed axis, and which approximation turns tan θ into θ?",
      explanation: r`Because normals remain normal, each cross-section stays perpendicular to the deformed axis, so it turns through the same angle as the axis's tangent: $\tan\theta = \mathrm{d}v/\mathrm{d}x$. For small rotations ($\theta$ in radians, $|\theta| \ll 1$) $\tan\theta \approx \theta$, so $\theta = v'$ and $\kappa = \theta' = v''$.`,
      tags: ["kinematics"],
    }),
    numeric("rotation-diff", {
      body: r`A segment of a beam has constant curvature $\kappa = 1 \times 10^{-5}\ \mathrm{mm^{-1}}$.`,
      question: r`By how much do the rotations of two cross-sections $200\ \mathrm{mm}$ apart differ? Give $\theta_2 - \theta_1$ in radians, where section 2 is the one $200\ \mathrm{mm}$ further along $+x$.`,
      answer: 0.002, // check: Δθ = ∫κ dx = (1e-5 /mm)(200 mm) = 2e-3 rad
      tolerance: 0.00002,
      suffix: "rad",
      answerDisplay: r`0.002\ \mathrm{rad}`,
      hint: r`Curvature is the rate of change of rotation along the beam, $\kappa = \mathrm{d}\theta/\mathrm{d}x$. Integrate it over the gap.`,
      explanation: r`$\kappa = \mathrm{d}\theta/\mathrm{d}x$, so $\theta_2 - \theta_1 = \int \kappa\,\mathrm{d}x = \kappa\,\Delta x = (1 \times 10^{-5}\ \mathrm{mm^{-1}})(200\ \mathrm{mm}) = 2 \times 10^{-3}\ \mathrm{rad}$. The units cancel to radians, and the angle is small, as the theory assumes.`,
      tags: ["curvature"],
    }),
    reading(
      "bending-strain",
      r`Now find the strain of a fibre. Put the $x$-axis on the line of centres of rotation and follow a strip at height $y$ above it, in a slice of length $\Delta x$ (Govindjee Fig. 8.4). A section that rotates by $\theta$ moves a point at height $y$ horizontally by $-y\theta$ (a counterclockwise rotation pushes points above the axis backwards). The strip's new length is

$$\Delta x - y\,\theta(x + \Delta x) + y\,\theta(x),$$

so its strain is

$$\varepsilon_{xx} = \lim_{\Delta x \to 0} \frac{-y\,\theta(x + \Delta x) + y\,\theta(x)}{\Delta x} = -y\frac{\mathrm{d}\theta}{\mathrm{d}x} = -y\frac{\mathrm{d}^2 v}{\mathrm{d}x^2} = -\kappa y.$$

- This is the fundamental kinematic relation of beam theory, the analogue of $\gamma = r\,\mathrm{d}\phi/\mathrm{d}z$ in torsion.
- The strain is **linear in $y$**. It is zero on the line $y = 0$, the **neutral axis**, and largest at the outer fibres (the top and bottom *chords*).
- **$y$ is measured from the neutral axis**, not from the bottom. Where that axis sits is not known yet. Equilibrium will fix it (lesson 3), and it need not be at mid-depth.
- $\gamma_{xy} = 0$ (normals stay normal), and $\varepsilon_{yy}$ is not needed (the plane-stress argument of Govindjee ch. 6).
- Sign: $\kappa > 0$ means $v'' > 0$. The beam is concave up (**sagging**), so fibres above the neutral axis shorten ($\varepsilon_{xx} < 0$) and fibres below it stretch.`,
      { title: "Bending strain: ε = −κy" },
    ),
    numeric("strain-top", {
      body: r`A beam $80\ \mathrm{mm}$ deep has its neutral axis at mid-depth. At one section the curvature is $\kappa = 2 \times 10^{-5}\ \mathrm{mm^{-1}}$.`,
      question: r`What is the bending strain $\varepsilon_{xx}$ at the top fibre ($y = +40\ \mathrm{mm}$)? Answer in micro-strain ($10^{-6}$), with sign.`,
      answer: -800, // check: ε = −κy = −(2e-5 /mm)(40 mm) = −8e-4 = −800 μ
      tolerance: 8,
      prefix: r`$\varepsilon_{xx} =$`,
      suffix: "μ",
      answerDisplay: r`-800 \times 10^{-6}`,
      hint: r`Use $\varepsilon_{xx} = -\kappa y$ with $y$ measured up from the neutral axis. Watch the minus sign.`,
      explanation: r`$\varepsilon_{xx} = -\kappa y = -(2 \times 10^{-5}\ \mathrm{mm^{-1}})(+40\ \mathrm{mm}) = -8 \times 10^{-4} = -800\ \mu$. Positive curvature (sagging) shortens the fibres above the neutral axis, so the top is in compression.`,
      tags: ["bending-strain"],
    }),
    numeric("strain-bottom", {
      question: r`Same section: what is $\varepsilon_{xx}$ at the bottom fibre ($y = -40\ \mathrm{mm}$)? Answer in micro-strain, with sign.`,
      answer: 800, // check: ε = −κy = −(2e-5)(−40) = +8e-4 = +800 μ
      tolerance: 8,
      prefix: r`$\varepsilon_{xx} =$`,
      suffix: "μ",
      answerDisplay: r`+800 \times 10^{-6}`,
      hint: r`Same formula, but now $y$ is negative.`,
      explanation: r`$\varepsilon_{xx} = -\kappa y = -(2 \times 10^{-5})(-40) = +8 \times 10^{-4} = +800\ \mu$: the bottom fibre stretches. With the neutral axis at mid-depth the top and bottom strains are equal and opposite. The strain profile is a straight line through zero at $y = 0$ with slope $-\kappa$.`,
      tags: ["bending-strain"],
    }),
    mc("positive-kappa", {
      question: r`At a section the curvature is positive, $\kappa = v'' > 0$. Which description is correct?`,
      choices: [
        ["sag", "The beam is concave up (sagging). Fibres above the neutral axis are compressed and fibres below are stretched."],
        ["hog", "The beam is concave down (hogging), and the top fibres are stretched.", r`Concave down means $v'' < 0$. Positive $\kappa$ is the "smile" shape.`],
        ["sag-top-tension", "The beam is concave up, and the top fibres are stretched.", r`Put $y > 0$ into $\varepsilon_{xx} = -\kappa y$ with $\kappa > 0$: the strain is negative, so the top is in compression.`],
        ["uniform", r`Every fibre stretches by the same strain $\kappa$.`, r`That would be axial stretching. In bending the strain is $-\kappa y$, which changes sign across the neutral axis.`],
      ],
      correct: "sag",
      shuffle: true,
      hint: r`A positive second derivative of $v$ means the curve bends upward. Then put $y > 0$ into $\varepsilon_{xx} = -\kappa y$.`,
      explanation: r`$\kappa = v'' > 0$ is a concave-up ("smile") shape: sagging. From $\varepsilon_{xx} = -\kappa y$, fibres with $y > 0$ have $\varepsilon_{xx} < 0$ (compression) and fibres with $y < 0$ have $\varepsilon_{xx} > 0$ (tension). A simply supported beam under a downward load sags like this. A cantilever under a downward tip load hogs ($\kappa < 0$, top in tension).`,
      tags: ["bending-strain", "sign-convention"],
    }),
    mc("unstrained", {
      question: "Which fibres of a bent Bernoulli–Euler beam have zero bending strain?",
      choices: [
        ["na", r`Those on the neutral axis, the line of centres of rotation, where $y = 0$.`],
        ["mid", "Those at mid-depth, in every beam.", "Only when the neutral axis happens to be at mid-depth, as in a homogeneous rectangle. Its location has to be found from equilibrium; for a T-section or a composite beam it is somewhere else."],
        ["outer", "The outer fibres (top and bottom chords).", r`Those are the most strained fibres: $|\varepsilon_{xx}| = |\kappa|\,|y|$ is largest where $|y|$ is largest.`],
        ["none", "None: every fibre stretches a little.", "That would need an axial force. Bending shortens fibres on one side of a line and stretches them on the other."],
      ],
      correct: "na",
      hint: r`Set $\varepsilon_{xx} = -\kappa y$ equal to zero with $\kappa \neq 0$.`,
      explanation: r`$\varepsilon_{xx} = -\kappa y$ vanishes only at $y = 0$, on the line about which the sections rotate. That line is the **neutral axis**. Kinematics does not fix its position in the section. Govindjee finds it in §8.3 from the condition that the axial force $R = \int_A \sigma_{xx}\,\mathrm{d}A$ is zero.`,
      tags: ["neutral-axis", "kinematics"],
    }),
    numeric("kappa-from-gauge", {
      body: r`A strain gauge bonded to the side of a beam, $30\ \mathrm{mm}$ **above** the neutral axis, reads $\varepsilon = -600\ \mu$ (that is, $-600 \times 10^{-6}$).`,
      question: r`What is the curvature $\kappa$ at that section? Answer in units of $10^{-5}\ \mathrm{mm^{-1}}$, with sign.`,
      answer: 2, // check: κ = −ε/y = −(−600e-6)/(30 mm) = 2e-5 /mm
      tolerance: 0.02,
      prefix: r`$\kappa =$`,
      suffix: r`$\times 10^{-5}\ \mathrm{mm^{-1}}$`,
      answerDisplay: r`2 \times 10^{-5}\ \mathrm{mm^{-1}}`,
      hint: r`Solve $\varepsilon_{xx} = -\kappa y$ for $\kappa$, keeping track of both signs.`,
      explanation: r`$\kappa = -\varepsilon/y = -(-600 \times 10^{-6})/(30\ \mathrm{mm}) = +2 \times 10^{-5}\ \mathrm{mm^{-1}}$. Compression above the neutral axis means positive curvature (sagging). This is how curvature is measured in the lab: one gauge at a known height gives $\kappa$, and the whole strain profile follows.`,
      tags: ["curvature", "strain-gauge"],
    }),
    numeric("radius", {
      question: r`What is the radius of curvature $\rho = 1/|\kappa|$ for $\kappa = 2 \times 10^{-5}\ \mathrm{mm^{-1}}$? Answer in metres.`,
      answer: 50, // check: ρ = 1/(2e-5 /mm) = 50 000 mm = 50 m
      tolerance: 0.5,
      prefix: r`$\rho =$`,
      suffix: "m",
      answerDisplay: r`50\ \mathrm{m}`,
      hint: r`With $\kappa$ in $\mathrm{mm^{-1}}$, $1/\kappa$ comes out in millimetres. Then convert.`,
      explanation: r`$\rho = 1/\kappa = 1/(2 \times 10^{-5}\ \mathrm{mm^{-1}}) = 5 \times 10^{4}\ \mathrm{mm} = 50\ \mathrm{m}$. A 50 m radius on a beam a few metres long is a barely visible curve, which is why the small-rotation assumption works so well.`,
      tags: ["curvature"],
    }),
    numeric("strain-from-v", {
      body: r`Measurements show that a segment of a beam deflects as $v(x) = -3 \times 10^{-6}\,x^2$, with $x$ and $v$ in mm.`,
      question: r`What is $\varepsilon_{xx}$ at $y = +50\ \mathrm{mm}$ above the neutral axis? Answer in micro-strain, with sign.`,
      answer: 300, // check: κ = v'' = −6e-6 /mm; ε = −κy = −(−6e-6)(50) = +3e-4 = +300 μ
      tolerance: 3,
      prefix: r`$\varepsilon_{xx} =$`,
      suffix: "μ",
      answerDisplay: r`+300 \times 10^{-6}`,
      hint: r`Curvature is the second derivative of the deflection. Then use $\varepsilon_{xx} = -\kappa y$.`,
      explanation: r`$\kappa = \mathrm{d}^2v/\mathrm{d}x^2 = -6 \times 10^{-6}\ \mathrm{mm^{-1}}$ (concave down: hogging). Then $\varepsilon_{xx} = -\kappa y = -(-6 \times 10^{-6})(50) = +3 \times 10^{-4} = +300\ \mu$. Hogging puts the top fibres in tension, as over an interior support or at the wall of a cantilever.`,
      tags: ["curvature", "bending-strain"],
    }),
    numeric("gauge-offset-na", {
      body: r`A two-material beam is $80\ \mathrm{mm}$ deep. Its neutral axis (found from the moduli, as in lesson 4) lies $50\ \mathrm{mm}$ above the bottom face. A strain gauge sits a quarter of the depth below the top face and reads $\varepsilon_g = -150\ \mu$.`,
      question: r`What is the curvature $\kappa$? Answer in units of $10^{-5}\ \mathrm{mm^{-1}}$, with sign.`,
      answer: 1.5, // check: gauge at y_b = 80 − 20 = 60 mm; y_g = 60 − 50 = 10 mm; κ = −ε/y = 150e-6/10 = 1.5e-5 /mm
      tolerance: 0.015,
      prefix: r`$\kappa =$`,
      suffix: r`$\times 10^{-5}\ \mathrm{mm^{-1}}$`,
      answerDisplay: r`1.5 \times 10^{-5}\ \mathrm{mm^{-1}}`,
      hint: r`First find the gauge's height above the **neutral axis** (not above the bottom, and not above mid-depth). Then solve $\varepsilon = -\kappa y$ for $\kappa$.`,
      explanation: r`The gauge is $h/4 = 20\ \mathrm{mm}$ below the top, so $60\ \mathrm{mm}$ above the bottom. The neutral axis is at $50\ \mathrm{mm}$, so the gauge is at $y_g = 60 - 50 = +10\ \mathrm{mm}$. Then $\kappa = -\varepsilon_g/y_g = -(-150 \times 10^{-6})/(10\ \mathrm{mm}) = 1.5 \times 10^{-5}\ \mathrm{mm^{-1}}$. Measuring from mid-depth instead ($y = 20\ \mathrm{mm}$) would give half the right answer. $y$ is always measured from the neutral axis.`,
      tags: ["curvature", "strain-gauge", "neutral-axis"],
    }),
    tf("kinematic-only", {
      statement: r`The relation $\varepsilon_{xx} = -\kappa y$ holds only if the beam is made of a homogeneous linear-elastic material.`,
      answer: false,
      feedback: "Look back at the derivation. Did it use Hooke's law anywhere?",
      hint: r`Which ingredients went into the derivation of $\varepsilon_{xx} = -\kappa y$: kinematics, equilibrium, or a material law?`,
      explanation: r`False. $\varepsilon_{xx} = -\kappa y$ follows from the kinematic assumptions alone (plane sections, normals normal, small rotations). It holds for elastic and plastic response and for composite sections, as long as the material layout keeps the vertical plane of symmetry. What *does* depend on the material is where the neutral axis sits and how the stress follows from the strain.`,
      tags: ["kinematics"],
    }),
    reading(
      "summary",
      r`**What you did:** turned three observations about slender beams into a strain field, then used it forwards (curvature to strain) and backwards (gauge reading to curvature).

$$\theta = \frac{\mathrm{d}v}{\mathrm{d}x}, \qquad \kappa = \frac{\mathrm{d}\theta}{\mathrm{d}x} = \frac{\mathrm{d}^2 v}{\mathrm{d}x^2}, \qquad \varepsilon_{xx} = -\kappa y, \qquad \gamma_{xy} = 0.$$

- $y$ is measured **up from the neutral axis** (the line of centres of rotation).
- $\kappa > 0$: sagging, top compressed. $\kappa < 0$: hogging, top stretched.
- Radius of curvature $\rho = 1/|\kappa|$. Between two sections $\Delta\theta = \int \kappa\,\mathrm{d}x$.

Next: the internal forces $V$ and $M$ that do the bending, and the book's sign convention for them.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Equilibrium: shear and moment diagrams (Govindjee §8.2)  */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "sm7-l2-equilibrium-shear-moment",
    unitId: "sm7",
    title: "Equilibrium: shear and moment diagrams",
    summary: "The book's sign convention for V and M, the slice equations dV/dx + q = 0 and dM/dx + V = 0, and the standard shear and moment diagrams.",
    textbook: "Govindjee §8.2",
    minutes: 15,
  },
  [
    reading(
      "sign-convention",
      r`Cut the beam at $x$ and look at the face whose outward normal is $+\mathbf{e}_x$ (the right end of the left-hand piece). Cauchy's law gives the traction $\mathbf{t} = \boldsymbol{\sigma}^T\mathbf{e}_x$, whose in-plane components are $\sigma_{xx}$ and $\sigma_{xy}$. Their resultants are the internal forces (Govindjee eqs 8.13–8.15):

$$R = \int_A \sigma_{xx}\,\mathrm{d}A, \qquad V = \int_A \sigma_{xy}\,\mathrm{d}A, \qquad M = -\int_A y\,\sigma_{xx}\,\mathrm{d}A.$$

- $R$ is the axial force (tension positive). With no axial load, $R = 0$.
- $V$, the **shear force**, is the resultant of $\sigma_{xy}$, so a positive $V$ on the $+x$ face points in **$+y$ (up)**.
- $M$ is the **bending moment** about $z$. The minus sign makes $M$ positive when the fibres above the neutral axis are compressed: positive $M$ means **sagging**. On the $+x$ face a positive $M$ turns **counterclockwise**.
- On the other side of the cut (outward normal $-\mathbf{e}_x$) everything reverses, by Newton's third law: positive $V$ points down and positive $M$ is clockwise.
- The distributed load $q(x)$ (force per length) is positive **upward**, so a downward load of intensity $w$ is $q = -w$.

> **Watch out:** Beer & Johnston and Hibbeler draw positive $V$ *downward* on the $+x$ face. Their $M$ agrees with ours, but their $V$ is the negative of Govindjee's, and their slope rule reads $\mathrm{d}M/\mathrm{d}x = +V$. In this course a cantilever built in at $x = 0$ with a downward tip load $P$ has $V = -P$, not $+P$.

The diagrams below are drawn in the course convention. Move the load on this simply supported beam with the sliders: $V$ is negative to the left of a downward load and positive to its right, and $M$ is positive (sagging) everywhere.`,
      {
        title: "Internal forces and the sign convention",
        visual: { kind: "shear-moment", config: { length: 8, support: "simple", loads: [{ kind: "point", x: 3, P: 10 }], sliders: true, units: BEAM_UNITS } },
      },
    ),
    tf("v-direction", {
      statement: r`In the course (Govindjee) convention, a positive shear force $V$ on the right-hand end of a left segment of beam points downward.`,
      answer: false,
      feedback: r`$V$ is $\int_A \sigma_{xy}\,\mathrm{d}A$ on the face with outward normal $+\mathbf{e}_x$. Which way does a positive $\sigma_{xy}$ push on that face?`,
      hint: r`The right-hand end of a left segment is the face with outward normal $+\mathbf{e}_x$. On a positive face, a positive stress component acts in the positive coordinate direction.`,
      explanation: r`False. $V = \int_A \sigma_{xy}\,\mathrm{d}A$ on the $+x$ face, and a positive $\sigma_{xy}$ on a positive face acts in $+y$, so positive $V$ points **up** there (and down on the matching face of the right segment). The downward-positive picture is Beer & Johnston's and Hibbeler's; their $V$ is the negative of ours.`,
      tags: ["sign-convention"],
    }),
    mc("equation-principles", {
      question: "Which pairing of the two beam equilibrium equations with the physical principle each one expresses is correct?",
      choices: [
        ["right", r`$\mathrm{d}V/\mathrm{d}x + q = 0$ is vertical ($y$) force balance of a thin slice; $\mathrm{d}M/\mathrm{d}x + V = 0$ is moment balance about $z$ of a thin slice.`],
        ["swapped", r`$\mathrm{d}V/\mathrm{d}x + q = 0$ is moment balance about $z$; $\mathrm{d}M/\mathrm{d}x + V = 0$ is vertical force balance.`, r`Swapped. $\mathrm{d}V/\mathrm{d}x + q = 0$ contains only forces ($V$ and $q$), so it comes from $\sum F_y = 0$. The equation containing $M$ comes from $\sum M_z = 0$.`],
        ["compat", r`$\mathrm{d}V/\mathrm{d}x + q = 0$ is vertical force balance; $\mathrm{d}M/\mathrm{d}x + V = 0$ is compatibility of the rotations.`, "No deformation appears in either equation. Both are statics of a slice; the second one is moment balance."],
        ["hooke", "Both follow from Hooke's law applied to the slice.", "Neither uses a material law. They hold for elastic, plastic or composite beams alike."],
      ],
      correct: "right",
      shuffle: true,
      hint: "Look at what each equation contains: only forces, or a moment as well?",
      explanation: r`Summing vertical forces on a slice of length $\Delta x$ gives $-V(x) + V(x + \Delta x) + q\,\Delta x = 0$, so $\mathrm{d}V/\mathrm{d}x + q = 0$: **force equilibrium in $y$**. Summing moments about $z$ (about the slice's right-hand point on the axis) gives $M(x + \Delta x) - M(x) + V(x)\,\Delta x - q\,\Delta x^2/2 = 0$, so $\mathrm{d}M/\mathrm{d}x + V = 0$: **moment equilibrium about $z$**. Neither depends on the material.`,
      tags: ["equilibrium"],
    }),
    reading(
      "slice-equilibrium",
      r`Apply statics to a slice $[x, x + \Delta x]$ carrying the load $q$ and let $\Delta x \to 0$ (Govindjee eqs 8.6 and 8.8):

$$\sum F_y = 0:\ \ \frac{\mathrm{d}V}{\mathrm{d}x} + q = 0, \qquad\qquad \sum M_z = 0:\ \ \frac{\mathrm{d}M}{\mathrm{d}x} + V = 0,$$

and $R$ is constant ($R = 0$ without axial loads). Together they give $\mathrm{d}^2M/\mathrm{d}x^2 = q$. Integrated from $x = 0$:

$$V(x) = V(0) - \int_0^x q\,\mathrm{d}x, \qquad M(x) = M(0) - \int_0^x V\,\mathrm{d}x,$$

where $V(0)$ and $M(0)$ come from the support reactions.

Reading a diagram:

- **Slope of $V$ is $-q$.** No load: $V$ constant. Uniform $q$: $V$ linear and $M$ quadratic.
- **Slope of $M$ is $-V$.** Where $V = 0$, $M$ has a maximum or minimum.
- A **downward point force** $P$ at $x = a$ is $q = -P\,\delta(x - a)$, so **$V$ jumps up by $P$** there and $M$ has a kink. An upward reaction $R$ makes $V$ jump by $-R$.
- A **point moment** (a "doublet" load) makes **$M$ jump**. A **clockwise** applied moment $\bar M$ makes $M$ jump **up** by $\bar M$.
- At a free end or a pin with no applied moment, $M = 0$. At a free end with no point force, $V = 0$.`,
      { title: "Equilibrium of a slice" },
    ),
    tf("slope-of-v", {
      statement: r`The slope of the shear-force diagram, $\mathrm{d}V/\mathrm{d}x$, equals $-q(x)$, where $q$ is the distributed load per unit length taken positive upward.`,
      answer: true,
      feedback: r`Rearrange the vertical equilibrium equation $\mathrm{d}V/\mathrm{d}x + q = 0$.`,
      hint: "Start from vertical force equilibrium of a thin slice.",
      explanation: r`True: $\mathrm{d}V/\mathrm{d}x + q = 0$ gives $\mathrm{d}V/\mathrm{d}x = -q$. Under a downward load $w$ ($q = -w$) the shear diagram climbs with slope $+w$. (With Beer's opposite $V$, the same physics reads $\mathrm{d}V/\mathrm{d}x = -w$.)`,
      tags: ["equilibrium", "sign-convention"],
    }),
    mc("udl-shapes", {
      question: "Over a span carrying a uniform distributed load (and no point loads), what shapes do the diagrams have?",
      choices: [
        ["lin-quad", r`$V$ is linear in $x$ and $M$ is quadratic (a parabola).`],
        ["const-lin", r`$V$ is constant and $M$ is linear.`, r`That is an unloaded span ($q = 0$).`],
        ["quad-cubic", r`$V$ is quadratic and $M$ is cubic.`, "That is a linearly varying (triangular) load."],
        ["lin-lin", "Both are linear.", r`$M$ is the integral of $-V$. Integrate a linear function once: what degree do you get?`],
      ],
      correct: "lin-quad",
      shuffle: true,
      hint: r`Integrate $\mathrm{d}V/\mathrm{d}x = -q$ once with $q$ constant, then $\mathrm{d}M/\mathrm{d}x = -V$ once more.`,
      explanation: r`$q$ constant makes $V = V(0) - qx$ linear, and then $M = M(0) - \int V\,\mathrm{d}x$ is quadratic. The parabola peaks where $V = 0$. For a simply supported span with a downward load $w$: $V = -wL/2 + wx$ and $M = wx(L - x)/2$.`,
      tags: ["shear-moment"],
    }),
    mc("moment-jump", {
      question: "Where does the bending-moment diagram have a **jump** (a discontinuity)?",
      choices: [
        ["couple", "Where a concentrated moment (couple) is applied."],
        ["force", "Where a concentrated force is applied.", r`A point force makes $V$ jump. $M$ only gets a kink (a sudden change of slope) there.`],
        ["v-zero", "Wherever the shear force is zero.", r`$V = 0$ marks a local maximum or minimum of $M$ (zero slope), not a jump.`],
        ["support", "At every support.", r`A pin or roller supplies a force, not a moment, so $V$ jumps there and $M$ does not.`],
      ],
      correct: "couple",
      hint: r`Use $M(x) = M(0) - \int_0^x V\,\mathrm{d}x$. What would $V$ have to contain for that integral to jump, and which kind of load puts it there?`,
      explanation: r`From $M(x) = M(0) - \int_0^x V\,\mathrm{d}x$, $M$ can only jump if $V$ contains a delta function, and that happens for a point moment, modelled as a doublet load (Govindjee §8.2, remark 5). A clockwise couple $\bar M$ makes $M$ jump up by $\bar M$. Point forces make $V$ jump instead.`,
      tags: ["shear-moment"],
    }),
    numeric("moment-slope", {
      question: r`At some section of a beam the shear force is $V = -8\ \mathrm{kN}$ (course convention). What is the slope $\mathrm{d}M/\mathrm{d}x$ of the bending-moment diagram there?`,
      answer: 8, // check: dM/dx = −V = −(−8 kN) = +8 kN·m per m
      tolerance: 0.08,
      prefix: r`$\dfrac{\mathrm{d}M}{\mathrm{d}x} =$`,
      suffix: "kN·m/m",
      answerDisplay: r`+8\ \mathrm{kN\cdot m/m}`,
      hint: r`Use moment equilibrium of a slice, $\mathrm{d}M/\mathrm{d}x + V = 0$.`,
      explanation: r`$\mathrm{d}M/\mathrm{d}x = -V = +8\ \mathrm{kN\cdot m}$ per metre ($= 8\ \mathrm{kN}$). The moment is increasing there, as on the left part of a simply supported beam, where $V = -R_A < 0$ and $M = R_A x$ rises. Beer's convention would call the same shear $V = +8\ \mathrm{kN}$ and write $\mathrm{d}M/\mathrm{d}x = +V$: same slope, opposite sign for $V$.`,
      tags: ["equilibrium", "sign-convention"],
    }),
    reading(
      "cantilever",
      r`**Cantilever with a tip load** (Govindjee Example 8.3). The beam is built in at $x = 0$ and carries a downward force $P$ at its free end $x = L$.

**Reactions.** A free body of the whole beam shows the wall pushing up with $P$ and applying a counterclockwise moment $PL$. The wall acts on the face at $x = 0$, whose outward normal is $-\mathbf{e}_x$, so in terms of the resultant functions $V(0) = -P$ and $M(0) = -PL$.

**Integrate.** There is no load on $0 < x < L$, so

$$V(x) = V(0) - \int_0^x 0\,\mathrm{d}x = -P, \qquad M(x) = M(0) - \int_0^x V\,\mathrm{d}x = -PL + Px = P(x - L).$$

**Check with a cut.** The piece $[x, L]$ carries $-V$ and $-M$ on its left face (outward normal $-\mathbf{e}_x$). $\sum F_y = -V - P = 0$ gives $V = -P$. Moments about the cut, $-M - P(L - x) = 0$, give $M = P(x - L)$.

$M$ is negative all along (**hogging**, top fibres in tension), with its largest magnitude, $PL$, at the wall. Beer and Hibbeler would report the same $M$ but $V = +P$.`,
      {
        title: "Worked diagram: the cantilever",
        visual: { kind: "shear-moment", config: { length: 3, support: "cantilever-left", loads: [{ kind: "point", x: 3, P: 4 }], sliders: true, units: BEAM_UNITS } },
      },
    ),
    mc("cantilever-v", {
      body: r`A cantilever of length $L = 2\ \mathrm{m}$ is built in at $x = 0$ and carries a downward force $P = 5\ \mathrm{kN}$ at its free end.`,
      question: r`Using the course (Govindjee) sign convention, what is the shear force at mid-span, $V(1\ \mathrm{m})$?`,
      choices: [
        ["m5", r`$-5\ \mathrm{kN}$`],
        ["p5", r`$+5\ \mathrm{kN}$`, r`That is the Beer/Hibbeler sign. Here $V = \int_A \sigma_{xy}\,\mathrm{d}A$ on the $+x$ face, positive up. The left part holds the outer piece up, so the outer piece pushes the left part *down*: $V = -P$.`],
        ["m25", r`$-2.5\ \mathrm{kN}$`, r`$V$ does not vary along this cantilever: there is no distributed load, so $\mathrm{d}V/\mathrm{d}x = -q = 0$.`],
        ["zero", r`$0$`, "Every section between the wall and the load has to carry the whole load P."],
      ],
      correct: "m5",
      shuffle: true,
      hint: r`Free-body the piece between the cut and the free end. On its cut face (outward normal $-\mathbf{e}_x$) the internal shear acts as $-V$.`,
      explanation: r`With $q = 0$ on $0 < x < L$, $V$ is constant: $V(x) = V(0) = -P = -5\ \mathrm{kN}$. Check with the outer piece $[1, 2]\ \mathrm{m}$: its cut face has outward normal $-\mathbf{e}_x$, so the shear on it is $-V$, and $\sum F_y = -V - 5 = 0$ gives $V = -5\ \mathrm{kN}$. In Beer/Hibbeler the same beam has $V = +5\ \mathrm{kN}$: same physics, opposite sign convention.`,
      tags: ["sign-convention", "shear-moment"],
    }),
    numeric("cantilever-m0", {
      question: r`Same cantilever ($L = 2\ \mathrm{m}$, $P = 5\ \mathrm{kN}$ down at the tip): what is the bending moment at the wall, $M(0)$? Answer in kN·m, with sign.`,
      answer: -10, // check: M(x) = P(x − L) => M(0) = 5(0 − 2) = −10 kN·m
      tolerance: 0.1,
      prefix: r`$M(0) =$`,
      suffix: "kN·m",
      answerDisplay: r`-10\ \mathrm{kN\cdot m}`,
      hint: r`Integrate $\mathrm{d}M/\mathrm{d}x = -V$ from the free end, where $M = 0$, or use the moment the wall has to supply.`,
      explanation: r`$M(x) = P(x - L)$, so $M(0) = 5(0 - 2) = -10\ \mathrm{kN\cdot m}$. It is negative (hogging, top in tension): the wall bends the beam concave-down. Check: the wall must apply a counterclockwise moment $PL = 10\ \mathrm{kN\cdot m}$; on the $-x$ face that is $-M(0) = +10$, so $M(0) = -10\ \mathrm{kN\cdot m}$.`,
      tags: ["shear-moment", "sign-convention"],
    }),
    numeric("cantilever-udl-m0", {
      body: r`A cantilever $3\ \mathrm{m}$ long, built in at $x = 0$, carries a uniform downward load $w = 2\ \mathrm{kN/m}$ over its whole length.`,
      question: r`What is the bending moment at the wall, $M(0)$? Answer in kN·m, with sign.`,
      answer: -9, // check: V(0) = −wL = −6 kN; M(0) = −wL²/2 = −2·3²/2 = −9 kN·m
      tolerance: 0.09,
      prefix: r`$M(0) =$`,
      suffix: "kN·m",
      answerDisplay: r`-9\ \mathrm{kN\cdot m}`,
      hint: r`The total load $wL$ acts at the middle of the beam. Or integrate with $q = -w$ and the free-end conditions $V(L) = 0$, $M(L) = 0$.`,
      explanation: r`With $q = -w$ and $V(L) = 0$: $V(x) = w(x - L)$, so $V(0) = -wL = -6\ \mathrm{kN}$. With $M(L) = 0$: $M(x) = -w(L - x)^2/2$, so $M(0) = -wL^2/2 = -(2)(3^2)/2 = -9\ \mathrm{kN\cdot m}$ (hogging). Shortcut: the resultant $wL = 6\ \mathrm{kN}$ acts $1.5\ \mathrm{m}$ from the wall, giving $6 \times 1.5 = 9\ \mathrm{kN\cdot m}$ of hogging moment.`,
      tags: ["shear-moment"],
    }),
    reading(
      "simple-beams",
      r`**Simply supported beams**: a pin at $x = 0$ and a roller at $x = L$, with upward reactions $R_A$ and $R_B$.

*Point load $P$ (down) at $x = a$, with $b = L - a$.* Moments about each support give $R_A = Pb/L$ and $R_B = Pa/L$. The left reaction makes $V(0^+) = -R_A$, and the load makes $V$ jump by $+P$:

$$V = \begin{cases} -R_A & 0 < x < a \\ +R_B & a < x < L \end{cases} \qquad M = \begin{cases} R_A\,x & 0 \le x \le a \\ R_B\,(L - x) & a \le x \le L \end{cases} \qquad M_{\max} = \frac{Pab}{L}.$$

*Uniform load $w$ (down), so $q = -w$.* By symmetry $R_A = R_B = wL/2$, and

$$V = -\frac{wL}{2} + wx, \qquad M = \frac{w\,x\,(L - x)}{2}, \qquad M_{\max} = \frac{wL^2}{8}\ \text{at}\ x = \frac{L}{2}.$$

*Clockwise couple $\bar M$ at $x = d$* (Govindjee Examples 8.1–8.2). The reactions form a couple, $\bar M/L$ down at $A$ and $\bar M/L$ up at $B$. So $V = +\bar M/L$ everywhere, $M = -\bar M x/L$ for $x < d$, and $M$ jumps by $+\bar M$ at $d$ to $M = \bar M(1 - x/L)$.

In every case $M = 0$ at both pins. Under forces the largest moment sits where $V$ changes sign; under a couple $V$ never changes sign, and the extremes sit on either side of the jump. The visual combines a uniform load with a point load: a sloped $V$ with a jump, and a parabolic $M$ with a kink.`,
      {
        title: "Worked diagrams: simply supported beams",
        visual: {
          kind: "shear-moment",
          config: {
            length: 6,
            support: "simple",
            loads: [
              { kind: "udl", from: 0, to: 6, w: 2 },
              { kind: "point", x: 4, P: 6 },
            ],
            sliders: true,
            units: BEAM_UNITS,
          },
        },
      },
    ),
    numeric("ss-reaction", {
      body: r`A simply supported beam of span $L = 6\ \mathrm{m}$ (pin at $x = 0$, roller at $x = 6\ \mathrm{m}$) carries a downward point load $P = 12\ \mathrm{kN}$ at $a = 2\ \mathrm{m}$.`,
      question: r`What is the upward reaction $R_A$ at the left support, in kN?`,
      answer: 8, // check: R_A = P(L − a)/L = 12·4/6 = 8 kN  (R_B = 12·2/6 = 4 kN)
      tolerance: 0.08,
      prefix: r`$R_A =$`,
      suffix: "kN",
      answerDisplay: r`8\ \mathrm{kN}`,
      hint: r`Take moments about the right support so that $R_B$ drops out.`,
      explanation: r`Moments about $B$: $R_A L - P(L - a) = 0$, so $R_A = 12 \times 4/6 = 8\ \mathrm{kN}$. Then $R_B = P - R_A = 4\ \mathrm{kN}$ (and $Pa/L = 12 \times 2/6 = 4\ \mathrm{kN}$ agrees). The support nearer the load carries more of it.`,
      tags: ["reactions"],
    }),
    numeric("ss-shear-left", {
      question: r`Same beam: what is the shear force $V$ on $0 < x < 2\ \mathrm{m}$, **in the course convention**? Answer in kN, with sign.`,
      answer: -8, // check: V(0+) = −R_A = −8 kN, constant up to the load
      tolerance: 0.08,
      prefix: r`$V =$`,
      suffix: "kN",
      answerDisplay: r`-8\ \mathrm{kN}`,
      hint: r`Free-body the piece $[0, x]$ with $x < 2\ \mathrm{m}$. On its right end (the $+x$ face) a positive $V$ points up.`,
      explanation: r`$\sum F_y$ on $[0, x]$: $R_A + V = 0$, so $V = -R_A = -8\ \mathrm{kN}$, constant up to the load. At $x = 2\ \mathrm{m}$ the $12\ \mathrm{kN}$ load makes $V$ jump by $+12$ to $+4\ \mathrm{kN} = +R_B$, which holds until $x = 6\ \mathrm{m}$. (Beer/Hibbeler would report $+8$ and $-4\ \mathrm{kN}$.)`,
      tags: ["sign-convention", "shear-moment"],
    }),
    numeric("ss-moment-load", {
      question: r`Same beam: what is the bending moment under the load, $M(2\ \mathrm{m})$, in kN·m?`,
      answer: 16, // check: M(a) = R_A·a = 8·2 = 16 kN·m = Pab/L = 12·2·4/6
      tolerance: 0.16,
      prefix: r`$M =$`,
      suffix: "kN·m",
      answerDisplay: r`16\ \mathrm{kN\cdot m}`,
      hint: r`Integrate $\mathrm{d}M/\mathrm{d}x = -V$ from $x = 0$, where $M = 0$ at the pin.`,
      explanation: r`$M(x) = M(0) - \int_0^x V\,\mathrm{d}x = 0 - (-8)x = 8x$ for $x \le 2\ \mathrm{m}$, so $M(2) = 16\ \mathrm{kN\cdot m}$ (sagging, positive). Check: $Pab/L = 12 \times 2 \times 4/6 = 16$, and from the right $R_B(L - a) = 4 \times 4 = 16$. It is the maximum moment, because $V$ changes sign at the load.`,
      tags: ["shear-moment", "max-moment"],
    }),
    numeric("udl-mmax", {
      body: r`A simply supported beam of span $L = 4\ \mathrm{m}$ carries a uniform downward load $w = 3\ \mathrm{kN/m}$.`,
      question: "What is the maximum bending moment, in kN·m?",
      answer: 6, // check: wL²/8 = 3·16/8 = 6 kN·m at x = 2 m
      tolerance: 0.06,
      prefix: r`$M_{\max} =$`,
      suffix: "kN·m",
      answerDisplay: r`6\ \mathrm{kN\cdot m}`,
      hint: r`The maximum is where $V = 0$, which by symmetry is mid-span.`,
      explanation: r`$R_A = R_B = wL/2 = 6\ \mathrm{kN}$. $M(x) = wx(L - x)/2$ peaks at $x = L/2$, where $V = 0$: $M_{\max} = wL^2/8 = 3 \times 16/8 = 6\ \mathrm{kN\cdot m}$ (sagging).`,
      tags: ["max-moment", "shear-moment"],
    }),
    numeric("udl-shear-end", {
      question: r`Same beam: what is the shear force just to the right of the left support, $V(0^+)$, in the course convention? Answer in kN, with sign.`,
      answer: -6, // check: V(0+) = −R_A = −wL/2 = −3·4/2 = −6 kN
      tolerance: 0.06,
      prefix: r`$V(0^+) =$`,
      suffix: "kN",
      answerDisplay: r`-6\ \mathrm{kN}`,
      hint: r`An upward reaction at the left end makes $V$ jump by minus that reaction.`,
      explanation: r`$V(0^+) = -R_A = -wL/2 = -6\ \mathrm{kN}$. Then $V = -6 + 3x$ climbs with slope $-q = +w = 3\ \mathrm{kN/m}$, crosses zero at mid-span ($x = 2\ \mathrm{m}$, where $M$ peaks) and reaches $+6\ \mathrm{kN} = +R_B$ at the right support.`,
      tags: ["sign-convention", "shear-moment"],
    }),
    numeric("couple-moment", {
      body: r`A simply supported beam of span $L = 5\ \mathrm{m}$ carries no load except a **clockwise** couple $\bar M = 20\ \mathrm{kN\cdot m}$ applied at $x = d = 2\ \mathrm{m}$ (axes: $x$ to the right, $y$ up).`,
      question: r`What is the bending moment just to the **left** of the couple, $M(2^-)$? Answer in kN·m, with sign.`,
      answer: -8, // check: R_B = M̄/L = 4 kN up, R_A = −4 kN (down); V = +4 kN; M(d−) = −M̄d/L = −20·2/5 = −8; M(d+) = −8 + 20 = +12
      tolerance: 0.08,
      prefix: r`$M(2^-) =$`,
      suffix: "kN·m",
      answerDisplay: r`-8\ \mathrm{kN\cdot m}`,
      hint: r`Find the reactions first: they must form a counterclockwise couple that balances $\bar M$. Then $M(x) = -\int_0^x V\,\mathrm{d}x$ for $x < d$.`,
      explanation: r`Moments about $A$: $5R_B - 20 = 0$, so $R_B = 4\ \mathrm{kN}$ up and $R_A = -4\ \mathrm{kN}$ ($4\ \mathrm{kN}$ down). Then $V = -R_A = +4\ \mathrm{kN}$ everywhere, and $M(x) = -\int_0^x 4\,\mathrm{d}x = -4x$ for $x < 2\ \mathrm{m}$, so $M(2^-) = -8\ \mathrm{kN\cdot m}$. At the couple $M$ jumps by $+\bar M = +20$ to $M(2^+) = +12\ \mathrm{kN\cdot m}$, then falls linearly to $M(5) = 12 - 4 \times 3 = 0$.`,
      tags: ["shear-moment", "sign-convention"],
    }),
    reading(
      "summary",
      r`**What you did:** used Govindjee's sign convention to find reactions, shear forces and bending moments for cantilevers and simply supported beams under point loads, uniform loads and couples.

$$V = \int_A \sigma_{xy}\,\mathrm{d}A, \quad M = -\int_A y\,\sigma_{xx}\,\mathrm{d}A, \qquad \frac{\mathrm{d}V}{\mathrm{d}x} + q = 0, \quad \frac{\mathrm{d}M}{\mathrm{d}x} + V = 0.$$

- $q$ is positive **up**; a positive $V$ points **up** on the $+x$ face; a positive $M$ is sagging.
- Cantilever (wall at $x = 0$, tip load $P$ down): $V = -P$, $M = P(x - L)$.
- Simple span, point load: $R_A = Pb/L$; $V = -R_A$ then $+R_B$; $M_{\max} = Pab/L$.
- Simple span, uniform load: $V = -wL/2 + wx$, $M_{\max} = wL^2/8$.
- A downward point force makes $V$ jump by $+P$; a clockwise couple makes $M$ jump by $+\bar M$.
- Beer & Johnston and Hibbeler: same $M$, **opposite $V$**, and $\mathrm{d}M/\mathrm{d}x = +V$.

Next: how $M$ produces stress, and where the neutral axis sits.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Elastic response: neutral axis and σ = −My/I (§8.3)       */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "sm7-l3-elastic-response",
    unitId: "sm7",
    title: "Elastic response: the neutral axis and σ = −My/I",
    summary: "Hooke's law turns ε = −κy into σ = −Eκy; R = 0 puts the neutral axis at the centroid, and M = EIκ gives σ = −My/I.",
    textbook: "Govindjee §8.3",
    minutes: 15,
  },
  [
    reading(
      "stress-from-strain",
      r`The beam fibres are in uniaxial stress along $x$, so Hooke's law is simply $\sigma_{xx} = E\varepsilon_{xx}$. With the bending strain from lesson 1:

$$\sigma_{xx} = E\,\varepsilon_{xx} = -E\kappa y.$$

For a homogeneous beam ($E$ constant) the bending stress is **linear in $y$**: compression on one side of the neutral axis, tension on the other, zero on it, with slope $-E\kappa$ (Govindjee Fig. 8.14). Use the slider and watch the straight-line stress profile.

Two questions remain: *where is the neutral axis?* and *how is $\kappa$ related to the bending moment $M$?* Both answers come from the resultant definitions $R = \int_A \sigma_{xx}\,\mathrm{d}A$ and $M = -\int_A y\,\sigma_{xx}\,\mathrm{d}A$.`,
      {
        title: "Stress follows strain",
        visual: { kind: "beam-section", config: { M: 3000000, section: { kind: "rect", b: 40, h: 100 }, sliders: true, units: SECTION_UNITS } },
      },
    ),
    reading(
      "neutral-axis",
      r`With no axial load, $R = \int_A \sigma_{xx}\,\mathrm{d}A = 0$: the tension and the compression on the section cancel. Measure heights $y_b$ from the bottom of the section and put the neutral axis at $y_b = y_{\mathrm{na}}$, so $y = y_b - y_{\mathrm{na}}$. Then (Govindjee eq. 8.29)

$$0 = R = -\kappa\int_A E\,(y_b - y_{\mathrm{na}})\,\mathrm{d}A \quad\Longrightarrow\quad y_{\mathrm{na}} = \frac{\int_A E\,y_b\,\mathrm{d}A}{\int_A E\,\mathrm{d}A}.$$

- **Homogeneous section:** $E$ cancels, so $y_{\mathrm{na}}$ is the **centroid**, $\int_A y_b\,\mathrm{d}A / A$. For a rectangle that is $h/2$.
- **Built-up shapes:** split the section into parts with areas $A_i$ and centroid heights $\bar y_i$, then $y_{\mathrm{na}} = \sum A_i \bar y_i / \sum A_i$.
- This is an elastic result. After yielding you must apply $R = 0$ directly.
- From now on every $y$ in $\varepsilon = -\kappa y$ and $\sigma = -E\kappa y$ is measured from this axis.`,
      { title: "Locating the neutral axis" },
    ),
    tf("na-at-centroid", {
      statement: "For a homogeneous linear-elastic beam with no axial force, the neutral axis passes through the centroid of the cross-section, whatever its (symmetric) shape.",
      answer: true,
      feedback: r`Set $R = -E\kappa\int_A y\,\mathrm{d}A = 0$ with $E$ constant. What does $\int_A y\,\mathrm{d}A = 0$ say about the line $y = 0$?`,
      hint: r`With $E$ constant, what does $\int_A y\,\mathrm{d}A = 0$ say about the line $y = 0$?`,
      explanation: r`True. $R = -E\kappa\int_A y\,\mathrm{d}A = 0$ with $E$ and $\kappa$ nonzero constants forces $\int_A y\,\mathrm{d}A = 0$, so the axis $y = 0$ passes through the centroid. It is not true for composite sections (there it is the modulus-weighted centroid) or once the material yields.`,
      tags: ["neutral-axis"],
    }),
    numeric("tee-na", {
      body: r`A homogeneous T-section has a flange $200\ \mathrm{mm}$ wide and $20\ \mathrm{mm}$ thick sitting on top of a web $100\ \mathrm{mm}$ tall and $20\ \mathrm{mm}$ thick (total depth $120\ \mathrm{mm}$).`,
      question: r`How far above the bottom of the web is the neutral axis? Answer in mm.`,
      answer: 90, // check: A_f = 200·20 = 4000 at ȳ = 100 + 10 = 110; A_w = 20·100 = 2000 at ȳ = 50; (4000·110 + 2000·50)/6000 = 540 000/6000 = 90 mm
      tolerance: 0.9,
      prefix: r`$y_{\mathrm{na}} =$`,
      suffix: "mm",
      answerDisplay: r`90\ \mathrm{mm}`,
      hint: "Homogeneous means centroid. Split the T into flange and web and locate each part's centroid from the bottom of the web.",
      explanation: r`Flange: $A_f = 200 \times 20 = 4000\ \mathrm{mm^2}$, centroid at $100 + 10 = 110\ \mathrm{mm}$. Web: $A_w = 20 \times 100 = 2000\ \mathrm{mm^2}$, centroid at $50\ \mathrm{mm}$. So $y_{\mathrm{na}} = (4000 \cdot 110 + 2000 \cdot 50)/(4000 + 2000) = 540\,000/6000 = 90\ \mathrm{mm}$ above the bottom, $30\ \mathrm{mm}$ below the top. The big flange pulls the axis up toward itself.`,
      tags: ["neutral-axis", "centroid"],
    }),
    numeric("rect-tri-na", {
      body: r`A homogeneous cross-section is a rectangle $50\ \mathrm{mm}$ wide and $100\ \mathrm{mm}$ tall with an isosceles triangle (base $50\ \mathrm{mm}$, height $60\ \mathrm{mm}$) standing on its top edge, apex up.`,
      question: r`Locate the neutral axis: its height above the bottom of the rectangle, in mm (three significant figures).`,
      answer: 66.15, // check: A_r = 5000 at 50; A_t = ½·50·60 = 1500 at 100 + 60/3 = 120; (250 000 + 180 000)/6500 = 66.15 mm
      tolerance: 0.66,
      prefix: r`$y_{\mathrm{na}} =$`,
      suffix: "mm",
      answerDisplay: r`66.2\ \mathrm{mm}`,
      hint: r`A triangle's centroid is one third of its height above its base. Then use $\sum A_i\bar y_i / \sum A_i$.`,
      explanation: r`Rectangle: $A_r = 5000\ \mathrm{mm^2}$, $\bar y_r = 50\ \mathrm{mm}$. Triangle: $A_t = \tfrac12(50)(60) = 1500\ \mathrm{mm^2}$, centroid $h/3 = 20\ \mathrm{mm}$ above its base, so $\bar y_t = 100 + 20 = 120\ \mathrm{mm}$. Then $y_{\mathrm{na}} = (5000 \cdot 50 + 1500 \cdot 120)/(5000 + 1500) = 430\,000/6500 = 66.15\ \mathrm{mm}$ above the bottom.`,
      tags: ["neutral-axis", "centroid"],
    }),
    reading(
      "flexure-formula",
      r`Put $\sigma = -E\kappa y$ into $M = -\int_A y\,\sigma\,\mathrm{d}A$ (Govindjee Examples 8.5–8.6):

$$M = \kappa\int_A E\,y^2\,\mathrm{d}A = EI\,\kappa, \qquad I = \int_A y^2\,\mathrm{d}A, \qquad \sigma = -\frac{M\,y}{I}.$$

- $I$ is the **second moment of area** about the neutral axis (units length⁴), and $EI$ is the bending stiffness. Compare $T = GJ\phi'$ and $\tau = Tr/J$ in torsion.
- **Largest stress:** $|\sigma|_{\max} = |M|\,y_{\max}/I = |M|/S$, where $y_{\max}$ is the distance to the chord **farthest** from the neutral axis and $S = I/y_{\max}$ is the section modulus.
- **Standard shapes**, about their own centroid: rectangle $bh^3/12$; solid circle $\pi R^4/4$; triangle $bh^3/36$ (centroid $h/3$ above the base).
- **Parallel-axis theorem:** $I = I_c + A d^2$, with $d$ the distance from the part's own centroid to the neutral axis. For a built-up section, $I = \sum (I_{c,i} + A_i d_i^2)$.

Recipe for a T-beam (Govindjee Example 8.7): find $y_{\mathrm{na}} = \sum A_i\bar y_i/\sum A_i$; add $I_c + Ad^2$ for the flange and the web; take $y_{\max}$ as the larger of the distances to the top and bottom chords; then $|\sigma|_{\max} = |M|\,y_{\max}/I$. The T-section below shows the stress profile; move the slider and see which chord is worse off.`,
      {
        title: "Moment–curvature and σ = −My/I",
        visual: { kind: "beam-section", config: { M: 5000000, section: { kind: "tee", bf: 150, tf: 30, hw: 120, tw: 30 }, sliders: true, units: SECTION_UNITS } },
      },
    ),
    mc("units-of-i", {
      question: r`Working in millimetres, what are the units of the second moment of area $I$?`,
      choices: [
        ["mm4", r`$\mathrm{mm^4}$`],
        ["mm3", r`$\mathrm{mm^3}$`, r`That is the section modulus $S = I/y_{\max}$.`],
        ["mm2", r`$\mathrm{mm^2}$`, r`That is an area $A$.`],
        ["nmm2", r`$\mathrm{N\cdot mm^2}$`, r`That is the bending stiffness $EI$ ($\mathrm{N/mm^2} \times \mathrm{mm^4}$).`],
      ],
      correct: "mm4",
      shuffle: true,
      hint: r`$I = \int_A y^2\,\mathrm{d}A$: a length squared times an area.`,
      explanation: r`$I = \int_A y^2\,\mathrm{d}A$ has units $\mathrm{mm^2} \times \mathrm{mm^2} = \mathrm{mm^4}$ ($\mathrm{in^4}$ in US units). Check $\sigma = -My/I$: $\mathrm{N\cdot mm} \times \mathrm{mm} / \mathrm{mm^4} = \mathrm{N/mm^2} = \mathrm{MPa}$.`,
      tags: ["second-moment"],
    }),
    numeric("rect-i", {
      body: r`A homogeneous rectangular beam is $50\ \mathrm{mm}$ wide and $120\ \mathrm{mm}$ deep, bent about its horizontal centroidal axis.`,
      question: r`What is its second moment of area $I$ about the neutral axis? Answer in units of $10^6\ \mathrm{mm^4}$.`,
      answer: 7.2, // check: bh³/12 = 50·120³/12 = 50·1 728 000/12 = 7 200 000 mm⁴
      tolerance: 0.07,
      prefix: r`$I =$`,
      suffix: r`$\times 10^{6}\ \mathrm{mm^4}$`,
      answerDisplay: r`7.2 \times 10^{6}\ \mathrm{mm^4}`,
      hint: r`Rectangle about its centroid: $bh^3/12$, where $h$ is the dimension perpendicular to the bending axis (the depth).`,
      explanation: r`$I = bh^3/12 = 50 \times 120^3/12 = 50 \times 1\,728\,000/12 = 7.2 \times 10^{6}\ \mathrm{mm^4}$. The depth is cubed: the same beam laid flat ($b = 120$, $h = 50$) has only $1.25 \times 10^{6}\ \mathrm{mm^4}$.`,
      tags: ["second-moment"],
    }),
    numeric("rect-sigma-max", {
      question: r`This beam carries a bending moment $M = 6\ \mathrm{kN\cdot m}$. What is the largest bending-stress magnitude $|\sigma|_{\max}$, in MPa?`,
      answer: 50, // check: M y_max/I = (6e6 N·mm)(60 mm)/(7.2e6 mm⁴) = 50 MPa
      tolerance: 0.5,
      prefix: r`$|\sigma|_{\max} =$`,
      suffix: "MPa",
      answerDisplay: r`50\ \mathrm{MPa}`,
      hint: r`Convert $M$ to N·mm so the stress comes out in $\mathrm{N/mm^2} = \mathrm{MPa}$. $y_{\max}$ is half the depth.`,
      explanation: r`$M = 6\ \mathrm{kN\cdot m} = 6 \times 10^{6}\ \mathrm{N\cdot mm}$ and $y_{\max} = 60\ \mathrm{mm}$, so $|\sigma|_{\max} = M y_{\max}/I = (6 \times 10^{6})(60)/(7.2 \times 10^{6}) = 50\ \mathrm{MPa}$. Equivalently $S = I/y_{\max} = bh^2/6 = 1.2 \times 10^{5}\ \mathrm{mm^3}$ and $\sigma = M/S$.`,
      tags: ["bending-stress"],
    }),
    numeric("rect-sigma-y", {
      question: r`With $M = +6\ \mathrm{kN\cdot m}$ (sagging), what is the bending stress at $y = +30\ \mathrm{mm}$, halfway from the neutral axis to the top? Answer in MPa, with sign.`,
      answer: -25, // check: σ = −My/I = −(6e6)(30)/(7.2e6) = −25 MPa
      tolerance: 0.25,
      prefix: r`$\sigma =$`,
      suffix: "MPa",
      answerDisplay: r`-25\ \mathrm{MPa}`,
      hint: r`Use $\sigma = -My/I$ and keep the sign of $y$.`,
      explanation: r`$\sigma = -My/I = -(6 \times 10^{6})(30)/(7.2 \times 10^{6}) = -25\ \mathrm{MPa}$: compression, as expected above the neutral axis under a sagging moment. The profile is linear in $y$, so halfway to the top gives half of the top-fibre value of $-50\ \mathrm{MPa}$.`,
      tags: ["bending-stress", "sign-convention"],
    }),
    numeric("circle-i", {
      body: r`A solid circular rod of diameter $80\ \mathrm{mm}$ is used as a beam.`,
      question: r`What is $I$ about a diameter? Answer in units of $10^6\ \mathrm{mm^4}$ (three significant figures).`,
      answer: 2.01, // check: πR⁴/4 = π·40⁴/4 = π·2 560 000/4 = 2 010 619 mm⁴
      tolerance: 0.02,
      prefix: r`$I =$`,
      suffix: r`$\times 10^{6}\ \mathrm{mm^4}$`,
      answerDisplay: r`2.01 \times 10^{6}\ \mathrm{mm^4}`,
      hint: r`Use the radius, not the diameter: $I = \pi R^4/4$.`,
      explanation: r`$R = 40\ \mathrm{mm}$, so $I = \pi R^4/4 = \pi(2.56 \times 10^{6})/4 = 2.01 \times 10^{6}\ \mathrm{mm^4}$. The polar moment from torsion is twice this, $J = \pi R^4/2 = 2I$ (perpendicular-axis theorem, $J = I_y + I_z$).`,
      tags: ["second-moment"],
    }),
    numeric("parallel-axis", {
      body: r`Part of a built-up section is a plate $100\ \mathrm{mm}$ wide and $20\ \mathrm{mm}$ thick whose own centroid lies $50\ \mathrm{mm}$ from the section's neutral axis.`,
      question: r`What is this plate's contribution to $I$ about the neutral axis? Answer in units of $10^6\ \mathrm{mm^4}$ (three significant figures).`,
      answer: 5.07, // check: I_c = 100·20³/12 = 66 667; A d² = 2000·50² = 5 000 000; total 5 066 667 mm⁴
      tolerance: 0.05,
      prefix: r`$I =$`,
      suffix: r`$\times 10^{6}\ \mathrm{mm^4}$`,
      answerDisplay: r`5.07 \times 10^{6}\ \mathrm{mm^4}`,
      hint: r`Parallel-axis theorem: the plate's own-centroid $I$ plus area times distance squared. For the own-centroid part the 20 mm thickness is the depth.`,
      explanation: r`$I_c = bh^3/12 = 100 \times 20^3/12 = 6.67 \times 10^{4}\ \mathrm{mm^4}$ and $A d^2 = (2000)(50^2) = 5.00 \times 10^{6}\ \mathrm{mm^4}$, for a total of $5.07 \times 10^{6}\ \mathrm{mm^4}$. The $Ad^2$ term dominates, which is why flanges placed far from the neutral axis are so effective.`,
      tags: ["parallel-axis", "second-moment"],
    }),
    numeric("tee-i", {
      body: r`Back to the T-section: flange $200 \times 20\ \mathrm{mm}$ on top of a web $100\ \mathrm{mm}$ tall and $20\ \mathrm{mm}$ thick, neutral axis $90\ \mathrm{mm}$ above the bottom.`,
      question: r`What is $I$ about the neutral axis? Answer in units of $10^6\ \mathrm{mm^4}$.`,
      answer: 6.6, // check: flange 133 333 + 4000·(110−90)² = 1 733 333; web 1 666 667 + 2000·(90−50)² = 4 866 667; total 6 600 000 mm⁴
      tolerance: 0.07,
      prefix: r`$I =$`,
      suffix: r`$\times 10^{6}\ \mathrm{mm^4}$`,
      answerDisplay: r`6.6 \times 10^{6}\ \mathrm{mm^4}`,
      hint: r`Each rectangle contributes $I_c + Ad^2$. The flange centroid is at 110 mm, the web centroid at 50 mm and the neutral axis at 90 mm.`,
      explanation: r`Flange: $I_c = 200 \times 20^3/12 = 133\,333\ \mathrm{mm^4}$, $d = 110 - 90 = 20\ \mathrm{mm}$, $Ad^2 = 4000 \times 400 = 1\,600\,000$. Web: $I_c = 20 \times 100^3/12 = 1\,666\,667\ \mathrm{mm^4}$, $d = 90 - 50 = 40\ \mathrm{mm}$, $Ad^2 = 2000 \times 1600 = 3\,200\,000$. Sum: $I = 6.6 \times 10^{6}\ \mathrm{mm^4}$.`,
      tags: ["second-moment", "parallel-axis"],
    }),
    mc("tee-critical-fibre", {
      question: r`Under a bending moment $M$, where does this T-section (neutral axis $90\ \mathrm{mm}$ above the bottom, $30\ \mathrm{mm}$ below the top) carry its largest $|\sigma|$?`,
      choices: [
        ["bottom", r`At the bottom of the web, $90\ \mathrm{mm}$ from the neutral axis.`],
        ["top", "At the top of the flange, because the flange holds most of the area.", r`Area doesn't set the bending stress; distance does. $|\sigma| = |M|\,|y|/I$ is largest where $|y|$ is largest.`],
        ["junction", "At the flange–web junction, where the width changes.", r`$\sigma = -My/I$ does not depend on the width at that height. (The width matters for the shear stress, Govindjee §8.6.)`],
        ["na", "On the neutral axis.", "The bending stress is zero there."],
      ],
      correct: "bottom",
      hint: r`$|\sigma| = |M|\,|y|/I$. Which fibre has the largest $|y|$?`,
      explanation: r`$|\sigma|$ is proportional to the distance from the neutral axis, so it peaks at the chord farther from it: the bottom of the web ($y = -90\ \mathrm{mm}$) rather than the top of the flange ($y = +30\ \mathrm{mm}$). The bottom stress is three times the top stress. Under a sagging moment the bottom is in tension.`,
      tags: ["bending-stress"],
    }),
    numeric("tee-sigma-bottom", {
      question: r`The T-section carries a sagging moment $M = +4\ \mathrm{kN\cdot m}$. What is the bending stress at the bottom fibre, in MPa with sign (three significant figures)?`,
      answer: 54.5, // check: y = −90 mm: σ = −My/I = −(4e6)(−90)/(6.6e6) = +54.55 MPa; S = 6.6e6/90 = 73 333 mm³
      tolerance: 0.55,
      prefix: r`$\sigma =$`,
      suffix: "MPa",
      answerDisplay: r`+54.5\ \mathrm{MPa}`,
      hint: r`The bottom fibre is at $y = -90\ \mathrm{mm}$. Use $\sigma = -My/I$ with $M$ in N·mm.`,
      explanation: r`$\sigma = -My/I = -(4 \times 10^{6})(-90)/(6.6 \times 10^{6}) = +54.5\ \mathrm{MPa}$ (tension). In section-modulus form, $S = I/y_{\max} = 6.6 \times 10^{6}/90 = 7.33 \times 10^{4}\ \mathrm{mm^3}$ and $|\sigma|_{\max} = M/S = 54.5\ \mathrm{MPa}$. The top fibre ($y = +30$) carries only $-18.2\ \mathrm{MPa}$.`,
      tags: ["bending-stress"],
    }),
    numeric("rect-tri-i", {
      body: r`Back to the rectangle-plus-triangle section (rectangle $50 \times 100\ \mathrm{mm}$; isosceles triangle with base $50\ \mathrm{mm}$ and height $60\ \mathrm{mm}$ on top), with its neutral axis $66.15\ \mathrm{mm}$ above the bottom.`,
      question: r`What is $I$ about the neutral axis? Answer in units of $10^6\ \mathrm{mm^4}$ (three significant figures).`,
      answer: 10.12, // check: 4 166 667 + 5000·16.154² (1 304 734) + 50·60³/36 (300 000) + 1500·53.846² (4 349 112) = 10 120 513 mm⁴
      tolerance: 0.1,
      prefix: r`$I =$`,
      suffix: r`$\times 10^{6}\ \mathrm{mm^4}$`,
      answerDisplay: r`10.1 \times 10^{6}\ \mathrm{mm^4}`,
      hint: r`Triangle about its own centroid: $bh^3/36$. The rectangle's centroid is at 50 mm and the triangle's at 120 mm.`,
      explanation: r`Rectangle: $I_c = 50 \times 100^3/12 = 4.167 \times 10^{6}$, $d = 66.15 - 50 = 16.15\ \mathrm{mm}$, $Ad^2 = 5000 \times 16.15^2 = 1.305 \times 10^{6}$. Triangle: $I_c = 50 \times 60^3/36 = 0.300 \times 10^{6}$, $d = 120 - 66.15 = 53.85\ \mathrm{mm}$, $Ad^2 = 1500 \times 53.85^2 = 4.349 \times 10^{6}$. Sum: $I = 10.12 \times 10^{6}\ \mathrm{mm^4}$.`,
      tags: ["second-moment", "parallel-axis"],
    }),
    reading(
      "summary",
      r`**What you did:** located neutral axes as centroids, built up $I$ from rectangles, triangles and circles with the parallel-axis theorem, and computed bending stresses with their signs.

$$y_{\mathrm{na}} = \frac{\sum A_i \bar y_i}{\sum A_i}, \qquad I = \sum \left(I_{c,i} + A_i d_i^2\right), \qquad M = EI\kappa, \qquad \sigma = -\frac{My}{I}, \qquad |\sigma|_{\max} = \frac{|M|}{S},\ \ S = \frac{I}{y_{\max}}.$$

- $bh^3/12$ (rectangle), $\pi R^4/4$ (circle), $bh^3/36$ (triangle, centroid at $h/3$).
- Positive (sagging) $M$: compression above the neutral axis, tension below.
- The largest stress is at the chord farthest from the neutral axis.

Next: sections made of two or more materials, and the deflection of a cantilever.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Composite beams and the cantilever (Govindjee §8.3.2)    */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "sm7-l4-composite-beams",
    unitId: "sm7",
    title: "Composite beams and the cantilever",
    summary: "Modulus-weighted neutral axes, (EI)eff and stress jumps in composite sections, plus the tip deflection PL³/3EI of a cantilever.",
    textbook: "Govindjee §8.3.2",
    minutes: 15,
  },
  [
    reading(
      "composite-sections",
      r`If $E$ varies over the section (bonded layers, a timber beam with a steel plate), the kinematics still give $\varepsilon = -\kappa y$: **strain is continuous** and linear across a bonded interface. The stress $\sigma = -E(y)\kappa y$ **jumps** wherever $E$ does. Redo the two resultant conditions with $E$ kept inside the integrals (Govindjee §8.3, Example 8.8):

$$y_{\mathrm{na}} = \frac{\sum E_i A_i \bar y_i}{\sum E_i A_i}, \qquad (EI)_{\mathrm{eff}} = \int_A E\,y^2\,\mathrm{d}A = \sum E_i\left(I_{c,i} + A_i d_i^2\right),$$

$$M = (EI)_{\mathrm{eff}}\,\kappa, \qquad \sigma = -E(y)\,\kappa\,y = -\frac{M\,y\,E(y)}{(EI)_{\mathrm{eff}}}.$$

- The neutral axis is the **modulus-weighted centroid**, so it is attracted to the stiffest part of the section.
- Each $d_i$ is measured from the **composite** neutral axis, not from the geometric centroid.
- The largest stress need not be at an outer chord: a stiff layer near the axis can out-stress a soft layer far from it.
- Symmetric layering (the same material top and bottom) keeps the neutral axis at mid-height.`,
      { title: "Sections made of several materials" },
    ),
    mc("interface-continuity", {
      question: "Two layers with different moduli are perfectly bonded and the beam bends. At the interface, which statement is right?",
      choices: [
        ["strain", "The strain is the same on both sides; the stress jumps by the ratio of the moduli."],
        ["stress", "The stress is the same on both sides; the strain jumps.", r`Strain comes from kinematics, $\varepsilon = -\kappa y$, which knows nothing about the materials, so it is continuous. It is the stress $E\varepsilon$ that jumps.`],
        ["both-cont", "Both the strain and the stress are continuous.", r`$\sigma = E\varepsilon$, and $E$ jumps at the interface while $\varepsilon$ does not.`],
        ["both-jump", "Both jump.", "Plane sections remain plane, so the strain profile is one straight line through the whole depth."],
      ],
      correct: "strain",
      shuffle: true,
      hint: "Which of the two comes from kinematics alone, and which needs the modulus?",
      explanation: r`$\varepsilon = -\kappa y$ comes from plane sections remaining plane, so it is one straight line through the whole depth and continuous at the bond. $\sigma = E\varepsilon$, so at the interface $\sigma_{\text{stiff}}/\sigma_{\text{soft}} = E_{\text{stiff}}/E_{\text{soft}}$. Stress plots of composite beams are broken straight lines with a jump at each interface (Govindjee Fig. 8.20).`,
      tags: ["composite"],
    }),
    tf("na-toward-stiff", {
      statement: "Bonding a stiff steel plate to the bottom of a timber beam moves the neutral axis down, toward the steel.",
      answer: true,
      feedback: r`Look at the weights in $y_{\mathrm{na}} = \sum E_iA_i\bar y_i / \sum E_iA_i$.`,
      hint: r`In $y_{\mathrm{na}} = \sum E_iA_i\bar y_i / \sum E_iA_i$, each part is weighted by $E_iA_i$, not just by $A_i$.`,
      explanation: r`True. The neutral axis is the modulus-weighted centroid, so a part with a large $EA$ pulls it toward itself. In Govindjee's words, the neutral axis is always attracted to the stiffest part of the cross-section (remark after Example 8.8).`,
      tags: ["composite", "neutral-axis"],
    }),
    numeric("layers-top", {
      body: r`A composite section $40\ \mathrm{mm}$ wide has three bonded horizontal layers: a $20\ \mathrm{mm}$ top layer and a $20\ \mathrm{mm}$ bottom layer with $E = 50\ \mathrm{N/mm^2}$, and a $40\ \mathrm{mm}$ core with $E = 300\ \mathrm{N/mm^2}$ (total depth $80\ \mathrm{mm}$). It is bent to a curvature $\kappa = 2 \times 10^{-4}\ \mathrm{mm^{-1}}$.`,
      question: r`What is the bending stress at the top surface? Answer in $\mathrm{N/mm^2}$ (MPa), with sign.`,
      answer: -0.4, // check: symmetric => NA at mid-height; top y = +40; σ = −Eκy = −50·2e-4·40 = −0.4 N/mm²
      tolerance: 0.004,
      prefix: r`$\sigma =$`,
      suffix: r`$\mathrm{N/mm^2}$`,
      answerDisplay: r`-0.4\ \mathrm{N/mm^2}`,
      hint: r`The layering is symmetric, so where is the neutral axis? Then use $\sigma = -E(y)\kappa y$ with the modulus of the layer you are in.`,
      explanation: r`The section is symmetric top-to-bottom in both geometry and modulus, so the neutral axis is at mid-height and the top surface is at $y = +40\ \mathrm{mm}$. Then $\sigma = -E\kappa y = -(50)(2 \times 10^{-4})(40) = -0.4\ \mathrm{N/mm^2}$ (compression, since $\kappa > 0$).`,
      tags: ["composite", "bending-stress"],
    }),
    numeric("layers-soft-side", {
      question: r`What is the stress just **above** the upper interface ($y = +20\ \mathrm{mm}$, in the soft top layer)? Answer in $\mathrm{N/mm^2}$, with sign.`,
      answer: -0.2, // check: σ = −Eκy = −50·2e-4·20 = −0.2 N/mm²
      tolerance: 0.002,
      prefix: r`$\sigma =$`,
      suffix: r`$\mathrm{N/mm^2}$`,
      answerDisplay: r`-0.2\ \mathrm{N/mm^2}`,
      hint: "Same strain formula. Which modulus applies just above the interface?",
      explanation: r`The strain there is $\varepsilon = -\kappa y = -(2 \times 10^{-4})(20) = -4 \times 10^{-3}$. In the top layer $E = 50\ \mathrm{N/mm^2}$, so $\sigma = E\varepsilon = -0.2\ \mathrm{N/mm^2}$.`,
      tags: ["composite", "bending-stress"],
    }),
    numeric("layers-core-side", {
      question: r`And just **below** the upper interface ($y = +20\ \mathrm{mm}$, in the stiff core)? Answer in $\mathrm{N/mm^2}$, with sign.`,
      answer: -1.2, // check: σ = −Eκy = −300·2e-4·20 = −1.2 N/mm²
      tolerance: 0.012,
      prefix: r`$\sigma =$`,
      suffix: r`$\mathrm{N/mm^2}$`,
      answerDisplay: r`-1.2\ \mathrm{N/mm^2}`,
      hint: "The strain is the same as just above the interface. Only the modulus changes.",
      explanation: r`Same strain, $-4 \times 10^{-3}$, but now $E = 300\ \mathrm{N/mm^2}$, so $\sigma = -1.2\ \mathrm{N/mm^2}$. Across the bond the stress jumps by the modulus ratio $300/50 = 6$ while the strain is continuous.`,
      tags: ["composite", "bending-stress"],
    }),
    mc("layers-max", {
      question: r`Where in this three-layer section is $|\sigma|$ largest?`,
      choices: [
        ["iface", r`In the core, at the two interfaces ($y = \pm 20\ \mathrm{mm}$).`],
        ["outer", r`At the top and bottom surfaces ($y = \pm 40\ \mathrm{mm}$).`, r`For a single material, yes. Here the outer layers are six times softer: compare $50 \times 40$ with $300 \times 20$.`],
        ["center", "At mid-height.", "The strain, and so the stress, is zero on the neutral axis."],
        ["uniform", "It is the same everywhere in the core.", r`Inside the core $\sigma = -300\,\kappa y$ is still linear in $y$.`],
      ],
      correct: "iface",
      hint: r`$|\sigma| = E(y)\,|\kappa|\,|y|$. Compare $E|y|$ at the outer surface with $E|y|$ on the core side of an interface.`,
      explanation: r`$|\sigma| = E|\kappa||y|$. At the surface $E|y| = 50 \times 40 = 2000$; on the core side of an interface $E|y| = 300 \times 20 = 6000$. So the core edges carry $1.2\ \mathrm{N/mm^2}$ against $0.4\ \mathrm{N/mm^2}$ at the surfaces. In composite sections the maximum bending stress need not be at the outer chords (Govindjee, remark after Example 8.6).`,
      tags: ["composite", "bending-stress"],
    }),
    numeric("timber-steel-na", {
      body: r`A timber beam $100\ \mathrm{mm}$ wide and $150\ \mathrm{mm}$ deep ($E = 10\ \mathrm{GPa}$) has a steel plate $100\ \mathrm{mm}$ wide and $10\ \mathrm{mm}$ thick ($E = 200\ \mathrm{GPa}$) bonded to its underside.`,
      question: r`Where is the neutral axis? Give its height above the bottom of the steel, in mm (three significant figures).`,
      answer: 39.29, // check: timber EA = 10 000·15 000 = 1.5e8 N at 10 + 75 = 85 mm; steel EA = 200 000·1000 = 2e8 N at 5 mm; (1.5e8·85 + 2e8·5)/3.5e8 = 1.375e10/3.5e8 = 39.29 mm
      tolerance: 0.4,
      prefix: r`$y_{\mathrm{na}} =$`,
      suffix: "mm",
      answerDisplay: r`39.3\ \mathrm{mm}`,
      hint: r`Weight each part's centroid by $E_iA_i$ (work in $\mathrm{N/mm^2}$ and $\mathrm{mm^2}$). Measure the timber's centroid from the bottom of the steel.`,
      explanation: r`Timber: $EA = (10\,000\ \mathrm{N/mm^2})(15\,000\ \mathrm{mm^2}) = 1.5 \times 10^{8}\ \mathrm{N}$, centroid at $10 + 75 = 85\ \mathrm{mm}$. Steel: $EA = (200\,000)(1000) = 2.0 \times 10^{8}\ \mathrm{N}$, centroid at $5\ \mathrm{mm}$. So $y_{\mathrm{na}} = (1.5 \times 10^{8} \cdot 85 + 2.0 \times 10^{8} \cdot 5)/(3.5 \times 10^{8}) = 39.3\ \mathrm{mm}$, far below the $80\ \mathrm{mm}$ geometric centroid. The plate has only 1/15 of the timber's area, yet it pulls the axis toward itself.`,
      tags: ["composite", "neutral-axis"],
    }),
    numeric("timber-steel-ei", {
      question: r`What is the effective bending stiffness $(EI)_{\mathrm{eff}}$ of this timber–steel section? Answer in $\mathrm{kN\cdot m^2}$ (three significant figures).`,
      answer: 831.5, // check: timber 10 000·(28.125e6 + 15 000·45.714² = 31.347e6) = 5.947e11; steel 200 000·(8333 + 1000·34.286² = 1.1755e6) = 2.368e11; sum 8.315e11 N·mm² = 831.5 kN·m²
      tolerance: 8,
      prefix: r`$(EI)_{\mathrm{eff}} =$`,
      suffix: r`$\mathrm{kN\cdot m^2}$`,
      answerDisplay: r`8.31 \times 10^{11}\ \mathrm{N\cdot mm^2} = 831\ \mathrm{kN\cdot m^2}`,
      hint: r`Each part contributes $E_i(I_{c,i} + A_i d_i^2)$, with $d_i$ measured from the composite neutral axis at 39.3 mm. Then $1\ \mathrm{kN\cdot m^2} = 10^{9}\ \mathrm{N\cdot mm^2}$.`,
      explanation: r`Timber: $I_c = 100 \times 150^3/12 = 28.13 \times 10^{6}\ \mathrm{mm^4}$, $d = 85 - 39.29 = 45.71\ \mathrm{mm}$, $Ad^2 = 15\,000 \times 45.71^2 = 31.35 \times 10^{6}$, so $E(I_c + Ad^2) = 10\,000 \times 59.47 \times 10^{6} = 5.947 \times 10^{11}\ \mathrm{N\cdot mm^2}$. Steel: $I_c = 100 \times 10^3/12 = 8.3 \times 10^{3}$, $d = 39.29 - 5 = 34.29\ \mathrm{mm}$, $Ad^2 = 1000 \times 34.29^2 = 1.176 \times 10^{6}$, so $E(I_c + Ad^2) = 200\,000 \times 1.184 \times 10^{6} = 2.368 \times 10^{11}$. Sum: $(EI)_{\mathrm{eff}} = 8.31 \times 10^{11}\ \mathrm{N\cdot mm^2} = 831\ \mathrm{kN\cdot m^2}$.`,
      tags: ["composite", "second-moment"],
    }),
    numeric("tee-two-moduli", {
      body: r`Go back to the T-section of lesson 3 (flange $200 \times 20\ \mathrm{mm}$ on a web $100\ \mathrm{mm}$ tall and $20\ \mathrm{mm}$ thick), but now the flange is aluminium ($E = 70\ \mathrm{GPa}$) and the web is steel ($E = 210\ \mathrm{GPa}$).`,
      question: r`Where is the neutral axis now? Give its height above the bottom of the web, in mm.`,
      answer: 74, // check: E_f A_f = 70 000·4000 = 2.8e8 at 110; E_w A_w = 210 000·2000 = 4.2e8 at 50; (3.08e10 + 2.1e10)/7.0e8 = 74 mm
      tolerance: 0.74,
      prefix: r`$y_{\mathrm{na}} =$`,
      suffix: "mm",
      answerDisplay: r`74\ \mathrm{mm}`,
      hint: r`The part centroids are where they were (110 mm and 50 mm). Only the weights change, from $A_i$ to $E_iA_i$.`,
      explanation: r`$E_fA_f = 70\,000 \times 4000 = 2.8 \times 10^{8}\ \mathrm{N}$ at $110\ \mathrm{mm}$; $E_wA_w = 210\,000 \times 2000 = 4.2 \times 10^{8}\ \mathrm{N}$ at $50\ \mathrm{mm}$. So $y_{\mathrm{na}} = (2.8 \times 10^{8} \cdot 110 + 4.2 \times 10^{8} \cdot 50)/(7.0 \times 10^{8}) = 74\ \mathrm{mm}$, down from $90\ \mathrm{mm}$ for the homogeneous section: the stiffer web pulls the axis toward itself.`,
      tags: ["composite", "neutral-axis"],
    }),
    numeric("elastomer-sheet-na", {
      body: r`A square elastomer bar, $100\ \mathrm{mm} \times 100\ \mathrm{mm}$ ($E = 5\ \mathrm{MPa}$), has a steel sheet $0.5\ \mathrm{mm}$ thick and $100\ \mathrm{mm}$ wide ($E = 200\ \mathrm{GPa}$) glued to its lower face.`,
      question: r`How far above the bottom of the steel sheet is the neutral axis? Answer in mm.`,
      answer: 0.5, // check: EA_e = 5·10 000 = 5e4 N at 0.5 + 50 = 50.5 mm; EA_s = 200 000·50 = 1e7 N at 0.25 mm; (5e4·50.5 + 1e7·0.25)/1.005e7 = 5.025e6/1.005e7 = 0.500 mm
      tolerance: 0.005,
      prefix: r`$y_{\mathrm{na}} =$`,
      suffix: "mm",
      answerDisplay: r`0.50\ \mathrm{mm}`,
      hint: r`Compare $EA$ for the two parts before doing any other arithmetic. Which one dominates?`,
      explanation: r`Elastomer: $EA = 5 \times 10\,000 = 5 \times 10^{4}\ \mathrm{N}$, centroid at $0.5 + 50 = 50.5\ \mathrm{mm}$. Steel: $EA = 200\,000 \times 50 = 1 \times 10^{7}\ \mathrm{N}$ (200 times more), centroid at $0.25\ \mathrm{mm}$. So $y_{\mathrm{na}} = (5 \times 10^{4} \cdot 50.5 + 10^{7} \cdot 0.25)/(1.005 \times 10^{7}) = 5.025 \times 10^{6}/1.005 \times 10^{7} = 0.50\ \mathrm{mm}$, right at the glue line. The thin sheet pins the neutral axis to the bottom of the section.`,
      tags: ["composite", "neutral-axis"],
    }),
    numeric("elastomer-sheet-ei", {
      question: r`What is $(EI)_{\mathrm{eff}}$ of this elastomer–steel section? Answer in $\mathrm{N\cdot m^2}$.`,
      answer: 167.5, // check: elastomer 5·(100⁴/12 = 8.333e6 + 10 000·50² = 2.5e7) = 1.6667e8; steel 200 000·(100·0.5³/12 = 1.04 + 50·0.25² = 3.125) = 8.33e5; total 1.675e8 N·mm² = 167.5 N·m²
      tolerance: 1.7,
      prefix: r`$(EI)_{\mathrm{eff}} =$`,
      suffix: r`$\mathrm{N\cdot m^2}$`,
      answerDisplay: r`1.675 \times 10^{8}\ \mathrm{N\cdot mm^2} = 167.5\ \mathrm{N\cdot m^2}`,
      hint: r`For the elastomer, $d$ runs from its centroid (50.5 mm) to the neutral axis (0.5 mm). Then $1\ \mathrm{N\cdot m^2} = 10^{6}\ \mathrm{N\cdot mm^2}$.`,
      explanation: r`Elastomer: $I_c = 100^4/12 = 8.333 \times 10^{6}\ \mathrm{mm^4}$, $d = 50\ \mathrm{mm}$, $Ad^2 = 10\,000 \times 2500 = 25 \times 10^{6}$, so $E(I_c + Ad^2) = 5 \times 33.33 \times 10^{6} = 1.667 \times 10^{8}\ \mathrm{N\cdot mm^2}$. Steel: $I_c = 100 \times 0.5^3/12 = 1.04\ \mathrm{mm^4}$, $d = 0.25\ \mathrm{mm}$, $Ad^2 = 50 \times 0.0625 = 3.1$, so $E \times 4.17 = 8.3 \times 10^{5}\ \mathrm{N\cdot mm^2}$. Total $(EI)_{\mathrm{eff}} = 1.675 \times 10^{8}\ \mathrm{N\cdot mm^2} = 167.5\ \mathrm{N\cdot m^2}$, about four times the bare elastomer's $41.7\ \mathrm{N\cdot m^2}$: the axis has moved from the middle to the base ($bh^3/3$ instead of $bh^3/12$).`,
      tags: ["composite", "second-moment"],
    }),
    numeric("two-material-gauge", {
      body: r`A cantilever $80\ \mathrm{mm}$ deep is made of two bonded layers of equal size: the top $40\ \mathrm{mm}$ is aluminium ($E = 70\ \mathrm{GPa}$) and the bottom $40\ \mathrm{mm}$ is steel ($E = 210\ \mathrm{GPa}$). A strain gauge on the side, a quarter of the depth below the top face, reads $\varepsilon_g = +240\ \mu$.`,
      question: r`What is the curvature $\kappa$ at the gauge's section? Answer in units of $10^{-6}\ \mathrm{mm^{-1}}$, with sign.`,
      answer: -8, // check: y_na = (70·60 + 210·20)/(70 + 210) = 8400/280 = 30 mm; gauge at y_b = 80 − 20 = 60 => y_g = +30 mm; κ = −ε/y = −240e-6/30 = −8e-6 /mm
      tolerance: 0.08,
      prefix: r`$\kappa =$`,
      suffix: r`$\times 10^{-6}\ \mathrm{mm^{-1}}$`,
      answerDisplay: r`-8 \times 10^{-6}\ \mathrm{mm^{-1}}`,
      hint: "Find the modulus-weighted neutral axis first (equal areas, so the weights are just the moduli). Then measure the gauge's y from it.",
      explanation: r`Equal areas, so $y_{\mathrm{na}} = (70 \times 60 + 210 \times 20)/(70 + 210) = 8400/280 = 30\ \mathrm{mm}$ above the bottom. The gauge is $h/4 = 20\ \mathrm{mm}$ below the top, $60\ \mathrm{mm}$ above the bottom, so $y_g = 60 - 30 = +30\ \mathrm{mm}$. Then $\kappa = -\varepsilon_g/y_g = -(240 \times 10^{-6})/30 = -8 \times 10^{-6}\ \mathrm{mm^{-1}}$: hogging, as expected for a cantilever under a downward load (tension on top). Measuring from mid-depth ($y_g = 20\ \mathrm{mm}$) would give $-12 \times 10^{-6}$, which is wrong.`,
      tags: ["composite", "curvature", "strain-gauge"],
    }),
    reading(
      "cantilever-deflection",
      r`Once $M(x)$ is known, $M = EI\kappa$ turns statics into geometry (Govindjee Example 8.9). For the cantilever built in at $x = 0$ with a downward tip load $P$ (lesson 2), $M(x) = P(x - L)$, so

$$\kappa = \frac{\mathrm{d}^2 v}{\mathrm{d}x^2} = \frac{P(x - L)}{EI}.$$

A built-in end allows neither displacement nor rotation: $v(0) = 0$ and $\theta(0) = v'(0) = 0$. Integrating twice:

$$\theta(x) = \frac{P}{EI}\left(\frac{x^2}{2} - Lx\right), \qquad v(x) = \frac{P x^2}{2EI}\left(\frac{x}{3} - L\right), \qquad v(L) = -\frac{PL^3}{3EI}.$$

So the tip moves down by $\delta = PL^3/3EI$, and the cantilever acts as a spring of stiffness

$$k = \frac{P}{\delta} = \frac{3EI}{L^3}.$$

The largest moment, and so the largest bending stress, is at the wall: $|M|_{\max} = PL$. (Govindjee §8.4 turns this into the differential equation $(EIv'')'' = q$ for any loading.)`,
      {
        title: "Deflection of an end-loaded cantilever",
        visual: { kind: "shear-moment", config: { length: 1.5, support: "cantilever-left", loads: [{ kind: "point", x: 1.5, P: 2 }], units: BEAM_UNITS } },
      },
    ),
    mc("built-in-bcs", {
      question: "Which boundary conditions describe a built-in (clamped) end of a beam?",
      choices: [
        ["clamp", r`$v = 0$ and $v' = 0$: no deflection and no rotation.`],
        ["pin", r`$v = 0$ and $M = 0$.`, "That is a pin or roller: it stops deflection but lets the section rotate freely, so it carries no moment."],
        ["free", r`$V = 0$ and $M = 0$.`, "That is a free, unloaded end."],
        ["slope", r`$v' = 0$ only.`, "A clamp stops the end from moving as well as from turning."],
      ],
      correct: "clamp",
      shuffle: true,
      hint: r`Picture the end of the beam cast into a wall. Can that end move up or down? Can it tilt? Turn each answer into a condition on $v$ or $v'$.`,
      explanation: r`A built-in support prevents both displacement and rotation: $v = 0$ and $\theta = v' = 0$ (Govindjee Example 8.9, remark 1). In exchange it can supply both a force and a moment reaction. A pin gives $v = 0$ and $M = 0$; a free end with no load gives $V = 0$ and $M = 0$.`,
      tags: ["boundary-conditions", "deflection"],
    }),
    numeric("tip-deflection", {
      body: r`A steel cantilever ($E = 200\ \mathrm{GPa}$) of length $L = 1.5\ \mathrm{m}$ has the $50 \times 120\ \mathrm{mm}$ rectangular section of lesson 3 ($I = 7.2 \times 10^{6}\ \mathrm{mm^4}$) and carries a downward tip load $P = 2\ \mathrm{kN}$.`,
      question: r`How far does the tip deflect downward, $\delta = PL^3/3EI$? Answer in mm (three significant figures).`,
      answer: 1.5625, // check: 2000·1500³/(3·200 000·7.2e6) = 6.75e12/4.32e12 = 1.5625 mm
      tolerance: 0.016,
      prefix: r`$\delta =$`,
      suffix: "mm",
      answerDisplay: r`1.56\ \mathrm{mm}`,
      hint: r`Work in N and mm: $P = 2000\ \mathrm{N}$, $L = 1500\ \mathrm{mm}$, $E = 200\,000\ \mathrm{N/mm^2}$.`,
      explanation: r`$\delta = PL^3/(3EI) = (2000)(1500^3)/(3 \times 200\,000 \times 7.2 \times 10^{6}) = 6.75 \times 10^{12}/4.32 \times 10^{12} = 1.56\ \mathrm{mm}$. In the sign convention, $v(L) = -1.56\ \mathrm{mm}$ (down).`,
      tags: ["deflection"],
    }),
    numeric("tip-stiffness", {
      question: r`What is the stiffness $k = 3EI/L^3$ of this cantilever at its tip? Answer in kN/mm (three significant figures).`,
      answer: 1.28, // check: 3·200 000·7.2e6/1500³ = 4.32e12/3.375e9 = 1280 N/mm = 1.28 kN/mm (= 2 kN / 1.5625 mm)
      tolerance: 0.013,
      prefix: r`$k =$`,
      suffix: "kN/mm",
      answerDisplay: r`1.28\ \mathrm{kN/mm}`,
      hint: r`Keep N and mm; the result comes out in N/mm. Or divide the load by the deflection you just found.`,
      explanation: r`$k = 3EI/L^3 = (3 \times 200\,000 \times 7.2 \times 10^{6})/1500^3 = 4.32 \times 10^{12}/3.375 \times 10^{9} = 1280\ \mathrm{N/mm} = 1.28\ \mathrm{kN/mm}$. Check: $P/\delta = 2000/1.5625 = 1280\ \mathrm{N/mm}$. Doubling the length divides the stiffness by 8.`,
      tags: ["deflection"],
    }),
    numeric("wall-stress", {
      question: r`Same cantilever: the wall moment is $M(0) = -PL = -3\ \mathrm{kN\cdot m}$. What is the bending stress at the **top** fibre at the wall ($y = +60\ \mathrm{mm}$)? Answer in MPa, with sign.`,
      answer: 25, // check: σ = −My/I = −(−3e6)(60)/(7.2e6) = +25 MPa
      tolerance: 0.25,
      prefix: r`$\sigma =$`,
      suffix: "MPa",
      answerDisplay: r`+25\ \mathrm{MPa}`,
      hint: r`Use $\sigma = -My/I$ with $M = -3 \times 10^{6}\ \mathrm{N\cdot mm}$ and $y = +60\ \mathrm{mm}$. Two minus signs.`,
      explanation: r`$\sigma = -My/I = -(-3 \times 10^{6})(60)/(7.2 \times 10^{6}) = +25\ \mathrm{MPa}$: tension on top, as a hogging moment requires. The bottom fibre at the wall carries $-25\ \mathrm{MPa}$. This is the largest bending stress anywhere in the beam, since $|M|$ is largest at the wall.`,
      tags: ["bending-stress", "sign-convention"],
    }),
    reading(
      "summary",
      r`**What you did:** located modulus-weighted neutral axes, built $(EI)_{\mathrm{eff}}$ part by part, found the stress jumps at bonded interfaces, read curvature from a gauge on a two-material beam, and integrated $M = EI\kappa$ for a cantilever's deflection.

$$y_{\mathrm{na}} = \frac{\sum E_iA_i\bar y_i}{\sum E_iA_i}, \qquad (EI)_{\mathrm{eff}} = \sum E_i\left(I_{c,i} + A_id_i^2\right), \qquad \sigma = -\frac{M\,y\,E(y)}{(EI)_{\mathrm{eff}}}.$$

$$v(L) = -\frac{PL^3}{3EI}, \qquad k = \frac{3EI}{L^3}, \qquad \text{built-in end: } v = v' = 0.$$

- Strain is continuous across a bonded interface; stress jumps by the modulus ratio.
- The neutral axis moves toward the stiff material; measure every $y$ (and every $d_i$) from it.
- The peak stress in a composite section can sit at an interface rather than at an outer chord.

You've finished the unit. Take the **Level Check** to see what sticks without hints.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit practice bank (Level Check)                                     */
/* ------------------------------------------------------------------ */

const practice = [
  numeric("p-strain-hogging", {
    question: r`A section has curvature $\kappa = -5 \times 10^{-6}\ \mathrm{mm^{-1}}$ (hogging). What is the bending strain at $y = -30\ \mathrm{mm}$ (below the neutral axis)? Answer in micro-strain, with sign.`,
    answer: -150, // check: ε = −κy = −(−5e-6)(−30) = −1.5e-4 = −150 μ
    tolerance: 1.5,
    prefix: r`$\varepsilon_{xx} =$`,
    suffix: "μ",
    answerDisplay: r`-150 \times 10^{-6}`,
    hint: r`$\varepsilon_{xx} = -\kappa y$; both $\kappa$ and $y$ are negative here.`,
    explanation: r`$\varepsilon_{xx} = -\kappa y = -(-5 \times 10^{-6})(-30) = -1.5 \times 10^{-4} = -150\ \mu$. Hogging compresses the fibres below the neutral axis.`,
    tags: ["bending-strain"],
  }),
  numeric("p-kappa-gauge", {
    question: r`A strain gauge $40\ \mathrm{mm}$ **below** the neutral axis reads $+360\ \mu$. What is the curvature? Answer in units of $10^{-6}\ \mathrm{mm^{-1}}$, with sign.`,
    answer: 9, // check: κ = −ε/y = −(360e-6)/(−40) = +9e-6 /mm
    tolerance: 0.09,
    prefix: r`$\kappa =$`,
    suffix: r`$\times 10^{-6}\ \mathrm{mm^{-1}}$`,
    answerDisplay: r`9 \times 10^{-6}\ \mathrm{mm^{-1}}`,
    hint: r`Solve $\varepsilon = -\kappa y$ for $\kappa$ with $y = -40\ \mathrm{mm}$.`,
    explanation: r`$\kappa = -\varepsilon/y = -(360 \times 10^{-6})/(-40) = +9 \times 10^{-6}\ \mathrm{mm^{-1}}$: tension below the axis means sagging.`,
    tags: ["curvature", "strain-gauge"],
  }),
  numeric("p-shear-right", {
    question: r`A simply supported beam of span $10\ \mathrm{m}$ carries a downward point load of $30\ \mathrm{kN}$ at $x = 4\ \mathrm{m}$. In the course (Govindjee) convention, what is the shear force at $x = 7\ \mathrm{m}$? Answer in kN, with sign.`,
    answer: 12, // check: R_A = 30·6/10 = 18, R_B = 30·4/10 = 12; for x > 4: V = −R_A + P = −18 + 30 = +12 kN = +R_B
    tolerance: 0.12,
    prefix: r`$V =$`,
    suffix: "kN",
    answerDisplay: r`+12\ \mathrm{kN}`,
    hint: r`Find $R_A$, then remember that $V(0^+) = -R_A$ and a downward load makes $V$ jump by $+P$.`,
    explanation: r`$R_A = 30 \times 6/10 = 18\ \mathrm{kN}$ and $R_B = 30 \times 4/10 = 12\ \mathrm{kN}$. $V = -18\ \mathrm{kN}$ up to the load, then $-18 + 30 = +12\ \mathrm{kN}$ ($= +R_B$) beyond it. Beer/Hibbeler would say $-12\ \mathrm{kN}$.`,
    tags: ["shear-value", "sign-convention"],
  }),
  numeric("p-udl-mmax", {
    question: r`A simply supported beam of span $8\ \mathrm{m}$ carries a uniform downward load of $5\ \mathrm{kN/m}$. What is the maximum bending moment, in kN·m?`,
    answer: 40, // check: wL²/8 = 5·64/8 = 40 kN·m
    tolerance: 0.4,
    prefix: r`$M_{\max} =$`,
    suffix: "kN·m",
    answerDisplay: r`40\ \mathrm{kN\cdot m}`,
    hint: "The maximum is at mid-span, where V = 0.",
    explanation: r`$M_{\max} = wL^2/8 = 5 \times 64/8 = 40\ \mathrm{kN\cdot m}$ (sagging), at $x = 4\ \mathrm{m}$.`,
    tags: ["max-moment"],
  }),
  numeric("p-cantilever-m0", {
    question: r`A cantilever $2.5\ \mathrm{m}$ long, built in at $x = 0$, carries a downward tip load of $8\ \mathrm{kN}$. What is $M(0)$ in kN·m, with sign?`,
    answer: -20, // check: M(x) = P(x − L) => M(0) = −PL = −8·2.5 = −20 kN·m
    tolerance: 0.2,
    prefix: r`$M(0) =$`,
    suffix: "kN·m",
    answerDisplay: r`-20\ \mathrm{kN\cdot m}`,
    hint: r`$M(x) = P(x - L)$ for this cantilever.`,
    explanation: r`$M(0) = P(0 - L) = -8 \times 2.5 = -20\ \mathrm{kN\cdot m}$: hogging, top fibres in tension at the wall.`,
    tags: ["shear-moment", "sign-convention"],
  }),
  numeric("p-rect-i", {
    question: r`What is $I$ for a rectangular section $60\ \mathrm{mm}$ wide and $200\ \mathrm{mm}$ deep, about its horizontal centroidal axis? Answer in units of $10^6\ \mathrm{mm^4}$.`,
    answer: 40, // check: 60·200³/12 = 60·8e6/12 = 4.0e7 mm⁴
    tolerance: 0.4,
    prefix: r`$I =$`,
    suffix: r`$\times 10^{6}\ \mathrm{mm^4}$`,
    answerDisplay: r`40 \times 10^{6}\ \mathrm{mm^4}`,
    hint: r`$bh^3/12$ with $h$ the depth.`,
    explanation: r`$I = bh^3/12 = 60 \times 200^3/12 = 4.0 \times 10^{7}\ \mathrm{mm^4} = 40 \times 10^{6}\ \mathrm{mm^4}$.`,
    tags: ["second-moment"],
  }),
  numeric("p-tee-na", {
    question: r`A homogeneous T-section has a flange $120 \times 20\ \mathrm{mm}$ on top of a web $120\ \mathrm{mm}$ tall and $20\ \mathrm{mm}$ thick. How far above the bottom of the web is the neutral axis? Answer in mm.`,
    answer: 95, // check: A_f = 2400 at 130, A_w = 2400 at 60; (2400·130 + 2400·60)/4800 = 95 mm
    tolerance: 0.95,
    prefix: r`$y_{\mathrm{na}} =$`,
    suffix: "mm",
    answerDisplay: r`95\ \mathrm{mm}`,
    hint: r`$y_{\mathrm{na}} = \sum A_i\bar y_i/\sum A_i$, with centroids measured from the bottom of the web.`,
    explanation: r`Flange: $2400\ \mathrm{mm^2}$ at $120 + 10 = 130\ \mathrm{mm}$; web: $2400\ \mathrm{mm^2}$ at $60\ \mathrm{mm}$. Equal areas, so $y_{\mathrm{na}} = (130 + 60)/2 = 95\ \mathrm{mm}$.`,
    tags: ["neutral-axis", "centroid"],
  }),
  numeric("p-parallel-axis", {
    question: r`A plate $80\ \mathrm{mm}$ wide and $30\ \mathrm{mm}$ thick has its centroid $60\ \mathrm{mm}$ from the neutral axis of a built-up section. What is its contribution to $I$? Answer in units of $10^6\ \mathrm{mm^4}$ (three significant figures).`,
    answer: 8.82, // check: 80·30³/12 = 180 000; A d² = 2400·60² = 8 640 000; total 8 820 000 mm⁴
    tolerance: 0.09,
    prefix: r`$I =$`,
    suffix: r`$\times 10^{6}\ \mathrm{mm^4}$`,
    answerDisplay: r`8.82 \times 10^{6}\ \mathrm{mm^4}`,
    hint: r`$I = I_c + Ad^2$.`,
    explanation: r`$I_c = 80 \times 30^3/12 = 0.18 \times 10^{6}$ and $Ad^2 = 2400 \times 60^2 = 8.64 \times 10^{6}$, so $I = 8.82 \times 10^{6}\ \mathrm{mm^4}$.`,
    tags: ["parallel-axis"],
  }),
  numeric("p-sigma-max", {
    question: r`The $60 \times 200\ \mathrm{mm}$ section ($I = 40 \times 10^{6}\ \mathrm{mm^4}$) carries $M = 12\ \mathrm{kN\cdot m}$. What is $|\sigma|_{\max}$ in MPa?`,
    answer: 30, // check: M y_max/I = 12e6·100/4e7 = 30 MPa
    tolerance: 0.3,
    prefix: r`$|\sigma|_{\max} =$`,
    suffix: "MPa",
    answerDisplay: r`30\ \mathrm{MPa}`,
    hint: r`$|\sigma|_{\max} = M y_{\max}/I$ with $M$ in N·mm.`,
    explanation: r`$|\sigma|_{\max} = (12 \times 10^{6})(100)/(40 \times 10^{6}) = 30\ \mathrm{MPa}$.`,
    tags: ["bending-stress"],
  }),
  numeric("p-sigma-hogging", {
    question: r`The same section carries a hogging moment $M = -8\ \mathrm{kN\cdot m}$. What is the bending stress at $y = +50\ \mathrm{mm}$? Answer in MPa, with sign.`,
    answer: 10, // check: σ = −My/I = −(−8e6)(50)/(4e7) = +10 MPa
    tolerance: 0.1,
    prefix: r`$\sigma =$`,
    suffix: "MPa",
    answerDisplay: r`+10\ \mathrm{MPa}`,
    hint: r`$\sigma = -My/I$. Keep both signs.`,
    explanation: r`$\sigma = -(-8 \times 10^{6})(50)/(40 \times 10^{6}) = +10\ \mathrm{MPa}$: tension above the axis under a hogging moment.`,
    tags: ["bending-stress", "sign-convention"],
  }),
  numeric("p-two-layer-ei", {
    question: r`A $40\ \mathrm{mm}$ wide section has a $20\ \mathrm{mm}$ aluminium layer ($E = 70\ \mathrm{GPa}$) bonded on top of a $20\ \mathrm{mm}$ steel layer ($E = 210\ \mathrm{GPa}$). What is $(EI)_{\mathrm{eff}}$? Answer in $\mathrm{kN\cdot m^2}$ (three significant figures).`,
    answer: 24.27, // check: y_na = (210·10 + 70·30)/280 = 15 mm; steel 210 000·(26 667 + 800·5²) = 9.80e9; Al 70 000·(26 667 + 800·15²) = 1.4467e10; total 2.4267e10 N·mm² = 24.27 kN·m²
    tolerance: 0.25,
    prefix: r`$(EI)_{\mathrm{eff}} =$`,
    suffix: r`$\mathrm{kN\cdot m^2}$`,
    answerDisplay: r`24.3\ \mathrm{kN\cdot m^2}`,
    hint: r`Locate the modulus-weighted neutral axis first, then add $E_i(I_{c,i} + A_id_i^2)$ for both layers. $1\ \mathrm{kN\cdot m^2} = 10^{9}\ \mathrm{N\cdot mm^2}$.`,
    explanation: r`Equal areas ($800\ \mathrm{mm^2}$), so $y_{\mathrm{na}} = (210 \times 10 + 70 \times 30)/280 = 15\ \mathrm{mm}$ above the bottom. Each layer has $I_c = 40 \times 20^3/12 = 26\,667\ \mathrm{mm^4}$. Steel: $210\,000\,(26\,667 + 800 \times 5^2) = 9.80 \times 10^{9}$. Aluminium: $70\,000\,(26\,667 + 800 \times 15^2) = 14.47 \times 10^{9}$. Total $2.43 \times 10^{10}\ \mathrm{N\cdot mm^2} = 24.3\ \mathrm{kN\cdot m^2}$.`,
    tags: ["composite", "second-moment"],
  }),
  numeric("p-tip-deflection", {
    question: r`A cantilever $2\ \mathrm{m}$ long ($E = 200\ \mathrm{GPa}$, $I = 40 \times 10^{6}\ \mathrm{mm^4}$) carries a downward tip load of $3\ \mathrm{kN}$. What is the tip deflection $\delta = PL^3/3EI$, in mm?`,
    answer: 1, // check: 3000·2000³/(3·200 000·4e7) = 2.4e13/2.4e13 = 1.00 mm
    tolerance: 0.01,
    prefix: r`$\delta =$`,
    suffix: "mm",
    answerDisplay: r`1.00\ \mathrm{mm}`,
    hint: "Work in N and mm.",
    explanation: r`$\delta = (3000)(2000^3)/(3 \times 200\,000 \times 40 \times 10^{6}) = 2.4 \times 10^{13}/2.4 \times 10^{13} = 1.00\ \mathrm{mm}$ (down, so $v(L) = -1.00\ \mathrm{mm}$).`,
    tags: ["deflection"],
  }),
  multi("p-convention", {
    question: "Select **every** statement that holds in the course (Govindjee) sign convention.",
    choices: [
      ["v-up", r`A positive shear force $V$ on the face with outward normal $+\mathbf{e}_x$ points in $+y$ (up).`],
      ["m-sag", r`A positive bending moment $M$ compresses the fibres above the neutral axis (sagging).`],
      ["q-down", r`The distributed load $q$ is positive when it acts downward.`],
      ["dm-plus", r`$\mathrm{d}M/\mathrm{d}x = +V$.`],
      ["jump", r`A downward point force $P$ makes $V$ jump by $+P$ (moving left to right).`],
      ["cant", r`A cantilever built in at $x = 0$ with a downward tip load $P$ has $V = +P$.`],
    ],
    correct: ["v-up", "m-sag", "jump"],
    hint: r`Start from $V = \int_A \sigma_{xy}\,\mathrm{d}A$, $M = -\int_A y\,\sigma_{xx}\,\mathrm{d}A$, $\mathrm{d}V/\mathrm{d}x + q = 0$ and $\mathrm{d}M/\mathrm{d}x + V = 0$.`,
    explanation: r`True: positive $V$ points up on the $+x$ face; positive $M$ is sagging; a downward $P$ is $q = -P\delta(x - a)$, so $V$ jumps by $+P$. False: $q$ is positive **up**; $\mathrm{d}M/\mathrm{d}x = -V$ (the $+V$ form is Beer/Hibbeler's); the cantilever has $V = -P$.`,
    tags: ["sign-convention"],
  }),
  tf("p-composite-max", {
    statement: "In a composite beam the largest bending stress always occurs at the top or bottom surface.",
    answer: false,
    feedback: r`Compare $E|y|$ for a stiff layer close to the neutral axis with $E|y|$ for a soft layer at the surface.`,
    hint: r`$|\sigma| = E(y)\,|\kappa|\,|y|$. What if a stiff layer lies close to the neutral axis?`,
    explanation: r`False. $|\sigma| = E|\kappa||y|$, so a stiff layer near the axis can carry more stress than a soft layer at the surface, e.g. a core with $E = 300$ at $|y| = 20$ ($E|y| = 6000$) beats an outer layer with $E = 50$ at $|y| = 40$ ($E|y| = 2000$). The *strain* is always largest at the outer chords.`,
    tags: ["composite", "bending-stress"],
  }),
];

export const sm7: Unit = {
  id: "sm7",
  title: "Bending of beams",
  subtitle: "Kinematics, equilibrium and elastic response of symmetric bending",
  description: "Plane sections stay plane, so strain varies linearly through the depth; equilibrium gives shear and moment diagrams (in the book's sign convention); Hooke's law gives σ = −M y / I and the neutral axis.",
  textbook: "Govindjee §8.1–8.3",
  lessons: [l1, l2, l3, l4],
  practice,
  generators: [
    "gen.sm.second-moment",
    "gen.sm.parallel-axis",
    "gen.sm.neutral-axis",
    "gen.sm.bending-stress",
    "gen.sm.curvature",
    "gen.sm.max-moment",
    "gen.sm.shear-value",
  ],
};
