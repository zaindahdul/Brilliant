import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import katex from "katex";
import { RichText } from "@/components/ui/RichText";
import { courses } from "@/content/course";
import { generate, listGenerators } from "@/content/generators";
import type { Step, Unit } from "@/content/types";
import { isQuestion } from "@/content/types";
import { formatAnswer } from "@/lib/check";
import { parseBlocks, type Inline } from "@/lib/markdown";

/**
 * Every formula in every course must compile under KaTeX.
 *
 * The app renders with `throwOnError: false`, so a broken formula does not
 * crash a page — it shows up as red error text in the middle of a lesson.
 * This test is what fails instead. It also catches the classic authoring
 * slips the renderer cannot: LaTeX commands outside `$…$`, an unbalanced `$`,
 * stray control characters (a `\t` that was meant to be `\text`), and a
 * `cases` environment whose row breaks were lost.
 */

interface Field {
  where: string;
  text: string;
  /** The whole string is TeX (answer display), not the markdown dialect. */
  tex?: boolean;
}

function* fieldsOf(where: string, step: Step): Generator<Field> {
  if (step.body) yield { where: `${where}.body`, text: step.body };
  if (!isQuestion(step)) return;
  yield { where: `${where}.question`, text: step.question };
  yield { where: `${where}.hint`, text: step.hint };
  yield { where: `${where}.explanation`, text: step.explanation };
  if (step.type === "mc" || step.type === "multi") {
    for (const c of step.choices) {
      yield { where: `${where}.choice[${c.id}]`, text: c.text };
      if (c.feedback) yield { where: `${where}.choice[${c.id}].feedback`, text: c.feedback };
    }
  }
  if (step.type === "order") for (const i of step.items) yield { where: `${where}.item[${i.id}]`, text: i.text };
  if (step.type === "numeric" || step.type === "matrix") {
    if (step.prefix) yield { where: `${where}.prefix`, text: step.prefix };
    if (step.type === "numeric" && step.suffix) yield { where: `${where}.suffix`, text: step.suffix };
  }
  const shown = formatAnswer(step);
  yield { where: `${where}.answer`, text: shown.value, tex: shown.kind === "math" };
}

function walkInline(nodes: Inline[], math: string[], text: string[]) {
  for (const n of nodes) {
    if (n.t === "math") math.push(n.v);
    else if (n.t === "text") text.push(n.v);
    else if (n.t === "bold" || n.t === "italic") walkInline(n.c, math, text);
  }
}

/** Splits a dialect string into its math segments and its prose segments. */
function split(text: string): { math: { tex: string; display: boolean }[]; prose: string[] } {
  const math: { tex: string; display: boolean }[] = [];
  const inline: string[] = [];
  const prose: string[] = [];
  for (const b of parseBlocks(text)) {
    if (b.t === "math") math.push({ tex: b.v, display: true });
    else if (b.t === "ul" || b.t === "ol") for (const item of b.items) walkInline(item, inline, prose);
    else walkInline(b.c, inline, prose);
  }
  for (const tex of inline) math.push({ tex, display: false });
  return { math, prose };
}

function compileError(tex: string, display: boolean): string | null {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: "ignore", displayMode: display, trust: false, output: "htmlAndMathml" });
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

const CONTROL = /[\u0000-\u0009\u000b\u000c\u000e-\u001f]/;
const TEX_COMMAND = /\\[a-zA-Z]+/;

function problemsIn(f: Field): string[] {
  const out: string[] = [];
  if (CONTROL.test(f.text)) out.push(`${f.where}: contains a control character (a collapsed backslash escape?) in ${JSON.stringify(f.text)}`);
  if (f.tex) {
    const err = compileError(f.text, false);
    if (err) out.push(`${f.where}: ${err} in ${JSON.stringify(f.text)}`);
    return out;
  }
  const { math, prose } = split(f.text);
  for (const m of math) {
    const err = compileError(m.tex, m.display);
    if (err) out.push(`${f.where}: ${err} in $${m.tex}$`);
    if (/\\begin\{cases\}(?![\s\S]*\\\\[\s\S]*\\end\{cases\})/.test(m.tex) && /\\begin\{cases\}/.test(m.tex) && !/\\\\/.test(m.tex))
      out.push(`${f.where}: cases environment without a row break in $${m.tex}$`);
  }
  for (const p of prose) {
    if (TEX_COMMAND.test(p)) out.push(`${f.where}: TeX command outside math in ${JSON.stringify(p)}`);
    if (p.includes("$")) out.push(`${f.where}: unbalanced $ in ${JSON.stringify(p)}`);
  }
  return out;
}

function problemsInUnit(u: Unit): string[] {
  const out: string[] = [];
  for (const l of u.lessons) for (const s of l.steps) for (const f of fieldsOf(`${l.id}/${s.id}`, s)) out.push(...problemsIn(f));
  for (const s of u.practice) for (const f of fieldsOf(`${u.id}/practice/${s.id}`, s)) out.push(...problemsIn(f));
  return out;
}

describe("KaTeX compiles every formula", () => {
  for (const c of courses) {
    for (const u of c.units) {
      it(`${c.id}/${u.id}`, () => {
        expect(problemsInUnit(u)).toEqual([]);
      });
    }
  }

  it("generated problems (seeds 1–12)", () => {
    const out: string[] = [];
    for (const g of listGenerators()) {
      for (let seed = 1; seed <= 12; seed++) {
        const p = generate(g.id, seed)!;
        for (const f of fieldsOf(`${g.id}#${seed}`, p.step)) out.push(...problemsIn(f));
      }
    }
    expect(out).toEqual([]);
  });

  it("renders $$…$$ written mid-paragraph as display math (u1-l5 and the 2×2 system generators)", () => {
    const la = courses.find((c) => c.id === "linear-algebra")!;
    const step = la.units.flatMap((u) => u.lessons).find((l) => l.id === "u1-l5-parameters")!.steps.find((s) => s.id === "h-and-k")!;
    const gens = listGenerators().filter((g) => /solve-2x2$|param-h$/.test(g.id));
    expect(gens).toHaveLength(2);
    const bodies = [step.body, ...gens.map((g) => generate(g.id, 3)!.step.body)];
    for (const body of bodies) {
      const html = renderToString(createElement(RichText, { text: body }));
      expect(html, body).toContain("katex-display");
      const visible = html.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, "").replace(/<[^>]+>/g, "");
      expect(visible, body).not.toContain("begin{aligned}");
    }
  });

  it("flags the slips it is meant to catch", () => {
    expect(problemsIn({ where: "t", text: String.raw`Stress is $\sigma = \frac{F}{A$.` })).not.toEqual([]);
    expect(problemsIn({ where: "t", text: String.raw`Stress is \sigma = F/A.` })).not.toEqual([]);
    expect(problemsIn({ where: "t", text: "Costs $5 and more" })).not.toEqual([]);
    expect(problemsIn({ where: "t", text: "12.5\t\\text{MPa}", tex: true })).not.toEqual([]);
    expect(problemsIn({ where: "t", text: String.raw`$\begin{cases} a & b \end{cases}$` })).not.toEqual([]);
    expect(problemsIn({ where: "t", text: String.raw`Fine: $\sigma_{xx} = -\frac{My}{I}$ and $$\begin{cases} 1 & x<0 \\ 0 & x \ge 0 \end{cases}$$` })).toEqual([]);
  });
});
