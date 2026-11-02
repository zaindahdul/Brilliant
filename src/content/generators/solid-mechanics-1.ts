/**
 * Solid mechanics generators, part 1 (units sm1–sm4): axial bars, stress,
 * strain and the generalized Hooke's law.
 *
 * Notation and sign conventions follow Govindjee: internal force R (tension
 * positive), σ = R/A, ε = du/dx; stress components σ_ij with i = cut normal and
 * j = force direction; engineering shear strain γ_xy = ∂u/∂y + ∂v/∂x = 2ε_xy;
 * pressure p = mean normal stress (positive in tension); the oblique-cut angle θ
 * is measured between the cut and the bar axis. Parameters are round numbers
 * (the answer is never rounded) and every numeric step carries a ≈1 % tolerance.
 */
import { define } from "./registry";
import { pick, randInt, randNonZero, type Rng } from "@/lib/random";
import { r } from "../dsl";
import type { QuestionStep } from "../types";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

/** A number for LaTeX: `sf` significant figures (whole numbers ≥ 10^(sf−1) stay whole), thin-space thousands. */
function num(x: number, sf = 4): string {
  if (!Number.isFinite(x)) return String(x);
  const ax = Math.abs(x);
  if (ax < 1e-12) return "0";
  let s: string;
  if (ax >= 10 ** (sf - 1)) s = String(Math.round(ax));
  else {
    s = ax.toFixed(Math.max(0, sf - (Math.floor(Math.log10(ax)) + 1)));
    if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  }
  if (/^0(\.0*)?$/.test(s)) return "0";
  const [ip, fp] = s.split(".");
  const grouped = ip.length > 4 ? ip.replace(/\B(?=(\d{3})+(?!\d))/g, "\\,") : ip;
  return (x < 0 ? "-" : "") + (fp ? `${grouped}.${fp}` : grouped);
}

/** Given data, shown exactly (up to 6 significant figures). */
const g = (x: number) => num(x, 6);
/** Parenthesise negatives when substituting into a formula. */
const par = (x: number, sf = 4) => (x < 0 ? `(${num(x, sf)})` : num(x, sf));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** A coefficient times a variable, writing 1·x as x and −1·x as −x. */
const mono = (c: number, v: string) => (c === 1 ? v : c === -1 ? `-${v}` : r`${g(c)}\,${v}`);

/** Round to n significant figures (for "measured" data, which is then shown and used exactly). */
function roundSig(x: number, n: number): number {
  if (x === 0) return 0;
  const p = n - 1 - Math.floor(Math.log10(Math.abs(x)));
  return p >= 0 ? Math.round(x * 10 ** p) / 10 ** p : Math.round(x / 10 ** -p) * 10 ** -p;
}

/** Absolute tolerance: 1 % of the answer, never below `floor`. */
const tol = (answer: number, floor: number) => Math.max(0.01 * Math.abs(answer), floor);

/** Redraw until `ok` holds (bounded; the parameter pools make this succeed within a few draws). */
function draw<T>(make: () => T, ok: (t: T) => boolean): T {
  let t = make();
  for (let i = 0; i < 400 && !ok(t); i++) t = make();
  return t;
}

const paras = (...blocks: (string | false | undefined)[]) => blocks.filter(Boolean).join("\n\n");
const dm = (tex: string) => `$$${tex}$$`;
const SF3 = "to three significant figures";

/** LaTeX units appended to revealed answers. */
const U = {
  MPa: r`\,\mathrm{MPa}`,
  GPa: r`\,\mathrm{GPa}`,
  kN: r`\,\mathrm{kN}`,
  mm: r`\,\mathrm{mm}`,
  mm2: r`\,\mathrm{mm^2}`,
  mm3: r`\,\mathrm{mm^3}`,
  J: r`\,\mathrm{J}`,
  kNm: r`\,\mathrm{kN\cdot m}`,
  micro: r`\times 10^{-6}`,
  urad: r`\,\mu\mathrm{rad}`,
  rad: r`\,\mathrm{rad}`,
  degC: r`\,{}^\circ\mathrm{C}`,
  kJm3: r`\,\mathrm{kJ/m^3}`,
  kNm3: r`\,\mathrm{kN/m^3}`,
  none: "",
};

interface NumericSpec {
  body: string;
  question: string;
  answer: number;
  /** Smallest absolute tolerance, used when 1 % of the answer is smaller. */
  floor: number;
  /** LaTeX unit appended to the revealed answer. */
  unit: string;
  suffix?: string;
  hint: string;
  explanation: string;
  tags: string[];
}

function numericStep(s: NumericSpec): QuestionStep {
  return {
    type: "numeric",
    id: "",
    body: s.body,
    question: s.question,
    answer: s.answer,
    tolerance: tol(s.answer, s.floor),
    suffix: s.suffix,
    answerDisplay: `${num(s.answer)}${s.unit}`,
    hint: s.hint,
    explanation: s.explanation,
    tags: s.tags,
  };
}

interface Material {
  name: string;
  /** Young's modulus, GPa. */
  E: number;
  nu: number;
  /** Coefficient of thermal expansion, 10⁻⁶ per °C. */
  alpha: number;
}

const STEEL: Material = { name: "steel", E: 200, nu: 0.3, alpha: 12 };
const ALUMINUM: Material = { name: "aluminum", E: 70, nu: 0.33, alpha: 24 };
const COPPER: Material = { name: "copper", E: 120, nu: 0.34, alpha: 17 };
const BRASS: Material = { name: "brass", E: 100, nu: 0.34, alpha: 20 };
const TITANIUM: Material = { name: "titanium", E: 105, nu: 0.33, alpha: 9 };
const NYLON: Material = { name: "nylon", E: 3, nu: 0.4, alpha: 80 };

/** "$E = 200\,\mathrm{GPa}$, $\nu = 0.3$, …" for the requested constants. */
function constants(m: Material, keys: ("E" | "nu" | "alpha")[]): string {
  return keys
    .map((k) =>
      k === "E" ? r`$E = ${g(m.E)}\,\mathrm{GPa}$` : k === "nu" ? r`$\nu = ${g(m.nu)}$` : r`$\alpha = ${g(m.alpha)}\times 10^{-6}\,/{}^\circ\mathrm{C}$`,
    )
    .join(", ");
}

/** "a steel" / "an aluminum". */
const withArticle = (m: Material) => `${/^[aeiou]/.test(m.name) ? "an" : "a"} ${m.name}`;

/** "pointing in +x (…)" for a signed axial force. */
const dirText = (P: number, plus: string, minus: string) => (P > 0 ? r`pointing in $+x$ (${plus})` : r`pointing in $-x$ (${minus})`);

/* ------------------------------------------------------------------ */
/* sm1 — axial bars                                                    */
/* ------------------------------------------------------------------ */

interface Section {
  A: number;
  /** Lower-case description, e.g. "a solid round bar of diameter d = 20 mm". */
  text: string;
  /** Display-math line computing A. */
  areaTex: string;
}

function roundSection(d: number): Section {
  const A = (Math.PI * d * d) / 4;
  return {
    A,
    text: r`a solid round bar of diameter $d = ${g(d)}\,\mathrm{mm}$`,
    areaTex: r`A = \frac{\pi d^2}{4} = \frac{\pi\,(${g(d)}\,\mathrm{mm})^2}{4} = ${num(A)}\,\mathrm{mm^2}`,
  };
}

function randomSection(rng: Rng, kind: "round" | "rect" | "tube"): Section {
  if (kind === "round") return roundSection(pick(rng, [10, 12, 16, 20, 25, 30, 40, 50]));
  if (kind === "rect") {
    const b = pick(rng, [10, 12, 15, 20, 25, 30, 40, 50]);
    const h = pick(rng, [20, 25, 30, 40, 50, 60, 75, 80, 100]);
    return {
      A: b * h,
      text: r`a rectangular bar with a $${b}\,\mathrm{mm} \times ${h}\,\mathrm{mm}$ cross-section`,
      areaTex: r`A = bh = (${b}\,\mathrm{mm})(${h}\,\mathrm{mm}) = ${num(b * h)}\,\mathrm{mm^2}`,
    };
  }
  const D = pick(rng, [30, 40, 50, 60, 75, 80, 100]);
  const t = pick(rng, [3, 4, 5, 6, 8, 10]);
  const di = D - 2 * t;
  const A = (Math.PI * (D * D - di * di)) / 4;
  return {
    A,
    text: r`a circular tube with outer diameter $d_o = ${D}\,\mathrm{mm}$ and wall thickness $t = ${t}\,\mathrm{mm}$`,
    areaTex: r`d_i = d_o - 2t = ${di}\,\mathrm{mm}, \qquad A = \frac{\pi}{4}\left(d_o^2 - d_i^2\right) = \frac{\pi}{4}\left(${D}^2 - ${di}^2\right) = ${num(A)}\,\mathrm{mm^2}`,
  };
}

define({
  id: "gen.sm.axial-stress",
  unitId: "sm1",
  title: "Normal stress in an axially loaded bar",
  make: (_seed, rng) => {
    const kind = pick(rng, ["round", "rect", "tube", "round", "rect", "max-load"] as const);
    if (kind === "max-load") {
      const sec = roundSection(pick(rng, [10, 12, 16, 20, 25, 30, 40]));
      const sAllow = pick(rng, [80, 100, 120, 140, 150, 160, 180, 200, 250]);
      const P = (sAllow * sec.A) / 1000; // kN
      return numericStep({
        body: r`${cap(sec.text)} is loaded in axial tension by forces $P$ at its ends. The normal stress may not exceed $\sigma_{\text{allow}} = ${sAllow}\,\mathrm{MPa}$.`,
        question: r`What is the largest load $P$ the bar may carry? Give $P$ in kN ${SF3}.`,
        answer: P,
        floor: 0.005,
        unit: U.kN,
        suffix: "kN",
        hint: r`Every cross-section carries $R = P$, so $\sigma = P/A$. Set $\sigma$ equal to the allowable stress, with $1\,\mathrm{MPa} = 1\,\mathrm{N/mm^2}$.`,
        explanation: paras(
          dm(sec.areaTex),
          dm(r`P_{\max} = \sigma_{\text{allow}}\,A = (${sAllow}\,\mathrm{N/mm^2})(${num(sec.A)}\,\mathrm{mm^2}) = ${num(P * 1000)}\,\mathrm{N} = ${num(P)}\,\mathrm{kN}`),
        ),
        tags: ["axial-stress", "design"],
      });
    }
    const tension = rng() < 0.6;
    const q = draw(
      () => ({ sec: randomSection(rng, kind), P: pick(rng, [5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200]) }),
      (q) => (q.P * 1000) / q.sec.A >= 20 && (q.P * 1000) / q.sec.A <= 300,
    );
    const R = (tension ? 1 : -1) * q.P * 1000; // N
    const sigma = R / q.sec.A; // MPa
    return numericStep({
      body: r`${cap(q.sec.text)} is loaded at its ends by an axial ${tension ? "tensile" : "compressive"} force $P = ${q.P}\,\mathrm{kN}$.`,
      question: r`What is the normal stress $\sigma = R/A$ on a cross-section? Give it in MPa (tension positive, compression negative) ${SF3}.`,
      answer: sigma,
      floor: 0.05,
      unit: U.MPa,
      suffix: "MPa",
      hint: r`Make a section cut: what internal force $R$, with its sign, does the free-body diagram of one piece require? Then divide by the area, using $1\,\mathrm{MPa} = 1\,\mathrm{N/mm^2}$.`,
      explanation: paras(
        r`A section cut anywhere along the bar and the free-body diagram of either piece give $R = ${tension ? "" : "-"}P = ${num(R / 1000)}\,\mathrm{kN}$ (${tension ? "tension" : "compression"}).`,
        dm(q.sec.areaTex),
        dm(r`\sigma = \frac{R}{A} = \frac{${num(R, 6)}\,\mathrm{N}}{${num(q.sec.A)}\,\mathrm{mm^2}} = ${num(sigma)}\,\mathrm{MPa}`),
        tension ? "Positive: the bar is in tension." : "Negative: the bar is in compression.",
      ),
      tags: ["axial-stress"],
    });
  },
});

define({
  id: "gen.sm.axial-elongation",
  unitId: "sm1",
  title: "Change in length of a uniform bar",
  make: (_seed, rng) => {
    const kind = pick(rng, ["delta", "delta", "load", "modulus"] as const);
    if (kind === "modulus") {
      const Etrue = pick(rng, [70, 105, 120, 200]);
      const q = draw(
        () => ({ d: pick(rng, [10, 12, 12.5, 15, 20]), L0: pick(rng, [50, 100, 200]), P: pick(rng, [5, 8, 10, 12, 15, 20, 25, 30]) }),
        (q) => {
          const s = (q.P * 1000) / ((Math.PI * q.d * q.d) / 4);
          return s >= 30 && s <= (Etrue === 200 ? 250 : 150);
        },
      );
      const A = (Math.PI * q.d * q.d) / 4;
      const delta = roundSig((q.P * 1000 * q.L0) / (A * Etrue * 1000), 3); // the "measured" value
      const E = (q.P * 1000 * q.L0) / (A * delta) / 1000; // GPa, from the data as stated
      return numericStep({
        body: r`In a tensile test a round specimen of diameter $d = ${g(q.d)}\,\mathrm{mm}$ is loaded to $P = ${q.P}\,\mathrm{kN}$, still in the linear-elastic range. An extensometer measures an elongation $\delta = ${g(delta)}\,\mathrm{mm}$ over the gauge length $L_0 = ${q.L0}\,\mathrm{mm}$.`,
        question: r`What is Young's modulus $E$ of the material? Give it in GPa ${SF3}.`,
        answer: E,
        floor: 0.05,
        unit: U.GPa,
        suffix: "GPa",
        hint: r`Compute the stress $P/A$ and the strain $\delta/L_0$; Hooke's law $\sigma = E\varepsilon$ links them. Units: $\mathrm{N/mm^2} = \mathrm{MPa}$ and $1\,\mathrm{GPa} = 1000\,\mathrm{MPa}$.`,
        explanation: paras(
          dm(r`A = \frac{\pi d^2}{4} = ${num(A)}\,\mathrm{mm^2}, \qquad \sigma = \frac{P}{A} = \frac{${g(q.P * 1000)}\,\mathrm{N}}{${num(A)}\,\mathrm{mm^2}} = ${num((q.P * 1000) / A)}\,\mathrm{MPa}, \qquad \varepsilon = \frac{\delta}{L_0} = \frac{${g(delta)}}{${q.L0}} = ${num(delta / q.L0)}`),
          dm(r`E = \frac{\sigma}{\varepsilon} = \frac{P L_0}{A\,\delta} = ${num(E * 1000)}\,\mathrm{MPa} = ${num(E)}\,\mathrm{GPa}`),
        ),
        tags: ["hooke", "elongation"],
      });
    }
    const m = pick(rng, [STEEL, ALUMINUM, COPPER]);
    const E = m.E * 1000; // N/mm²
    const lim = m === STEEL ? 250 : 160;
    if (kind === "load") {
      const q = draw(
        () => ({
          d: pick(rng, [10, 12, 16, 20, 25, 30]),
          L: pick(rng, [500, 750, 1000, 1200, 1500, 2000, 2500, 3000]),
          delta: pick(rng, [0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1, 1.2, 1.5, 2, 2.5, 3]),
        }),
        (q) => (E * q.delta) / q.L >= 30 && (E * q.delta) / q.L <= lim,
      );
      const A = (Math.PI * q.d * q.d) / 4;
      const P = (q.delta * A * E) / q.L / 1000; // kN
      return numericStep({
        body: r`${cap(withArticle(m))} rod of diameter $d = ${q.d}\,\mathrm{mm}$ and length $L = ${g(q.L / 1000)}\,\mathrm{m}$ is pulled in axial tension until it has stretched by $\delta = ${g(q.delta)}\,\mathrm{mm}$. ${constants(m, ["E"])}.`,
        question: r`What axial force produced this elongation? Give it in kN ${SF3}.`,
        answer: P,
        floor: 0.005,
        unit: U.kN,
        suffix: "kN",
        hint: r`Rearrange $\delta = PL/(AE)$ for $P$. Work in N and mm, with $E$ in $\mathrm{N/mm^2}$.`,
        explanation: paras(
          dm(r`A = \frac{\pi d^2}{4} = ${num(A)}\,\mathrm{mm^2}, \qquad E = ${m.E}\,\mathrm{GPa} = ${g(E)}\,\mathrm{N/mm^2}, \qquad L = ${g(q.L)}\,\mathrm{mm}`),
          dm(r`P = \frac{\delta A E}{L} = \frac{(${g(q.delta)})(${num(A)})(${g(E)})}{${g(q.L)}} = ${num(P * 1000)}\,\mathrm{N} = ${num(P)}\,\mathrm{kN}`),
        ),
        tags: ["elongation"],
      });
    }
    const tension = rng() < 0.65;
    const q = draw(
      () => ({
        P: pick(rng, [10, 15, 20, 25, 30, 40, 50, 60, 80, 100]),
        L: pick(rng, [500, 750, 1000, 1200, 1500, 2000, 2500, 3000]),
        d: pick(rng, [10, 12, 16, 20, 25, 30, 40]),
      }),
      (q) => {
        const A = (Math.PI * q.d * q.d) / 4;
        const s = (q.P * 1000) / A;
        return s >= 30 && s <= lim && (q.P * 1000 * q.L) / (A * E) >= 0.05;
      },
    );
    const A = (Math.PI * q.d * q.d) / 4;
    const R = (tension ? 1 : -1) * q.P * 1000; // N
    const delta = (R * q.L) / (A * E); // mm
    return numericStep({
      body: r`${cap(withArticle(m))} rod of diameter $d = ${q.d}\,\mathrm{mm}$ and length $L = ${g(q.L / 1000)}\,\mathrm{m}$ carries an axial ${tension ? "tensile" : "compressive"} force $P = ${q.P}\,\mathrm{kN}$. ${constants(m, ["E"])}.`,
      question: r`What is the change in length $\delta$ of the rod? Give it in mm (elongation positive, shortening negative) ${SF3}.`,
      answer: delta,
      floor: 0.0001,
      unit: U.mm,
      suffix: "mm",
      hint: r`For a uniform bar with a constant internal force, $\delta = RL/(AE)$. Use N and mm, with $E$ in $\mathrm{N/mm^2}$ ($1\,\mathrm{GPa} = 1000\,\mathrm{N/mm^2}$).`,
      explanation: paras(
        r`The internal force is $R = ${num(R / 1000)}\,\mathrm{kN}$ along the whole rod (${tension ? "tension" : "compression"}).`,
        dm(r`A = \frac{\pi d^2}{4} = ${num(A)}\,\mathrm{mm^2}, \qquad E = ${g(E)}\,\mathrm{N/mm^2}, \qquad L = ${g(q.L)}\,\mathrm{mm}`),
        dm(r`\delta = \frac{RL}{AE} = \frac{(${num(R, 6)})(${g(q.L)})}{(${num(A)})(${g(E)})} = ${num(delta)}\,\mathrm{mm}`),
        tension ? "The rod gets longer." : "Negative: the rod gets shorter.",
      ),
      tags: ["elongation"],
    });
  },
});

