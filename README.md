# Nudge — learn by doing

Brilliant-style interactive courses for two UC Berkeley classes — the linear algebra half of **Math 54** (Lay, *Linear Algebra and Its Applications*, chapters 1–7 in the order the course covers them) and **CE C30 / ME C85, Introduction to Solid Mechanics** (Govindjee, *Engineering Mechanics of Deformable Solids*, chapters 1–9 and 12, written so that someone with no background can start from the first lesson) — with an AI tutor that **only gives hints**: it can see the exact step you are on and what you have tried, it walks through the method with you, and it never hands you the answer.

Built after a close study of how Brilliant teaches (single-focus step player, two-try feedback with a targeted hint then the answer, worked reasoning after every problem, level checks, streaks, XP, spaced review) and of the principles in Trefor Bazett's *The Learning Crisis in Academia*: stay active, use the tutor for nudges not answers, keep the productive friction, self-assess by **recollection**, and read every AI answer critically.

## Running it

```bash
npm install
cp .env.example .env.local   # paste your Anthropic key (see below) — optional
npm run dev                  # http://localhost:3000
```

Progress is saved automatically in your browser **and** to `data/progress.json` on disk (debounced, plus a beacon when you close the tab), so quitting mid-lesson is fine — you resume at the same step.

### AI tutor key (`.env.local`)

