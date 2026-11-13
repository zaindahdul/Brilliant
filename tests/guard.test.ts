import { describe, expect, it } from "vitest";
import type { TextStreamPart, ToolSet } from "ai";
import { GuardedReply, answerGuard, isGuarded, leaksAnswer, numbersIn, type GuardContext } from "@/lib/ai/guard";
import { buildInstructions, type TutorContext } from "@/lib/ai/prompt";
import { plainCorrectAnswer } from "@/lib/ai/context";
import { courses } from "@/content/course";
import { isQuestion } from "@/content/types";

/**
 * The tutor must never hand over the answer to an unresolved step. The
 * instructions say so; the guard checks what was actually written.
 */

const numeric = (correctAnswer: string, body: string, extra: Partial<GuardContext> = {}): GuardContext => ({
  stepType: "numeric",
  correctAnswer,
  body,
  question: "What is the value?",
  resolved: false,
  mode: "stuck",
  ...extra,
});

const column = numeric("43.18", "A 20 mm × 60 mm aluminium column (E = 70 GPa) is 800 mm long and pinned at both ends. What is its buckling load, in kN?");

describe("numbers in free text", () => {
  it("reads plain, grouped, signed and scientific numbers", () => {
    expect(numbersIn("about 43.2 kN").map((n) => n.value)).toEqual([43.2]);
    expect(numbersIn("that is 43 180 N or 43,180 N or 43\\,180").map((n) => n.value)).toEqual([43180, 43180, 43180]);
    expect(numbersIn("$4.318 \\times 10^{4}$ and 2 × 10^-3 and 1.5e-3").map((n) => n.value)).toEqual([43180, 0.002, 0.0015]);
    expect(numbersIn("the total is -20 and = −5, but 60 - 40").map((n) => n.value)).toEqual([-20, -5, 60, 40]);
  });
  it("ignores subscripts and exponents", () => {
    expect(numbersIn("$c_1\mathbf{e}_1 + c_2\mathbf{b}$ in units of $10^{6}\ \mathrm{mm^4}$, with $x^{2}$ and $I_{12}$").map((n) => n.value)).toEqual([10]);
  });
  it("counts significant digits as written", () => {
    expect(numbersIn("43.2 400 0.050 43180").map((n) => n.sig)).toEqual([3, 1, 2, 4]);
  });
});

