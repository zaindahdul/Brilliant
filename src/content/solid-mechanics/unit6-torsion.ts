import type { Unit, VisualSpec } from "../types";
import { lesson, mc, multi, numeric, order, r, reading, tf } from "../dsl";

/*
 * Unit sm6 · Torsion (Govindjee ch. 7: §7.1–7.4 and §7.7; the plastic torsion of §7.5–7.6 is not covered).
 *
 * Sign convention used throughout (the book's):
 * - z runs along the shaft; torques are vectors along ±e_z by the right-hand rule (a positive z-component points in +z).
 * - The internal torque T(z) = ∫ r τ_zθ dA acts on the cut face whose outward normal is +e_z (the right end of the
 *   left-hand piece). Section-cut rule: T(z) = −(sum of applied torques on the part left of the cut)
 *                                          = +(sum of applied torques on the part right of the cut).
 * - A point torque with z-component M_a at z = a is t = M_a δ(z − a): crossing it in +z, T drops by M_a.
 * - φ(z) rotation, φ' = dφ/dz = T/GJ twist rate, γ = r φ', τ = G γ = T r / J.
 * Units: N, mm, MPa (= N/mm²) unless stated; 1 N·m = 1000 N·mm; 1 kN·m = 10^6 N·mm; 1 kN·m² = 10^9 N·mm².
 */

/** Cross-section visual in consistent units: T in N·mm, lengths in mm, G in MPa, so τ comes out in MPa. */
function section(T: number, ro: number, opts: { ri?: number; G?: number; sliders?: boolean } = {}): VisualSpec {
  return {
    kind: "torsion-section",
    config: { T, ro, ...opts, units: { torque: "N·mm", length: "mm", stress: "MPa" } },
  };
}

