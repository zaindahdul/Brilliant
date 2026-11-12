/**
 * Solid mechanics generators, part 3: the foundations unit (sm0) and the later
 * units on beam deflection and shear (sm8), stress and strain transformation and
 * yield (sm9), and stability (sm10).
 *
 * Conventions follow Govindjee, as in the lessons: counter-clockwise moments and
 * tension positive; axes turned counter-clockwise by θ; σx′x′ = σm + σd cos2θ + σxy sin2θ,
 * σx′y′ = −σd sin2θ + σxy cos2θ; σxx = P/A − Mz y/Iz + My z/Iy; τ = VQ/(Ib).
 * Everything is computed internally in N, mm and MPa.
 */
import { define } from "./registry";
import { pick, randInt, type Rng } from "@/lib/random";
import { numeric, r } from "../dsl";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

/** Strip floating-point noise from a computed answer. */
function clean(x: number): number {
  return Math.abs(x) < 1e-9 ? 0 : Number(x.toPrecision(12));
}

/** Absolute tolerance: 1 % of the answer, never below `floor`. */
function tol(x: number, floor: number): number {
  return clean(Math.max(Math.abs(x) * 0.01, floor));
}

/** A number for LaTeX: up to `sig` significant figures, thin-space digit groups from 10 000 up. */
function tex(x: number, sig = 4): string {
  if (x === 0) return "0";
  const v = Number(x.toPrecision(sig));
  const [int, dec] = Math.abs(v).toString().split(".");
  const grouped = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, "\\,") : int;
  return (v < 0 ? "-" : "") + grouped + (dec ? `.${dec}` : "");
}

/** Draw parameter sets until `ok` accepts one (deterministic: `make` uses the generator's rng). */
function draw<T>(make: () => T, ok: (v: T) => boolean): T {
  let v = make();
  for (let i = 0; i < 400 && !ok(v); i++) v = make();
  return v;
}

const sign = (rng: Rng) => (rng() < 0.5 ? -1 : 1);

/** "A" or "An" for the word that follows, at the start of a sentence. */
const Art = (word: string) => (/^[aeiou]/i.test(word) ? "An" : "A");

/** A signed term for the middle of a sum: "+ 20.8" or "- 16.7". */
const term = (v: number, sig = 3) => `${v >= 0 ? "+" : "-"} ${tex(Math.abs(v), sig)}`;

/** A value in parentheses when negative, for use after a minus sign. */
const paren = (v: number) => (v < 0 ? `(${tex(v)})` : tex(v));

/** "a", "a and b", "a, b and c". */
const list = (items: string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);
const deg = (d: number) => (d * Math.PI) / 180;

/* ------------------------------------------------------------------ */
/* Unit sm0 — foundations                                              */
/* ------------------------------------------------------------------ */

define({
  id: "gen.sm.moment-about-point",
  unitId: "sm0",
  title: "Net moment of two forces about a pivot",
  make: (_seed, rng) => {
    const p = draw(
      () => ({ F1: 10 * randInt(rng, 1, 8), x1: randInt(rng, 1, 4), d1: sign(rng), F2: 10 * randInt(rng, 1, 8), x2: randInt(rng, 1, 4), d2: sign(rng) }),
      (v) => v.x1 * v.d1 * v.F1 - v.x2 * v.d2 * v.F2 !== 0,
    );
    // Force 1 acts to the right of O (lever arm +x1), force 2 to the left (lever arm −x2); "up" is +.
    const m1 = p.x1 * p.d1 * p.F1;
    const m2 = -p.x2 * p.d2 * p.F2;
    const M = m1 + m2;
    const dir = (d: number) => (d > 0 ? "up" : "down");
    const turn = (m: number) => (m > 0 ? "counter-clockwise" : "clockwise");
    return numeric("g", {
      body: r`A horizontal bar is pivoted at $O$. A force of $${p.F1}\ \mathrm{N}$ pushes **${dir(p.d1)}** on it $${p.x1}\ \mathrm{m}$ to the right of $O$, and a force of $${p.F2}\ \mathrm{N}$ pushes **${dir(p.d2)}** on it $${p.x2}\ \mathrm{m}$ to the left of $O$.`,
      question: r`What is the total moment about $O$? Take counter-clockwise as positive.`,
      answer: M,
      tolerance: tol(M, 0.5),
      suffix: r`$\mathrm{N \cdot m}$`,
      answerDisplay: r`${tex(M)}\ \mathrm{N \cdot m}`,
      hint: "Find the size of each moment (force times distance from O), decide which way each force alone would turn the bar, then add with signs.",
      explanation: r`The $${p.F1}\ \mathrm{N}$ force would turn the bar ${turn(m1)}: $${tex(m1)}\ \mathrm{N \cdot m}$. The $${p.F2}\ \mathrm{N}$ force would turn it ${turn(m2)}: $${tex(m2)}\ \mathrm{N \cdot m}$. Total: $${tex(M)}\ \mathrm{N \cdot m}$.`,
      tags: ["moment", "sign-convention"],
    });
  },
});

define({
  id: "gen.sm.udl-moment",
  unitId: "sm0",
  title: "Moment of a uniform load about a point",
  make: (_seed, rng) => {
    const q = pick(rng, [2, 3, 4, 5, 6, 8, 10]);
    const a = randInt(rng, 0, 3);
    const len = randInt(rng, 2, 6);
    const b = a + len;
    const F = q * len;
    const xbar = (a + b) / 2;
    const M = F * xbar;
    return numeric("g", {
      question: r`A uniform load of $${q}\ \mathrm{kN/m}$ acts on a beam from $x = ${a}\ \mathrm{m}$ to $x = ${b}\ \mathrm{m}$. What is the size of its moment about the point $x = 0$?`,
      answer: M,
      tolerance: tol(M, 0.2),
      suffix: r`$\mathrm{kN \cdot m}$`,
      answerDisplay: r`${tex(M)}\ \mathrm{kN \cdot m}`,
      hint: "Replace the distributed load by a single force at the middle of the loaded length. Then take its moment.",
      explanation: r`The load is equivalent to $${q} \times ${len} = ${F}\ \mathrm{kN}$ acting at the middle of the loaded length, $x = ${tex(xbar)}\ \mathrm{m}$. Its moment about $x = 0$ is $${F} \times ${tex(xbar)} = ${tex(M)}\ \mathrm{kN \cdot m}$.`,
      tags: ["resultant", "distributed-load", "moment"],
    });
  },
});

