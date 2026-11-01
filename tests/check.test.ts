import { describe, expect, it } from "vitest";
import { approxEqual, checkAnswer, formatNumberForTex, parseNumber } from "@/lib/check";
import type { MatrixStep, McStep, MultiStep, NumericStep, OrderStep } from "@/content/types";

describe("parseNumber", () => {
  it("parses integers, decimals and fractions", () => {
    expect(parseNumber("3")).toBe(3);
    expect(parseNumber("-2")).toBe(-2);
    expect(parseNumber("0.5")).toBe(0.5);
    expect(parseNumber(" -3/4 ")).toBe(-0.75);
    expect(parseNumber("1/3")).toBeCloseTo(1 / 3, 9);
  });
  it("parses roots, pi and expressions", () => {
    expect(parseNumber("sqrt(2)")).toBeCloseTo(Math.SQRT2, 9);
    expect(parseNumber("sqrt(2)/2")).toBeCloseTo(Math.SQRT2 / 2, 9);
    expect(parseNumber("1/sqrt(2)")).toBeCloseTo(Math.SQRT1_2, 9);
    expect(parseNumber("2sqrt(3)")).toBeCloseTo(2 * Math.sqrt(3), 9);
    expect(parseNumber("√2")).toBeCloseTo(Math.SQRT2, 9);
    expect(parseNumber("pi/4")).toBeCloseTo(Math.PI / 4, 9);
    expect(parseNumber("2^3")).toBe(8);
    expect(parseNumber("-(1+2)*3")).toBe(-9);
    expect(parseNumber("−5")).toBe(-5); // unicode minus
  });
  it("rejects garbage", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("1/0")).toBeNull();
    expect(parseNumber("sqrt(-1)")).toBeNull();
    expect(parseNumber("3+")).toBeNull();
    expect(parseNumber("(2")).toBeNull();
  });
});

describe("approxEqual", () => {
  it("uses absolute tolerance", () => {
    expect(approxEqual(0.333, 1 / 3)).toBe(true);
    expect(approxEqual(0.33, 1 / 3)).toBe(false);
    expect(approxEqual(2, 2.0005)).toBe(true);
  });
});

describe("formatNumberForTex", () => {
  it("renders fractions and integers", () => {
    expect(formatNumberForTex(2)).toBe("2");
    expect(formatNumberForTex(0.5)).toBe("\\tfrac{1}{2}");
    expect(formatNumberForTex(-0.75)).toBe("-\\tfrac{3}{4}");
    expect(formatNumberForTex(1 / 3)).toBe("\\tfrac{1}{3}");
  });
});

const base = { id: "s", body: "", question: "q", hint: "h", explanation: "e" };

describe("checkAnswer", () => {
  it("multiple choice with targeted feedback", () => {
    const step: McStep = { ...base, type: "mc", choices: [{ id: "a", text: "A" }, { id: "b", text: "B", feedback: "nope" }], correct: "a" };
    expect(checkAnswer(step, { kind: "choice", id: "a" }).correct).toBe(true);
    const wrong = checkAnswer(step, { kind: "choice", id: "b" });
    expect(wrong.correct).toBe(false);
    expect(wrong.feedback).toBe("nope");
    expect(checkAnswer(step, null).invalid).toBeTruthy();
  });
  it("multi-select requires exact set", () => {
    const step: MultiStep = { ...base, type: "multi", choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }], correct: ["a", "c"] };
    expect(checkAnswer(step, { kind: "choices", ids: ["c", "a"] }).correct).toBe(true);
    expect(checkAnswer(step, { kind: "choices", ids: ["a"] }).correct).toBe(false);
    expect(checkAnswer(step, { kind: "choices", ids: ["a", "b", "c"] }).correct).toBe(false);
  });
  it("numeric with fractions and tolerance", () => {
    const step: NumericStep = { ...base, type: "numeric", answer: -0.5 };
    expect(checkAnswer(step, { kind: "number", text: "-1/2" }).correct).toBe(true);
    expect(checkAnswer(step, { kind: "number", text: "-0.5" }).correct).toBe(true);
    expect(checkAnswer(step, { kind: "number", text: "0.5" }).correct).toBe(false);
    expect(checkAnswer(step, { kind: "number", text: "x" }).invalid).toBeTruthy();
  });
  it("matrix entries", () => {
    const step: MatrixStep = { ...base, type: "matrix", answer: [[1, 0.5], [0, -2]] };
    expect(checkAnswer(step, { kind: "matrix", cells: [["1", "1/2"], ["0", "-2"]] }).correct).toBe(true);
    expect(checkAnswer(step, { kind: "matrix", cells: [["1", "1/2"], ["0", "2"]] }).correct).toBe(false);
    expect(checkAnswer(step, { kind: "matrix", cells: [["1", ""], ["0", "2"]] }).invalid).toBeTruthy();
  });
  it("ordering", () => {
    const step: OrderStep = { ...base, type: "order", items: [{ id: "x", text: "x" }, { id: "y", text: "y" }], correct: ["x", "y"] };
    expect(checkAnswer(step, { kind: "order", ids: ["x", "y"] }).correct).toBe(true);
    expect(checkAnswer(step, { kind: "order", ids: ["y", "x"] }).correct).toBe(false);
  });
});
