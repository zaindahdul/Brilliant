import { describe, expect, it } from "vitest";
import { parseBlocks, parseInline, toPlainText } from "@/lib/markdown";

describe("markdown dialect", () => {
  it("parses inline math, bold, italic and code", () => {
    const nodes = parseInline("Solve $x + y = 3$ and **add** them, *then* `check`.");
    expect(nodes.map((n) => n.t)).toEqual(["text", "math", "text", "bold", "text", "italic", "text", "code", "text"]);
    expect(nodes[1]).toEqual({ t: "math", v: "x + y = 3" });
  });
  it("does not treat * inside math as emphasis", () => {
    const nodes = parseInline("$a * b$ and $c * d$");
    expect(nodes.filter((n) => n.t === "italic")).toHaveLength(0);
    expect(nodes.filter((n) => n.t === "math")).toHaveLength(2);
  });
  it("parses blocks: paragraphs, lists, display math, callouts, headings", () => {
    const src = "Intro text\n\n$$\nx = 1\n$$\n\n- one\n- two\n\n1. first\n2. second\n\n> note\n\n### Title";
    const blocks = parseBlocks(src);
    expect(blocks.map((b) => b.t)).toEqual(["p", "math", "ul", "ol", "callout", "h3"]);
    expect(blocks[1]).toEqual({ t: "math", v: "x = 1" });
  });
  it("keeps single-line display math", () => {
    const blocks = parseBlocks("Before\n\n$$a+b$$\n\nAfter");
    expect(blocks.map((b) => b.t)).toEqual(["p", "math", "p"]);
  });
  it("handles matrices in display math spanning lines", () => {
    const src = String.raw`Text

$$\begin{bmatrix}1&2\\3&4\end{bmatrix}$$

More`;
    const blocks = parseBlocks(src);
    expect(blocks[1].t).toBe("math");
  });
  it("treats $$…$$ written inside a paragraph as display math", () => {
    const nodes = parseInline(String.raw`Solve $$\begin{aligned} x + y &= 1 \\ x - y &= 3 \end{aligned}$$ for $x$.`);
    expect(nodes.map((n) => n.t)).toEqual(["text", "math", "text", "math", "text"]);
    expect(nodes[1]).toEqual({ t: "math", v: String.raw`\begin{aligned} x + y &= 1 \\ x - y &= 3 \end{aligned}`, display: true });
    expect(nodes[3]).toEqual({ t: "math", v: "x" });
    // and it still parses as one paragraph block
    expect(parseBlocks("Two parameters: $$a = b$$ here").map((b) => b.t)).toEqual(["p"]);
    // an unclosed $$ does not swallow the rest of the text
    expect(parseInline("costs $$5").filter((n) => n.t === "text").length).toBeGreaterThan(0);
  });
  it("strips formatting for plain text", () => {
    expect(toPlainText("**Bold** and $x^2$ and `code`")).toBe("Bold and x^2 and code");
  });
});
