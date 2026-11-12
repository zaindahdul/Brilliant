import type { QuestionStep, Unit, VisualSpec } from "../types";
import { lesson, mc, multi, numeric, order, r, reading, tf } from "../dsl";

/*
 * Unit sm9 · Stress and strain from other angles (Govindjee §9.1–9.4, Lectures 34–38).
 *
 * Conventions are the book's:
 *   - Axes x′, y′ are the x, y axes turned COUNTER-CLOCKWISE by θ.
 *   - σx′x′ = σm + σd cos2θ + σxy sin2θ, σx′y′ = −σd sin2θ + σxy cos2θ,
 *     with σm = (σxx + σyy)/2 and σd = (σxx − σyy)/2.
 *   - tan 2θp = 2σxy/(σxx − σyy); σ1,2 = σm ± R, R = √(σd² + σxy²).
 *   - Mohr's circle is drawn with the shear axis pointing DOWN, so turning the axes by θ
 *     moves the point by 2θ around the circle in the same sense.
 *   - Strain transforms like stress with the tensor shear strain εxy = γxy/2.
 *   - Tresca: σmax − σmin = σY. Von Mises: ½[(σ1−σ2)² + (σ2−σ3)² + (σ3−σ1)²] = σY².
 * Stresses are in MPa and strains in micro-strain (μ = 10⁻⁶). Every numeric answer carries a "check" comment.
 */

const stressCircle = (sxx: number, syy: number, sxy: number, theta = 0): VisualSpec => ({ kind: "mohr-circle", config: { sxx, syy, sxy, theta, sliders: true, max: 100, unit: "MPa" } });

/* ------------------------------------------------------------------ */
/* Lesson 1 · Turning the axes (Govindjee §9.1–9.2.1)                  */
/* ------------------------------------------------------------------ */