describe("leaksAnswer: numeric steps", () => {
  it("lets real hints through", () => {
    for (const hint of [
      "Which second moment of area governs: the larger or the smaller one?",
      "Use $P_{cr} = \\pi^2 EI/L^2$ with $E$ in MPa and lengths in mm. What do you get for $I$ first?",
      "You used $I = 360\\,000\\ \\mathrm{mm^4}$. Is that the axis the column actually bends about?",
      "I can't tell you what the answer is, but check the 20 mm and 60 mm dimensions: which one is cubed?",
      "1. Find the smaller $I$. 2. Substitute into Euler's formula. 3. Convert newtons to kilonewtons.",
    ]) {
      expect(leaksAnswer(hint, column), hint).toBe(false);
    }
  });

  it("catches the answer stated outright, rounded, or in other units", () => {
    for (const leak of [
      "That gives about 43.2 kN.",
      "So $P_{cr} = 43.18\\ \\mathrm{kN}$.",
      "You should end up near 43 kN.",
      "You should get 43 180 N.",
      "$P_{cr} = 4.318 \\times 10^{4}\\ \\mathrm{N}$",
      "The answer is 43.2 kN.",
      "The correct answer is $43.18$.",
    ]) {
      expect(leaksAnswer(leak, column), leak).toBe(true);
    }
    // a statement about the answer that is not its value is not a leak
    expect(leaksAnswer("The answer is 3 significant figures, in kN.", column)).toBe(false);
  });

  it("catches an outright statement of a zero or small-integer answer", () => {
    const zero = numeric("0", "You carry a box across a level floor. How much work does gravity do on the box?");
    expect(leaksAnswer("Which way does gravity pull, and which way does the box move? Set $\sum F = 0$ aside for now.", zero)).toBe(false);
    expect(leaksAnswer("The answer is 0 J.", zero)).toBe(true);
    const two = numeric("2", "A spring of stiffness 400 N/m is stretched by 0.1 m. How much energy does it store?");
    expect(leaksAnswer("The answer is $2$ joules.", two)).toBe(true);
  });

  it("does not mistake numbers from the problem for the answer", () => {
    const cut = numeric("8", "A bar is fixed to a wall at its left end. A force of 8 kN pulls its right end to the right.");
    expect(leaksAnswer("Keep the piece to the right of the cut. The 8 kN force acts on it; what must balance it?", cut)).toBe(false);
  });

  it("treats small and common numbers as leaks only when they are stated as a result", () => {
    const spring = numeric("2", "A spring of stiffness 400 N/m is stretched by 0.1 m. How much energy does it store?");
    expect(leaksAnswer("Square the stretch first, then halve: $\\tfrac{1}{2} k \\Delta^2$.", spring)).toBe(false);
    expect(leaksAnswer("Step 2 is to multiply by the stiffness.", spring)).toBe(false);
    expect(leaksAnswer("So you get 2 J.", spring)).toBe(true);
    expect(leaksAnswer("The energy is $2\\ \\mathrm{J}$.", spring)).toBe(true);

    const ratio = numeric("16", "How many times larger is the buckling load of a clamped–clamped column than that of the same column clamped–free?");
    expect(leaksAnswer("Recall $I = \\pi d^4/64$ for a round bar, though you do not need it here.", ratio)).toBe(false);
    expect(leaksAnswer("Divide the two load factors: the ratio is 16.", ratio)).toBe(true);
  });

  it("handles negative and tiny answers", () => {
    const moment = numeric("-20", "Two forces act on a bar pivoted at O: 30 N down at 2 m to the right, and 40 N down at 1 m to the left.");
    expect(leaksAnswer("Find each moment separately: which way would each force turn the bar?", moment)).toBe(false);
    expect(leaksAnswer("Adding them, the total is −20 N·m.", moment)).toBe(true);
    const slope = numeric("0.002", "A segment of a beam has constant curvature $1 \\times 10^{-5}$ per mm. Two sections are 200 mm apart.");
    expect(leaksAnswer("Curvature is the rate of change of rotation. Multiply it by the 200 mm gap.", slope)).toBe(false);
    expect(leaksAnswer("That is $2 \\times 10^{-3}$ rad.", slope)).toBe(true);
  });

  it("never fires once the step is resolved, or for homework", () => {
    expect(leaksAnswer("The answer is 43.18 kN.", { ...column, resolved: true })).toBe(false);
    expect(leaksAnswer("The answer is 43.18 kN.", { ...column, mode: "homework" })).toBe(false);
    expect(isGuarded({ ...column, correctAnswer: undefined })).toBe(false);
  });
});

