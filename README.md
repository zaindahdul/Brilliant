# Nudge — learn linear algebra by doing

A Brilliant-style interactive course for the linear algebra half of **UC Berkeley Math 54** (Lay, *Linear Algebra and Its Applications*, chapters 1–7 in the order the course covers them), with an AI tutor that **only nudges** — it can see the exact step you are on and what you have tried, and it never hands you the answer.

Built after a close study of how Brilliant teaches (single-focus step player, two-try feedback with a targeted hint then the answer, worked reasoning after every problem, winding course map with level checks, streaks, XP, spaced review) and of the principles in Trefor Bazett's *The Learning Crisis in Academia*: stay active, use the tutor for nudges not answers, keep the productive friction, self-assess by **recollection**, and read every AI answer critically.

## Running it

```bash
npm install
cp .env.example .env.local   # add ONE provider key (see below) — optional
npm run dev                  # http://localhost:3000
```

Progress is saved automatically in your browser **and** to `data/progress.json` on disk (debounced, plus a beacon when you close the tab), so quitting mid-lesson is fine — you resume at the same step.

### AI tutor keys (`.env.local`)

| Variable | Provider | Default model |
| --- | --- | --- |
| `XAI_API_KEY` | xAI Grok | `grok-4-1-fast-reasoning` |
| `GROQ_API_KEY` | Groq (free tier) | `openai/gpt-oss-120b` |
| `OPENAI_COMPATIBLE_BASE_URL` + `OPENAI_COMPATIBLE_API_KEY` + `AI_MODEL` | any OpenAI-compatible API (Ollama, OpenRouter, …) | — |
| `AI_GATEWAY_API_KEY` + `AI_MODEL=provider/model` | Vercel AI Gateway | — |

`AI_MODEL` overrides the model for any provider. Without a key everything still works — the hand-written hints after a miss don't need AI.

### Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc
npm run lint       # eslint (React compiler rules on)
npm run test       # vitest: answer checker, exact linear algebra, streak/XP/review logic, content validation, generators
npm run check      # all three
```

## How a lesson works

1. **No chrome.** Just a segmented progress bar, one step at a time, one primary button pinned in place: *Check → feedback → Continue*.
2. **Concept first, then do.** Short reading steps with a manipulable visual (drag vectors, slide matrix entries, perform row operations yourself), then problems that use the idea.
3. **Two tries.** A miss shows a *targeted hint* written for that step (or for the specific wrong option you picked) and lets you try once more. A second miss reveals the answer with the worked reasoning, and you move on — you can never get stuck.
4. **Correct answers also get the reasoning**, because the point is *why*.
5. **Ask for a nudge.** The tutor panel escalates in three levels: a guiding question → a specific diagnosis of your attempt → the method as steps with the first step done, never the last. After a step resolves it switches to *debrief* mode and asks you to explain it back.
6. **Finish screen**: first-try %, eventually-correct %, XP, streak, and a next action.

## The course

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

Every unit ends with a **Level Check** (quick check of 5 or practice of 15): no first-miss hint, shuffled, and roughly half the problems generated fresh from parameterised generators with exact (fraction) answers — so the surface details change while the idea stays.

Missed problems come back on a **spaced schedule** on the Review page; weak spots can be drilled any time.

## Homework companion

The Homework page lists the Fall 2026 Math 54 assignments (section and problem numbers from the public course page) and links each section to the lessons and Level Check that teach it. The problem statements themselves stay in your textbook: open the homework tutor, type the problem in, say what you've tried, and the tutor nudges you through it without writing the solution. When you've finished, flip to **check my work** and it verifies your solution step by step, stopping at the first error.

## Project layout

```
src/content/            course content (plain data) — types.ts, dsl.ts (authoring helpers), course.ts (registry)
src/content/linear-algebra/unitN-*.ts   lessons + practice banks per unit
src/content/generators/ parameterised problem generators (seeded, deterministic)
src/components/player/  LessonPlayer, PracticePlayer, StepView, FeedbackPanel, inputs/
src/components/visuals/ VectorCanvas, TransformGrid, RowReducer, LinesCanvas, ProjectionCanvas, LeastSquaresCanvas
src/components/tutor/   TutorPanel (AI SDK useChat)
src/lib/check.ts        answer parsing (fractions, sqrt, pi …) and checking
src/lib/fraction.ts, linalg.ts   exact rational row reduction, det, inverse, nullspace; float geometry
src/lib/progress/       pure logic (streaks, XP, spaced review, merge) + zustand store + server sync
src/lib/ai/             provider selection and the tutor's instructions
src/app/api/            /api/progress (file persistence), /api/tutor (streaming), /api/tutor/status, /api/problems
tests/                  vitest suites
```

## Authoring a lesson

Lessons are TypeScript data built with small helpers (`reading`, `mc`, `tf`, `multi`, `numeric`, `matrix`, `order`, `goal`) and a markdown-lite dialect with `$…$` / `$$…$$` KaTeX. Use `r\`…\`` (String.raw) so backslashes survive. Every question needs a `hint` (shown after the first miss) and an `explanation` (shown after it resolves); multiple-choice options can carry `feedback` for that specific wrong choice. `npm test` validates every step: ids unique, canonical answers pass the checker, goal steps are reachable and not already satisfied, generators are deterministic.