define({
  id: "gen.sm.beam-reaction",
  unitId: "sm0",
  title: "Support reaction of a simply supported beam",
  make: (_seed, rng) => {
    const L = pick(rng, [4, 5, 6, 8, 10]);
    const a = randInt(rng, 1, L - 1);
    const P = L * pick(rng, [2, 3, 4, 5, 6]);
    const askB = rng() < 0.5;
    const RB = (P * a) / L;
    const RA = P - RB;
    const ans = askB ? RB : RA;
    return numeric("g", {
      body: r`A beam $${L}\ \mathrm{m}$ long sits on a pin at $A$ ($x = 0$) and a roller at $B$ ($x = ${L}\ \mathrm{m}$). A downward load of $${P}\ \mathrm{kN}$ acts at $x = ${a}\ \mathrm{m}$.`,
      question: r`What is the upward reaction at $${askB ? "B" : "A"}$?`,
      answer: ans,
      tolerance: tol(ans, 0.05),
      prefix: r`$${askB ? "B" : "A"} =$`,
      suffix: "kN",
      hint: "Take moments about the other support, so that its unknown reaction drops out of the equation.",
      explanation: r`Moments about $A$: $B \times ${L} - ${P} \times ${a} = 0$, so $B = ${tex(RB)}\ \mathrm{kN}$. Vertical balance: $A = ${P} - ${tex(RB)} = ${tex(RA)}\ \mathrm{kN}$.`,
      tags: ["equilibrium", "reactions"],
    });
  },
});

define({
  id: "gen.sm.axial-cut",
  unitId: "sm0",
  title: "Internal axial force at a section cut",
  make: (_seed, rng) => {
    const loads = [1, 2, 3].map((x) => ({ x, P: sign(rng) * randInt(rng, 2, 12) }));
    const cut = pick(rng, [0.5, 1.5, 2.5]);
    const right = loads.filter((l) => l.x > cut);
    const R = right.reduce((s, l) => s + l.P, 0);
    const describe = (l: { x: number; P: number }) => r`$${Math.abs(l.P)}\ \mathrm{kN}$ to the ${l.P > 0 ? "right" : "left"} at $x = ${l.x}\ \mathrm{m}$`;
    return numeric("g", {
      body: r`A bar $3\ \mathrm{m}$ long is fixed at its left end ($x = 0$). Three forces act along it: ${loads.map(describe).join(", ")}.`,
      question: r`What is the internal axial force $R$ at a cut at $x = ${cut}\ \mathrm{m}$? Tension is positive.`,
      answer: R,
      tolerance: tol(R, 0.05),
      prefix: r`$R =$`,
      suffix: "kN",
      hint: "Keep the piece to the right of the cut. Add up, with signs, only the applied forces that act on that piece: to the right is positive.",
      explanation: r`The piece to the right of the cut carries ${right.length === 1 ? "only " : ""}${list(right.map(describe))}. Balance of that piece gives $R = ${right.length === 1 ? "" : right.map((l, i) => (i === 0 ? tex(l.P) : term(l.P))).join(" ") + " = "}${tex(R)}\ \mathrm{kN}$${R === 0 ? "" : R > 0 ? ", tension" : ", compression"}.`,
      tags: ["internal-force", "section-cut"],
    });
  },
});

define({
  id: "gen.sm.stress-units",
  unitId: "sm0",
  title: "Force per area in MPa",
  make: (_seed, rng) => {
    const A = pick(rng, [50, 80, 100, 125, 200, 250, 400, 500]);
    const s = pick(rng, [20, 40, 60, 80, 120, 150, 200]);
    const F = (s * A) / 1000; // kN
    const askForce = rng() < 0.4;
    if (askForce) {
      return numeric("g", {
        question: r`A rod with a cross-section of $${A}\ \mathrm{mm^2}$ may carry at most $${s}\ \mathrm{MPa}$ (force per area). What is the largest force it may carry, in kN?`,
        answer: clean(F),
        tolerance: tol(F, 0.01),
        suffix: "kN",
        hint: r`Force equals force per area times area. Use $1\ \mathrm{MPa} = 1\ \mathrm{N/mm^2}$, then convert newtons to kilonewtons.`,
        explanation: r`$${s}\ \mathrm{N/mm^2} \times ${A}\ \mathrm{mm^2} = ${tex(s * A)}\ \mathrm{N} = ${tex(F)}\ \mathrm{kN}$.`,
        tags: ["units"],
      });
    }
    return numeric("g", {
      question: r`A force of $${tex(F)}\ \mathrm{kN}$ is spread evenly over an area of $${A}\ \mathrm{mm^2}$. What is the force per area, in MPa?`,
      answer: s,
      tolerance: tol(s, 0.1),
      suffix: "MPa",
      hint: "Convert the force to newtons. Newtons divided by square millimetres gives MPa directly.",
      explanation: r`$${tex(F * 1000)}\ \mathrm{N} / ${A}\ \mathrm{mm^2} = ${s}\ \mathrm{N/mm^2} = ${s}\ \mathrm{MPa}$.`,
      tags: ["units"],
    });
  },
});