define({
  id: "gen.sm.stepped-bar",
  unitId: "sm1",
  title: "Two-segment bar fixed at one end",
  make: (_seed, rng) => {
    const ask = pick(rng, ["end", "end", "junction", "stress"] as const);
    const m = pick(rng, [STEEL, STEEL, ALUMINUM, BRASS]);
    const E = m.E * 1000; // N/mm²
    const lim = m === STEEL ? 250 : 150;
    const seg = rng() < 0.5 ? 1 : 2; // segment asked about in the stress variant
    const lengths = [200, 250, 300, 400, 500, 600, 750, 800, 1000];
    const q = draw(
      () => ({
        L1: pick(rng, lengths),
        L2: pick(rng, lengths),
        A1: pick(rng, [200, 250, 300, 400, 500, 600, 800, 1000]),
        A2: pick(rng, [150, 200, 250, 300, 400, 500, 600, 800]),
        P2: pick(rng, [10, 15, 20, 25, 30, 40, 50]) * (rng() < 0.7 ? 1 : -1),
        P1: rng() < 0.3 ? 0 : pick(rng, [10, 15, 20, 25, 30, 40, 50, 60, 80]) * (rng() < 0.5 ? 1 : -1),
      }),
      (q) => {
        const R1 = (q.P1 + q.P2) * 1000;
        const R2 = q.P2 * 1000;
        if (Math.abs(R1 / q.A1) > lim || Math.abs(R2 / q.A2) > lim) return false;
        const u1 = (R1 * q.L1) / (q.A1 * E);
        const uL = u1 + (R2 * q.L2) / (q.A2 * E);
        if (ask === "end") return Math.abs(uL) >= 0.05;
        if (ask === "junction") return Math.abs(u1) >= 0.05;
        return Math.abs(seg === 1 ? R1 / q.A1 : R2 / q.A2) >= 5;
      },
    );
    const R1 = (q.P1 + q.P2) * 1000; // N
    const R2 = q.P2 * 1000; // N
    const d1 = (R1 * q.L1) / (q.A1 * E);
    const d2 = (R2 * q.L2) / (q.A2 * E);
    const away = "away from the wall";
    const toward = "toward the wall";
    const loads =
      q.P1 !== 0
        ? r`A force of $${Math.abs(q.P1)}\,\mathrm{kN}$ acts at the junction of the segments, ${dirText(q.P1, away, toward)}, and a force of $${Math.abs(q.P2)}\,\mathrm{kN}$ acts at the free end, ${dirText(q.P2, away, toward)}.`
        : r`A force of $${Math.abs(q.P2)}\,\mathrm{kN}$ acts at the free end, ${dirText(q.P2, away, toward)}.`;
    const body = r`${cap(withArticle(m))} bar ($E = ${m.E}\,\mathrm{GPa}$) is fixed to a wall at its left end, $x = 0$. Segment 1, next to the wall, has length $L_1 = ${q.L1}\,\mathrm{mm}$ and area $A_1 = ${q.A1}\,\mathrm{mm^2}$; segment 2 continues to the free end with $L_2 = ${q.L2}\,\mathrm{mm}$ and $A_2 = ${q.A2}\,\mathrm{mm^2}$. ${loads}`;
    const internal =
      q.P1 !== 0
        ? r`Take forces positive in $+x$: $P_1 = ${q.P1}\,\mathrm{kN}$ at the junction and $P_2 = ${q.P2}\,\mathrm{kN}$ at the end. A cut in segment 2, keeping the piece to its right (no wall reaction on it), gives $R_2 = P_2 = ${q.P2}\,\mathrm{kN}$; a cut in segment 1 gives $R_1 = P_1 + P_2 = ${q.P1} + ${par(q.P2)} = ${num(R1 / 1000)}\,\mathrm{kN}$ (positive = tension).`
        : r`Take forces positive in $+x$: $P = ${q.P2}\,\mathrm{kN}$ at the end. Any cut, keeping the piece to its right (no wall reaction on it), gives the same internal force in both segments: $R_1 = R_2 = ${q.P2}\,\mathrm{kN}$ (positive = tension).`;
    if (ask === "stress") {
      const R = seg === 1 ? R1 : R2;
      const A = seg === 1 ? q.A1 : q.A2;
      const sigma = R / A;
      return numericStep({
        body,
        question: r`What is the normal stress in segment ${seg}? Give it in MPa (tension positive) ${SF3}.`,
        answer: sigma,
        floor: 0.05,
        unit: U.MPa,
        suffix: "MPa",
        hint: r`Find the internal force in that segment from a free-body diagram of the part of the bar to the right of a cut, then divide by that segment's area.`,
        explanation: paras(internal, dm(r`\sigma_${seg} = \frac{R_${seg}}{A_${seg}} = \frac{${num(R, 6)}\,\mathrm{N}}{${A}\,\mathrm{mm^2}} = ${num(sigma)}\,\mathrm{MPa}`)),
        tags: ["axial-stress", "stepped-bar"],
      });
    }
    if (ask === "junction") {
      return numericStep({
        body,
        question: r`What is the displacement $u(L_1)$ of the junction between the two segments? Give it in mm (positive in $+x$) ${SF3}.`,
        answer: d1,
        floor: 0.0001,
        unit: U.mm,
        suffix: "mm",
        hint: r`The junction moves by the change in length of segment 1 alone. Find $R_1$ from a free-body diagram of everything to the right of a cut in segment 1.`,
        explanation: paras(
          internal,
          r`Only segment 1 lies between the wall and the junction, so (N, mm, $\mathrm{N/mm^2}$):`,
          dm(r`u(L_1) = \frac{R_1L_1}{A_1E} = \frac{(${num(R1, 6)})(${q.L1})}{(${q.A1})(${g(E)})} = ${num(d1)}\,\mathrm{mm}`),
        ),
        tags: ["elongation", "stepped-bar"],
      });
    }
    const uL = d1 + d2;
    return numericStep({
      body,
      question: r`What is the displacement $u(L)$ of the free end, $L = L_1 + L_2$? Give it in mm (positive in $+x$) ${SF3}.`,
      answer: uL,
      floor: 0.0001,
      unit: U.mm,
      suffix: "mm",
      hint: r`Use free-body diagrams of the part of the bar to the right of a cut in each segment to find $R_1$ and $R_2$; each segment then changes length by $R_iL_i/(A_iE)$, and the end moves by the sum.`,
      explanation: paras(
        internal,
        r`Each segment changes length by $R_iL_i/(A_iE)$ (N, mm, $\mathrm{N/mm^2}$):`,
        dm(r`u(L) = \frac{R_1L_1}{A_1E} + \frac{R_2L_2}{A_2E} = \frac{(${num(R1, 6)})(${q.L1})}{(${q.A1})(${g(E)})} + \frac{(${num(R2, 6)})(${q.L2})}{(${q.A2})(${g(E)})} = ${num(d1)} + ${par(d2)} = ${num(uL)}\,\mathrm{mm}`),
      ),
      tags: ["elongation", "stepped-bar"],
    });
  },
});

define({
  id: "gen.sm.strain-from-u",
  unitId: "sm1",
  title: "Strain from a displacement field u(x)",
  make: (_seed, rng) => {
    const ask = pick(rng, ["point", "point", "average", "elongation"] as const);
    const q = draw(
      () => {
        const L = pick(rng, [200, 250, 300, 400, 500]);
        const n = L / 50;
        const i1 = randInt(rng, 0, n - 2);
        return {
          L,
          a: pick(rng, [0.4, 0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, -0.5, -1]),
          b: pick(rng, [0.001, 0.002, 0.0025, 0.004, 0.005, -0.001, -0.002]),
          x0: 50 * randInt(rng, 1, n),
          x1: 50 * i1,
          x2: 50 * randInt(rng, i1 + 2, n),
        };
      },
      (q) => {
        if (Math.max(Math.abs(q.a), Math.abs(q.a + 2 * q.b * q.L)) > 5) return false; // |ε| ≤ 5000 μ along the bar
        if (ask === "point") return Math.abs(q.a + 2 * q.b * q.x0) >= 0.1;
        if (ask === "average") return Math.abs(q.a + q.b * (q.x1 + q.x2)) >= 0.1;
        return Math.abs(q.a * q.L + q.b * q.L * q.L) >= 50;
      },
    );
    const { L, a, b } = q;
    const sgn = b < 0 ? "-" : "+";
    const u = (x: number) => (a * x + b * x * x) / 1000; // mm
    const body = paras(
      r`Measurements on a bar of length $L = ${L}\,\mathrm{mm}$, fixed at its left end $x = 0$, give the axial displacement`,
      dm(r`u(x) = \left(${mono(a, "x")} ${sgn} ${g(Math.abs(b))}\,x^2\right)\times 10^{-3}\,\mathrm{mm}`),
      r`with $x$ in mm measured from the fixed end.`,
    );
    if (ask === "point") {
      const e = 1000 * (a + 2 * b * q.x0); // μ
      return numericStep({
        body,
        question: r`What is the strain $\varepsilon = du/dx$ at $x = ${q.x0}\,\mathrm{mm}$? Give it in micro-strain ($10^{-6}$) ${SF3}.`,
        answer: e,
        floor: 0.05,
        unit: U.micro,
        suffix: "μ",
        hint: r`Strain at a point is the derivative of the displacement field. Differentiate $u(x)$, then substitute $x$; keep track of the $10^{-3}$ factor.`,
        explanation: paras(
          dm(r`\varepsilon(x) = \frac{du}{dx} = \left(${g(a)} ${sgn} ${g(2 * Math.abs(b))}\,x\right)\times 10^{-3}`),
          dm(r`\varepsilon(${q.x0}) = \left(${g(a)} ${sgn} ${g(2 * Math.abs(b))}\times ${q.x0}\right)\times 10^{-3} = ${num(e / 1000)}\times 10^{-3} = ${num(e)}\times 10^{-6}`),
          e > 0 ? "Positive: the material there is being stretched." : "Negative: the material there is being shortened.",
        ),
        tags: ["strain", "displacement"],
      });
    }
    if (ask === "average") {
      const avg = 1000 * (a + b * (q.x1 + q.x2)); // μ
      return numericStep({
        body,
        question: r`What is the average strain of the segment between $x_1 = ${q.x1}\,\mathrm{mm}$ and $x_2 = ${q.x2}\,\mathrm{mm}$? Give it in micro-strain ($10^{-6}$) ${SF3}.`,
        answer: avg,
        floor: 0.05,
        unit: U.micro,
        suffix: "μ",
        hint: r`The average strain of a segment is its change in length divided by its original length: evaluate $u$ at both ends of the segment.`,
        explanation: paras(
          dm(r`u(${q.x1}) = ${num(u(q.x1))}\,\mathrm{mm}, \qquad u(${q.x2}) = ${num(u(q.x2))}\,\mathrm{mm}`),
          dm(r`\bar\varepsilon = \frac{u(x_2) - u(x_1)}{x_2 - x_1} = \frac{${num(u(q.x2))} - ${par(u(q.x1))}}{${q.x2} - ${q.x1}} = ${num(avg)}\times 10^{-6}`),
          r`For this quadratic field the average equals $\left[${g(a)} ${sgn} ${g(Math.abs(b))}\,(x_1 + x_2)\right]\times 10^{-3}$, the strain at the segment's midpoint.`,
        ),
        tags: ["strain", "displacement"],
      });
    }
    const delta = u(L);
    return numericStep({
      body,
      question: r`What is the change in length of the whole bar? Give it in mm (elongation positive) ${SF3}.`,
      answer: delta,
      floor: 0.0001,
      unit: U.mm,
      suffix: "mm",
      hint: r`The change in length is the relative displacement of the two ends, $u(L) - u(0)$.`,
      explanation: paras(
        dm(r`\delta = u(L) - u(0) = \left(${g(a)}\times ${L} ${sgn} ${g(Math.abs(b))}\times ${L}^2\right)\times 10^{-3} - 0 = ${num(delta)}\,\mathrm{mm}`),
        r`Equivalently, integrate the strain along the bar: $\delta = \int_0^L \varepsilon\,dx$.`,
      ),
      tags: ["strain", "displacement"],
    });
  },
});

define({
  id: "gen.sm.thermal-bar",
  unitId: "sm1",
  title: "Thermal strain: free bar, rigid walls, or a gap",
  make: (_seed, rng) => {
    const kind = pick(rng, ["free", "walls", "gap", "gap", "close"] as const);
    const m = pick(rng, [STEEL, ALUMINUM, COPPER, BRASS]);
    const E = m.E * 1000; // MPa
    const a = m.alpha * 1e-6;
    const aTex = r`${g(m.alpha)}\times 10^{-6}`;
    const consts = constants(m, ["E", "alpha"]);
    if (kind === "free") {
      const L = pick(rng, [500, 800, 1000, 1500, 2000, 2500, 3000, 4000, 5000]);
      const dT = pick(rng, [15, 20, 25, 30, 40, 50, 60, 75, 80, 100]) * (rng() < 0.7 ? 1 : -1);
      const delta = a * dT * L;
      return numericStep({
        body: r`${cap(withArticle(m))} rod of length $L = ${g(L / 1000)}\,\mathrm{m}$ rests on frictionless supports and is free to expand. Its temperature ${dT > 0 ? "rises" : "drops"} by $${Math.abs(dT)}\,{}^\circ\mathrm{C}$. ${consts}.`,
        question: r`What is the change in length of the rod? Give it in mm (elongation positive) ${SF3}.`,
        answer: delta,
        floor: 0.0001,
        unit: U.mm,
        suffix: "mm",
        hint: r`Nothing resists the expansion, so $R = 0$ and the strain is purely thermal.`,
        explanation: paras(
          r`With $R = 0$ the stress is zero and $\varepsilon = \sigma/E + \alpha\,\Delta T = \alpha\,\Delta T$, uniform along the rod:`,
          dm(r`\delta = \alpha\,\Delta T\,L = (${aTex})(${par(dT)})(${g(L)}\,\mathrm{mm}) = ${num(delta)}\,\mathrm{mm}`),
          r`$E$ plays no role: a free bar changes length without any stress.`,
        ),
        tags: ["thermal"],
      });
    }
    if (kind === "walls") {
      const L = pick(rng, [500, 800, 1000, 1500, 2000, 3000]);
      const dT = draw(
        () => pick(rng, [10, 15, 20, 25, 30, 40, 50, 60, 75, 80]) * (rng() < 0.7 ? 1 : -1),
        (t) => E * a * Math.abs(t) <= 200,
      );
      const sigma = -E * a * dT;
      return numericStep({
        body: r`${cap(withArticle(m))} bar of length $L = ${g(L / 1000)}\,\mathrm{m}$ fits snugly, stress-free, between two rigid walls. Its temperature then ${dT > 0 ? "rises" : "drops"} by $${Math.abs(dT)}\,{}^\circ\mathrm{C}$. ${consts}.`,
        question: r`What is the axial stress in the bar after the temperature change? Give it in MPa (tension positive) ${SF3}.`,
        answer: sigma,
        floor: 0.05,
        unit: U.MPa,
        suffix: "MPa",
        hint: r`The walls keep the bar's length fixed, so the total strain $\varepsilon = \sigma/E + \alpha\,\Delta T$ must be zero.`,
        explanation: paras(
          r`Compatibility: the walls do not move, so $\delta = 0$ and the total strain vanishes, $\varepsilon = \sigma/E + \alpha\,\Delta T = 0$:`,
          dm(r`\sigma = -E\alpha\,\Delta T = -(${g(E)}\,\mathrm{MPa})(${aTex})(${par(dT)}) = ${num(sigma)}\,\mathrm{MPa}`),
          dT > 0
            ? r`Heating a constrained bar puts it in compression. The length $L$ cancels out.`
            : r`Cooling a constrained bar puts it in tension. The length $L$ cancels out.`,
        ),
        tags: ["thermal", "indeterminate"],
      });
    }
    const gapText = (L: number, gap: number) =>
      r`${cap(withArticle(m))} bar of length $L = ${L}\,\mathrm{mm}$ is attached to a rigid wall at its left end. At room temperature there is a gap $g = ${g(gap)}\,\mathrm{mm}$ between its right end and a second rigid wall.`;
    if (kind === "close") {
      const q = draw(
        () => ({ L: pick(rng, [500, 750, 1000, 1500, 2000, 2500]), gap: pick(rng, [0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1, 1.2, 1.5]) }),
        (q) => q.gap / (a * q.L) >= 5 && q.gap / (a * q.L) <= 150,
      );
      const dT = q.gap / (a * q.L);
      return numericStep({
        body: r`${gapText(q.L, q.gap)} ${consts}.`,
        question: r`By how much must the bar's temperature rise for the gap to just close? Give $\Delta T$ in °C ${SF3}.`,
        answer: dT,
        floor: 0.005,
        unit: U.degC,
        suffix: "°C",
        hint: r`The gap closes when the free thermal elongation of the bar equals the gap.`,
        explanation: dm(r`\alpha\,\Delta T\,L = g \;\Rightarrow\; \Delta T = \frac{g}{\alpha L} = \frac{${g(q.gap)}\,\mathrm{mm}}{(${aTex})(${q.L}\,\mathrm{mm})} = ${num(dT)}\,{}^\circ\mathrm{C}`),
        tags: ["thermal"],
      });
    }
    const closes = rng() < 0.8;
    const q = draw(
      () => ({
        L: pick(rng, [500, 750, 1000, 1500, 2000]),
        gap: pick(rng, [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 1]),
        dT: pick(rng, [20, 30, 40, 50, 60, 75, 80, 100]),
      }),
      (q) => {
        const free = a * q.dT * q.L;
        if (!closes) return free <= 0.9 * q.gap && free >= 0.3 * q.gap;
        const s = E * (a * q.dT - q.gap / q.L);
        return free > q.gap && s >= 10 && s <= 200;
      },
    );
    const free = a * q.dT * q.L;
    const closed = free > q.gap;
    const sigma = closed ? -E * (a * q.dT - q.gap / q.L) : 0;
    const freeTex = r`\delta_T = \alpha\,\Delta T\,L = (${aTex})(${q.dT})(${q.L}\,\mathrm{mm}) = ${num(free)}\,\mathrm{mm}`;
    return numericStep({
      body: r`${gapText(q.L, q.gap)} The bar is then heated by $${q.dT}\,{}^\circ\mathrm{C}$. ${consts}.`,
      question: r`What is the axial stress in the bar after heating? Give it in MPa (tension positive; enter 0 if the bar is stress-free) ${SF3}.`,
      answer: sigma,
      floor: 0.05,
      unit: U.MPa,
      suffix: "MPa",
      hint: r`First compare the free thermal expansion $\alpha\,\Delta T\,L$ with the gap. If the gap closes, the bar's final elongation must equal the gap: $\sigma L/E + \alpha\,\Delta T\,L = g$.`,
      explanation: closed
        ? paras(
            dm(r`${freeTex} > g = ${g(q.gap)}\,\mathrm{mm}`),
            r`so the gap closes and the second wall pushes back. Compatibility: the bar's total elongation equals the gap,`,
            dm(r`\frac{\sigma L}{E} + \alpha\,\Delta T\,L = g \;\Rightarrow\; \sigma = -E\left(\alpha\,\Delta T - \frac{g}{L}\right)`),
            dm(r`\sigma = -(${g(E)})\left(${num(a * q.dT)} - \frac{${g(q.gap)}}{${q.L}}\right) = -(${g(E)})(${num(a * q.dT - q.gap / q.L)}) = ${num(sigma)}\,\mathrm{MPa}`),
            "Negative: the bar is in compression.",
          )
        : paras(
            dm(r`${freeTex} < g = ${g(q.gap)}\,\mathrm{mm}`),
            r`The bar never reaches the second wall, so nothing resists the expansion: $R = 0$ and $\sigma = 0$.`,
          ),
      tags: ["thermal", "indeterminate"],
    });
  },
});