The tutor runs on **Claude** through the Anthropic API (the AI SDK's `@ai-sdk/anthropic` provider). Create a key in the [Claude Developer Platform console](https://platform.claude.com) and put it in `.env.local` (gitignored — never commit it):

| Variable | Required | Meaning |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | yes, for the tutor | your Anthropic API key |
| `AI_MODEL` | no | Claude model id, default `claude-opus-5-5`; `claude-sonnet-5-5` is faster and cheaper, `claude-haiku-5-5` the lightest |
| `AI_EFFORT` | no | `low` / `medium` (default) / `high` / `xhigh` / `max` — how hard the model thinks before each nudge |

Current Claude models think adaptively on every reply; `AI_EFFORT` is the only depth control. If a safety classifier declines a turn, the request falls back server-side to another Claude model rather than returning nothing.

Without a key everything still works — the hand-written hints after a miss don't need AI.

### Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc
npm run lint       # eslint (React compiler rules on)
npm run test       # vitest: answer checker, exact linear algebra, streak/XP/review logic, content validation, generators, visuals, the tutor's answer guard
npm run check      # all three
```

## How a lesson works

1. **No chrome.** A progress meter, one step at a time, and one primary button fixed at the bottom: *Check → feedback → Continue*. Answer boxes start empty, with no sample text in them.
2. **Concept first, then do.** Short reading steps with a manipulable visual (drag vectors, slide matrix entries, perform row operations yourself; load a bar, turn a cut through a stress element, twist a shaft), then problems that use the idea.
3. **Two tries.** A miss shows a *targeted hint* written for that step (or for the specific wrong option you picked) and lets you try once more. A second miss reveals the answer with the worked reasoning, and you move on — you can never get stuck.
4. **Correct answers also get the reasoning**, because the point is *why*.
5. **Ask the tutor.** The tutor panel escalates in three levels: a guiding question → a specific diagnosis of your attempt → the method as steps, worked through with you one step at a time, never the last. It will not state the answer, confirm a guess, do the final arithmetic or narrow down the options, whatever reason it is given. A server-side check backs the instructions up: while a step is unresolved the reply is released a sentence at a time, and a sentence that states the answer is replaced by a redirect (`src/lib/ai/guard.ts`). After a step resolves it switches to *debrief* mode and asks you to explain it back. Its instructions are course-aware: the same rules and nudge levels everywhere, but in linear algebra it speaks Lay's vocabulary, and in solid mechanics it uses Govindjee's notation and sign conventions, walks you through kinematics → equilibrium → constitutive law in that order, and makes you check units.
6. **Finish screen**: first-try %, XP, streak, and a next action.

## The courses

### Linear algebra (Math 54)

Nine units mapped to the Fall 2026 Math 54 homework sections:

| Unit | Lay | Topics |
| --- | --- | --- |
| 1 Linear systems | §1.1–1.2 | systems, row operations, echelon forms, pivots, free variables, parameters |
| 2 Vectors and *A***x** = **b** | §1.3–1.5, 1.7 | linear combinations, span, matrix equation, solution sets, independence |
| 3 Linear transformations | §1.8–1.9 | matrices as maps, standard matrix, one-to-one / onto |
| 4 Matrix algebra | §2.1–2.3 | products, inverses, the Invertible Matrix Theorem |
| 5 Determinants | §3.1–3.3 | cofactors, row operations, det(AB), Cramer, area/volume |
| 6 Vector spaces | §4.1–4.6 | subspaces, Nul/Col/Row, bases, coordinates, dimension & rank, change of basis |
| 7 Eigenvalues | §5.1–5.5 | eigenvectors, characteristic equation, diagonalization, complex eigenvalues |
| 8 Orthogonality | §6.1–6.5, 6.7 | dot product, orthogonal sets, projections, Gram–Schmidt, least squares, inner product spaces |
| 9 Symmetric matrices & SVD | §7.1, 7.4 | spectral theorem, singular values |

### Solid Mechanics (CE C30 / ME C85)

Eleven units following Govindjee's *Engineering Mechanics of Deformable Solids* in lecture order. The first one assumes nothing, so the course can be started cold:

| Unit | Govindjee | Topics |
| --- | --- | --- |
| 1 Foundations | ch. 1 | forces and units, moments and resultants, equilibrium and free-body diagrams, internal forces by section cuts, work and energy |
| 2 Axial bars | ch. 2 | displacement and strain, stress and equilibrium, Hooke's law, axial response, statically indeterminate bars, the bar equation (AEu′)′ + b = 0, energy and design |
| 3 Stress | ch. 3 | average stress and design, stress at a point, Cauchy's law and resultants, equilibrium in stresses, polar and spherical components |
| 4 Strain | ch. 4 | normal and shear strain, the strain tensor, polar strains |
| 5 Generalized Hooke's law | ch. 5 | Poisson's ratio and 3-D Hooke's law, pressure, volume change and energy, plane stress / plane strain |
| 6 Pressure vessels & Saint-Venant | ch. 6 | the axial rod in 3-D, thin-walled cylinders and spheres, Saint-Venant's principle |
| 7 Torsion | ch. 7 (§7.1–7.4, 7.7) | kinematics, torque diagrams, elastic response, indeterminate shafts, energy, thin-walled tubes |
| 8 Bending of beams | §8.1–8.3 | kinematics of bending, shear and moment diagrams, σ = −My/I, composite beams |
| 9 Beam deflection and shear | §8.4–8.6 | EI v″ = M and the beam equation, standard deflections, bending about two axes, τ = VQ/(Ib), shear flow and fasteners |
| 10 Stress and strain from other angles | §9.1–9.4 | transformation, principal stresses, Mohr's circle, strain rosettes, Tresca and von Mises |
| 11 Stability and buckling | §12.1–12.3 | stability from potential energy, rigid links and the critical load, Euler columns, slenderness |

The lectures-to-sections mapping follows the Fall 2026 syllabus. (In the code the units are `sm0`–`sm10`: Foundations was added in front of the existing ones, whose ids could not change without losing saved progress.)

The course brings eleven interactive visuals of its own — an axial bar (with R(x), σ(x) and u(x) diagrams and load sliders), a 2-D stress element (with the Cauchy traction on a cut you can rotate), a strain grid, a torsion section, a beam cross-section, shear/moment diagrams, a thin-walled pressure vessel, Mohr's circle, a deflecting beam, a buckling column and a rigid link with its potential-energy curve — and its own parameterised problem generators for the Level Checks. Each visual keeps its drawing and sliders in view and puts the detailed read-outs behind *Show the numbers*.

### Both courses

Every unit ends with a **Level Check** (5 or 15 problems): no first-miss hint, shuffled, and roughly half the problems generated fresh from parameterised generators with checked answers (exact fractions in linear algebra) — so the surface details change while the idea stays.

Missed problems from either course come back on a **spaced schedule** on the Review page; weak spots can be drilled any time.

## Homework companion

The Homework page lists the Fall 2026 assignments for both classes — Math 54 (section and problem numbers from the public course page) and CE C30 / ME C85 (Govindjee problems, due Fridays at 5:59 pm, each set covering the previous week's lectures) — with a switch between them that opens on whichever class has the nearer deadline (Solid Mechanics on a tie). Each section links to the lessons and Level Check that teach it; sections the lessons don't reach (Math 54's ODE problems) are marked as such. The problem statements themselves stay in your textbook: open the homework tutor, pick the class and section, type the problem in, say what you've tried, and the tutor gives hints and walks through the method with you without writing the solution. When you've finished, flip to **check my work** and it verifies your solution step by step, stopping at the first error.

## Project layout

```
src/content/            course content (plain data) — types.ts, dsl.ts (authoring helpers), course.ts (registry of both courses), homework.ts (both homework schedules)
src/content/linear-algebra/unitN-*.ts   lessons + practice banks per unit (Math 54)
src/content/solid-mechanics/unitN-*.ts  lessons + practice banks per unit (CE C30 / ME C85)
src/content/generators/ parameterised problem generators (seeded, deterministic): registry.ts (define/generate),
                        linear-algebra.ts, solid-mechanics.ts → solid-mechanics-1.ts (sm1–sm4), solid-mechanics-2.ts (sm5–sm7), solid-mechanics-3.ts (sm0, sm8–sm10)
src/components/player/  LessonPlayer, PracticePlayer, PlayerChrome (header and action bar), StepView, FeedbackPanel, inputs/
src/components/visuals/ VectorCanvas, TransformGrid, RowReducer, LinesCanvas, ProjectionCanvas, LeastSquaresCanvas
src/components/visuals/solid/  AxialBar, StressElement, StrainGrid, TorsionSection, BeamSection, ShearMoment, PressureVessel,
                               MohrCircle, BeamDeflection, ColumnBuckling, LinkStability, shared.tsx
src/components/homework/       HomeworkHub (both schedules), HomeworkTutor
src/components/tutor/   TutorPanel (AI SDK useChat)
src/lib/check.ts        answer parsing (fractions, sqrt, pi …) and checking
src/lib/fraction.ts, linalg.ts   exact rational row reduction, det, inverse, nullspace; float geometry
src/lib/progress/       pure logic (streaks, XP, spaced review, merge) + zustand store + server sync
src/lib/ai/             provider selection, the tutor's instructions (one shared policy, a subject profile per course) and guard.ts,
                        which withholds any sentence of a reply that states the answer to an unresolved step
src/app/api/            /api/progress (file persistence), /api/tutor (streaming), /api/tutor/status, /api/problems
tests/                  vitest suites
```

## Authoring a lesson

Lessons are TypeScript data built with small helpers (`reading`, `mc`, `tf`, `multi`, `numeric`, `matrix`, `order`, `goal`) and a markdown-lite dialect with `$…$` / `$$…$$` KaTeX. Use `r\`…\`` (String.raw) so backslashes survive. Every question needs a `hint` (shown after the first miss) and an `explanation` (shown after it resolves); multiple-choice options can carry `feedback` for that specific wrong choice. `npm test` validates every step: ids unique, canonical answers pass the checker, goal steps are reachable and not already satisfied, generators are deterministic.