/* ------------------------------------------------------------------ */
/* Unit sm8 — beam deflection, two-axis bending, shear                 */
/* ------------------------------------------------------------------ */

const BEAM_MATERIALS = [
  { name: "steel", E: 200 },
  { name: "aluminium", E: 70 },
  { name: "timber", E: 12 },
] as const;

const DEFLECTION_CASES = [
  { id: "cant-point", label: "a cantilever", load: "point", where: "at its free end", at: "at the free end", coeff: 1 / 3, power: 3, formula: r`\dfrac{PL^3}{3EI}` },
  { id: "cant-udl", label: "a cantilever", load: "udl", where: "along its whole length", at: "at the free end", coeff: 1 / 8, power: 4, formula: r`\dfrac{wL^4}{8EI}` },
  { id: "ss-point", label: "a simply supported beam", load: "point", where: "at mid-span", at: "at mid-span", coeff: 1 / 48, power: 3, formula: r`\dfrac{PL^3}{48EI}` },
  { id: "ss-udl", label: "a simply supported beam", load: "udl", where: "along its whole length", at: "at mid-span", coeff: 5 / 384, power: 4, formula: r`\dfrac{5wL^4}{384EI}` },
] as const;

define({
  id: "gen.sm.beam-deflection",
  unitId: "sm8",
  title: "Standard beam deflections",
  make: (_seed, rng) => {
    const c = pick(rng, DEFLECTION_CASES);
    const p = draw(
      () => {
        const m = pick(rng, BEAM_MATERIALS);
        const I = pick(rng, [2, 4, 8, 12, 20, 40, 80]); // ×10⁶ mm⁴
        const L = pick(rng, [1.5, 2, 2.5, 3, 4, 5, 6]); // m
        const mag = c.load === "point" ? pick(rng, [1, 2, 3, 5, 8, 10, 12, 15, 20]) : pick(rng, [1, 2, 3, 4, 5, 6, 8, 10]);
        const EI = m.E * 1000 * I * 1e6; // N·mm²
        const Lmm = L * 1000;
        // point load in N; distributed load in N/mm (1 kN/m = 1 N/mm)
        const delta = c.load === "point" ? (c.coeff * mag * 1000 * Lmm ** 3) / EI : (c.coeff * mag * Lmm ** 4) / EI;
        return { m, I, L, mag, delta };
      },
      (v) => v.delta >= 0.3 && v.delta <= 40,
    );
    const loadText = c.load === "point" ? r`a load of $${p.mag}\ \mathrm{kN}$ ${c.where}` : r`a uniform load of $${p.mag}\ \mathrm{kN/m}$ ${c.where}`;
    return numeric("g", {
      question: r`${Art(p.m.name)} ${p.m.name} beam ($E = ${p.m.E}\ \mathrm{GPa}$, $I = ${p.I} \times 10^{6}\ \mathrm{mm^4}$) is $${p.L}\ \mathrm{m}$ long and supported as ${c.label}. It carries ${loadText}. What is the size of its deflection ${c.at}, in mm?`,
      answer: clean(p.delta),
      tolerance: tol(p.delta, 0.005),
      suffix: "mm",
      hint: r`Pick the standard result that matches the supports and the load. Work in N and mm: $E$ in MPa, and $1\ \mathrm{kN/m} = 1\ \mathrm{N/mm}$.`,
      explanation: r`$\delta = ${c.formula}$ with $EI = ${tex(p.m.E * 1000)} \times ${p.I} \times 10^{6}\ \mathrm{N \cdot mm^2}$ and $L = ${tex(p.L * 1000)}\ \mathrm{mm}$ gives $\delta = ${tex(p.delta, 3)}\ \mathrm{mm}$.`,
      tags: ["deflection"],
    });
  },
});

define({
  id: "gen.sm.required-inertia",
  unitId: "sm8",
  title: "Second moment of area needed for a deflection limit",
  make: (_seed, rng) => {
    const m = pick(rng, BEAM_MATERIALS);
    const L = pick(rng, [3, 4, 5, 6]);
    const w = pick(rng, [2, 3, 4, 5, 6, 8]);
    const ratio = pick(rng, [250, 300, 360, 400]);
    const dmax = (L * 1000) / ratio;
    const I = (5 * w * (L * 1000) ** 4) / (384 * m.E * 1000 * dmax); // mm⁴
    const ans = I / 1e6;
    return numeric("g", {
      question: r`A simply supported ${m.name} beam ($E = ${m.E}\ \mathrm{GPa}$) spans $${L}\ \mathrm{m}$ and carries a uniform load of $${w}\ \mathrm{kN/m}$. Its mid-span deflection must not exceed the span divided by $${ratio}$. What is the smallest second moment of area that will do? Answer in units of $10^{6}\ \mathrm{mm^4}$.`,
      answer: clean(ans),
      tolerance: tol(ans, 0.01),
      prefix: r`$I \ge$`,
      suffix: r`$\times 10^{6}\ \mathrm{mm^4}$`,
      answerDisplay: r`${tex(ans, 3)} \times 10^{6}\ \mathrm{mm^4}`,
      hint: r`Work out the allowed deflection in mm first. Then rearrange the mid-span deflection of a uniformly loaded, simply supported beam for $I$.`,
      explanation: r`Allowed deflection: $${tex(L * 1000)}/${ratio} = ${tex(dmax, 4)}\ \mathrm{mm}$. $I \ge \dfrac{5wL^4}{384E\delta_{\max}} = \dfrac{5 \times ${w} \times ${tex(L * 1000)}^4}{384 \times ${tex(m.E * 1000)} \times ${tex(dmax, 4)}} = ${tex(ans, 3)} \times 10^{6}\ \mathrm{mm^4}$.`,
      tags: ["deflection", "design"],
    });
  },
});