define({
  id: "gen.sm.indeterminate-bar",
  unitId: "sm1",
  title: "Bar fixed at both ends with an interior load",
  make: (_seed, rng) => {
    const ask = pick(rng, ["left", "right", "stress-right", "stress-left", "u"] as const);
    const m = pick(rng, [STEEL, STEEL, ALUMINUM]);
    const E = m.E * 1000; // N/mm²
    const lim = m === STEEL ? 250 : 150;
    const L = pick(rng, [600, 900, 1200, 1500, 1800, 2400]);
    const [fn, fd] = pick(rng, [[1, 4], [1, 3], [1, 2], [2, 3], [3, 4]] as const);
    const a = (L * fn) / fd;
    const dir = rng() < 0.7 ? 1 : -1;
    const q = draw(
      () => ({ A: pick(rng, [200, 250, 300, 400, 500, 600, 800]), P: pick(rng, [10, 20, 30, 40, 50, 60, 80, 100, 120]) }),
      (q) =>
        (q.P * 1000 * Math.max(a, L - a)) / L / q.A <= lim &&
        (q.P * 1000 * Math.min(a, L - a)) / L / q.A >= 10 &&
        (ask !== "u" || (q.P * 1000 * (L - a) * a) / (L * q.A * E) >= 0.05),
    );
    const P = dir * q.P; // kN, positive in +x
    const R1 = (P * (L - a)) / L; // kN, internal force in 0 < x < a
    const R2 = R1 - P; // kN, internal force in a < x < L (= −P a/L)
    const solve = paras(
      r`One equilibrium equation, two wall reactions: the bar is statically indeterminate. Take $P = ${P}\,\mathrm{kN}$ (positive in $+x$) and let $R_1$ be the internal force in $0 < x < a$. A free-body diagram cut on either side of the load gives $R_2 = R_1 - P$ in $a < x < L$. Compatibility: the ends cannot move, so the segment elongations add up to zero:`,
      dm(r`\frac{R_1\,a}{AE} + \frac{(R_1 - P)(L - a)}{AE} = 0 \;\Rightarrow\; R_1 = P\,\frac{L - a}{L}, \qquad R_2 = R_1 - P = -P\,\frac{a}{L}`),
      dm(r`R_1 = (${P})\,\frac{${L - a}}{${L}} = ${num(R1)}\,\mathrm{kN}, \qquad R_2 = ${num(R1)} - ${par(P)} = ${num(R2)}\,\mathrm{kN}`),
    );
    const body = r`A uniform ${m.name} bar of length $L = ${L}\,\mathrm{mm}$ (area $A = ${q.A}\,\mathrm{mm^2}$, $E = ${m.E}\,\mathrm{GPa}$) is fixed to rigid walls at both ends, $x = 0$ and $x = L$. An axial force $P = ${q.P}\,\mathrm{kN}$ acts at $x = a = ${a}\,\mathrm{mm}$, ${dirText(dir, "to the right", "to the left")}.`;
    const hint = r`Equilibrium alone cannot split $P$ between the walls. Let $R_1$ be the internal force left of the load, so $R_2 = R_1 - P$ to its right, and require the two segment elongations to add up to zero.`;
    const tags = ["indeterminate", "compatibility"];
    if (ask === "left" || ask === "right") {
      const left = ask === "left";
      const F = left ? -R1 : R2; // force the wall exerts on the bar, + in +x
      return numericStep({
        body,
        question: r`What is the magnitude of the reaction force at the ${left ? "left wall ($x = 0$)" : "right wall ($x = L$)"}? Give it in kN ${SF3}.`,
        answer: Math.abs(F),
        floor: 0.005,
        unit: U.kN,
        suffix: "kN",
        hint,
        explanation: paras(
          solve,
          r`The ${left ? "left" : "right"} wall exerts ${left ? r`$-R_1$` : r`$R_2$`} $= ${num(F)}\,\mathrm{kN}$ on the bar (${F > 0 ? r`pointing in $+x$` : r`pointing in $-x$`}), so the magnitude is $${num(Math.abs(F))}\,\mathrm{kN}$. Each wall's share is proportional to the length of the *opposite* segment: the wall nearer the load carries more.`,
        ),
        tags,
      });
    }
    if (ask === "u") {
      const u = (R1 * 1000 * a) / (q.A * E);
      return numericStep({
        body,
        question: r`How far does the loaded point move? Give $u(a)$ in mm (positive in $+x$) ${SF3}.`,
        answer: u,
        floor: 0.0001,
        unit: U.mm,
        suffix: "mm",
        hint,
        explanation: paras(
          solve,
          r`The loaded point moves by the elongation of the left segment (N, mm, $\mathrm{N/mm^2}$):`,
          dm(r`u(a) = \frac{R_1\,a}{AE} = \frac{(${num(R1 * 1000, 6)})(${a})}{(${q.A})(${g(E)})} = ${num(u)}\,\mathrm{mm}`),
        ),
        tags,
      });
    }
    const right = ask === "stress-right";
    const R = right ? R2 : R1;
    const sigma = (R * 1000) / q.A;
    return numericStep({
      body,
      question: r`What is the normal stress in the segment between ${right ? r`the load and the right wall ($a < x < L$)` : r`the left wall and the load ($0 < x < a$)`}? Give it in MPa (tension positive) ${SF3}.`,
      answer: sigma,
      floor: 0.05,
      unit: U.MPa,
      suffix: "MPa",
      hint,
      explanation: paras(
        solve,
        dm(r`\sigma_${right ? 2 : 1} = \frac{R_${right ? 2 : 1}}{A} = \frac{${num(R * 1000, 6)}\,\mathrm{N}}{${q.A}\,\mathrm{mm^2}} = ${num(sigma)}\,\mathrm{MPa}`),
        sigma > 0 ? "Positive: that segment is stretched." : "Negative: that segment is compressed.",
      ),
      tags,
    });
  },
});

define({
  id: "gen.sm.design-diameter",
  unitId: "sm1",
  title: "Size a tie rod for strength and stiffness",
  make: (_seed, rng) => {
    const ask = pick(rng, ["d", "d", "area", "load"] as const);
    const m = pick(rng, [STEEL, STEEL, ALUMINUM]);
    const E = m.E * 1000; // N/mm²
    const q = draw(
      () => ({
        P: pick(rng, [20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150]),
        L: pick(rng, [1000, 1500, 2000, 2500, 3000, 4000]),
        sA: pick(rng, m === STEEL ? [120, 140, 150, 160, 180, 200] : [80, 90, 100, 120]),
        dA: pick(rng, [0.5, 0.75, 1, 1.2, 1.5, 2, 2.5, 3]),
        d: pick(rng, [12, 16, 20, 25, 30, 40]),
      }),
      (q) => {
        const ratio = (q.sA * q.L) / (E * q.dA); // (area needed for stiffness) / (area needed for strength)
        return ratio > 0.4 && ratio < 2.5 && Math.abs(ratio - 1) > 0.08;
      },
    );
    const limits = r`The normal stress may not exceed $\sigma_{\text{allow}} = ${q.sA}\,\mathrm{MPa}$ and the rod may stretch by at most $\delta_{\text{allow}} = ${g(q.dA)}\,\mathrm{mm}$. ${constants(m, ["E"])}.`;
    if (ask === "load") {
      const A = (Math.PI * q.d * q.d) / 4;
      const Ps = (q.sA * A) / 1000; // kN
      const Pd = (q.dA * A * E) / q.L / 1000; // kN
      const P = Math.min(Ps, Pd);
      return numericStep({
        body: r`${cap(withArticle(m))} tie rod of diameter $d = ${q.d}\,\mathrm{mm}$ and length $L = ${g(q.L / 1000)}\,\mathrm{m}$ is loaded in axial tension. ${limits}`,
        question: r`What is the largest load $P$ the rod may carry? Give it in kN ${SF3}.`,
        answer: P,
        floor: 0.005,
        unit: U.kN,
        suffix: "kN",
        hint: r`Each requirement gives its own maximum load — one from $\sigma = P/A$, one from $\delta = PL/(AE)$. The rod must satisfy both.`,
        explanation: paras(
          dm(r`A = \frac{\pi d^2}{4} = ${num(A)}\,\mathrm{mm^2}`),
          r`**Strength:** $P \le \sigma_{\text{allow}}A = (${q.sA})(${num(A)}) = ${num(Ps * 1000)}\,\mathrm{N} = ${num(Ps)}\,\mathrm{kN}$.`,
          r`**Stiffness:** $P \le \delta_{\text{allow}}AE/L = (${g(q.dA)})(${num(A)})(${g(E)})/${g(q.L)} = ${num(Pd * 1000)}\,\mathrm{N} = ${num(Pd)}\,\mathrm{kN}$.`,
          r`Both must hold, so the smaller value governs (${Pd < Ps ? "stiffness" : "strength"}): $P_{\max} = ${num(P)}\,\mathrm{kN}$.`,
        ),
        tags: ["design", "elongation"],
      });
    }
    const N = q.P * 1000;
    const As = N / q.sA;
    const Ad = (N * q.L) / (E * q.dA);
    const ds = Math.sqrt((4 * As) / Math.PI);
    const dd = Math.sqrt((4 * Ad) / Math.PI);
    const stiff = Ad > As;
    const isD = ask === "d";
    const answer = isD ? Math.max(ds, dd) : Math.max(As, Ad);
    return numericStep({
      body: r`${cap(withArticle(m))} tie rod of length $L = ${g(q.L / 1000)}\,\mathrm{m}$ must carry an axial tensile load $P = ${q.P}\,\mathrm{kN}$. ${limits}`,
      question: isD
        ? r`What is the minimum diameter $d$ of a solid round rod that meets both requirements? Give it in mm ${SF3}.`
        : r`What is the minimum cross-sectional area that meets both requirements? Give it in $\mathrm{mm^2}$ ${SF3}.`,
      answer,
      floor: isD ? 0.001 : 0.05,
      unit: isD ? U.mm : U.mm2,
      suffix: isD ? "mm" : "mm²",
      hint: r`Each requirement gives its own minimum area — one from $\sigma = P/A \le \sigma_{\text{allow}}$, one from $\delta = PL/(AE) \le \delta_{\text{allow}}$. The rod must satisfy both.`,
      explanation: paras(
        r`**Strength:** $A \ge P/\sigma_{\text{allow}} = ${g(N)}/${q.sA} = ${num(As)}\,\mathrm{mm^2}$, i.e. $d \ge \sqrt{4P/(\pi\sigma_{\text{allow}})} = ${num(ds)}\,\mathrm{mm}$.`,
        r`**Stiffness:** $A \ge PL/(E\,\delta_{\text{allow}}) = (${g(N)})(${g(q.L)})/\left[(${g(E)})(${g(q.dA)})\right] = ${num(Ad)}\,\mathrm{mm^2}$, i.e. $d \ge \sqrt{4PL/(\pi E\,\delta_{\text{allow}})} = ${num(dd)}\,\mathrm{mm}$.`,
        isD
          ? r`Both must hold, so the larger requirement governs (${stiff ? "stiffness" : "strength"}): $d_{\min} = ${num(answer)}\,\mathrm{mm}$.`
          : r`Both must hold, so the larger requirement governs (${stiff ? "stiffness" : "strength"}): $A_{\min} = ${num(answer)}\,\mathrm{mm^2}$.`,
      ),
      tags: ["design", "elongation"],
    });
  },
});

define({
  id: "gen.sm.strain-energy",
  unitId: "sm1",
  title: "Strain energy stored in an axial bar",
  make: (_seed, rng) => {
    const ask = pick(rng, ["PL", "PL", "Pdelta", "density", "stepped", "deflection"] as const);
    const m = pick(rng, [STEEL, ALUMINUM, COPPER]);
    const E = m.E * 1000; // N/mm²
    const lim = m === STEEL ? 250 : 150;
    if (ask === "Pdelta") {
      const P = pick(rng, [10, 20, 25, 30, 40, 50, 60, 80, 100]);
      const d = pick(rng, [0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2, 2.5, 3]);
      const W = 0.5 * P * d; // kN·mm = J
      return numericStep({
        body: r`A linear-elastic bar is loaded slowly from zero up to an axial force $P = ${P}\,\mathrm{kN}$; its loaded end moves $\delta = ${g(d)}\,\mathrm{mm}$ in the direction of the force.`,
        question: r`How much strain energy is stored in the bar? Give it in J ${SF3}.`,
        answer: W,
        floor: 0.001,
        unit: U.J,
        suffix: "J",
        hint: r`For a slowly applied load the force–displacement graph is a straight line from the origin; the work done is the area under it, and it is all stored.`,
        explanation: paras(
          dm(r`W_{\text{in}} = \tfrac12 P\delta = \tfrac12(${g(P * 1000)}\,\mathrm{N})(${g(d)}\,\mathrm{mm}) = ${num(W * 1000)}\,\mathrm{N\cdot mm} = ${num(W)}\,\mathrm{J}`),
          r`All of this work is stored as strain energy ($W_{\text{in}} = W_{\text{stored}}$); $1\,\mathrm{J} = 1000\,\mathrm{N\cdot mm}$.`,
        ),
        tags: ["energy"],
      });
    }
    if (ask === "deflection") {
      const q = draw(
        () => ({ W: pick(rng, [2, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50]), P: pick(rng, [10, 20, 25, 30, 40, 50, 60, 80, 100]) }),
        (q) => (2 * q.W) / q.P >= 0.05 && (2 * q.W) / q.P <= 10,
      );
      const d = (2 * q.W) / q.P; // J/kN = mm
      return numericStep({
        body: r`A slowly applied axial force $P = ${q.P}\,\mathrm{kN}$ at the end of a linear-elastic bar leaves $U = ${q.W}\,\mathrm{J}$ of strain energy stored in it.`,
        question: r`Using $W_{\text{in}} = W_{\text{stored}}$, find the deflection $\delta$ of the loaded end in the direction of the force. Give it in mm ${SF3}.`,
        answer: d,
        floor: 0.0001,
        unit: U.mm,
        suffix: "mm",
        hint: r`The work done by a slowly applied force on a linear-elastic body is $\tfrac12 P\delta$. Work in N and mm ($1\,\mathrm{J} = 1000\,\mathrm{N\cdot mm}$).`,
        explanation: dm(r`\tfrac12 P\delta = U \;\Rightarrow\; \delta = \frac{2U}{P} = \frac{2(${g(q.W * 1000)}\,\mathrm{N\cdot mm})}{${g(q.P * 1000)}\,\mathrm{N}} = ${num(d)}\,\mathrm{mm}`),
        tags: ["energy"],
      });
    }
    if (ask === "density") {
      const s = draw(() => pick(rng, [40, 50, 60, 80, 100, 120, 150, 200]), (s) => s <= lim);
      const w = (s * s) / (2 * E); // N·mm/mm³ = MJ/m³
      return numericStep({
        body: r`${cap(withArticle(m))} bar (${constants(m, ["E"])}) is in uniform uniaxial tension at $\sigma = ${s}\,\mathrm{MPa}$.`,
        question: r`What is the strain-energy density $w$ (energy stored per unit volume)? Give it in $\mathrm{kJ/m^3}$ ${SF3}.`,
        answer: w * 1000,
        floor: 0.001,
        unit: U.kJm3,
        suffix: "kJ/m³",
        hint: r`For a linear-elastic material $w = \tfrac12\sigma\varepsilon$ with $\varepsilon = \sigma/E$. Note $1\,\mathrm{N\cdot mm/mm^3} = 1\,\mathrm{MJ/m^3}$.`,
        explanation: paras(
          dm(r`w = \tfrac12\sigma\varepsilon = \frac{\sigma^2}{2E} = \frac{(${s}\,\mathrm{MPa})^2}{2(${g(E)}\,\mathrm{MPa})} = ${num(w)}\,\mathrm{N\cdot mm/mm^3}`),
          r`and $1\,\mathrm{N\cdot mm/mm^3} = 1\,\mathrm{MJ/m^3} = 1000\,\mathrm{kJ/m^3}$, so $w = ${num(w * 1000)}\,\mathrm{kJ/m^3}$.`,
        ),
        tags: ["energy"],
      });
    }
    const areas = [100, 150, 200, 250, 300, 400, 500, 600, 800, 1000];
    const lens = [500, 750, 1000, 1500, 2000, 2500, 3000, 4000];
    if (ask === "stepped") {
      const q = draw(
        () => ({
          P: pick(rng, [10, 15, 20, 25, 30, 40, 50, 60, 80, 100]),
          L1: pick(rng, lens),
          L2: pick(rng, lens),
          A1: pick(rng, areas),
          A2: pick(rng, areas),
        }),
        (q) => {
          const N = q.P * 1000;
          const W = ((N * N) / (2 * E)) * (q.L1 / q.A1 + q.L2 / q.A2) / 1000;
          return q.A1 !== q.A2 && N / Math.min(q.A1, q.A2) <= lim && N / Math.max(q.A1, q.A2) >= 20 && W >= 0.1 && W <= 5000;
        },
      );
      const N = q.P * 1000;
      const W1 = (N * N * q.L1) / (2 * q.A1 * E);
      const W2 = (N * N * q.L2) / (2 * q.A2 * E);
      const W = (W1 + W2) / 1000; // J
      return numericStep({
        body: r`${cap(withArticle(m))} bar (${constants(m, ["E"])}) fixed at one end consists of two segments: $L_1 = ${q.L1}\,\mathrm{mm}$ with $A_1 = ${q.A1}\,\mathrm{mm^2}$, and $L_2 = ${q.L2}\,\mathrm{mm}$ with $A_2 = ${q.A2}\,\mathrm{mm^2}$. An axial force $P = ${q.P}\,\mathrm{kN}$ is applied slowly at the free end.`,
        question: r`How much strain energy is stored in the bar? Give it in J ${SF3}.`,
        answer: W,
        floor: 0.001,
        unit: U.J,
        suffix: "J",
        hint: r`Both segments carry the same internal force. Add the energy $R^2L_i/(2A_iE)$ stored in each.`,
        explanation: paras(
          r`Every cut carries $R = P = ${g(N)}\,\mathrm{N}$, so (N, mm, $\mathrm{N/mm^2}$)`,
          dm(r`U = \frac{P^2}{2E}\left(\frac{L_1}{A_1} + \frac{L_2}{A_2}\right) = \frac{(${g(N)})^2}{2(${g(E)})}\left(\frac{${q.L1}}{${q.A1}} + \frac{${q.L2}}{${q.A2}}\right) = ${num(W1)} + ${num(W2)} = ${num(W1 + W2)}\,\mathrm{N\cdot mm}`),
          r`so $U = ${num(W)}\,\mathrm{J}$ ($1\,\mathrm{J} = 1000\,\mathrm{N\cdot mm}$). The thinner segment, with the higher stress, stores more energy per unit length.`,
        ),
        tags: ["energy", "stepped-bar"],
      });
    }
    const q = draw(
      () => ({ P: pick(rng, [10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120]), L: pick(rng, lens), A: pick(rng, areas) }),
      (q) => {
        const N = q.P * 1000;
        const W = (N * N * q.L) / (2 * q.A * E) / 1000;
        return N / q.A >= 30 && N / q.A <= lim && W >= 0.1 && W <= 5000;
      },
    );
    const N = q.P * 1000;
    const Wn = (N * N * q.L) / (2 * q.A * E); // N·mm
    return numericStep({
      body: r`A uniform ${m.name} bar of length $L = ${g(q.L / 1000)}\,\mathrm{m}$ and cross-sectional area $A = ${q.A}\,\mathrm{mm^2}$ (${constants(m, ["E"])}) carries an axial force $P = ${q.P}\,\mathrm{kN}$, applied slowly.`,
      question: r`How much strain energy is stored in the bar? Give it in J ${SF3}.`,
      answer: Wn / 1000,
      floor: 0.001,
      unit: U.J,
      suffix: "J",
      hint: r`Integrate the energy density $\sigma^2/(2E)$ over the volume — for a uniform bar this gives $P^2L/(2AE)$. Work in N and mm, then convert ($1\,\mathrm{J} = 1000\,\mathrm{N\cdot mm}$).`,
      explanation: paras(
        dm(r`U = \frac{P^2L}{2AE} = \frac{(${g(N)}\,\mathrm{N})^2(${g(q.L)}\,\mathrm{mm})}{2(${q.A}\,\mathrm{mm^2})(${g(E)}\,\mathrm{N/mm^2})} = ${num(Wn)}\,\mathrm{N\cdot mm} = ${num(Wn / 1000)}\,\mathrm{J}`),
        r`Check: this equals $W_{\text{in}} = \tfrac12 P\delta$ with $\delta = PL/(AE)$.`,
      ),
      tags: ["energy"],
    });
  },
});

