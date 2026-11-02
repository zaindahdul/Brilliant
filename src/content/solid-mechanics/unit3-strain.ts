import type { Unit } from "../types";
import { lesson, matrix, mc, multi, numeric, r, reading, tf } from "../dsl";

/*
 * Unit sm3 · Strain (Govindjee ch. 4).
 * Conventions: eps_xx = du/dx, eps_yy = dv/dy, eps_zz = dw/dz; ENGINEERING shear
 * gamma_xy = du/dy + dv/dx (decrease of the right angle); TENSOR shear eps_xy = gamma_xy / 2,
 * which is what sits off the diagonal of the strain matrix. Strains are quoted in
 * micro-strain (1 μ = 1e-6) unless a question asks for a plain decimal.
 */

/* ------------------------------------------------------------------ */
/* Lesson 1 · Normal and shear strain at a point (Govindjee §4.1–4.2.2) */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "sm3-l1-normal-and-shear-strain",
    unitId: "sm3",
    title: "Normal and shear strain at a point",
    summary: "Strain measures stretching and the change of right angles: from average definitions to εxx = ∂u/∂x and γxy = ∂u/∂y + ∂v/∂x.",
    textbook: "Govindjee §4.1–4.2",
    minutes: 12,
  },
  [
    reading(
      "two-kinds",
      r`So far strain has meant **normal strain**, the change in length over the original length, $\varepsilon = \Delta L / L$, positive when the material stretches. A body can also deform by **changing angles**, even when the material lines along $x$ and $y$ keep their lengths. That is what the **shear strain** $\gamma$ measures.

Govindjee's working definition (§4.1): draw a rectangle on the body and watch the right angle at its lower-left corner. If the top edge slides to the right (in $+x$) by $\delta$ relative to the bottom edge, a height $h$ below it, that right angle **decreases** by

$$\gamma \approx \tan\gamma = \frac{\delta}{h}.$$

This is the **average shear strain**. It is an angle in radians, a length divided by a length, so it is dimensionless just like $\varepsilon$. In the grid below, increase $\partial u/\partial y$ with its slider: the top of the square slides to the right and the corner angle closes by $\gamma$.`,
      {
        title: "Stretching and shearing",
        visual: { kind: "strain-grid", config: { grad: [[0, 0.1], [0, 0]], sliders: true } },
      },
    ),
    numeric("pad-shear", {
      body: r`A rubber bearing pad is bonded between two steel plates. The pad is $50\,\mathrm{mm}$ tall. Under a horizontal load the top plate slides $0.4\,\mathrm{mm}$ to the right relative to the bottom plate, and the pad's vertical edges stay straight.`,
      question: r`What is the average shear strain $\gamma$ in the pad? Give a plain decimal (radians).`,
      answer: 0.008, // check: γ ≈ δ/h = 0.4 mm / 50 mm = 0.008 rad
      tolerance: 0.0001,
      prefix: r`$\gamma =$`,
      suffix: "rad",
      hint: r`Which right angle changes, and by how much? For a small angle $\tan\gamma \approx \gamma$, so compare the sideways slide with the height over which it happens.`,
      explanation: r`The vertical edges tilt over, so the right angle at the lower-left corner shrinks by $\gamma$ with $\tan\gamma = \delta/h$:

$$\gamma \approx \frac{\delta}{h} = \frac{0.4\,\mathrm{mm}}{50\,\mathrm{mm}} = 0.008\ \mathrm{rad} = 8000 \times 10^{-6}.$$

The width of the pad never enters, only the slide and the height it happens over. The top moved in $+x$, so the angle *closed* and $\gamma$ is positive.`,
      tags: ["average-shear-strain"],
    }),
    mc("gamma-units", {
      question: r`In what units is a shear strain such as $\gamma = 0.008$ reported?`,
      choices: [
        ["rad", "Radians: it is an angle, so it is a dimensionless ratio of two lengths."],
        ["mm", "Millimetres, because it measures how far the top slid.", r`The slide $\delta$ is in mm, but $\gamma$ is the slide **divided by the height**, so the lengths cancel.`],
        ["degmm", "Degrees per millimetre.", r`Nothing is left over per unit length: $\gamma = \delta/h$ is a pure number (an angle in radians).`],
        ["mpa", "MPa.", "MPa is a unit of stress. Strain is purely kinematic: no forces are involved in defining it."],
      ],
      correct: "rad",
      shuffle: true,
      hint: r`$\gamma \approx \delta/h$. What are the units of the top and of the bottom of that fraction?`,
      explanation: r`$\gamma \approx \delta/h$ is a length over a length, so it is dimensionless. Because it measures an angle it is quoted in radians, often as micro-radians ($\mu\mathrm{rad}$) or simply as a strain such as $8000 \times 10^{-6}$. Normal strain $\varepsilon = \Delta L/L$ is dimensionless too; both are usually written in **micro-strain**, $1\,\mu = 10^{-6}$.`,
      tags: ["average-shear-strain", "units"],
    }),
    numeric("gamma-degrees", {
      question: r`A shear strain of $\gamma = 0.01\ \mathrm{rad}$ is large for a metal. By how many **degrees** does the right angle close? Give three significant figures.`,
      answer: 0.573, // check: 0.01 rad × 180°/π = 0.57296° ≈ 0.573°
      tolerance: 0.005,
      suffix: "°",
      hint: r`$\pi$ radians is $180^\circ$.`,
      explanation: r`$$\gamma = 0.01 \times \frac{180^\circ}{\pi} = 0.573^\circ,$$

so the corner angle goes from $90^\circ$ to about $89.43^\circ$. Even a "large" engineering strain is a tiny angle, which is why the small-angle approximation $\tan\gamma \approx \gamma$ is so accurate.`,
      tags: ["average-shear-strain", "units"],
    }),
    numeric("avg-normal", {
      question: r`A $40\,\mathrm{mm}$ gauge line scribed on a test coupon measures $40.06\,\mathrm{mm}$ after loading. What is the average normal strain along the line, in micro-strain ($10^{-6}$)?`,
      answer: 1500, // check: (40.06 − 40)/40 = 0.06/40 = 0.0015 = 1500 × 10⁻⁶
      tolerance: 15,
      prefix: r`$\varepsilon =$`,
      suffix: "μ",
      hint: "Normal strain is the change in length divided by the original length. Then express it in millionths.",
      explanation: r`$$\varepsilon = \frac{\Delta L}{L} = \frac{40.06 - 40}{40} = \frac{0.06}{40} = 0.0015 = 1500 \times 10^{-6}.$$

It is positive because the line got longer. Keep the "change over original" picture in mind: the pointwise strain on the next screen is just its limit for a very short line.`,
      tags: ["normal-strain"],
    }),
    reading(
      "normal-at-point",
      r`Let $u(x, y)$ be the $x$-displacement and $v(x, y)$ the $y$-displacement of the material point that started at $(x, y)$. A short line of material from $(x, y)$ to $(x + \Delta x, y)$ stretches by $u(x + \Delta x, y) - u(x, y)$. Divide by its length and shrink it to a point:

$$\varepsilon_{xx}(x, y) = \lim_{\Delta x \to 0} \frac{u(x + \Delta x, y) - u(x, y)}{\Delta x} = \frac{\partial u}{\partial x}, \qquad \varepsilon_{yy}(x, y) = \frac{\partial v}{\partial y}.$$

- **Sign:** $\varepsilon > 0$ means the material elongates in that direction; $\varepsilon < 0$ means it contracts.
- **Small displacements:** the derivation ignores the sideways motion of the line's ends. That is fine when every displacement derivative is much smaller than 1, because the neglected terms are quadratic, e.g. $\tfrac12\big[(\partial u/\partial x)^2 + (\partial v/\partial x)^2\big] \ll |\partial u/\partial x|$. This is **infinitesimal strain theory**.

Below, $\partial u/\partial x = 0.1$ stretches the square by 10 % in $x$ and $\partial v/\partial y = -0.05$ squashes it by 5 % in $y$ (hugely exaggerated: real strains are around $10^{-3}$).`,
      {
        title: "Normal strain at a point",
        visual: { kind: "strain-grid", config: { grad: [[0.1, 0], [0, -0.05]], sliders: true } },
      },
    ),
    numeric("plate-eyy", {
      body: r`A thin plate is pulled along $x$. Digital image correlation gives the displacement field (consistent units)

$$u = 3 \times 10^{-4}\,x, \qquad v = -1 \times 10^{-4}\,y.$$`,
      question: r`What is $\varepsilon_{yy}$, in micro-strain? Use the sign convention.`,
      answer: -100, // check: εyy = ∂v/∂y = −1×10⁻⁴ = −100 × 10⁻⁶
      tolerance: 1,
      prefix: r`$\varepsilon_{yy} =$`,
      suffix: "μ",
      hint: r`Which displacement component describes motion in $y$, and which coordinate do you differentiate it with respect to?`,
      explanation: r`$$\varepsilon_{yy} = \frac{\partial v}{\partial y} = -1 \times 10^{-4} = -100 \times 10^{-6},$$

so the plate gets thinner in $y$. For completeness, $\varepsilon_{xx} = \partial u/\partial x = +300 \times 10^{-6}$ (it stretches along the pull) and $\gamma_{xy} = \partial u/\partial y + \partial v/\partial x = 0 + 0 = 0$ (no right angle changes). These values are the same at every point, so the strain is **homogeneous**, like the plate of Govindjee's Example 4.1. The contraction across the pull is the Poisson effect of the next unit.`,
      tags: ["normal-strain", "sign-convention", "strain-field"],
    }),
    reading(
      "shear-at-point",
      r`Now draw a tiny right angle at $(x, y)$: one leg of length $\Delta x$ along $x$ and one of length $\Delta y$ along $y$. As the body deforms, both legs can rotate.

- The $x$-leg's far end rises by $v(x + \Delta x, y) - v(x, y)$, so the leg turns counter-clockwise by $\psi_1 \approx \partial v/\partial x$.
- The $y$-leg's far end shifts right by $u(x, y + \Delta y) - u(x, y)$, so the leg turns clockwise by $\psi_2 \approx \partial u/\partial y$.

Both of these rotations close the angle, so the **shear strain at a point** is

$$\gamma_{xy} = \psi_1 + \psi_2 = \frac{\partial u}{\partial y} + \frac{\partial v}{\partial x}.$$

(Strictly $\tan\psi_1 = \dfrac{\partial v/\partial x}{1 + \partial u/\partial x}$; small strain drops the $\partial u/\partial x$ in the denominator.) **Sign:** $\gamma_{xy} > 0$ means the angle between the $+x$ and $+y$ material lines *decreases*; $\gamma_{xy} < 0$ means it opens. If both legs turn the **same** way by the same amount ($\psi_1 = \omega$, $\psi_2 = -\omega$) the angle is unchanged: that is a rigid rotation, not strain.`,
      {
        title: "Shear strain at a point",
        visual: { kind: "strain-grid", config: { grad: [[0, 0.06], [0.04, 0]], sliders: true } },
      },
    ),
    numeric("simple-shear", {
      body: r`**Simple shear:** horizontal layers slide over one another, $u = 2 \times 10^{-4}\,y$ and $v = 0$.`,
      question: r`What is $\gamma_{xy}$, in micro-strain?`,
      answer: 200, // check: γxy = ∂u/∂y + ∂v/∂x = 2×10⁻⁴ + 0 = 200 × 10⁻⁶
      tolerance: 2,
      prefix: r`$\gamma_{xy} =$`,
      suffix: "μ",
      hint: "Shear strain adds two cross-derivatives. Which of them is nonzero here?",
      explanation: r`$$\gamma_{xy} = \frac{\partial u}{\partial y} + \frac{\partial v}{\partial x} = 2 \times 10^{-4} + 0 = 200 \times 10^{-6}.$$

Meanwhile $\varepsilon_{xx} = \partial u/\partial x = 0$ and $\varepsilon_{yy} = \partial v/\partial y = 0$: no fibre along $x$ or $y$ changes length, yet every right angle closes by $200\,\mu\mathrm{rad}$. This is the pointwise version of the sliding pad, where $u = (\delta/h)\,y$.`,
      tags: ["shear-strain", "strain-field"],
    }),
    numeric("tilted-x-leg", {
      body: r`Now the vertical displacement grows along $x$ instead: $u = 0$ and $v = 5 \times 10^{-4}\,x$. The $y$-leg of every little right angle stays vertical while the $x$-leg tilts upward.`,
      question: r`What is $\gamma_{xy}$, in micro-strain?`,
      answer: 500, // check: γxy = ∂u/∂y + ∂v/∂x = 0 + 5×10⁻⁴ = 500 × 10⁻⁶
      tolerance: 5,
      prefix: r`$\gamma_{xy} =$`,
      suffix: "μ",
      hint: r`Only one leg rotates this time. Which derivative measures the tilt of the $x$-leg?`,
      explanation: r`$$\gamma_{xy} = \frac{\partial u}{\partial y} + \frac{\partial v}{\partial x} = 0 + 5 \times 10^{-4} = 500 \times 10^{-6}.$$

The angle closes just as in simple shear: shear strain does not care *which* leg rotates, only by how much the angle between the legs changes. (Unlike a symmetric pure shear, this field also turns each element as a whole; that rotation is not part of the strain.)`,
      tags: ["shear-strain", "strain-field"],
    }),
    mc("rigid-rotation", {
      question: r`Which displacement field ($\omega = 10^{-3}$, a constant) is a pure **rigid rotation**, with every strain component zero?`,
      choices: [
        ["rot", r`$u = -\omega y,\; v = \omega x$`],
        ["pure", r`$u = \omega y,\; v = \omega x$`, r`Here $\gamma_{xy} = \omega + \omega = 2\omega$: the two legs turn *toward* each other. That is pure shear.`],
        ["expand", r`$u = \omega x,\; v = \omega y$`, r`This gives $\varepsilon_{xx} = \varepsilon_{yy} = \omega$: a uniform expansion, not a rotation.`],
        ["simple", r`$u = \omega y,\; v = 0$`, r`Only one leg turns, so the angle changes: $\gamma_{xy} = \omega$ (simple shear).`],
      ],
      correct: "rot",
      shuffle: true,
      hint: r`For each option compute $\varepsilon_{xx}$, $\varepsilon_{yy}$ and $\gamma_{xy} = \partial u/\partial y + \partial v/\partial x$. All three must vanish.`,
      explanation: r`For $u = -\omega y$, $v = \omega x$: $\varepsilon_{xx} = 0$, $\varepsilon_{yy} = 0$ and $\gamma_{xy} = -\omega + \omega = 0$. Both legs of every right angle turn counter-clockwise by $\omega$ (the $x$-leg up, the $y$-leg to the left), so the angle between them is unchanged and the whole body simply rotates by $\omega$. Strain measures *deformation*, so a rigid motion must give zero strain.`,
      tags: ["rigid-body", "shear-strain"],
    }),
    tf("rotation-tf", {
      statement: r`Rotating a small square rigidly by a small angle $\omega$ gives it a shear strain $\gamma_{xy} = \omega$.`,
      answer: false,
      feedback: r`The $x$-side turns by $\omega$, but so does the $y$-side, in the same direction. What happens to the angle *between* them?`,
      hint: "Shear strain is the change of the angle between two material lines, not the rotation of either line on its own.",
      explanation: r`False. Under a rigid rotation both sides turn by $\omega$ in the same sense, so the corner angle stays $90^\circ$ and $\gamma_{xy} = 0$. In formulas, $u = -\omega y$ and $v = \omega x$ give $\partial u/\partial y + \partial v/\partial x = -\omega + \omega = 0$. Rotation is real motion, but it is not deformation.`,
      tags: ["rigid-body", "shear-strain"],
    }),
    mc("negative-gamma", {
      question: r`At a point, $\gamma_{xy} = -400 \times 10^{-6}$. What does the minus sign tell you?`,
      choices: [
        ["opens", r`The angle between the material lines along $+x$ and $+y$ *grows* by $400\,\mu\mathrm{rad}$.`],
        ["closes", r`The angle between those lines *shrinks* by $400\,\mu\mathrm{rad}$.`, r`That is what a *positive* $\gamma_{xy}$ means: Govindjee defines $\gamma$ as the **decrease** of the right angle.`],
        ["compress", "The material at that point is in compression.", r`Compression is about lengths (normal strain or normal stress). $\gamma_{xy}$ is about angles.`],
        ["cw", r`The material at that point rotated clockwise by $400\,\mu\mathrm{rad}$.`, r`Rotation by itself is not strain: $\gamma_{xy}$ measures how the angle *between* two lines changes.`],
      ],
      correct: "opens",
      shuffle: true,
      hint: r`What exactly does Govindjee measure with $\gamma$: an increase or a decrease of the right angle?`,
      explanation: r`$\gamma_{xy}$ is the **decrease** of the right angle between the $+x$ and $+y$ material lines. A negative decrease is an increase: the angle opens to $90^\circ + 400\,\mu\mathrm{rad}$. In a small square, the lower-left and upper-right corners become slightly obtuse and the other two slightly acute.`,
      tags: ["shear-strain", "sign-convention"],
    }),
    reading(
      "summary",
      r`**What you did:** measured average shear strain from a sliding edge, turned "change in length over length" into a derivative, and found that shear strain at a point adds the rotations of two perpendicular material lines.

$$\gamma_{\text{avg}} \approx \frac{\delta}{h}, \qquad \varepsilon_{xx} = \frac{\partial u}{\partial x}, \qquad \varepsilon_{yy} = \frac{\partial v}{\partial y}, \qquad \gamma_{xy} = \frac{\partial u}{\partial y} + \frac{\partial v}{\partial x}$$

- $\varepsilon > 0$: elongation; $\varepsilon < 0$: contraction.
- $\gamma_{xy} > 0$: the right angle between $+x$ and $+y$ closes; $\gamma_{xy} < 0$: it opens.
- Strains are dimensionless ($\gamma$ in radians) and usually quoted in micro-strain, $10^{-6}$.
- Rigid translations and rotations give **zero** strain: $u = -\omega y$, $v = \omega x$ has $\gamma_{xy} = -\omega + \omega = 0$.

Next: collect these numbers into the **strain matrix**, where the factor $\tfrac12$ on $\gamma$ trips up everyone at least once.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · The strain tensor in 2-D and 3-D (Govindjee §4.2.3–4.2.4) */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "sm3-l2-strain-tensor",
    unitId: "sm3",
    title: "The strain tensor in 2-D and 3-D",
    summary: "Put εxx, εyy and ½γxy into the strain matrix, compute strain fields from polynomial displacements point by point, and extend everything to three dimensions.",
    textbook: "Govindjee §4.2.3–4.2.4",
    minutes: 14,
  },
  [
    reading(
      "strain-matrix",
      r`In two dimensions the state of strain at a point is three numbers,

$$\varepsilon_{xx} = \frac{\partial u}{\partial x}, \qquad \varepsilon_{yy} = \frac{\partial v}{\partial y}, \qquad \gamma_{xy} = \frac{\partial u}{\partial y} + \frac{\partial v}{\partial x},$$

and by convention they are reported as the components of the **strain tensor**, in a symmetric matrix (Govindjee eq. 4.15):

$$\boldsymbol{\varepsilon} = \begin{bmatrix} \varepsilon_{xx} & \tfrac12\gamma_{xy} \\ \tfrac12\gamma_{xy} & \varepsilon_{yy} \end{bmatrix} = \begin{bmatrix} \varepsilon_{xx} & \varepsilon_{xy} \\ \varepsilon_{xy} & \varepsilon_{yy} \end{bmatrix}.$$

> $\gamma_{xy}$ is the **engineering** shear strain: the actual change of the right angle. $\varepsilon_{xy} = \tfrac12\gamma_{xy}$ is the **tensorial** shear strain: the number that sits off the diagonal. They differ by a factor of 2, and the matrix never contains $\gamma_{xy}$ itself.

Example: a plate with $u = 4 \times 10^{-4}\,x$ and $v = -1.2 \times 10^{-4}\,y$ has $\boldsymbol{\varepsilon} = \begin{bmatrix} 400 & 0 \\ 0 & -120 \end{bmatrix} \times 10^{-6}$ at every point. That is a **homogeneous** strain: the plate stretches in $x$, contracts in $y$, and no right angle changes. The grid below is sheared as well; compare its $\gamma_{xy}$ and $\varepsilon_{xy}$ readouts.`,
      {
        title: "The strain matrix",
        visual: { kind: "strain-grid", config: { grad: [[0.06, 0.05], [0.03, -0.02]], sliders: true } },
      },
    ),
    numeric("lin-gamma", {
      body: r`A body occupying $[0, 1] \times [0, 1]$ (consistent units) has the displacement field

$$u = (5x + 2y) \times 10^{-4}, \qquad v = (7x + 3y) \times 10^{-4}.$$`,
      question: r`What is the **engineering** shear strain $\gamma_{xy}$, in micro-strain?`,
      answer: 900, // check: γxy = ∂u/∂y + ∂v/∂x = (2 + 7)×10⁻⁴ = 9×10⁻⁴ = 900 × 10⁻⁶ (the wrong pair ∂u/∂x + ∂v/∂y gives 800)
      tolerance: 9,
      prefix: r`$\gamma_{xy} =$`,
      suffix: "μ",
      hint: r`You need one derivative of $u$ and one derivative of $v$, each taken with respect to the *other* coordinate.`,
      explanation: r`$$\gamma_{xy} = \frac{\partial u}{\partial y} + \frac{\partial v}{\partial x} = (2 + 7) \times 10^{-4} = 900 \times 10^{-6}.$$

The normal strains are $\varepsilon_{xx} = \partial u/\partial x = 500 \times 10^{-6}$ and $\varepsilon_{yy} = \partial v/\partial y = 300 \times 10^{-6}$. Because the field is linear, all its derivatives are constants: the strain is the same at every point (homogeneous). Adding the other two derivatives instead, $\partial u/\partial x + \partial v/\partial y = 800 \times 10^{-6}$, would measure the change of area, not the change of angle.`,
      tags: ["strain-field", "shear-strain"],
    }),
    numeric("lin-exy", {
      body: r`Same field: $u = (5x + 2y) \times 10^{-4}$, $v = (7x + 3y) \times 10^{-4}$.`,
      question: r`What number goes in the off-diagonal slot of the strain matrix, the **tensorial** shear strain $\varepsilon_{xy}$, in micro-strain?`,
      answer: 450, // check: εxy = ½γxy = ½ × 900 = 450 × 10⁻⁶ (½(εxx + εyy) = 400 would be the wrong pair)
      tolerance: 4.5,
      prefix: r`$\varepsilon_{xy} =$`,
      suffix: "μ",
      hint: "The matrix does not store the angle change itself. What factor relates the two shear measures?",
      explanation: r`$\varepsilon_{xy} = \tfrac12\gamma_{xy} = \tfrac12(900) = 450 \times 10^{-6}$, so the full strain matrix is

$$\boldsymbol{\varepsilon} = \begin{bmatrix} 500 & 450 \\ 450 & 300 \end{bmatrix} \times 10^{-6}.$$

Writing $900$ off the diagonal is the classic exam error. Keep track of which one you hold: Hooke's law in the next unit, $\gamma_{xy} = \tau_{xy}/G$, uses the engineering value, while the matrix uses half of it.`,
      tags: ["engineering-vs-tensor", "strain-matrix"],
    }),
    tf("offdiag-tf", {
      statement: r`The off-diagonal entries of the strain matrix are the engineering shear strains; for example, the $(1, 2)$ entry is $\gamma_{xy}$.`,
      answer: false,
      feedback: r`Look again at where the $\tfrac12$ sits in the matrix.`,
      hint: "Write the 2-D strain matrix out from memory, including any numerical factors on its off-diagonal entries.",
      explanation: r`False. The off-diagonal entries are the **tensorial** shear strains, $\varepsilon_{xy} = \tfrac12\gamma_{xy}$ (and in 3-D, $\tfrac12\gamma_{yz}$ and $\tfrac12\gamma_{zx}$). The engineering shear strain $\gamma_{xy}$ is the full decrease of the right angle, twice the matrix entry.`,
      tags: ["engineering-vs-tensor", "strain-matrix"],
    }),
    reading(
      "field-recipe",
      r`Most displacement fields are not linear, so the strain varies from point to point. The recipe never changes:

1. Differentiate $u$ and $v$ with respect to $x$ and $y$. Constants (rigid translations) drop out.
2. Assemble $\varepsilon_{xx} = \partial u/\partial x$, $\varepsilon_{yy} = \partial v/\partial y$ and $\gamma_{xy} = \partial u/\partial y + \partial v/\partial x$.
3. **Then** substitute the coordinates of the point.
4. For the matrix, put $\tfrac12\gamma_{xy}$ off the diagonal.

**Reading the result as a picture** (Govindjee's "sketch the deformed square" exercises). A small square of material centred on the point

- gets wider if $\varepsilon_{xx} > 0$ and narrower if $\varepsilon_{xx} < 0$; likewise $\varepsilon_{yy}$ sets its change in height;
- has its lower-left and upper-right corner angles close below $90^\circ$ if $\gamma_{xy} > 0$ (its $+45^\circ$ diagonal then grows relative to the $-45^\circ$ one), and open beyond $90^\circ$ if $\gamma_{xy} < 0$.

In the grid below $\varepsilon_{xx} > 0$, $\varepsilon_{yy} < 0$ and $\gamma_{xy} > 0$: wider, shorter, and leaning so that the lower-left corner is acute.`,
      {
        title: "From a displacement field to strains",
        visual: { kind: "strain-grid", config: { grad: [[0.05, 0.04], [0.04, -0.03]], sliders: true } },
      },
    ),
    numeric("quad-gamma", {
      body: r`A body occupying $[0, 1] \times [0, 1]$ (consistent units) deforms with

$$u = (3x^2 + 1) \times 10^{-4}, \qquad v = (x^3 + 2y^4) \times 10^{-4}.$$`,
      question: r`What is $\gamma_{xy}$ at the point $(0.5,\ 0.5)$, in micro-strain?`,
      answer: 75, // check: ∂u/∂y = 0; ∂v/∂x = 3x²×10⁻⁴ = 3(0.25)×10⁻⁴ = 0.75×10⁻⁴ ⇒ γxy = 75 × 10⁻⁶
      tolerance: 1,
      prefix: r`$\gamma_{xy} =$`,
      suffix: "μ",
      hint: r`Differentiate first and substitute afterwards. Does $u$ depend on $y$ at all?`,
      explanation: r`$u$ depends only on $x$, so $\partial u/\partial y = 0$, and $\partial v/\partial x = 3x^2 \times 10^{-4}$. At $x = 0.5$:

$$\gamma_{xy} = 0 + 3(0.5)^2 \times 10^{-4} = 0.75 \times 10^{-4} = 75 \times 10^{-6}.$$

The $2y^4$ term in $v$ has no $x$ in it, so it cannot contribute to $\partial v/\partial x$; and the "$+1$" in $u$ is a rigid translation that contributes to no strain at all.`,
      tags: ["strain-field", "shear-strain"],
    }),
    matrix("quad-matrix", {
      body: r`Same field: $u = (3x^2 + 1) \times 10^{-4}$, $v = (x^3 + 2y^4) \times 10^{-4}$.`,
      question: r`Write the strain matrix at $(0.5,\ 0.5)$, with every entry in micro-strain.`,
      answer: [
        [300, 37.5],
        [37.5, 100],
      ], // check: εxx = 6x×10⁻⁴ = 3×10⁻⁴ → 300; εyy = 8y³×10⁻⁴ = 8(0.125)×10⁻⁴ → 100; εxy = ½γxy = ½(75) = 37.5 (all ×10⁻⁶)
      tolerance: 1,
      prefix: r`$\boldsymbol{\varepsilon} =$`,
      answerDisplay: r`\begin{bmatrix} 300 & 37.5 \\ 37.5 & 100 \end{bmatrix} \times 10^{-6}`,
      hint: r`You already have $\gamma_{xy}$. Compute the two normal strains at the point, and remember what goes off the diagonal.`,
      explanation: r`$\varepsilon_{xx} = \partial u/\partial x = 6x \times 10^{-4} = 3 \times 10^{-4}$ and $\varepsilon_{yy} = \partial v/\partial y = 8y^3 \times 10^{-4} = 8(0.125) \times 10^{-4} = 1 \times 10^{-4}$. Off the diagonal goes $\tfrac12\gamma_{xy} = 37.5 \times 10^{-6}$:

$$\boldsymbol{\varepsilon}(0.5, 0.5) = \begin{bmatrix} 300 & 37.5 \\ 37.5 & 100 \end{bmatrix} \times 10^{-6}.$$

At another point the numbers change: at $(0.2, 0.2)$, for instance, $\varepsilon_{xx} = 120$, $\varepsilon_{yy} = 6.4$ and $\gamma_{xy} = 12$ (all $\times 10^{-6}$).`,
      tags: ["strain-matrix", "strain-field", "engineering-vs-tensor"],
    }),
    numeric("angle-change", {
      body: r`A body on $[0, 1] \times [0, 1]$ (consistent units) has

$$u = (2y^2 + 3y) \times 10^{-4}, \qquad v = (3x^2 + x) \times 10^{-4}.$$`,
      question: r`By how much does the right angle between the $x$- and $y$-material lines at $(0.25,\ 0.5)$ **decrease**? Answer in micro-radians.`,
      answer: 750, // check: ∂u/∂y = (4y + 3)×10⁻⁴ = 5×10⁻⁴ at y = 0.5; ∂v/∂x = (6x + 1)×10⁻⁴ = 2.5×10⁻⁴ at x = 0.25; γxy = 7.5×10⁻⁴ = 750 μrad
      tolerance: 8,
      suffix: "μrad",
      hint: r`The decrease of the right angle between the $x$ and $y$ lines is one of the strain components. Which one, and which derivatives does it need?`,
      explanation: r`The decrease of that right angle is exactly $\gamma_{xy}$:

$$\gamma_{xy} = \frac{\partial u}{\partial y} + \frac{\partial v}{\partial x} = (4y + 3) \times 10^{-4} + (6x + 1) \times 10^{-4} = (5 + 2.5) \times 10^{-4} = 750 \times 10^{-6}\ \mathrm{rad}.$$

Notice $\varepsilon_{xx} = \partial u/\partial x = 0$ and $\varepsilon_{yy} = \partial v/\partial y = 0$: at this point lines along $x$ and $y$ keep their lengths, and the deformation is all change of angle.`,
      tags: ["shear-strain", "strain-field"],
    }),
    mc("sketch-square", {
      body: r`Displacement field (consistent units):

$$u = (5x - y^2) \times 10^{-4}, \qquad v = (2 - 3x^2) \times 10^{-4}.$$

Picture a tiny square of material centred at $(0.5,\ 0.5)$.`,
      question: "Which description matches how that square deforms?",
      choices: [
        ["right", r`It gets wider in $x$, keeps its height, and its lower-left corner angle opens slightly beyond $90^\circ$.`],
        ["closes", r`It gets wider in $x$, keeps its height, and its lower-left corner angle closes slightly below $90^\circ$.`, r`That needs $\gamma_{xy} > 0$. Evaluate both cross-derivatives at the point and add them, signs included.`],
        ["narrow", r`It gets narrower in $x$, keeps its height, and its lower-left corner angle opens slightly beyond $90^\circ$.`, r`Check the sign of $\partial u/\partial x$ at the point.`],
        ["both", r`It gets wider in $x$ and taller in $y$, and its corners stay square.`, r`Here $\partial v/\partial y = 0$, and the two cross-derivatives do not cancel.`],
      ],
      correct: "right",
      shuffle: true,
      hint: r`Compute $\varepsilon_{xx}$, $\varepsilon_{yy}$ and $\gamma_{xy}$ at the point first, then translate each sign into a change of shape.`,
      explanation: r`At $(0.5, 0.5)$:

- $\varepsilon_{xx} = \partial u/\partial x = 5 \times 10^{-4} > 0$: wider.
- $\varepsilon_{yy} = \partial v/\partial y = 0$: height unchanged (to first order).
- $\gamma_{xy} = \partial u/\partial y + \partial v/\partial x = (-2y - 6x) \times 10^{-4} = (-1 - 3) \times 10^{-4} = -400 \times 10^{-6} < 0$: the lower-left and upper-right corners open beyond $90^\circ$.

So the sketch is a slightly wider square, sheared the opposite way to the grid on the recipe screen, with the diagonal from upper-left to lower-right now the longer one. The "2" in $v$ is a rigid translation and changes nothing.`,
      tags: ["deformed-shape", "strain-field", "sign-convention"],
    }),
    numeric("beam-exx", {
      body: r`**Pure bending.** A beam bent by end moments moves as

$$u_x = -\kappa x y, \qquad u_y = \tfrac12 \kappa x^2,$$

where $y$ is measured up from the beam's mid-line and $\kappa = 2 \times 10^{-5}\ \mathrm{mm}^{-1}$ is the curvature. (This is the kinematics behind beam theory, Govindjee ch. 8.)`,
      question: r`What is $\varepsilon_{xx}$ at the point $x = 300\,\mathrm{mm}$, $y = 10\,\mathrm{mm}$ (above the mid-line), in micro-strain? Use the sign convention.`,
      answer: -200, // check: εxx = ∂ux/∂x = −κy = −(2×10⁻⁵ /mm)(10 mm) = −2×10⁻⁴ = −200 × 10⁻⁶
      tolerance: 2,
      prefix: r`$\varepsilon_{xx} =$`,
      suffix: "μ",
      hint: r`Differentiate $u_x$ with respect to $x$, holding $y$ fixed. Does the value of $x$ end up mattering?`,
      explanation: r`$$\varepsilon_{xx} = \frac{\partial u_x}{\partial x} = -\kappa y = -(2 \times 10^{-5}\,\mathrm{mm}^{-1})(10\,\mathrm{mm}) = -200 \times 10^{-6}.$$

Fibres above the mid-line shorten and fibres below it ($y < 0$) lengthen; the mid-line itself ($y = 0$) keeps its length: it is the **neutral axis**. The $x = 300\,\mathrm{mm}$ was a distractor, since $\varepsilon_{xx}$ depends only on $y$. Also $\varepsilon_{yy} = \partial u_y/\partial y = 0$.`,
      tags: ["strain-field", "beam-kinematics", "sign-convention"],
    }),
    mc("beam-gamma", {
      body: r`Same pure-bending field: $u_x = -\kappa x y$, $u_y = \tfrac12 \kappa x^2$.`,
      question: r`What is $\gamma_{xy}$, and what does it tell you?`,
      choices: [
        ["zero", r`$\gamma_{xy} = 0$ everywhere: lines that start vertical (the cross-sections) stay perpendicular to the beam's fibres.`],
        ["mkx", r`$\gamma_{xy} = -\kappa x$: the cross-sections tilt relative to the fibres.`, r`That is only $\partial u_x/\partial y$. Add $\partial u_y/\partial x$.`],
        ["m2kx", r`$\gamma_{xy} = -2\kappa x$.`, r`Check the sign of $\partial u_y/\partial x = \partial(\tfrac12\kappa x^2)/\partial x$.`],
        ["half", r`$\gamma_{xy} = \tfrac12\kappa x^2$.`, r`That is $u_y$ itself, not a derivative of it.`],
      ],
      correct: "zero",
      shuffle: true,
      hint: r`Two cross-derivatives: $\partial u_x/\partial y$ and $\partial u_y/\partial x$. Get the sign of each before adding.`,
      explanation: r`$\partial u_x/\partial y = -\kappa x$ and $\partial u_y/\partial x = \kappa x$, so $\gamma_{xy} = -\kappa x + \kappa x = 0$. Each cross-section rotates by $\kappa x$, but the fibres at that $x$ rotate by exactly the same amount, so the right angle between them survives. This is "plane sections remain plane **and normal**", the Bernoulli–Euler assumption that gives $\varepsilon_{xx} = -\kappa y$ and $\gamma_{xy} = 0$ in beam theory.`,
      tags: ["beam-kinematics", "shear-strain"],
    }),
    numeric("three-d-ezz", {
      body: r`**Three dimensions.** Add the $z$-displacement $w(x, y, z)$. There are now three normal strains and three shear strains, one per coordinate plane (Govindjee §4.2.4). On top of $\varepsilon_{xx}$, $\varepsilon_{yy}$ and $\gamma_{xy}$:

$$\varepsilon_{zz} = \frac{\partial w}{\partial z}, \qquad \gamma_{yz} = \frac{\partial v}{\partial z} + \frac{\partial w}{\partial y}, \qquad \gamma_{zx} = \frac{\partial w}{\partial x} + \frac{\partial u}{\partial z},$$

and the matrix again carries half of each $\gamma$:

$$\boldsymbol{\varepsilon} = \begin{bmatrix} \varepsilon_{xx} & \tfrac12\gamma_{xy} & \tfrac12\gamma_{zx} \\ \tfrac12\gamma_{xy} & \varepsilon_{yy} & \tfrac12\gamma_{yz} \\ \tfrac12\gamma_{zx} & \tfrac12\gamma_{yz} & \varepsilon_{zz} \end{bmatrix}.$$

A block, with all lengths in mm, deforms as $u = 0$, $v = 1 \times 10^{-4}\,z^2$, $w = 2 \times 10^{-4}\,yz$ (both constants in $\mathrm{mm}^{-1}$).`,
      question: r`What is $\varepsilon_{zz}$ at the point $(x, y, z) = (5, 3, 2)\,\mathrm{mm}$, in micro-strain?`,
      answer: 600, // check: εzz = ∂w/∂z = 2×10⁻⁴ y = 2×10⁻⁴ × 3 = 6×10⁻⁴ = 600 × 10⁻⁶ (w itself there is 2×10⁻⁴·3·2 = 1.2×10⁻³ mm, not a strain)
      tolerance: 6,
      prefix: r`$\varepsilon_{zz} =$`,
      suffix: "μ",
      hint: r`Differentiate $w$ with respect to $z$ only, then substitute the point.`,
      explanation: r`$$\varepsilon_{zz} = \frac{\partial w}{\partial z} = 2 \times 10^{-4}\,y = 2 \times 10^{-4} \times 3 = 600 \times 10^{-6}.$$

Fibres along $z$ stretch here, and the more so the larger $y$ is. Plugging the point into $w$ itself would give a displacement ($1.2 \times 10^{-3}\,\mathrm{mm}$), not a strain: differentiate first.`,
      tags: ["3d-strain", "strain-field"],
    }),
    numeric("three-d-gyz", {
      body: r`Same block: $u = 0$, $v = 1 \times 10^{-4}\,z^2$, $w = 2 \times 10^{-4}\,yz$, at $(5, 3, 2)\,\mathrm{mm}$.`,
      question: r`What is the engineering shear strain $\gamma_{yz}$ there, in micro-strain?`,
      answer: 800, // check: γyz = ∂v/∂z + ∂w/∂y = 2×10⁻⁴ z + 2×10⁻⁴ z = 4×10⁻⁴ z = 8×10⁻⁴ at z = 2 → 800 × 10⁻⁶
      tolerance: 8,
      prefix: r`$\gamma_{yz} =$`,
      suffix: "μ",
      hint: r`$\gamma_{yz}$ pairs the $y$- and $z$-directions: one derivative of $v$ and one derivative of $w$. Both are nonzero here.`,
      explanation: r`$$\gamma_{yz} = \frac{\partial v}{\partial z} + \frac{\partial w}{\partial y} = 2 \times 10^{-4}\,z + 2 \times 10^{-4}\,z = 4 \times 10^{-4}\,z = 800 \times 10^{-6} \quad (z = 2).$$

Every other component vanishes ($\varepsilon_{xx} = 0$, $\varepsilon_{yy} = \partial v/\partial y = 0$, $\gamma_{xy} = 0$, $\gamma_{zx} = \partial w/\partial x + \partial u/\partial z = 0$), so at this point

$$\boldsymbol{\varepsilon} = \begin{bmatrix} 0 & 0 & 0 \\ 0 & 0 & 400 \\ 0 & 400 & 600 \end{bmatrix} \times 10^{-6},$$

with $\tfrac12\gamma_{yz} = 400 \times 10^{-6}$ in the $(y, z)$ slots. Dropping the $\partial v/\partial z$ term would also give $400$, a common slip.`,
      tags: ["3d-strain", "shear-strain", "engineering-vs-tensor"],
    }),
    reading(
      "summary",
      r`**What you did:** built strain matrices from displacement fields: linear ones (homogeneous strain), polynomial ones (strain that varies from point to point), the pure-bending field and a 3-D field.

$$\boldsymbol{\varepsilon} = \begin{bmatrix} \varepsilon_{xx} & \tfrac12\gamma_{xy} & \tfrac12\gamma_{zx} \\ \tfrac12\gamma_{xy} & \varepsilon_{yy} & \tfrac12\gamma_{yz} \\ \tfrac12\gamma_{zx} & \tfrac12\gamma_{yz} & \varepsilon_{zz} \end{bmatrix}$$

$$\gamma_{xy} = \frac{\partial u}{\partial y} + \frac{\partial v}{\partial x}, \qquad \gamma_{yz} = \frac{\partial v}{\partial z} + \frac{\partial w}{\partial y}, \qquad \gamma_{zx} = \frac{\partial w}{\partial x} + \frac{\partial u}{\partial z}$$

- Differentiate first, substitute the point second; constants (rigid translations) never contribute.
- Engineering $\gamma_{xy}$ is the angle change; tensorial $\varepsilon_{xy} = \tfrac12\gamma_{xy}$ is the matrix entry.
- Shape of a small square: the signs of $\varepsilon_{xx}$ and $\varepsilon_{yy}$ give its change in width and height; $\gamma_{xy} > 0$ closes its lower-left corner.
- Pure bending, $u_x = -\kappa xy$ and $u_y = \tfrac12\kappa x^2$, gives $\varepsilon_{xx} = -\kappa y$ and $\gamma_{xy} = 0$.

Next: the same ideas in polar coordinates, for rings, discs and twisted shafts.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Polar strains and counting equations (Govindjee §4.3–4.4) */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "sm3-l3-polar-strain-and-counting",
    unitId: "sm3",
    title: "Polar strains and counting equations",
    summary: "Hoop, radial and twisting strains in cylindrical coordinates, and why equilibrium plus kinematics still leave six equations for the material to supply.",
    textbook: "Govindjee §4.3–4.4",
    minutes: 13,
  },
  [
    reading(
      "polar",
      r`For rings, discs, tubes and shafts, describe the motion by $u_r$ (radial), $u_\theta$ (circumferential) and $u_z$ (axial). Constructions like the Cartesian ones give (Govindjee eq. 4.24):

$$\varepsilon_{rr} = \frac{\partial u_r}{\partial r}, \qquad \varepsilon_{\theta\theta} = \frac{u_r}{r} + \frac{1}{r}\frac{\partial u_\theta}{\partial \theta}, \qquad \varepsilon_{zz} = \frac{\partial u_z}{\partial z},$$

$$\gamma_{r\theta} = \frac{1}{r}\frac{\partial u_r}{\partial \theta} + \frac{\partial u_\theta}{\partial r} - \frac{u_\theta}{r}, \qquad \gamma_{\theta z} = \frac{\partial u_\theta}{\partial z} + \frac{1}{r}\frac{\partial u_z}{\partial \theta}, \qquad \gamma_{rz} = \frac{\partial u_r}{\partial z} + \frac{\partial u_z}{\partial r}.$$

The meanings carry over unchanged: $\varepsilon_{\theta\theta}$ is the **hoop** (circumferential) strain, $\gamma_{\theta z}$ is the decrease of the right angle between the $\theta$- and $z$-lines, and the strain matrix again holds $\tfrac12\gamma$ off the diagonal. Two terms have no Cartesian twin:

- $u_r/r$ in $\varepsilon_{\theta\theta}$: a ring of radius $r$ pushed out to $r + u_r$ has circumference $2\pi(r + u_r)$, so its hoop strain is $2\pi u_r / (2\pi r) = u_r/r$. Purely radial motion stretches the hoop.
- $-u_\theta/r$ in $\gamma_{r\theta}$: a rigid spin $u_\theta = \omega r$ has $\partial u_\theta/\partial r = \omega$, and $-u_\theta/r = -\omega$ cancels it, so a rotation again gives no strain.

Up close, $r$ and $\theta$ act like $x$ and $y$. The grid (read $x$ as $r$ and $y$ as $\theta$) shows uniform expansion $u_r = c\,r$: the element grows equally both ways, $\varepsilon_{rr} = \varepsilon_{\theta\theta} = c$.`,
      {
        title: "Strain in polar coordinates",
        visual: { kind: "strain-grid", config: { grad: [[0.05, 0], [0, 0.05]], sliders: true } },
      },
    ),
    mc("hoop-which", {
      question: "A strain gauge is bonded to the outside of a pressurised pipe, wrapped along its circumference. Which polar strain component does it read?",
      choices: [
        ["tt", r`$\varepsilon_{\theta\theta}$, the hoop strain`],
        ["rr", r`$\varepsilon_{rr}$`, "The radial direction runs through the wall thickness, not around the pipe."],
        ["zz", r`$\varepsilon_{zz}$`, "That is the strain along the pipe's axis; a gauge lying along the axis would read it."],
        ["tz", r`$\gamma_{\theta z}$`, "That is a change of angle between the hoop and axial lines. A single gauge measures a change of length along its own direction."],
      ],
      correct: "tt",
      shuffle: true,
      hint: "Which coordinate direction runs around the circumference?",
      explanation: r`The circumferential direction is $\theta$, so the gauge reads $\varepsilon_{\theta\theta} = u_r/r + (1/r)\,\partial u_\theta/\partial\theta$, the hoop strain. For a pipe that just swells ($u_\theta = 0$) it is $u_r/r$, the relative change of the radius and also of the circumference. You will use exactly this for pressure vessels.`,
      tags: ["polar-strain", "hoop-strain"],
    }),
    numeric("ring-hoop", {
      body: r`A thin polymer ring of radius $60\,\mathrm{mm}$ is pushed onto a tapered mandrel. Afterwards its radius is $60.9\,\mathrm{mm}$; all of the motion is radial.`,
      question: r`What is the hoop strain $\varepsilon_{\theta\theta}$ in the ring? Give a plain decimal.`,
      answer: 0.015, // check: εθθ = ΔC/C = 2π(60.9 − 60)/(2π·60) = 0.9/60 = 0.015 (= ur/r)
      tolerance: 0.0002,
      prefix: r`$\varepsilon_{\theta\theta} =$`,
      hint: r`Compare the circumference after with the circumference before. What happens to the $2\pi$?`,
      explanation: r`$$\varepsilon_{\theta\theta} = \frac{\Delta C}{C} = \frac{2\pi(60.9) - 2\pi(60)}{2\pi(60)} = \frac{0.9}{60} = 0.015.$$

The formula gives the same number: $u_\theta = 0$, so $\varepsilon_{\theta\theta} = u_r/r = 0.9/60$. The ring's material moved only outward, yet the hoop is stretched by 1.5 %.`,
      tags: ["hoop-strain", "polar-strain"],
    }),
    numeric("ring-radius", {
      body: r`A thin aluminium band of radius $80\,\mathrm{mm}$ is pressed onto a slightly oversized hub. A strain gauge bonded along the band's circumference then reads $\varepsilon_{\theta\theta} = +1500 \times 10^{-6}$; the band moves only radially.`,
      question: r`How far did the band move outward, $u_r$, in mm? Give three significant figures.`,
      answer: 0.12, // check: ur = εθθ·r = 1500×10⁻⁶ × 80 mm = 0.12 mm
      tolerance: 0.002,
      prefix: r`$u_r =$`,
      suffix: "mm",
      hint: "With purely radial motion the hoop strain is a simple ratio of two lengths. Rearrange it.",
      explanation: r`$\varepsilon_{\theta\theta} = u_r/r$, so

$$u_r = \varepsilon_{\theta\theta}\, r = 1500 \times 10^{-6} \times 80\,\mathrm{mm} = 0.12\,\mathrm{mm}.$$

The circumference grew by $\Delta C = \varepsilon_{\theta\theta}\, C = 2\pi u_r \approx 0.754\,\mathrm{mm}$, and the diameter by $0.24\,\mathrm{mm}$.`,
      tags: ["hoop-strain", "polar-strain"],
    }),
    numeric("uniform-expansion", {
      body: r`A thin disc heated uniformly moves as $u_r = c\,r$ with $c = 2 \times 10^{-4}$, and $u_\theta = 0$.`,
      question: r`What is the hoop strain $\varepsilon_{\theta\theta}$ at $r = 30\,\mathrm{mm}$, in micro-strain?`,
      answer: 200, // check: εθθ = ur/r + (1/r)∂uθ/∂θ = c·r/r + 0 = c = 2×10⁻⁴ = 200 × 10⁻⁶ (at any r)
      tolerance: 2,
      prefix: r`$\varepsilon_{\theta\theta} =$`,
      suffix: "μ",
      hint: r`Use the $\varepsilon_{\theta\theta}$ formula; $u_\theta = 0$ removes one term. Does the radius survive the division?`,
      explanation: r`$$\varepsilon_{\theta\theta} = \frac{u_r}{r} + \frac{1}{r}\frac{\partial u_\theta}{\partial \theta} = \frac{c\,r}{r} + 0 = c = 200 \times 10^{-6},$$

the same at every radius, and $\varepsilon_{rr} = \partial u_r/\partial r = c = 200 \times 10^{-6}$ as well. The disc grows like a photo being enlarged: equal stretch in every in-plane direction and no shear. That is free thermal expansion, with $c = \alpha\,\Delta T$.`,
      tags: ["polar-strain", "hoop-strain"],
    }),
    numeric("thick-ring", {
      body: r`In a thick-walled tube under pressure the radial displacement has the form $u_r = A\,r + B/r$, with $u_\theta = u_z = 0$. Take $A = 3 \times 10^{-4}$ and $B = 0.04\,\mathrm{mm}^2$, with $r$ and $u_r$ in mm.`,
      question: r`What is the radial strain $\varepsilon_{rr}$ at $r = 20\,\mathrm{mm}$, in micro-strain? Use the sign convention.`,
      answer: 200, // check: εrr = ∂ur/∂r = A − B/r² = 3×10⁻⁴ − 0.04/400 = 3×10⁻⁴ − 1×10⁻⁴ = 2×10⁻⁴ = 200 × 10⁻⁶
      tolerance: 2,
      prefix: r`$\varepsilon_{rr} =$`,
      suffix: "μ",
      hint: r`Differentiate $u_r$ with respect to $r$, watching the sign of the derivative of $B/r$.`,
      explanation: r`$$\varepsilon_{rr} = \frac{\partial u_r}{\partial r} = A - \frac{B}{r^2} = 3 \times 10^{-4} - \frac{0.04}{400} = (3 - 1) \times 10^{-4} = 200 \times 10^{-6}.$$

The hoop strain is different: $\varepsilon_{\theta\theta} = u_r/r = A + B/r^2 = 400 \times 10^{-6}$. The $B/r$ part stretches the hoop but squeezes the wall, so in a thick tube $\varepsilon_{rr} \ne \varepsilon_{\theta\theta}$. (This is the form of the classical Lamé solution.)`,
      tags: ["polar-strain", "strain-field"],
    }),
    numeric("torsion-gamma", {
      body: r`A solid rod of radius $10\,\mathrm{mm}$ is clamped at its base ($z = 0$) and twisted at the top. Its measured motion is

$$u_r = 0, \qquad u_\theta = \alpha\, r z, \qquad u_z = 0, \qquad \alpha = 5 \times 10^{-4}\ \mathrm{rad/mm}.$$`,
      question: r`What is $\gamma_{\theta z}$ at the rod's outer surface, $r = 10\,\mathrm{mm}$, in micro-strain?`,
      answer: 5000, // check: γθz = ∂uθ/∂z + (1/r)∂uz/∂θ = αr + 0 = 5×10⁻⁴ × 10 = 5×10⁻³ = 5000 × 10⁻⁶
      tolerance: 50,
      prefix: r`$\gamma_{\theta z} =$`,
      suffix: "μ",
      hint: r`$\gamma_{\theta z}$ pairs $\theta$ and $z$: differentiate $u_\theta$ along $z$, and $u_z$ around $\theta$.`,
      explanation: r`$$\gamma_{\theta z} = \frac{\partial u_\theta}{\partial z} + \frac{1}{r}\frac{\partial u_z}{\partial \theta} = \alpha r + 0 = (5 \times 10^{-4})(10) = 5 \times 10^{-3} = 5000 \times 10^{-6}.$$

It grows linearly with $r$: zero on the axis and largest at the surface. This is the kinematics of torsion (Govindjee ch. 7): $u_\theta = r\varphi(z)$ with the rotation $\varphi = \alpha z$, so $\gamma_{\theta z} = r\varphi'$ and $\alpha$ is the twist rate $\varphi'$.`,
      tags: ["torsion-kinematics", "polar-strain"],
    }),
    multi("torsion-nonzero", {
      body: r`Same twisting rod: $u_r = 0$, $u_\theta = \alpha\, r z$, $u_z = 0$.`,
      question: "Select **every** strain component that is nonzero.",
      choices: [
        ["rr", r`$\varepsilon_{rr}$`],
        ["tt", r`$\varepsilon_{\theta\theta}$`],
        ["zz", r`$\varepsilon_{zz}$`],
        ["rt", r`$\gamma_{r\theta}$`],
        ["tz", r`$\gamma_{\theta z}$`],
        ["rz", r`$\gamma_{rz}$`],
      ],
      correct: ["tz"],
      hint: r`Work through all six formulas. For $\gamma_{r\theta}$, do not forget the $-u_\theta/r$ term.`,
      explanation: r`- $\varepsilon_{rr} = \partial u_r/\partial r = 0$ and $\varepsilon_{zz} = \partial u_z/\partial z = 0$.
- $\varepsilon_{\theta\theta} = u_r/r + (1/r)\,\partial u_\theta/\partial\theta = 0 + 0$, since $u_\theta$ does not depend on $\theta$.
- $\gamma_{r\theta} = (1/r)\,\partial u_r/\partial\theta + \partial u_\theta/\partial r - u_\theta/r = 0 + \alpha z - \alpha z = 0$.
- $\gamma_{\theta z} = \partial u_\theta/\partial z + (1/r)\,\partial u_z/\partial\theta = \alpha r$.
- $\gamma_{rz} = \partial u_r/\partial z + \partial u_z/\partial r = 0$.

Only $\gamma_{\theta z}$ survives: a twisted shaft is in pure shear in the $\theta$–$z$ plane. Forgetting $-u_\theta/r$ would wrongly give $\gamma_{r\theta} = \alpha z$.`,
      tags: ["torsion-kinematics", "polar-strain"],
    }),
    reading(
      "counting",
      r`Take stock of the theory so far (Govindjee §4.4). In 3-D the unknown fields are

- 6 strains: $\varepsilon_{xx}, \varepsilon_{yy}, \varepsilon_{zz}, \gamma_{xy}, \gamma_{yz}, \gamma_{zx}$;
- 3 displacements: $u, v, w$;
- 9 stresses: $\sigma_{xx}, \sigma_{xy}, \dots, \sigma_{zz}$.

That is **18 unknowns**. The equations are 6 equilibrium equations (3 force and 3 moment) and 6 strain–displacement relations: **12 equations**, so 6 are missing. In 2-D: 3 strains + 2 displacements + 4 stresses = 9 unknowns, against 3 equilibrium (2 force, 1 moment) + 3 strain–displacement = 6 equations, so 3 are missing.

> The missing equations are the **constitutive relations**: how *this* material links stress to strain (generalized Hooke's law, next unit). Equilibrium and kinematics are the same for every material; they cannot tell steel from rubber.

If you assume $\boldsymbol{\sigma}$ is symmetric from the start, there are only 6 unknown stresses in 3-D (3 in 2-D) and you must stop counting the moment equations: 15 unknowns against 9 equations, still 6 missing (8 against 5 in 2-D, still 3).`,
      { title: "Counting unknowns and equations" },
    ),
    mc("count-3d", {
      question: "Which count is right for a 3-D solid, using only equilibrium and the strain–displacement relations?",
      choices: [
        ["right", "18 unknowns and 12 equations: 6 equations missing"],
        ["nomoment", "18 unknowns and 9 equations: 9 equations missing", "You dropped the 3 moment-equilibrium equations. With all 9 stress components unknown they count: 3 force + 3 moment = 6."],
        ["sym", "15 unknowns and 12 equations: 3 equations missing", "Mixed bookkeeping. If you keep only 6 symmetric stresses (15 unknowns), the moment equations are already used up and you have 9 equations, not 12."],
        ["closed", "12 unknowns and 12 equations: nothing missing", "Count the unknowns again: 6 strains + 3 displacements + 9 stresses."],
      ],
      correct: "right",
      shuffle: true,
      hint: "Count strains, displacements and stresses separately; then count force equations, moment equations and strain–displacement equations.",
      explanation: r`Unknowns: 6 strains + 3 displacements + 9 stresses = 18. Equations: 3 force-equilibrium + 3 moment-equilibrium + 6 strain–displacement = 12. That leaves $18 - 12 = 6$ equations for the material to supply. (With symmetric stresses assumed from the start: 15 unknowns and 9 equations, the same 6 missing.)`,
      tags: ["counting"],
    }),
    mc("missing-eqs", {
      question: "What supplies the missing equations?",
      choices: [
        ["const", "Constitutive relations: the material's stress–strain law (generalized Hooke's law)."],
        ["bc", "Boundary conditions.", "Boundary conditions pin down the constants in a particular solution; they are not field equations that hold at every point."],
        ["fbd", "More free-body diagrams.", "Every free-body diagram you could draw is already summarized by the equilibrium equations; extra cuts give no new independent equations."],
        ["compat", "Compatibility conditions on the strains.", "Strains computed from a displacement field are automatically compatible. The missing link is between stress and strain."],
      ],
      correct: "const",
      shuffle: true,
      hint: "Equilibrium involves only stresses; the strain–displacement relations involve only strains and displacements. Which link between the two groups is still missing?",
      explanation: r`Nothing so far connects stresses to strains: equilibrium is a statement about $\boldsymbol{\sigma}$ alone, and kinematics about $\boldsymbol{\varepsilon}$ and $u, v, w$ alone. The bridge is the **constitutive law**, e.g. $\sigma = E\varepsilon$ in 1-D or generalized Hooke's law in 3-D: 6 equations in 3-D, 3 in 2-D. It is the only place where the material enters.`,
      tags: ["counting", "constitutive"],
    }),
    tf("geometry-only", {
      statement: r`The strain–displacement relations, such as $\gamma_{xy} = \partial u/\partial y + \partial v/\partial x$, are the same whether the body is made of steel, rubber or bone.`,
      answer: true,
      feedback: r`Did any material property appear when you derived $\gamma_{xy}$ from the deformed right angle?`,
      hint: r`Think about what went into deriving $\varepsilon_{xx} = \partial u/\partial x$: geometry, forces, or material constants?`,
      explanation: r`True (within small-strain theory). Kinematics only compares positions before and after deformation, so it is pure geometry. The material enters only through the constitutive law; equilibrium is material-independent too.`,
      tags: ["counting", "kinematics"],
    }),
    mc("count-2d", {
      question: r`In a 2-D problem in the $x$–$y$ plane, how many **independent** strain components are there at a point?`,
      choices: [
        ["three", r`3: $\varepsilon_{xx}$, $\varepsilon_{yy}$ and $\gamma_{xy}$`],
        ["four", r`4: $\varepsilon_{xx}$, $\varepsilon_{xy}$, $\varepsilon_{yx}$ and $\varepsilon_{yy}$`, r`$\varepsilon_{xy}$ and $\varepsilon_{yx}$ are the same number (the strain matrix is symmetric), so they count once.`],
        ["two", r`2: $\varepsilon_{xx}$ and $\varepsilon_{yy}$`, "That leaves out the change of angle, which is independent of the two stretches."],
        ["six", "6", "Six is the 3-D count: three normal strains and three shear strains."],
      ],
      correct: "three",
      shuffle: true,
      hint: "Count the stretches, then the angle changes. Is the 2-D strain matrix symmetric?",
      explanation: r`Two normal strains ($\varepsilon_{xx}$, $\varepsilon_{yy}$) and one shear strain ($\gamma_{xy}$, stored as $\tfrac12\gamma_{xy}$ in both off-diagonal slots): 3 independent components, matching the 3 strain–displacement equations in the 2-D count. In 3-D there are 6.`,
      tags: ["counting", "strain-matrix"],
    }),
    reading(
      "summary",
      r`**What you did:** computed hoop, radial and twisting strains in polar coordinates, and counted the equations of the theory.

$$\varepsilon_{rr} = \frac{\partial u_r}{\partial r}, \qquad \varepsilon_{\theta\theta} = \frac{u_r}{r} + \frac{1}{r}\frac{\partial u_\theta}{\partial \theta}, \qquad \varepsilon_{zz} = \frac{\partial u_z}{\partial z}$$

$$\gamma_{r\theta} = \frac{1}{r}\frac{\partial u_r}{\partial \theta} + \frac{\partial u_\theta}{\partial r} - \frac{u_\theta}{r}, \qquad \gamma_{\theta z} = \frac{\partial u_\theta}{\partial z} + \frac{1}{r}\frac{\partial u_z}{\partial \theta}, \qquad \gamma_{rz} = \frac{\partial u_r}{\partial z} + \frac{\partial u_z}{\partial r}$$

- Thin ring moving radially: $\varepsilon_{\theta\theta} = u_r/r = \Delta C/C$.
- Uniform expansion $u_r = c\,r$: $\varepsilon_{rr} = \varepsilon_{\theta\theta} = c$. Thick tube $u_r = Ar + B/r$: $\varepsilon_{rr} = A - B/r^2$ and $\varepsilon_{\theta\theta} = A + B/r^2$.
- Twisting, $u_\theta = \alpha r z$: only $\gamma_{\theta z} = \alpha r$, zero on the axis and largest at the surface.
- 3-D: 18 unknowns and 12 equations, so 6 constitutive equations are needed; 2-D: 9 against 6, so 3.

You have finished the Strain unit. Take the **Level Check**, then move on to generalized Hooke's law: the missing equations.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Unit                                                                 */
/* ------------------------------------------------------------------ */

export const sm3: Unit = {
  id: "sm3",
  title: "Strain",
  subtitle: "Normal and shear strain at a point",
  description: "Strain measures relative deformation: stretch of fibres and change of right angles. Compute strains from displacement fields and keep tensor and engineering shear strain straight.",
  textbook: "Govindjee ch. 4",
  lessons: [l1, l2, l3],
  practice: [
    numeric("p-avg-shear", {
      question: r`An elastomeric bridge bearing is $1.5\,\mathrm{in}$ thick. Thermal movement of the girder shifts the top of the bearing $0.006\,\mathrm{in}$ horizontally relative to its base, and its sides stay straight. What is the average shear strain? Give a plain decimal (radians).`,
      answer: 0.004, // check: γ ≈ δ/h = 0.006 in / 1.5 in = 0.004 rad
      tolerance: 0.00005,
      prefix: r`$\gamma =$`,
      suffix: "rad",
      hint: "Which right angle changes? Use the small-angle approximation.",
      explanation: r`$\gamma \approx \tan\gamma = \delta/h = 0.006/1.5 = 0.004\ \mathrm{rad}$, i.e. $4000 \times 10^{-6}$. The units cancel, so inches work just as well as millimetres.`,
      tags: ["average-shear-strain"],
    }),
    matrix("p-linear-matrix", {
      question: r`For $u = (6x - 2y) \times 10^{-4}$ and $v = (5x - 4y) \times 10^{-4}$ (consistent units), write the strain matrix with entries in micro-strain.`,
      answer: [
        [600, 150],
        [150, -400],
      ], // check: εxx = ∂u/∂x = 6×10⁻⁴ → 600; εyy = ∂v/∂y = −4×10⁻⁴ → −400; γxy = ∂u/∂y + ∂v/∂x = (−2 + 5)×10⁻⁴ = 300 → εxy = 150 (all ×10⁻⁶)
      tolerance: 2,
      prefix: r`$\boldsymbol{\varepsilon} =$`,
      answerDisplay: r`\begin{bmatrix} 600 & 150 \\ 150 & -400 \end{bmatrix} \times 10^{-6}`,
      hint: "Diagonal: the two normal strains. Off the diagonal: half of the engineering shear strain.",
      explanation: r`$\varepsilon_{xx} = 600 \times 10^{-6}$, $\varepsilon_{yy} = -400 \times 10^{-6}$ and $\gamma_{xy} = (-2 + 5) \times 10^{-4} = 300 \times 10^{-6}$, so $\varepsilon_{xy} = 150 \times 10^{-6}$. The field is linear, so this matrix holds at every point.`,
      tags: ["strain-matrix", "strain-field", "engineering-vs-tensor"],
    }),
    numeric("p-tensor-to-eng", {
      question: r`A finite-element program reports the strain matrix at a point as $\begin{bmatrix} 250 & -350 \\ -350 & 120 \end{bmatrix} \times 10^{-6}$. What is the engineering shear strain $\gamma_{xy}$, in micro-strain? Use the sign convention.`,
      answer: -700, // check: γxy = 2εxy = 2 × (−350) = −700 × 10⁻⁶
      tolerance: 7,
      prefix: r`$\gamma_{xy} =$`,
      suffix: "μ",
      hint: "The off-diagonal entry is the tensorial shear strain. How is it related to the change of angle?",
      explanation: r`$\gamma_{xy} = 2\varepsilon_{xy} = 2(-350) = -700 \times 10^{-6}$: the right angle between the $x$ and $y$ lines *opens* by $700\,\mu\mathrm{rad}$.`,
      tags: ["engineering-vs-tensor", "sign-convention"],
    }),
    numeric("p-quadratic", {
      question: r`A body on $[0, 1] \times [0, 1]$ has $u = (2x^2 + xy) \times 10^{-4}$ and $v = (3y^2 - x^2) \times 10^{-4}$ (consistent units). What is $\varepsilon_{xx}$ at $(0.5,\ 0.5)$, in micro-strain?`,
      answer: 250, // check: εxx = ∂u/∂x = (4x + y)×10⁻⁴ = (2 + 0.5)×10⁻⁴ = 2.5×10⁻⁴ = 250 × 10⁻⁶
      tolerance: 3,
      prefix: r`$\varepsilon_{xx} =$`,
      suffix: "μ",
      hint: r`Differentiate every term of $u$ with respect to $x$, including the $xy$ term, then substitute.`,
      explanation: r`$\varepsilon_{xx} = \partial u/\partial x = (4x + y) \times 10^{-4} = (2 + 0.5) \times 10^{-4} = 250 \times 10^{-6}$. For the record, at the same point $\varepsilon_{yy} = 6y \times 10^{-4} = 300 \times 10^{-6}$ and $\gamma_{xy} = (x - 2x) \times 10^{-4} = -50 \times 10^{-6}$.`,
      tags: ["strain-field", "normal-strain"],
    }),
    tf("p-zero-strain", {
      statement: "If every strain component is zero at every point of a body, the body cannot have moved.",
      answer: false,
      feedback: "Strain measures deformation. Can a body move without deforming?",
      hint: "Picture a book sliding and turning on a table. Do the distances and angles between its material points change?",
      explanation: r`False. Rigid-body motions produce zero strain everywhere: translations ($u = a$, $v = b$) and small rotations ($u = -\omega y$, $v = \omega x$, for which $\gamma_{xy} = -\omega + \omega = 0$). Zero strain means no deformation, not no motion.`,
      tags: ["rigid-body"],
    }),
    mc("p-sketch", {
      question: r`For $u = (3y - 2x) \times 10^{-4}$ and $v = (4y + x) \times 10^{-4}$, how does a small square of material deform?`,
      choices: [
        ["right", r`It gets narrower in $x$, taller in $y$, and its lower-left corner angle closes slightly below $90^\circ$.`],
        ["opens", r`It gets narrower in $x$, taller in $y$, and its lower-left corner angle opens slightly beyond $90^\circ$.`, r`$\partial u/\partial y$ and $\partial v/\partial x$ are both positive, so $\gamma_{xy} > 0$.`],
        ["wider", r`It gets wider in $x$, shorter in $y$, and its lower-left corner angle closes slightly below $90^\circ$.`, r`Check the signs: $\partial u/\partial x = -2 \times 10^{-4}$ and $\partial v/\partial y = +4 \times 10^{-4}$.`],
        ["rotates", r`It gets narrower in $x$ and taller in $y$; the $3y$ and $x$ terms only rotate it.`, "The cross terms would only rotate the square if they cancelled; here they add."],
      ],
      correct: "right",
      shuffle: true,
      hint: r`Find the signs of $\varepsilon_{xx}$, $\varepsilon_{yy}$ and $\gamma_{xy}$.`,
      explanation: r`$\varepsilon_{xx} = -2 \times 10^{-4}$ (narrower), $\varepsilon_{yy} = +4 \times 10^{-4}$ (taller) and $\gamma_{xy} = (3 + 1) \times 10^{-4} > 0$ (the lower-left and upper-right corners close). The field is linear, so every small square in the body deforms the same way.`,
      tags: ["deformed-shape", "strain-field"],
    }),
    numeric("p-ring", {
      question: r`A thin steel hoop of diameter $500\,\mathrm{mm}$ is heated, and its diameter grows by $0.4\,\mathrm{mm}$. What is its hoop strain, in micro-strain?`,
      answer: 800, // check: εθθ = ur/r = 0.2 mm / 250 mm = 8×10⁻⁴ = 800 × 10⁻⁶ (= ΔD/D = 0.4/500)
      tolerance: 8,
      prefix: r`$\varepsilon_{\theta\theta} =$`,
      suffix: "μ",
      hint: "Turn the diameter and its change into a radius and a radial displacement, or work with the circumference directly.",
      explanation: r`$u_r = 0.4/2 = 0.2\,\mathrm{mm}$ and $r = 250\,\mathrm{mm}$, so $\varepsilon_{\theta\theta} = u_r/r = 0.2/250 = 800 \times 10^{-6}$; equivalently $\Delta D/D = 0.4/500$. Dividing $0.4$ by the radius ($1600 \times 10^{-6}$) is the usual slip.`,
      tags: ["hoop-strain", "polar-strain"],
    }),
    numeric("p-torsion", {
      question: r`A shaft of outer radius $20\,\mathrm{mm}$ twists with $u_r = 0$, $u_\theta = \alpha\, r z$, $u_z = 0$, where $\alpha = 6 \times 10^{-5}\ \mathrm{rad/mm}$. What is $\gamma_{\theta z}$ at $r = 15\,\mathrm{mm}$, inside the shaft, in micro-strain?`,
      answer: 900, // check: γθz = ∂uθ/∂z + (1/r)∂uz/∂θ = αr = 6×10⁻⁵ × 15 = 9×10⁻⁴ = 900 × 10⁻⁶
      tolerance: 9,
      prefix: r`$\gamma_{\theta z} =$`,
      suffix: "μ",
      hint: r`Differentiate $u_\theta$ with respect to $z$. Which radius ends up in the result: the outer one or the local one?`,
      explanation: r`$\gamma_{\theta z} = \partial u_\theta/\partial z + (1/r)\,\partial u_z/\partial\theta = \alpha r = (6 \times 10^{-5})(15) = 900 \times 10^{-6}$. At the surface ($r = 20\,\mathrm{mm}$) it would be $1200 \times 10^{-6}$: the shear strain is linear in $r$.`,
      tags: ["torsion-kinematics", "polar-strain"],
    }),
    mc("p-count-2d", {
      question: "In a 2-D problem, how many equations must the constitutive law supply to close the theory?",
      choices: [
        ["three", "3"],
        ["six", "6", "Six is the 3-D answer (18 unknowns against 12 equations)."],
        ["two", "2", "If you count only 3 symmetric stresses (8 unknowns), you must also stop counting the moment equation (5 equations): still 3 missing."],
        ["zero", "None: equilibrium and kinematics are enough", "Equilibrium and kinematics never link stress to strain, so they cannot be enough."],
      ],
      correct: "three",
      shuffle: true,
      hint: "Count the unknowns (strains, displacements, stresses) and the equations (equilibrium, strain–displacement) in 2-D.",
      explanation: r`Unknowns: 3 strains + 2 displacements + 4 stresses = 9. Equations: 3 equilibrium (2 force + 1 moment) + 3 strain–displacement = 6. Missing: $9 - 6 = 3$, supplied by the material's stress–strain law.`,
      tags: ["counting"],
    }),
    numeric("p-3d", {
      question: r`A body (lengths in m, constants in $\mathrm{m}^{-1}$) deforms as $u = 3 \times 10^{-4}\,z^2$, $v = 0$, $w = 1 \times 10^{-4}\,x^2$. What is the engineering shear strain $\gamma_{zx}$ at $(x, y, z) = (0.5, 2, 0.5)\,\mathrm{m}$, in micro-strain?`,
      answer: 400, // check: γzx = ∂w/∂x + ∂u/∂z = 2×10⁻⁴ x + 6×10⁻⁴ z = (1 + 3)×10⁻⁴ = 400 × 10⁻⁶
      tolerance: 4,
      prefix: r`$\gamma_{zx} =$`,
      suffix: "μ",
      hint: r`$\gamma_{zx}$ pairs $z$ and $x$: one derivative of $w$ and one of $u$.`,
      explanation: r`$\gamma_{zx} = \partial w/\partial x + \partial u/\partial z = 2 \times 10^{-4}(0.5) + 6 \times 10^{-4}(0.5) = (1 + 3) \times 10^{-4} = 400 \times 10^{-6}$. The strain-matrix entry is half of that, $\varepsilon_{zx} = 200 \times 10^{-6}$; every other component is zero here.`,
      tags: ["3d-strain", "shear-strain"],
    }),
    numeric("p-polar-shear", {
      question: r`In a disc, material moves only circumferentially, $u_\theta = k r^2$ with $k = 3 \times 10^{-6}\ \mathrm{mm}^{-1}$ ($u_r = u_z = 0$). What is $\gamma_{r\theta}$ at $r = 50\,\mathrm{mm}$, in micro-strain?`,
      answer: 150, // check: γrθ = (1/r)∂ur/∂θ + ∂uθ/∂r − uθ/r = 0 + 2kr − kr = kr = 3×10⁻⁶ × 50 = 1.5×10⁻⁴ = 150 × 10⁻⁶
      tolerance: 2,
      prefix: r`$\gamma_{r\theta} =$`,
      suffix: "μ",
      hint: r`Use all three terms of $\gamma_{r\theta}$, including the one that removes rigid rotation.`,
      explanation: r`$\gamma_{r\theta} = \frac{1}{r}\frac{\partial u_r}{\partial\theta} + \frac{\partial u_\theta}{\partial r} - \frac{u_\theta}{r} = 0 + 2kr - kr = kr = (3 \times 10^{-6})(50) = 150 \times 10^{-6}$. Forgetting $-u_\theta/r$ gives $2kr = 300 \times 10^{-6}$; a rigid spin ($u_\theta$ proportional to $r$) would give zero.`,
      tags: ["polar-strain", "shear-strain"],
    }),
    numeric("p-beam", {
      question: r`A beam in pure bending moves as $u_x = -\kappa x y$, $u_y = \tfrac12\kappa x^2$, with $y$ measured up from the mid-line and $\kappa = 5 \times 10^{-6}\ \mathrm{mm}^{-1}$. What is $\varepsilon_{xx}$ at $60\,\mathrm{mm}$ **below** the mid-line, in micro-strain? Use the sign convention.`,
      answer: 300, // check: εxx = −κy = −(5×10⁻⁶ /mm)(−60 mm) = +3×10⁻⁴ = 300 × 10⁻⁶
      tolerance: 3,
      prefix: r`$\varepsilon_{xx} =$`,
      suffix: "μ",
      hint: r`Differentiate $u_x$ with respect to $x$, and be careful with the sign of $y$ below the mid-line.`,
      explanation: r`$\varepsilon_{xx} = \partial u_x/\partial x = -\kappa y = -(5 \times 10^{-6})(-60) = +300 \times 10^{-6}$: the fibres below the mid-line stretch when the beam curves this way. And $\gamma_{xy} = -\kappa x + \kappa x = 0$.`,
      tags: ["beam-kinematics", "sign-convention"],
    }),
  ],
  generators: ["gen.sm.strain-from-field", "gen.sm.strain-quadratic", "gen.sm.average-shear-strain"],
};