define({
  id: "gen.sm.two-axis-stress",
  unitId: "sm8",
  title: "Stress at a corner under bending about two axes",
  make: (_seed, rng) => {
    const h = pick(rng, [80, 100, 120, 150]);
    const b = pick(rng, [40, 50, 60]);
    const Mz = sign(rng) * pick(rng, [1, 1.5, 2, 3, 4]);
    const My = sign(rng) * pick(rng, [0.3, 0.5, 0.8, 1, 1.2]);
    const withAxial = rng() < 0.4;
    const P = withAxial ? sign(rng) * pick(rng, [20, 30, 40, 60]) : 0;
    const y = sign(rng) * (h / 2);
    const z = sign(rng) * (b / 2);
    const Iz = (b * h ** 3) / 12;
    const Iy = (h * b ** 3) / 12;
    const sA = (P * 1000) / (b * h);
    const sZ = (-Mz * 1e6 * y) / Iz;
    const sY = (My * 1e6 * z) / Iy;
    const s = sA + sZ + sY;
    return numeric("g", {
      body: r`A rectangular section is $${h}\ \mathrm{mm}$ tall (along $y$) and $${b}\ \mathrm{mm}$ wide (along $z$). It carries $M_z = ${tex(Mz)}\ \mathrm{kN \cdot m}$ and $M_y = ${tex(My)}\ \mathrm{kN \cdot m}$${withAxial ? r`, together with an axial force $P = ${P}\ \mathrm{kN}$ (tension positive)` : ", with no axial force"}.`,
      question: r`What is $\sigma_{xx}$ at the corner $(y, z) = (${y}, ${z})\ \mathrm{mm}$? Include the sign.`,
      answer: clean(s),
      tolerance: tol(s, 0.3),
      prefix: r`$\sigma_{xx} =$`,
      suffix: "MPa",
      hint: r`$\sigma_{xx} = \dfrac{P}{A} - \dfrac{M_z y}{I_z} + \dfrac{M_y z}{I_y}$. Compute $I_z = bh^3/12$ and $I_y = hb^3/12$, convert the moments to $\mathrm{N \cdot mm}$, and keep every sign.`,
      explanation: r`$I_z = ${b} \times ${h}^3/12 = ${tex(Iz / 1e6, 4)} \times 10^{6}\ \mathrm{mm^4}$ and $I_y = ${h} \times ${b}^3/12 = ${tex(Iy / 1e6, 4)} \times 10^{6}\ \mathrm{mm^4}$. ${withAxial ? r`$P/A = ${tex(sA, 3)}\ \mathrm{MPa}$, ` : ""}$-M_z y/I_z = ${tex(sZ, 3)}\ \mathrm{MPa}$ and $M_y z/I_y = ${tex(sY, 3)}\ \mathrm{MPa}$. Sum: $${withAxial ? tex(sA, 3) + " " : ""}${withAxial ? term(sZ) : tex(sZ, 3)} ${term(sY)} = ${tex(s, 3)}\ \mathrm{MPa}$.`,
      tags: ["two-axis-bending", "combined-loading"],
    });
  },
});

define({
  id: "gen.sm.rect-shear",
  unitId: "sm8",
  title: "Shear stress in a rectangular section",
  make: (_seed, rng) => {
    const b = pick(rng, [40, 50, 60, 80, 100]);
    const h = pick(rng, [100, 120, 150, 200, 240]);
    const V = pick(rng, [5, 8, 10, 12, 15, 20, 30]);
    const A = b * h;
    const tmax = (1.5 * V * 1000) / A;
    const quarter = rng() < 0.4;
    const ans = quarter ? 0.75 * tmax : tmax;
    return numeric("g", {
      question: quarter
        ? r`A rectangular beam section is $${b}\ \mathrm{mm}$ wide and $${h}\ \mathrm{mm}$ deep and carries a shear force of $${V}\ \mathrm{kN}$. What is the shear stress at a height $y = ${h / 4}\ \mathrm{mm}$ above the neutral axis?`
        : r`A rectangular beam section is $${b}\ \mathrm{mm}$ wide and $${h}\ \mathrm{mm}$ deep and carries a shear force of $${V}\ \mathrm{kN}$. What is the largest shear stress in the section?`,
      answer: clean(ans),
      tolerance: tol(ans, 0.01),
      prefix: r`$\tau =$`,
      suffix: "MPa",
      hint: quarter
        ? r`Use $\tau = VQ/(Ib)$ with $Q$ for the area above the cut, or the parabola $\tau(y) = \dfrac{V}{2I}\Big[\Big(\dfrac{h}{2}\Big)^2 - y^2\Big]$.`
        : "For a rectangle the peak, at the neutral axis, is one and a half times the average shear stress.",
      explanation: quarter
        ? r`$\tau_{\max} = \dfrac{3V}{2A} = \dfrac{3 \times ${tex(V * 1000)}}{2 \times ${tex(A)}} = ${tex(tmax, 3)}\ \mathrm{MPa}$ at the neutral axis. The distribution is a parabola, so at $y = h/4$ the stress is $1 - (1/2)^2 = 0.75$ of that: $${tex(ans, 3)}\ \mathrm{MPa}$.`
        : r`$\tau_{\max} = \dfrac{3V}{2A} = \dfrac{3 \times ${tex(V * 1000)}}{2 \times ${b} \times ${h}} = ${tex(tmax, 3)}\ \mathrm{MPa}$, at the neutral axis.`,
      tags: ["shear-stress"],
    });
  },
});