/* ------------------------------------------------------------------ */
/* sm2 — stress                                                        */
/* ------------------------------------------------------------------ */

define({
  id: "gen.sm.average-shear",
  unitId: "sm2",
  title: "Average shear stress in pins, bolts and punched plates",
  make: (_seed, rng) => {
    const ask = pick(rng, ["tau", "tau", "diameter", "punch"] as const);
    if (ask === "punch") {
      const q = draw(
        () => ({ t: pick(rng, [2, 3, 4, 5, 6, 8, 10]), d: pick(rng, [10, 12, 15, 20, 25, 30, 40, 50]), tu: pick(rng, [250, 300, 350, 400]) }),
        (q) => (q.tu * Math.PI * q.d * q.t) / 1000 <= 1500,
      );
      const As = Math.PI * q.d * q.t;
      const F = (q.tu * As) / 1000; // kN
      return numericStep({
        body: r`A punch press makes a round hole of diameter $d = ${q.d}\,\mathrm{mm}$ in a steel plate of thickness $t = ${q.t}\,\mathrm{mm}$. The plate shears through when the average shear stress on the surface around the slug reaches its ultimate shear strength $\tau_u = ${q.tu}\,\mathrm{MPa}$.`,
        question: r`What punching force is required? Give it in kN ${SF3}.`,
        answer: F,
        floor: 0.005,
        unit: U.kN,
        suffix: "kN",
        hint: r`The slug is pushed out along a cylindrical surface. The area resisting the punch is the lateral area of that cylinder, not the area of the hole.`,
        explanation: paras(
          dm(r`A_{\text{shear}} = \pi d\,t = \pi(${q.d})(${q.t}) = ${num(As)}\,\mathrm{mm^2}`),
          dm(r`F = \tau_u\,A_{\text{shear}} = (${q.tu}\,\mathrm{N/mm^2})(${num(As)}\,\mathrm{mm^2}) = ${num(F * 1000)}\,\mathrm{N} = ${num(F)}\,\mathrm{kN}`),
        ),
        tags: ["shear-stress", "design"],
      });
    }
    const n = rng() < 0.5 ? 2 : 1;
    const part = n === 2 ? "pin" : "bolt";
    const setting =
      n === 2
        ? r`A clevis pin holds a link between the two prongs of a clevis, so the pin is cut by **two** shear planes (double shear).`
        : r`A single bolt joins two overlapping plates, so the bolt is cut by **one** shear plane (single shear).`;
    if (ask === "diameter") {
      const q = draw(
        () => ({ F: pick(rng, [5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100]), ta: pick(rng, [50, 60, 75, 80, 90, 100, 120, 150]) }),
        (q) => {
          const d = Math.sqrt((4 * q.F * 1000) / (n * Math.PI * q.ta));
          return d >= 5 && d <= 60;
        },
      );
      const N = q.F * 1000;
      const d = Math.sqrt((4 * N) / (n * Math.PI * q.ta));
      return numericStep({
        body: r`${setting} The connection must transmit $F = ${q.F}\,\mathrm{kN}$, and the average shear stress in the ${part} may not exceed $\tau_{\text{allow}} = ${q.ta}\,\mathrm{MPa}$.`,
        question: r`What is the smallest allowable ${part} diameter? Give it in mm ${SF3}.`,
        answer: d,
        floor: 0.001,
        unit: U.mm,
        suffix: "mm",
        hint: r`Each shear plane carries an equal share of $F$ over the ${part}'s cross-section $\pi d^2/4$. Require that average shear stress to be at most $\tau_{\text{allow}}$.`,
        explanation: paras(
          r`With $n = ${n}$ shear plane${n === 2 ? "s" : ""}, each carries $F/n$:`,
          dm(r`\frac{F/n}{\pi d^2/4} \le \tau_{\text{allow}} \;\Rightarrow\; d \ge \sqrt{\frac{4F}{n\pi\,\tau_{\text{allow}}}} = \sqrt{\frac{4(${g(N)})}{${n}\pi(${q.ta})}} = ${num(d)}\,\mathrm{mm}`),
        ),
        tags: ["shear-stress", "design"],
      });
    }
    const q = draw(
      () => ({ d: pick(rng, [8, 10, 12, 16, 20, 25, 30]), F: pick(rng, [5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100]) }),
      (q) => {
        const t = (q.F * 1000) / ((n * Math.PI * q.d * q.d) / 4);
        return t >= 20 && t <= 300;
      },
    );
    const N = q.F * 1000;
    const A = (Math.PI * q.d * q.d) / 4;
    const tau = N / (n * A);
    return numericStep({
      body: r`${setting} The ${part} has diameter $d = ${q.d}\,\mathrm{mm}$ and the connection transmits a force $F = ${q.F}\,\mathrm{kN}$.`,
      question: r`What is the average shear stress in the ${part}? Give it in MPa ${SF3}.`,
      answer: tau,
      floor: 0.05,
      unit: U.MPa,
      suffix: "MPa",
      hint: r`Count the shear planes the ${part} is cut by: each carries an equal share of $F$. Divide that share by the area of one plane, the ${part}'s cross-section.`,
      explanation: paras(
        r`With $n = ${n}$ shear plane${n === 2 ? "s" : ""}, each carries $F/n$ over the area $A = \pi d^2/4 = ${num(A)}\,\mathrm{mm^2}$:`,
        dm(r`\tau = \frac{F/n}{A} = \frac{${g(N)}\,\mathrm{N}/${n}}{${num(A)}\,\mathrm{mm^2}} = ${num(tau)}\,\mathrm{MPa}`),
      ),
      tags: ["shear-stress"],
    });
  },
});

define({
  id: "gen.sm.oblique-cut",
  unitId: "sm2",
  title: "Normal and shear stress on an inclined section cut",
  make: (_seed, rng) => {
    const ask = pick(rng, ["sigma", "sigma", "tau", "tau", "taumax", "scarf"] as const);
    const theta = pick(rng, [30, 45, 60]);
    const th = (theta * Math.PI) / 180;
    const s = Math.sin(th);
    const c = Math.cos(th);
    const b = pick(rng, [20, 25, 30, 40, 50]);
    const h = pick(rng, [20, 25, 30, 40, 50, 60, 80]);
    const A0 = b * h;
    const geometry = paras(
      r`With $\theta$ measured between the cut and the bar axis, the cut has normal $\mathbf{n} = \sin\theta\,\mathbf{e}_x + \cos\theta\,\mathbf{e}_y$ and area $A_0/\sin\theta$. The force components are $F_n = F\sin\theta$ and $F_t = -F\cos\theta$, so`,
      dm(r`\sigma = \frac{F_n}{A_0/\sin\theta} = \frac{F}{A_0}\sin^2\theta, \qquad \tau = \frac{F_t}{A_0/\sin\theta} = -\frac{F}{A_0}\sin\theta\cos\theta`),
    );
    const extremes = r`Over all cuts, $|\tau|$ is largest, $F/(2A_0)$, at $\theta = 45^\circ$, and $\sigma$ is largest, $F/A_0$, at $\theta = 90^\circ$ (the ordinary cross-section).`;
    if (ask === "scarf") {
      const q = draw(
        () => ({ sa: pick(rng, [5, 6, 8, 10, 12, 15]), ta: pick(rng, [3, 4, 5, 6, 8]) }),
        (q) => Math.abs((q.sa / (s * s)) / (q.ta / (s * c)) - 1) > 0.05,
      );
      const Fs = (q.sa * A0) / (s * s) / 1000; // kN
      const Ft = (q.ta * A0) / (s * c) / 1000; // kN
      const F = Math.min(Fs, Ft);
      return numericStep({
        body: r`Two bars with a $${b}\,\mathrm{mm}\times ${h}\,\mathrm{mm}$ cross-section ($A_0 = ${A0}\,\mathrm{mm^2}$) are glued end to end along a scarf joint: the glue plane makes an angle $\theta = ${theta}^\circ$ with the bar axis. The glue can safely carry a normal (tensile) stress of $${q.sa}\,\mathrm{MPa}$ and a shear stress of $${q.ta}\,\mathrm{MPa}$. The joined bar is pulled in axial tension by a force $F$.`,
        question: r`What is the largest force $F$ the joint can carry? Give it in kN ${SF3}.`,
        answer: F,
        floor: 0.005,
        unit: U.kN,
        suffix: "kN",
        hint: r`Find the normal and the shear stress on the glue plane as functions of $F$ (the plane is an oblique cut at angle $\theta$ to the axis). Each must stay within its limit.`,
        explanation: paras(
          geometry,
          r`**Normal limit:** $F \le ${q.sa}A_0/\sin^2\theta = (${q.sa})(${A0})/${num(s * s)} = ${num(Fs * 1000)}\,\mathrm{N} = ${num(Fs)}\,\mathrm{kN}$.`,
          r`**Shear limit:** $F \le ${q.ta}A_0/(\sin\theta\cos\theta) = (${q.ta})(${A0})/${num(s * c)} = ${num(Ft * 1000)}\,\mathrm{N} = ${num(Ft)}\,\mathrm{kN}$.`,
          r`The smaller governs (${Fs < Ft ? "normal stress" : "shear stress"}): $F_{\max} = ${num(F)}\,\mathrm{kN}$.`,
        ),
        tags: ["oblique-cut", "design"],
      });
    }
    const tension = ask === "taumax" || rng() < 0.65;
    const Fmag = draw(
      () => pick(rng, [20, 30, 40, 50, 60, 80, 100, 120, 150, 200]),
      (F) => (F * 1000) / A0 >= 20 && (F * 1000) / A0 <= 250,
    );
    const F = (tension ? 1 : -1) * Fmag * 1000; // N
    const nominal = F / A0; // MPa
    const bar = r`A bar with a $${b}\,\mathrm{mm}\times ${h}\,\mathrm{mm}$ cross-section ($A_0 = ${A0}\,\mathrm{mm^2}$) carries an axial ${tension ? "tensile" : "compressive"} force of $${Fmag}\,\mathrm{kN}$`;
    if (ask === "taumax") {
      const t = Math.abs(nominal) / 2;
      return numericStep({
        body: r`${bar}.`,
        question: r`What is the largest average shear stress magnitude on any plane section cut through the bar? Give it in MPa ${SF3}.`,
        answer: t,
        floor: 0.05,
        unit: U.MPa,
        suffix: "MPa",
        hint: r`On a cut at angle $\theta$ to the axis, $|\tau| = (F/A_0)\sin\theta\cos\theta$. Which angle maximises it?`,
        explanation: paras(
          geometry,
          r`$\sin\theta\cos\theta = \tfrac12\sin 2\theta$ is largest, $\tfrac12$, at $\theta = 45^\circ$, so`,
          dm(r`|\tau|_{\max} = \frac{F}{2A_0} = \frac{${g(Fmag * 1000)}\,\mathrm{N}}{2(${A0}\,\mathrm{mm^2})} = ${num(t)}\,\mathrm{MPa}`),
          r`half of the cross-sectional stress $F/A_0 = ${num(Math.abs(nominal))}\,\mathrm{MPa}$. This is why ductile metals, which fail in shear, show 45° slip bands in a tension test.`,
        ),
        tags: ["oblique-cut"],
      });
    }
    const cut = r`. Consider a plane section cut that makes an angle $\theta = ${theta}^\circ$ with the bar axis (so $\theta = 90^\circ$ would be the ordinary cross-section).`;
    if (ask === "sigma") {
      const sigma = nominal * s * s;
      return numericStep({
        body: bar + cut,
        question: r`What is the average normal stress on this cut? Give it in MPa (tension positive) ${SF3}.`,
        answer: sigma,
        floor: 0.05,
        unit: U.MPa,
        suffix: "MPa",
        hint: r`Resolve $F$ into components normal and tangent to the cut, and remember that the inclined cut is larger than the cross-section: its area is $A_0/\sin\theta$.`,
        explanation: paras(
          geometry,
          dm(r`\frac{F}{A_0} = \frac{${num(F, 6)}\,\mathrm{N}}{${A0}\,\mathrm{mm^2}} = ${num(nominal)}\,\mathrm{MPa}, \qquad \sigma = (${num(nominal)})\sin^2 ${theta}^\circ = (${num(nominal)})(${num(s * s)}) = ${num(sigma)}\,\mathrm{MPa}`),
          extremes,
        ),
        tags: ["oblique-cut"],
      });
    }
    const tau = Math.abs(nominal) * s * c;
    return numericStep({
      body: bar + cut,
      question: r`What is the magnitude of the average shear stress on this cut? Give it in MPa ${SF3}.`,
      answer: tau,
      floor: 0.05,
      unit: U.MPa,
      suffix: "MPa",
      hint: r`Resolve $F$ into components normal and tangent to the cut, and remember that the inclined cut is larger than the cross-section: its area is $A_0/\sin\theta$.`,
      explanation: paras(
        geometry,
        dm(r`\frac{F}{A_0} = \frac{${num(F, 6)}\,\mathrm{N}}{${A0}\,\mathrm{mm^2}} = ${num(nominal)}\,\mathrm{MPa}, \qquad |\tau| = ${num(Math.abs(nominal))}\,\sin ${theta}^\circ\cos ${theta}^\circ = (${num(Math.abs(nominal))})(${num(s * c)}) = ${num(tau)}\,\mathrm{MPa}`),
        extremes,
      ),
      tags: ["oblique-cut"],
    });
  },
});

const snap = (x: number) => (Math.abs(x) < 1e-12 ? 0 : x);

/** Cauchy traction on the plane with normal n = (cos θ, sin θ) for a 2-D stress state (MPa). */
function traction(sxx: number, syy: number, sxy: number, theta: number) {
  const th = (theta * Math.PI) / 180;
  const c = snap(Math.cos(th));
  const s = snap(Math.sin(th));
  const tx = sxx * c + sxy * s;
  const ty = sxy * c + syy * s;
  return { c, s, tx, ty, sn: tx * c + ty * s, tau: -tx * s + ty * c };
}

define({
  id: "gen.sm.traction-vector",
  unitId: "sm2",
  title: "Traction on an inclined plane (Cauchy's law)",
  make: (_seed, rng) => {
    const ask = pick(rng, ["tx", "ty", "sn", "sn", "tau"] as const);
    const value = (t: ReturnType<typeof traction>) => (ask === "tx" ? t.tx : ask === "ty" ? t.ty : ask === "sn" ? t.sn : Math.abs(t.tau));
    const q = draw(
      () => ({
        sxx: 10 * randInt(rng, -10, 12),
        syy: 10 * randInt(rng, -10, 12),
        sxy: 10 * randNonZero(rng, 6),
        theta: pick(rng, [0, 30, 30, 45, 45, 60, 60, 90, 120, 135, 150]),
      }),
      (q) => Math.abs(value(traction(q.sxx, q.syy, q.sxy, q.theta))) >= 1,
    );
    const t = traction(q.sxx, q.syy, q.sxy, q.theta);
    const answer = value(t);
    const sigmaTex = r`\begin{bmatrix} ${q.sxx} & ${q.sxy} \\ ${q.sxy} & ${q.syy} \end{bmatrix}`;
    const body = paras(
      r`At a point in a thin plate in plane stress the stress components are`,
      dm(r`\boldsymbol{\sigma} = \begin{bmatrix} \sigma_{xx} & \sigma_{xy} \\ \sigma_{yx} & \sigma_{yy} \end{bmatrix} = ${sigmaTex}\,\mathrm{MPa}`),
      r`Consider the plane through this point whose unit normal makes an angle $\theta = ${q.theta}^\circ$ with the $+x$ axis, measured counter-clockwise: $\mathbf{n} = (\cos\theta,\ \sin\theta)$.`,
    );
    const question =
      ask === "tx"
        ? r`What is the $x$-component $t_x$ of the traction vector acting on this plane? Give it in MPa ${SF3}.`
        : ask === "ty"
          ? r`What is the $y$-component $t_y$ of the traction vector acting on this plane? Give it in MPa ${SF3}.`
          : ask === "sn"
            ? r`What is the normal stress $\sigma_n = \mathbf{t}\cdot\mathbf{n}$ on this plane? Give it in MPa (tension positive) ${SF3}.`
            : r`What is the magnitude of the shear stress on this plane? Give it in MPa ${SF3}.`;
    const hint =
      ask === "sn"
        ? r`Use Cauchy's law $\mathbf{t} = \boldsymbol{\sigma}\mathbf{n}$ ($\boldsymbol\sigma$ is symmetric), then project $\mathbf{t}$ onto $\mathbf{n}$.`
        : ask === "tau"
          ? r`Use Cauchy's law $\mathbf{t} = \boldsymbol{\sigma}\mathbf{n}$, then take the component of $\mathbf{t}$ along the plane, i.e. along the tangent $(-\sin\theta, \cos\theta)$.`
          : r`Use Cauchy's law $\mathbf{t} = \boldsymbol{\sigma}\mathbf{n}$ with $\mathbf{n} = (\cos\theta, \sin\theta)$: each traction component is a row of $\boldsymbol\sigma$ dotted with $\mathbf{n}$.`;
    const cauchy = paras(
      r`Cauchy's law with $\mathbf{n} = (${num(t.c)},\ ${num(t.s)})$:`,
      dm(r`\begin{bmatrix} t_x \\ t_y \end{bmatrix} = ${sigmaTex}\begin{bmatrix} ${num(t.c)} \\ ${num(t.s)} \end{bmatrix} = \begin{bmatrix} (${q.sxx})(${num(t.c)}) + (${q.sxy})(${num(t.s)}) \\ (${q.sxy})(${num(t.c)}) + (${q.syy})(${num(t.s)}) \end{bmatrix} = \begin{bmatrix} ${num(t.tx)} \\ ${num(t.ty)} \end{bmatrix}\,\mathrm{MPa}`),
    );
    const finish =
      ask === "sn"
        ? dm(r`\sigma_n = \mathbf{t}\cdot\mathbf{n} = (${num(t.tx)})(${num(t.c)}) + (${num(t.ty)})(${num(t.s)}) = ${num(t.sn)}\,\mathrm{MPa}`)
        : ask === "tau"
          ? paras(
              dm(r`\tau = \mathbf{t}\cdot\mathbf{s} = -t_x\sin\theta + t_y\cos\theta = -(${num(t.tx)})(${num(t.s)}) + (${num(t.ty)})(${num(t.c)}) = ${num(t.tau)}\,\mathrm{MPa}`),
              r`with $\mathbf{s} = (-\sin\theta, \cos\theta)$ the unit tangent to the plane, so the shear stress magnitude is $${num(Math.abs(t.tau))}\,\mathrm{MPa}$. Check: $|\tau| = \sqrt{|\mathbf{t}|^2 - \sigma_n^2}$ with $\sigma_n = ${num(t.sn)}\,\mathrm{MPa}$.`,
            )
          : r`So $t_${ask === "tx" ? "x" : "y"} = ${num(answer)}\,\mathrm{MPa}$. (For $\theta = 0$ the traction is simply $(\sigma_{xx}, \sigma_{xy})$: the first index of $\sigma_{ij}$ names the cut's normal.)`;
    return numericStep({
      body,
      question,
      answer,
      floor: 0.05,
      unit: U.MPa,
      suffix: "MPa",
      hint,
      explanation: paras(cauchy, finish),
      tags: ["traction", "stress-tensor"],
    });
  },
});