/* ------------------------------------------------------------------ */
/* Lesson 1 · Kinematics of circular torsion (Govindjee §7.1)          */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "sm6-l1-kinematics",
    unitId: "sm6",
    title: "Kinematics of circular torsion",
    summary: "Cross-sections rotate rigidly, so the shear strain is γ = r dφ/dz: zero on the axis, largest at the surface. Plus the axial-bar ↔ torsion analogy.",
    textbook: "Govindjee §7.1",
    minutes: 12,
  },
  [
    reading(
      "rigid-rotation",
      r`Paint a square grid on a round bar and twist it. The circumferential lines stay in their planes and the grid squares shear into parallelograms: **cross-sections remain plane and rotate rigidly**, each by its own angle $\phi(z)$. The rotation $\phi(z)$ plays the role that the displacement $u(x)$ played for axial bars.

Cut a thin piece between $z$ and $z + \Delta z$ and look at markers on a core of radius $r$. The lower ones move along the arc by $r\phi(z)$, the upper ones by $r\phi(z + \Delta z)$. Unwrap the core into a flat sheet: the right angle between the $z$-direction and the $\theta$-direction has decreased by

$$\gamma_{z\theta} = \frac{r\phi(z+\Delta z) - r\phi(z)}{\Delta z} \;\longrightarrow\; \gamma = r\,\frac{d\phi}{dz} = r\,\phi'(z).$$

- $\phi' = d\phi/dz$ is the **twist rate**, in radians per unit length.
- $\gamma$ is **linear in $r$**: zero on the axis, largest at the outer radius, $\gamma_{max} = R\,\phi'$.
- It doesn't depend on $\theta$ (the problem is axisymmetric), and the derivation uses **no material law**. It is pure geometry, valid for elastic, plastic and radially layered bars alike.

The cross-section below shows the shear stress that a torque produces in an elastic shaft. It is linear in $r$ because $\gamma$ is.`,
      { title: "Sections rotate rigidly", visual: section(500000, 20, { G: 80000, sliders: true }) },
    ),
    numeric("surface-strain", {
      question: r`A solid shaft of radius $R = 20\,\mathrm{mm}$ twists at $\phi' = 2 \times 10^{-4}\,\mathrm{rad/mm}$. What is the shear strain at the outer surface? Answer in micro-strain ($10^{-6}$).`,
      answer: 4000, // check: γ = Rφ' = 20 mm · 2e-4 rad/mm = 0.004 = 4000 μ
      tolerance: 40,
      suffix: "μ",
      answerDisplay: r`4000\,\mu`,
      hint: r`$\gamma = r\phi'$. The units work out because rad/mm times mm is dimensionless.`,
      explanation: r`$\gamma_{max} = R\phi' = 20\,\mathrm{mm} \times 2\times10^{-4}\,\mathrm{rad/mm} = 0.004 = 4000\,\mu$. Shear strains in real shafts are small. That is why the small-angle step ($\tan\gamma \approx \gamma$) in the derivation is safe.`,
      tags: ["kinematics", "shear-strain"],
    }),
    numeric("inner-strain", {
      question: r`Same shaft, same twist rate. What is $\gamma$ at $r = 5\,\mathrm{mm}$? Answer in micro-strain.`,
      answer: 1000, // check: γ = 5 · 2e-4 = 0.001 = 1000 μ (a quarter of the surface value since 5/20 = 1/4)
      tolerance: 10,
      suffix: "μ",
      answerDisplay: r`1000\,\mu`,
      hint: "The strain is proportional to the distance from the axis. What fraction of the outer radius is 5 mm?",
      explanation: r`$\gamma = r\phi' = 5 \times 2\times10^{-4} = 0.001 = 1000\,\mu$, exactly $5/20 = 1/4$ of the surface value. The linear profile is the whole content of the kinematic assumption.`,
      tags: ["kinematics", "shear-strain"],
    }),
    mc("where-zero", {
      question: r`In a twisted circular shaft, where is the shear strain $\gamma$ zero?`,
      choices: [
        ["axis", r`On the axis, $r = 0$`],
        ["surface", "At the outer surface", r`The outer surface is where $\gamma = R\phi'$ is *largest*.`],
        ["fixed", r`At the fixed end, where $\phi = 0$`, r`$\gamma = r\,d\phi/dz$ depends on the *rate* of rotation, not on $\phi$ itself. A fixed end has $\phi = 0$ but generally $\phi' \neq 0$.`],
        ["nowhere", "Nowhere; it is uniform over the section", r`It is linear in $r$, not uniform. Uniform shear over the section would need $\gamma$ to be independent of $r$.`],
      ],
      correct: "axis",
      shuffle: true,
      hint: r`Set $r$ to the value that makes $r\phi'$ vanish for any twist rate.`,
      explanation: r`$\gamma = r\phi'$ vanishes at $r = 0$ for every twist rate. Material near the axis barely strains, which is why hollow shafts are so efficient: the core you remove carried little stress.`,
      tags: ["kinematics"],
    }),
    tf("quadratic", {
      statement: r`The shear strain in a twisted circular bar varies quadratically with the radius $r$.`,
      answer: false,
      feedback: r`Look at the formula again: $r$ appears to the first power. The $r^2$ shows up later, in $J = \int r^2\,dA$.`,
      hint: r`Write down $\gamma(r)$ from the unwrapped-core construction.`,
      explanation: r`False. $\gamma = r\phi'$ is **linear** in $r$. The quantity that involves $r^2$ is the polar moment of inertia $J = \int_A r^2\,dA$: one factor of $r$ comes from the strain, the other from the lever arm in $T = \int_A r\tau\,dA$.`,
      tags: ["kinematics"],
    }),
    mc("nonzero-u", {
      body: r`The kinematic assumption can be written as a displacement field in cylindrical coordinates $(r, \theta, z)$: a point at radius $r$ moves along the circle by an arc length $r\phi(z)$ and nothing else happens.`,
      question: "Which displacement component is nonzero?",
      choices: [
        ["ur", r`$u_r$`, r`The bar does not swell or shrink radially; sections rotate rigidly, so $u_r = 0$.`],
        ["utheta", r`$u_\theta = r\phi(z)$ only`],
        ["uz", r`$u_z$`, r`Out-of-plane motion $u_z$ is *warping*. Circular sections don't warp; plane sections remain plane.`],
        ["all", "All three", "Rigid rotation of a plane section moves points only around the circle."],
      ],
      correct: "utheta",
      hint: "A rigid rotation of a planar disc about its centre: which way does each point move?",
      explanation: r`$u_\theta = r\phi(z)$, $u_r = u_z = 0$. Put this in the polar strain formulas: $\gamma_{\theta z} = \partial u_\theta/\partial z + \tfrac1r\,\partial u_z/\partial\theta = r\phi'$, while $\gamma_{r\theta} = \tfrac1r\,\partial u_r/\partial\theta + \partial u_\theta/\partial r - u_\theta/r = 0 + \phi - \phi = 0$ and $\varepsilon_{rr} = \varepsilon_{\theta\theta} = \varepsilon_{zz} = \gamma_{rz} = 0$. So $\gamma_{z\theta}$ is the **only** nonzero strain, and from now on it is simply $\gamma$.`,
      tags: ["kinematics", "displacement"],
    }),
    order("derive-gamma", {
      question: r`Put the steps of the derivation of $\gamma = r\,d\phi/dz$ in order.`,
      items: [
        ["plane", r`Observe that cross-sections stay plane and rotate rigidly by $\phi(z)$`],
        ["markers", r`Markers on a core of radius $r$ at $z$ and $z + \Delta z$ move by arcs $r\phi(z)$ and $r\phi(z+\Delta z)$`],
        ["unwrap", r`Unwrap the core: the angle change is $[r\phi(z+\Delta z) - r\phi(z)]/\Delta z$ (small angles)`],
        ["limit", r`Let $\Delta z \to 0$ to get the pointwise strain $\gamma = r\,d\phi/dz$`],
      ],
      hint: "Start from the experimental observation and finish with a limit.",
      explanation: r`Observation → marker displacements → unwrapped geometry (shear = change of the right angle, $\tan\gamma \approx \gamma$) → limit. No equilibrium or material law appears anywhere, so the result holds for any material response with circular symmetry.`,
      tags: ["kinematics"],
    }),
    reading(
      "analogy",
      r`Every piece of torsion has a twin in the axial-bar theory of chapter 2. Govindjee's Exercise 7.2 asks you to fill in this analogy:

- displacement $u(x)$ ↔ rotation $\phi(z)$
- kinematics $\varepsilon = du/dx$ ↔ $\gamma = r\,d\phi/dz$
- resultant $R = \int_A \sigma\,dA$ ↔ $T = \int_A r\,\tau\,dA$
- equilibrium $dR/dx + b = 0$ ↔ $dT/dz + t = 0$ ($t$ = distributed torque per unit length, like $b$)
- elastic law $\sigma = E\varepsilon$ ↔ $\tau = G\gamma$
- area $A$ ↔ polar moment $J = \int_A r^2\,dA$, and modulus $E$ ↔ shear modulus $G$
- $R = AE\,u'$ ↔ $T = GJ\,\phi'$; stiffness $AE/L$ ↔ $GJ/L$
- ODE $(AEu')' + b = 0$ ↔ $(GJ\phi')' + t = 0$; BCs $u = 0$ or $AEu' = P$ ↔ $\phi = 0$ or $GJ\phi' = M$

> If you can solve an axial-bar problem, you can solve the matching torsion problem by swapping symbols.`,
      { title: "Torsion is the axial bar, twisted" },
    ),
    mc("analogy-A", {
      question: r`In the axial ↔ torsion analogy, which torsion quantity plays the role of the cross-sectional area $A$?`,
      choices: [
        ["J", r`The polar moment of inertia $J = \int_A r^2\,dA$`],
        ["r", r`The radius $r$`, "The radius is a coordinate on the section, not a section property."],
        ["perim", r`The circumference $2\pi R$`, r`Compare $R = AE\,u'$ with $T = (\;?\;)\,G\,\phi'$. A length can't fit there.`],
        ["G", r`The shear modulus $G$`, r`$G$ is the twin of $E$, the material stiffness, not of the geometric $A$.`],
      ],
      correct: "J",
      hint: r`Line up $R = AE\,du/dx$ with the torsion version and match factor by factor.`,
      explanation: r`$R = EA\,u'$ ↔ $T = GJ\,\phi'$, so $E \leftrightarrow G$ and $A \leftrightarrow J$. $J$ is the geometric stiffness of the section in twisting, just as $A$ is in stretching. Stiffness follows: $AE/L \leftrightarrow GJ/L$.`,
      shuffle: true,
      tags: ["analogy"],
    }),
    numeric("twist-rate", {
      question: r`A shaft $400\,\mathrm{mm}$ long is fixed at one end and twists uniformly; the free end rotates by $0.05\,\mathrm{rad}$. What is the twist rate in **rad/m**?`,
      answer: 0.125, // check: φ' = Δφ/L = 0.05 rad / 0.4 m = 0.125 rad/m (= 1.25e-4 rad/mm)
      tolerance: 0.0013,
      suffix: "rad/m",
      answerDisplay: r`0.125\,\mathrm{rad/m}`,
      hint: r`Uniform twist means $\phi(z)$ is linear, so $d\phi/dz$ is the total rotation divided by the length. Mind the units.`,
      explanation: r`For uniform twist $\phi' = \Delta\phi/L = 0.05/0.4\,\mathrm{m} = 0.125\,\mathrm{rad/m}$, the same as $1.25\times10^{-4}\,\mathrm{rad/mm}$. When you multiply by a radius in mm, use the rad/mm form.`,
      tags: ["kinematics", "twist-rate"],
    }),
    numeric("hollow-surface", {
      question: r`A hollow shaft with outer radius $R_o = 24\,\mathrm{mm}$ and inner radius $R_i = 16\,\mathrm{mm}$ twists at $1.25 \times 10^{-4}\,\mathrm{rad/mm}$. What is the shear strain at the **outer** surface, in micro-strain?`,
      answer: 3000, // check: γ(Ro) = 24 · 1.25e-4 = 0.003 = 3000 μ (bore: 16 · 1.25e-4 = 2000 μ)
      tolerance: 30,
      suffix: "μ",
      answerDisplay: r`3000\,\mu`,
      hint: "The kinematics doesn't care whether there is material at the centre. Use the same formula at the right radius.",
      explanation: r`$\gamma(R_o) = R_o\phi' = 24 \times 1.25\times10^{-4} = 0.003 = 3000\,\mu$. On the bore, $\gamma(R_i) = 16 \times 1.25\times10^{-4} = 2000\,\mu$. The strain is still linear in $r$; the hollow shaft simply has no material where $\gamma$ would have been small.`,
      tags: ["kinematics", "shear-strain", "hollow"],
    }),
    mc("warping", {
      question: r`Why does the theory $\gamma = r\phi'$ not apply to a bar with a square cross-section?`,
      choices: [
        ["warp", r`Non-circular sections warp: points move out of plane ($u_z \neq 0$), so plane sections do not remain plane.`],
        ["torque", "A square bar cannot carry a torque.", "It can. Square and rectangular bars carry torque all the time. The trouble is describing *how* they deform."],
        ["G", "The shear modulus is different in a square bar.", r`$G$ is a material property; the shape doesn't change it.`],
        ["large", "The strains in a square bar are too large for small-strain theory.", "Nothing about the shape forces large strains."],
      ],
      correct: "warp",
      shuffle: true,
      hint: "Which observation was the starting point of the whole derivation? Does it still hold for a square?",
      explanation: r`The derivation rests on the observation that sections stay plane and rotate rigidly, which is true only for circular (solid or hollow) sections. Non-circular sections **warp**: they rotate *and* displace along $z$ in a complicated pattern, and solving for that pattern needs partial differential equations. The exception you will meet in this unit is the **thin-walled tube** (Govindjee §7.7), where thinness gives a shortcut.`,
      tags: ["kinematics", "assumptions"],
    }),
    multi("material-free", {
      question: "Select **every** statement that follows from the kinematic assumption alone, before any material law is chosen.",
      choices: [
        ["linear", r`$\gamma$ varies linearly with $r$ on every cross-section`],
        ["tau", r`$\tau$ varies linearly with $r$`, "That needs a linear elastic material that is also homogeneous on the section."],
        ["axis", r`$\gamma = 0$ on the axis`],
        ["taumax", "The largest shear stress is at the outer radius", r`Not from kinematics alone: in a composite the stress also depends on $G(r)$, and the peak can sit at an interface.`],
        ["theta", r`$\gamma$ does not depend on $\theta$`],
      ],
      correct: ["linear", "axis", "theta"],
      hint: "Kinematics speaks about strain. Anything about stress needs the constitutive law.",
      explanation: r`$\gamma = r\phi'$ gives linear-in-$r$, zero on the axis, and independent of $\theta$, for **any** material. Statements about $\tau$ need a material law: $\tau = G\gamma$ is linear in $r$ only if $G$ is constant over the section, and in a composite bar the peak stress can sit at an interface, not at the surface (lesson 3).`,
      tags: ["kinematics", "assumptions"],
    }),
    mc("units", {
      question: r`What are the units of the twist rate $\phi' = d\phi/dz$?`,
      choices: [
        ["radlen", "Radians per unit length (e.g. rad/mm or rad/m)"],
        ["rad", "Radians", r`That's the unit of $\phi$ itself. Differentiating with respect to $z$ divides by a length.`],
        ["none", "Dimensionless, like strain", r`$\gamma = r\phi'$ is dimensionless, so $\phi'$ must carry 1/length to cancel the length $r$.`],
        ["lenrad", "Length per radian", "Upside down. It's the rotation *per* length along the shaft."],
      ],
      correct: "radlen",
      shuffle: true,
      hint: r`$\gamma = r\phi'$ must come out dimensionless.`,
      explanation: r`$\phi'$ is a rotation per unit length, e.g. rad/mm, and then $\gamma = r\phi'$ (mm × rad/mm) is dimensionless as a strain must be. Degrees per metre is also used, but convert to radians before using any formula.`,
      tags: ["kinematics", "units"],
    }),
    reading(
      "summary",
      r`**What you did:** turned the observation "sections rotate rigidly" into the shear-strain field of a twisted shaft and used it at different radii and on hollow sections.

**Key relations:**

$$u_\theta = r\phi(z),\quad u_r = u_z = 0 \qquad\Rightarrow\qquad \gamma = \gamma_{z\theta} = r\,\frac{d\phi}{dz}$$

- $\gamma$ is linear in $r$: $0$ on the axis, $R\phi'$ at the surface (and at $R_o$ for a hollow shaft).
- Pure geometry: valid for any material, but only for **circular** sections (others warp).
- The analogy: $u \leftrightarrow \phi$, $\varepsilon \leftrightarrow \gamma$, $R \leftrightarrow T$, $b \leftrightarrow t$, $A \leftrightarrow J$, $E \leftrightarrow G$.

Next: equilibrium. How torques along the shaft set the internal torque $T(z)$.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Equilibrium and torque diagrams (Govindjee §7.2)         */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "sm6-l2-equilibrium-and-torque-diagrams",
    unitId: "sm6",
    title: "Equilibrium and torque diagrams",
    summary: "dT/dz + t = 0 from a slice, T = ∫ r τ dA from the stresses, and torque diagrams by section cuts, including motors and gears (P = Tω).",
    textbook: "Govindjee §7.2",
    minutes: 13,
  },
  [
    reading(
      "slice",
      r`Torques are vectors along the shaft axis (right-hand rule: curl your fingers with the twist, your thumb gives the direction). Write each one by its **z-component**: positive points in $+z$.

Cut the shaft at $z$ and at $z + \Delta z$ and draw the slice:

- on the face at $z + \Delta z$ (outward normal $+\mathbf{e}_z$) the material beyond exerts the internal torque $T(z+\Delta z)$;
- on the face at $z$ (outward normal $-\mathbf{e}_z$) it exerts $-T(z)$ (Newton's third law, like $R$ and $-R$ on the two faces of a cut bar);
- a **distributed torque** $t(z)$ (torque per unit length, e.g. N·m/m: the twin of $b(x)$) adds $t(z)\,\Delta z$.

Sum moments about $z$ and let $\Delta z \to 0$:

$$\sum M_z = T(z+\Delta z) + t(z)\,\Delta z - T(z) = 0 \quad\Longrightarrow\quad \frac{dT}{dz} + t = 0.$$

**Sign convention:** $T(z)$ is the torque on the cut face whose outward normal is $+\mathbf{e}_z$. It is positive when it points along that outward normal, just as tension $R$ is positive.`,
      { title: "Equilibrium of a slice" },
    ),
    reading(
      "resultant",
      r`What *is* $T(z)$ in terms of stresses? On a patch $dA$ of the cross-section (normal $\mathbf{e}_z$) the traction has three components: $\sigma_{zz}\,dA$ along the axis, $\sigma_{zr}\,dA$ radially, and $\sigma_{z\theta}\,dA$ around the circle. Take moments about the axis:

- $\sigma_{zz}\,dA$ is parallel to the axis: no moment about it;
- $\sigma_{zr}\,dA$ points through the axis: no moment;
- $\sigma_{z\theta}\,dA$ has lever arm $r$.

$$T(z) = \int_A r\,\sigma_{z\theta}\,dA = \int_A r\,\tau\,dA, \qquad dA = r\,dr\,d\theta.$$

Only one stress component carries torque, so we simply call it $\tau$. Like $R = \int_A \sigma\,dA$, this is pure statics and holds for any material. The section below shows a $300\,\mathrm{N\cdot m}$ torque carried by the linear elastic distribution you'll derive in lesson 3.`,
      { title: "Torque from stress", visual: section(300000, 25) },
    ),
    tf("integral-material-free", {
      statement: r`The relation $T = \int_A r\,\tau\,dA$ holds whatever the material: elastic, plastic, or a layered composite.`,
      answer: true,
      feedback: "Where in its derivation did a stress–strain law appear?",
      hint: "Think about which principle produced the formula: kinematics, equilibrium, or the constitutive law?",
      explanation: r`True. It comes from summing the moments of the shear tractions on the cut: statics only, like $R = \int_A \sigma\,dA$. The material law enters only when you express $\tau$ through the twist ($\tau = G\gamma$ for linear elastic). That's why the same integral is used for plastic and nonlinear torsion and for thin-walled tubes.`,
      tags: ["equilibrium", "resultant"],
    }),
    mc("which-eq", {
      question: r`Which equation expresses **moment equilibrium about the shaft axis $z$**?`,
      choices: [
        ["dT", r`$\dfrac{dT}{dz} + t = 0$`],
        ["dR", r`$\dfrac{dR}{dx} + b = 0$`, r`That's force equilibrium along $x$ for an axial bar ($\sum F_x = 0$), the *twin* of the torsion equation.`],
        ["sym", r`$\sigma_{xz} = \sigma_{zx}$`, r`That's moment equilibrium of a small element about the $y$-axis; it makes the stress matrix symmetric, but it isn't the shaft equation.`],
        ["GJ", r`$T = GJ\,\dfrac{d\phi}{dz}$`, "That combines kinematics, Hooke's law and the resultant definition. It's a constitutive statement, not equilibrium."],
      ],
      correct: "dT",
      hint: r`Which equation came from summing $M_z$ on a slice of the shaft?`,
      explanation: r`$dT/dz + t = 0$ (Govindjee eqn 7.4) is $\sum M_z = 0$ for a slice, the torsion twin of $dR/dx + b = 0$ ($\sum F_x = 0$). Govindjee's Exercises 7.3–7.4 drill exactly this matching of equations to global equilibrium statements.`,
      shuffle: true,
      tags: ["equilibrium"],
    }),
    reading(
      "diagrams",
      r`To draw a **torque diagram**, cut the shaft between loads and balance one piece:

- **left piece:** (applied torques on it) $+\,T(z) = 0$, so $T(z) = -\,$(sum of applied torques **left** of the cut);
- **right piece:** $-T(z) +$ (applied torques on it) $= 0$, so $T(z) = +\,$(sum of applied torques **right** of the cut).

Between point torques $T$ is constant. Crossing a point torque with z-component $M_a$ (that is, $t = M_a\,\delta(z - a)$), $T$ drops by $M_a$. Under a distributed torque $T$ changes with slope $dT/dz = -t$. Keep the piece that does **not** contain an unknown support torque.

**Power.** A shaft spinning at angular speed $\omega$ transmits

$$P = T\omega, \qquad \omega = \frac{2\pi \cdot \mathrm{rpm}}{60}\ \mathrm{rad/s}.$$

In Govindjee Example 7.4 a motor at $z = 0$ drives two belt loads. The motor's torque acts in the sense of rotation (positive) and each load draws power off with a torque against the rotation (negative). The cuts then give $T = -T_M$ next to the motor: **a driving torque at the left end makes $T$ negative.** Let the cut rule decide the signs; don't guess them.`,
      { title: "Torque diagrams and power" },
    ),
    numeric("motor-torque", {
      question: r`An electric motor delivers $2\,\mathrm{kW}$ while spinning at $3000\,\mathrm{rpm}$. What torque does it apply to its shaft, in N·m? (Three significant figures.)`,
      answer: 6.366, // check: ω = 3000·2π/60 = 314.16 rad/s; T = 2000 W / 314.16 = 6.366 N·m
      tolerance: 0.07,
      suffix: "N·m",
      answerDisplay: r`6.37\,\mathrm{N\cdot m}`,
      hint: "Power is torque times angular velocity, but the angular velocity must be in rad/s.",
      explanation: r`$\omega = 3000\,\tfrac{\mathrm{rev}}{\mathrm{min}} \times 2\pi\,\tfrac{\mathrm{rad}}{\mathrm{rev}} \times \tfrac{1\,\mathrm{min}}{60\,\mathrm{s}} = 314.2\,\mathrm{rad/s}$, so $T = P/\omega = 2000/314.2 = 6.37\,\mathrm{N\cdot m}$. Common slips: plugging in rpm directly (0.67) or forgetting the $2\pi$ (40).`,
      tags: ["power"],
    }),
    numeric("gear-middle", {
      body: r`A shaft runs from $z = 0$ to $z = 1.2\,\mathrm{m}$ and spins freely in bearings. Applied torques as z-components, with $+z$ from the motor toward the far end:

- motor at $z = 0$: $+300\,\mathrm{N\cdot m}$ (driving, in the sense of rotation);
- gear B at $z = 0.5\,\mathrm{m}$: $-120\,\mathrm{N\cdot m}$;
- gear C at $z = 1.0\,\mathrm{m}$: $-180\,\mathrm{N\cdot m}$.

Nothing acts beyond C.`,
      question: r`What is the internal torque $T$ between B and C ($0.5 < z < 1.0\,\mathrm{m}$)? Use the book's sign convention and enter a signed value in N·m.`,
      answer: -180, // check: right piece holds only C: T = +(−180) = −180 N·m; left piece: T = −(300 − 120) = −180 ✓
      tolerance: 0.5,
      suffix: "N·m",
      answerDisplay: r`-180\,\mathrm{N\cdot m}`,
      hint: "Cut between B and C and keep the piece with fewer loads on it. Which applied torques act on that piece?",
      explanation: r`The right piece carries only gear C, so $T = +(-180) = -180\,\mathrm{N\cdot m}$. Check with the left piece: $T = -(300 - 120) = -180\,\mathrm{N\cdot m}$ ✓. The full diagram is $T = -300\,\mathrm{N\cdot m}$ for $0 < z < 0.5$, $-180$ for $0.5 < z < 1.0$, and $0$ beyond C. As in Example 7.4, the free end carries no torque. The negative sign is the convention at work: the motor's torque on the left piece points in $+z$, so the cut face must supply $-300\,\mathrm{N\cdot m}$.`,
      tags: ["torque-diagram", "sign-convention"],
    }),
    mc("gear-largest", {
      question: r`In that shaft, where is $|T|$ largest?`,
      choices: [
        ["mb", "Between the motor and gear B"],
        ["bc", "Between gears B and C", r`There $|T| = 180\,\mathrm{N\cdot m}$: gear B has already taken $120\,\mathrm{N\cdot m}$ off the shaft.`],
        ["beyond", "Beyond gear C", "Nothing acts beyond C, so a cut there sees no torque at all: $T = 0$."],
        ["same", "It is the same everywhere", "Each gear removes torque, so $T$ steps down along the shaft."],
      ],
      correct: "mb",
      shuffle: true,
      hint: "Each gear takes some of the motor's torque off the shaft.",
      explanation: r`$|T| = 300$, $180$ and $0\,\mathrm{N\cdot m}$ in the three segments. The segment next to the driver carries the full input torque, so for a uniform shaft it is the most stressed. With different diameters you must compare $\tau_{max} = TR/J$ segment by segment (next lesson).`,
      tags: ["torque-diagram"],
    }),
    numeric("cantilever-mid", {
      body: r`A shaft is built into a wall at $z = 0$ and is free at $z = 1.2\,\mathrm{m}$. Gears apply (z-components) $+200\,\mathrm{N\cdot m}$ at $z = 0.4\,\mathrm{m}$, $-250\,\mathrm{N\cdot m}$ at $z = 0.8\,\mathrm{m}$, and $+100\,\mathrm{N\cdot m}$ at the free end $z = 1.2\,\mathrm{m}$.`,
      question: r`What is $T$ in the segment $0.4 < z < 0.8\,\mathrm{m}$, in N·m (signed)?`,
      answer: -150, // check: right piece holds −250 and +100: T = −250 + 100 = −150 N·m
      tolerance: 0.5,
      suffix: "N·m",
      answerDisplay: r`-150\,\mathrm{N\cdot m}`,
      hint: "The wall torque is unknown, so keep the piece that does not touch the wall.",
      explanation: r`Keep the right piece: it carries $-250$ and $+100\,\mathrm{N\cdot m}$, so $T = -250 + 100 = -150\,\mathrm{N\cdot m}$. Keeping the free end means you never need the unknown wall torque, the same trick as for a cantilevered axial bar.`,
      tags: ["torque-diagram", "sign-convention"],
    }),
    numeric("cantilever-wall", {
      question: r`Same shaft. What is $T$ in the segment next to the wall, $0 < z < 0.4\,\mathrm{m}$, in N·m (signed)?`,
      answer: 50, // check: right piece holds all three gears: T = 200 − 250 + 100 = +50 N·m; wall torque = −50 N·m
      tolerance: 0.5,
      suffix: "N·m",
      answerDisplay: r`50\,\mathrm{N\cdot m}`,
      hint: "The right piece now contains every gear.",
      explanation: r`$T = 200 - 250 + 100 = +50\,\mathrm{N\cdot m}$. The left piece is just the wall stub, so the wall torque $M_w$ satisfies $M_w + T = 0$, i.e. $M_w = -50\,\mathrm{N\cdot m}$. Diagram: $+50$, $-150$, $+100\,\mathrm{N\cdot m}$. The largest $|T|$ is in the middle segment, not next to the wall.`,
      tags: ["torque-diagram", "reactions"],
    }),
    numeric("dist-reaction", {
      body: r`A $3\,\mathrm{m}$ shaft is built in at $z = 0$ and free at $z = 3\,\mathrm{m}$. A sleeve applies a uniform distributed torque $t = 2\,\mathrm{N\cdot m/m}$ (positive z-component) along its whole length.`,
      question: "What is the magnitude of the torque the wall must supply, in N·m?",
      answer: 6, // check: total applied = t·L = 2 · 3 = 6 N·m; wall torque = −6 N·m (magnitude 6)
      tolerance: 0.05,
      suffix: "N·m",
      answerDisplay: r`6\,\mathrm{N\cdot m}`,
      hint: "Treat the whole shaft as one free body. What is the total distributed torque?",
      explanation: r`The total distributed torque is $tL = 2 \times 3 = 6\,\mathrm{N\cdot m}$. Global equilibrium about $z$: $M_w + 6 = 0$, so $M_w = -6\,\mathrm{N\cdot m}$, of magnitude $6\,\mathrm{N\cdot m}$. Just inside the wall, $T(0^+) = -M_w = +6\,\mathrm{N\cdot m}$.`,
      tags: ["distributed-torque", "reactions"],
    }),
    numeric("dist-mid", {
      question: r`For the same shaft, what is the internal torque at mid-length, $z = 1.5\,\mathrm{m}$, in N·m?`,
      answer: 3, // check: right piece [1.5, 3] carries 2 · 1.5 = 3 N·m ⇒ T(1.5) = +3 N·m; T(z) = t(L − z)
      tolerance: 0.05,
      suffix: "N·m",
      answerDisplay: r`3\,\mathrm{N\cdot m}`,
      hint: "Keep the right piece, from the cut to the free end. How much distributed torque acts on it?",
      explanation: r`The right piece $[1.5, 3]$ carries $2 \times 1.5 = 3\,\mathrm{N\cdot m}$, so $T(1.5) = +3\,\mathrm{N\cdot m}$. In general $T(z) = t(L - z)$: a straight line from $6\,\mathrm{N\cdot m}$ at the wall to $0$ at the free end with slope $dT/dz = -t$, which is exactly $dT/dz + t = 0$. (Govindjee Example 7.5, a cable twisted inside a frictional housing, has the same structure.)`,
      tags: ["distributed-torque", "torque-diagram"],
    }),
    numeric("power", {
      question: r`A shaft carries $T = 50\,\mathrm{N\cdot m}$ while spinning at $1500\,\mathrm{rpm}$. How much power does it transmit, in kW? (Three significant figures.)`,
      answer: 7.854, // check: ω = 1500·2π/60 = 157.08 rad/s; P = 50 · 157.08 = 7854 W = 7.854 kW
      tolerance: 0.08,
      suffix: "kW",
      answerDisplay: r`7.85\,\mathrm{kW}`,
      hint: "Convert rpm to rad/s first.",
      explanation: r`$\omega = 1500 \times 2\pi/60 = 157.1\,\mathrm{rad/s}$, so $P = T\omega = 50 \times 157.1 = 7854\,\mathrm{W} \approx 7.85\,\mathrm{kW}$. Govindjee Exercise 7.7 runs this backwards: measure the twist, get $T = GJ\phi/L$, then $P = T\omega$.`,
      tags: ["power"],
    }),
    reading(
      "summary",
      r`**What you did:** derived torsional equilibrium from a slice, connected the internal torque to the shear stress, drew torque diagrams by section cuts, and converted between power and torque.

$$\frac{dT}{dz} + t = 0, \qquad T = \int_A r\,\tau\,dA, \qquad P = T\omega,\quad \omega = \frac{2\pi\cdot\mathrm{rpm}}{60}$$

- $T(z) = -\sum$(applied torques left of the cut) $= +\sum$(applied torques right of the cut).
- $T$ is constant between point torques, drops by $M_a$ across a point torque $M_a$, and has slope $-t$ under a distributed torque.
- Keep the piece without the unknown support torque. A driving torque at the left end gives $T < 0$.

Next: the material law closes the theory, giving $\tau = Tr/J$ and $\phi = TL/GJ$.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Elastic response (Govindjee §7.3–7.3.1)                  */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "sm6-l3-elastic-response",
    unitId: "sm6",
    title: "Elastic response: τ = Tr/J and φ = TL/GJ",
    summary: "Hooke's law closes the theory: T = GJφ′, τ = Tr/J, φ = TL/GJ and k = GJ/L. Then composite bars, shaft sizing, hollow shafts and stepped shafts.",
    textbook: "Govindjee §7.3",
    minutes: 15,
  },
  [
    reading(
      "closing",
      r`Four unknowns ($\phi$, $\gamma$, $\tau$, $T$) and four relations: kinematics $\gamma = r\phi'$, equilibrium $dT/dz + t = 0$, the resultant $T = \int_A r\tau\,dA$, and for a linear elastic material **$\tau = G\gamma$**. Chain them:

$$T = \int_A r\,\tau\,dA = \int_A r\,G\,r\phi'\,dA = G\phi'\int_A r^2\,dA = GJ\,\phi',$$

with the **polar moment of inertia**

$$J = \int_A r^2\,dA = \frac{\pi R^4}{2} = \frac{\pi d^4}{32}\ \text{(solid)}, \qquad J = \frac{\pi\,(R_o^4 - R_i^4)}{2}\ \text{(hollow)}.$$

Eliminating $\phi' = T/GJ$ from $\tau = G r\phi'$:

$$\tau(r) = \frac{T\,r}{J}, \qquad \tau_{max} = \frac{T R}{J} = \frac{16\,T}{\pi d^3}\ \text{(solid)}.$$

Over a segment with constant $T$, $G$ and $J$:

$$\phi(L) - \phi(0) = \int_0^L \frac{T}{GJ}\,dz = \frac{TL}{GJ}, \qquad k = \frac{M}{\phi(L)} = \frac{GJ}{L}\quad (\text{compare } AE/L).$$

Move the slider: $\tau$ grows linearly from zero on the axis to its maximum at the surface.`,
      { title: "Closing the system with τ = Gγ", visual: section(500000, 20, { G: 80000, sliders: true }) },
    ),
    numeric("J-solid", {
      question: r`What is $J$ for a solid shaft of diameter $d = 40\,\mathrm{mm}$, in $\mathrm{mm^4}$?`,
      answer: 251327, // check: πd⁴/32 = π·2 560 000/32 = 80 000π = 251 327 mm⁴ (= πR⁴/2 with R = 20)
      tolerance: 2500,
      suffix: "mm⁴",
      answerDisplay: r`251\,327\,\mathrm{mm^4}`,
      hint: r`Use $J = \pi d^4/32$ with the diameter, or $\pi R^4/2$ with the radius. Don't mix the two.`,
      explanation: r`$J = \pi d^4/32 = \pi (40)^4/32 = 80\,000\pi = 2.513\times10^5\,\mathrm{mm^4}$. Check with the radius: $\pi (20)^4/2 = \pi \cdot 160\,000/2$ ✓. Putting $R$ into the $d$-formula (or $d$ into the $R$-formula) is off by a factor of 16.`,
      tags: ["polar-moment"],
    }),
    numeric("tau-solid", {
      question: r`That shaft carries $T = 500\,\mathrm{N\cdot m}$. What is the maximum shear stress, in MPa?`,
      answer: 39.79, // check: τ = TR/J = 500 000 N·mm · 20 mm / 251 327 mm⁴ = 39.79 MPa (= 16T/πd³ = 8e6/(π·64 000))
      tolerance: 0.4,
      suffix: "MPa",
      answerDisplay: r`39.8\,\mathrm{MPa}`,
      hint: "Convert the torque to N·mm so the stress comes out in N/mm² = MPa.",
      explanation: r`$T = 500\,\mathrm{N\cdot m} = 5\times10^5\,\mathrm{N\cdot mm}$. $\tau_{max} = TR/J = 5\times10^5 \times 20/251\,327 = 39.8\,\mathrm{MPa}$. Shortcut for a solid shaft: $16T/(\pi d^3) = 16 \times 5\times10^5/(\pi \times 64\,000) = 39.8\,\mathrm{MPa}$.`,
      tags: ["torsion-stress"],
    }),
    numeric("J-hollow", {
      question: r`A hollow shaft has $R_o = 25\,\mathrm{mm}$ and $R_i = 20\,\mathrm{mm}$. What is $J$, in $\mathrm{mm^4}$?`,
      answer: 362265, // check: π(25⁴ − 20⁴)/2 = π(390 625 − 160 000)/2 = π·230 625/2 = 362 265 mm⁴
      tolerance: 3600,
      suffix: "mm⁴",
      answerDisplay: r`362\,265\,\mathrm{mm^4}`,
      hint: "Subtract the J of the missing core from the J of the full disc.",
      explanation: r`$J = \pi(R_o^4 - R_i^4)/2 = \pi(390\,625 - 160\,000)/2 = 3.623\times10^5\,\mathrm{mm^4}$. It's the fourth powers that subtract, not $(R_o - R_i)^4$. This tube has only 36 % of the area of a solid 25 mm-radius bar but 59 % of its $J$, because the material it keeps is far from the axis.`,
      tags: ["polar-moment", "hollow"],
    }),
    numeric("tau-hollow", {
      question: r`The hollow shaft carries $T = 2\,\mathrm{kN\cdot m}$. What is the maximum shear stress, in MPa?`,
      answer: 138.0, // check: τ = T·Ro/J = 2e6 N·mm · 25 / 362 265 = 138.0 MPa (bore: 2e6·20/362 265 = 110.4)
      tolerance: 1.4,
      suffix: "MPa",
      answerDisplay: r`138\,\mathrm{MPa}`,
      hint: r`$2\,\mathrm{kN\cdot m} = 2\times10^6\,\mathrm{N\cdot mm}$. Where on a hollow section is $r$ largest?`,
      explanation: r`$\tau_{max} = T R_o/J = 2\times10^6 \times 25/362\,265 = 138\,\mathrm{MPa}$ at the outer surface. On the bore $\tau = 2\times10^6 \times 20/362\,265 = 110\,\mathrm{MPa}$. Across a thinnish wall the stress is fairly uniform, so a tube uses its material well.`,
      tags: ["torsion-stress", "hollow"],
    }),
    numeric("twist-angle", {
      question: r`The solid $40\,\mathrm{mm}$ steel shaft ($G = 80\,\mathrm{GPa}$) is $1.5\,\mathrm{m}$ long and carries $T = 500\,\mathrm{N\cdot m}$ along its length. What is the angle of twist between its ends, in radians?`,
      answer: 0.0373, // check: φ = TL/GJ = 5e5 · 1500 / (80 000 · 251 327 = 2.0106e10) = 0.03730 rad (= 2.14°)
      tolerance: 0.0004,
      suffix: "rad",
      answerDisplay: r`0.0373\,\mathrm{rad}`,
      hint: r`$\phi = TL/(GJ)$. Keep everything in N and mm: $G = 80\,\mathrm{GPa} = 80\,000\,\mathrm{N/mm^2}$.`,
      explanation: r`$GJ = 80\,000 \times 251\,327 = 2.011\times10^{10}\,\mathrm{N\cdot mm^2}$, so $\phi = TL/GJ = 5\times10^5 \times 1500/(2.011\times10^{10}) = 0.0373\,\mathrm{rad} = 2.14^\circ$.`,
      tags: ["torsion-twist"],
    }),
    numeric("stiffness", {
      question: r`What is that shaft's torsional stiffness $k = GJ/L$, in kN·m/rad?`,
      answer: 13.40, // check: 2.0106e10 N·mm² / 1500 mm = 1.3404e7 N·mm/rad = 13.40 kN·m/rad (also T/φ = 500/0.0373)
      tolerance: 0.14,
      suffix: "kN·m/rad",
      answerDisplay: r`13.4\,\mathrm{kN\cdot m/rad}`,
      hint: r`Divide $GJ$ by $L$, then convert N·mm to kN·m ($1\,\mathrm{kN\cdot m} = 10^6\,\mathrm{N\cdot mm}$). Or use $T/\phi$.`,
      explanation: r`$k = GJ/L = 2.011\times10^{10}/1500 = 1.340\times10^7\,\mathrm{N\cdot mm/rad} = 13.4\,\mathrm{kN\cdot m/rad}$. Check: $T/\phi = 500/0.0373 = 13\,400\,\mathrm{N\cdot m/rad}$ ✓.`,
      tags: ["stiffness"],
    }),
    reading(
      "composite",
      r`If $G$ varies over the section (a bonded sleeve, layered or functionally graded material), it can't come out of the integral:

$$T = \int_A r\,G(r)\,r\phi'\,dA = (GJ)_{eff}\,\phi', \qquad (GJ)_{eff} = \int_A G\,r^2\,dA.$$

For a core of radius $R_1$ (modulus $G_1$) bonded inside a sleeve of outer radius $R_2$ (modulus $G_2$):

$$(GJ)_{eff} = G_1\,\frac{\pi R_1^4}{2} + G_2\,\frac{\pi\,(R_2^4 - R_1^4)}{2}.$$

The strain $\gamma = r\phi'$ is still continuous and linear, but the stress

$$\tau(r) = G(r)\,\gamma = \frac{r\,G(r)\,T}{(GJ)_{eff}}$$

**jumps** at the interface. Its maximum is wherever $r\,G(r)$ is largest, which can be just inside an interface rather than at the surface (Govindjee Example 7.3). $G$ may vary with $r$ but not with $\theta$; if it did, the kinematic assumption itself would fail.`,
      { title: "Composite and inhomogeneous sections" },
    ),
    numeric("composite-inside", {
      body: r`A steel core ($G = 80\,\mathrm{GPa}$, radius $15\,\mathrm{mm}$) is bonded inside an aluminium sleeve ($G = 26\,\mathrm{GPa}$, outer radius $25\,\mathrm{mm}$). The bar twists at $\phi' = 1\times10^{-4}\,\mathrm{rad/mm}$.`,
      question: r`What is the shear stress just inside the interface ($r = 15\,\mathrm{mm}$, in the steel), in MPa?`,
      answer: 120, // check: τ = G₁·r·φ' = 80 000 · 15 · 1e-4 = 120 MPa (just outside, in Al: 26 000·15·1e-4 = 39 MPa)
      tolerance: 1.2,
      suffix: "MPa",
      answerDisplay: r`120\,\mathrm{MPa}`,
      hint: r`Kinematics gives $\gamma$ at $r = 15\,\mathrm{mm}$ regardless of material. Which modulus applies on the steel side?`,
      explanation: r`$\gamma(15) = 15 \times 10^{-4} = 0.0015$. In the steel $\tau = 80\,000 \times 0.0015 = 120\,\mathrm{MPa}$; just outside, in the aluminium, $\tau = 26\,000 \times 0.0015 = 39\,\mathrm{MPa}$. Same strain, different stress: at a bonded interface the stress jumps but the strain does not.`,
      tags: ["composite", "torsion-stress"],
    }),
    numeric("composite-outside", {
      question: r`And at the outer surface, $r = 25\,\mathrm{mm}$, in MPa?`,
      answer: 65, // check: τ = 26 000 · 25 · 1e-4 = 65 MPa
      tolerance: 0.65,
      suffix: "MPa",
      answerDisplay: r`65\,\mathrm{MPa}`,
      hint: r`Same twist rate, the outer radius, and the sleeve's modulus.`,
      explanation: r`$\tau(25) = 26\,000 \times 25 \times 10^{-4} = 65\,\mathrm{MPa}$. So the maximum is at the interface on the steel side (120 MPa), not at the surface (65 MPa). Compare $rG(r)$: $15 \times 80 = 1200$ just inside versus $25 \times 26 = 650$ at the surface (mm·GPa).`,
      tags: ["composite", "torsion-stress"],
    }),
    tf("composite-max", {
      statement: "In a composite circular bar, the maximum shear stress always occurs at the outer radius.",
      answer: false,
      feedback: "Look at the last two answers: 120 MPa just inside the interface vs 65 MPa at the surface.",
      hint: r`The stress is $\tau = rG(r)T/(GJ)_{eff}$. Where is $rG(r)$ largest?`,
      explanation: r`False. $\tau = rG(r)\,T/(GJ)_{eff}$ peaks where $rG(r)$ peaks; with a stiff core in a soft sleeve, that is the core's edge. Only for a homogeneous bar is $rG$ largest at $r = R$, which is where the usual "max at the surface" rule comes from.`,
      tags: ["composite"],
    }),
    numeric("GJ-eff", {
      question: r`A steel core ($G_1 = 80\,\mathrm{GPa}$, $R_1 = 10\,\mathrm{mm}$) is bonded inside an aluminium tube ($G_2 = 26\,\mathrm{GPa}$, $R_2 = 15\,\mathrm{mm}$). Find $(GJ)_{eff}$ in $\mathrm{kN\cdot m^2}$.`,
      answer: 2.916, // check: 80 000·π·10⁴/2 = 1.2566e9; 26 000·π(15⁴ − 10⁴)/2 = 26 000·π·40 625/2 = 1.6592e9; sum 2.9158e9 N·mm² = 2.916 kN·m²
      tolerance: 0.03,
      suffix: "kN·m²",
      answerDisplay: r`2.92\,\mathrm{kN\cdot m^2}`,
      hint: r`Each material contributes its $G$ times the $J$ of the ring it occupies. $1\,\mathrm{kN\cdot m^2} = 10^9\,\mathrm{N\cdot mm^2}$.`,
      explanation: r`Core: $G_1\pi R_1^4/2 = 80\,000 \times \pi \times 10^4/2 = 1.257\times10^9\,\mathrm{N\cdot mm^2}$. Sleeve: $G_2\pi(R_2^4 - R_1^4)/2 = 26\,000 \times \pi \times (50\,625 - 10\,000)/2 = 1.659\times10^9\,\mathrm{N\cdot mm^2}$. Total $(GJ)_{eff} = 2.916\times10^9\,\mathrm{N\cdot mm^2} = 2.92\,\mathrm{kN\cdot m^2}$, and a length $L$ has stiffness $(GJ)_{eff}/L$ (Govindjee Exercise 7.13). The softer sleeve contributes *more* than the steel core because of the $r^2$ weighting.`,
      tags: ["composite", "stiffness"],
    }),
    reading(
      "design",
      r`Three design facts follow from $\tau_{max} = TR/J$.

**Sizing for stress.** For a solid shaft $\tau_{max} = 16T/(\pi d^3)$, so the smallest allowed diameter is $d = \left(16T/(\pi\,\tau_{allow})\right)^{1/3}$. For a stepped shaft to have the same peak stress in every segment, $T/d^3$ must be the same:

$$d_2 = d_1\left(\frac{T_2}{T_1}\right)^{1/3}.$$

Cutting the torque to 30 % only lets the diameter drop to $0.3^{1/3} \approx 0.67$ of the original (Govindjee Example 7.4). The stress is linear in $r$ and $J$ grows like $d^4$, so the diameter is not proportional to the torque.

**Hollow shafts.** Yield starts at the surface when $T R/J = \tau_Y$, so $T_Y = \tau_Y J/R$. Boring a hole of radius $r_2$ out of a solid shaft of radius $r_1$ keeps $R = r_1$ and multiplies $J$ by $1 - (r_2/r_1)^4$: the strength drops by only $(r_2/r_1)^4$ (Exercise 7.6).

**Stepped shafts.** With several segments, compute $\tau_{max} = TR/J$ in **each** one. A thin segment with a modest torque can be more stressed than a thick one with a large torque (Exercise 7.5).`,
      { title: "Design: sizing shafts", visual: section(2000000, 25, { ri: 20, G: 80000, sliders: true }) },
    ),
    numeric("design-diameter", {
      question: r`A solid shaft must carry $T = 1\,\mathrm{kN\cdot m}$ with an allowable shear stress of $50\,\mathrm{MPa}$. What is the minimum diameter, in mm? (Three significant figures.)`,
      answer: 46.70, // check: d = (16T/(πτ))^(1/3) = (16e6/(π·50) = 101 859)^(1/3) = 46.70 mm
      tolerance: 0.47,
      suffix: "mm",
      answerDisplay: r`46.7\,\mathrm{mm}`,
      hint: r`Set $16T/(\pi d^3) = \tau_{allow}$ and solve for $d$, with $T$ in N·mm.`,
      explanation: r`$d^3 = 16T/(\pi\,\tau_{allow}) = 16 \times 10^6/(\pi \times 50) = 101\,860\,\mathrm{mm^3}$, so $d = 46.7\,\mathrm{mm}$. In practice you'd round *up* to the next stock size, say 48 or 50 mm.`,
      tags: ["design", "torsion-stress"],
    }),
    numeric("bore-reduction", {
      question: r`A solid shaft of radius $r_1$ has a hole of radius $r_2 = r_1/2$ bored along its axis. By what percentage does the torque at first yield drop?`,
      answer: 6.25, // check: T_Y ∝ J/r₁ ∝ r₁⁴ − r₂⁴ ⇒ drop = (r₂/r₁)⁴ = 1/16 = 6.25 %
      tolerance: 0.07,
      suffix: "%",
      answerDisplay: r`6.25\,\%`,
      hint: "Yield starts at the outer surface. Which quantity changes when the core is removed, and which radius stays the same?",
      explanation: r`$T_Y = \tau_Y J/r_1$. Solid: $J = \pi r_1^4/2$; bored: $\pi(r_1^4 - r_2^4)/2$. Ratio $1 - (r_2/r_1)^4 = 1 - 1/16 = 0.9375$, a loss of only 6.25 % of the strength for 25 % of the material removed (area ratio $(r_2/r_1)^2 = 1/4$).`,
      tags: ["design", "hollow"],
    }),
    mc("cube-root", {
      question: r`Segment 1 of a solid stepped shaft carries $T_1$ with diameter $d_1$; segment 2 carries $T_2 = T_1/8$. For the same maximum shear stress in both, $d_2$ must be:`,
      choices: [
        ["half", r`$d_1/2$`],
        ["eighth", r`$d_1/8$`, r`Diameter isn't proportional to torque: $\tau_{max} = 16T/(\pi d^3)$.`],
        ["sqrt", r`$d_1/\sqrt{8} \approx 0.35\,d_1$`, r`That would keep $T/d^2$ fixed, but $\tau_{max} = 16T/(\pi d^3)$ has $d^3$.`],
        ["fourth", r`$d_1/8^{1/4} \approx 0.59\,d_1$`, r`Keeping $T/d^4$ fixed keeps the twist rate $T/GJ$ equal, not the stress.`],
      ],
      correct: "half",
      hint: r`Write $\tau_{max}$ for each segment in terms of $T$ and $d$ and set them equal.`,
      explanation: r`$16T_2/(\pi d_2^3) = 16T_1/(\pi d_1^3)$ gives $d_2 = d_1(T_2/T_1)^{1/3} = d_1(1/8)^{1/3} = d_1/2$.`,
      shuffle: true,
      tags: ["design"],
    }),
    numeric("stepped-max", {
      body: r`A stepped shaft spins freely with four gears (z-components): A at the left end applies $+400\,\mathrm{N\cdot m}$, then B $-150\,\mathrm{N\cdot m}$, C $-50\,\mathrm{N\cdot m}$, and D at the right end $-200\,\mathrm{N\cdot m}$. Diameters: AB $50\,\mathrm{mm}$, BC $40\,\mathrm{mm}$, CD $30\,\mathrm{mm}$.`,
      question: "What is the maximum shear stress anywhere in the shaft, in MPa?",
      answer: 37.73, // check: T_AB = −400, T_BC = −250, T_CD = −200 N·m; τ = 16|T|/πd³: AB 6.4e6/392 699 = 16.30, BC 4e6/201 062 = 19.89, CD 3.2e6/84 823 = 37.73 MPa
      tolerance: 0.38,
      suffix: "MPa",
      answerDisplay: r`37.7\,\mathrm{MPa}`,
      hint: r`First the torque diagram by cuts (check that the gear torques balance), then $\tau_{max} = 16|T|/(\pi d^3)$ segment by segment.`,
      explanation: r`The gear torques balance: $400 - 150 - 50 - 200 = 0$. Cuts (sum to the right): $T_{AB} = -400$, $T_{BC} = -250$, $T_{CD} = -200\,\mathrm{N\cdot m}$. Then $\tau_{max} = 16|T|/(\pi d^3)$: AB $16.3\,\mathrm{MPa}$, BC $19.9\,\mathrm{MPa}$, CD $37.7\,\mathrm{MPa}$. The governing segment is CD: the *smallest* torque but the thinnest section. Its maximum shear strain is $\gamma = \tau/G$, e.g. $37.7/80\,000 = 472\,\mu$ for steel.`,
      tags: ["torque-diagram", "torsion-stress", "stepped"],
    }),
    reading(
      "summary",
      r`**What you did:** closed the torsion theory with $\tau = G\gamma$, computed $J$, $\tau_{max}$, twist and stiffness, handled composite sections, and sized solid, hollow and stepped shafts.

$$T = GJ\,\phi', \qquad \tau = \frac{Tr}{J}, \qquad \phi(L) - \phi(0) = \frac{TL}{GJ}, \qquad k = \frac{GJ}{L}$$

$$J = \frac{\pi d^4}{32} = \frac{\pi R^4}{2}, \qquad J_{hollow} = \frac{\pi(R_o^4 - R_i^4)}{2}, \qquad \tau_{max} = \frac{16T}{\pi d^3}\ \text{(solid)}$$

- Composite: $(GJ)_{eff} = \int_A G r^2\,dA$ and $\tau = rG(r)T/(GJ)_{eff}$; the maximum is where $rG$ is largest.
- Equal peak stress: $d_2 = d_1(T_2/T_1)^{1/3}$. A bore of radius $r_2$ costs only $(r_2/r_1)^4$ of the strength.
- Stepped shafts: check $\tau_{max}$ in every segment.

Next: shafts the statics alone can't solve, and the differential equation $(GJ\phi')' + t = 0$.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Indeterminate shafts and the ODE (Govindjee §7.3.1–7.3.2) */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "sm6-l4-indeterminate-and-ode",
    unitId: "sm6",
    title: "Indeterminate shafts and the differential equation",
    summary: "Integrate φ′ = T/GJ for rotations, use compatibility for shafts fixed at both ends, and solve (GJφ′)′ + t = 0 with rotation and torque boundary conditions, including a spring support.",
    textbook: "Govindjee §7.3.1–7.3.2",
    minutes: 15,
  },
  [
    reading(
      "rotation-from-T",
      r`Once $T(z)$ is known, integrate the twist rate to get the rotation:

$$\phi(z) = \phi(0) + \int_0^z \frac{T(\bar z)}{GJ}\,d\bar z.$$

Govindjee Example 7.7: a bar built in at $z = 0$ carries a point torque at $z = a$ that points in $-z$, i.e. $t = -M\,\delta(z - a)$. Cuts give $T = -M$ for $z < a$ and $T = 0$ beyond, so

$$\phi(z) = \begin{cases} -\dfrac{Mz}{GJ} & z \le a \\ -\dfrac{Ma}{GJ} & z \ge a \end{cases}$$

The negative rotation only means that the section turns opposite to the right-hand sense about $+z$. Beyond the load $T = 0$, so $\phi' = 0$ and the bar turns rigidly.

- Constant $T$ gives linear $\phi$, linear $T$ gives quadratic $\phi$: $\phi$ is always one polynomial order above $T$.
- This bar is **statically determinate**: one unknown support torque, one equilibrium equation.`,
      { title: "From torque to rotation" },
    ),
    reading(
      "compatibility",
      r`With both ends built in there are two unknown support torques but only one equilibrium equation: the shaft is **statically indeterminate**. Govindjee's recipe is the same one chapter 2 used for axial bars:

1. Treat $T_0 = T(0^+)$ as if it were known.
2. Use cuts to write $T(z)$ in terms of $T_0$ and the loads.
3. Impose the kinematic fact you haven't used yet. Both ends are fixed, so $\phi(L) - \phi(0) = \int_0^L T/(GJ)\,dz = 0$. Solve for $T_0$.

For a point torque with z-component $+M$ at $z = a$: $T = T_0$ for $z < a$ and $T_0 - M$ beyond. Compatibility, $T_0\,a + (T_0 - M)(L - a) = 0$, gives

$$T_0 = M\left(1 - \frac{a}{L}\right), \qquad \phi(a) = \frac{T_0\,a}{GJ} = \frac{M\,a\,(L - a)}{L\,GJ}.$$

The nearer wall takes the larger share, exactly like an axial bar between two walls. For a uniform $t$ on the first half only (Govindjee Example 7.8) the same steps give $T_0 = 3tL/8$, and the rotation peaks where $T = 0$, at $z = 3L/8$ rather than at mid-span.`,
      { title: "Statically indeterminate shafts" },
    ),
    numeric("ff-point-T0", {
      body: r`A shaft of length $L$ is built in at both ends. A gear at $z = a = L/4$ applies a torque with z-component $M = 600\,\mathrm{N\cdot m}$.`,
      question: r`What is the internal torque $T$ in the segment $0 < z < a$, in N·m?`,
      answer: 450, // check: T₀ = M(1 − a/L) = 600 · 3/4 = 450 N·m; beyond the gear T = 450 − 600 = −150 N·m
      tolerance: 0.5,
      suffix: "N·m",
      answerDisplay: r`450\,\mathrm{N\cdot m}`,
      hint: r`Write $T$ in both segments in terms of $T_0$, then require the total twist $\int_0^L T/GJ\,dz$ to vanish.`,
      explanation: r`$T = T_0$ on $(0, a)$ and $T_0 - 600$ on $(a, L)$. Compatibility: $T_0\,(L/4) + (T_0 - 600)(3L/4) = 0$, so $T_0 = 600 \times 3/4 = 450\,\mathrm{N\cdot m}$. Beyond the gear $T = 450 - 600 = -150\,\mathrm{N\cdot m}$. The walls apply $-450\,\mathrm{N\cdot m}$ (left) and $-150\,\mathrm{N\cdot m}$ (right); together with the $+600\,\mathrm{N\cdot m}$ gear they sum to zero. The near wall carries three quarters of the load.`,
      tags: ["indeterminate", "compatibility"],
    }),
    numeric("ff-point-rot", {
      question: r`Take $L = 2\,\mathrm{m}$ and $GJ = 15\,\mathrm{kN\cdot m^2}$. What is the rotation of the gear, $\phi(a)$, in radians?`,
      answer: 0.015, // check: φ(a) = T₀a/GJ = 450 · 0.5 / 15 000 = 0.015 rad; Ma(L − a)/(L·GJ) = 600·0.5·1.5/(2·15 000) = 0.015 ✓
      tolerance: 0.00015,
      suffix: "rad",
      answerDisplay: r`0.015\,\mathrm{rad}`,
      hint: r`Integrate the twist rate from the left wall to the gear; $GJ = 15\,\mathrm{kN\cdot m^2} = 15\,000\,\mathrm{N\cdot m^2}$.`,
      explanation: r`$\phi(a) = \phi(0) + T_0\,a/GJ = 0 + 450 \times 0.5/15\,000 = 0.015\,\mathrm{rad}$ ($0.86^\circ$). Check from the right wall: $\phi(a) = \phi(L) - (T_0 - M)(L - a)/GJ = 0 - (-150)(1.5)/15\,000 = 0.015\,\mathrm{rad}$ ✓, matching $Ma(L-a)/(L\,GJ)$.`,
      tags: ["indeterminate", "torsion-twist"],
    }),
    numeric("ff-uniform-react", {
      body: r`A shaft of length $L = 2\,\mathrm{m}$, built in at both ends, carries a uniform distributed torque $t_0 = 4\,\mathrm{N\cdot m/m}$ along its whole length.`,
      question: "What is the magnitude of the torque supplied by each wall, in N·m?",
      answer: 4, // check: T(z) = T₀ − t₀z, ∫₀ᴸ T dz = T₀L − t₀L²/2 = 0 ⇒ T₀ = t₀L/2 = 4 · 2/2 = 4 N·m (each wall)
      tolerance: 0.04,
      suffix: "N·m",
      answerDisplay: r`4\,\mathrm{N\cdot m}`,
      hint: r`The loading and supports are symmetric. Or use the recipe: $T(z) = T_0 - t_0 z$, then $\int_0^L T\,dz = 0$.`,
      explanation: r`$T(z) = T_0 - t_0 z$, and $\int_0^L (T_0 - t_0 z)\,dz = T_0L - t_0L^2/2 = 0$ gives $T_0 = t_0L/2 = 4\,\mathrm{N\cdot m}$. Each wall supplies $-4\,\mathrm{N\cdot m}$ (z-component), balancing the $8\,\mathrm{N\cdot m}$ applied. $T(z) = 4 - 4z\,\mathrm{N\cdot m}$ runs from $+4$ to $-4$ and crosses zero at mid-span.`,
      tags: ["indeterminate", "distributed-torque"],
    }),
    numeric("ff-uniform-rot", {
      question: r`If $GJ = 10\,\mathrm{N\cdot m^2}$, what is the largest rotation in that shaft, in radians?`,
      answer: 0.2, // check: φ(z) = (t₀/2GJ)(Lz − z²), max at L/2: t₀L²/(8GJ) = 4·4/(8·10) = 0.2 rad
      tolerance: 0.002,
      suffix: "rad",
      answerDisplay: r`0.2\,\mathrm{rad}`,
      hint: r`The rotation is extreme where the twist rate $T/GJ$ vanishes. Where is $T = 0$?`,
      explanation: r`$\phi(z) = \int_0^z (T_0 - t_0\bar z)/GJ\,d\bar z = \dfrac{t_0}{2GJ}(Lz - z^2)$. $T = 0$ at $z = L/2$, where $\phi_{max} = t_0L^2/(8GJ) = 4 \times 4/(8 \times 10) = 0.2\,\mathrm{rad}$. With $t_0$ on the first half only (Example 7.8) the peak moves to $z = 3L/8$.`,
      tags: ["indeterminate", "torsion-twist"],
    }),
    tf("ff-max-rot", {
      statement: "For a shaft built in at both ends and loaded by a distributed torque, the largest rotation occurs at a cross-section where the internal torque is zero.",
      answer: true,
      feedback: r`Remember $\phi' = T/GJ$. What does $\phi' = 0$ mean for the graph of $\phi$?`,
      hint: r`$\phi$ starts and ends at zero. At an interior maximum the slope $\phi'$ must vanish.`,
      explanation: r`True. $\phi(0) = \phi(L) = 0$, so the extreme rotation is at an interior stationary point, where $\phi' = T/GJ = 0$. In Govindjee Example 7.8 that is $z = 3L/8$, with $\phi = 9tL^2/(128\,GJ)$. (With a point torque, $T$ can *jump* through zero instead, and the peak sits at the load point.)`,
      tags: ["indeterminate", "torsion-twist"],
    }),
    reading(
      "ode",
      r`All four relations combine into one equation for $\phi$ (Govindjee eqn 7.51):

$$\frac{d}{dz}\left(GJ\,\frac{d\phi}{dz}\right) + t(z) = 0.$$

It needs one boundary condition per end:

- **rotation BC** (built-in end): $\phi = 0$, or a prescribed rotation;
- **torque BC** at the far end $z = L$: $GJ\phi'(L) = M$, the z-component of the applied end torque (the right-piece cut gives $T(L) = M$). At $z = 0$ the left-piece cut flips the sign, $GJ\phi'(0) = -M$, just as the motor in lesson 2 gave $T = -T_M$. At a **free** end $GJ\phi' = 0$.

Point torques enter as $\delta$-functions, and a load that switches on at $z = a$ as a Heaviside step $H(z - a)$ (Macaulay brackets $\langle z - a\rangle$ after integrating). Determinate and indeterminate problems are solved the same way: integrate twice, then apply the BCs.

Govindjee Example 7.12: $t = kz$, fixed at $0$, free at $L$. $GJ\phi'' = -kz$ gives $GJ\phi' = -kz^2/2 + C$, and $GJ\phi'(L) = 0$ gives $C = kL^2/2$:

$$\phi(z) = \frac{kL^2 z}{2GJ}\left(1 - \frac{z^2}{3L^2}\right), \qquad \phi(L) = \frac{kL^3}{3GJ}.$$

With the far end built in as well (Example 7.13), $\phi = \dfrac{kL^2 z}{6GJ}\left(1 - \dfrac{z^2}{L^2}\right)$. Writing answers so the end values and dimensionless groups are visible is a cheap error check.`,
      { title: "One equation for everything" },
    ),
    mc("free-bc", {
      question: r`What is the boundary condition at a **free** end $z = L$?`,
      choices: [
        ["torque", r`$GJ\,\phi'(L) = 0$`],
        ["rot", r`$\phi(L) = 0$`, "That's a built-in end: no rotation allowed."],
        ["curv", r`$\phi''(L) = 0$`, r`$\phi''$ is tied to the distributed load via $GJ\phi'' = -t$, not to the end torque.`],
        ["M", r`$\phi(L) = M/GJ$`, r`A torque condition constrains the *twist rate* $\phi'$, and here no torque is applied at all.`],
      ],
      correct: "torque",
      hint: "What torque is transmitted through an end that nothing holds?",
      explanation: r`A free end carries no torque: $T(L) = GJ\phi'(L) = 0$. If a torque $M$ is applied there, $GJ\phi'(L) = M$, the twin of $AE\,u'(L) = P$.`,
      shuffle: true,
      tags: ["ode", "boundary-conditions"],
    }),
    mc("const-t-quadratic", {
      question: r`With $GJ$ constant and a uniform distributed torque $t_0$, the rotation $\phi(z)$ is:`,
      choices: [
        ["quad", "quadratic in $z$"],
        ["lin", "linear in $z$", r`Linear $\phi$ means constant $T$, which happens only where $t = 0$.`],
        ["cubic", "cubic in $z$", "A cubic needs a linearly varying load, like $t = kz$."],
        ["exp", "exponential in $z$", r`Exponentials come from equations like $\phi'' = \lambda^2\phi$. Here the right-hand side is a constant.`],
      ],
      correct: "quad",
      shuffle: true,
      hint: r`Integrate $GJ\phi'' = -t_0$ twice.`,
      explanation: r`$GJ\phi'' = -t_0$ gives $\phi = -t_0 z^2/(2GJ) + C_1 z + C_2$, a quadratic. Each integration raises the order: constant $t$, linear $T$, quadratic $\phi$.`,
      tags: ["ode"],
    }),
    numeric("kz-tip", {
      body: r`A shaft of length $L = 2\,\mathrm{m}$ is built in at $z = 0$ and free at $z = L$. It carries a linearly increasing distributed torque $t = kz$ with $k = 3\,\mathrm{N\cdot m/m^2}$, and $GJ = 20\,\mathrm{N\cdot m^2}$.`,
      question: r`What is the rotation of the free end, $\phi(L)$, in radians?`,
      answer: 0.4, // check: φ(L) = kL³/(3GJ) = 3·8/(3·20) = 24/60 = 0.4 rad
      tolerance: 0.004,
      suffix: "rad",
      answerDisplay: r`0.4\,\mathrm{rad}`,
      hint: r`Integrate $GJ\phi'' = -kz$ twice; use $\phi(0) = 0$ and the free-end condition $GJ\phi'(L) = 0$.`,
      explanation: r`$GJ\phi' = -kz^2/2 + C$, and $GJ\phi'(L) = 0$ gives $C = kL^2/2$. Then $GJ\phi = -kz^3/6 + kL^2 z/2$ (using $\phi(0) = 0$), so $GJ\phi(L) = kL^3/3$ and $\phi(L) = kL^3/(3GJ) = 3 \times 8/(3 \times 20) = 0.4\,\mathrm{rad}$. The wall carries $T(0) = GJ\phi'(0) = kL^2/2 = 6\,\mathrm{N\cdot m}$, the total load $\int_0^L kz\,dz$ ✓.`,
      tags: ["ode", "distributed-torque"],
    }),
    numeric("spring-end", {
      body: r`A shaft ($GJ = 500\,\mathrm{N\cdot m^2}$, $L = 2\,\mathrm{m}$) is built in at $z = 0$. Its other end sits in a rubber grommet that acts as a torsional spring, $k = 250\,\mathrm{N\cdot m/rad}$: it exerts a torque $-k\,\phi(L)$ on the shaft. A torque $T_a = 100\,\mathrm{N\cdot m}$ (z-component) is applied at mid-span, $z = L/2$.`,
      question: r`What is the end rotation $\phi(L)$, in radians?`,
      answer: 0.1, // check: T = Ta − kφL on (0, L/2), −kφL on (L/2, L); φL = [(Ta − kφL) + (−kφL)]·(L/2)/GJ ⇒ φL(GJ + kL) = TaL/2 ⇒ φL = 100·2/(2·(500 + 500)) = 0.1 rad (spring 25 N·m, φ(L/2) = 0.15 rad; FE check agrees)
      tolerance: 0.001,
      suffix: "rad",
      answerDisplay: r`0.1\,\mathrm{rad}`,
      hint: r`Call the spring's torque on the shaft $-k\phi(L)$. Write $T$ in both halves (keep the right piece), integrate $T/GJ$ from the wall to $z = L$, and solve for $\phi(L)$. Don't assume the outer half is torque-free: the spring loads it.`,
      explanation: r`Keep the right piece. For $L/2 < z < L$ it carries only the spring: $T = -k\phi(L)$. For $0 < z < L/2$ it also carries $T_a$: $T = T_a - k\phi(L)$. Integrate from the wall ($\phi(0) = 0$):

$$\phi(L) = \frac{[T_a - k\phi(L)]\,\tfrac{L}{2} + [-k\phi(L)]\,\tfrac{L}{2}}{GJ} \;\Rightarrow\; \phi(L)\,(GJ + kL) = \frac{T_a L}{2} \;\Rightarrow\; \phi(L) = \frac{T_a L}{2\,(GJ + kL)}.$$

Numbers: $\phi(L) = 100 \times 2/(2 \times (500 + 250 \times 2)) = 0.1\,\mathrm{rad}$. The spring carries $k\phi(L) = 25\,\mathrm{N\cdot m}$ and the wall $75\,\mathrm{N\cdot m}$. The load point turns $\phi(L/2) = 75 \times 1/500 = 0.15\,\mathrm{rad}$, and the outer half, carrying $-25\,\mathrm{N\cdot m}$, untwists back to $0.1\,\mathrm{rad}$ (Govindjee Exercise 7.21 archetype).`,
      tags: ["indeterminate", "spring", "compatibility"],
    }),
    mc("spring-limits", {
      question: r`Check $\phi(L) = \dfrac{T_a L}{2(GJ + kL)}$ in the limit $k \to 0$, a free end. What should it reduce to, and does it?`,
      choices: [
        ["half", r`$T_aL/(2GJ)$: only the half between the wall and the load twists, and the free outer half turns rigidly`],
        ["full", r`$T_aL/GJ$: the whole length carries $T_a$`, r`Only the segment between the wall and the load carries $T_a$; beyond the load a free shaft has $T = 0$.`],
        ["zero", r`$0$`, r`That's the $k \to \infty$ limit, where the spring becomes a second wall.`],
        ["quarter", r`$T_aL/(4GJ)$`, r`Set $k = 0$ in the formula: the denominator is $2GJ$, not $4GJ$.`],
      ],
      correct: "half",
      shuffle: true,
      hint: r`With no spring, what torque does the outer half carry, and what does the inner half carry?`,
      explanation: r`With $k = 0$ the formula gives $T_aL/(2GJ)$: the inner half (torque $T_a$, length $L/2$) twists by $T_a(L/2)/GJ$ and the unloaded outer half turns rigidly with it. As $k \to \infty$, $\phi(L) \to 0$ (fixed–fixed). Limit checks are cheap but not complete. Wrongly treating the outer half as torque-free ($\phi(L) = \phi(L/2)$) gives $T_aL/(2GJ + kL)$, which passes *both* limits yet is wrong: the spring torque $k\phi(L)$ must travel through the outer half and twist it by $k\phi(L)(L/2)/GJ$.`,
      tags: ["spring", "checks"],
    }),
    numeric("sine-load", {
      body: r`A shaft of length $L = 1\,\mathrm{m}$ (constant $GJ$) is built in at both ends and loaded by $t(z) = p\sin(2\pi z/L)$ with $p = 10\,\mathrm{N\cdot m/m}$.`,
      question: r`What is the largest $|T|$ anywhere in the shaft, in N·m?`,
      answer: 1.592, // check: T = (pL/2π)cos(2πz/L) + C; ∫₀ᴸ T dz = CL = 0 ⇒ C = 0 ⇒ |T|max = pL/(2π) = 10/(2π) = 1.592 N·m
      tolerance: 0.016,
      suffix: "N·m",
      answerDisplay: r`1.59\,\mathrm{N\cdot m}`,
      hint: r`Integrate $dT/dz = -t$ once and keep the constant $C$. Both ends are fixed, so $\int_0^L T/GJ\,dz$ must vanish.`,
      explanation: r`$dT/dz = -p\sin(2\pi z/L)$ gives $T(z) = \dfrac{pL}{2\pi}\cos\dfrac{2\pi z}{L} + C$. Both ends are fixed, so $\int_0^L T/GJ\,dz = 0$. The cosine integrates to zero over a full period, which leaves $CL = 0$, so $C = 0$. Hence $T(z) = \dfrac{pL}{2\pi}\cos\dfrac{2\pi z}{L}$ and $|T|_{max} = pL/(2\pi) = 10/(2\pi) = 1.59\,\mathrm{N\cdot m}$ (Govindjee Exercise 7.26 archetype).`,
      tags: ["ode", "indeterminate"],
    }),
    mc("sine-where", {
      question: "Where does that maximum $|T|$ occur?",
      choices: [
        ["three", r`At $z = 0$, $L/2$ and $L$`],
        ["quarter", r`At $z = L/4$ and $3L/4$, where $|t|$ is largest`, r`There $\cos(2\pi z/L) = 0$, so $T = 0$. $T$ is an *integral* of $t$, so it peaks where $t$ changes sign.`],
        ["walls", "Only at the two walls", r`$\cos(2\pi z/L) = -1$ at mid-span, so $|T|$ reaches the same value there.`],
        ["mid", "Only at mid-span", r`$\cos = +1$ at both walls too.`],
      ],
      correct: "three",
      shuffle: true,
      hint: r`Where is $|\cos(2\pi z/L)| = 1$ on $0 \le z \le L$?`,
      explanation: r`$|\cos(2\pi z/L)| = 1$ at $z = 0, L/2, L$: $T = +pL/2\pi$ at both walls and $-pL/2\pi$ at mid-span. At $z = L/4$ and $3L/4$, where the load is largest, $T = 0$, and that's where the rotation $\phi = pL^2\sin(2\pi z/L)/(4\pi^2 GJ)$ is extreme.`,
      tags: ["ode", "torque-diagram"],
    }),
    reading(
      "summary",
      r`**What you did:** integrated $\phi' = T/GJ$ for rotations, solved shafts fixed at both ends by compatibility, used the ODE with rotation and torque boundary conditions, and handled a spring support.

$$\phi(z) = \phi(0) + \int_0^z \frac{T}{GJ}\,dz, \qquad \frac{d}{dz}\left(GJ\,\frac{d\phi}{dz}\right) + t = 0$$

- BCs: built-in $\phi = 0$; end torque $M$ at $z = L$: $GJ\phi'(L) = M$ (at $z = 0$ the sign flips: $GJ\phi'(0) = -M$); free end $GJ\phi' = 0$; spring at $z = L$: $GJ\phi'(L) = -k\phi(L)$.
- Fixed–fixed: unknown $T_0$, then $\int_0^L T/GJ\,dz = 0$. Point torque $M$ at $a$: $T_0 = M(1 - a/L)$.
- Uniform $t_0$, fixed–fixed: walls take $t_0L/2$ each, $\phi_{max} = t_0L^2/(8GJ)$ at mid-span. $t = kz$, fixed–free: $\phi(L) = kL^3/(3GJ)$.
- Spring at the end, torque $T_a$ at mid-span: $\phi(L) = T_aL/(2(GJ + kL))$.
- The rotation is extreme where $T$ passes through zero.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 5 · Energy methods and nonlinear torsion (Govindjee §7.4)    */
/* ------------------------------------------------------------------ */

const l5 = lesson(
  {
    id: "sm6-l5-energy-and-nonlinear",
    unitId: "sm6",
    title: "Energy methods and nonlinear torsion",
    summary: "W_in = ½Mφ = ∫T²/(2GJ) dz, the stiffness of a tapered (conical) shaft, and the peak stress (n + 3)T/(2πR³) in a nonlinear elastic bar.",
    textbook: "Govindjee §7.4",
    minutes: 13,
  },
  [
    reading(
      "energy",
      r`Work done on an elastic shaft is stored in it: $W_{in} = W_{stored}$. Twisting an end through $\phi$ against the torque $M(\phi)$ does work $W_{in} = \int_0^{\phi_f} M\,d\phi$. For a linear response the $M$–$\phi$ curve is a straight line from the origin, so the area under it is a triangle:

$$W_{in} = \tfrac12\,M\phi.$$

Only $\tau = \tau_{z\theta}$ and $\gamma$ are nonzero, so the strain-energy density is

$$w = \tfrac12\,\tau\gamma = \tfrac12\,G\gamma^2 = \frac{\tau^2}{2G}.$$

Insert $\tau = Tr/J$ and use $\int_A r^2\,dA = J$:

$$W_{stored} = \int_V \frac{\tau^2}{2G}\,dV = \int_0^L \frac{T^2}{2GJ}\,dz = \frac{T^2L}{2GJ}\ \text{(uniform segment)}.$$

For an end-loaded bar, $\tfrac12 M\phi = M^2L/(2GJ)$ gives $\phi = ML/GJ$ again (Govindjee Example 7.14). Since $w \propto \tau^2 \propto r^2$, the energy is stored mostly near the surface; use the slider to watch $\tau$ there grow.`,
      { title: "Work in = energy stored", visual: section(500000, 20, { G: 80000, sliders: true }) },
    ),
    numeric("work-in", {
      question: r`A linear elastic shaft is twisted slowly from zero up to $M = 300\,\mathrm{N\cdot m}$, and its end turns $0.02\,\mathrm{rad}$. How much work was done, in J?`,
      answer: 3, // check: W = ½Mφ = ½ · 300 · 0.02 = 3 J
      tolerance: 0.03,
      suffix: "J",
      answerDisplay: r`3\,\mathrm{J}`,
      hint: r`The torque grows from zero as the shaft turns, so the work isn't simply $M\phi$.`,
      explanation: r`$W_{in} = \tfrac12 M\phi = \tfrac12 \times 300 \times 0.02 = 3\,\mathrm{J}$ ($1\,\mathrm{N\cdot m\cdot rad} = 1\,\mathrm{J}$). Writing $M\phi = 6\,\mathrm{J}$ forgets that the torque built up linearly from zero; the work is the triangle under the $M$–$\phi$ line.`,
      tags: ["energy"],
    }),
    numeric("energy-U", {
      question: r`The solid steel shaft of lesson 3 ($d = 40\,\mathrm{mm}$, $G = 80\,\mathrm{GPa}$, so $GJ = 20.1\,\mathrm{kN\cdot m^2}$; length $1.5\,\mathrm{m}$) carries $T = 500\,\mathrm{N\cdot m}$. How much strain energy does it store, in J?`,
      answer: 9.325, // check: GJ = 80e9 · 2.5133e-7 = 20 106 N·m²; U = T²L/(2GJ) = 250 000 · 1.5 / 40 212 = 9.325 J
      tolerance: 0.093,
      suffix: "J",
      answerDisplay: r`9.33\,\mathrm{J}`,
      hint: r`Use $T^2L/(2GJ)$ with $T$ in N·m, $L$ in m and $GJ$ in N·m², and the answer comes out in joules.`,
      explanation: r`$U = T^2L/(2GJ) = 500^2 \times 1.5/(2 \times 20\,106) = 375\,000/40\,212 = 9.33\,\mathrm{J}$.`,
      tags: ["energy"],
    }),
    numeric("energy-phi", {
      question: r`If that $500\,\mathrm{N\cdot m}$ is applied as an end torque (other end fixed), use $W_{in} = W_{stored}$ to find the end rotation, in radians.`,
      answer: 0.0373, // check: ½Mφ = U ⇒ φ = 2U/M = 2 · 9.325/500 = 0.03730 rad = TL/GJ ✓
      tolerance: 0.0004,
      suffix: "rad",
      answerDisplay: r`0.0373\,\mathrm{rad}`,
      hint: r`Set $\tfrac12 M\phi$ equal to the stored energy you just found.`,
      explanation: r`$\tfrac12 \times 500 \times \phi = 9.325$, so $\phi = 0.0373\,\mathrm{rad}$, the same as $TL/GJ$ in lesson 3. Energy conservation gives the rotation at, and in the sense of, the single applied torque.`,
      tags: ["energy", "torsion-twist"],
    }),
    numeric("energy-density", {
      question: r`At the surface of a steel shaft ($G = 80\,\mathrm{GPa}$) the shear stress is $40\,\mathrm{MPa}$. What is the strain-energy density there, in $\mathrm{kJ/m^3}$?`,
      answer: 10, // check: w = τ²/(2G) = 40²/(2 · 80 000) = 0.01 N/mm² = 0.01 MJ/m³ = 10 kJ/m³
      tolerance: 0.1,
      suffix: "kJ/m³",
      answerDisplay: r`10\,\mathrm{kJ/m^3}`,
      hint: r`$w = \tau^2/(2G)$. In N/mm² it is an energy per volume: $1\,\mathrm{N/mm^2} = 1\,\mathrm{N\cdot mm/mm^3} = 1\,\mathrm{MJ/m^3}$.`,
      explanation: r`$w = 40^2/(2 \times 80\,000) = 0.01\,\mathrm{N/mm^2} = 0.01\,\mathrm{MJ/m^3} = 10\,\mathrm{kJ/m^3}$. On the axis $w = 0$; it grows like $r^2$.`,
      tags: ["energy"],
    }),
    tf("w-forms", {
      statement: r`For a linear elastic shaft, the strain-energy density $\tfrac12\tau\gamma$ can equally be written $\tau^2/(2G)$ or $\tfrac12 G\gamma^2$.`,
      answer: true,
      feedback: r`Substitute $\tau = G\gamma$ into $\tfrac12\tau\gamma$, once eliminating $\gamma$ and once eliminating $\tau$.`,
      hint: r`Use $\tau = G\gamma$.`,
      explanation: r`True: with $\tau = G\gamma$, $\tfrac12\tau\gamma = \tfrac12 G\gamma^2 = \tau^2/(2G)$. In torsion only $\tau_{z\theta}$ and $\gamma_{z\theta}$ are nonzero, so this single term is the whole of chapter 5's $w = \tfrac12(\sigma_{xx}\varepsilon_{xx} + \dots + \tau_{zx}\gamma_{zx})$.`,
      tags: ["energy"],
    }),
    mc("energy-limit", {
      question: r`A shaft carries two gear torques $M_1$ and $M_2$ at different stations. Can $W_{in} = W_{stored}$ by itself give the rotation of each gear?`,
      choices: [
        ["no", r`No. $W_{in} = \tfrac12 M_1\phi_1 + \tfrac12 M_2\phi_2$ is one equation in two unknown rotations.`],
        ["yes", "Yes, solve the energy balance for each rotation in turn.", "There is only *one* energy balance for the whole shaft, and it contains both rotations."],
        ["GJ", r`Only if $GJ$ is constant`, r`$GJ$ affects $W_{stored}$, not the number of unknowns in $W_{in}$.`],
        ["equal", r`Only if $M_1 = M_2$`, r`Even with equal torques the two rotations differ in general; you'd still have one equation and two unknowns.`],
      ],
      correct: "no",
      shuffle: true,
      hint: "Count equations and unknowns.",
      explanation: r`With two loads, $W_{in} = \tfrac12 M_1\phi_1 + \tfrac12 M_2\phi_2$: one equation, two unknown rotations. Energy conservation alone yields the rotation only under a **single** applied torque, in its own sense, which is the same limitation chapter 2 had for axial bars.`,
      tags: ["energy"],
    }),
    reading(
      "tapered",
      r`If $J$ changes along the shaft (a taper or a stepped profile) and there is no distributed torque, $T$ is constant and

$$\phi(L) - \phi(0) = \int_0^L \frac{T}{G\,J(z)}\,dz \quad\Rightarrow\quad \frac1k = \int_0^L \frac{dz}{G\,J(z)},$$

the continuous version of springs in series (for a stepped shaft, $1/k = \sum L_i/(GJ_i)$). For a solid **cone** whose radius varies linearly from $R_0$ to $R_1$ over a length $L$, $J = \pi R(z)^4/2$. Substituting $dz = L\,dR/(R_1 - R_0)$:

$$\frac1k = \frac{2L}{\pi G}\cdot\frac{R_0^2 + R_0R_1 + R_1^2}{3\,R_0^3R_1^3}.$$

Check: with $R_0 = R_1 = R$ this is $2L/(\pi G R^4) = L/(GJ)$ ✓ (Govindjee Exercise 7.8).`,
      { title: "Tapered shafts" },
    ),
    numeric("cone-k", {
      question: r`A solid steel cone ($G = 80\,\mathrm{GPa}$) tapers linearly from $R_0 = 10\,\mathrm{mm}$ to $R_1 = 20\,\mathrm{mm}$ over $L = 200\,\mathrm{mm}$. What is its torsional stiffness, in kN·m/rad? (Three significant figures.)`,
      answer: 21.54, // check: 1/k = (2·200/(π·80 000) = 1.5915e-3)·((100 + 200 + 400)/(3·1000·8000) = 2.9167e-5) = 4.642e-8 rad/(N·mm) ⇒ k = 2.154e7 N·mm/rad = 21.54 kN·m/rad (numerical ∫dz/GJ agrees)
      tolerance: 0.22,
      suffix: "kN·m/rad",
      answerDisplay: r`21.5\,\mathrm{kN\cdot m/rad}`,
      hint: r`Work in N and mm throughout, then invert $1/k$; $1\,\mathrm{kN\cdot m} = 10^6\,\mathrm{N\cdot mm}$.`,
      explanation: r`$\dfrac{2L}{\pi G} = \dfrac{400}{\pi \times 80\,000} = 1.592\times10^{-3}$ and $\dfrac{R_0^2 + R_0R_1 + R_1^2}{3R_0^3R_1^3} = \dfrac{700}{3 \times 1000 \times 8000} = 2.917\times10^{-5}$. Their product is $1/k = 4.64\times10^{-8}\,\mathrm{rad}$ per N·mm, so $k = 2.15\times10^7\,\mathrm{N\cdot mm/rad} = 21.5\,\mathrm{kN\cdot m/rad}$.`,
      tags: ["tapered", "stiffness"],
    }),
    mc("cone-vs-mean", {
      question: r`A uniform shaft of the *mean* radius, $15\,\mathrm{mm}$, and the same length has $k = GJ/L = 31.8\,\mathrm{kN\cdot m/rad}$. Why is the cone (21.5 kN·m/rad) softer?`,
      choices: [
        ["thin", r`The thin end dominates: $1/R^4$ is 16 times larger at $R = 10$ than at $R = 20$, and flexibilities add along the shaft.`],
        ["volume", "The cone has much less material", "The volumes are within 4 % of each other. Stiffness here is not about the amount of material."],
        ["torque", "The torque varies along the cone", "With no distributed torque, $T$ is the same at every section."],
        ["wrong", "It isn't; the cone is stiffer", "Compare the numbers: 21.5 < 31.8."],
      ],
      correct: "thin",
      shuffle: true,
      hint: r`The flexibility is $\int dz/(GJ)$, an average of $1/R^4$. Is that average set by the thick end or the thin end?`,
      explanation: r`Flexibility $\int dz/(GJ(z))$ averages $1/R^4$, which is dominated by the slender end. The average of $1/R^4$ exceeds $1/(\text{mean }R)^4$, so the cone is softer than the mean-radius shaft. In series, the weakest part controls.`,
      tags: ["tapered", "stiffness"],
    }),
    reading(
      "nonlinear",
      r`The kinematics $\gamma = r\phi'$ never used a material law, so it still holds for a **nonlinear elastic** material $\tau = B\,\mathrm{sign}(\gamma)\,|\gamma|^n$ (Govindjee Exercise 7.28). For $\phi' > 0$ and $dA = 2\pi r\,dr$:

$$T = \int_0^R r\,B\,(r\phi')^n\,2\pi r\,dr = \frac{2\pi B\,\phi'^{\,n}R^{\,n+3}}{n+3}.$$

The peak stress is at the surface, $\tau_{max} = B\,(R\phi')^n$. Eliminating $B\phi'^{\,n}$:

$$\tau_{max} = \frac{(n+3)\,T}{2\pi R^3}.$$

- $n = 1$ gives $4T/(2\pi R^3) = 2T/(\pi R^3) = TR/J$ ✓.
- $B$ drops out: it sets the twist rate, not the stress.
- $\tau \propto r^n$. For $n < 1$ the profile is concave and flatter near the surface, so the peak is *lower* than the linear $TR/J$.`,
      { title: "Nonlinear elastic shafts" },
    ),
    numeric("nonlinear-tau", {
      question: r`A solid bar of diameter $d = 6\,\mathrm{mm}$ is made of a material with $\tau = B\,\mathrm{sign}(\gamma)|\gamma|^{1/2}$. It carries $T = 200\,\mathrm{N\cdot mm}$. What is the maximum shear stress, in MPa?`,
      answer: 4.126, // check: (n+3)T/(2πR³) = 3.5 · 200 / (2π · 27 = 169.65) = 4.126 MPa
      tolerance: 0.041,
      suffix: "MPa",
      answerDisplay: r`4.13\,\mathrm{MPa}`,
      hint: r`Use the radius, not the diameter, in $(n+3)T/(2\pi R^3)$. You don't need $B$.`,
      explanation: r`$R = 3\,\mathrm{mm}$, $n = \tfrac12$: $\tau_{max} = 3.5 \times 200/(2\pi \times 27) = 700/169.6 = 4.13\,\mathrm{MPa}$.`,
      tags: ["nonlinear", "torsion-stress"],
    }),
    numeric("linear-compare", {
      question: "What would the maximum shear stress be in the same bar under the same torque if the material were linear elastic, in MPa?",
      answer: 4.716, // check: TR/J = 200 · 3 / (π·3⁴/2 = 127.23) = 4.716 MPa (= 4T/(2πR³) = 800/169.65)
      tolerance: 0.047,
      suffix: "MPa",
      answerDisplay: r`4.72\,\mathrm{MPa}`,
      hint: r`Either $TR/J$ with $J = \pi R^4/2$, or the nonlinear formula with $n = 1$.`,
      explanation: r`$TR/J = 200 \times 3/(\pi \times 81/2) = 4.72\,\mathrm{MPa}$, or $(1 + 3)T/(2\pi R^3) = 800/169.6 = 4.72\,\mathrm{MPa}$. The $n = \tfrac12$ material carries the same torque with a peak only $3.5/4$ (87.5 %) as high.`,
      tags: ["nonlinear", "torsion-stress"],
    }),
    mc("flatter", {
      question: r`For $\tau = B|\gamma|^n$ with $0 < n < 1$, how does the shear-stress profile compare with the linear elastic one carrying the same torque?`,
      choices: [
        ["flatter", r`Flatter ($\tau \propto r^n$ is concave), so the surface peak is lower`],
        ["steeper", "Steeper, with a higher surface peak", "That's the behaviour for $n > 1$."],
        ["same", "Identical: the torque fixes the stresses", r`Only for $n = 1$. The same torque can be carried by differently shaped profiles.`],
        ["uniform", "Uniform across the section", r`Uniform is the limit $n \to 0$ (a fully plastic section), not $0 < n < 1$.`],
      ],
      correct: "flatter",
      hint: r`Sketch $r^{1/2}$ against $r$ on $[0, R]$ and compare with the straight line $r$.`,
      explanation: r`$\tau(r) = B(r\phi')^n \propto r^n$. For $n < 1$, $r^n$ rises steeply near the axis and flattens toward the surface, so more of the section works hard and the peak $(n+3)T/(2\pi R^3)$ lies below $4T/(2\pi R^3)$. As $n \to 0$ the profile becomes uniform and $\tau_{max} \to 3T/(2\pi R^3)$, the fully plastic limit $T_u = \tfrac23\pi R^3\tau_Y$.`,
      shuffle: true,
      tags: ["nonlinear"],
    }),
    reading(
      "summary",
      r`**What you did:** used energy conservation to get rotations and stored energy, found the stiffness of a tapered shaft, and computed peak stresses in a nonlinear elastic bar.

$$W_{in} = \tfrac12 M\phi, \qquad w = \tfrac12\tau\gamma = \frac{\tau^2}{2G}, \qquad W_{stored} = \int_0^L \frac{T^2}{2GJ}\,dz$$

$$\frac1k = \int_0^L \frac{dz}{GJ(z)}, \qquad \text{cone: } \frac1k = \frac{2L}{\pi G}\cdot\frac{R_0^2 + R_0R_1 + R_1^2}{3R_0^3R_1^3}$$

$$\tau = B|\gamma|^n:\quad \tau_{max} = \frac{(n+3)\,T}{2\pi R^3}\quad (n = 1 \Rightarrow TR/J)$$

- Energy gives the rotation only under a single applied torque.
- In series, the slender part controls the stiffness.

Next: tubes that aren't circular, with shear flow in thin walls.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 6 · Thin-walled tubes (Govindjee §7.7)                       */
/* ------------------------------------------------------------------ */

const l6 = lesson(
  {
    id: "sm6-l6-thin-walled-tubes",
    unitId: "sm6",
    title: "Thin-walled tubes",
    summary: "Shear flow q = τt is constant around a closed thin wall, T = 2qAe gives τ = T/(2Ae t), and energy gives the twist, (GJ)eff = 4Ae²G/∮ds/t, plus the yield torque 2Ae t_min τ_Y.",
    textbook: "Govindjee §7.7",
    minutes: 13,
  },
  [
    reading(
      "shear-flow",
      r`Non-circular sections warp, so the plane-sections theory fails. But if the section is a **thin-walled tube** (wall thickness $t(s) < r/10$ everywhere), equilibrium alone gives the stress. Because the wall is thin and its inner and outer surfaces are traction-free:

- $\tau$ is tangent to the wall's mid-line ($\tau = \tau_{zs}$, with $s$ the arclength around the section);
- $\tau$ is constant through the thickness.

Cut a strip of wall of length $L$ between two longitudinal cuts at $s_1$ and $s_2$. Its longitudinal faces carry $\tau_{sz} = \tau_{zs}$ (symmetry of the stress). Force balance along $z$:

$$\tau(1)\,t(1)\,L - \tau(2)\,t(2)\,L = 0 \quad\Longrightarrow\quad q = \tau(s)\,t(s) = \text{constant}.$$

$q$ is the **shear flow**, a force per unit length of wall (N/mm). Where the wall is thin, $\tau$ must be high. The thin circular tube below shows how little $\tau$ changes across a thin wall.`,
      { title: "Shear flow in a thin wall", visual: section(1000000, 41, { ri: 39, G: 26000 }) },
    ),
    mc("why-q-constant", {
      question: r`Why is the shear flow $q = \tau t$ the same all the way around a closed thin-walled tube?`,
      choices: [
        ["Fz", r`Force equilibrium along $z$ of a strip cut out of the wall`],
        ["Mz", r`Moment equilibrium about the tube's axis`, r`That fixes the *value* of $q$ (through $T = 2qA_e$), not the fact that it is constant.`],
        ["G", r`Because $G$ is the same everywhere`, "The argument uses no material law at all."],
        ["t", "Because the wall thickness is constant", r`$q$ is constant even when $t$ varies; then $\tau = q/t$ varies instead.`],
      ],
      correct: "Fz",
      hint: "Isolate a strip of wall between two longitudinal cuts. Which forces act on it along the tube's axis?",
      explanation: r`The only $z$-forces on a strip between two longitudinal cuts are $\tau t L$ on each cut face, so $\tau_1 t_1 = \tau_2 t_2$ for any pair of cuts. That's $\sum F_z = 0$: pure statics, valid for any material.`,
      shuffle: true,
      tags: ["thin-walled", "shear-flow"],
    }),
    reading(
      "torque",
      r`Each wall element $ds$ carries a force $q\,ds$ along the wall. Its moment about the twist centre is $q\,r_\perp\,ds$, where $r_\perp$ is the perpendicular distance from the centre to the wall's tangent line. Now $r_\perp\,ds$ is twice the area of the thin triangle from the centre to the element, so going once around the loop (Govindjee §7.7.3 does this with the divergence theorem):

$$T = q\oint r_\perp\,ds = 2\,q\,A_e \quad\Longrightarrow\quad q = \frac{T}{2A_e}, \qquad \tau(s) = \frac{T}{2A_e\,t(s)}.$$

- $A_e$ is the area **enclosed by the mid-line** of the wall, not the area of material.
- The largest stress is at the **thinnest** wall: $\tau_{max} = T/(2A_e\,t_{min})$.
- You never need to know where the twist centre is.`,
      { title: "Torque, shear flow and the enclosed area" },
    ),
    numeric("box-q", {
      body: r`A rectangular box tube has mid-line dimensions $100\,\mathrm{mm} \times 150\,\mathrm{mm}$ and a uniform wall thickness $t = 3\,\mathrm{mm}$. It carries $T = 2\,\mathrm{kN\cdot m}$.`,
      question: r`What is the shear flow $q$, in N/mm?`,
      answer: 66.67, // check: Ae = 100·150 = 15 000 mm²; q = T/(2Ae) = 2e6/30 000 = 66.67 N/mm
      tolerance: 0.67,
      suffix: "N/mm",
      answerDisplay: r`66.7\,\mathrm{N/mm}`,
      hint: r`$A_e$ is the area inside the wall's mid-line. Put $T$ in N·mm.`,
      explanation: r`$A_e = 100 \times 150 = 15\,000\,\mathrm{mm^2}$, so $q = T/(2A_e) = 2\times10^6/(2 \times 15\,000) = 66.7\,\mathrm{N/mm}$.`,
      tags: ["thin-walled", "shear-flow"],
    }),
    numeric("box-tau", {
      question: "What is the shear stress in the wall, in MPa?",
      answer: 22.22, // check: τ = q/t = 66.67/3 = 22.22 MPa
      tolerance: 0.22,
      suffix: "MPa",
      answerDisplay: r`22.2\,\mathrm{MPa}`,
      hint: "Shear flow is stress times thickness.",
      explanation: r`$\tau = q/t = 66.7/3 = 22.2\,\mathrm{MPa}$, the same in every wall because $t$ is uniform.`,
      tags: ["thin-walled"],
    }),
    mc("where-max", {
      question: "In a closed thin-walled tube of varying wall thickness, where is the shear stress largest?",
      choices: [
        ["thin", "In the thinnest wall"],
        ["far", "In the wall farthest from the twist centre", r`That's the circular-shaft habit ($\tau \propto r$). In a thin tube $\tau = q/t$ with $q$ constant, so distance doesn't enter.`],
        ["corner", "At the corners", r`Real corners do concentrate stress, but the thin-tube theory gives $\tau = q/t$, which depends only on $t$.`],
        ["uniform", "It is uniform around the tube", r`Only when $t$ is uniform. Otherwise $\tau = q/t$ varies.`],
      ],
      correct: "thin",
      hint: r`$q$ is the same everywhere. How does $\tau$ follow from $q$?`,
      explanation: r`$q$ is constant, so $\tau = q/t$ is largest where $t$ is smallest. That's also where yield starts: $T_Y = 2A_e\,t_{min}\,\tau_Y$.`,
      shuffle: true,
      tags: ["thin-walled"],
    }),
    numeric("box-thin-walls", {
      question: r`Now make the two long ($150\,\mathrm{mm}$) walls $2\,\mathrm{mm}$ thick and keep the short walls at $3\,\mathrm{mm}$ (same mid-line, same torque). What is the maximum shear stress, in MPa?`,
      answer: 33.33, // check: Ae unchanged ⇒ q = 66.67 N/mm; τmax = q/t_min = 66.67/2 = 33.33 MPa (3 mm walls: 22.2)
      tolerance: 0.33,
      suffix: "MPa",
      answerDisplay: r`33.3\,\mathrm{MPa}`,
      hint: r`Does $A_e$ change? Then does $q$?`,
      explanation: r`$A_e$ is unchanged, so $q = 66.7\,\mathrm{N/mm}$ still. $\tau = q/t$: $66.7/2 = 33.3\,\mathrm{MPa}$ in the 2 mm walls and $22.2\,\mathrm{MPa}$ in the 3 mm walls. The maximum, $33.3\,\mathrm{MPa}$, sits in the thinnest wall (Govindjee Exercise 7.41).`,
      tags: ["thin-walled"],
    }),
    tf("Ae-material", {
      statement: r`In $\tau = T/(2A_e t)$, $A_e$ is the cross-sectional area of the tube material.`,
      answer: false,
      feedback: r`The material area is roughly (perimeter × $t$). The formula needs the area that the wall *encloses*.`,
      hint: "Think about what the moment arms of the shear flow sweep out as you go around the tube.",
      explanation: r`False. $A_e$ is the area enclosed by the wall's mid-line. For the $100 \times 150$ box that's $15\,000\,\mathrm{mm^2}$, while the material area is only about $500 \times 3 = 1500\,\mathrm{mm^2}$. The torque is $q$ times $\oint r_\perp\,ds$, and that integral sweeps out the enclosed area twice.`,
      tags: ["thin-walled"],
    }),
    tf("agree", {
      statement: r`For a thin circular tube of mean radius $r$, $\tau = T/(2A_e t)$ agrees with $Tr/J$ evaluated with the thin-wall approximation $J \approx 2\pi r^3 t$.`,
      answer: true,
      feedback: r`Compare the denominators: $2A_e t$ with $A_e = \pi r^2$, versus $J/r$.`,
      hint: r`Write both formulas as $T$ divided by something, then compare the somethings.`,
      explanation: r`True: $2A_e t = 2\pi r^2 t$ and $J/r \approx 2\pi r^3 t/r = 2\pi r^2 t$, the same denominator. The thin-tube theory is the circular theory's thin-wall limit, extended to any shape.`,
      tags: ["thin-walled", "torsion-stress"],
    }),
    numeric("circ-thin", {
      question: r`A thin circular tube has mean radius $r = 40\,\mathrm{mm}$ and wall thickness $t = 2\,\mathrm{mm}$. For $T = 1\,\mathrm{kN\cdot m}$, what shear stress does $\tau = T/(2A_e t)$ give, in MPa?`,
      answer: 49.74, // check: Ae = π·40² = 5026.5 mm²; τ = 1e6/(2·5026.5·2) = 49.74 MPa; Tr/J with J ≈ 2πr³t = 804 248 mm⁴ ⇒ 1e6·40/804 248 = 49.74 ✓
      tolerance: 0.5,
      suffix: "MPa",
      answerDisplay: r`49.7\,\mathrm{MPa}`,
      hint: r`The enclosed area of a circle of radius $r$ is $\pi r^2$.`,
      explanation: r`$A_e = \pi (40)^2 = 5027\,\mathrm{mm^2}$, so $\tau = 10^6/(2 \times 5027 \times 2) = 49.7\,\mathrm{MPa}$. Check: $J \approx 2\pi(40)^3(2) = 804\,248\,\mathrm{mm^4}$ gives $Tr/J = 10^6 \times 40/804\,248 = 49.7\,\mathrm{MPa}$ ✓. The exact $J = \pi(41^4 - 39^4)/2$ gives $50.9\,\mathrm{MPa}$ at the outer surface; the thin-wall value is the mid-wall stress.`,
      tags: ["thin-walled", "torsion-stress"],
    }),
    reading(
      "stiffness",
      r`For the twist, Govindjee turns to energy (§7.7.4). Take an end torque $M$ on a tube of length $L$, so $W_{in} = \tfrac12 M\phi$. With $\tau = T/(2A_e t)$ constant through the wall and $dV = t\,ds\,dz$:

$$W_{stored} = \int_V \frac{\tau^2}{2G}\,dV = L\oint \frac{T^2}{8A_e^2\,G\,t}\,ds.$$

Setting the two equal with $T = M$:

$$\frac{\phi}{L} = \frac{T}{4A_e^2\,G}\oint\frac{ds}{t}, \qquad (GJ)_{eff} = \frac{4A_e^2\,G}{\oint ds/t}, \qquad k_T = \frac{(GJ)_{eff}}{L}.$$

For walls of piecewise-constant thickness, $\oint ds/t = \sum_i b_i/t_i$ (each wall's length over its thickness). First yield happens at the thinnest wall:

$$T_Y = 2A_e\,t_{min}\,\tau_Y.$$

Govindjee Example 7.16 works a $200 \times 300\,\mathrm{mm}$ box this way.`,
      { title: "Twist and stiffness of a thin-walled tube" },
    ),
    numeric("box-GJ", {
      question: r`Back to the $100 \times 150\,\mathrm{mm}$ box with $t = 3\,\mathrm{mm}$ all round, now in aluminium ($G = 26\,\mathrm{GPa}$). What is $(GJ)_{eff}$, in $\mathrm{kN\cdot m^2}$?`,
      answer: 140.4, // check: ∮ds/t = 2(100 + 150)/3 = 166.67; (GJ)eff = 4·15 000²·26 000/166.67 = 1.404e11 N·mm² = 140.4 kN·m²
      tolerance: 1.4,
      suffix: "kN·m²",
      answerDisplay: r`140.4\,\mathrm{kN\cdot m^2}`,
      hint: r`With uniform $t$, $\oint ds/t$ is the mid-line perimeter divided by $t$. $1\,\mathrm{kN\cdot m^2} = 10^9\,\mathrm{N\cdot mm^2}$.`,
      explanation: r`$\oint ds/t = 500/3 = 166.7$. $(GJ)_{eff} = 4 \times (15\,000)^2 \times 26\,000/166.7 = 1.404\times10^{11}\,\mathrm{N\cdot mm^2} = 140\,\mathrm{kN\cdot m^2}$.`,
      tags: ["thin-walled", "stiffness"],
    }),
    numeric("box-k", {
      question: r`What is the torsional stiffness of a $2\,\mathrm{m}$ length of this tube, in kN·m/rad?`,
      answer: 70.2, // check: k = 1.404e11 N·mm² / 2000 mm = 7.02e7 N·mm/rad = 70.2 kN·m/rad
      tolerance: 0.7,
      suffix: "kN·m/rad",
      answerDisplay: r`70.2\,\mathrm{kN\cdot m/rad}`,
      hint: r`$k_T = (GJ)_{eff}/L$, keeping the units consistent.`,
      explanation: r`$k_T = (GJ)_{eff}/L = 1.404\times10^{11}/2000 = 7.02\times10^7\,\mathrm{N\cdot mm/rad} = 70.2\,\mathrm{kN\cdot m/rad}$. Under the earlier $2\,\mathrm{kN\cdot m}$ it would twist $2/70.2 = 0.028\,\mathrm{rad}$.`,
      tags: ["thin-walled", "stiffness"],
    }),
    numeric("yield-torque", {
      body: r`A closed tube is made from a rectangular channel (width $w = 80\,\mathrm{mm}$, depth $h = 100\,\mathrm{mm}$, uniform thickness $t_2 = 3\,\mathrm{mm}$) closed off by a semicircular channel of diameter $w$ and thickness $t_1 = 2\,\mathrm{mm}$. All dimensions are on the mid-line. The material yields in shear at $\tau_Y = 120\,\mathrm{MPa}$.`,
      question: "At what torque does the tube first yield, in kN·m? (Three significant figures.)",
      answer: 5.046, // check: Ae = wh + πw²/8 = 8000 + 2513.3 = 10 513 mm²; T_Y = 2·Ae·t_min·τ_Y = 2·10 513·2·120 = 5.046e6 N·mm = 5.046 kN·m
      tolerance: 0.05,
      suffix: "kN·m",
      answerDisplay: r`5.05\,\mathrm{kN\cdot m}`,
      hint: r`$A_e$ is the rectangle plus a half-disc of diameter $w$. Which wall thickness controls first yield?`,
      explanation: r`$A_e = wh + \tfrac12\pi(w/2)^2 = 80 \times 100 + \tfrac12\pi(40)^2 = 8000 + 2513 = 10\,513\,\mathrm{mm^2}$. Yield starts in the thinner semicircular wall: $T_Y = 2A_e\,t_{min}\,\tau_Y = 2 \times 10\,513 \times 2 \times 120 = 5.05\times10^6\,\mathrm{N\cdot mm} = 5.05\,\mathrm{kN\cdot m}$ (Govindjee Exercise 7.43 archetype).`,
      tags: ["thin-walled", "yield"],
    }),
    reading(
      "summary",
      r`**What you did:** found the shear flow and stress in thin-walled tubes of any shape, their twist and stiffness by energy, and the torque at first yield.

$$q = \tau\,t = \frac{T}{2A_e}, \qquad \tau = \frac{T}{2A_e\,t}, \qquad \frac{\phi}{L} = \frac{T}{4A_e^2\,G}\oint\frac{ds}{t}$$

$$(GJ)_{eff} = \frac{4A_e^2\,G}{\oint ds/t}, \qquad k_T = \frac{(GJ)_{eff}}{L}, \qquad T_Y = 2A_e\,t_{min}\,\tau_Y$$

- Shear flow is constant by $z$-force equilibrium, so $\tau$ is largest where $t$ is smallest.
- $A_e$ is the area enclosed by the wall's mid-line, not the material area; $\oint ds/t = \sum b_i/t_i$.
- For a thin circular tube these reduce to $Tr/J$ with $J \approx 2\pi r^3 t$.

You've finished the torsion unit. Take the **Level Check** to see what sticks when the hints are gone.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit practice bank                                                   */
/* ------------------------------------------------------------------ */

export const sm6: Unit = {
  id: "sm6",
  title: "Torsion",
  subtitle: "Circular shafts and thin-walled tubes",
  description: "The kinematic assumption (sections rotate rigidly), equilibrium (T = ∫ r τ dA) and the elastic response (τ = T r / J, φ = T L / G J); indeterminate shafts and energy methods; then shear flow in thin-walled tubes.",
  textbook: "Govindjee ch. 7 (§7.1–7.4, §7.7)",
  lessons: [l1, l2, l3, l4, l5, l6],
  practice: [
    numeric("p-J-hollow", {
      question: r`Find $J$ for a hollow shaft with outer diameter $50\,\mathrm{mm}$ and inner diameter $30\,\mathrm{mm}$, in $\mathrm{mm^4}$.`,
      answer: 534071, // check: π(50⁴ − 30⁴)/32 = π(6 250 000 − 810 000)/32 = π·5 440 000/32 = 534 071 mm⁴
      tolerance: 5300,
      suffix: "mm⁴",
      answerDisplay: r`534\,071\,\mathrm{mm^4}`,
      hint: r`With diameters, $J = \pi(D_o^4 - D_i^4)/32$.`,
      explanation: r`$J = \pi(6\,250\,000 - 810\,000)/32 = \pi \times 5\,440\,000/32 = 5.34\times10^5\,\mathrm{mm^4}$.`,
      tags: ["polar-moment", "hollow"],
    }),
    numeric("p-tau-uscs", {
      question: r`A solid steel shaft of diameter $2\,\mathrm{in}$ carries a torque of $10\,\mathrm{kip\cdot in}$. What is the maximum shear stress, in ksi?`,
      answer: 6.366, // check: 16T/(πd³) = 16·10/(π·8) = 160/25.13 = 6.366 ksi
      tolerance: 0.064,
      suffix: "ksi",
      answerDisplay: r`6.37\,\mathrm{ksi}`,
      hint: r`The units carry straight through: kip·in divided by in³ gives ksi.`,
      explanation: r`$\tau_{max} = 16T/(\pi d^3) = 16 \times 10/(\pi \times 2^3) = 160/25.13 = 6.37\,\mathrm{ksi}$.`,
      tags: ["torsion-stress", "uscs"],
    }),
    numeric("p-twist", {
      question: r`An aluminium shaft ($G = 26\,\mathrm{GPa}$) of diameter $30\,\mathrm{mm}$ and length $800\,\mathrm{mm}$ carries $T = 150\,\mathrm{N\cdot m}$. What is the angle of twist, in degrees?`,
      answer: 3.325, // check: J = π·30⁴/32 = 79 522 mm⁴; φ = 150 000·800/(26 000·79 522 = 2.0676e9) = 0.05804 rad = 3.325°
      tolerance: 0.034,
      suffix: "°",
      answerDisplay: r`3.33^\circ`,
      hint: r`Compute $\phi = TL/GJ$ in radians (N and mm throughout), then convert to degrees.`,
      explanation: r`$J = \pi(30)^4/32 = 79\,520\,\mathrm{mm^4}$ and $GJ = 26\,000 \times 79\,520 = 2.068\times10^9\,\mathrm{N\cdot mm^2}$. $\phi = TL/GJ = 1.5\times10^5 \times 800/(2.068\times10^9) = 0.0580\,\mathrm{rad} = 3.33^\circ$.`,
      tags: ["torsion-twist"],
    }),
    mc("p-stiffness-scaling", {
      question: r`Doubling the diameter of a solid shaft (same length and material) multiplies its torsional stiffness $GJ/L$ by:`,
      choices: [
        ["2", "2", r`Stiffness goes with $J$, which isn't linear in $d$.`],
        ["4", "4", r`That's how the *area* scales. $J \propto d^4$.`],
        ["8", "8", r`That's how the torque capacity at a given $\tau_{max}$ scales ($\propto d^3$), not the stiffness.`],
        ["16", "16"],
      ],
      correct: "16",
      hint: r`How does $J$ depend on $d$?`,
      explanation: r`$J = \pi d^4/32 \propto d^4$, so doubling $d$ multiplies $J$, and with it $k = GJ/L$, by $2^4 = 16$. The strength (torque at a given $\tau_{max}$, $\propto d^3$) grows only 8×.`,
      tags: ["stiffness"],
    }),
    numeric("p-power", {
      question: r`A shaft must transmit $15\,\mathrm{kW}$ at $1200\,\mathrm{rpm}$. What torque does it carry, in N·m?`,
      answer: 119.4, // check: ω = 1200·2π/60 = 125.66 rad/s; T = 15 000/125.66 = 119.37 N·m
      tolerance: 1.2,
      suffix: "N·m",
      answerDisplay: r`119.4\,\mathrm{N\cdot m}`,
      hint: r`$P = T\omega$ with $\omega$ in rad/s.`,
      explanation: r`$\omega = 1200 \times 2\pi/60 = 125.7\,\mathrm{rad/s}$, so $T = P/\omega = 15\,000/125.7 = 119\,\mathrm{N\cdot m}$.`,
      tags: ["power"],
    }),
    numeric("p-torque-diagram", {
      question: r`A shaft spins freely with three gears (z-components): A at the left end $-60\,\mathrm{N\cdot m}$, B in the middle $+150\,\mathrm{N\cdot m}$ (the drive), C at the right end $-90\,\mathrm{N\cdot m}$. What is $T$ between B and C, in N·m (signed, book convention)?`,
      answer: -90, // check: right piece holds only C: T = −90 N·m; left piece: T = −(−60 + 150) = −90 ✓
      tolerance: 0.5,
      suffix: "N·m",
      answerDisplay: r`-90\,\mathrm{N\cdot m}`,
      hint: "Cut between B and C. Which piece is simpler to balance?",
      explanation: r`Keep the right piece: only C acts on it, so $T = -90\,\mathrm{N\cdot m}$. Check with the left piece: $T = -(-60 + 150) = -90\,\mathrm{N\cdot m}$ ✓. Between A and B, $T = -(-60) = +60\,\mathrm{N\cdot m}$. The torques balance ($-60 + 150 - 90 = 0$), as they must for steady spinning.`,
      tags: ["torque-diagram", "sign-convention"],
    }),
    numeric("p-indeterminate", {
      question: r`A shaft of length $2\,\mathrm{m}$ (constant $GJ$) is built in at both ends and carries a uniform distributed torque $t_0 = 8\,\mathrm{N\cdot m/m}$ on its first half ($0 < z < 1\,\mathrm{m}$) only. What is the internal torque just inside the left wall, $T(0^+)$, in N·m?`,
      answer: 6, // check: T = T₀ − 8z on (0,1), T₀ − 8 on (1,2); ∫T dz = (T₀ − 4) + (T₀ − 8) = 0 ⇒ T₀ = 6 N·m (= 3t₀L/8)
      tolerance: 0.06,
      suffix: "N·m",
      answerDisplay: r`6\,\mathrm{N\cdot m}`,
      hint: r`Write $T(z)$ in terms of $T_0$ on both halves, then make the total twist $\int_0^L T/GJ\,dz$ zero.`,
      explanation: r`$T(z) = T_0 - 8z$ for $z < 1$ and $T_0 - 8$ for $z > 1$ (N·m, $z$ in m). Compatibility: $\int_0^1 (T_0 - 8z)\,dz + \int_1^2 (T_0 - 8)\,dz = (T_0 - 4) + (T_0 - 8) = 0$, so $T_0 = 6\,\mathrm{N\cdot m}$ $= 3t_0L/8$. The wall next to the loaded half takes 6 of the $8\,\mathrm{N\cdot m}$; the far wall takes 2.`,
      tags: ["indeterminate", "compatibility"],
    }),
    numeric("p-composite", {
      question: r`A steel core ($G = 80\,\mathrm{GPa}$, radius $12\,\mathrm{mm}$) is bonded inside an aluminium sleeve ($G = 26\,\mathrm{GPa}$, outer radius $20\,\mathrm{mm}$). What is $(GJ)_{eff}$, in $\mathrm{kN\cdot m^2}$?`,
      answer: 8.293, // check: 80 000·π·12⁴/2 = 2.6058e9; 26 000·π(20⁴ − 12⁴)/2 = 26 000·π·139 264/2 = 5.6876e9; sum 8.2934e9 N·mm² = 8.293 kN·m²
      tolerance: 0.083,
      suffix: "kN·m²",
      answerDisplay: r`8.29\,\mathrm{kN\cdot m^2}`,
      hint: r`Add $G \times J$ for each region: the core disc and the sleeve ring.`,
      explanation: r`Core: $80\,000 \times \pi(12)^4/2 = 2.606\times10^9\,\mathrm{N\cdot mm^2}$. Sleeve: $26\,000 \times \pi(20^4 - 12^4)/2 = 26\,000 \times \pi \times 139\,264/2 = 5.688\times10^9\,\mathrm{N\cdot mm^2}$. Sum: $8.29\times10^9\,\mathrm{N\cdot mm^2} = 8.29\,\mathrm{kN\cdot m^2}$.`,
      tags: ["composite", "stiffness"],
    }),
    numeric("p-thin-tau", {
      question: r`A rectangular box tube, $60\,\mathrm{mm} \times 120\,\mathrm{mm}$ on the wall mid-line with a uniform wall thickness of $2.5\,\mathrm{mm}$, carries $T = 900\,\mathrm{N\cdot m}$. What is the shear stress in the wall, in MPa?`,
      answer: 25, // check: Ae = 60·120 = 7200 mm²; τ = 9e5/(2·7200·2.5) = 9e5/36 000 = 25 MPa
      tolerance: 0.25,
      suffix: "MPa",
      answerDisplay: r`25\,\mathrm{MPa}`,
      hint: r`$\tau = T/(2A_e t)$, with $A_e$ the area enclosed by the mid-line.`,
      explanation: r`$A_e = 60 \times 120 = 7200\,\mathrm{mm^2}$, so $\tau = 9\times10^5/(2 \times 7200 \times 2.5) = 25.0\,\mathrm{MPa}$.`,
      tags: ["thin-walled"],
    }),
    numeric("p-thin-k", {
      question: r`A box tube has mid-line dimensions $100\,\mathrm{mm} \times 200\,\mathrm{mm}$; the two $100\,\mathrm{mm}$ walls are $4\,\mathrm{mm}$ thick and the two $200\,\mathrm{mm}$ walls are $2\,\mathrm{mm}$ thick. It is aluminium ($G = 26\,\mathrm{GPa}$) and $1.5\,\mathrm{m}$ long. What is its torsional stiffness, in kN·m/rad?`,
      answer: 110.9, // check: Ae = 20 000 mm²; ∮ds/t = 2·100/4 + 2·200/2 = 250; (GJ)eff = 4·(2e4)²·26 000/250 = 1.664e11 N·mm²; k = 1.664e11/1500 = 1.1093e8 N·mm/rad = 110.9 kN·m/rad
      tolerance: 1.1,
      suffix: "kN·m/rad",
      answerDisplay: r`111\,\mathrm{kN\cdot m/rad}`,
      hint: r`$\oint ds/t = \sum(\text{wall length}/\text{wall thickness})$, then $k_T = 4A_e^2G/(L\oint ds/t)$.`,
      explanation: r`$A_e = 100 \times 200 = 20\,000\,\mathrm{mm^2}$ and $\oint ds/t = 2(100/4) + 2(200/2) = 50 + 200 = 250$. $(GJ)_{eff} = 4 \times (20\,000)^2 \times 26\,000/250 = 1.664\times10^{11}\,\mathrm{N\cdot mm^2}$, so $k_T = 1.664\times10^{11}/1500 = 1.109\times10^8\,\mathrm{N\cdot mm/rad} = 111\,\mathrm{kN\cdot m/rad}$.`,
      tags: ["thin-walled", "stiffness"],
    }),
    numeric("p-energy", {
      question: r`A steel stepped shaft ($G = 80\,\mathrm{GPa}$) has a $1\,\mathrm{m}$ segment of diameter $40\,\mathrm{mm}$ and a $0.5\,\mathrm{m}$ segment of diameter $30\,\mathrm{mm}$, and carries $T = 300\,\mathrm{N\cdot m}$ throughout. How much strain energy does it store, in J?`,
      answer: 5.775, // check: U = T²/(2G)·ΣLᵢ/Jᵢ = (9e10/160 000 = 562 500)·(1000/251 327 + 500/79 522 = 0.0102665) = 5774.9 N·mm = 5.775 J
      tolerance: 0.058,
      suffix: "J",
      answerDisplay: r`5.77\,\mathrm{J}`,
      hint: r`Add $T^2L/(2GJ)$ for each segment. In N and mm the result is in N·mm $= 10^{-3}\,\mathrm{J}$.`,
      explanation: r`$J_1 = 251\,327\,\mathrm{mm^4}$ and $J_2 = 79\,522\,\mathrm{mm^4}$. $U = \dfrac{T^2}{2G}\left(\dfrac{L_1}{J_1} + \dfrac{L_2}{J_2}\right) = \dfrac{(3\times10^5)^2}{2 \times 80\,000}\left(\dfrac{1000}{251\,327} + \dfrac{500}{79\,522}\right) = 562\,500 \times 0.010\,27 = 5775\,\mathrm{N\cdot mm} = 5.77\,\mathrm{J}$. The thin segment, only a third of the length, stores 61 % of it.`,
      tags: ["energy", "stepped"],
    }),
    mc("p-analogy", {
      question: r`In the axial ↔ torsion analogy, the end condition $AE\,u'(L) = P$ corresponds to:`,
      choices: [
        ["torque", r`$GJ\,\phi'(L) = M$`],
        ["fixed", r`$\phi(L) = 0$`, r`That's the twin of $u(L) = 0$, a fixed end.`],
        ["phi", r`$GJ\,\phi(L) = M$`, r`Torque is carried by the twist *rate* $\phi'$, not by $\phi$ itself.`],
        ["noG", r`$J\,\phi'(L) = M$`, r`The shear modulus $G$, the twin of $E$, is missing.`],
      ],
      correct: "torque",
      hint: r`Swap symbols one by one: $u \to \phi$, $A \to J$, $E \to G$, $P \to M$.`,
      explanation: r`$u \leftrightarrow \phi$, $A \leftrightarrow J$, $E \leftrightarrow G$ and $P \leftrightarrow M$, so $AE\,u'(L) = P$ becomes $GJ\,\phi'(L) = M$: a prescribed end torque (zero at a free end).`,
      shuffle: true,
      tags: ["analogy", "boundary-conditions"],
    }),
  ],
  generators: [
    "gen.sm.polar-moment",
    "gen.sm.torsion-stress",
    "gen.sm.torsion-twist",
    "gen.sm.torsion-stepped",
    "gen.sm.torsion-power",
    "gen.sm.thin-wall-torsion",
    "gen.sm.torsion-indeterminate",
  ],
};