const l1 = lesson(
  {
    id: "sm9-l1-stress-transformation",
    unitId: "sm9",
    title: "Turning the axes",
    summary: "The stress at a point is one physical state, but its components depend on the axes. The transformation equations convert between them.",
    textbook: "Govindjee §9.1–9.2.1",
    minutes: 14,
  },
  [
    reading(
      "same-state",
      r`Pull on a strip of plywood along its length. Measured along the strip, the stress is simple: one normal stress. But the glue lines between the plies, or a diagonal joint, do not care about your axes. What matters to a glue line is how hard it is being **pulled apart** and how hard it is being **sheared** along itself.

The state of stress at a point is one physical thing. The three numbers that describe it in two dimensions,

$$\sigma_{xx}, \quad \sigma_{yy}, \quad \sigma_{xy},$$

are that state as seen from the $x$ and $y$ axes. Turn the axes and the numbers change, even though nothing physical has.

This unit answers three questions:

1. Given the stress in one set of axes, what is it in another?
2. In which directions are the normal and shear stresses largest?
3. How do you decide whether a combined state of stress will make a metal yield?`,
      { title: "One state, many descriptions" },
    ),
    reading(
      "vector",
      r`Warm up with something simpler than stress: a force, which is a vector.

Let the axes $x'$, $y'$ be the $x$, $y$ axes turned **counter-clockwise** by an angle $\theta$. A force with components $(F_x, F_y)$ in the old axes has, in the new ones,

$$F_{x'} = F_x\cos\theta + F_y\sin\theta, \qquad F_{y'} = -F_x\sin\theta + F_y\cos\theta.$$

The force itself has not changed. Only its description has. Each new component is the old vector projected onto a new axis.

A vector has one direction built into it, so the rotation enters once. Stress has **two** directions built in: the direction the cut faces, and the direction the force acts. That is why its rule will use the rotation twice.`,
      { title: "Warm-up: a vector in turned axes" },
    ),
    numeric("vector-x", {
      question: r`A force of $100\ \mathrm{N}$ points along $+x$, so $(F_x, F_y) = (100, 0)$. The axes are turned counter-clockwise by $30^\circ$. What is $F_{x'}$?`,
      answer: 86.6, // check: 100 cos30° = 86.60 N
      tolerance: 0.9,
      prefix: r`$F_{x'} =$`,
      suffix: "N",
      hint: r`Use the first of the two formulas. With $F_y = 0$ only one term survives.`,
      explanation: r`$F_{x'} = 100\cos 30^\circ + 0 = 86.6\ \mathrm{N}$. The new $x'$ axis is only $30^\circ$ away from the force, so most of the force lies along it.`,
      tags: ["transformation", "vectors"],
    }),
    numeric("vector-y", {
      question: r`Same force, same turned axes. What is $F_{y'}$, with its sign?`,
      answer: -50, // check: −100 sin30° = −50 N
      tolerance: 0.5,
      prefix: r`$F_{y'} =$`,
      suffix: "N",
      hint: r`Use the second formula, and keep the minus sign in front of the sine.`,
      explanation: r`$F_{y'} = -100\sin 30^\circ + 0 = -50\ \mathrm{N}$. The $y'$ axis has swung up and to the left, so a force pointing right has a negative component along it. Check: $86.6^2 + 50^2 = 100^2$. The length of the force is unchanged.`,
      tags: ["transformation", "vectors"],
    }),
    reading(
      "equations",
      r`Applying the rotation twice to the stress gives the **stress transformation equations**. Define two shorthand quantities first:

$$\sigma_m = \frac{\sigma_{xx} + \sigma_{yy}}{2} \ \ \text{(the average)}, \qquad \sigma_d = \frac{\sigma_{xx} - \sigma_{yy}}{2} \ \ \text{(half the difference)}.$$

Then, for axes turned counter-clockwise by $\theta$:

$$\sigma_{x'x'} = \sigma_m + \sigma_d\cos 2\theta + \sigma_{xy}\sin 2\theta$$
$$\sigma_{y'y'} = \sigma_m - \sigma_d\cos 2\theta - \sigma_{xy}\sin 2\theta$$
$$\sigma_{x'y'} = -\sigma_d\sin 2\theta + \sigma_{xy}\cos 2\theta$$

Notice the **double angle** $2\theta$. Turning the axes by $180^\circ$ brings every face of a small square back onto a face, so the stresses repeat every $180^\circ$, not every $360^\circ$.

Turn the element below with the $\theta$ slider and watch the three components change while the loading stays the same. (The circle on the right is the subject of a later lesson.)`,
      { title: "The transformation equations", visual: stressCircle(80, 20, 30) },
    ),
    numeric("normal", {
      body: r`At a point, $\sigma_{xx} = 80\ \mathrm{MPa}$, $\sigma_{yy} = 20\ \mathrm{MPa}$ and $\sigma_{xy} = 30\ \mathrm{MPa}$. The axes are turned counter-clockwise by $\theta = 30^\circ$.`,
      question: r`What is $\sigma_{x'x'}$?`,
      answer: 90.98, // check: σm = 50, σd = 30; 50 + 30cos60° + 30sin60° = 50 + 15 + 25.98 = 90.98 MPa
      tolerance: 0.9,
      prefix: r`$\sigma_{x'x'} =$`,
      suffix: "MPa",
      hint: r`Find $\sigma_m$ and $\sigma_d$ first. Then remember the angle inside the cosine and sine is $2\theta$, not $\theta$.`,
      explanation: r`$\sigma_m = 50$ and $\sigma_d = 30\ \mathrm{MPa}$. With $2\theta = 60^\circ$: $\sigma_{x'x'} = 50 + 30\cos 60^\circ + 30\sin 60^\circ = 50 + 15 + 25.98 = 91.0\ \mathrm{MPa}$. Larger than either of the original normal stresses.`,
      tags: ["transformation"],
    }),
    numeric("shear", {
      question: r`Same state, same $\theta = 30^\circ$. What is $\sigma_{x'y'}$, with its sign?`,
      answer: -10.98, // check: −30 sin60° + 30 cos60° = −25.98 + 15 = −10.98 MPa
      tolerance: 0.2,
      prefix: r`$\sigma_{x'y'} =$`,
      suffix: "MPa",
      hint: r`Use the third equation. $\sigma_d$ and $2\theta$ are the same as before.`,
      explanation: r`$\sigma_{x'y'} = -30\sin 60^\circ + 30\cos 60^\circ = -25.98 + 15 = -11.0\ \mathrm{MPa}$. The shear stress has changed sign and shrunk. Somewhere between $\theta = 0$ and $30^\circ$ it passed through zero.`,
      tags: ["transformation"],
    }),
    reading(
      "invariants",
      r`Some combinations of the components come out the same in **every** set of axes. They are called **invariants**, and they are the best check on a transformation you can have.

$$\sigma_{x'x'} + \sigma_{y'y'} = \sigma_{xx} + \sigma_{yy}$$
$$\sigma_{x'x'}\,\sigma_{y'y'} - \sigma_{x'y'}^2 = \sigma_{xx}\,\sigma_{yy} - \sigma_{xy}^2$$

The first says the **sum of the two normal stresses never changes**. (Add the first two transformation equations and the angle terms cancel.) The second is the determinant of the stress matrix.

If your transformed stresses do not add up to the same total, something went wrong.`,
      { title: "What does not change" },
    ),
    numeric("yy-from-invariant", {
      question: r`For the state above you found $\sigma_{x'x'} = 90.98\ \mathrm{MPa}$. Use an invariant, not the transformation equation, to find $\sigma_{y'y'}$.`,
      answer: 9.02, // check: 80 + 20 − 90.98 = 9.02 MPa
      tolerance: 0.15,
      prefix: r`$\sigma_{y'y'} =$`,
      suffix: "MPa",
      hint: "The two normal stresses add up to the same total in any axes. What was that total in the original axes?",
      explanation: r`$\sigma_{xx} + \sigma_{yy} = 80 + 20 = 100\ \mathrm{MPa}$, so $\sigma_{y'y'} = 100 - 90.98 = 9.0\ \mathrm{MPa}$. The second invariant agrees: $80 \times 20 - 30^2 = 700$ and $90.98 \times 9.02 - 10.98^2 = 700$.`,
      tags: ["transformation", "invariants"],
    }),
    mc("uniaxial-45", {
      body: r`A bar is in simple tension: $\sigma_{xx} = \sigma_0$, with $\sigma_{yy} = 0$ and $\sigma_{xy} = 0$.`,
      question: r`What does the stress look like in axes turned by $45^\circ$?`,
      choices: [
        ["half-half", r`Normal stresses of $\sigma_0/2$ on both pairs of faces, and a shear stress of size $\sigma_0/2$`],
        ["same", r`The same as before: $\sigma_0$ on one pair of faces and nothing else`, r`Put $\theta = 45^\circ$ into the equations. Does $\cos 90^\circ$ leave the $\sigma_d$ term alone?`],
        ["shear-only", r`Only a shear stress, of size $\sigma_0$`, r`The two normal stresses must still add up to $\sigma_0$. Can they both be zero?`],
        ["zero", "No stress at all", "The bar is still being pulled. Turning your head does not unload it."],
      ],
      correct: "half-half",
      shuffle: true,
      hint: r`Here $\sigma_m = \sigma_d = \sigma_0/2$ and $2\theta = 90^\circ$. Evaluate each equation.`,
      explanation: r`With $2\theta = 90^\circ$: $\sigma_{x'x'} = \sigma_m = \sigma_0/2$, $\sigma_{y'y'} = \sigma_m = \sigma_0/2$, and $\sigma_{x'y'} = -\sigma_d = -\sigma_0/2$. A bar in pure tension carries a shear stress of half the tension on its $45^\circ$ planes. Ductile metals pulled to failure show slip along exactly those planes.`,
      tags: ["transformation", "uniaxial"],
    }),
    numeric("scarf-normal", {
      body: r`A wooden strip is pulled along $x$ with $\sigma_{xx} = 100\ \mathrm{MPa}$ and no other stress. It contains a glued joint whose normal direction makes $60^\circ$ with the $x$ axis.`,
      question: "What normal stress is pulling the glued joint apart?",
      answer: 25, // check: σm = σd = 50; 50 + 50 cos120° = 50 − 25 = 25 MPa
      tolerance: 0.25,
      suffix: "MPa",
      hint: r`Choose $x'$ along the joint's normal, so $\theta = 60^\circ$. Then the stress pulling the joint apart is $\sigma_{x'x'}$.`,
      explanation: r`With $x'$ along the joint's normal, $\theta = 60^\circ$ and $2\theta = 120^\circ$. $\sigma_m = \sigma_d = 50\ \mathrm{MPa}$, so $\sigma_{x'x'} = 50 + 50\cos 120^\circ = 50 - 25 = 25\ \mathrm{MPa}$. Slanting the joint cuts the stress across it to a quarter.`,
      tags: ["transformation", "joints"],
    }),
    numeric("scarf-shear", {
      question: "For the same joint, what is the size of the shear stress acting along it?",
      answer: 43.3, // check: |−50 sin120°| = 43.30 MPa
      tolerance: 0.45,
      suffix: "MPa",
      hint: r`Use the equation for $\sigma_{x'y'}$ with the same $\theta$. Only its size is asked for.`,
      explanation: r`$\sigma_{x'y'} = -50\sin 120^\circ + 0 = -43.3\ \mathrm{MPa}$, so the size is $43.3\ \mathrm{MPa}$. The slanted joint is pulled apart less but sheared more. Whether that is a good trade depends on what the glue is good at.`,
      tags: ["transformation", "joints"],
    }),
    tf("sum-invariant", {
      statement: r`By choosing the axes cleverly, you can make $\sigma_{x'x'} + \sigma_{y'y'}$ larger than $\sigma_{xx} + \sigma_{yy}$.`,
      answer: false,
      feedback: "Add the first two transformation equations together. What is left?",
      hint: "Add the transformation equations for the two normal stresses and see what happens to the terms with the angle in them.",
      explanation: r`False. Adding the two equations gives $\sigma_{x'x'} + \sigma_{y'y'} = 2\sigma_m = \sigma_{xx} + \sigma_{yy}$ for every $\theta$. Turning the axes can move stress from one normal component to the other, but the total is fixed.`,
      tags: ["invariants"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Explain why stress components change with the axes while the physical state does not.
- Transform a plane state of stress:
$$\sigma_{x'x'} = \sigma_m + \sigma_d\cos 2\theta + \sigma_{xy}\sin 2\theta, \qquad \sigma_{x'y'} = -\sigma_d\sin 2\theta + \sigma_{xy}\cos 2\theta.$$
- Check the result with the invariant $\sigma_{x'x'} + \sigma_{y'y'} = \sigma_{xx} + \sigma_{yy}$.
- Find the normal and shear stress on a slanted joint.

Next: as the axes turn, the normal stress rises and falls. Where does it peak?`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 2 · Principal stresses and maximum shear (Govindjee §9.2.2–9.2.3) */
/* ------------------------------------------------------------------ */

const l2 = lesson(
  {
    id: "sm9-l2-principal-stresses",
    unitId: "sm9",
    title: "Principal stresses and maximum shear",
    summary: "Every state of stress has two perpendicular directions with no shear, carrying the largest and smallest normal stress.",
    textbook: "Govindjee §9.2.2–9.2.3",
    minutes: 14,
  },
  [
    reading(
      "principal",
      r`Turn the axes steadily and $\sigma_{x'x'}$ rises and falls like a wave. Materials fail where stresses are extreme, so the peaks are what matter.

Set the derivative of $\sigma_{x'x'}$ with respect to $\theta$ to zero and you find the angle of the peak:

$$\tan 2\theta_p = \frac{\sigma_{xy}}{\sigma_d} = \frac{2\sigma_{xy}}{\sigma_{xx} - \sigma_{yy}}.$$

Two remarkable things happen at this angle.

- The **shear stress is zero**. The condition for the peak is exactly $\sigma_{x'y'} = 0$.
- The two normal stresses are the largest and the smallest that any direction can have:

$$\sigma_{1,2} = \sigma_m \pm R, \qquad R = \sqrt{\sigma_d^2 + \sigma_{xy}^2}.$$

$\sigma_1$ and $\sigma_2$ are the **principal stresses**, and the directions they act along are the **principal directions**. The two principal directions are always $90^\circ$ apart.`,
      { title: "Where the normal stress peaks" },
    ),
    numeric("sigma-1", {
      body: r`At a point, $\sigma_{xx} = 90\ \mathrm{MPa}$, $\sigma_{yy} = 10\ \mathrm{MPa}$ and $\sigma_{xy} = 30\ \mathrm{MPa}$.`,
      question: r`What is the larger principal stress $\sigma_1$?`,
      answer: 100, // check: σm = 50, σd = 40, R = √(40² + 30²) = 50; σ1 = 100 MPa
      tolerance: 1,
      prefix: r`$\sigma_1 =$`,
      suffix: "MPa",
      hint: r`Compute $\sigma_m$, $\sigma_d$ and then $R$. The numbers form a familiar right triangle.`,
      explanation: r`$\sigma_m = 50$, $\sigma_d = 40$, and $R = \sqrt{40^2 + 30^2} = 50\ \mathrm{MPa}$. So $\sigma_1 = \sigma_m + R = 100\ \mathrm{MPa}$, more than the largest stress you started with.`,
      tags: ["principal-stress"],
    }),
    numeric("sigma-2", {
      question: r`Same state. What is the smaller principal stress $\sigma_2$?`,
      answer: 0, // check: σ2 = 50 − 50 = 0 MPa
      tolerance: 0.5,
      prefix: r`$\sigma_2 =$`,
      suffix: "MPa",
      hint: r`$\sigma_2 = \sigma_m - R$, with the same $\sigma_m$ and $R$.`,
      explanation: r`$\sigma_2 = 50 - 50 = 0$. Seen from its principal directions, this state is a simple pull of $100\ \mathrm{MPa}$ in one direction and nothing in the other. The original description hid that. Check with the invariant: $100 + 0 = 90 + 10$.`,
      tags: ["principal-stress"],
    }),
    numeric("theta-p", {
      question: r`Same state. Through what angle $\theta_p$ must the axes be turned, counter-clockwise from $x$, to line up with the direction of $\sigma_1$? Answer in degrees.`,
      answer: 18.43, // check: 2θp = atan(30/40) = 36.87°, θp = 18.43°
      tolerance: 0.2,
      prefix: r`$\theta_p =$`,
      suffix: "°",
      hint: r`$\tan 2\theta_p = \sigma_{xy}/\sigma_d$. Find $2\theta_p$ first, then halve it.`,
      explanation: r`$\tan 2\theta_p = 30/40$, so $2\theta_p = 36.87^\circ$ and $\theta_p = 18.4^\circ$. Check by substituting into the transformation equation: $50 + 40\cos 36.87^\circ + 30\sin 36.87^\circ = 50 + 32 + 18 = 100\ \mathrm{MPa}$. The other principal direction is $90^\circ$ further round.`,
      tags: ["principal-stress", "principal-direction"],
    }),
    mc("shear-on-principal", {
      question: "What is the shear stress on the planes the principal stresses act on?",
      choices: [
        ["zero", "Zero"],
        ["max", "The largest it can be", "The planes of largest shear exist, but they are not these. What condition picked out the principal directions?"],
        ["sxy", r`The same as $\sigma_{xy}$ in the original axes`, "The shear component changes as the axes turn. What value does it take at the peak of the normal stress?"],
        ["half", "Half the principal stress", "That is a different result, for a different set of planes."],
      ],
      correct: "zero",
      shuffle: true,
      hint: r`The derivative of $\sigma_{x'x'}$ with respect to $\theta$ turns out to be $2\sigma_{x'y'}$. What does setting it to zero say?`,
      explanation: "The normal stress peaks exactly where the shear stress vanishes. So an element lined up with the principal directions is pulled or pushed on its faces, with no shear at all. That is the cleanest description any state of stress can have.",
      tags: ["principal-stress"],
    }),
    reading(
      "max-shear",
      r`The shear stress has peaks of its own. They lie on planes turned **45° from the principal directions**, and their size is the same $R$:

$$\tau_{\max} = R = \sqrt{\sigma_d^2 + \sigma_{xy}^2} = \frac{\sigma_1 - \sigma_2}{2}.$$

So the largest shear stress is half the difference between the principal stresses. On those planes the two normal stresses are not zero: both equal the average, $\sigma_m$.

To summarise the pattern, turning the element through $45^\circ$ takes you from

- **principal directions:** extreme normal stresses, no shear, to
- **maximum-shear directions:** extreme shear, equal normal stresses.`,
      { title: "Where the shear stress peaks" },
    ),
    numeric("tau-max", {
      question: r`For the state $\sigma_{xx} = 90$, $\sigma_{yy} = 10$, $\sigma_{xy} = 30\ \mathrm{MPa}$, what is the largest shear stress on any plane perpendicular to the page?`,
      answer: 50, // check: R = 50 MPa = (100 − 0)/2
      tolerance: 0.5,
      prefix: r`$\tau_{\max} =$`,
      suffix: "MPa",
      hint: "It equals the R you already computed, or half the difference between the two principal stresses.",
      explanation: r`$\tau_{\max} = R = 50\ \mathrm{MPa}$, which is also $(\sigma_1 - \sigma_2)/2 = (100 - 0)/2$. It is well above the $30\ \mathrm{MPa}$ of shear in the original axes.`,
      tags: ["max-shear"],
    }),
    numeric("normal-on-shear-planes", {
      question: "On those planes of largest shear, what is the normal stress?",
      answer: 50, // check: σm = 50 MPa
      tolerance: 0.5,
      suffix: "MPa",
      hint: "On the planes of maximum shear, both normal stresses take the same value. Which combination of the stresses never changes with the axes?",
      explanation: r`Both normal stresses equal the average, $\sigma_m = 50\ \mathrm{MPa}$. They have to: the two are equal there, and their sum must still be $100\ \mathrm{MPa}$.`,
      tags: ["max-shear"],
    }),
    reading(
      "eigen",
      r`If you have met eigenvalues, there is a second route to the same answer, and it is the one that extends to three dimensions.

Write the stress as a symmetric matrix:

$$\boldsymbol{\sigma} = \begin{bmatrix} \sigma_{xx} & \sigma_{xy} \\ \sigma_{xy} & \sigma_{yy} \end{bmatrix}.$$

A principal direction $\mathbf{n}$ is one where the force on the cut points straight along the cut's normal, with no shear: $\boldsymbol{\sigma}\,\mathbf{n} = \lambda\,\mathbf{n}$. That is the eigenvalue problem. **The principal stresses are the eigenvalues, and the principal directions are the eigenvectors.**

In two dimensions the eigenvalues solve

$$\lambda^2 - (\sigma_{xx} + \sigma_{yy})\,\lambda + (\sigma_{xx}\sigma_{yy} - \sigma_{xy}^2) = 0.$$

The two coefficients are the two invariants from the last lesson.

**Example.** For $\sigma_{xx} = 50$, $\sigma_{yy} = -10$, $\sigma_{xy} = 40\ \mathrm{MPa}$: the sum is $40$ and the determinant is $-500 - 1600 = -2100$, so $\lambda^2 - 40\lambda - 2100 = 0$, giving $\lambda = 70$ and $\lambda = -30\ \mathrm{MPa}$.`,
      { title: "Principal stresses are eigenvalues" },
    ),
    numeric("eigenvalue", {
      question: r`A state of stress has $\sigma_{xx} = 60$, $\sigma_{yy} = 30$ and $\sigma_{xy} = 20\ \mathrm{MPa}$. What is its larger principal stress? Use whichever method you prefer.`,
      answer: 70, // check: λ² − 90λ + 1400 = 0 → λ = 45 ± 25 → 70, 20; or σm = 45, σd = 15, R = 25
      tolerance: 0.7,
      prefix: r`$\sigma_1 =$`,
      suffix: "MPa",
      hint: r`Either solve $\lambda^2 - (\text{sum})\lambda + (\text{determinant}) = 0$, or use $\sigma_m + R$. Both must agree.`,
      explanation: r`Eigenvalues: the sum is $90$ and the determinant is $60 \times 30 - 20^2 = 1400$, so $\lambda^2 - 90\lambda + 1400 = 0$ and $\lambda = 45 \pm 25$, that is $70$ and $20\ \mathrm{MPa}$. Or: $\sigma_m = 45$, $\sigma_d = 15$, $R = \sqrt{15^2 + 20^2} = 25$, so $\sigma_1 = 70\ \mathrm{MPa}$.`,
      tags: ["principal-stress", "eigenvalues"],
    }),
    mc("why-perpendicular", {
      question: "Why are the two principal directions always perpendicular to each other?",
      choices: [
        ["symmetric", "Because the stress matrix is symmetric"],
        ["small", "Because the stresses are small", "The size of the stresses does not enter. Think about what kind of matrix the stress is."],
        ["elastic", "Because the material is elastic", "Stress is defined without any reference to the material. This is a property of stress itself."],
        ["chance", "They are not always: it depends on the loading", "They are, for every state of stress. Which property of the stress matrix guarantees it?"],
      ],
      correct: "symmetric",
      shuffle: true,
      hint: r`Moment balance on a small element forces $\sigma_{xy} = \sigma_{yx}$. What does linear algebra say about the eigenvectors of such a matrix?`,
      explanation: r`Moment balance makes the stress matrix symmetric ($\sigma_{xy} = \sigma_{yx}$), and a symmetric matrix has real eigenvalues with mutually perpendicular eigenvectors. In two dimensions you can also see it from $\tan 2\theta_p$: its two solutions for $2\theta_p$ differ by $180^\circ$, so the two directions differ by $90^\circ$.`,
      tags: ["principal-direction", "eigenvalues"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Find the principal stresses: $\sigma_{1,2} = \sigma_m \pm R$ with $R = \sqrt{\sigma_d^2 + \sigma_{xy}^2}$.
- Find their direction: $\tan 2\theta_p = \sigma_{xy}/\sigma_d$. No shear acts on principal planes.
- Find the largest in-plane shear stress, $\tau_{\max} = R = (\sigma_1 - \sigma_2)/2$, on planes at $45^\circ$ to the principal ones, where the normal stress is $\sigma_m$.
- Recognise principal stresses as the eigenvalues of the stress matrix.

Next: a single picture that holds all of this, so you can stop remembering formulas.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 3 · Mohr's circle (Govindjee §9.2.4–9.2.5)                   */
/* ------------------------------------------------------------------ */

const l3 = lesson(
  {
    id: "sm9-l3-mohrs-circle",
    unitId: "sm9",
    title: "Mohr's circle",
    summary: "Plot normal stress against shear stress as the axes turn and you get a circle. Everything from the last two lessons can be read off it.",
    textbook: "Govindjee §9.2.4–9.2.5",
    minutes: 15,
  },
  [
    reading(
      "circle",
      r`Take the transformation equations and plot a point for every angle $\theta$: the normal stress $\sigma_{x'x'}$ across, the shear stress $\sigma_{x'y'}$ on the other axis. The points trace a **circle**.

$$\text{centre at } (\sigma_m,\ 0), \qquad \text{radius } R = \sqrt{\sigma_d^2 + \sigma_{xy}^2}.$$

This is **Mohr's circle**. It is the whole of the last two lessons in one picture.

**How to draw it** (the book's convention, used throughout this course):

1. Draw a horizontal axis for normal stress and a vertical axis for shear stress, with **positive shear pointing down**.
2. Plot the point $X = (\sigma_{xx},\ \sigma_{xy})$ for the $x$ face, and $Y = (\sigma_{yy},\ -\sigma_{xy})$ for the $y$ face.
3. $X$ and $Y$ are opposite ends of a diameter. The centre is where the line $XY$ crosses the horizontal axis.
4. The two points where the circle crosses the horizontal axis are the principal stresses, $\sigma_m \pm R$.
5. The lowest and highest points of the circle give the largest shear stress, $R$, with normal stress $\sigma_m$.

Change the stresses below and watch the circle move and resize.`,
      { title: "The picture behind the formulas", visual: stressCircle(90, 10, 30) },
    ),
    numeric("centre", {
      body: r`At a point, $\sigma_{xx} = 60\ \mathrm{MPa}$, $\sigma_{yy} = -20\ \mathrm{MPa}$ and $\sigma_{xy} = 30\ \mathrm{MPa}$.`,
      question: "Where on the normal-stress axis is the centre of Mohr's circle?",
      answer: 20, // check: σm = (60 − 20)/2 = 20 MPa
      tolerance: 0.2,
      suffix: "MPa",
      hint: "The centre sits at the average of the two normal stresses. Mind the sign of the compressive one.",
      explanation: r`$\sigma_m = (60 + (-20))/2 = 20\ \mathrm{MPa}$. The centre is always on the horizontal axis, because the average normal stress has no shear attached to it.`,
      tags: ["mohrs-circle"],
    }),
    numeric("radius", {
      question: "Same state. What is the radius of the circle?",
      answer: 50, // check: σd = (60 + 20)/2 = 40; R = √(40² + 30²) = 50 MPa
      tolerance: 0.5,
      prefix: r`$R =$`,
      suffix: "MPa",
      hint: r`The radius is the distance from the centre to the point $X$. Horizontally that is $\sigma_{xx} - \sigma_m$, vertically it is $\sigma_{xy}$.`,
      explanation: r`From the centre $(20, 0)$ to $X = (60, 30)$ is $40$ across and $30$ down, so $R = \sqrt{40^2 + 30^2} = 50\ \mathrm{MPa}$. The horizontal part, $40$, is $\sigma_d$.`,
      tags: ["mohrs-circle"],
    }),
    numeric("principal-from-circle", {
      question: r`Same state. Read off the smaller principal stress $\sigma_2$, with its sign.`,
      answer: -30, // check: σ2 = 20 − 50 = −30 MPa
      tolerance: 0.5,
      prefix: r`$\sigma_2 =$`,
      suffix: "MPa",
      hint: "The principal stresses are where the circle crosses the horizontal axis: one radius to the right of the centre, and one radius to the left.",
      explanation: r`$\sigma_2 = \sigma_m - R = 20 - 50 = -30\ \mathrm{MPa}$, a compression. The other crossing is $\sigma_1 = 20 + 50 = 70\ \mathrm{MPa}$. The circle straddles zero, so this point is pulled in one direction and squeezed in the other.`,
      tags: ["mohrs-circle", "principal-stress"],
    }),
    mc("where-is-x", {
      question: r`For this state, where is the point $X$ for the $x$ face plotted?`,
      choices: [
        ["below", r`At $60$ across and $30$ on the shear axis, which puts it **below** the horizontal axis`],
        ["above", r`At $60$ across and $30$ on the shear axis, which puts it **above** the horizontal axis`, "In this course's convention, which way does positive shear point on the plot?"],
        ["y-face", r`At $-20$ across and $30$ on the shear axis`, r`$-20\ \mathrm{MPa}$ is the normal stress on the $y$ face. Which face does $X$ describe?`],
        ["centre", "At the centre of the circle", "The centre is the average normal stress with no shear. X has a shear stress of 30 MPa."],
      ],
      correct: "below",
      hint: r`$X = (\sigma_{xx}, \sigma_{xy})$, and positive shear is plotted downward.`,
      explanation: r`$X = (60, 30)$. Because positive shear is plotted downward, $X$ lies below the axis. $Y = (-20, -30)$ lies above it, at the other end of the diameter. Other textbooks plot shear upward. Then rotations on the circle run the opposite way to rotations of the element, so pick one convention and stay with it.`,
      tags: ["mohrs-circle", "sign-convention"],
    }),
    mc("double-angle", {
      question: r`You turn the element's axes counter-clockwise by an angle $\theta$. How does the point for the $x'$ face move on Mohr's circle?`,
      choices: [
        ["two-theta", r`Counter-clockwise by $2\theta$`],
        ["theta", r`Counter-clockwise by $\theta$`, r`Look at the angle inside the sines and cosines of the transformation equations.`],
        ["half", r`Counter-clockwise by $\theta/2$`, r`The circle goes round faster than the element, not slower. Turning the element $180^\circ$ brings the stresses back to where they started.`],
        ["opposite", r`Clockwise by $2\theta$`, "That is what happens in the other convention, with shear plotted upward. With shear plotted downward, the senses agree."],
      ],
      correct: "two-theta",
      shuffle: true,
      hint: r`The transformation equations contain $2\theta$. And with shear plotted downward, the circle turns the same way as the element.`,
      explanation: r`The point moves by $2\theta$ in the same sense. So the angle on the circle from $X$ round to the $\sigma_1$ point is $2\theta_p$, and two faces that are $90^\circ$ apart on the element sit $180^\circ$ apart on the circle: opposite ends of a diameter, like $X$ and $Y$.`,
      tags: ["mohrs-circle"],
    }),
    numeric("angle-to-principal", {
      question: r`For the state $(60, -20, 30)\ \mathrm{MPa}$, the angle on the circle from $X$ round to the $\sigma_1$ point is $36.87^\circ$. Through what angle must the **element** be turned to reach the principal directions?`,
      answer: 18.43, // check: 36.87°/2 = 18.43°
      tolerance: 0.2,
      prefix: r`$\theta_p =$`,
      suffix: "°",
      hint: "Angles on the circle are twice the angles on the element.",
      explanation: r`$\theta_p = 36.87^\circ/2 = 18.4^\circ$, counter-clockwise. The angle on the circle came from the triangle with sides $40$ and $30$: $\tan 2\theta_p = 30/40$.`,
      tags: ["mohrs-circle", "principal-direction"],
    }),
    reading(
      "special-cases",
      r`Three circles are worth knowing on sight.

**Simple tension**, $\sigma_{xx} = \sigma_0$ alone. The circle runs from $0$ to $\sigma_0$. Its radius, the largest shear stress, is $\sigma_0/2$, on planes at $45^\circ$.

**Pure shear**, $\sigma_{xy} = \tau$ alone. This is the stress on the surface of a twisted shaft. The circle is centred on the origin with radius $\tau$, so the principal stresses are $+\tau$ and $-\tau$: a tension and an equal compression, on planes at $45^\circ$ to the shaft's axis.

**Equal pull in every direction**, $\sigma_{xx} = \sigma_{yy} = \sigma_0$ with no shear. The radius is zero. The circle shrinks to a point: the stress is the same in every direction and there is no shear on any plane.`,
      { title: "Three circles to recognise", visual: stressCircle(0, 0, 60) },
    ),
    numeric("torsion-tension", {
      question: r`The surface of a twisted shaft is in pure shear with $\tau = 60\ \mathrm{MPa}$. What is the largest **tensile** stress at that point?`,
      answer: 60, // check: circle centred at 0, radius 60 → σ1 = +60 MPa
      tolerance: 0.6,
      suffix: "MPa",
      hint: "Draw the circle for pure shear. Where is its centre, and where does it cross the normal-stress axis?",
      explanation: r`The circle is centred on the origin with radius $60\ \mathrm{MPa}$, so it crosses the axis at $+60$ and $-60\ \mathrm{MPa}$. A shaft that seems to carry only shear is being pulled with $60\ \mathrm{MPa}$ along one $45^\circ$ direction and squeezed with $60\ \mathrm{MPa}$ along the other.`,
      tags: ["mohrs-circle", "torsion"],
    }),
    mc("chalk", {
      question: "Twist a stick of chalk until it breaks and the break runs along a 45° spiral. Why?",
      choices: [
        ["tension", "Chalk is brittle: it breaks where the tensile stress is largest, and in torsion that is on planes at 45° to the axis"],
        ["shear", "Chalk breaks where the shear stress is largest, and that is at 45°", "In torsion the largest shear is on the planes across and along the stick, not at 45°. And is a brittle material weak in shear or in tension?"],
        ["flaw", "Chalk always contains flaws at 45°", "The spiral appears in every stick. Look for a reason in the stress, not in the chalk."],
        ["bending", "You accidentally bend the chalk as well", "Pure twisting alone produces the spiral break."],
      ],
      correct: "tension",
      shuffle: true,
      hint: "Brittle materials are weak in tension. On which planes is the tensile stress largest when the loading is pure shear?",
      explanation: "Pure shear is equivalent to tension and compression of the same size on planes at 45°. Chalk, like cast iron and concrete, is weak in tension, so it cracks perpendicular to the largest tension, and following that direction round the stick gives a 45° spiral. A ductile metal shaft fails differently, across the shaft, on the plane of largest shear.",
      tags: ["mohrs-circle", "torsion", "failure"],
    }),
    reading(
      "three-d",
      r`So far the circle has only looked at planes that stand perpendicular to the page. Real material is three-dimensional, and there is a **third principal stress** pointing out of the page.

For a thin plate or a free surface (plane stress), that third principal stress is **zero**. Mark all three principal values on the axis and draw a circle between each pair. There are three circles. The largest shear stress of all is the radius of the biggest one:

$$\tau_{\max}^{\text{abs}} = \frac{\sigma_{\max} - \sigma_{\min}}{2},$$

where $\sigma_{\max}$ and $\sigma_{\min}$ are the largest and smallest of the **three** principal stresses.

> **The trap.** If the two in-plane principal stresses have the same sign, the zero is the odd one out. The biggest circle then runs from $0$ to the larger in-plane value, and the largest shear stress is $\sigma_1/2$, not $(\sigma_1 - \sigma_2)/2$. It acts on planes tilted out of the page.`,
      { title: "The third direction" },
    ),
    numeric("abs-same-sign", {
      question: r`A thin plate has in-plane principal stresses of $100\ \mathrm{MPa}$ and $40\ \mathrm{MPa}$. What is the largest shear stress on **any** plane through the point?`,
      answer: 50, // check: principal values 100, 40, 0 → (100 − 0)/2 = 50 MPa
      tolerance: 0.5,
      suffix: "MPa",
      hint: "List all three principal stresses, including the one out of the plate. Then take the largest and the smallest of the three.",
      explanation: r`The three principal stresses are $100$, $40$ and $0\ \mathrm{MPa}$. The largest difference is between $100$ and $0$, so $\tau_{\max}^{\text{abs}} = 50\ \mathrm{MPa}$. Looking only in the plane would give $(100 - 40)/2 = 30\ \mathrm{MPa}$, which is too small.`,
      tags: ["mohrs-circle", "max-shear", "three-d"],
    }),
    numeric("abs-opposite-sign", {
      question: r`Another thin plate has in-plane principal stresses of $70\ \mathrm{MPa}$ and $-30\ \mathrm{MPa}$. What is the largest shear stress on any plane?`,
      answer: 50, // check: principal values 70, 0, −30 → (70 − (−30))/2 = 50 MPa
      tolerance: 0.5,
      suffix: "MPa",
      hint: "Again list all three principal stresses. Is the zero between the other two this time, or outside them?",
      explanation: r`The three values are $70$, $0$ and $-30\ \mathrm{MPa}$. Now zero lies between the other two, so the extremes are the in-plane ones: $(70 - (-30))/2 = 50\ \mathrm{MPa}$. When the in-plane principal stresses have opposite signs, the in-plane circle is already the biggest.`,
      tags: ["mohrs-circle", "max-shear", "three-d"],
    }),
    mc("vessel-shear", {
      body: r`The wall of a thin cylindrical pressure vessel has a hoop stress of $pR/t$, an axial stress of $pR/(2t)$, and almost no stress through the thickness.`,
      question: "What is the largest shear stress in the wall?",
      choices: [
        ["half-hoop", r`$\dfrac{pR}{2t}$`],
        ["quarter", r`$\dfrac{pR}{4t}$`, "That is half the difference between the hoop and axial stresses. Have you counted the third principal stress?"],
        ["hoop", r`$\dfrac{pR}{t}$`, "A shear stress is half the difference between two principal stresses."],
        ["zero", "Zero, because there is no shear stress on the wall element", "There is no shear in the hoop and axial axes. Other planes through the same point do carry shear."],
      ],
      correct: "half-hoop",
      shuffle: true,
      hint: "Hoop and axial stresses are both tensile. So which principal stress is the smallest of the three?",
      explanation: r`The principal stresses are $pR/t$, $pR/(2t)$ and about $0$. Both in-plane ones are positive, so the extremes are the hoop stress and zero: $\tau_{\max}^{\text{abs}} = \dfrac{pR/t - 0}{2} = \dfrac{pR}{2t}$. This is the standard example of the trap.`,
      tags: ["max-shear", "three-d", "pressure-vessel"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Draw Mohr's circle: centre $(\sigma_m, 0)$, radius $R$, through $X = (\sigma_{xx}, \sigma_{xy})$ with shear plotted downward.
- Read off $\sigma_1$, $\sigma_2$ (the axis crossings) and the largest in-plane shear (the radius).
- Use the double angle: $\theta$ on the element is $2\theta$ on the circle, in the same sense.
- Recognise simple tension, pure shear and equal pull.
- Find the true largest shear from all three principal stresses: $(\sigma_{\max} - \sigma_{\min})/2$.

Next: the same circle, for strain.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 4 · Strain transformation and strain gauges (Govindjee §9.3) */
/* ------------------------------------------------------------------ */

const l4 = lesson(
  {
    id: "sm9-l4-strain-transformation",
    unitId: "sm9",
    title: "Strain from other angles",
    summary: "Strain transforms exactly like stress, as long as you use half the engineering shear strain. Strain gauges put this to work.",
    textbook: "Govindjee §9.3",
    minutes: 15,
  },
  [
    reading(
      "same-rules",
      r`Stress is hard to measure directly. **Strain** is easy: glue a gauge to the surface and read it. So engineers measure strains, turn them to the directions they care about, and convert to stress.

Strain follows the same transformation rules as stress, with one catch that causes more lost marks than anything else in the unit:

> In every formula of this unit, the shear entry is the **tensor shear strain** $\varepsilon_{xy} = \dfrac{\gamma_{xy}}{2}$, **half** the engineering shear strain $\gamma_{xy}$.

With $\varepsilon_m = \dfrac{\varepsilon_{xx} + \varepsilon_{yy}}{2}$ and $\varepsilon_d = \dfrac{\varepsilon_{xx} - \varepsilon_{yy}}{2}$:

$$\varepsilon_{x'x'} = \varepsilon_m + \varepsilon_d\cos 2\theta + \frac{\gamma_{xy}}{2}\sin 2\theta$$

$$\varepsilon_{1,2} = \varepsilon_m \pm R, \qquad R = \sqrt{\varepsilon_d^2 + \Big(\frac{\gamma_{xy}}{2}\Big)^2}, \qquad \tan 2\theta_p = \frac{\gamma_{xy}}{\varepsilon_{xx} - \varepsilon_{yy}}$$

Mohr's circle works too: plot $\gamma/2$ downward against normal strain. Its radius is $\gamma_{\max}/2$, so the largest engineering shear strain is $\gamma_{\max} = 2R = \varepsilon_1 - \varepsilon_2$.

Strains here are in micro-strain: $1\ \mu = 10^{-6}$.`,
      { title: "The same rules, with one catch", visual: { kind: "mohr-circle", config: { sxx: 500, syy: 100, sxy: 150, sliders: true, max: 600, unit: "μ", quantity: "strain" } } },
    ),
    numeric("eps-1", {
      body: r`At a point, $\varepsilon_{xx} = 500\ \mu$, $\varepsilon_{yy} = 100\ \mu$ and $\gamma_{xy} = 300\ \mu$.`,
      question: r`What is the larger principal strain $\varepsilon_1$?`,
      answer: 550, // check: εm = 300, εd = 200, γ/2 = 150, R = 250 → ε1 = 550 μ
      tolerance: 5,
      prefix: r`$\varepsilon_1 =$`,
      suffix: "μ",
      hint: r`Compute $\varepsilon_m$ and $\varepsilon_d$. Then halve $\gamma_{xy}$ before it goes into the radius.`,
      explanation: r`$\varepsilon_m = 300$, $\varepsilon_d = 200$ and $\gamma_{xy}/2 = 150\ \mu$. $R = \sqrt{200^2 + 150^2} = 250\ \mu$, so $\varepsilon_1 = 550\ \mu$. Using $300$ instead of $150$ in the radius would give $661\ \mu$, the classic factor-of-two error.`,
      tags: ["principal-strain"],
    }),
    numeric("eps-2", {
      question: r`Same strains. What is the smaller principal strain $\varepsilon_2$?`,
      answer: 50, // check: 300 − 250 = 50 μ
      tolerance: 1,
      prefix: r`$\varepsilon_2 =$`,
      suffix: "μ",
      hint: r`$\varepsilon_2 = \varepsilon_m - R$, with the radius you just found.`,
      explanation: r`$\varepsilon_2 = 300 - 250 = 50\ \mu$. Check with the invariant: $550 + 50 = 500 + 100$.`,
      tags: ["principal-strain"],
    }),
    numeric("gamma-max", {
      question: r`Same strains. What is the largest engineering shear strain $\gamma_{\max}$ in the plane?`,
      answer: 500, // check: γmax = 2R = ε1 − ε2 = 500 μ
      tolerance: 5,
      prefix: r`$\gamma_{\max} =$`,
      suffix: "μ",
      hint: r`The circle's radius is $\gamma_{\max}/2$, not $\gamma_{\max}$.`,
      explanation: r`The radius is $\gamma_{\max}/2 = 250\ \mu$, so $\gamma_{\max} = 500\ \mu$. Equivalently $\gamma_{\max} = \varepsilon_1 - \varepsilon_2 = 550 - 50$. The factor of two shows up on the way out as well as on the way in.`,
      tags: ["principal-strain", "shear-strain"],
    }),
    mc("which-shear", {
      question: "Which shear quantity is plotted on the vertical axis of Mohr's circle of strain?",
      choices: [
        ["half", r`$\gamma_{xy}/2$, the tensor shear strain`],
        ["gamma", r`$\gamma_{xy}$, the engineering shear strain`, "That is the quantity used in Hooke's law. The transformation rules need the one that behaves like a tensor component."],
        ["double", r`$2\gamma_{xy}$`, "The factor goes the other way."],
        ["tau", r`$\sigma_{xy}$, the shear stress`, "That belongs on the circle for stress."],
      ],
      correct: "half",
      shuffle: true,
      hint: "Recall the catch from the reading: which shear strain goes into every transformation formula?",
      explanation: r`The circle plots the tensor shear strain $\varepsilon_{xy} = \gamma_{xy}/2$. Keep the two jobs apart: use $\gamma$ in Hooke's law ($\tau = G\gamma$), and $\gamma/2$ in transformations and on Mohr's circle.`,
      tags: ["shear-strain", "mohrs-circle"],
    }),
    reading(
      "gauges",
      r`A **strain gauge** is a fine metal grid glued to a surface. When the surface stretches along the grid, its electrical resistance changes. One gauge reads one number: the **normal strain along its own direction**. For a gauge at an angle $\theta$ from the $x$ axis,

$$\varepsilon(\theta) = \varepsilon_{xx}\cos^2\theta + \varepsilon_{yy}\sin^2\theta + \gamma_{xy}\sin\theta\cos\theta.$$

(This is the transformation equation again, written with single angles.)

A gauge cannot feel shear directly. But the state of strain in the surface has **three** unknowns, $\varepsilon_{xx}$, $\varepsilon_{yy}$ and $\gamma_{xy}$, so three gauges at three different angles give three equations. Such a cluster is a **rosette**.

The most common has gauges at $0^\circ$, $45^\circ$ and $90^\circ$. Putting those angles into the formula:

$$\varepsilon_{xx} = \varepsilon_{0}, \qquad \varepsilon_{yy} = \varepsilon_{90}, \qquad \gamma_{xy} = 2\,\varepsilon_{45} - \varepsilon_{0} - \varepsilon_{90}.$$`,
      { title: "Strain gauges and rosettes" },
    ),
    numeric("rosette-gamma", {
      body: r`A $0^\circ$–$45^\circ$–$90^\circ$ rosette reads $\varepsilon_0 = 400\ \mu$, $\varepsilon_{45} = 350\ \mu$ and $\varepsilon_{90} = 100\ \mu$.`,
      question: r`What is the engineering shear strain $\gamma_{xy}$?`,
      answer: 200, // check: 2×350 − 400 − 100 = 200 μ
      tolerance: 2,
      prefix: r`$\gamma_{xy} =$`,
      suffix: "μ",
      hint: r`The $0^\circ$ and $90^\circ$ gauges give $\varepsilon_{xx}$ and $\varepsilon_{yy}$ directly. The $45^\circ$ gauge mixes all three: use the rosette formula.`,
      explanation: r`$\gamma_{xy} = 2\varepsilon_{45} - \varepsilon_0 - \varepsilon_{90} = 700 - 400 - 100 = 200\ \mu$. With no shear the $45^\circ$ gauge would read the average of the other two, $250\ \mu$. It reads $100\ \mu$ more, and the shear strain is twice that excess.`,
      tags: ["strain-gauge", "rosette"],
    }),
    numeric("rosette-principal", {
      question: r`For those readings ($\varepsilon_{xx} = 400\ \mu$, $\varepsilon_{yy} = 100\ \mu$, $\gamma_{xy} = 200\ \mu$), what is the larger principal strain?`,
      answer: 430.3, // check: εm = 250, εd = 150, γ/2 = 100, R = √(150² + 100²) = 180.28 → ε1 = 430.28 μ
      tolerance: 4.5,
      prefix: r`$\varepsilon_1 =$`,
      suffix: "μ",
      hint: r`Same recipe as before: $\varepsilon_m$, $\varepsilon_d$, then the radius with $\gamma_{xy}/2$.`,
      explanation: r`$\varepsilon_m = 250$, $\varepsilon_d = 150$, $\gamma_{xy}/2 = 100\ \mu$. $R = \sqrt{150^2 + 100^2} = 180.3\ \mu$, so $\varepsilon_1 = 250 + 180.3 = 430\ \mu$. That is larger than any of the three gauges read: none of them happened to point along the principal direction.`,
      tags: ["strain-gauge", "principal-strain"],
    }),
    mc("why-three", {
      question: "Why does a rosette need three gauges, and not two?",
      choices: [
        ["three-unknowns", "The strain in a surface has three independent components, and each gauge supplies one equation"],
        ["average", "The third gauge is a spare, used to average out errors", "All three readings are needed. Count the unknown strain components in a plane."],
        ["temperature", "The third gauge measures temperature", "Each gauge measures normal strain along its own direction."],
        ["shear", "One of the three gauges measures shear directly", "No gauge can feel shear directly. The shear strain is worked out from the three normal readings."],
      ],
      correct: "three-unknowns",
      shuffle: true,
      hint: "Count the unknown strain components in a plane, and the number of readings one gauge gives.",
      explanation: r`A plane state of strain has three unknowns: $\varepsilon_{xx}$, $\varepsilon_{yy}$ and $\gamma_{xy}$. Each gauge gives one equation, so three gauges at three different angles are needed. Two gauges would leave one unknown undetermined.`,
      tags: ["strain-gauge", "rosette"],
    }),
    reading(
      "to-stress",
      r`Strains are a means to an end. What you usually want is stress.

A gauge sits on a **free surface**, with nothing pressing on it, so the stress normal to the surface is zero. That is **plane stress**, and Hooke's law for plane stress, solved for the stresses, reads

$$\sigma_{xx} = \frac{E}{1 - \nu^2}\big(\varepsilon_{xx} + \nu\,\varepsilon_{yy}\big), \qquad \sigma_{yy} = \frac{E}{1 - \nu^2}\big(\varepsilon_{yy} + \nu\,\varepsilon_{xx}\big), \qquad \sigma_{xy} = G\,\gamma_{xy}.$$

Each normal stress depends on **both** normal strains. That is the Poisson effect: a stretch in $y$ would shrink the material in $x$ unless a stress in $x$ prevented it.

For an ordinary (isotropic) elastic material, the principal directions of stress and of strain are the same.`,
      { title: "From measured strain to stress" },
    ),
    numeric("stress-from-strain", {
      question: r`A steel surface ($E = 200\ \mathrm{GPa}$, $\nu = 0.3$) has $\varepsilon_{xx} = 400\ \mu$ and $\varepsilon_{yy} = 100\ \mu$. What is $\sigma_{xx}$?`,
      answer: 94.5, // check: 200 000/(1 − 0.09) × (400 + 0.3×100)e-6 = 219 780 × 430e-6 = 94.51 MPa
      tolerance: 0.95,
      prefix: r`$\sigma_{xx} =$`,
      suffix: "MPa",
      hint: r`Use the plane-stress formula. Work with $E$ in MPa, and remember $1\ \mu = 10^{-6}$.`,
      explanation: r`$\sigma_{xx} = \dfrac{200\,000}{1 - 0.3^2}\,(400 + 0.3 \times 100) \times 10^{-6} = 219\,780 \times 430 \times 10^{-6} = 94.5\ \mathrm{MPa}$. Simply multiplying $E$ by $\varepsilon_{xx}$ would give $80\ \mathrm{MPa}$, which ignores the stretch in $y$.`,
      tags: ["hooke", "plane-stress", "strain-gauge"],
    }),
    reading(
      "g-relation",
      r`Mohr's circle also explains a formula you were handed earlier without proof: $G = \dfrac{E}{2(1 + \nu)}$.

Take a state of **pure shear** $\tau$. Describe it two ways.

**In the original axes:** the only strain is the shear strain $\gamma = \tau/G$. On Mohr's circle of strain the radius is $\gamma/2$, so the largest normal strain is

$$\varepsilon_1 = \frac{\gamma}{2} = \frac{\tau}{2G}.$$

**In the principal axes:** pure shear is a tension $\tau$ and a compression $-\tau$ at $45^\circ$. Hooke's law gives the strain along the tension direction:

$$\varepsilon_1 = \frac{1}{E}\big[\tau - \nu(-\tau)\big] = \frac{\tau\,(1 + \nu)}{E}.$$

Both describe the same stretch of the same fibre, so they must be equal:

$$\frac{\tau}{2G} = \frac{\tau(1 + \nu)}{E} \qquad\Longrightarrow\qquad G = \frac{E}{2(1 + \nu)}.$$

The three elastic constants are not independent. Know two, and the third follows.`,
      { title: "Why G, E and ν are linked" },
    ),
    numeric("shear-modulus", {
      question: r`An aluminium alloy has $E = 70\ \mathrm{GPa}$ and $\nu = 0.33$. What is its shear modulus $G$?`,
      answer: 26.32, // check: 70 / (2 × 1.33) = 26.32 GPa
      tolerance: 0.27,
      prefix: r`$G =$`,
      suffix: "GPa",
      hint: "Use the relation just derived between the three elastic constants.",
      explanation: r`$G = \dfrac{E}{2(1 + \nu)} = \dfrac{70}{2 \times 1.33} = 26.3\ \mathrm{GPa}$. For metals $G$ is always somewhat under $0.4E$.`,
      tags: ["hooke", "shear-modulus"],
    }),
    reading(
      "summary",
      r`**What you can do now**

- Transform strain like stress, using $\gamma_{xy}/2$ as the shear entry.
- Find principal strains and $\gamma_{\max} = 2R = \varepsilon_1 - \varepsilon_2$.
- Reduce a $0^\circ$–$45^\circ$–$90^\circ$ rosette: $\gamma_{xy} = 2\varepsilon_{45} - \varepsilon_0 - \varepsilon_{90}$.
- Convert surface strains to stresses with plane-stress Hooke's law.
- Explain why $G = E/(2(1 + \nu))$.

Next: you can now find the stress at a point in any direction. Will the material survive it?`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Lesson 5 · Yield criteria (Govindjee §9.4)                          */
/* ------------------------------------------------------------------ */

const l5 = lesson(
  {
    id: "sm9-l5-yield-criteria",
    unitId: "sm9",
    title: "When does it yield?",
    summary: "A tension test gives one number, the yield stress. Tresca and von Mises turn any combined state of stress into one number to compare with it.",
    textbook: "Govindjee §9.4",
    minutes: 15,
  },
  [
    reading(
      "why",
      r`A tension test pulls a bar until it **yields**: until it starts to deform permanently. That gives one number for the material, the yield stress $\sigma_Y$.

But the wall of a pressure tank is pulled in two directions at once. A drive shaft is twisted and bent together. How do you compare a combined state of stress with one number from a one-directional test?

Checking each component against $\sigma_Y$ cannot be right. The components change when you turn the axes, and the material cannot know which axes you chose. A valid test must give the **same verdict in every set of axes**.

Two facts about metals guide the answer.

- Metals yield by **shear**: layers of atoms slipping past each other.
- Squeezing a metal equally from all sides (pure pressure) does **not** make it yield, however hard you squeeze.

So a yield test for metals should depend on **differences** between the principal stresses, not on their overall level. Two such tests are in everyday use.`,
      { title: "One test, many loadings" },
    ),
    reading(
      "tresca",
      r`**The Tresca criterion (maximum shear stress).** The material yields when the largest shear stress at the point reaches the value it has at yield in a tension test.

In a tension test at yield the principal stresses are $\sigma_Y$, $0$, $0$, so the largest shear stress is $\sigma_Y/2$. In a general state the largest shear stress is $(\sigma_{\max} - \sigma_{\min})/2$. Setting them equal:

$$\text{yield when}\qquad \sigma_{\max} - \sigma_{\min} = \sigma_Y.$$

Here $\sigma_{\max}$ and $\sigma_{\min}$ are the largest and smallest of **all three** principal stresses. For a thin plate or a free surface, do not forget the zero.

The **safety factor** against yielding is how many times the loads could be scaled up before yield:

$$SF = \frac{\sigma_Y}{\sigma_{\max} - \sigma_{\min}}.$$`,
      { title: "Tresca: largest shear stress" },
    ),
    numeric("tresca-measure", {
      body: r`A point in a steel plate has principal stresses of $120\ \mathrm{MPa}$, $40\ \mathrm{MPa}$ and $0$. The steel yields at $\sigma_Y = 300\ \mathrm{MPa}$.`,
      question: r`What is $\sigma_{\max} - \sigma_{\min}$, the quantity Tresca compares with $\sigma_Y$?`,
      answer: 120, // check: 120 − 0 = 120 MPa
      tolerance: 1.2,
      suffix: "MPa",
      hint: "Pick the largest and the smallest of the three principal stresses. The smallest is not necessarily the one in the middle of the list.",
      explanation: r`The largest is $120$ and the smallest is $0$, so $\sigma_{\max} - \sigma_{\min} = 120\ \mathrm{MPa}$. Taking $120 - 40 = 80$ would forget the third principal stress.`,
      tags: ["tresca", "yield"],
    }),
    numeric("tresca-sf", {
      question: "What is the safety factor against yielding at that point, according to Tresca?",
      answer: 2.5, // check: 300/120 = 2.5
      tolerance: 0.03,
      prefix: r`$SF =$`,
      hint: "Divide the yield stress by the quantity you just found.",
      explanation: r`$SF = 300/120 = 2.5$. All the loads could be multiplied by $2.5$ before this point starts to yield.`,
      tags: ["tresca", "safety-factor"],
    }),
    numeric("tresca-mixed", {
      question: r`Another point has principal stresses of $80\ \mathrm{MPa}$, $-60\ \mathrm{MPa}$ and $0$. What is $\sigma_{\max} - \sigma_{\min}$ there?`,
      answer: 140, // check: 80 − (−60) = 140 MPa
      tolerance: 1.4,
      suffix: "MPa",
      hint: "A compressive stress is negative. Subtracting a negative number adds.",
      explanation: r`$80 - (-60) = 140\ \mathrm{MPa}$. No single stress here is as large as $120\ \mathrm{MPa}$, yet this point is closer to yield than the previous one. A pull in one direction and a squeeze in another work together to shear the material.`,
      tags: ["tresca", "yield"],
    }),
    reading(
      "von-mises",
      r`**The von Mises criterion (distortion energy).** Split the energy stored in the material into a part that changes its volume and a part that changes its **shape**. Yield happens when the shape-changing part reaches its value at yield in a tension test. The result is one number, the **von Mises stress**:

$$\sigma_{vM} = \sqrt{\tfrac12\Big[(\sigma_1 - \sigma_2)^2 + (\sigma_2 - \sigma_3)^2 + (\sigma_3 - \sigma_1)^2\Big]}, \qquad \text{yield when } \sigma_{vM} = \sigma_Y.$$

For plane stress ($\sigma_3 = 0$) it simplifies:

$$\sigma_{vM} = \sqrt{\sigma_1^2 - \sigma_1\sigma_2 + \sigma_2^2} = \sqrt{\sigma_{xx}^2 - \sigma_{xx}\sigma_{yy} + \sigma_{yy}^2 + 3\,\sigma_{xy}^2}.$$

The last form is the practical one: it takes the components in **any** axes, so you never need the principal stresses. The safety factor is $SF = \sigma_Y/\sigma_{vM}$.

Like Tresca, it uses only differences of stresses, so adding pressure changes nothing.`,
      { title: "Von Mises: energy of distortion" },
    ),
    numeric("vm-stress", {
      question: r`For the first point (principal stresses $120$, $40$ and $0\ \mathrm{MPa}$), what is the von Mises stress?`,
      answer: 105.83, // check: √(120² − 120×40 + 40²) = √11 200 = 105.83 MPa
      tolerance: 1.1,
      prefix: r`$\sigma_{vM} =$`,
      suffix: "MPa",
      hint: r`Use the plane-stress form with $\sigma_1 = 120$ and $\sigma_2 = 40$.`,
      explanation: r`$\sigma_{vM} = \sqrt{120^2 - 120 \times 40 + 40^2} = \sqrt{11\,200} = 105.8\ \mathrm{MPa}$. Tresca's measure for the same point was $120\ \mathrm{MPa}$, so von Mises judges it to be further from yield.`,
      tags: ["von-mises", "yield"],
    }),
    numeric("vm-sf", {
      question: r`With $\sigma_Y = 300\ \mathrm{MPa}$, what safety factor does von Mises give for that point?`,
      answer: 2.835, // check: 300/105.83 = 2.835
      tolerance: 0.03,
      prefix: r`$SF =$`,
      hint: "Yield stress divided by the von Mises stress.",
      explanation: r`$SF = 300/105.83 = 2.83$, against Tresca's $2.5$.`,
      tags: ["von-mises", "safety-factor"],
    }),
    mc("which-conservative", {
      question: "The two criteria gave safety factors of 2.5 (Tresca) and 2.83 (von Mises) for the same point. Which statement is right in general?",
      choices: [
        ["tresca", "Tresca never gives the larger safety factor: it is the more cautious of the two"],
        ["mises", "Von Mises never gives the larger safety factor", "Compare the two results you just computed."],
        ["either", "Either can be larger, depending on the state of stress", "Plotted for plane stress, one criterion's boundary lies entirely inside the other's. They touch but never cross."],
        ["equal", "They always agree; the difference above was rounding", "They agree for simple tension, which is how both were calibrated. For most other states they differ."],
      ],
      correct: "tresca",
      shuffle: true,
      hint: "In a plot of one principal stress against the other, the von Mises boundary is an ellipse and the Tresca boundary is a hexagon drawn inside it, touching at the corners.",
      explanation: "The Tresca hexagon lies inside the von Mises ellipse, touching it at six points. So Tresca always predicts yield at the same load or earlier, and never gives the larger safety factor. Experiments on ductile metals fall closer to von Mises. Tresca is simpler and errs on the safe side.",
      tags: ["tresca", "von-mises"],
    }),
    numeric("pure-shear-yield", {
      question: r`A shaft surface is in pure shear $\tau$. With $\sigma_Y = 300\ \mathrm{MPa}$, at what shear stress does von Mises predict yield?`,
      answer: 173.2, // check: σvM = √3 τ = σY → τ = 300/√3 = 173.2 MPa
      tolerance: 1.8,
      prefix: r`$\tau =$`,
      suffix: "MPa",
      hint: r`Put $\sigma_{xx} = \sigma_{yy} = 0$ and $\sigma_{xy} = \tau$ into the component form of the von Mises stress, then set it equal to $\sigma_Y$.`,
      explanation: r`With only $\sigma_{xy} = \tau$, $\sigma_{vM} = \sqrt{3\tau^2} = \sqrt3\,\tau$. Yield when $\sqrt3\,\tau = 300$, so $\tau = 173\ \mathrm{MPa}$, which is $0.577\,\sigma_Y$. Tresca would say $\tau = \sigma_Y/2 = 150\ \mathrm{MPa}$.`,
      tags: ["von-mises", "torsion", "yield"],
    }),
    reading(
      "sigma-tau",
      r`One combination comes up constantly: a single normal stress $\sigma$ together with a single shear stress $\tau$. A shaft that is bent and twisted has it. So does a point in a beam carrying both bending moment and shear force.

Putting $\sigma_{xx} = \sigma$, $\sigma_{yy} = 0$, $\sigma_{xy} = \tau$ into each criterion gives

$$\text{von Mises:}\quad \sqrt{\sigma^2 + 3\tau^2} \le \sigma_Y \qquad\qquad \text{Tresca:}\quad \sqrt{\sigma^2 + 4\tau^2} \le \sigma_Y.$$

The two differ only in how heavily they weight the shear stress: by $3$ or by $4$.`,
      { title: "A normal stress with a shear stress" },
    ),
    numeric("shaft-vm", {
      question: r`A point on a shaft has a bending stress $\sigma = 90\ \mathrm{MPa}$ and a torsional shear stress $\tau = 40\ \mathrm{MPa}$. What is the von Mises stress?`,
      answer: 113.58, // check: √(90² + 3×40²) = √12 900 = 113.58 MPa
      tolerance: 1.2,
      prefix: r`$\sigma_{vM} =$`,
      suffix: "MPa",
      hint: "Use the form for one normal stress with one shear stress. The shear stress is squared, then multiplied by 3.",
      explanation: r`$\sigma_{vM} = \sqrt{90^2 + 3 \times 40^2} = \sqrt{8100 + 4800} = \sqrt{12\,900} = 113.6\ \mathrm{MPa}$.`,
      tags: ["von-mises", "combined-loading"],
    }),
    numeric("shaft-tresca", {
      question: "For the same point, what does the Tresca measure give?",
      answer: 120.42, // check: √(90² + 4×40²) = √14 500 = 120.42 MPa
      tolerance: 1.2,
      suffix: "MPa",
      hint: "Same form, but Tresca weights the squared shear stress by 4.",
      explanation: r`$\sqrt{90^2 + 4 \times 40^2} = \sqrt{8100 + 6400} = \sqrt{14\,500} = 120.4\ \mathrm{MPa}$. Larger than the von Mises value, as always, so Tresca's safety factor is the smaller.`,
      tags: ["tresca", "combined-loading"],
    }),
    numeric("vessel-yield", {
      body: r`A thin cylindrical tank has radius $R = 500\ \mathrm{mm}$ and wall thickness $t = 10\ \mathrm{mm}$. Its wall stresses are a hoop stress $pR/t$ and an axial stress $pR/(2t)$. The steel yields at $\sigma_Y = 250\ \mathrm{MPa}$.`,
      question: r`At what internal pressure $p$ does von Mises predict the wall yields?`,
      answer: 5.774, // check: σvM = (pR/t)√(1 − ½ + ¼) = (√3/2)(pR/t) = σY → p = (2/√3)(t/R)σY = 1.1547 × 0.02 × 250 = 5.774 MPa
      tolerance: 0.06,
      prefix: r`$p =$`,
      suffix: "MPa",
      hint: r`Write the axial stress as half the hoop stress and put both into $\sqrt{\sigma_1^2 - \sigma_1\sigma_2 + \sigma_2^2}$. Then set the result equal to $\sigma_Y$ and solve for $p$.`,
      explanation: r`Let $s = pR/t$. Then $\sigma_{vM} = \sqrt{s^2 - s \cdot \tfrac{s}{2} + \tfrac{s^2}{4}} = \tfrac{\sqrt3}{2}\,s$. Yield when $\tfrac{\sqrt3}{2}\,\dfrac{pR}{t} = \sigma_Y$, so $p = \dfrac{2}{\sqrt3}\,\dfrac{t}{R}\,\sigma_Y = 1.155 \times 0.02 \times 250 = 5.77\ \mathrm{MPa}$. Tresca gives $p = (t/R)\sigma_Y = 5.0\ \mathrm{MPa}$.`,
      tags: ["von-mises", "pressure-vessel", "yield"],
    }),
    tf("pressure-independent", {
      statement: "Adding the same amount to all three principal stresses changes neither the Tresca nor the von Mises prediction.",
      answer: true,
      feedback: "Both criteria are built from differences between principal stresses. What happens to a difference when the same number is added to both terms?",
      hint: "Look at how the principal stresses enter each criterion: singly, or in pairs subtracted from one another?",
      explanation: "True. Both criteria contain only differences between principal stresses, and adding the same amount to each leaves every difference unchanged. This matches experiments: pressure alone does not make a metal yield. It also warns you that these criteria are for ductile metals. Brittle materials such as concrete and cast iron do care about the overall level of stress and need other rules.",
      tags: ["tresca", "von-mises"],
    }),
    reading(
      "summary",
      r`**The unit in one place**

Turning the axes by $\theta$ (counter-clockwise):
$$\sigma_{x'x'} = \sigma_m + \sigma_d\cos 2\theta + \sigma_{xy}\sin 2\theta, \qquad \sigma_{x'y'} = -\sigma_d\sin 2\theta + \sigma_{xy}\cos 2\theta$$

Principal stresses and largest in-plane shear:
$$\sigma_{1,2} = \sigma_m \pm R, \qquad \tau_{\max} = R = \sqrt{\sigma_d^2 + \sigma_{xy}^2}, \qquad \tan 2\theta_p = \frac{\sigma_{xy}}{\sigma_d}$$

Mohr's circle: centre $(\sigma_m, 0)$, radius $R$, shear plotted downward, angles doubled. Largest shear of all: $(\sigma_{\max} - \sigma_{\min})/2$ over three principal stresses.

Strain: the same, with $\gamma_{xy}/2$. Rosette: $\gamma_{xy} = 2\varepsilon_{45} - \varepsilon_0 - \varepsilon_{90}$.

Yield of ductile metals:
$$\text{Tresca: } \sigma_{\max} - \sigma_{\min} = \sigma_Y \qquad\qquad \text{von Mises: } \sqrt{\sigma_{xx}^2 - \sigma_{xx}\sigma_{yy} + \sigma_{yy}^2 + 3\sigma_{xy}^2} = \sigma_Y$$

Next unit: a way to fail that has nothing to do with yield.`,
      { title: "Summary" },
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Level check                                                         */
/* ------------------------------------------------------------------ */

const practice: QuestionStep[] = [
  numeric("p-transform", {
    body: r`At a point, $\sigma_{xx} = 40\ \mathrm{MPa}$, $\sigma_{yy} = -20\ \mathrm{MPa}$ and $\sigma_{xy} = 25\ \mathrm{MPa}$.`,
    question: r`What is $\sigma_{x'x'}$ in axes turned counter-clockwise by $45^\circ$?`,
    answer: 35, // check: σm = 10, σd = 30; 10 + 30cos90° + 25sin90° = 35 MPa
    tolerance: 0.35,
    prefix: r`$\sigma_{x'x'} =$`,
    suffix: "MPa",
    hint: r`With $\theta = 45^\circ$ the double angle is $90^\circ$, which makes the cosine and sine very simple.`,
    explanation: r`$\sigma_m = 10$ and $\sigma_d = 30\ \mathrm{MPa}$. $\sigma_{x'x'} = 10 + 30\cos 90^\circ + 25\sin 90^\circ = 10 + 0 + 25 = 35\ \mathrm{MPa}$.`,
    tags: ["transformation"],
  }),
  numeric("p-principal", {
    question: r`A state of stress has $\sigma_{xx} = 30$, $\sigma_{yy} = -50$ and $\sigma_{xy} = 30\ \mathrm{MPa}$. What is the larger principal stress?`,
    answer: 40, // check: σm = −10, σd = 40, R = 50 → σ1 = 40 MPa
    tolerance: 0.5,
    prefix: r`$\sigma_1 =$`,
    suffix: "MPa",
    hint: r`$\sigma_1 = \sigma_m + R$. Mind the sign of the compressive stress when you form the average and the half-difference.`,
    explanation: r`$\sigma_m = (30 - 50)/2 = -10$, $\sigma_d = (30 + 50)/2 = 40$, $R = \sqrt{40^2 + 30^2} = 50\ \mathrm{MPa}$. $\sigma_1 = -10 + 50 = 40\ \mathrm{MPa}$.`,
    tags: ["principal-stress"],
  }),
  numeric("p-theta-p", {
    question: r`For $\sigma_{xx} = 100$, $\sigma_{yy} = 0$ and $\sigma_{xy} = 50\ \mathrm{MPa}$, at what angle counter-clockwise from $x$ does $\sigma_1$ act? Answer in degrees.`,
    answer: 22.5, // check: tan2θp = 50/50 = 1 → 2θp = 45°, θp = 22.5°
    tolerance: 0.25,
    prefix: r`$\theta_p =$`,
    suffix: "°",
    hint: r`$\tan 2\theta_p = \sigma_{xy}/\sigma_d$. Remember to halve the angle you get.`,
    explanation: r`$\sigma_d = 50$, so $\tan 2\theta_p = 50/50 = 1$, $2\theta_p = 45^\circ$ and $\theta_p = 22.5^\circ$.`,
    tags: ["principal-direction"],
  }),
  numeric("p-in-plane-shear", {
    question: r`For $\sigma_{xx} = -30$, $\sigma_{yy} = -90$ and $\sigma_{xy} = 40\ \mathrm{MPa}$, what is the largest shear stress on planes perpendicular to the page?`,
    answer: 50, // check: σd = 30, R = √(30² + 40²) = 50 MPa
    tolerance: 0.5,
    suffix: "MPa",
    hint: "The largest in-plane shear is the radius of Mohr's circle.",
    explanation: r`$\sigma_d = (-30 + 90)/2 = 30$ and $R = \sqrt{30^2 + 40^2} = 50\ \mathrm{MPa}$.`,
    tags: ["max-shear"],
  }),
  numeric("p-abs-shear", {
    question: r`A thin plate has in-plane principal stresses of $80\ \mathrm{MPa}$ and $20\ \mathrm{MPa}$. What is the largest shear stress on any plane through the point?`,
    answer: 40, // check: principal 80, 20, 0 → (80 − 0)/2 = 40 MPa
    tolerance: 0.4,
    suffix: "MPa",
    hint: "Include the third principal stress, out of the plate, before choosing the largest and smallest.",
    explanation: r`The three principal stresses are $80$, $20$ and $0\ \mathrm{MPa}$. $\tau_{\max}^{\text{abs}} = (80 - 0)/2 = 40\ \mathrm{MPa}$, not $(80 - 20)/2 = 30$.`,
    tags: ["max-shear", "three-d"],
  }),
  numeric("p-rosette", {
    question: r`A $0^\circ$–$45^\circ$–$90^\circ$ rosette reads $\varepsilon_0 = 600\ \mu$, $\varepsilon_{45} = 200\ \mu$ and $\varepsilon_{90} = -100\ \mu$. What is $\gamma_{xy}$, with its sign?`,
    answer: -100, // check: 2×200 − 600 − (−100) = −100 μ
    tolerance: 2,
    prefix: r`$\gamma_{xy} =$`,
    suffix: "μ",
    hint: r`$\gamma_{xy} = 2\varepsilon_{45} - \varepsilon_0 - \varepsilon_{90}$. Subtracting a negative reading adds.`,
    explanation: r`$\gamma_{xy} = 2(200) - 600 - (-100) = -100\ \mu$.`,
    tags: ["rosette"],
  }),
  numeric("p-principal-strain", {
    question: r`For $\varepsilon_{xx} = 300\ \mu$, $\varepsilon_{yy} = -100\ \mu$ and $\gamma_{xy} = 300\ \mu$, what is the larger principal strain?`,
    answer: 350, // check: εm = 100, εd = 200, γ/2 = 150, R = 250 → ε1 = 350 μ
    tolerance: 3.5,
    prefix: r`$\varepsilon_1 =$`,
    suffix: "μ",
    hint: r`Halve $\gamma_{xy}$ before it goes into the radius.`,
    explanation: r`$\varepsilon_m = 100$, $\varepsilon_d = 200$, $\gamma_{xy}/2 = 150\ \mu$. $R = \sqrt{200^2 + 150^2} = 250\ \mu$, so $\varepsilon_1 = 350\ \mu$.`,
    tags: ["principal-strain"],
  }),
  numeric("p-von-mises", {
    question: r`A point has $\sigma_{xx} = 100$, $\sigma_{yy} = 60$ and $\sigma_{xy} = 30\ \mathrm{MPa}$ (plane stress). What is the von Mises stress?`,
    answer: 101.49, // check: √(100² − 100×60 + 60² + 3×30²) = √(10 000 − 6000 + 3600 + 2700) = √10 300 = 101.49 MPa
    tolerance: 1.05,
    prefix: r`$\sigma_{vM} =$`,
    suffix: "MPa",
    hint: "Use the component form for plane stress. It does not need the principal stresses.",
    explanation: r`$\sigma_{vM} = \sqrt{100^2 - 100 \times 60 + 60^2 + 3 \times 30^2} = \sqrt{10\,300} = 101.5\ \mathrm{MPa}$.`,
    tags: ["von-mises"],
  }),
  numeric("p-tresca-sf", {
    question: r`A point has principal stresses of $150\ \mathrm{MPa}$, $-50\ \mathrm{MPa}$ and $0$. The material yields at $\sigma_Y = 400\ \mathrm{MPa}$. What is the safety factor according to Tresca?`,
    answer: 2, // check: 400/(150 − (−50)) = 2.0
    tolerance: 0.02,
    prefix: r`$SF =$`,
    hint: "Tresca compares the yield stress with the difference between the largest and smallest principal stresses.",
    explanation: r`$\sigma_{\max} - \sigma_{\min} = 150 - (-50) = 200\ \mathrm{MPa}$, so $SF = 400/200 = 2.0$.`,
    tags: ["tresca", "safety-factor"],
  }),
  mc("p-circle-point", {
    question: "A state of stress has equal normal stresses in x and y and no shear stress. What does its Mohr's circle look like?",
    choices: [
      ["point", "A single point"],
      ["origin", "A circle centred on the origin", "The centre is at the average normal stress, which is not zero here."],
      ["big", "A circle whose radius equals the normal stress", "Work out the half-difference of the two normal stresses, and the shear stress. What radius do they give?"],
      ["line", "A vertical line", "Mohr's circle is always a circle, though its radius can shrink."],
    ],
    correct: "point",
    shuffle: true,
    hint: "The radius is built from half the difference of the normal stresses and the shear stress.",
    explanation: r`$\sigma_d = 0$ and $\sigma_{xy} = 0$, so $R = 0$: the circle is a point at $\sigma_m$. The stress is the same in every direction and no plane carries shear.`,
    tags: ["mohrs-circle"],
  }),
  multi("p-true", {
    question: "Which statements are true?",
    choices: [
      ["no-shear", "No shear stress acts on a principal plane."],
      ["sum", "The sum of the two normal stresses is the same in every set of axes."],
      ["double", "Turning the element by 30° moves the point on Mohr's circle by 60°."],
      ["gamma", r`The full engineering shear strain $\gamma_{xy}$ is the shear entry in the strain transformation.`],
      ["mises", "Von Mises always predicts yield before Tresca does."],
    ],
    correct: ["no-shear", "sum", "double"],
    hint: "Check each against a definition or a formula from the unit: principal planes, invariants, the double angle, the strain catch, and which criterion is the cautious one.",
    explanation: r`Principal planes carry no shear, the sum of normal stresses is an invariant, and angles double on the circle. The strain transformation uses $\gamma_{xy}/2$, not $\gamma_{xy}$. Tresca, not von Mises, is the one that never predicts yield later.`,
    tags: ["principal-stress", "invariants", "mohrs-circle"],
  }),
  order("p-circle-steps", {
    question: "Put the steps for drawing Mohr's circle in order.",
    items: [
      ["axes", "Draw the axes: normal stress across, shear stress positive downward"],
      ["points", "Plot X for the x face and Y for the y face"],
      ["centre", "Join X and Y; the centre is where the line crosses the horizontal axis"],
      ["circle", "Draw the circle through X and Y"],
      ["read", "Read the principal stresses where the circle crosses the horizontal axis"],
    ],
    hint: "You need the two points before you can find the centre, and the centre before you can draw the circle.",
    explanation: "Axes, then the two face points, then the centre from the diameter joining them, then the circle, and only then the principal stresses and the largest shear.",
    tags: ["mohrs-circle"],
  }),
];

export const sm9: Unit = {
  id: "sm9",
  title: "Stress and strain from other angles",
  subtitle: "Transformation, principal stresses, Mohr's circle, strain gauges and yield",
  description: "The same state of stress looks different from different axes. Find the directions where it is simplest, read everything off Mohr's circle, turn gauge readings into stresses, and decide whether a metal will yield.",
  textbook: "Govindjee §9.1–9.4",
  lessons: [l1, l2, l3, l4, l5],
  practice,
  generators: ["gen.sm.stress-transform", "gen.sm.principal-stress", "gen.sm.abs-max-shear", "gen.sm.rosette", "gen.sm.von-mises", "gen.sm.tresca-sf"],
};