/** A polynomial in x and y as [coefficient, power of x, power of y] terms. */
type Poly = [number, number, number][];

function simplify(p: Poly): Poly {
  const terms = new Map<string, [number, number, number]>();
  for (const [c, px, py] of p) {
    const key = `${px},${py}`;
    const cur = terms.get(key);
    if (cur) cur[0] += c;
    else terms.set(key, [c, px, py]);
  }
  return [...terms.values()].filter(([c]) => Math.abs(c) > 1e-12).sort((u, v) => v[1] + v[2] - (u[1] + u[2]) || v[1] - u[1]);
}
const ddx = (p: Poly): Poly => simplify(p.map(([c, px, py]): [number, number, number] => [c * px, px - 1, py]));
const ddy = (p: Poly): Poly => simplify(p.map(([c, px, py]): [number, number, number] => [c * py, px, py - 1]));
const padd = (...ps: Poly[]): Poly => simplify(ps.flat());
const peval = (p: Poly, x: number, y: number) => p.reduce((sum, [c, px, py]) => sum + c * x ** px * y ** py, 0);

/** LaTeX for a polynomial, e.g. "3x^{2} - 4xy + 5". */
function ptex(poly: Poly): string {
  const p = simplify(poly); // drops zero terms
  if (p.length === 0) return "0";
  return p
    .map(([c, px, py], i) => {
      const monomial = (px ? (px === 1 ? "x" : `x^{${px}}`) : "") + (py ? (py === 1 ? "y" : `y^{${py}}`) : "");
      const coef = monomial && Math.abs(c) === 1 ? "" : num(Math.abs(c), 6);
      const sign = c < 0 ? (i === 0 ? "-" : " - ") : i === 0 ? "" : " + ";
      return `${sign}${coef}${monomial}`;
    })
    .join("");
}

interface Field {
  sxx: Poly;
  syy: Poly;
  sxy: Poly;
}

/** A polynomial 2-D stress field that satisfies equilibrium with no body force. */
function equilibriumField(rng: Rng): Field {
  const k = () => randNonZero(rng, 5);
  const t = randInt(rng, 1, 5);
  let f: Field;
  if (t === 1) {
    const a = k();
    f = { sxx: [[a, 2, 0], [k(), 0, 1]], syy: [[a, 0, 2], [randInt(rng, -4, 4), 1, 0]], sxy: [[-2 * a, 1, 1], [k(), 0, 0]] };
  } else if (t === 2) {
    const a = 2 * randNonZero(rng, 3);
    const e = k();
    f = { sxx: [[a, 1, 1], [k(), 0, 0]], syy: [[randInt(rng, -4, 4), 2, 0], [-e, 0, 1]], sxy: [[-a / 2, 0, 2], [e, 1, 0]] };
  } else if (t === 3) {
    const a = k();
    const c = k();
    f = { sxx: [[a, 1, 0], [k(), 0, 1]], syy: [[randInt(rng, -4, 4), 1, 0], [-c, 0, 1]], sxy: [[c, 1, 0], [-a, 0, 1]] };
  } else if (t === 4) {
    f = { sxx: [[k(), 0, 2]], syy: [[k(), 2, 0]], sxy: [[k(), 0, 0]] };
  } else {
    const a = k();
    const b = k();
    f = { sxx: [[a, 2, 0], [b, 0, 2]], syy: [[a, 0, 2], [b, 2, 0]], sxy: [[-2 * a, 1, 1]] };
  }
  return { sxx: simplify(f.sxx), syy: simplify(f.syy), sxy: simplify(f.sxy) };
}

/** Change one term (flip a sign, or add a monomial) — usually breaks equilibrium. */
function perturb(rng: Rng, f: Field): Field {
  const out: Field = {
    sxx: f.sxx.map((t): [number, number, number] => [...t]),
    syy: f.syy.map((t): [number, number, number] => [...t]),
    sxy: f.sxy.map((t): [number, number, number] => [...t]),
  };
  const cands: { key: keyof Field; i: number }[] = [];
  out.sxx.forEach((t, i) => {
    if (t[1] > 0) cands.push({ key: "sxx", i });
  });
  out.syy.forEach((t, i) => {
    if (t[2] > 0) cands.push({ key: "syy", i });
  });
  out.sxy.forEach((t, i) => {
    if (t[1] > 0 || t[2] > 0) cands.push({ key: "sxy", i });
  });
  if (cands.length > 0 && rng() < 0.75) {
    const { key, i } = pick(rng, cands);
    out[key][i][0] = -out[key][i][0];
  } else {
    const key = pick(rng, ["sxx", "syy", "sxy"] as const);
    const [px, py] = pick(rng, [[1, 0], [0, 1], [1, 1], [2, 0], [0, 2]] as const);
    out[key] = padd(out[key], [[randNonZero(rng, 4), px, py]]);
  }
  return out;
}

const residuals = (f: Field) => ({ rx: padd(ddx(f.sxx), ddy(f.sxy)), ry: padd(ddx(f.sxy), ddy(f.syy)) });

define({
  id: "gen.sm.equilibrium-check",
  unitId: "sm2",
  title: "Is a stress field in equilibrium?",
  make: (_seed, rng) => {
    const ask = pick(rng, ["mc", "mc", "body-force"] as const);
    const fieldBody = (f: Field) =>
      paras(
        r`A two-dimensional stress field is given by (stresses in kPa, coordinates $x$, $y$ in m; the constants carry consistent units)`,
        dm(r`\sigma_{xx} = ${ptex(f.sxx)}, \qquad \sigma_{yy} = ${ptex(f.syy)}, \qquad \sigma_{xy} = \sigma_{yx} = ${ptex(f.sxy)}`),
      );
    const eqX = (f: Field, rx: Poly) =>
      dm(r`\frac{\partial\sigma_{xx}}{\partial x} + \frac{\partial\sigma_{yx}}{\partial y} = (${ptex(ddx(f.sxx))}) + (${ptex(ddy(f.sxy))}) = ${ptex(rx)}`);
    const eqY = (f: Field, ry: Poly) =>
      dm(r`\frac{\partial\sigma_{xy}}{\partial x} + \frac{\partial\sigma_{yy}}{\partial y} = (${ptex(ddx(f.sxy))}) + (${ptex(ddy(f.syy))}) = ${ptex(ry)}`);
    if (ask === "mc") {
      const wantEq = rng() < 0.4;
      let f = equilibriumField(rng);
      if (!wantEq) {
        for (let i = 0; i < 30; i++) {
          const cand = perturb(rng, rng() < 0.3 ? perturb(rng, f) : f);
          const res = residuals(cand);
          if (res.rx.length > 0 || res.ry.length > 0) {
            f = cand;
            break;
          }
        }
      }
      const { rx, ry } = residuals(f);
      const correct = rx.length === 0 && ry.length === 0 ? "eq" : rx.length > 0 && ry.length > 0 ? "both" : rx.length > 0 ? "x" : "y";
      const verdict =
        correct === "eq"
          ? r`Both sums vanish at every point, so the field **is** in equilibrium without body forces.`
          : correct === "both"
            ? r`Neither sum vanishes everywhere, so the field is **not** in equilibrium: both equations fail, and body forces $b_x = -(${ptex(rx)})$, $b_y = -(${ptex(ry)})$ would be needed.`
            : correct === "x"
              ? r`The $y$-equation holds, but the $x$-equation leaves $${ptex(rx)}$, which is not zero everywhere: the field is **not** in equilibrium (it would need $b_x = -(${ptex(rx)})$).`
              : r`The $x$-equation holds, but the $y$-equation leaves $${ptex(ry)}$, which is not zero everywhere: the field is **not** in equilibrium (it would need $b_y = -(${ptex(ry)})$).`;
      const recheck = r`Recompute each sum term by term (with $\sigma_{yx} = \sigma_{xy}$): the $x$-equation uses $\partial\sigma_{xx}/\partial x$ and $\partial\sigma_{yx}/\partial y$, the $y$-equation uses $\partial\sigma_{xy}/\partial x$ and $\partial\sigma_{yy}/\partial y$.`;
      return {
        type: "mc",
        id: "",
        body: fieldBody(f),
        question: r`Is this stress field in equilibrium when there are no body forces?`,
        choices: [
          { id: "eq", text: r`Yes — both equilibrium equations hold at every point.`, feedback: recheck },
          { id: "x", text: r`No — only the $x$-equation, $\partial\sigma_{xx}/\partial x + \partial\sigma_{yx}/\partial y = 0$, fails.`, feedback: recheck },
          { id: "y", text: r`No — only the $y$-equation, $\partial\sigma_{xy}/\partial x + \partial\sigma_{yy}/\partial y = 0$, fails.`, feedback: recheck },
          { id: "both", text: r`No — both equilibrium equations fail.`, feedback: recheck },
        ],
        correct,
        hint: r`Substitute into both pointwise equilibrium equations, $\partial\sigma_{xx}/\partial x + \partial\sigma_{yx}/\partial y = 0$ and $\partial\sigma_{xy}/\partial x + \partial\sigma_{yy}/\partial y = 0$. Each must hold at every point, not just at one.`,
        explanation: paras(r`With $\sigma_{yx} = \sigma_{xy}$ and no body force:`, eqX(f, rx), eqY(f, ry), verdict),
        tags: ["equilibrium", "stress-tensor"],
      };
    }
    const dir = pick(rng, ["x", "y"] as const);
    let f = equilibriumField(rng);
    let x0 = 1;
    let y0 = 1;
    for (let i = 0; i < 60; i++) {
      const cand = perturb(rng, equilibriumField(rng));
      const res = residuals(cand)[dir === "x" ? "rx" : "ry"];
      if (res.length === 0) continue;
      const px = pick(rng, [-2, -1, 1, 2, 3]);
      const py = pick(rng, [-2, -1, 1, 2, 3]);
      if (Math.abs(peval(res, px, py)) >= 1) {
        f = cand;
        x0 = px;
        y0 = py;
        break;
      }
    }
    const { rx, ry } = residuals(f);
    const res = dir === "x" ? rx : ry;
    const val = peval(res, x0, y0);
    const b = -val; // kN/m³
    return numericStep({
      body: fieldBody(f),
      question: r`What body force $b_${dir}$ (force per unit volume) must act at the point $(x, y) = (${x0}, ${y0})\,\mathrm{m}$ for the field to be in equilibrium there? Give it in $\mathrm{kN/m^3}$ ${SF3}.`,
      answer: b,
      floor: 0.001,
      unit: U.kNm3,
      suffix: "kN/m³",
      hint:
        dir === "x"
          ? r`Pointwise equilibrium in $x$: $\partial\sigma_{xx}/\partial x + \partial\sigma_{yx}/\partial y + b_x = 0$. Differentiate first, then evaluate at the point.`
          : r`Pointwise equilibrium in $y$: $\partial\sigma_{xy}/\partial x + \partial\sigma_{yy}/\partial y + b_y = 0$. Differentiate first, then evaluate at the point.`,
      explanation: paras(
        r`Using $\sigma_{yx} = \sigma_{xy}$:`,
        dir === "x" ? eqX(f, rx) : eqY(f, ry),
        dm(r`b_${dir} = -\left(${ptex(res)}\right)\Big|_{(${x0},\,${y0})} = -(${num(val)}) = ${num(b)}\,\mathrm{kN/m^3}`),
        r`(Stress in kPa differentiated with respect to metres gives $\mathrm{kPa/m} = \mathrm{kN/m^3}$.)`,
      ),
      tags: ["equilibrium", "body-force"],
    });
  },
});

define({
  id: "gen.sm.stress-resultants",
  unitId: "sm2",
  title: "Force and moment resultants of a linear stress distribution",
  make: (_seed, rng) => {
    const ask = pick(rng, ["R", "Mz", "Mz", "My"] as const);
    const q = draw(
      () => ({
        b: pick(rng, [20, 30, 40, 50, 60, 80, 100]),
        h: pick(rng, [50, 60, 80, 100, 120, 150, 200]),
        c0: 5 * randInt(rng, -10, 16),
        c1: pick(rng, [0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3]) * (rng() < 0.5 ? 1 : -1),
      }),
      (q) => {
        const half = ask === "My" ? q.b / 2 : q.h / 2;
        if (Math.abs(q.c0) + Math.abs(q.c1) * half > 300) return false;
        if (ask === "R") return q.c0 !== 0;
        const M = ask === "Mz" ? (q.c1 * q.b * q.h ** 3) / 12 : (q.c1 * q.h * q.b ** 3) / 12;
        return Math.abs(M) / 1e6 >= 0.1;
      },
    );
    const { b, h, c0, c1 } = q;
    const coord = ask === "My" ? "z" : "y";
    const linear = c0 === 0 ? mono(c1, coord) : r`${c0} ${c1 < 0 ? "-" : "+"} ${mono(Math.abs(c1), coord)}`;
    const body = paras(
      r`A prismatic bar has a rectangular cross-section of width $b = ${b}\,\mathrm{mm}$ (along $z$) and height $h = ${h}\,\mathrm{mm}$ (along $y$), with $y$ and $z$ measured from the centroid. On a cut with outward normal $+\mathbf{e}_x$ the normal stress is`,
      dm(r`\sigma_{xx} = ${linear} \qquad (\sigma_{xx}\ \text{in MPa},\ ${coord}\ \text{in mm})`),
      r`The stress resultants on the cut are $R = \int_A \sigma_{xx}\,dA$, $M_y = \int_A z\,\sigma_{xx}\,dA$ and $M_z = -\int_A y\,\sigma_{xx}\,dA$: the moments about the centroid of the forces $\sigma_{xx}\,dA\,\mathbf{e}_x$, by the right-hand rule.`,
    );
    if (ask === "R") {
      const RN = c0 * b * h;
      return numericStep({
        body,
        question: r`What is the axial force resultant $R$? Give it in kN ${SF3}.`,
        answer: RN / 1000,
        floor: 0.005,
        unit: U.kN,
        suffix: "kN",
        hint: r`Split the integral into the uniform part and the part linear in $y$. What does $\int_A y\,dA$ equal when $y$ is measured from the centroid?`,
        explanation: paras(
          dm(r`R = \int_A (c_0 + c_1 y)\,dA = c_0 A + c_1\!\int_A y\,dA = c_0\,bh`),
          dm(r`R = (${c0}\,\mathrm{N/mm^2})(${b}\,\mathrm{mm})(${h}\,\mathrm{mm}) = ${num(RN, 6)}\,\mathrm{N} = ${num(RN / 1000)}\,\mathrm{kN}`),
          r`The linear part ($c_1 = ${g(c1)}\,\mathrm{MPa/mm}$) integrates to zero about the centroid — it produces a moment, not a force.`,
        ),
        tags: ["resultants", "stress-tensor"],
      });
    }
    if (ask === "My") {
      const M = (c1 * h * b ** 3) / 12; // N·mm
      return numericStep({
        body,
        question: r`What is the moment resultant $M_y$, with its sign? Give it in kN·m ${SF3}.`,
        answer: M / 1e6,
        floor: 0.0001,
        unit: U.kNm,
        suffix: "kN·m",
        hint: r`Substitute into $M_y = \int_A z\,\sigma_{xx}\,dA$. About the centroid $\int_A z\,dA = 0$ and $\int_A z^2\,dA = hb^3/12$.`,
        explanation: paras(
          dm(r`M_y = \int_A z\,(c_0 + c_1 z)\,dA = c_0\!\int_A z\,dA + c_1\!\int_A z^2\,dA = c_1\,\frac{hb^3}{12}`),
          dm(r`M_y = (${g(c1)})\,\frac{(${h})(${b})^3}{12} = ${num(M)}\,\mathrm{N\cdot mm} = ${num(M / 1e6)}\,\mathrm{kN\cdot m}`),
          r`(Note the sign difference from $M_z = -\int_A y\,\sigma_{xx}\,dA$: $\mathbf{e}_z\times\mathbf{e}_x = +\mathbf{e}_y$ but $\mathbf{e}_y\times\mathbf{e}_x = -\mathbf{e}_z$. $1\,\mathrm{kN\cdot m} = 10^6\,\mathrm{N\cdot mm}$.)`,
        ),
        tags: ["resultants", "stress-tensor"],
      });
    }
    const M = (-c1 * b * h ** 3) / 12; // N·mm
    return numericStep({
      body,
      question: r`What is the moment resultant $M_z$, with its sign? Give it in kN·m ${SF3}.`,
      answer: M / 1e6,
      floor: 0.0001,
      unit: U.kNm,
      suffix: "kN·m",
      hint: r`Substitute into $M_z = -\int_A y\,\sigma_{xx}\,dA$. About the centroid $\int_A y\,dA = 0$ and $\int_A y^2\,dA = bh^3/12$. Keep the minus sign.`,
      explanation: paras(
        dm(r`M_z = -\int_A y\,(c_0 + c_1 y)\,dA = -c_0\!\int_A y\,dA - c_1\!\int_A y^2\,dA = -c_1\,\frac{bh^3}{12}`),
        dm(r`M_z = -(${g(c1)})\,\frac{(${b})(${h})^3}{12} = ${num(M)}\,\mathrm{N\cdot mm} = ${num(M / 1e6)}\,\mathrm{kN\cdot m}`),
        r`The uniform part ($c_0 = ${c0}\,\mathrm{MPa}$) contributes only to $R$, not to the moment. ($1\,\mathrm{kN\cdot m} = 10^6\,\mathrm{N\cdot mm}$.)`,
      ),
      tags: ["resultants", "stress-tensor"],
    });
  },
});