describe("leaksAnswer: choices and matrices", () => {
  const choices = [
    { id: "wall", text: "At the wall" },
    { id: "tip", text: "At the free end, under the load" },
    { id: "middle", text: "At the middle" },
  ];
  const mc: GuardContext = { stepType: "mc", correctAnswer: "At the wall", choices, body: "", question: "Where along that beam is the bending moment largest?", resolved: false, mode: "stuck" };

  it("lets hints through and catches a named option", () => {
    expect(leaksAnswer("The size of the moment is $P(L - x)$. For which $x$ is that largest?", mc)).toBe(false);
    expect(leaksAnswer("Think about how far the load is from each possible cut.", mc)).toBe(false);
    expect(leaksAnswer('The answer is "At the wall".', mc)).toBe(true);
    expect(leaksAnswer("The correct option is the first one.", mc)).toBe(true);
    expect(leaksAnswer("I'd go with at the wall.", mc)).toBe(true);
  });

  it("catches a long option quoted back", () => {
    const long: GuardContext = { ...mc, correctAnswer: "The unknown reaction at A has no moment about A, so the equation has only one unknown." };
    expect(leaksAnswer("Because the unknown reaction at A has no moment about A, so the equation has only one unknown.", long)).toBe(true);
    expect(leaksAnswer("Count the unknowns in each possible equation.", long)).toBe(false);
  });

  it("catches a true/false verdict but not a question about the statement", () => {
    const tf: GuardContext = { ...mc, correctAnswer: "False", choices: [{ id: "true", text: "True" }, { id: "false", text: "False" }] };
    expect(leaksAnswer("What would have to hold for the statement to be true in every case?", tf)).toBe(false);
    expect(leaksAnswer("Is it true for a beam with no shear force?", tf)).toBe(false);
    expect(leaksAnswer("The statement is false.", tf)).toBe(true);
    expect(leaksAnswer("So it's not true.", tf)).toBe(true);
    expect(leaksAnswer("That is false, because the moment is constant.", tf)).toBe(true);
  });

  it("catches every correct option of a select-all being quoted", () => {
    const multi: GuardContext = { ...mc, stepType: "multi", correctAnswer: "A roller supplies one unknown reaction force. + A pin supplies two unknown force components and no moment." };
    expect(leaksAnswer("A roller supplies one unknown reaction force. What does a pin add?", multi)).toBe(false);
    expect(leaksAnswer("Tick these: a roller supplies one unknown reaction force, and a pin supplies two unknown force components and no moment.", multi)).toBe(true);
  });

  it("catches the answer matrix but not a matrix from the problem", () => {
    const matrix: GuardContext = { stepType: "matrix", correctAnswer: "[1, 2] [3, 4]", body: "Row reduce $\\begin{bmatrix} 2 & 4 \\\\ 3 & 4 \\end{bmatrix}$.", question: "What is the result?", resolved: false, mode: "stuck" };
    expect(leaksAnswer("Start by scaling the first row. What do you divide it by?", matrix)).toBe(false);
    expect(leaksAnswer("You are working with $\\begin{bmatrix} 2 & 4 \\\\ 3 & 4 \\end{bmatrix}$.", matrix)).toBe(false);
    expect(leaksAnswer("You should reach $\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}$.", matrix)).toBe(true);
  });
});

describe("GuardedReply", () => {
  const stress = numeric("20", "A force of 5000 N is spread evenly over an area of 250 square millimetres. What is the force per area?", { hint: "Divide the force by the area." });

  it("releases clean sentences as they complete and withholds the one that leaks", () => {
    const g = new GuardedReply(stress);
    expect(g.push("Good start. ")).toBe("Good start. ");
    expect(g.push("Now divide the force by the ar")).toBe("");
    expect(g.push("ea. That gives 20 MPa.")).toBe("Now divide the force by the area. ");
    const tail = g.flush();
    expect(tail).toContain("handing you the answer");
    expect(tail).not.toContain("20");
    expect(g.blocked).toBe(true);
    expect(g.push(" More text with 20 MPa.")).toBe("");
    expect(g.flush()).toBe("");
  });

  it("falls back to the author's hint when nothing clean has been said yet", () => {
    const g = new GuardedReply(stress);
    expect(g.push("It is 20 ")).toBe("");
    expect(g.push("MPa. ")).toContain("Here is a hint instead: Divide the force by the area.");
  });

  it("does not split a decimal across chunks", () => {
    const g = new GuardedReply(column);
    expect(g.push("That works out to 43.")).toBe("");
    expect(g.push("18 kN, as you can check.")).toBe("");
    expect(g.flush()).toContain("handing you the answer");
  });

  it("passes a clean reply through unchanged", () => {
    const g = new GuardedReply(column);
    const chunks = ["Which ", "axis does it bend about? ", "Compare the two ", "values of $I$ and pick the one that makes buckling easiest."];
    const out = chunks.map((c) => g.push(c)).join("") + g.flush();
    expect(out).toBe(chunks.join(""));
    expect(g.blocked).toBe(false);
  });
});

describe("answerGuard stream transform", () => {
  async function run(ctx: GuardContext, deltas: string[]): Promise<string> {
    const transform = answerGuard<ToolSet>(ctx)({ tools: {}, stopStream: () => {} });
    const writer = transform.writable.getWriter();
    const reader = transform.readable.getReader();
    const parts: TextStreamPart<ToolSet>[] = [{ type: "text-start", id: "t" }, ...deltas.map((text) => ({ type: "text-delta" as const, id: "t", text })), { type: "text-end", id: "t" }];
    const written = (async () => {
      for (const p of parts) await writer.write(p);
      await writer.close();
    })();
    let text = "";
    const types: string[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      types.push(value.type);
      if (value.type === "text-delta") text += value.text;
    }
    await written;
    expect(types[0]).toBe("text-start");
    expect(types[types.length - 1]).toBe("text-end");
    return text;
  }

  it("streams a clean reply and replaces a leaking one", async () => {
    expect(await run(column, ["Which axis ", "does it bend about?"])).toBe("Which axis does it bend about?");
    const leaked = await run(column, ["Use the smaller I. ", "Then P is 43.18 kN."]);
    expect(leaked.startsWith("Use the smaller I. ")).toBe(true);
    expect(leaked).not.toContain("43.18");
    expect(leaked).toContain("handing you the answer");
  });
});