define({
  id: "gen.sm.fastener-spacing",
  unitId: "sm8",
  title: "Fastener spacing from shear flow",
  make: (_seed, rng) => {
    const b = pick(rng, [80, 100, 120, 150]);
    const t = pick(rng, [30, 40, 50, 60]);
    const V = pick(rng, [2, 3, 4, 5, 6, 8]);
    const F = pick(rng, [800, 1000, 1200, 1500, 2000, 2500]);
    const I = (b * (2 * t) ** 3) / 12;
    const Q = b * t * (t / 2);
    const q = (V * 1000 * Q) / I; // N/mm
    const s = F / q;
    return numeric("g", {
      body: r`Two identical planks, each $${b}\ \mathrm{mm}$ wide and $${t}\ \mathrm{mm}$ thick, are stacked and screwed together to make a beam $${2 * t}\ \mathrm{mm}$ deep. The beam carries a shear force of $${V}\ \mathrm{kN}$. Each screw can safely carry $${tex(F)}\ \mathrm{N}$ in shear, and the screws are in a single row.`,
      question: "What is the largest spacing allowed between screws along the beam?",
      answer: clean(s),
      tolerance: tol(s, 0.2),
      prefix: r`$s =$`,
      suffix: "mm",
      hint: r`Find the shear flow at the joint, $q = VQ/I$, with $Q$ for one plank about the neutral axis and $I$ for the whole section. Each screw carries $q \times s$.`,
      explanation: r`$I = ${b} \times ${2 * t}^3/12 = ${tex(I / 1e6, 4)} \times 10^{6}\ \mathrm{mm^4}$. One plank: $Q = ${b} \times ${t} \times ${t / 2} = ${tex(Q)}\ \mathrm{mm^3}$. $q = VQ/I = ${tex(q, 3)}\ \mathrm{N/mm}$. Spacing $s = F/q = ${tex(F)}/${tex(q, 3)} = ${tex(s, 3)}\ \mathrm{mm}$.`,
      tags: ["shear-flow", "fasteners"],
    });
  },
});

/* ------------------------------------------------------------------ */
/* Unit sm9 — transformation, principal stresses, yield                */
/* ------------------------------------------------------------------ */

define({
  id: "gen.sm.stress-transform",
  unitId: "sm9",
  title: "Stress components in turned axes",
  make: (_seed, rng) => {
    const sxx = 10 * randInt(rng, -6, 12);
    const syy = 10 * randInt(rng, -6, 12);
    const sxy = 10 * sign(rng) * randInt(rng, 1, 6);
    const theta = pick(rng, [15, 30, 45, 60, 75, -30, -45, -60]);
    const askShear = rng() < 0.4;
    const m = (sxx + syy) / 2;
    const d = (sxx - syy) / 2;
    const c = clean(Math.cos(deg(2 * theta)));
    const s = clean(Math.sin(deg(2 * theta)));
    const xx = m + d * c + sxy * s;
    const xy = -d * s + sxy * c;
    const ans = askShear ? xy : xx;
    const sense = theta > 0 ? "counter-clockwise" : "clockwise";
    return numeric("g", {
      body: r`At a point, $\sigma_{xx} = ${sxx}\ \mathrm{MPa}$, $\sigma_{yy} = ${syy}\ \mathrm{MPa}$ and $\sigma_{xy} = ${sxy}\ \mathrm{MPa}$. The axes are turned ${sense} by $${Math.abs(theta)}^\circ$${theta < 0 ? r` (so $\theta = ${theta}^\circ$)` : ""}.`,
      question: askShear ? r`What is $\sigma_{x'y'}$, with its sign?` : r`What is $\sigma_{x'x'}$?`,
      answer: clean(ans),
      tolerance: tol(ans, 0.3),
      prefix: askShear ? r`$\sigma_{x'y'} =$` : r`$\sigma_{x'x'} =$`,
      suffix: "MPa",
      hint: r`Find $\sigma_m$ and $\sigma_d$ first. The angle inside the sine and cosine is $2\theta$, and a clockwise turn is a negative $\theta$.`,
      explanation: askShear
        ? r`$\sigma_d = ${tex(d)}\ \mathrm{MPa}$ and $2\theta = ${2 * theta}^\circ$. $\sigma_{x'y'} = -\sigma_d\sin 2\theta + \sigma_{xy}\cos 2\theta = -(${tex(d)})(${tex(s, 4)}) + (${sxy})(${tex(c, 4)}) = ${tex(xy, 4)}\ \mathrm{MPa}$.`
        : r`$\sigma_m = ${tex(m)}$, $\sigma_d = ${tex(d)}\ \mathrm{MPa}$ and $2\theta = ${2 * theta}^\circ$. $\sigma_{x'x'} = \sigma_m + \sigma_d\cos 2\theta + \sigma_{xy}\sin 2\theta = ${tex(m)} + (${tex(d)})(${tex(c, 4)}) + (${sxy})(${tex(s, 4)}) = ${tex(xx, 4)}\ \mathrm{MPa}$.`,
      tags: ["transformation"],
    });
  },
});

/** (half-difference, shear, radius) triples that give a whole-number radius. */
const TRIPLES = [
  [30, 40, 50],
  [40, 30, 50],
  [60, 80, 100],
  [80, 60, 100],
  [50, 120, 130],
  [15, 20, 25],
  [20, 15, 25],
  [45, 60, 75],
] as const;