define({
  id: "gen.sm.lap-joint",
  unitId: "sm2",
  title: "Allowable load on a glued or welded lap joint",
  make: (_seed, rng) => {
    const ask = pick(rng, ["glue-P", "glue-P", "glue-L", "weld"] as const);
    if (ask === "weld") {
      const q = {
        L: pick(rng, [50, 75, 80, 100, 120, 150, 200]),
        w: pick(rng, [5, 6, 8, 10, 12]),
        ty: pick(rng, [100, 120, 140, 150, 160, 180]),
        SF: pick(rng, [1.5, 2, 2.5, 3]),
      };
      const t = q.w / Math.SQRT2;
      const P = (2 * q.ty * q.L * t) / q.SF / 1000; // kN
      return numericStep({
        body: r`Two steel plates are joined in a lap joint by two $45^\circ$ fillet welds, one along each edge of the overlap. Each weld is $L = ${q.L}\,\mathrm{mm}$ long with leg size $w = ${q.w}\,\mathrm{mm}$. The weld metal yields in shear at $\tau_Y = ${q.ty}\,\mathrm{MPa}$; use a safety factor $SF = ${g(q.SF)}$.`,
        question: r`What is the allowable load $P$ on the joint? Give it in kN ${SF3}.`,
        answer: P,
        floor: 0.005,
        unit: U.kN,
        suffix: "kN",
        hint: r`Each weld carries half the load. The critical section of a $45^\circ$ fillet weld is the one with the smallest area — through the throat, not along the leg.`,
        explanation: paras(
          r`Each weld carries $P/2$. The smallest shear area of a $45^\circ$ fillet weld runs through its throat, $t = w/\sqrt{2} = ${num(t)}\,\mathrm{mm}$, so each weld's critical area is $Lt = ${num(q.L * t)}\,\mathrm{mm^2}$.`,
          dm(r`\tau = \frac{P/2}{Lt} \le \frac{\tau_Y}{SF} \;\Rightarrow\; P_{\text{allow}} = \frac{2\,\tau_Y L t}{SF} = \frac{2(${q.ty})(${q.L})(${num(t)})}{${g(q.SF)}} = ${num(P * 1000)}\,\mathrm{N} = ${num(P)}\,\mathrm{kN}`),
        ),
        tags: ["shear-stress", "joints", "design"],
      });
    }
    const n = rng() < 0.5 ? 2 : 1;
    const joint =
      n === 2
        ? r`a double lap joint: the centre plate is sandwiched between two cover plates, so the load crosses **two** glued planes`
        : r`a single lap joint: two plates overlap and are bonded on **one** glued plane`;
    const q = draw(
      () => ({
        L: pick(rng, [25, 30, 40, 50, 60, 75, 80, 100]),
        w: pick(rng, [20, 25, 30, 40, 50, 60, 75, 100]),
        tf: pick(rng, [2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15]),
        SF: pick(rng, [1.5, 2, 2.5, 3, 4]),
        P: pick(rng, [5, 8, 10, 12, 15, 20, 25, 30, 40, 50]),
      }),
      (q) => {
        if (ask === "glue-P") return (n * q.tf * q.L * q.w) / q.SF / 1000 >= 0.5;
        const L = (q.SF * q.P * 1000) / (n * q.tf * q.w);
        return L >= 10 && L <= 400;
      },
    );
    const strength = r`The adhesive fails in shear at $\tau_{\text{fail}} = ${g(q.tf)}\,\mathrm{MPa}$; use a safety factor $SF = ${g(q.SF)}$, so $\tau_{\text{allow}} = \tau_{\text{fail}}/SF$.`;
    if (ask === "glue-L") {
      const L = (q.SF * q.P * 1000) / (n * q.tf * q.w);
      return numericStep({
        body: r`Plates of width $w = ${q.w}\,\mathrm{mm}$ are bonded in ${joint}, each glued plane being $L \times w$. The joint must carry $P = ${q.P}\,\mathrm{kN}$. ${strength}`,
        question: r`What is the minimum overlap length $L$? Give it in mm ${SF3}.`,
        answer: L,
        floor: 0.005,
        unit: U.mm,
        suffix: "mm",
        hint: r`The load is shared equally by the glued planes. Set the average shear stress on one plane equal to the allowable stress and solve for $L$.`,
        explanation: paras(
          r`Each of the $n = ${n}$ glued plane${n === 2 ? "s" : ""} carries $P/n$ in shear over the area $Lw$:`,
          dm(r`\frac{P/n}{Lw} \le \frac{\tau_{\text{fail}}}{SF} \;\Rightarrow\; L \ge \frac{SF\cdot P}{n\,\tau_{\text{fail}}\,w} = \frac{(${g(q.SF)})(${g(q.P * 1000)})}{(${n})(${g(q.tf)})(${q.w})} = ${num(L)}\,\mathrm{mm}`),
        ),
        tags: ["shear-stress", "joints", "design"],
      });
    }
    const P = (n * q.tf * q.L * q.w) / q.SF / 1000; // kN
    return numericStep({
      body: r`Plates of width $w = ${q.w}\,\mathrm{mm}$ are bonded in ${joint}, each glued plane being $L \times w$ with overlap $L = ${q.L}\,\mathrm{mm}$. ${strength}`,
      question: r`What is the allowable load $P$ on the joint? Give it in kN ${SF3}.`,
      answer: P,
      floor: 0.001,
      unit: U.kN,
      suffix: "kN",
      hint: r`Count the glued planes the load must shear through; each carries an equal share over an area $L \times w$.`,
      explanation: paras(
        r`Each of the $n = ${n}$ glued plane${n === 2 ? "s" : ""} carries $P/n$ in shear over the area $Lw = ${q.L * q.w}\,\mathrm{mm^2}$:`,
        dm(r`\frac{P/n}{Lw} \le \frac{\tau_{\text{fail}}}{SF} \;\Rightarrow\; P_{\text{allow}} = \frac{n\,\tau_{\text{fail}}\,L w}{SF} = \frac{(${n})(${g(q.tf)})(${q.L})(${q.w})}{${g(q.SF)}} = ${num(P * 1000)}\,\mathrm{N} = ${num(P)}\,\mathrm{kN}`),
      ),
      tags: ["shear-stress", "joints", "design"],
    });
  },
});

/* ------------------------------------------------------------------ */
/* sm3 — strain                                                        */
/* ------------------------------------------------------------------ */

const gammaNote = r`$\gamma_{xy}$ is the *engineering* shear strain, the decrease of the right angle between the $x$ and $y$ directions; the strain matrix carries the *tensor* component $\varepsilon_{xy} = \gamma_{xy}/2$ off the diagonal. Mixing the two up is the classic factor-of-2 error.`;

define({
  id: "gen.sm.strain-from-field",
  unitId: "sm3",
  title: "Strains from a homogeneous displacement field",
  make: (_seed, rng) => {
    const ask = pick(rng, ["exx", "eyy", "gxy", "gxy", "exy", "matrix"] as const);
    const q = draw(
      () => ({ a: randInt(rng, -8, 9), b: randInt(rng, -8, 8), c: randInt(rng, -8, 8), d: randInt(rng, -8, 9) }),
      (q) => q.a !== 0 && q.d !== 0 && q.b + q.c !== 0 && (q.b !== 0 || q.c !== 0),
    );
    const { a, b, c, d } = q;
    const exx = 100 * a;
    const eyy = 100 * d;
    const gxy = 100 * (b + c);
    const exy = gxy / 2;
    const body = paras(
      r`A thin plate is deformed so that its displacement field is`,
      dm(r`u = \left(${ptex([[a, 1, 0], [b, 0, 1]])}\right)\times 10^{-4}, \qquad v = \left(${ptex([[c, 1, 0], [d, 0, 1]])}\right)\times 10^{-4}`),
      r`with $x$, $y$, $u$ and $v$ in the same length unit, so the displacement gradients are dimensionless.`,
    );
    const normals = dm(r`\varepsilon_{xx} = \frac{\partial u}{\partial x} = ${a}\times 10^{-4} = ${exx}\times 10^{-6}, \qquad \varepsilon_{yy} = \frac{\partial v}{\partial y} = ${d}\times 10^{-4} = ${eyy}\times 10^{-6}`);
    const shear = dm(r`\gamma_{xy} = \frac{\partial u}{\partial y} + \frac{\partial v}{\partial x} = (${b} + ${par(c)})\times 10^{-4} = ${gxy}\times 10^{-6}\,\mathrm{rad}, \qquad \varepsilon_{xy} = \tfrac12\gamma_{xy} = ${num(exy)}\times 10^{-6}`);
    const hint = r`Normal strains come from the "own" derivatives, $\partial u/\partial x$ and $\partial v/\partial y$; shear strain mixes them, $\gamma_{xy} = \partial u/\partial y + \partial v/\partial x$. Decide whether you need $\gamma_{xy}$ or $\varepsilon_{xy} = \gamma_{xy}/2$.`;
    if (ask === "matrix") {
      const M = [
        [exx, exy],
        [exy, eyy],
      ];
      return {
        type: "matrix",
        id: "",
        body,
        question: r`Enter the strain matrix $\begin{bmatrix}\varepsilon_{xx} & \varepsilon_{xy} \\ \varepsilon_{yx} & \varepsilon_{yy}\end{bmatrix}$ with every entry in micro-strain ($10^{-6}$), ${SF3}.`,
        answer: M,
        tolerance: tol(Math.max(Math.abs(exx), Math.abs(eyy), Math.abs(exy)), 0.5),
        answerDisplay: r`\begin{bmatrix} ${exx} & ${num(exy)} \\ ${num(exy)} & ${eyy} \end{bmatrix}\times 10^{-6}`,
        hint,
        explanation: paras(normals, shear, gammaNote, dm(r`\boldsymbol{\varepsilon} = \begin{bmatrix} ${exx} & ${num(exy)} \\ ${num(exy)} & ${eyy} \end{bmatrix}\times 10^{-6}`)),
        tags: ["strain", "shear-strain"],
      };
    }
    const spec = {
      exx: { v: exx, q: r`What is the normal strain $\varepsilon_{xx}$? Give it in micro-strain ($10^{-6}$) ${SF3}.`, unit: U.micro, suffix: "μ" },
      eyy: { v: eyy, q: r`What is the normal strain $\varepsilon_{yy}$? Give it in micro-strain ($10^{-6}$) ${SF3}.`, unit: U.micro, suffix: "μ" },
      gxy: {
        v: gxy,
        q: r`What is the engineering shear strain $\gamma_{xy}$ (the decrease of the right angle between the $x$ and $y$ directions)? Give it in micro-radians ($10^{-6}\,\mathrm{rad}$) ${SF3}.`,
        unit: U.urad,
        suffix: "μrad",
      },
      exy: {
        v: exy,
        q: r`What is the tensor shear-strain component $\varepsilon_{xy}$ (the off-diagonal entry of the strain matrix)? Give it in micro-strain ($10^{-6}$) ${SF3}.`,
        unit: U.micro,
        suffix: "μ",
      },
    }[ask];
    return numericStep({
      body,
      question: spec.q,
      answer: spec.v,
      floor: 0.05,
      unit: spec.unit,
      suffix: spec.suffix,
      hint,
      explanation: ask === "exx" || ask === "eyy" ? paras(normals, r`(For completeness, $\gamma_{xy} = ${gxy}\times 10^{-6}$.)`) : paras(shear, gammaNote),
      tags: ["strain", ask === "exx" || ask === "eyy" ? "normal-strain" : "shear-strain"],
    });
  },
});

define({
  id: "gen.sm.strain-quadratic",
  unitId: "sm3",
  title: "Strains at a point from a quadratic displacement field",
  make: (_seed, rng) => {
    const ask = pick(rng, ["exx", "eyy", "gxy", "gxy", "exy"] as const);
    const strainAt = (U: Poly, V: Poly, x: number, y: number) => {
      const gxy = peval(ddy(U), x, y) + peval(ddx(V), x, y);
      return { exx: peval(ddx(U), x, y), eyy: peval(ddy(V), x, y), gxy, exy: gxy / 2 };
    };
    const q = draw(
      () => {
        const k = () => randNonZero(rng, 5);
        const t = randInt(rng, 1, 4);
        let U: Poly;
        let V: Poly;
        if (t === 1) {
          U = [[k(), 2, 0], [k(), 0, 2]];
          V = [[k(), 1, 1]];
        } else if (t === 2) {
          U = [[k(), 1, 1]];
          V = [[k(), 2, 0], [k(), 0, 2]];
        } else if (t === 3) {
          U = [[k(), 2, 0], [k(), 1, 1]];
          V = [[k(), 0, 2], [k(), 1, 0]];
        } else {
          U = [[k(), 0, 2], [k(), 1, 0]];
          V = [[k(), 2, 0], [k(), 1, 1]];
        }
        return { U: simplify(U), V: simplify(V), x0: pick(rng, [0.5, 1, 2]), y0: pick(rng, [0.5, 1, 2]) };
      },
      (q) => Math.abs(strainAt(q.U, q.V, q.x0, q.y0)[ask]) >= 0.1,
    );
    const { U: up, V: vp, x0, y0 } = q;
    const e = strainAt(up, vp, x0, y0);
    const answer = 100 * e[ask]; // value × 10⁻⁴ → micro-strain
    const pt = r`(${g(x0)},\ ${g(y0)})`;
    const body = paras(
      r`A two-dimensional body has the displacement field`,
      dm(r`u = \left(${ptex(up)}\right)\times 10^{-4}, \qquad v = \left(${ptex(vp)}\right)\times 10^{-4}`),
      r`with $x$ and $y$ in metres; the numerical constants carry consistent units, so the strains are dimensionless.`,
    );
    const evalLine = (name: string, v: number, unitTex: string) => dm(r`${name}${pt} = ${num(v)}\times 10^{-4} = ${num(100 * v)}\times 10^{-6}${unitTex}`);
    let question: string;
    let hint: string;
    let explanation: string;
    if (ask === "exx" || ask === "eyy") {
      const isX = ask === "exx";
      question = r`What is the normal strain $\varepsilon_{${isX ? "xx" : "yy"}}$ at the point $(x, y) = ${pt}$? Give it in micro-strain ($10^{-6}$) ${SF3}.`;
      hint = isX
        ? r`$\varepsilon_{xx} = \partial u/\partial x$: differentiate first (holding $y$ fixed), then substitute the point.`
        : r`$\varepsilon_{yy} = \partial v/\partial y$: differentiate first (holding $x$ fixed), then substitute the point.`;
      explanation = paras(
        isX
          ? dm(r`\varepsilon_{xx} = \frac{\partial u}{\partial x} = \left(${ptex(ddx(up))}\right)\times 10^{-4}`)
          : dm(r`\varepsilon_{yy} = \frac{\partial v}{\partial y} = \left(${ptex(ddy(vp))}\right)\times 10^{-4}`),
        evalLine(isX ? r`\varepsilon_{xx}` : r`\varepsilon_{yy}`, isX ? e.exx : e.eyy, ""),
      );
    } else {
      const isG = ask === "gxy";
      question = isG
        ? r`What is the engineering shear strain $\gamma_{xy}$ at the point $(x, y) = ${pt}$? Give it in micro-radians ($10^{-6}\,\mathrm{rad}$) ${SF3}.`
        : r`What is the tensor shear strain $\varepsilon_{xy}$ (the off-diagonal entry of the strain matrix) at the point $(x, y) = ${pt}$? Give it in micro-strain ($10^{-6}$) ${SF3}.`;
      hint = r`$\gamma_{xy} = \partial u/\partial y + \partial v/\partial x$ — both terms count. Differentiate first, then substitute the point.${isG ? "" : r` The tensor component is half of $\gamma_{xy}$.`}`;
      explanation = paras(
        dm(r`\gamma_{xy} = \frac{\partial u}{\partial y} + \frac{\partial v}{\partial x} = \left[\left(${ptex(ddy(up))}\right) + \left(${ptex(ddx(vp))}\right)\right]\times 10^{-4}`),
        evalLine(r`\gamma_{xy}`, e.gxy, isG ? r`\,\mathrm{rad}` : ""),
        isG ? gammaNote : dm(r`\varepsilon_{xy} = \tfrac12\gamma_{xy} = ${num(100 * e.exy)}\times 10^{-6}`),
      );
    }
    return numericStep({
      body,
      question,
      answer,
      floor: 0.05,
      unit: ask === "gxy" ? U.urad : U.micro,
      suffix: ask === "gxy" ? "μrad" : "μ",
      hint,
      explanation,
      tags: ["strain", ask === "exx" || ask === "eyy" ? "normal-strain" : "shear-strain"],
    });
  },
});