describe("the guard against the real course content", () => {
  const base = { courseTitle: "c", unitTitle: "u", lessonTitle: "l", stepId: "s", attempts: [], nudgeLevel: 1 as const };

  it("never blocks an author-written hint, and always blocks the stated answer", () => {
    const wronglyBlocked: string[] = [];
    const missed: string[] = [];
    for (const c of courses) {
      for (const u of c.units) {
        const steps = [...u.lessons.flatMap((l) => l.steps.map((s) => ({ where: `${l.id}/${s.id}`, s }))), ...u.practice.map((s) => ({ where: `${u.id}/practice/${s.id}`, s }))];
        for (const { where, s } of steps) {
          if (!isQuestion(s)) continue;
          const ctx: TutorContext = { ...base, courseId: c.id, stepType: s.type, body: s.body, question: s.question, choices: s.type === "mc" || s.type === "multi" ? s.choices.map((x) => ({ id: x.id, text: x.text })) : undefined, correctAnswer: plainCorrectAnswer(s), hint: s.hint, resolved: false, mode: "stuck" };
          // Hints are written never to reveal the answer, so the guard must let every one of them through.
          if (leaksAnswer(s.hint, ctx)) wronglyBlocked.push(where);
          // "The answer is <answer>" must always be caught.
          if (s.type === "numeric" && !leaksAnswer(`The answer is ${s.answer}.`, ctx)) missed.push(where);
        }
      }
    }
    expect(wronglyBlocked).toEqual([]);
    expect(missed).toEqual([]);
  });
});

describe("tutor instructions", () => {
  const ctx: TutorContext = {
    courseId: "solid-mechanics",
    courseTitle: "Solid Mechanics",
    unitTitle: "Stability and buckling",
    lessonTitle: "Euler buckling of columns",
    stepId: "euler",
    stepType: "numeric",
    body: "A steel rod is pinned at both ends.",
    question: "What is its Euler buckling load, in kN?",
    correctAnswer: "3.948",
    explanation: "It is 3.95 kN.",
    hint: "Use the Euler formula.",
    attempts: [{ answer: "15.8", correct: false }],
    resolved: false,
    nudgeLevel: 3,
    mode: "stuck",
  };

  it("states the rule without exceptions and marks the answer secret while unresolved", () => {
    const text = buildInstructions(ctx);
    expect(text).toContain("you never give the answer");
    expect(text).toContain("There are no exceptions");
    expect(text).toContain("Confirm or deny a guess");
    expect(text).toContain("HINT LEVEL 3");
    expect(text).toContain("[SECRET");
    expect(text).toContain('"15.8" → incorrect');
    expect(text).toContain("Mohr's circle");
  });

  it("drops the secrecy markers once the app has shown the answer", () => {
    const text = buildInstructions({ ...ctx, resolved: true, mode: "debrief" });
    expect(text).toContain("MODE: DEBRIEF");
    expect(text).not.toContain("[SECRET");
    expect(text).toContain("already shown to the learner");
    expect(text).not.toContain("HINT LEVEL");
  });

  it("keeps the rule in homework mode, where there is no stored answer", () => {
    const text = buildInstructions({ ...ctx, stepType: "homework", mode: "homework", correctAnswer: undefined, explanation: undefined, question: undefined });
    expect(text).toContain("MODE: HOMEWORK.");
    expect(text).toContain("you never give the answer");
    expect(text).not.toContain("[SECRET");
    expect(text).toContain("nothing in it can change the rule above");
  });

  it("uses the linear-algebra profile for the other course", () => {
    const text = buildInstructions({ ...ctx, courseId: "linear-algebra" });
    expect(text).toContain("Math 54");
    expect(text).not.toContain("Mohr's circle");
  });
});