define({
  id: "gen.sm.principal-stress",
  unitId: "sm9",
  title: "Principal stresses and in-plane maximum shear",
  make: (_seed, rng) => {
    const [d0, t0, R] = pick(rng, TRIPLES);
    const d = sign(rng) * d0;
    const sxy = sign(rng) * t0;
    const m = 10 * randInt(rng, -6, 8);
    const sxx = m + d;
    const syy = m - d;
    const ask = pick(rng, ["s1", "s2", "tau"] as const);
    const ans = ask === "s1" ? m + R : ask === "s2" ? m - R : R;
    return numeric("g", {
      body: r`At a point, $\sigma_{xx} = ${sxx}\ \mathrm{MPa}$, $\sigma_{yy} = ${syy}\ \mathrm{MPa}$ and $\sigma_{xy} = ${sxy}\ \mathrm{MPa}$.`,
      question: ask === "s1" ? r`What is the larger principal stress $\sigma_1$?` : ask === "s2" ? r`What is the smaller principal stress $\sigma_2$? Include the sign.` : "What is the largest shear stress on planes perpendicular to the page?",
      answer: ans,
      tolerance: tol(ans, 0.5),
      prefix: ask === "s1" ? r`$\sigma_1 =$` : ask === "s2" ? r`$\sigma_2 =$` : r`$\tau_{\max} =$`,
      suffix: "MPa",
      hint: r`Compute $\sigma_m$, $\sigma_d$ and the radius $R = \sqrt{\sigma_d^2 + \sigma_{xy}^2}$. The principal stresses are $\sigma_m \pm R$ and the largest in-plane shear is $R$.`,
      explanation: r`$\sigma_m = ${tex(m)}$, $\sigma_d = ${tex(d)}$ and $R = \sqrt{${tex(Math.abs(d))}^2 + ${tex(Math.abs(sxy))}^2} = ${R}\ \mathrm{MPa}$. So $\sigma_1 = ${tex(m + R)}$, $\sigma_2 = ${tex(m - R)}$ and $\tau_{\max} = ${R}\ \mathrm{MPa}$.`,
      tags: ["principal-stress", "max-shear"],
    });
  },
});

define({
  id: "gen.sm.abs-max-shear",
  unitId: "sm9",
  title: "Absolute maximum shear in plane stress",
  make: (_seed, rng) => {
    const p = draw(
      () => ({ a: 10 * randInt(rng, -12, 16), b: 10 * randInt(rng, -12, 16) }),
      (v) => v.a !== v.b && v.a !== 0 && v.b !== 0,
    );
    const hi = Math.max(p.a, p.b, 0);
    const lo = Math.min(p.a, p.b, 0);
    const ans = (hi - lo) / 2;
    const sameSign = p.a * p.b > 0;
    return numeric("g", {
      question: r`A thin plate has in-plane principal stresses of $${p.a}\ \mathrm{MPa}$ and $${p.b}\ \mathrm{MPa}$. What is the largest shear stress on any plane through the point?`,
      answer: ans,
      tolerance: tol(ans, 0.5),
      suffix: "MPa",
      hint: "A thin plate is in plane stress, so the third principal stress is zero. Take the largest and smallest of all three.",
      explanation: r`The three principal stresses are $${p.a}$, $${p.b}$ and $0\ \mathrm{MPa}$. The largest is $${hi}$ and the smallest is $${lo}$, so $\tau_{\max}^{\text{abs}} = (${hi} - ${paren(lo)})/2 = ${tex(ans)}\ \mathrm{MPa}$. ${sameSign ? "The two in-plane values have the same sign, so the zero is one of the extremes and the largest shear acts on planes tilted out of the plate." : "The two in-plane values have opposite signs, so zero lies between them and the in-plane circle is the largest."}`,
      tags: ["max-shear", "three-d"],
    });
  },
});

define({
  id: "gen.sm.rosette",
  unitId: "sm9",
  title: "Shear strain from a 0-45-90 rosette",
  make: (_seed, rng) => {
    const e0 = 50 * randInt(rng, -6, 14);
    const e90 = 50 * randInt(rng, -6, 14);
    const e45 = 50 * randInt(rng, -6, 14);
    const g = 2 * e45 - e0 - e90;
    return numeric("g", {
      question: r`A $0^\circ$–$45^\circ$–$90^\circ$ strain rosette reads $\varepsilon_0 = ${e0}\ \mu$, $\varepsilon_{45} = ${e45}\ \mu$ and $\varepsilon_{90} = ${e90}\ \mu$. What is the engineering shear strain $\gamma_{xy}$? Include the sign.`,
      answer: g,
      tolerance: tol(g, 3),
      prefix: r`$\gamma_{xy} =$`,
      suffix: "μ",
      hint: r`The $0^\circ$ and $90^\circ$ gauges give $\varepsilon_{xx}$ and $\varepsilon_{yy}$ directly. Put $\theta = 45^\circ$ into $\varepsilon(\theta) = \varepsilon_{xx}\cos^2\theta + \varepsilon_{yy}\sin^2\theta + \gamma_{xy}\sin\theta\cos\theta$ and solve for $\gamma_{xy}$.`,
      explanation: r`$\gamma_{xy} = 2\varepsilon_{45} - \varepsilon_0 - \varepsilon_{90} = 2(${e45}) - (${e0}) - (${e90}) = ${tex(g)}\ \mu$.`,
      tags: ["rosette", "strain-gauge"],
    });
  },
});