define({
  id: "gen.sm.average-shear-strain",
  unitId: "sm3",
  title: "Average shear and hoop strain from simple geometry",
  make: (_seed, rng) => {
    const ask = pick(rng, ["pad", "block", "ring", "circumference", "angle"] as const);
    if (ask === "pad" || ask === "block") {
      const pad = ask === "pad";
      const q = draw(
        () =>
          pad
            ? { h: pick(rng, [10, 12, 15, 20, 25, 30, 40, 50]), d: pick(rng, [0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1, 1.2, 1.5, 2]) }
            : { h: pick(rng, [20, 40, 50, 80, 100, 150, 200]), d: pick(rng, [0.01, 0.02, 0.025, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1]) },
        (q) => (pad ? q.d / q.h >= 0.01 && q.d / q.h <= 0.06 : (1e6 * q.d) / q.h >= 50 && (1e6 * q.d) / q.h <= 5000),
      );
      const gamma = q.d / q.h; // rad
      return numericStep({
        body: pad
          ? r`A rubber bearing pad of thickness $h = ${q.h}\,\mathrm{mm}$ is bonded between two steel plates. The top plate moves horizontally by $\delta = ${g(q.d)}\,\mathrm{mm}$ relative to the bottom plate, and the pad deforms into a parallelogram.`
          : r`A metal block of height $h = ${q.h}\,\mathrm{mm}$ is clamped along its base. A shear load moves its top face sideways by $\delta = ${g(q.d)}\,\mathrm{mm}$, so the vertical sides tilt uniformly.`,
        question: pad
          ? r`What is the average shear strain $\gamma$ in the pad? Give it in radians ${SF3}.`
          : r`What is the average shear strain $\gamma$ in the block? Give it in micro-radians ($10^{-6}\,\mathrm{rad}$) ${SF3}.`,
        answer: pad ? gamma : 1e6 * gamma,
        floor: pad ? 0.00005 : 0.05,
        unit: pad ? U.rad : U.urad,
        suffix: pad ? "rad" : "μrad",
        hint: r`Shear strain is the change of a right angle. How much does a vertical edge tilt when its top moves $\delta$ over a height $h$? (Small angles: $\tan\gamma \approx \gamma$.)`,
        explanation: paras(
          r`The originally vertical edges tilt by the angle whose tangent is $\delta/h$; the right angle between the edge and the base decreases by exactly that angle. For small angles $\tan\gamma \approx \gamma$:`,
          dm(r`\gamma \approx \frac{\delta}{h} = \frac{${g(q.d)}\,\mathrm{mm}}{${q.h}\,\mathrm{mm}} = ${pad ? r`${num(gamma)}\,\mathrm{rad}` : r`${num(gamma)}\,\mathrm{rad} = ${num(1e6 * gamma)}\times 10^{-6}\,\mathrm{rad}`}`),
        ),
        tags: ["shear-strain"],
      });
    }
    if (ask === "ring" || ask === "circumference") {
      const q = draw(
        () => ({
          r0: pick(rng, [50, 80, 100, 120, 150, 200, 250, 300, 400, 500]),
          dr: pick(rng, [0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3]) * (rng() < 0.75 ? 1 : -1),
          dC: pick(rng, [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5]) * (rng() < 0.75 ? 1 : -1),
        }),
        (q) => {
          const e = ask === "ring" ? (1e6 * q.dr) / q.r0 : (1e6 * q.dC) / (2 * Math.PI * q.r0);
          return Math.abs(e) >= 50 && Math.abs(e) <= 3000;
        },
      );
      if (ask === "ring") {
        const e = (1e6 * q.dr) / q.r0;
        return numericStep({
          body: r`A thin ring of radius $r = ${q.r0}\,\mathrm{mm}$ is ${q.dr > 0 ? "heated and expands" : "cooled and contracts"} uniformly; afterwards its radius is $${g(q.r0 + q.dr)}\,\mathrm{mm}$. All of the motion is radial.`,
          question: r`What is the hoop strain $\varepsilon_{\theta\theta}$ in the ring? Give it in micro-strain ($10^{-6}$) ${SF3}.`,
          answer: e,
          floor: 0.05,
          unit: U.micro,
          suffix: "μ",
          hint: r`Hoop strain is the relative change in the ring's circumference. With purely radial motion, how does the circumference $2\pi r$ change?`,
          explanation: paras(
            r`With $u_r = \Delta r$ and no tangential motion, $\varepsilon_{\theta\theta} = u_r/r$ — the circumference $2\pi r$ changes by $2\pi\Delta r$:`,
            dm(r`\varepsilon_{\theta\theta} = \frac{2\pi(r + \Delta r) - 2\pi r}{2\pi r} = \frac{\Delta r}{r} = \frac{${g(q.dr)}\,\mathrm{mm}}{${q.r0}\,\mathrm{mm}} = ${num(e)}\times 10^{-6}`),
          ),
          tags: ["strain", "hoop-strain"],
        });
      }
      const e = (1e6 * q.dC) / (2 * Math.PI * q.r0);
      return numericStep({
        body: r`A thin steel band of radius $r = ${q.r0}\,\mathrm{mm}$ is clamped around a pipe. When the pipe is pressurized, the band's circumference ${q.dC > 0 ? "increases" : "decreases"} by $${g(Math.abs(q.dC))}\,\mathrm{mm}$.`,
        question: r`What is the hoop strain in the band? Give it in micro-strain ($10^{-6}$, extension positive) ${SF3}.`,
        answer: e,
        floor: 0.05,
        unit: U.micro,
        suffix: "μ",
        hint: r`Strain is change in length over original length — here the length is the circumference $2\pi r$.`,
        explanation: dm(r`\varepsilon_{\theta\theta} = \frac{\Delta C}{C} = \frac{${g(q.dC)}\,\mathrm{mm}}{2\pi(${q.r0}\,\mathrm{mm})} = ${num(e)}\times 10^{-6}`),
        tags: ["strain", "hoop-strain"],
      });
    }
    const dphi = pick(rng, [0.01, 0.02, 0.03, 0.05, 0.08, 0.1, 0.12, 0.15, 0.2]) * (rng() < 0.75 ? 1 : -1);
    const phi = 90 - dphi; // final angle, degrees
    const gamma = (dphi * Math.PI) / 180; // rad
    return numericStep({
      body: r`A small square element is drawn on a plate with its edges along $x$ and $y$. After loading, the angle between the two edges at the corner at the origin is $${g(phi)}^\circ$.`,
      question: r`What is the engineering shear strain $\gamma_{xy}$? Give it in micro-radians ($10^{-6}\,\mathrm{rad}$, use the sign convention) ${SF3}.`,
      answer: 1e6 * gamma,
      floor: 0.05,
      unit: U.urad,
      suffix: "μrad",
      hint: r`$\gamma_{xy}$ is the *decrease* of the originally right angle, in radians. Convert degrees with $\pi/180$.`,
      explanation: paras(
        dm(r`\gamma_{xy} = 90^\circ - ${g(phi)}^\circ = ${g(dphi)}^\circ = ${g(dphi)}\times\frac{\pi}{180}\,\mathrm{rad} = ${num(1e6 * gamma)}\times 10^{-6}\,\mathrm{rad}`),
        dphi > 0
          ? "The angle closed up, so the shear strain is positive."
          : "The angle opened up (it is larger than 90°), so the shear strain is negative.",
      ),
      tags: ["shear-strain"],
    });
  },
});

/* ------------------------------------------------------------------ */
/* sm4 — constitutive response                                         */
/* ------------------------------------------------------------------ */

type Axis = "xx" | "yy" | "zz";
const OTHERS: Record<Axis, [Axis, Axis]> = { xx: ["yy", "zz"], yy: ["zz", "xx"], zz: ["xx", "yy"] };

define({
  id: "gen.sm.hooke-3d",
  unitId: "sm4",
  title: "Generalized Hooke's law: strain from a 3-D stress state",
  make: (_seed, rng) => {
    const ask = pick(rng, ["xx", "yy", "zz", "xx", "dlen"] as const);
    const m = pick(rng, [STEEL, ALUMINUM, COPPER, TITANIUM]);
    const E = m.E * 1000; // MPa
    const withT = rng() < 0.35;
    const dT = withT ? pick(rng, [10, 15, 20, 25, 30, 40, 50, -10, -20, -30]) : 0;
    const dir: Axis = ask === "dlen" ? pick(rng, ["xx", "yy", "zz"] as const) : ask;
    const [j, k] = OTHERS[dir];
    const L = pick(rng, [100, 150, 200, 250, 300, 400, 500]);
    const strain = (s: Record<Axis, number>) => (1e6 * (s[dir] - m.nu * (s[j] + s[k]))) / E + m.alpha * dT; // μ
    const s = draw(
      () => ({ xx: 10 * randInt(rng, -12, 15), yy: 10 * randInt(rng, -12, 15), zz: 10 * randInt(rng, -10, 10) }),
      (s) => Math.abs(strain(s)) >= 30 && (ask !== "dlen" || Math.abs(strain(s) * 1e-6 * L) >= 0.01),
    );
    const mech = (1e6 * (s[dir] - m.nu * (s[j] + s[k]))) / E;
    const therm = m.alpha * dT;
    const eps = mech + therm; // μ
    const stresses = r`$\sigma_{xx} = ${s.xx}\,\mathrm{MPa}$, $\sigma_{yy} = ${s.yy}\,\mathrm{MPa}$ and $\sigma_{zz} = ${s.zz}\,\mathrm{MPa}$, with all shear stresses zero`;
    const temp = withT ? r`; the temperature has changed by $\Delta T = ${dT}\,{}^\circ\mathrm{C}$` : "";
    const consts = constants(m, withT ? ["E", "nu", "alpha"] : ["E", "nu"]);
    const law = dm(r`\varepsilon_{${dir}} = \frac{\sigma_{${dir}} - \nu\,(\sigma_{${j}} + \sigma_{${k}})}{E}${withT ? r` + \alpha\,\Delta T` : ""}`);
    const numbers = dm(
      r`\varepsilon_{${dir}} = \frac{${s[dir]} - ${g(m.nu)}\,(${s[j]} + ${par(s[k])})}{${g(E)}}${withT ? r` + (${g(m.alpha)}\times 10^{-6})(${par(dT)})` : ""} = ${withT ? r`${num(mech)}\times 10^{-6} + ${par(therm)}\times 10^{-6} = ` : ""}${num(eps)}\times 10^{-6}`,
    );
    const hint = r`Use the 3-D Hooke's law for $\varepsilon_{${dir}}$: its own stress over $E$, minus $\nu/E$ times the other two normal stresses${withT ? r`, plus the free thermal strain $\alpha\,\Delta T$` : ""}. Shear stresses do not affect normal strains.`;
    if (ask === "dlen") {
      const dl = eps * 1e-6 * L;
      return numericStep({
        body: r`${cap(withArticle(m))} block (${consts}) is uniformly loaded so that ${stresses}${temp}. Its edge parallel to the $${dir.charAt(0)}$-axis is $${L}\,\mathrm{mm}$ long.`,
        question: r`By how much does that edge change length? Give it in mm (extension positive) ${SF3}.`,
        answer: dl,
        floor: 0.0001,
        unit: U.mm,
        suffix: "mm",
        hint: `${hint} Then multiply the strain by the edge length.`,
        explanation: paras(law, numbers, dm(r`\Delta L = \varepsilon_{${dir}}\,L = (${num(eps)}\times 10^{-6})(${L}\,\mathrm{mm}) = ${num(dl)}\,\mathrm{mm}`)),
        tags: ["hooke", "strain"],
      });
    }
    return numericStep({
      body: r`At a point in ${withArticle(m)} component (${consts}) the stresses are ${stresses}${temp}.`,
      question: r`What is the normal strain $\varepsilon_{${dir}}$? Give it in micro-strain ($10^{-6}$) ${SF3}.`,
      answer: eps,
      floor: 0.05,
      unit: U.micro,
      suffix: "μ",
      hint,
      explanation: paras(law, numbers),
      tags: ["hooke", "strain"],
    });
  },
});

/** Display line deriving G = E/(2(1+ν)) for a material. */
const shearModulusTex = (m: Material) =>
  dm(r`G = \frac{E}{2(1+\nu)} = \frac{${g(m.E)}\,\mathrm{GPa}}{2(1 + ${g(m.nu)})} = ${num(m.E / (2 * (1 + m.nu)))}\,\mathrm{GPa}`);

define({
  id: "gen.sm.hooke-shear",
  unitId: "sm4",
  title: "Shear modulus and Hooke's law in shear",
  make: (_seed, rng) => {
    const ask = pick(rng, ["G", "gamma", "gamma-E", "tau", "nu"] as const);
    if (ask === "nu") {
      const E = pick(rng, [69, 70, 72, 100, 105, 110, 115, 120, 195, 200, 205, 210]);
      const nuTrue = pick(rng, [0.26, 0.28, 0.29, 0.3, 0.31, 0.32, 0.33, 0.34, 0.35]);
      const G = roundSig(E / (2 * (1 + nuTrue)), 3); // the "measured" shear modulus, used as stated
      const nu = E / (2 * G) - 1;
      return numericStep({
        body: r`Tests on an isotropic, linear-elastic alloy give Young's modulus $E = ${E}\,\mathrm{GPa}$ (from a tension test) and shear modulus $G = ${g(G)}\,\mathrm{GPa}$ (from a torsion test).`,
        question: r`What is the alloy's Poisson's ratio $\nu$? Give it as a decimal ${SF3}.`,
        answer: nu,
        floor: 0.0001,
        unit: U.none,
        hint: r`For an isotropic material the three constants are not independent: one relation links $G$, $E$ and $\nu$.`,
        explanation: dm(r`G = \frac{E}{2(1+\nu)} \;\Rightarrow\; \nu = \frac{E}{2G} - 1 = \frac{${E}}{2(${g(G)})} - 1 = ${num(nu)}`),
        tags: ["hooke", "elastic-constants"],
      });
    }
    if (ask === "G") {
      const m = pick(rng, [STEEL, ALUMINUM, COPPER, TITANIUM, BRASS, NYLON]);
      return numericStep({
        body: r`${cap(withArticle(m))} part is isotropic and linear elastic with ${constants(m, ["E", "nu"])}.`,
        question: r`What is its shear modulus $G$? Give it in GPa ${SF3}.`,
        answer: m.E / (2 * (1 + m.nu)),
        floor: 0.005,
        unit: U.GPa,
        suffix: "GPa",
        hint: r`For an isotropic material $G$ is fixed by $E$ and $\nu$.`,
        explanation: shearModulusTex(m),
        tags: ["hooke", "elastic-constants"],
      });
    }
    const m = pick(rng, [STEEL, ALUMINUM, COPPER, TITANIUM, BRASS]);
    const G = m.E / (2 * (1 + m.nu)); // GPa
    if (ask === "tau") {
      const gamma = pick(rng, [200, 250, 300, 400, 500, 600, 750, 800, 1000, 1200]); // μrad
      const tau = G * 1000 * gamma * 1e-6; // MPa
      return numericStep({
        body: r`A strain-gauge rosette on ${withArticle(m)} shaft (${constants(m, ["E", "nu"])}) shows an engineering shear strain $\gamma = ${gamma}\times 10^{-6}\,\mathrm{rad}$; the material is still linear elastic.`,
        question: r`What is the corresponding shear stress $\tau$? Give it in MPa ${SF3}.`,
        answer: tau,
        floor: 0.005,
        unit: U.MPa,
        suffix: "MPa",
        hint: r`Hooke's law in shear is $\tau = G\gamma$; you need $G$ from $E$ and $\nu$ first.`,
        explanation: paras(shearModulusTex(m), dm(r`\tau = G\gamma = (${num(G * 1000)}\,\mathrm{MPa})(${gamma}\times 10^{-6}) = ${num(tau)}\,\mathrm{MPa}`)),
        tags: ["hooke", "shear-strain"],
      });
    }
    const tau = pick(rng, [20, 25, 30, 40, 50, 60, 75, 80, 100]);
    const fromE = ask === "gamma-E";
    const Gused = fromE ? G : roundSig(G, 2); // a quoted handbook value when G is given directly
    const gamma = (tau / (Gused * 1000)) * 1e6; // μrad
    return numericStep({
      body: fromE
        ? r`${cap(withArticle(m))} element (${constants(m, ["E", "nu"])}) is in pure shear with $\tau_{xy} = ${tau}\,\mathrm{MPa}$.`
        : r`${cap(withArticle(m))} element with shear modulus $G = ${g(Gused)}\,\mathrm{GPa}$ is in pure shear with $\tau_{xy} = ${tau}\,\mathrm{MPa}$.`,
      question: r`What is the engineering shear strain $\gamma_{xy}$? Give it in micro-radians ($10^{-6}\,\mathrm{rad}$) ${SF3}.`,
      answer: gamma,
      floor: 0.05,
      unit: U.urad,
      suffix: "μrad",
      hint: fromE ? r`Find $G$ from $E$ and $\nu$ first, then use Hooke's law in shear.` : r`Hooke's law in shear: $\tau_{xy} = G\gamma_{xy}$. Convert $G$ to MPa first.`,
      explanation: paras(
        fromE && shearModulusTex(m),
        dm(r`\gamma_{xy} = \frac{\tau_{xy}}{G} = \frac{${tau}\,\mathrm{MPa}}{${num(Gused * 1000)}\,\mathrm{MPa}} = ${num(gamma)}\times 10^{-6}\,\mathrm{rad}`),
      ),
      tags: ["hooke", "shear-strain"],
    });
  },
});

define({
  id: "gen.sm.plane-stress-inverse",
  unitId: "sm4",
  title: "Plane stress: stresses from measured strains",
  make: (_seed, rng) => {
    const ask = pick(rng, ["sxx", "syy", "sxx", "txy", "ezz"] as const);
    const m = pick(rng, [STEEL, ALUMINUM, TITANIUM, COPPER]);
    const E = m.E * 1000; // MPa
    const nu = m.nu;
    const G = E / (2 * (1 + nu)); // MPa
    const factor = E / (1 - nu * nu); // MPa
    const calc = (q: { exx: number; eyy: number; gxy: number }) => ({
      sxx: factor * (q.exx + nu * q.eyy) * 1e-6,
      syy: factor * (q.eyy + nu * q.exx) * 1e-6,
      txy: G * q.gxy * 1e-6,
      ezz: (-nu / (1 - nu)) * (q.exx + q.eyy), // μ
    });
    const q = draw(
      () => ({ exx: 50 * randInt(rng, -12, 20), eyy: 50 * randInt(rng, -12, 20), gxy: 50 * randNonZero(rng, 14) }),
      (q) => {
        const c = calc(q);
        if (Math.abs(c.sxx) > 300 || Math.abs(c.syy) > 300 || Math.abs(c.txy) > 200) return false;
        return ask === "ezz" ? Math.abs(c.ezz) >= 20 : Math.abs(c[ask]) >= 5;
      },
    );
    const c = calc(q);
    const body = r`Strain gauges bonded to the free, unloaded surface of ${withArticle(m)} plate (plane stress: $\sigma_{zz} = \tau_{yz} = \tau_{zx} = 0$) read $\varepsilon_{xx} = ${q.exx}\times 10^{-6}$ and $\varepsilon_{yy} = ${q.eyy}\times 10^{-6}$${ask === "txy" ? r`, and the rosette gives the shear strain $\gamma_{xy} = ${q.gxy}\times 10^{-6}\,\mathrm{rad}$` : ""}. ${constants(m, ["E", "nu"])}.`;
    if (ask === "txy") {
      return numericStep({
        body,
        question: r`What is the shear stress $\tau_{xy}$? Give it in MPa ${SF3}.`,
        answer: c.txy,
        floor: 0.005,
        unit: U.MPa,
        suffix: "MPa",
        hint: r`Shear decouples from the normal components in an isotropic material: $\tau_{xy} = G\gamma_{xy}$, with $G$ from $E$ and $\nu$.`,
        explanation: paras(
          dm(r`G = \frac{E}{2(1+\nu)} = \frac{${g(E)}}{2(1 + ${g(nu)})} = ${num(G)}\,\mathrm{MPa}`),
          dm(r`\tau_{xy} = G\gamma_{xy} = (${num(G)})(${q.gxy}\times 10^{-6}) = ${num(c.txy)}\,\mathrm{MPa}`),
        ),
        tags: ["hooke", "plane-stress"],
      });
    }
    if (ask === "ezz") {
      return numericStep({
        body,
        question: r`What is the through-thickness strain $\varepsilon_{zz}$? Give it in micro-strain ($10^{-6}$) ${SF3}.`,
        answer: c.ezz,
        floor: 0.05,
        unit: U.micro,
        suffix: "μ",
        hint: r`$\sigma_{zz} = 0$ does not make $\varepsilon_{zz}$ zero. Write $\varepsilon_{zz}$ from Hooke's law in terms of $\sigma_{xx} + \sigma_{yy}$, then express that sum through the measured strains.`,
        explanation: paras(
          dm(r`\varepsilon_{zz} = -\frac{\nu}{E}\left(\sigma_{xx} + \sigma_{yy}\right), \qquad \sigma_{xx} + \sigma_{yy} = \frac{E}{1-\nu}\left(\varepsilon_{xx} + \varepsilon_{yy}\right)`),
          dm(r`\varepsilon_{zz} = -\frac{\nu}{1-\nu}\left(\varepsilon_{xx} + \varepsilon_{yy}\right) = -\frac{${g(nu)}}{1 - ${g(nu)}}\left(${q.exx} + ${par(q.eyy)}\right)\times 10^{-6} = ${num(c.ezz)}\times 10^{-6}`),
          c.ezz < 0 ? r`The plate gets thinner even though $\sigma_{zz} = 0$.` : r`The plate gets thicker even though $\sigma_{zz} = 0$.`,
        ),
        tags: ["hooke", "plane-stress"],
      });
    }
    const isX = ask === "sxx";
    const [a1, a2] = isX ? ["xx", "yy"] : ["yy", "xx"];
    const [e1, e2] = isX ? [q.exx, q.eyy] : [q.eyy, q.exx];
    const sigma = isX ? c.sxx : c.syy;
    return numericStep({
      body,
      question: r`What is the normal stress $\sigma_{${a1}}$? Give it in MPa (tension positive) ${SF3}.`,
      answer: sigma,
      floor: 0.005,
      unit: U.MPa,
      suffix: "MPa",
      hint: r`Write the two plane-stress Hooke's-law equations for $\varepsilon_{xx}$ and $\varepsilon_{yy}$ and solve them together for the stresses; $\sigma = E\varepsilon$ alone ignores the Poisson coupling.`,
      explanation: paras(
        dm(r`\sigma_{${a1}} = \frac{E}{1-\nu^2}\left(\varepsilon_{${a1}} + \nu\,\varepsilon_{${a2}}\right), \qquad \frac{E}{1-\nu^2} = \frac{${g(E)}}{1 - ${g(nu)}^2} = ${num(factor)}\,\mathrm{MPa}`),
        dm(r`\sigma_{${a1}} = (${num(factor)})\left(${e1} + ${g(nu)}\times ${par(e2)}\right)\times 10^{-6} = ${num(sigma)}\,\mathrm{MPa}`),
        r`(Using $\sigma_{${a1}} = E\varepsilon_{${a1}}$ alone would give $${num(E * e1 * 1e-6)}\,\mathrm{MPa}$, which ignores the Poisson coupling with $\varepsilon_{${a2}}$.)`,
      ),
      tags: ["hooke", "plane-stress"],
    });
  },
});