define({
  id: "gen.sm.von-mises",
  unitId: "sm9",
  title: "Von Mises stress in plane stress",
  make: (_seed, rng) => {
    const p = draw(
      () => ({ sxx: 10 * randInt(rng, -8, 16), syy: 10 * randInt(rng, -8, 12), sxy: 10 * randInt(rng, 0, 8) }),
      (v) => v.sxx ** 2 - v.sxx * v.syy + v.syy ** 2 + 3 * v.sxy ** 2 >= 2500,
    );
    const vm = Math.sqrt(p.sxx ** 2 - p.sxx * p.syy + p.syy ** 2 + 3 * p.sxy ** 2);
    const sy = pick(rng, [250, 300, 350, 400, 500]);
    const askSF = rng() < 0.4 && vm < sy;
    const ans = askSF ? sy / vm : vm;
    return numeric("g", {
      body: r`A point in a metal part is in plane stress with $\sigma_{xx} = ${p.sxx}\ \mathrm{MPa}$, $\sigma_{yy} = ${p.syy}\ \mathrm{MPa}$ and $\sigma_{xy} = ${p.sxy}\ \mathrm{MPa}$.${askSF ? r` The metal yields at $\sigma_Y = ${sy}\ \mathrm{MPa}$.` : ""}`,
      question: askSF ? "What is the safety factor against yielding, according to von Mises?" : "What is the von Mises stress?",
      answer: clean(ans),
      tolerance: tol(ans, askSF ? 0.01 : 0.5),
      prefix: askSF ? r`$SF =$` : r`$\sigma_{vM} =$`,
      suffix: askSF ? undefined : "MPa",
      hint: r`Use the component form for plane stress: $\sigma_{vM} = \sqrt{\sigma_{xx}^2 - \sigma_{xx}\sigma_{yy} + \sigma_{yy}^2 + 3\sigma_{xy}^2}$.${askSF ? " The safety factor is the yield stress divided by it." : ""}`,
      explanation: r`$\sigma_{vM} = \sqrt{(${p.sxx})^2 - (${p.sxx})(${p.syy}) + (${p.syy})^2 + 3(${p.sxy})^2} = ${tex(vm, 4)}\ \mathrm{MPa}$.${askSF ? r` $SF = ${sy}/${tex(vm, 4)} = ${tex(ans, 3)}$.` : ""}`,
      tags: ["von-mises", "yield"],
    });
  },
});

define({
  id: "gen.sm.tresca-sf",
  unitId: "sm9",
  title: "Tresca safety factor from principal stresses",
  make: (_seed, rng) => {
    const sy = pick(rng, [250, 300, 350, 400, 500]);
    const p = draw(
      () => ({ a: 10 * randInt(rng, -10, 16), b: 10 * randInt(rng, -10, 16) }),
      (v) => v.a !== v.b && v.a !== 0 && v.b !== 0 && Math.max(v.a, v.b, 0) - Math.min(v.a, v.b, 0) >= 60 && Math.max(v.a, v.b, 0) - Math.min(v.a, v.b, 0) < sy,
    );
    const hi = Math.max(p.a, p.b, 0);
    const lo = Math.min(p.a, p.b, 0);
    const sf = sy / (hi - lo);
    return numeric("g", {
      question: r`A point in a thin metal plate has in-plane principal stresses of $${p.a}\ \mathrm{MPa}$ and $${p.b}\ \mathrm{MPa}$. The metal yields at $\sigma_Y = ${sy}\ \mathrm{MPa}$. What is the safety factor against yielding, according to Tresca?`,
      answer: clean(sf),
      tolerance: tol(sf, 0.01),
      prefix: r`$SF =$`,
      hint: "Tresca compares the yield stress with the difference between the largest and smallest of the three principal stresses. In a thin plate the third one is zero.",
      explanation: r`The three principal stresses are $${p.a}$, $${p.b}$ and $0\ \mathrm{MPa}$, so $\sigma_{\max} - \sigma_{\min} = ${hi} - ${paren(lo)} = ${hi - lo}\ \mathrm{MPa}$. $SF = ${sy}/${hi - lo} = ${tex(sf, 3)}$.`,
      tags: ["tresca", "safety-factor"],
    });
  },
});

/* ------------------------------------------------------------------ */
/* Unit sm10 — stability and buckling                                  */
/* ------------------------------------------------------------------ */

define({
  id: "gen.sm.link-critical",
  unitId: "sm10",
  title: "Critical load of a rigid link on a spring",
  make: (_seed, rng) => {
    const L = pick(rng, [0.5, 0.8, 1, 1.2, 1.5, 2, 2.5]);
    if (rng() < 0.5) {
      const k = pick(rng, [100, 150, 200, 240, 300, 450, 600, 900]);
      const P = k / L;
      return numeric("g", {
        question: r`A rigid link $${L}\ \mathrm{m}$ long stands upright on a pivot with a torsional spring of stiffness $${k}\ \mathrm{N \cdot m/rad}$. A vertical load pushes down on its top. What is the critical load, in newtons?`,
        answer: clean(P),
        tolerance: tol(P, 0.5),
        prefix: r`$P_{crit} =$`,
        suffix: "N",
        hint: r`For a small tilt $\theta$, balance the spring's restoring moment $k\theta$ against the load's overturning moment $PL\theta$ about the pivot.`,
        explanation: r`$k\theta = PL\theta$ gives $P_{crit} = k/L = ${k}/${L} = ${tex(P)}\ \mathrm{N}$.`,
        tags: ["rigid-link", "critical-load"],
      });
    }
    const k = pick(rng, [0.5, 0.8, 1, 1.5, 2, 3, 4]);
    const P = k * L;
    return numeric("g", {
      question: r`A rigid link $${L}\ \mathrm{m}$ long is pivoted at its base and held upright by a horizontal spring of stiffness $${k}\ \mathrm{kN/m}$ attached at its top. A vertical load pushes down on the top. What is the critical load, in kN?`,
      answer: clean(P),
      tolerance: tol(P, 0.004),
      prefix: r`$P_{crit} =$`,
      suffix: "kN",
      hint: r`For a small tilt $\theta$ the top moves sideways by $L\theta$. The spring force $kL\theta$ acts at height $L$ above the pivot. Balance its moment against the load's.`,
      explanation: r`Restoring moment $(kL\theta) \times L$ against overturning moment $P \times L\theta$ gives $P_{crit} = kL = ${k} \times ${L} = ${tex(P)}\ \mathrm{kN}$.`,
      tags: ["rigid-link", "critical-load"],
    });
  },
});

const END_CASES = [
  { text: "pinned at both ends", K: 1 },
  { text: "clamped at the base and free at the top", K: 2 },
  { text: "clamped at one end and pinned at the other (use an effective-length factor of 0.7)", K: 0.7 },
  { text: "clamped at both ends", K: 0.5 },
] as const;

define({
  id: "gen.sm.euler-load",
  unitId: "sm10",
  title: "Euler buckling load with standard end conditions",
  make: (_seed, rng) => {
    const m = pick(rng, BEAM_MATERIALS);
    const I = pick(rng, [0.2, 0.5, 0.8, 1, 2, 4, 6, 10]); // ×10⁶ mm⁴
    const L = pick(rng, [2, 2.5, 3, 4, 5, 6]);
    const end = pick(rng, END_CASES);
    const P = (Math.PI ** 2 * m.E * 1000 * I * 1e6) / (end.K * L * 1000) ** 2 / 1000; // kN
    return numeric("g", {
      question: r`${Art(m.name)} ${m.name} column ($E = ${m.E}\ \mathrm{GPa}$) is $${L}\ \mathrm{m}$ long. Its smaller second moment of area is $${I} \times 10^{6}\ \mathrm{mm^4}$. It is ${end.text}. What is its buckling load, in kN?`,
      answer: clean(P),
      tolerance: tol(P, 0.002),
      prefix: r`$P_{cr} =$`,
      suffix: "kN",
      hint: r`$P_{cr} = \dfrac{\pi^2 EI}{(KL)^2}$. Find the effective-length factor $K$ for these ends, and work in N and mm.`,
      explanation: r`$K = ${end.K}$, so the effective length is $${tex(end.K * L * 1000)}\ \mathrm{mm}$. $P_{cr} = \dfrac{\pi^2 \times ${tex(m.E * 1000)} \times ${I} \times 10^{6}}{${tex(end.K * L * 1000)}^2} = ${tex(P * 1000, 4)}\ \mathrm{N} = ${tex(P, 4)}\ \mathrm{kN}$.`,
      tags: ["euler", "effective-length"],
    });
  },
});

define({
  id: "gen.sm.critical-stress",
  unitId: "sm10",
  title: "Critical stress from the slenderness ratio",
  make: (_seed, rng) => {
    const m = pick(rng, BEAM_MATERIALS);
    const d = pick(rng, [20, 24, 30, 40, 50, 60]);
    const L = pick(rng, [1, 1.2, 1.5, 2, 2.5, 3]);
    const rg = d / 4;
    const slender = (L * 1000) / rg;
    const s = (Math.PI ** 2 * m.E * 1000) / slender ** 2;
    return numeric("g", {
      question: r`A solid round ${m.name} bar ($E = ${m.E}\ \mathrm{GPa}$) of diameter $${d}\ \mathrm{mm}$ is used as a pinned–pinned column $${L}\ \mathrm{m}$ long. For a solid round bar the radius of gyration is $r = d/4$. What is the critical stress?`,
      answer: clean(s),
      tolerance: tol(s, 0.01),
      prefix: r`$\sigma_{cr} =$`,
      suffix: "MPa",
      hint: r`Find the slenderness ratio $L/r$ first, then use $\sigma_{cr} = \pi^2 E/(L/r)^2$ with $E$ in MPa.`,
      explanation: r`$r = ${d}/4 = ${tex(rg)}\ \mathrm{mm}$, so $L/r = ${tex(L * 1000)}/${tex(rg)} = ${tex(slender, 4)}$. $\sigma_{cr} = \dfrac{\pi^2 \times ${tex(m.E * 1000)}}{${tex(slender, 4)}^2} = ${tex(s, 3)}\ \mathrm{MPa}$.`,
      tags: ["slenderness", "critical-stress"],
    });
  },
});

define({
  id: "gen.sm.column-length",
  unitId: "sm10",
  title: "Longest column for a load and a safety factor",
  make: (_seed, rng) => {
    const { m, I, P, sf, L } = draw(
      () => {
        const m = pick(rng, BEAM_MATERIALS);
        const I = pick(rng, [0.05, 0.1, 0.2, 0.5, 1, 2]); // ×10⁶ mm⁴
        const P = pick(rng, [5, 8, 10, 15, 20, 30, 50]);
        const sf = pick(rng, [2, 2.5, 3]);
        const L = Math.sqrt((Math.PI ** 2 * m.E * 1000 * I * 1e6) / (sf * P * 1000)) / 1000; // m
        return { m, I, P, sf, L };
      },
      (v) => v.L >= 0.6 && v.L <= 6,
    );
    return numeric("g", {
      question: r`A pinned–pinned ${m.name} strut ($E = ${m.E}\ \mathrm{GPa}$, smaller $I = ${I} \times 10^{6}\ \mathrm{mm^4}$) must carry $${P}\ \mathrm{kN}$ in compression with a safety factor of $${sf}$ against buckling. What is the longest it can be, in metres?`,
      answer: clean(L),
      tolerance: tol(L, 0.01),
      prefix: r`$L =$`,
      suffix: "m",
      hint: r`The Euler load must equal the working load times the safety factor. Solve $P_{cr} = \pi^2 EI/L^2$ for $L$, working in N and mm, then convert to metres.`,
      explanation: r`Required $P_{cr} = ${sf} \times ${P} = ${tex(sf * P)}\ \mathrm{kN}$. $L = \sqrt{\dfrac{\pi^2 EI}{P_{cr}}} = \sqrt{\dfrac{\pi^2 \times ${tex(m.E * 1000)} \times ${I} \times 10^{6}}{${tex(sf * P * 1000)}}} = ${tex(L * 1000, 4)}\ \mathrm{mm} = ${tex(L, 3)}\ \mathrm{m}$.`,
      tags: ["euler", "design"],
    });
  },
});