define({
  id: "gen.sm.plane-strain-sigma-zz",
  unitId: "sm4",
  title: "Plane strain: the out-of-plane stress σzz",
  make: (_seed, rng) => {
    const ask = pick(rng, ["szz", "szz", "szzT", "exx"] as const);
    const m = pick(rng, [STEEL, ALUMINUM, COPPER, TITANIUM]);
    const E = m.E * 1000; // MPa
    const nu = m.nu;
    const a = m.alpha * 1e-6;
    const withT = ask === "szzT" || (ask === "exx" && rng() < 0.4);
    const dT = withT ? pick(rng, [10, 15, 20, 25, 30, 40, -10, -20]) : 0;
    const where = pick(rng, ["a long tunnel lining", "a long dam", "a long buried pipe", "a long retaining wall"]);
    const calc = (q: { sxx: number; syy: number }) => {
      const szz = nu * (q.sxx + q.syy) - E * a * dT; // MPa
      const exx = (1e6 * (q.sxx - nu * (q.syy + szz))) / E + m.alpha * dT; // μ
      return { szz, exx };
    };
    const q = draw(
      () => ({ sxx: 10 * randInt(rng, -15, 15), syy: 10 * randInt(rng, -15, 15) }),
      (q) => {
        const c = calc(q);
        if (Math.abs(c.szz) > 300) return false;
        return ask === "exx" ? Math.abs(c.exx) >= 20 : Math.abs(c.szz) >= 3;
      },
    );
    const c = calc(q);
    const tT = withT ? r` + \alpha\,\Delta T` : "";
    const tNum = withT ? r` + (${g(m.alpha)}\times 10^{-6})(${par(dT)})` : "";
    const szzLaw = r`\sigma_{zz} = \nu(\sigma_{xx} + \sigma_{yy})${withT ? r` - E\alpha\,\Delta T` : ""}`;
    const szzNum = r`${g(nu)}\,(${q.sxx} + ${par(q.syy)})${withT ? r` - (${g(E)})(${g(m.alpha)}\times 10^{-6})(${par(dT)})` : ""} = ${num(c.szz)}\,\mathrm{MPa}`;
    const body = r`A slice of ${where} is modelled in plane strain ($\varepsilon_{zz} = \gamma_{yz} = \gamma_{zx} = 0$, with $z$ along its length). At a point the in-plane normal stresses are $\sigma_{xx} = ${q.sxx}\,\mathrm{MPa}$ and $\sigma_{yy} = ${q.syy}\,\mathrm{MPa}$${withT ? r`, and the temperature has changed by $\Delta T = ${dT}\,{}^\circ\mathrm{C}$ since it was stress-free` : ""}. ${constants(m, withT ? ["E", "nu", "alpha"] : ["E", "nu"])}.`;
    if (ask === "exx") {
      return numericStep({
        body,
        question: r`What is the in-plane normal strain $\varepsilon_{xx}$? Give it in micro-strain ($10^{-6}$) ${SF3}.`,
        answer: c.exx,
        floor: 0.05,
        unit: U.micro,
        suffix: "μ",
        hint: r`Plane strain is not plane stress: first find the $\sigma_{zz}$ that keeps $\varepsilon_{zz} = 0$, then use the full 3-D Hooke's law for $\varepsilon_{xx}$.`,
        explanation: paras(
          dm(r`${szzLaw} = ${szzNum}`),
          dm(r`\varepsilon_{xx} = \frac{\sigma_{xx} - \nu(\sigma_{yy} + \sigma_{zz})}{E}${tT} = \frac{${q.sxx} - ${g(nu)}\,(${q.syy} + ${par(c.szz)})}{${g(E)}}${tNum} = ${num(c.exx)}\times 10^{-6}`),
          r`Equivalently, $\varepsilon_{xx} = \left[(1-\nu^2)\sigma_{xx} - \nu(1+\nu)\sigma_{yy}\right]/E${withT ? r` + (1+\nu)\alpha\,\Delta T` : ""}$.`,
        ),
        tags: ["hooke", "plane-strain"],
      });
    }
    return numericStep({
      body,
      question: r`What normal stress $\sigma_{zz}$ must act to keep $\varepsilon_{zz} = 0$? Give it in MPa (tension positive) ${SF3}.`,
      answer: c.szz,
      floor: 0.005,
      unit: U.MPa,
      suffix: "MPa",
      hint: r`Write the 3-D Hooke's law for $\varepsilon_{zz}$${withT ? " (including the thermal strain)" : ""}, set it to zero, and solve for $\sigma_{zz}$.`,
      explanation: paras(
        dm(r`\varepsilon_{zz} = \frac{\sigma_{zz} - \nu(\sigma_{xx} + \sigma_{yy})}{E}${tT} = 0 \;\Rightarrow\; ${szzLaw}`),
        dm(r`\sigma_{zz} = ${szzNum}`),
        withT
          ? r`A temperature change the body cannot follow along $z$ adds $-E\alpha\,\Delta T$ to $\sigma_{zz}$.`
          : r`$E$ does not enter: with $\Delta T = 0$ only Poisson's ratio matters.`,
      ),
      tags: ["hooke", "plane-strain"],
    });
  },
});

define({
  id: "gen.sm.volumetric",
  unitId: "sm4",
  title: "Pressure, bulk modulus and volume change",
  make: (_seed, rng) => {
    const ask = pick(rng, ["K", "theta", "theta", "dV", "submerged"] as const);
    const m = pick(rng, [STEEL, ALUMINUM, COPPER, TITANIUM, BRASS]);
    const E = m.E * 1000; // MPa
    const K = E / (3 * (1 - 2 * m.nu)); // MPa
    const consts = constants(m, ["E", "nu"]);
    const Ktex = dm(r`K = \frac{E}{3(1-2\nu)} = \frac{${g(E)}\,\mathrm{MPa}}{3(1 - 2\times ${g(m.nu)})} = ${num(K)}\,\mathrm{MPa}`);
    if (ask === "K") {
      return numericStep({
        body: r`${cap(withArticle(m))} part is isotropic and linear elastic with ${consts}.`,
        question: r`What is its bulk modulus $K$? Give it in GPa ${SF3}.`,
        answer: K / 1000,
        floor: 0.005,
        unit: U.GPa,
        suffix: "GPa",
        hint: r`Add the three normal-strain equations of Hooke's law: the volumetric strain comes out proportional to the mean normal stress, and that constant defines $K$.`,
        explanation: paras(
          dm(r`K = \frac{E}{3(1-2\nu)} = \frac{${g(m.E)}\,\mathrm{GPa}}{3(1 - 2\times ${g(m.nu)})} = ${num(K / 1000)}\,\mathrm{GPa}`),
          r`As $\nu \to \tfrac12$, $K \to \infty$: the material becomes incompressible.`,
        ),
        tags: ["hooke", "bulk-modulus"],
      });
    }
    if (ask === "submerged") {
      const D = pick(rng, [50, 100, 150, 200, 250, 300]);
      const pw = pick(rng, [10, 20, 25, 30, 40, 50, 60, 80, 100]);
      const askV = rng() < 0.5;
      const theta = (-1e6 * pw) / K; // μ
      const V = (Math.PI * D ** 3) / 6; // mm³
      const dV = theta * 1e-6 * V;
      return numericStep({
        body: r`A solid ${m.name} sphere of diameter $D = ${D}\,\mathrm{mm}$ (${consts}) is lowered into deep water, where the water pressure on its whole surface is $${pw}\,\mathrm{MPa}$.`,
        question: askV
          ? r`What is the change in the sphere's volume? Give $\Delta V$ in $\mathrm{mm^3}$ (increase positive) ${SF3}.`
          : r`What is the sphere's volumetric strain $\theta$? Give it in micro-strain ($10^{-6}$, with its sign) ${SF3}.`,
        answer: askV ? dV : theta,
        floor: 0.05,
        unit: askV ? U.mm3 : U.micro,
        suffix: askV ? "mm³" : "μ",
        hint: r`The water squeezes equally in every direction, so each normal stress is minus the water pressure. Mind the sign: in this course the pressure $p$ is the mean normal stress, positive in tension.`,
        explanation: paras(
          r`Every normal stress is compressive, $\sigma_{xx} = \sigma_{yy} = \sigma_{zz} = -${pw}\,\mathrm{MPa}$, so the course's pressure (mean normal stress) is $p = -${pw}\,\mathrm{MPa}$ — the opposite sign to the fluid-mechanics convention.`,
          Ktex,
          dm(r`\theta = \frac{p}{K} = \frac{-${pw}}{${num(K)}} = ${num(theta)}\times 10^{-6}`),
          askV && dm(r`V = \frac{\pi D^3}{6} = ${num(V)}\,\mathrm{mm^3}, \qquad \Delta V = \theta V = (${num(theta)}\times 10^{-6})(${num(V)}) = ${num(dV)}\,\mathrm{mm^3}`),
        ),
        tags: ["hooke", "bulk-modulus", "pressure"],
      });
    }
    const s = draw(
      () => ({ xx: 10 * randInt(rng, -15, 15), yy: 10 * randInt(rng, -15, 15), zz: 10 * randInt(rng, -15, 15) }),
      (s) => Math.abs((1e6 * (s.xx + s.yy + s.zz)) / 3 / K) >= 20,
    );
    const p = (s.xx + s.yy + s.zz) / 3; // MPa
    const theta = (1e6 * p) / K; // μ
    const stresses = r`$\sigma_{xx} = ${s.xx}\,\mathrm{MPa}$, $\sigma_{yy} = ${s.yy}\,\mathrm{MPa}$ and $\sigma_{zz} = ${s.zz}\,\mathrm{MPa}$, with no shear stresses`;
    const steps = [
      dm(r`p = \tfrac13\left(\sigma_{xx} + \sigma_{yy} + \sigma_{zz}\right) = \tfrac13\left(${s.xx} + ${par(s.yy)} + ${par(s.zz)}\right) = ${num(p)}\,\mathrm{MPa}`),
      Ktex,
      dm(r`\theta = \frac{p}{K} = \frac{${num(p)}}{${num(K)}} = ${num(theta)}\times 10^{-6}`),
    ];
    const hint = r`Find the pressure — in this course the mean normal stress, positive in tension — and the bulk modulus $K$; the volumetric strain is their ratio. Shear stresses would not change the volume.`;
    if (ask === "dV") {
      const [a, b, c] = [pick(rng, [50, 80, 100, 120, 150]), pick(rng, [80, 100, 150, 200]), pick(rng, [100, 150, 200, 250, 300])];
      const V = a * b * c;
      const dV = theta * 1e-6 * V;
      return numericStep({
        body: r`${cap(withArticle(m))} block measuring $${a}\times ${b}\times ${c}\,\mathrm{mm}$ (${consts}) is loaded on its faces so that it is uniformly stressed: ${stresses}.`,
        question: r`By how much does its volume change? Give $\Delta V$ in $\mathrm{mm^3}$ (increase positive) ${SF3}.`,
        answer: dV,
        floor: 0.005,
        unit: U.mm3,
        suffix: "mm³",
        hint: r`${hint} Then $\Delta V = \theta V$.`,
        explanation: paras(...steps, dm(r`\Delta V = \theta V = (${num(theta)}\times 10^{-6})(${g(V)}\,\mathrm{mm^3}) = ${num(dV)}\,\mathrm{mm^3}`)),
        tags: ["hooke", "bulk-modulus"],
      });
    }
    return numericStep({
      body: r`At a point in ${withArticle(m)} part (${consts}) the stresses are ${stresses}.`,
      question: r`What is the volumetric strain $\theta = \varepsilon_{xx} + \varepsilon_{yy} + \varepsilon_{zz}$? Give it in micro-strain ($10^{-6}$) ${SF3}.`,
      answer: theta,
      floor: 0.05,
      unit: U.micro,
      suffix: "μ",
      hint,
      explanation: paras(...steps, r`${p < 0 ? "The mean stress is compressive, so the volume shrinks." : "The mean stress is tensile, so the volume grows."} (Adding the three normal strains from Hooke's law gives the same number.)`),
      tags: ["hooke", "bulk-modulus"],
    });
  },
});

define({
  id: "gen.sm.thermal-constrained",
  unitId: "sm4",
  title: "Thermal stress in a constrained body",
  make: (_seed, rng) => {
    const ask = pick(rng, ["full", "full", "x", "xy", "lateral"] as const);
    const m = pick(rng, [STEEL, ALUMINUM, COPPER, BRASS, TITANIUM]);
    const E = m.E * 1000; // MPa
    const nu = m.nu;
    const a = m.alpha * 1e-6;
    // MPa for the stress variants, micro-strain for "lateral"
    const value = (t: number) =>
      ask === "full" ? (-E * a * t) / (1 - 2 * nu) : ask === "x" ? -E * a * t : ask === "xy" ? (-E * a * t) / (1 - nu) : (1 + nu) * m.alpha * t;
    const dT = draw(
      () => pick(rng, [10, 15, 20, 25, 30, 40, 50]) * (rng() < 0.75 ? 1 : -1),
      (t) => ask === "lateral" || Math.abs(value(t)) <= 300,
    );
    const ans = value(dT);
    const consts = constants(m, ["E", "nu", "alpha"]);
    const change = r`Its temperature then ${dT > 0 ? "rises" : "drops"} by $${Math.abs(dT)}\,{}^\circ\mathrm{C}$.`;
    const EaT = r`(${g(E)})(${g(m.alpha)}\times 10^{-6})(${par(dT)})`;
    const walls = r`${cap(withArticle(m))} block (${consts}) sits snugly, stress-free, between two rigid, frictionless walls perpendicular to $x$, which prevent any change of its $x$-dimension; its other four faces are free. ${change}`;
    const tags = ["hooke", "thermal"];
    if (ask === "full") {
      return numericStep({
        body: r`${cap(withArticle(m))} block (${consts}) fits exactly, stress-free, into a rigid cavity that prevents any change of its dimensions in all three directions. ${change}`,
        question: r`What normal stress develops in the block (it is the same in every direction)? Give it in MPa (tension positive) ${SF3}.`,
        answer: ans,
        floor: 0.005,
        unit: U.MPa,
        suffix: "MPa",
        hint: r`All three normal strains are zero and, by symmetry, the three normal stresses are equal. Put that into one of the 3-D Hooke's-law equations with the thermal term.`,
        explanation: paras(
          dm(r`0 = \varepsilon_{xx} = \frac{\sigma - \nu(\sigma + \sigma)}{E} + \alpha\,\Delta T = \frac{(1-2\nu)\,\sigma}{E} + \alpha\,\Delta T \;\Rightarrow\; \sigma = -\frac{E\alpha\,\Delta T}{1 - 2\nu}`),
          dm(r`\sigma = -\frac{${EaT}}{1 - 2(${g(nu)})} = ${num(ans)}\,\mathrm{MPa}`),
          r`That is $1/(1-2\nu) = ${num(1 / (1 - 2 * nu))}$ times the one-direction value $-E\alpha\,\Delta T = ${num(-E * a * dT)}\,\mathrm{MPa}$: confining the body in every direction makes the thermal stress much larger.`,
        ),
        tags,
      });
    }
    if (ask === "x") {
      return numericStep({
        body: walls,
        question: r`What is the normal stress $\sigma_{xx}$ in the block? Give it in MPa (tension positive) ${SF3}.`,
        answer: ans,
        floor: 0.005,
        unit: U.MPa,
        suffix: "MPa",
        hint: r`Only $\varepsilon_{xx}$ is held at zero; the free faces make $\sigma_{yy} = \sigma_{zz} = 0$. Use Hooke's law for $\varepsilon_{xx}$ with the thermal term.`,
        explanation: paras(
          dm(r`0 = \varepsilon_{xx} = \frac{\sigma_{xx}}{E} + \alpha\,\Delta T \;\Rightarrow\; \sigma_{xx} = -E\alpha\,\Delta T = -${EaT} = ${num(ans)}\,\mathrm{MPa}`),
          r`$\nu$ plays no role here because the lateral faces are free to move.`,
        ),
        tags,
      });
    }
    if (ask === "xy") {
      return numericStep({
        body: r`A thin ${m.name} plate (${consts}) is clamped, stress-free, in a rigid frame that prevents any change of its in-plane ($x$ and $y$) dimensions; its faces normal to $z$ are free. ${change}`,
        question: r`What is the in-plane normal stress $\sigma_{xx} = \sigma_{yy}$? Give it in MPa (tension positive) ${SF3}.`,
        answer: ans,
        floor: 0.005,
        unit: U.MPa,
        suffix: "MPa",
        hint: r`Here $\varepsilon_{xx} = \varepsilon_{yy} = 0$, the free faces give $\sigma_{zz} = 0$, and by symmetry $\sigma_{xx} = \sigma_{yy}$.`,
        explanation: paras(
          dm(r`0 = \varepsilon_{xx} = \frac{\sigma - \nu\,\sigma}{E} + \alpha\,\Delta T \;\Rightarrow\; \sigma = -\frac{E\alpha\,\Delta T}{1-\nu}`),
          dm(r`\sigma = -\frac{${EaT}}{1 - ${g(nu)}} = ${num(ans)}\,\mathrm{MPa}`),
        ),
        tags,
      });
    }
    return numericStep({
      body: walls,
      question: r`What is the normal strain $\varepsilon_{yy}$ in the free $y$-direction? Give it in micro-strain ($10^{-6}$) ${SF3}.`,
      answer: ans,
      floor: 0.05,
      unit: U.micro,
      suffix: "μ",
      hint: r`First find $\sigma_{xx}$ from $\varepsilon_{xx} = 0$; then $\varepsilon_{yy}$ collects a Poisson part from $\sigma_{xx}$ as well as the free thermal strain.`,
      explanation: paras(
        dm(r`\sigma_{xx} = -E\alpha\,\Delta T, \qquad \varepsilon_{yy} = -\frac{\nu\,\sigma_{xx}}{E} + \alpha\,\Delta T = \nu\alpha\,\Delta T + \alpha\,\Delta T = (1+\nu)\,\alpha\,\Delta T`),
        dm(r`\varepsilon_{yy} = (1 + ${g(nu)})(${g(m.alpha)}\times 10^{-6})(${par(dT)}) = ${num(ans)}\times 10^{-6}`),
        dT > 0
          ? r`Blocking the expansion along $x$ pushes material sideways, so the free directions expand by more than $\alpha\,\Delta T$.`
          : r`Blocking the contraction along $x$ pulls material in from the sides, so the free directions contract by more than $\alpha\,\Delta T$.`,
      ),
      tags,
    });
  },
});
