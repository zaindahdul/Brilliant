/**
 * Solid mechanics generators, part 2 (units sm5–sm7): the axial rod seen in 3-D,
 * composite rods and thin-walled pressure vessels; torsion of circular shafts and
 * thin-walled tubes; symmetric bending of beams.
 *
 * Conventions follow Govindjee: tension positive; torques right-handed about the
 * shaft axis z; beams use V = ∫σxy dA and M = −∫yσxx dA with dV/dx + q = 0,
 * dM/dx + V = 0 and q positive UP — so the left segment of a simply supported beam
 * has V = −R_A, positive M is sagging, and a cantilever's wall moment is negative.
 * Everything is computed internally in N, mm and MPa (= N/mm²).
 */
import { define } from "./registry";
import { pick } from "@/lib/random";
import { numeric, r } from "../dsl";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

/** Round to n significant figures (halves away from zero). */
function roundSig(x: number, n: number): number {
  if (x === 0 || !Number.isFinite(x)) return x;
  const ax = Math.abs(x);
  const e = n - 1 - Math.floor(Math.log10(ax));
  const v = e >= 0 ? Math.round(ax * 10 ** e + 1e-9) / 10 ** e : Math.round(ax / 10 ** -e + 1e-9) * 10 ** -e;
  return Math.sign(x) * v;
}

/** Thin-space digit groups (LaTeX) for numbers with five or more integer digits. */
function group(s: string): string {
  const m = /^(-?)(\d+)(\.\d+)?$/.exec(s);
  if (!m || m[2].length <= 4) return s;
  return m[1] + m[2].replace(/\B(?=(\d{3})+(?!\d))/g, "\\,") + (m[3] ?? "");
}

/** x rounded to n significant figures, as a LaTeX decimal (never exponent notation). */
function sig(x: number, n: number): string {
  const v = roundSig(x, n);
  if (v === 0) return "0";
  const decimals = n - 1 - Math.floor(Math.log10(Math.abs(v)));
  return group(decimals > 0 ? v.toFixed(decimals) : String(v));
}

/**
 * A number for LaTeX: integers and values with at most four significant figures are
 * shown exactly; anything else with n significant figures (at least four from 1000 up).
 */
function show(x: number, n = 3): string {
  if (x === 0) return "0";
  if (Number.isInteger(x)) return group(String(x));
  for (let k = 1; k <= 4; k++) if (Math.abs(roundSig(x, k) - x) <= 1e-9 * Math.abs(x)) return sig(x, k);
  return sig(x, Math.abs(x) >= 1000 ? Math.max(n, 4) : n);
}

/** Strip floating-point noise from a computed answer. */
function clean(x: number): number {
  return Number(x.toPrecision(12));
}

/** Absolute tolerance: 1 % of the answer, never below `floor`. */
function tol(x: number, floor: number): number {
  return clean(Math.max(Math.abs(x) * 0.01, floor));
}

/** Join the non-empty parts as Rich-text blocks (blank-line separated). */
function para(...parts: (string | false | undefined)[]): string {
  return parts.filter((p): p is string => typeof p === "string" && p.length > 0).join("\n\n");
}

/** Draw parameter sets until `ok` accepts one (deterministic: `make` uses the generator's rng). */
function draw<T>(make: () => T, ok: (v: T) => boolean, fallback: T): T {
  for (let i = 0; i < 500; i++) {
    const v = make();
    if (ok(v)) return v;
  }
  return fallback;
}

/** Multiples of `step` strictly between lo and hi. */
function gridBetween(lo: number, hi: number, step: number): number[] {
  const out: number[] = [];
  for (let k = Math.floor(lo / step + 1e-9) + 1; k * step < hi - 1e-9; k++) out.push(clean(k * step));
  return out;
}

const deg = (rad: number) => (rad * 180) / Math.PI;

/** Polar moment of inertia of a solid (dIn = 0) or hollow circular section, mm⁴. */
const polarJ = (dOut: number, dIn = 0) => (Math.PI * (dOut ** 4 - dIn ** 4)) / 32;

interface Solid {
  name: string;
  /** Young's modulus, GPa. */
  E: number;
  nu: number;
}

const STEEL: Solid = { name: "steel", E: 200, nu: 0.3 };
const ALUMINIUM: Solid = { name: "aluminium", E: 70, nu: 0.33 };
const COPPER: Solid = { name: "copper", E: 120, nu: 0.34 };
const TITANIUM: Solid = { name: "titanium", E: 105, nu: 0.33 };

const solidTex = (m: Solid) => r`${m.name} ($E = ${m.E}\,\mathrm{GPa}$, $\nu = ${m.nu}$)`;

/** The indefinite article for a word ("a" / "an"), capitalised when `cap`. */
const art = (word: string, cap = false) => {
  const a = /^[aeiou]/i.test(word) ? "an" : "a";
  return cap ? a[0].toUpperCase() + a.slice(1) : a;
};

/** Shaft materials: shear modulus G (GPa) and a working shear-stress cap (MPa) that keeps problems realistic. */
const SHAFTS = [
  { name: "steel", G: 80, tauCap: 120 },
  { name: "aluminium", G: 26, tauCap: 80 },
] as const;

const TORQUES = [100, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000];

/* ------------------------------------------------------------------ */
/* Unit sm5 — the rod in 3-D, composite rods, pressure vessels          */
/* ------------------------------------------------------------------ */

const STRESSES = [40, 50, 60, 75, 80, 90, 100, 120, 125, 150];

define({
  id: "gen.sm.poisson-lateral",
  unitId: "sm5",
  title: "Poisson contraction of an axially loaded rod",
  make: (_seed, rng) => {
    const m = pick(rng, [STEEL, ALUMINIUM, COPPER, TITANIUM]);
    const variant = pick(rng, ["strain", "dd-stress", "dd-load"] as const);
    const sgn = rng() < 0.6 ? 1 : -1;
    const kind = sgn > 0 ? "tensile" : "compressive";
    const E = m.E * 1000; // MPa
    const signNote =
      sgn > 0
        ? "Tension makes the rod thinner, so the lateral strain (and the change in diameter) is negative."
        : "Compression makes the rod fatter, so the lateral strain (and the change in diameter) is positive.";
    const tags = ["poisson", "rod-in-3d", "hooke"];

    if (variant === "strain") {
      const s = pick(rng, STRESSES);
      const d = pick(rng, [10, 12, 16, 20, 25, 30]);
      const sigma = sgn * s;
      const micro = ((-m.nu * sigma) / E) * 1e6;
      return numeric("", {
        body: r`A $${d}\,\mathrm{mm}$ diameter ${solidTex(m)} rod carries a uniform axial ${kind} stress $\sigma_{xx} = ${sigma}\,\mathrm{MPa}$. Its lateral surface is traction-free, so the stress state is uniaxial.`,
        question: r`What is the lateral strain $\varepsilon_{yy}$ (the strain across the diameter), in micro-strain ($10^{-6}$), to three significant figures? Use the sign convention: negative means contraction.`,
        answer: clean(micro),
        tolerance: tol(micro, 0.5),
        suffix: "μ",
        answerDisplay: r`${show(micro)}\,\mu`,
        hint: r`With $\sigma_{yy} = \sigma_{zz} = 0$, Hooke's law gives the transverse strain from the axial stress alone, through Poisson's ratio. Should a ${kind} stress make the rod thinner or fatter?`,
        explanation: para(
          r`Uniaxial stress, so the generalised Hooke's law reduces to $\varepsilon_{yy} = \varepsilon_{zz} = -\nu\,\sigma_{xx}/E$:`,
          r`$$\varepsilon_{yy} = -\frac{\nu\,\sigma_{xx}}{E} = -\frac{(${m.nu})(${sigma}\,\mathrm{MPa})}{${show(E)}\,\mathrm{MPa}} = ${show(micro, 4)}\times 10^{-6} = ${show(micro)}\,\mu$$`,
          signNote,
        ),
        tags,
      });
    }

    if (variant === "dd-stress") {
      const { s, d } = draw(
        () => ({ s: pick(rng, STRESSES), d: pick(rng, [10, 12, 16, 20, 25, 30, 40, 50]) }),
        (v) => (m.nu * v.s * v.d * 1000) / E >= 1,
        { s: 100, d: 40 },
      );
      const sigma = sgn * s;
      const eps = (-m.nu * sigma) / E;
      const dd = eps * d * 1000; // μm
      return numeric("", {
        body: r`${art(m.name, true)} ${solidTex(m)} rod of diameter $d = ${d}\,\mathrm{mm}$ carries a uniform axial ${kind} stress $\sigma_{xx} = ${sigma}\,\mathrm{MPa}$ (uniaxial stress; the lateral surface is free).`,
        question: r`By how much does the diameter change? Give $\Delta d$ in micrometres ($1\,\mu\mathrm{m} = 10^{-3}\,\mathrm{mm}$) to three significant figures, negative for a decrease.`,
        answer: clean(dd),
        tolerance: tol(dd, 0.005),
        suffix: "μm",
        answerDisplay: r`${show(dd)}\,\mu\mathrm{m}`,
        hint: "Find the lateral (transverse) strain from the axial stress first — uniaxial stress, Poisson effect. The diameter changes by that strain times the original diameter.",
        explanation: para(
          r`Lateral strain (uniaxial stress): $\varepsilon_{yy} = -\nu\sigma_{xx}/E = -(${m.nu})(${sigma})/${show(E)} = ${show(eps * 1e6, 4)}\times 10^{-6}$.`,
          r`$$\Delta d = \varepsilon_{yy}\,d = (${show(eps * 1e6, 4)}\times 10^{-6})(${d}\,\mathrm{mm}) = ${show(dd / 1000)}\,\mathrm{mm} = ${show(dd)}\,\mu\mathrm{m}$$`,
          signNote,
        ),
        tags,
      });
    }

    const { P, d } = draw(
      () => ({ P: pick(rng, [10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150]), d: pick(rng, [12, 16, 20, 25, 30, 40]) }),
      (v) => {
        const s = (v.P * 1000) / ((Math.PI * v.d ** 2) / 4);
        return s >= 30 && s <= 180 && (m.nu * s * v.d * 1000) / E >= 1;
      },
      { P: 50, d: 20 },
    );
    const A = (Math.PI * d ** 2) / 4;
    const Pn = sgn * P * 1000; // N
    const sigma = Pn / A;
    const eps = (-m.nu * sigma) / E;
    const dd = eps * d * 1000; // μm
    return numeric("", {
      body: r`A solid ${solidTex(m)} rod of diameter $d = ${d}\,\mathrm{mm}$ carries an axial ${kind} force of $${P}\,\mathrm{kN}$. The lateral surface is free, so the stress state is uniaxial.`,
      question: r`By how much does the diameter change? Give $\Delta d$ in micrometres ($1\,\mu\mathrm{m} = 10^{-3}\,\mathrm{mm}$) to three significant figures, negative for a decrease.`,
      answer: clean(dd),
      tolerance: tol(dd, 0.005),
      suffix: "μm",
      answerDisplay: r`${show(dd)}\,\mu\mathrm{m}`,
      hint: "Stress first (force over area), then the Poisson (lateral) strain, then multiply by the diameter. Keep N, mm and MPa together.",
      explanation: para(
        r`Area $A = \pi d^2/4 = ${show(A, 4)}\,\mathrm{mm}^2$, so $\sigma_{xx} = P/A = (${show(Pn)}\,\mathrm{N})/(${show(A, 4)}\,\mathrm{mm}^2) = ${show(sigma, 4)}\,\mathrm{MPa}$.`,
        r`Lateral strain: $\varepsilon_{yy} = -\nu\sigma_{xx}/E = -(${m.nu})(${show(sigma, 4)})/${show(E)} = ${show(eps * 1e6, 4)}\times 10^{-6}$.`,
        r`$$\Delta d = \varepsilon_{yy}\,d = -\frac{4\nu P}{\pi E d} = (${show(eps * 1e6, 4)}\times 10^{-6})(${d}\,\mathrm{mm}) = ${show(dd / 1000)}\,\mathrm{mm} = ${show(dd)}\,\mu\mathrm{m}$$`,
        signNote,
      ),
      tags,
    });
  },
});

const PRESSURES = [0.5, 0.6, 0.8, 1, 1.2, 1.5, 1.6, 2, 2.4, 2.5, 3, 3.5, 4, 5];

define({
  id: "gen.sm.vessel-cyl",
  unitId: "sm5",
  title: "Hoop and axial stress in a thin-walled cylinder",
  make: (_seed, rng) => {
    const ask = pick(rng, ["hoop", "axial"] as const);
    const givenD = rng() < 0.35;
    const { p, R, t } = draw(
      () => ({
        p: pick(rng, PRESSURES),
        R: pick(rng, [150, 200, 250, 300, 400, 450, 500, 600, 750, 800, 900, 1000, 1200]),
        t: pick(rng, [3, 4, 5, 6, 8, 10, 12, 15, 16, 20, 25]),
      }),
      (v) => v.R / v.t >= 12 && (v.p * v.R) / v.t >= 20 && (v.p * v.R) / v.t <= 220,
      { p: 2, R: 500, t: 10 },
    );
    const hoop = (p * R) / t;
    const axial = hoop / 2;
    const ans = ask === "hoop" ? hoop : axial;
    const geom = givenD ? r`inside diameter $D = ${2 * R}\,\mathrm{mm}$` : r`inner radius $R = ${R}\,\mathrm{mm}$`;
    const radiusNote = givenD ? " The formulas use the radius, not the diameter." : "";
    return numeric("", {
      body: r`A closed-end cylindrical tank has ${geom} and wall thickness $t = ${t}\,\mathrm{mm}$, so $R/t = ${show(R / t)}$ — thin-walled ($R/t > 10$). It holds gas at an internal (gauge) pressure $p = ${p}\,\mathrm{MPa}$.`,
      question:
        ask === "hoop"
          ? r`What is the hoop stress $\sigma_{\theta\theta}$ in the wall, in MPa, to three significant figures?`
          : r`What is the axial stress $\sigma_{zz}$ in the wall, in MPa, to three significant figures?`,
      answer: clean(ans),
      tolerance: tol(ans, 0.01),
      suffix: "MPa",
      answerDisplay: r`${show(ans)}\,\mathrm{MPa}`,
      hint:
        ask === "hoop"
          ? "Cut the tank lengthwise through its axis and balance the pressure force on the projected area against the two cut walls." + radiusNote
          : "Cut the tank across its axis: the pressure on the end cap must be carried by the ring of wall material." + radiusNote,
      explanation: para(
        givenD && r`Radius: $R = D/2 = ${R}\,\mathrm{mm}$.`,
        ask === "hoop"
          ? r`Free body of half the tank (length $L$, cut through the axis): the pressure on the projected area $2RL$ is held by two wall cuts of area $tL$, so $p\,(2RL) = 2\,\sigma_{\theta\theta}\,tL$ and`
          : r`Free body of one end (cut normal to the axis): the pressure on the cap, $\pi R^2 p$, is held by the wall ring of area $2\pi R t$, so $\pi R^2 p = \sigma_{zz}\,(2\pi R t)$ and`,
        ask === "hoop"
          ? r`$$\sigma_{\theta\theta} = \frac{pR}{t} = \frac{(${p}\,\mathrm{MPa})(${R}\,\mathrm{mm})}{${t}\,\mathrm{mm}} = ${show(hoop)}\,\mathrm{MPa}$$`
          : r`$$\sigma_{zz} = \frac{pR}{2t} = \frac{(${p}\,\mathrm{MPa})(${R}\,\mathrm{mm})}{2(${t}\,\mathrm{mm})} = ${show(axial)}\,\mathrm{MPa}$$`,
        ask === "hoop"
          ? r`The axial stress is half as large, $pR/2t = ${show(axial)}\,\mathrm{MPa}$; the radial stress (between $-p$ and $0$) is negligible.`
          : r`This is half the hoop stress $pR/t = ${show(hoop)}\,\mathrm{MPa}$; the radial stress (between $-p$ and $0$) is negligible.`,
      ),
      tags: ["pressure-vessels", "cylinder", ask === "hoop" ? "hoop-stress" : "axial-stress"],
    });
  },
});

define({
  id: "gen.sm.vessel-sphere",
  unitId: "sm5",
  title: "Membrane stress in a thin-walled sphere",
  make: (_seed, rng) => {
    const variant = pick(rng, ["stress", "stress-D", "max-p"] as const);
    const RADII = [250, 300, 400, 500, 600, 750, 800, 1000, 1200, 1500, 2000];
    const WALLS = [3, 4, 5, 6, 8, 10, 12, 15, 20];

    if (variant === "max-p") {
      const { sa, R, t } = draw(
        () => ({ sa: pick(rng, [80, 100, 120, 125, 140, 150, 160, 180, 200]), R: pick(rng, RADII), t: pick(rng, WALLS) }),
        (v) => v.R / v.t >= 12 && (2 * v.t * v.sa) / v.R >= 0.2 && (2 * v.t * v.sa) / v.R <= 20,
        { sa: 150, R: 1000, t: 8 },
      );
      const pmax = (2 * t * sa) / R;
      return numeric("", {
        body: r`A spherical tank of inner radius $R = ${R}\,\mathrm{mm}$ has wall thickness $t = ${t}\,\mathrm{mm}$ ($R/t = ${show(R / t)}$, thin-walled). The wall stress must not exceed $\sigma_{\text{allow}} = ${sa}\,\mathrm{MPa}$.`,
        question: r`What is the largest internal pressure the tank may hold, in MPa, to three significant figures?`,
        answer: clean(pmax),
        tolerance: tol(pmax, 0.001),
        suffix: "MPa",
        answerDisplay: r`${show(pmax)}\,\mathrm{MPa}`,
        hint: "Cut the sphere through its centre: the pressure force on the circular cut is carried by the ring of wall material. Then set the wall stress equal to the allowable value.",
        explanation: para(
          r`Free body of a hemisphere: $\pi R^2 p = \sigma\,(2\pi R t)$, so the membrane stress is $\sigma = pR/2t$, the same in every in-plane direction ($\sigma_{\theta\theta} = \sigma_{\phi\phi}$).`,
          r`$$\frac{pR}{2t} \le \sigma_{\text{allow}} \;\Rightarrow\; p_{\max} = \frac{2t\,\sigma_{\text{allow}}}{R} = \frac{2(${t})(${sa})}{${R}} = ${show(pmax)}\,\mathrm{MPa}$$`,
        ),
        tags: ["pressure-vessels", "sphere", "design"],
      });
    }

    const { p, R, t } = draw(
      () => ({ p: pick(rng, [0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5]), R: pick(rng, RADII), t: pick(rng, WALLS) }),
      (v) => v.R / v.t >= 12 && (v.p * v.R) / (2 * v.t) >= 20 && (v.p * v.R) / (2 * v.t) <= 220,
      { p: 1.2, R: 800, t: 6 },
    );
    const s = (p * R) / (2 * t);
    const givenD = variant === "stress-D";
    return numeric("", {
      body: r`A spherical gas tank has ${givenD ? r`inside diameter $D = ${2 * R}\,\mathrm{mm}$` : r`inner radius $R = ${R}\,\mathrm{mm}$`} and wall thickness $t = ${t}\,\mathrm{mm}$ ($R/t = ${show(R / t)}$, thin-walled). The internal (gauge) pressure is $p = ${p}\,\mathrm{MPa}$.`,
      question: r`What is the membrane (wall) stress $\sigma_{\theta\theta} = \sigma_{\phi\phi}$, in MPa, to three significant figures?`,
      answer: clean(s),
      tolerance: tol(s, 0.01),
      suffix: "MPa",
      answerDisplay: r`${show(s)}\,\mathrm{MPa}`,
      hint: "Cut the sphere through its centre and balance the pressure force on the circular cut against the stress on the ring of wall." + (givenD ? " The formula uses the radius." : ""),
      explanation: para(
        givenD && r`Radius: $R = D/2 = ${R}\,\mathrm{mm}$.`,
        r`Free body of a hemisphere: $\pi R^2 p = \sigma\,(2\pi R t)$, and by symmetry the stress is the same in every in-plane direction:`,
        r`$$\sigma = \frac{pR}{2t} = \frac{(${p}\,\mathrm{MPa})(${R}\,\mathrm{mm})}{2(${t}\,\mathrm{mm})} = ${show(s)}\,\mathrm{MPa}$$`,
        r`That is half the hoop stress a cylinder with the same $p$, $R$, $t$ would see ($pR/t = ${show(2 * s)}\,\mathrm{MPa}$).`,
      ),
      tags: ["pressure-vessels", "sphere"],
    });
  },
});

define({
  id: "gen.sm.vessel-thickness",
  unitId: "sm5",
  title: "Designing the wall thickness of a pressure vessel",
  make: (_seed, rng) => {
    const kind = pick(rng, ["cylinder", "cylinder", "sphere", "caps"] as const);
    const mat = pick(rng, [
      { name: "mild steel", sY: 250 },
      { name: "an aluminium alloy", sY: 270 },
      { name: "structural steel", sY: 350 },
      { name: "high-strength steel", sY: 400 },
    ]);
    const { p, R, SF } = draw(
      () => ({
        p: pick(rng, [0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6]),
        R: pick(rng, [200, 250, 300, 400, 500, 600, 750, 800, 1000, 1200]),
        SF: pick(rng, [1.5, 2, 2.5, 3]),
      }),
      (v) => {
        const tc = (v.SF * v.p * v.R) / mat.sY;
        return tc >= 1.5 && tc <= 40 && v.R / tc >= 10;
      },
      { p: 3, R: 400, SF: 2 },
    );
    const sd = mat.sY / SF;
    const tCyl = (SF * p * R) / mat.sY;
    const tSph = tCyl / 2;
    const ans = kind === "cylinder" ? tCyl : tSph;
    const what =
      kind === "cylinder"
        ? r`a closed cylindrical tank of inner radius $R = ${R}\,\mathrm{mm}$`
        : kind === "sphere"
          ? r`a spherical tank of inner radius $R = ${R}\,\mathrm{mm}$`
          : r`a cylindrical tank of inner radius $R = ${R}\,\mathrm{mm}$ closed by hemispherical end caps of the same radius`;
    return numeric("", {
      body: r`You are designing ${what} for an internal pressure $p = ${p}\,\mathrm{MPa}$. It is made of ${mat.name} with yield strength $\sigma_Y = ${mat.sY}\,\mathrm{MPa}$ and needs a safety factor $\mathrm{SF} = \sigma_Y/\sigma_{\text{design}} = ${SF}$ against yield. Use thin-wall theory.`,
      question:
        kind === "caps"
          ? r`What minimum wall thickness do the **end caps** need, in mm, to three significant figures?`
          : r`What minimum wall thickness $t$ is needed, in mm, to three significant figures?`,
      answer: clean(ans),
      tolerance: tol(ans, 0.005),
      suffix: "mm",
      answerDisplay: r`${show(ans)}\,\mathrm{mm}`,
      hint:
        kind === "cylinder"
          ? r`Which wall stress is largest in a cylinder? Set it equal to $\sigma_Y/\mathrm{SF}$ and solve for $t$.`
          : r`In a sphere (or a hemispherical cap) the membrane stress is the same in every in-plane direction. Set it equal to $\sigma_Y/\mathrm{SF}$ and solve for $t$.`,
      explanation: para(
        r`Design stress: $\sigma_{\text{design}} = \sigma_Y/\mathrm{SF} = ${mat.sY}/${SF} = ${show(sd)}\,\mathrm{MPa}$.`,
        kind === "cylinder"
          ? r`In the cylinder the hoop stress $pR/t$ is twice the axial stress $pR/2t$, so the hoop stress governs:`
          : r`In the ${kind === "caps" ? "hemispherical caps" : "sphere"} the membrane stress is $pR/2t$ in every direction:`,
        kind === "cylinder"
          ? r`$$\frac{pR}{t} \le \frac{\sigma_Y}{\mathrm{SF}} \;\Rightarrow\; t \ge \frac{\mathrm{SF}\,pR}{\sigma_Y} = \frac{(${SF})(${p})(${R})}{${mat.sY}} = ${show(tCyl)}\,\mathrm{mm}$$`
          : r`$$\frac{pR}{2t} \le \frac{\sigma_Y}{\mathrm{SF}} \;\Rightarrow\; t \ge \frac{\mathrm{SF}\,pR}{2\sigma_Y} = \frac{(${SF})(${p})(${R})}{2(${mat.sY})} = ${show(tSph)}\,\mathrm{mm}$$`,
        kind === "cylinder"
          ? r`(Designing for the axial stress alone would give only $${show(tSph)}\,\mathrm{mm}$ — unsafe.) Check: $R/t = ${show(R / tCyl)} > 10$, so thin-wall theory applies.`
          : r`That is half of what a cylindrical shell of the same radius needs ($${show(tCyl)}\,\mathrm{mm}$)${kind === "caps" ? ", which is why the caps can be thinner than the shell" : ""}. Check: $R/t = ${show(R / tSph)} > 10$.`,
      ),
      tags: ["pressure-vessels", "design", kind === "cylinder" ? "cylinder" : "sphere"],
    });
  },
});

define({
  id: "gen.sm.vessel-strain",
  unitId: "sm5",
  title: "Strains and dimension changes of a pressurised cylinder",
  make: (_seed, rng) => {
    const m = pick(rng, [STEEL, ALUMINIUM]);
    const ask = pick(rng, ["hoop-strain", "dR", "dC", "dL"] as const);
    const cap = m === STEEL ? 180 : 120;
    const { p, R, t } = draw(
      () => ({
        p: pick(rng, [0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3, 4, 5]),
        R: pick(rng, [150, 200, 250, 300, 400, 500, 600, 750, 800, 1000]),
        t: pick(rng, [3, 4, 5, 6, 8, 10, 12, 15, 20]),
      }),
      (v) => v.R / v.t >= 12 && (v.p * v.R) / v.t >= 40 && (v.p * v.R) / v.t <= cap,
      { p: 2, R: 500, t: 10 },
    );
    const L = pick(rng, [1, 1.5, 2, 2.5, 3, 4, 5, 6]); // m
    const E = m.E * 1000;
    const sth = (p * R) / t;
    const szz = sth / 2;
    const eth = (sth - m.nu * szz) / E; // = (pR/tE)(1 − ν/2)
    const ezz = (szz - m.nu * sth) / E; // = (pR/tE)(1/2 − ν)
    const stresses = r`Wall stresses (thin wall, closed ends): $\sigma_{\theta\theta} = pR/t = (${p})(${R})/${t} = ${show(sth)}\,\mathrm{MPa}$, $\sigma_{zz} = pR/2t = ${show(szz)}\,\mathrm{MPa}$, $\sigma_{rr} \approx 0$. Hooke's law in the wall:`;
    const hoopLine = r`$$\varepsilon_{\theta\theta} = \frac{\sigma_{\theta\theta} - \nu\sigma_{zz}}{E} = \frac{pR}{tE}\Big(1 - \frac{\nu}{2}\Big) = \frac{${show(sth)}}{${show(E)}}\Big(1 - \frac{${m.nu}}{2}\Big) = ${show(eth * 1e6, 4)}\times 10^{-6}$$`;
    let question: string;
    let ans: number;
    let suffix: string;
    let display: string;
    let steps: string[];
    let hint: string;
    let floor: number;
    switch (ask) {
      case "hoop-strain":
        question = r`What is the hoop strain $\varepsilon_{\theta\theta}$ in the wall, in micro-strain ($10^{-6}$), to three significant figures?`;
        ans = eth * 1e6;
        suffix = "μ";
        display = r`${show(ans)}\,\mu`;
        floor = 0.5;
        hint = "Find both wall stresses first; the hoop strain has a Poisson contribution from the axial stress.";
        steps = [hoopLine, r`so $\varepsilon_{\theta\theta} = ${show(ans)}\,\mu$ (the Poisson term from $\sigma_{zz}$ reduces it).`];
        break;
      case "dR":
        ans = eth * R;
        question = r`By how much does the radius increase? Give $\Delta R$ in mm, to three significant figures.`;
        suffix = "mm";
        display = r`${show(ans)}\,\mathrm{mm}`;
        floor = 0.0001;
        hint = r`The hoop strain is $u_r/R$. Get $\varepsilon_{\theta\theta}$ from both wall stresses (don't forget the Poisson term).`;
        steps = [hoopLine, r`Since $\varepsilon_{\theta\theta} = u_r/R$: $\Delta R = \varepsilon_{\theta\theta}R = (${show(eth * 1e6, 4)}\times 10^{-6})(${R}\,\mathrm{mm}) = ${show(ans)}\,\mathrm{mm}$.`];
        break;
      case "dC":
        ans = eth * 2 * Math.PI * R;
        question = r`By how much does the circumference increase? Give $\Delta C$ in mm, to three significant figures.`;
        suffix = "mm";
        display = r`${show(ans)}\,\mathrm{mm}`;
        floor = 0.0005;
        hint = r`The circumference is proportional to the radius, so $\Delta C/C$ is the hoop strain. Get $\varepsilon_{\theta\theta}$ from both wall stresses.`;
        steps = [hoopLine, r`$\Delta C = \varepsilon_{\theta\theta}\,(2\pi R) = (${show(eth * 1e6, 4)}\times 10^{-6})(${show(2 * Math.PI * R, 4)}\,\mathrm{mm}) = ${show(ans)}\,\mathrm{mm}$.`];
        break;
      default:
        ans = ezz * L * 1000;
        question = r`By how much does the length of the cylinder change? Give $\Delta L$ in mm (positive = longer), to three significant figures.`;
        suffix = "mm";
        display = r`${show(ans)}\,\mathrm{mm}`;
        floor = 0.0001;
        hint = r`Use the axial strain, which combines $\sigma_{zz}$ with a Poisson contraction from the (larger) hoop stress.`;
        steps = [
          r`$$\varepsilon_{zz} = \frac{\sigma_{zz} - \nu\sigma_{\theta\theta}}{E} = \frac{pR}{tE}\Big(\frac{1}{2} - \nu\Big) = \frac{${show(sth)}}{${show(E)}}\Big(\frac{1}{2} - ${m.nu}\Big) = ${show(ezz * 1e6, 4)}\times 10^{-6}$$`,
          r`$\Delta L = \varepsilon_{zz}L = (${show(ezz * 1e6, 4)}\times 10^{-6})(${show(L * 1000)}\,\mathrm{mm}) = ${show(ans)}\,\mathrm{mm}$.`,
        ];
    }
    return numeric("", {
      body: r`A closed-end thin-walled ${solidTex(m)} cylinder has inner radius $R = ${R}\,\mathrm{mm}$, wall thickness $t = ${t}\,\mathrm{mm}$ ($R/t = ${show(R / t)}$) and length $L = ${L}\,\mathrm{m}$. It is pressurised to $p = ${p}\,\mathrm{MPa}$.`,
      question,
      answer: clean(ans),
      tolerance: tol(ans, floor),
      suffix,
      answerDisplay: display,
      hint,
      explanation: para(stresses, ...steps),
      tags: ["pressure-vessels", "cylinder", "vessel-strain"],
    });
  },
});

define({
  id: "gen.sm.composite-bar",
  unitId: "sm5",
  title: "Bonded two-material (composite) bar",
  make: (_seed, rng) => {
    const [m1, m2] = pick(rng, [
      [STEEL, ALUMINIUM],
      [STEEL, COPPER],
      [TITANIUM, ALUMINIUM],
      [COPPER, ALUMINIUM],
    ] as const);
    const geom = pick(rng, ["core", "side"] as const);
    const ask = pick(rng, ["strain", "stress1", "stress2", "elong", "force1"] as const);
    const sgn = rng() < 0.65 ? 1 : -1;
    const E1 = m1.E * 1000;
    const E2 = m2.E * 1000;
    const FORCES = [10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200];
    const strainOk = (F: number, a1: number, a2: number) => {
      const e = (F * 1000) / (E1 * a1 + E2 * a2);
      return e >= 200e-6 && e <= 1000e-6;
    };
    let A1: number;
    let A2: number;
    let F: number;
    let layout: string;
    let areaWork: string | false = false;
    if (geom === "core") {
      const v = draw(
        () => ({ d1: pick(rng, [10, 12, 16, 20, 25, 30, 40]), w: pick(rng, [3, 4, 5, 6, 8, 10]), F: pick(rng, FORCES) }),
        (v) => strainOk(v.F, (Math.PI * v.d1 ** 2) / 4, (Math.PI * ((v.d1 + 2 * v.w) ** 2 - v.d1 ** 2)) / 4),
        { d1: 20, w: 5, F: 50 },
      );
      const d2 = v.d1 + 2 * v.w;
      A1 = (Math.PI * v.d1 ** 2) / 4;
      A2 = (Math.PI * (d2 ** 2 - v.d1 ** 2)) / 4;
      F = v.F;
      layout = r`A solid ${m1.name} core of diameter $d_1 = ${v.d1}\,\mathrm{mm}$ is perfectly bonded inside ${art(m2.name)} ${m2.name} tube of outer diameter $d_2 = ${d2}\,\mathrm{mm}$.`;
      areaWork = r`Areas: $A_1 = \pi d_1^2/4 = ${show(A1, 4)}\,\mathrm{mm}^2$ (${m1.name}) and $A_2 = \pi(d_2^2 - d_1^2)/4 = ${show(A2, 4)}\,\mathrm{mm}^2$ (${m2.name}).`;
    } else {
      const AREAS = [100, 150, 200, 250, 300, 400, 500, 600, 800, 1000];
      const v = draw(
        () => ({ A1: pick(rng, AREAS), A2: pick(rng, AREAS), F: pick(rng, FORCES) }),
        (v) => strainOk(v.F, v.A1, v.A2),
        { A1: 300, A2: 400, F: 50 },
      );
      A1 = v.A1;
      A2 = v.A2;
      F = v.F;
      layout = r`${art(m1.name, true)} ${m1.name} bar of cross-section $A_1 = ${A1}\,\mathrm{mm}^2$ and ${art(m2.name)} ${m2.name} bar of cross-section $A_2 = ${A2}\,\mathrm{mm}^2$ are bonded side by side along their full length.`;
    }
    const L = pick(rng, [300, 400, 500, 600, 800, 1000, 1200, 1500, 2000]);
    const EA = E1 * A1 + E2 * A2; // N
    const Fn = sgn * F * 1000; // N
    const eps = Fn / EA;
    const kind = sgn > 0 ? "tensile" : "compressive";
    let question: string;
    let ans: number;
    let suffix: string;
    let display: string;
    let last: string;
    let floor: number;
    let hint: string;
    switch (ask) {
      case "strain":
        question = r`What is the axial strain in the bar, in micro-strain ($10^{-6}$), to three significant figures? Use the sign convention (negative = shortening).`;
        ans = eps * 1e6;
        suffix = "μ";
        display = r`${show(ans)}\,\mu`;
        floor = 0.5;
        hint = "The bonded bar behaves like one bar with an effective axial stiffness: add up E·A over the two materials.";
        last = r`Both materials carry this strain; their stresses differ in the ratio $E_1 : E_2$.`;
        break;
      case "stress1":
      case "stress2": {
        const one = ask === "stress1";
        const mm = one ? m1 : m2;
        const s = (one ? E1 : E2) * eps;
        question = r`What is the axial stress in the ${mm.name}, in MPa, to three significant figures? Tension is positive.`;
        ans = s;
        suffix = "MPa";
        display = r`${show(s)}\,\mathrm{MPa}`;
        floor = 0.01;
        hint = "Both materials share the same strain. Find it from the total force and the combined stiffness, then apply Hooke's law to the material asked about.";
        last = r`Stress in the ${mm.name}: $\sigma = E\varepsilon = (${show(mm.E * 1000)}\,\mathrm{MPa})(${show(eps * 1e6, 4)}\times 10^{-6}) = ${show(s)}\,\mathrm{MPa}$. The strain is shared, the stress is not: the stiffer material carries the larger stress.`;
        break;
      }
      case "elong":
        ans = eps * L;
        question = r`What is the change in length of the bar, in mm, to three significant figures? (Negative = shortening.)`;
        suffix = "mm";
        display = r`${show(ans)}\,\mathrm{mm}`;
        floor = 0.0005;
        hint = r`Find the common strain from the combined stiffness $\sum E_iA_i$, then multiply by the length.`;
        last = r`$\delta = \varepsilon L = (${show(eps * 1e6, 4)}\times 10^{-6})(${L}\,\mathrm{mm}) = ${show(ans)}\,\mathrm{mm}$ — the same as $RL/(EA)_{\text{eff}}$.`;
        break;
      default: {
        const F1 = E1 * A1 * eps; // N
        ans = F1 / 1000;
        question = r`How much of the load does the ${m1.name} carry? Give the axial force in the ${m1.name}, in kN, to three significant figures (tension positive).`;
        suffix = "kN";
        display = r`${show(ans)}\,\mathrm{kN}`;
        floor = 0.005;
        hint = "The two materials share the strain, so each carries force in proportion to its E·A.";
        last = r`Force in the ${m1.name}: $R_1 = E_1A_1\varepsilon = (${show(E1)})(${show(A1, 4)})(${show(eps * 1e6, 4)}\times 10^{-6}) = ${show(F1, 4)}\,\mathrm{N} = ${show(ans)}\,\mathrm{kN}$; the ${m2.name} carries the remaining $${show(Fn / 1000 - ans)}\,\mathrm{kN}$.`;
      }
    }
    return numeric("", {
      body: r`${layout} Rigid end plates make the two materials deform together, and the assembly carries an axial ${kind} force of $${F}\,\mathrm{kN}$${ask === "elong" ? r` over its length $L = ${L}\,\mathrm{mm}$` : ""}. Moduli: ${m1.name} $E_1 = ${m1.E}\,\mathrm{GPa}$, ${m2.name} $E_2 = ${m2.E}\,\mathrm{GPa}$.`,
      question,
      answer: clean(ans),
      tolerance: tol(ans, floor),
      suffix,
      answerDisplay: display,
      hint,
      explanation: para(
        areaWork,
        r`The bonded materials share one strain $\varepsilon$ (plane sections remain plane), so $R = \int_A \sigma_{xx}\,\mathrm{d}A = (E_1A_1 + E_2A_2)\,\varepsilon$:`,
        r`$$(EA)_{\text{eff}} = (${show(E1)})(${show(A1, 4)}) + (${show(E2)})(${show(A2, 4)}) = ${show(EA / 1e6, 4)}\times 10^{6}\,\mathrm{N}$$`,
        r`$$\varepsilon = \frac{R}{(EA)_{\text{eff}}} = \frac{${show(Fn)}\,\mathrm{N}}{${show(EA / 1e6, 4)}\times 10^{6}\,\mathrm{N}} = ${show(eps * 1e6, 4)}\times 10^{-6}$$`,
        last,
      ),
      tags: ["composite-bar", "rod-in-3d"],
    });
  },
});

/* ------------------------------------------------------------------ */
/* Unit sm6 — torsion                                                   */
/* ------------------------------------------------------------------ */

define({
  id: "gen.sm.polar-moment",
  unitId: "sm6",
  title: "Polar moment of inertia of a shaft",
  make: (_seed, rng) => {
    const variant = pick(rng, ["solid-d", "solid-R", "hollow-d", "hollow-t"] as const);
    let J: number;
    let body: string;
    let work: string;
    if (variant === "solid-d") {
      const d = pick(rng, [20, 25, 30, 32, 36, 40, 45, 50, 60, 75, 80, 90, 100, 120, 150]);
      J = polarJ(d);
      body = r`A solid circular shaft has diameter $d = ${d}\,\mathrm{mm}$.`;
      work = r`$$J = \int_A r^2\,\mathrm{d}A = \frac{\pi d^4}{32} = \frac{\pi(${d}\,\mathrm{mm})^4}{32} = ${show(J, 4)}\,\mathrm{mm}^4$$`;
    } else if (variant === "solid-R") {
      const R = pick(rng, [10, 12, 15, 16, 20, 25, 30, 40, 50, 60, 75]);
      J = (Math.PI * R ** 4) / 2;
      body = r`A solid circular shaft has radius $R = ${R}\,\mathrm{mm}$.`;
      work = r`$$J = \int_0^R r^2\,(2\pi r\,\mathrm{d}r) = \frac{\pi R^4}{2} = \frac{\pi(${R}\,\mathrm{mm})^4}{2} = ${show(J, 4)}\,\mathrm{mm}^4$$`;
    } else if (variant === "hollow-d") {
      const { dOut, w } = draw(
        () => ({ dOut: pick(rng, [40, 50, 60, 75, 80, 100, 120, 150, 200]), w: pick(rng, [3, 4, 5, 6, 8, 10, 12, 15, 20]) }),
        (v) => v.dOut - 2 * v.w >= 0.4 * v.dOut,
        { dOut: 80, w: 10 },
      );
      const dIn = dOut - 2 * w;
      J = polarJ(dOut, dIn);
      body = r`A hollow circular shaft has outer diameter $d_o = ${dOut}\,\mathrm{mm}$ and inner diameter $d_i = ${dIn}\,\mathrm{mm}$.`;
      work = r`$$J = \frac{\pi\,(d_o^4 - d_i^4)}{32} = \frac{\pi\,(${show(dOut ** 4)} - ${show(dIn ** 4)})}{32} = ${show(J, 4)}\,\mathrm{mm}^4$$`;
    } else {
      const { Ro, w } = draw(
        () => ({ Ro: pick(rng, [20, 25, 30, 40, 50, 60, 75, 100]), w: pick(rng, [2, 3, 4, 5, 6, 8, 10, 12]) }),
        (v) => v.Ro - v.w >= 0.4 * v.Ro,
        { Ro: 40, w: 5 },
      );
      const Ri = Ro - w;
      J = (Math.PI * (Ro ** 4 - Ri ** 4)) / 2;
      body = r`A circular tube has outer radius $R_o = ${Ro}\,\mathrm{mm}$ and wall thickness $t = ${w}\,\mathrm{mm}$.`;
      work = para(
        r`Inner radius $R_i = R_o - t = ${Ri}\,\mathrm{mm}$; the tube is the solid section minus the missing core:`,
        r`$$J = \frac{\pi\,(R_o^4 - R_i^4)}{2} = \frac{\pi\,(${show(Ro ** 4)} - ${show(Ri ** 4)})}{2} = ${show(J, 4)}\,\mathrm{mm}^4$$`,
      );
    }
    const exp = J >= 1e6 ? 6 : 3;
    const ans = J / 10 ** exp;
    const solid = variant === "solid-d" || variant === "solid-R";
    return numeric("", {
      body,
      question: r`What is its polar moment of inertia $J$, in units of $10^{${exp}}\,\mathrm{mm}^4$, to three significant figures?`,
      answer: clean(ans),
      tolerance: tol(ans, 0.001),
      suffix: r`$\times 10^{${exp}}\ \mathrm{mm}^4$`,
      answerDisplay: r`${show(ans, 4)}\times 10^{${exp}}\,\mathrm{mm}^4`,
      hint: solid
        ? r`$J = \int_A r^2\,\mathrm{d}A$ — add up thin rings of area $2\pi r\,\mathrm{d}r$. Check whether you were given a radius or a diameter.`
        : "A hollow section is the solid section minus the missing core: subtract the J of the hole from the J of the full circle.",
      explanation: para(work, r`In the requested units: $J = ${show(ans, 4)}\times 10^{${exp}}\,\mathrm{mm}^4$.`),
      tags: ["torsion", "polar-moment"],
    });
  },
});

define({
  id: "gen.sm.torsion-stress",
  unitId: "sm6",
  title: "Shear stress in a circular shaft",
  make: (_seed, rng) => {
    const variant = pick(rng, ["solid-max", "solid-max", "solid-r", "hollow-max", "hollow-inner"] as const);
    const tags = ["torsion", "shear-stress"];

    if (variant === "solid-max" || variant === "solid-r") {
      const atR = variant === "solid-r";
      const v = draw(
        () => ({
          T: pick(rng, TORQUES),
          d: pick(rng, [20, 25, 30, 35, 40, 45, 50, 60, 70, 75, 80, 100]),
          r0: pick(rng, [4, 5, 6, 8, 10, 12, 15, 20, 25, 30]),
        }),
        (v) => {
          const tau = (v.T * 1000 * (v.d / 2)) / polarJ(v.d);
          return tau >= 15 && tau <= 150 && (!atR || (v.r0 < v.d / 2 && v.r0 >= 0.2 * (v.d / 2)));
        },
        { T: 500, d: 40, r0: 10 },
      );
      const J = polarJ(v.d);
      const c = v.d / 2;
      const Tn = v.T * 1000; // N·mm
      const tauMax = (Tn * c) / J;
      const tauR = (Tn * v.r0) / J;
      const ans = atR ? tauR : tauMax;
      return numeric("", {
        body: r`A solid circular shaft of diameter $d = ${v.d}\,\mathrm{mm}$ transmits a torque $T = ${v.T}\,\mathrm{N\cdot m}$ and remains elastic.`,
        question: atR
          ? r`What is the shear stress at radius $r = ${v.r0}\,\mathrm{mm}$ from the axis, in MPa, to three significant figures?`
          : r`What is the maximum shear stress in the shaft, in MPa, to three significant figures?`,
        answer: clean(ans),
        tolerance: tol(ans, 0.01),
        suffix: "MPa",
        answerDisplay: r`${show(ans)}\,\mathrm{MPa}`,
        hint: "In an elastic circular shaft the shear stress is proportional to the distance from the axis. Work in N·mm and mm so the stress comes out in MPa.",
        explanation: para(
          r`$J = \pi d^4/32 = ${show(J, 4)}\,\mathrm{mm}^4$ and $T = ${show(Tn)}\,\mathrm{N\cdot mm}$. The shear stress $\tau = Tr/J$ grows linearly from zero on the axis to its maximum at the surface $r = c = ${show(c)}\,\mathrm{mm}$.`,
          atR
            ? r`$$\tau(${v.r0}\,\mathrm{mm}) = \frac{Tr}{J} = \frac{(${show(Tn)})(${v.r0})}{${show(J, 4)}} = ${show(tauR)}\,\mathrm{MPa}$$`
            : r`$$\tau_{\max} = \frac{Tc}{J} = \frac{16T}{\pi d^3} = \frac{(${show(Tn)})(${show(c)})}{${show(J, 4)}} = ${show(tauMax)}\,\mathrm{MPa}$$`,
          atR && r`(At the surface it would be $${show(tauMax)}\,\mathrm{MPa}$; the ratio is $r/c = ${show(v.r0 / c)}$.)`,
        ),
        tags,
      });
    }

    const inner = variant === "hollow-inner";
    const v = draw(
      () => {
        const dOut = pick(rng, [40, 50, 60, 75, 80, 100, 120]);
        return { T: pick(rng, TORQUES), dOut, dIn: dOut - 2 * pick(rng, [3, 4, 5, 6, 8, 10, 12, 15]) };
      },
      (v) => {
        const tau = (v.T * 1000 * (v.dOut / 2)) / polarJ(v.dOut, v.dIn);
        return v.dIn >= 0.4 * v.dOut && tau >= 15 && tau <= 150;
      },
      { T: 2000, dOut: 50, dIn: 40 },
    );
    const J = polarJ(v.dOut, v.dIn);
    const Tn = v.T * 1000;
    const tauOut = (Tn * (v.dOut / 2)) / J;
    const tauIn = (Tn * (v.dIn / 2)) / J;
    const ans = inner ? tauIn : tauOut;
    return numeric("", {
      body: r`A hollow circular shaft has outer diameter $d_o = ${v.dOut}\,\mathrm{mm}$ and inner diameter $d_i = ${v.dIn}\,\mathrm{mm}$. It transmits a torque $T = ${v.T}\,\mathrm{N\cdot m}$ and remains elastic.`,
      question: inner
        ? r`What is the shear stress on the **inner** surface of the shaft, in MPa, to three significant figures?`
        : r`What is the maximum shear stress in the shaft, in MPa, to three significant figures?`,
      answer: clean(ans),
      tolerance: tol(ans, 0.01),
      suffix: "MPa",
      answerDisplay: r`${show(ans)}\,\mathrm{MPa}`,
      hint: "The shear stress is proportional to the distance from the axis, τ = Tr/J. Compute J for the hollow section (full circle minus the hole) and pick the right radius.",
      explanation: para(
        r`$$J = \frac{\pi(d_o^4 - d_i^4)}{32} = \frac{\pi(${show(v.dOut ** 4)} - ${show(v.dIn ** 4)})}{32} = ${show(J, 4)}\,\mathrm{mm}^4$$`,
        inner
          ? r`$$\tau_i = \frac{T\,(d_i/2)}{J} = \frac{(${show(Tn)}\,\mathrm{N\cdot mm})(${show(v.dIn / 2)}\,\mathrm{mm})}{${show(J, 4)}\,\mathrm{mm}^4} = ${show(tauIn)}\,\mathrm{MPa}$$`
          : r`$$\tau_{\max} = \frac{T\,(d_o/2)}{J} = \frac{(${show(Tn)}\,\mathrm{N\cdot mm})(${show(v.dOut / 2)}\,\mathrm{mm})}{${show(J, 4)}\,\mathrm{mm}^4} = ${show(tauOut)}\,\mathrm{MPa}$$`,
        inner
          ? r`It is smaller than the surface value $${show(tauOut)}\,\mathrm{MPa}$ by the ratio $d_i/d_o = ${show(v.dIn / v.dOut)}$ — the stress is linear in $r$.`
          : r`The stress varies linearly through the wall, down to $${show(tauIn)}\,\mathrm{MPa}$ at the inner surface.`,
      ),
      tags,
    });
  },
});

define({
  id: "gen.sm.torsion-twist",
  unitId: "sm6",
  title: "Angle of twist of a shaft",
  make: (_seed, rng) => {
    const mat = pick(rng, SHAFTS);
    const G = mat.G * 1000; // MPa
    const hollow = rng() < 0.35;
    const ask = pick(rng, ["deg", "deg", "rad", "torque"] as const);
    const LENGTHS = [0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3];
    const section = () => {
      if (!hollow) return { dOut: pick(rng, [20, 25, 30, 35, 40, 45, 50, 60, 70, 75, 80, 100]), dIn: 0 };
      const dOut = pick(rng, [40, 50, 60, 75, 80, 100, 120]);
      return { dOut, dIn: dOut - 2 * pick(rng, [3, 4, 5, 6, 8, 10, 12, 15]) };
    };
    const okSection = (s: { dOut: number; dIn: number }) => !hollow || s.dIn >= 0.4 * s.dOut;
    const shape = (s: { dOut: number; dIn: number }) =>
      hollow
        ? r`hollow ${mat.name} shaft with outer diameter $d_o = ${s.dOut}\,\mathrm{mm}$ and inner diameter $d_i = ${s.dIn}\,\mathrm{mm}$`
        : r`solid ${mat.name} shaft of diameter $d = ${s.dOut}\,\mathrm{mm}$`;
    const jText = (J: number) => (hollow ? r`$J = \pi(d_o^4 - d_i^4)/32 = ${show(J, 4)}\,\mathrm{mm}^4$` : r`$J = \pi d^4/32 = ${show(J, 4)}\,\mathrm{mm}^4$`);
    const tags = ["torsion", "angle-of-twist"];

    if (ask === "torque") {
      const v = draw(
        () => ({ ...section(), L: pick(rng, LENGTHS), phiA: pick(rng, [0.5, 1, 1.5, 2, 2.5, 3]) }),
        (v) => {
          if (!okSection(v)) return false;
          const tau = (G * ((v.phiA * Math.PI) / 180) * (v.dOut / 2)) / (v.L * 1000); // τ = G c φ / L
          return tau >= 10 && tau <= mat.tauCap;
        },
        { dOut: hollow ? 80 : 40, dIn: hollow ? 60 : 0, L: 1.5, phiA: 2 },
      );
      const J = polarJ(v.dOut, v.dIn);
      const phiR = (v.phiA * Math.PI) / 180;
      const Tn = (G * J * phiR) / (v.L * 1000); // N·mm
      const ans = Tn / 1000; // N·m
      return numeric("", {
        body: r`A ${shape(v)} ($G = ${mat.G}\,\mathrm{GPa}$) has length $L = ${v.L}\,\mathrm{m}$ and is loaded by end torques. Its ends may rotate relative to each other by at most $${v.phiA}^\circ$.`,
        question: r`What is the largest torque the shaft may carry, in N·m, to three significant figures?`,
        answer: clean(ans),
        tolerance: tol(ans, 0.01),
        suffix: "N·m",
        answerDisplay: r`${show(ans)}\,\mathrm{N\cdot m}`,
        hint: "Invert the twist formula for an end-loaded shaft, with the angle in radians and everything in N, mm and MPa.",
        explanation: para(
          r`${jText(J)}; $\varphi_{\text{allow}} = ${v.phiA}^\circ = ${show(phiR, 4)}\,\mathrm{rad}$; $L = ${show(v.L * 1000)}\,\mathrm{mm}$; $G = ${show(G)}\,\mathrm{MPa}$.`,
          r`$$\varphi = \frac{TL}{GJ} \le \varphi_{\text{allow}} \;\Rightarrow\; T = \frac{GJ\varphi_{\text{allow}}}{L} = \frac{(${show(G)})(${show(J, 4)})(${show(phiR, 4)})}{${show(v.L * 1000)}} = ${show(Tn, 4)}\,\mathrm{N\cdot mm} = ${show(ans)}\,\mathrm{N\cdot m}$$`,
        ),
        tags,
      });
    }

    const v = draw(
      () => ({ ...section(), L: pick(rng, LENGTHS), T: pick(rng, TORQUES) }),
      (v) => {
        if (!okSection(v)) return false;
        const J = polarJ(v.dOut, v.dIn);
        const tau = (v.T * 1000 * (v.dOut / 2)) / J;
        const phi = deg((v.T * 1000 * v.L * 1000) / (G * J));
        return tau >= 10 && tau <= mat.tauCap && phi >= 0.3 && phi <= 12;
      },
      { dOut: hollow ? 80 : 40, dIn: hollow ? 60 : 0, L: 1.5, T: hollow ? 1500 : 500 },
    );
    const J = polarJ(v.dOut, v.dIn);
    const Tn = v.T * 1000;
    const Lmm = v.L * 1000;
    const phi = (Tn * Lmm) / (G * J); // rad
    const inDeg = ask === "deg";
    const ans = inDeg ? deg(phi) : phi;
    return numeric("", {
      body: r`A ${shape(v)} ($G = ${mat.G}\,\mathrm{GPa}$) has length $L = ${v.L}\,\mathrm{m}$. It is twisted by equal and opposite end torques $T = ${v.T}\,\mathrm{N\cdot m}$.`,
      question: inDeg
        ? r`What is the angle of twist $\varphi$ between the two ends, in degrees, to three significant figures?`
        : r`What is the angle of twist $\varphi$ between the two ends, in radians, to three significant figures?`,
      answer: clean(ans),
      tolerance: inDeg ? tol(ans, 0.002) : tol(ans, 0.00005),
      suffix: inDeg ? "°" : "rad",
      answerDisplay: inDeg ? r`${show(ans)}^\circ` : r`${show(ans)}\,\mathrm{rad}`,
      hint: "For an end-loaded uniform shaft the twist rate T/(GJ) is constant along the length. Work in N, mm and MPa; the formula gives radians.",
      explanation: para(
        r`${jText(J)}. In N, mm, MPa: $T = ${show(Tn)}\,\mathrm{N\cdot mm}$, $L = ${show(Lmm)}\,\mathrm{mm}$, $G = ${show(G)}\,\mathrm{MPa}$.`,
        r`$$\varphi = \frac{TL}{GJ} = \frac{(${show(Tn)})(${show(Lmm)})}{(${show(G)})(${show(J, 4)})} = ${show(phi, 4)}\,\mathrm{rad}$$`,
        inDeg && r`In degrees: $\varphi = ${show(phi, 4)} \times 180^\circ/\pi = ${show(ans)}^\circ$.`,
      ),
      tags,
    });
  },
});

define({
  id: "gen.sm.torsion-stepped",
  unitId: "sm6",
  title: "Stepped shaft with two applied torques",
  make: (_seed, rng) => {
    const mat = pick(rng, SHAFTS);
    const G = mat.G * 1000;
    const ask = pick(rng, ["end", "end", "junction", "stress"] as const);
    type Shaft = { d1: number; d2: number; L1: number; L2: number; TB: number; TC: number };
    const calc = (s: Shaft) => {
      const J1 = polarJ(s.d1);
      const J2 = polarJ(s.d2);
      const T1 = s.TB + s.TC; // internal torque in AB, N·m
      const T2 = s.TC; // internal torque in BC, N·m
      return {
        J1,
        J2,
        T1,
        T2,
        th1: (T1 * 1000 * s.L1 * 1000) / (G * J1),
        th2: (T2 * 1000 * s.L2 * 1000) / (G * J2),
        tau1: (Math.abs(T1) * 1000 * (s.d1 / 2)) / J1,
        tau2: (Math.abs(T2) * 1000 * (s.d2 / 2)) / J2,
      };
    };
    const s = draw<Shaft>(
      () => ({
        d1: pick(rng, [40, 50, 60, 75, 80]),
        d2: pick(rng, [25, 30, 40, 50, 60]),
        L1: pick(rng, [0.5, 0.6, 0.8, 1, 1.2, 1.5]),
        L2: pick(rng, [0.4, 0.5, 0.6, 0.8, 1, 1.2]),
        TB: pick(rng, [-2000, -1500, -1200, -1000, -800, -600, -500, 300, 500, 600, 800, 1000, 1200, 1500]),
        TC: pick(rng, [-1000, -800, -600, -500, -400, -300, 200, 300, 400, 500, 600, 800, 1000]),
      }),
      (v) => {
        if (v.d2 >= v.d1) return false;
        const c = calc(v);
        if (Math.abs(c.T1) < 100) return false;
        const tmax = Math.max(c.tau1, c.tau2);
        if (tmax > mat.tauCap || tmax < 10) return false;
        if (ask === "end") {
          const e = Math.abs(deg(c.th1 + c.th2));
          return e >= 0.2 && e <= 10 && Math.abs(c.th1 + c.th2) >= 0.4 * (Math.abs(c.th1) + Math.abs(c.th2));
        }
        if (ask === "junction") {
          const e = Math.abs(deg(c.th1));
          return e >= 0.2 && e <= 10;
        }
        return true;
      },
      { d1: 50, d2: 40, L1: 1, L2: 0.8, TB: 500, TC: 400 },
    );
    const c = calc(s);
    const fmtT = (x: number) => (x > 0 ? `+${x}` : `${x}`);
    const body = r`A stepped ${mat.name} shaft ($G = ${mat.G}\,\mathrm{GPa}$) is built in at end A. Segment AB has length $L_1 = ${s.L1}\,\mathrm{m}$ and diameter $d_1 = ${s.d1}\,\mathrm{mm}$; segment BC has $L_2 = ${s.L2}\,\mathrm{m}$ and $d_2 = ${s.d2}\,\mathrm{mm}$; end C is free. External torques $T_B = ${fmtT(s.TB)}\,\mathrm{N\cdot m}$ (at the step B) and $T_C = ${fmtT(s.TC)}\,\mathrm{N\cdot m}$ (at C) act about the shaft axis $z$, which points from A to C; positive means right-handed about $+z$.`;
    const cuts = r`Internal torques by section cuts, keeping the part beyond the cut (towards the free end C): $T_{BC} = T_C = ${c.T2}\,\mathrm{N\cdot m}$ and $T_{AB} = T_B + T_C = (${s.TB}) + (${s.TC}) = ${c.T1}\,\mathrm{N\cdot m}$.`;
    const js = r`Polar moments: $J_1 = \pi d_1^4/32 = ${show(c.J1, 4)}\,\mathrm{mm}^4$ and $J_2 = \pi d_2^4/32 = ${show(c.J2, 4)}\,\mathrm{mm}^4$.`;
    const twists = r`$$\Delta\varphi_{AB} = \frac{T_{AB}L_1}{GJ_1} = \frac{(${show(c.T1 * 1000)})(${show(s.L1 * 1000)})}{(${show(G)})(${show(c.J1, 4)})} = ${show(c.th1, 4)}\,\mathrm{rad},\qquad \Delta\varphi_{BC} = \frac{T_{BC}L_2}{GJ_2} = \frac{(${show(c.T2 * 1000)})(${show(s.L2 * 1000)})}{(${show(G)})(${show(c.J2, 4)})} = ${show(c.th2, 4)}\,\mathrm{rad}$$`;
    const hint = "Cut each segment and keep the free part: the internal torque equals the sum of the external torques beyond the cut. Then add the segment twists TL/(GJ) outward from the wall, where the rotation is zero.";
    const tags = ["torsion", "stepped-shaft", "torque-diagram"];

    if (ask === "stress") {
      const ans = Math.max(c.tau1, c.tau2);
      const where = c.tau1 >= c.tau2 ? "AB" : "BC";
      return numeric("", {
        body,
        question: r`What is the largest shear-stress magnitude anywhere in the shaft, in MPa, to three significant figures?`,
        answer: clean(ans),
        tolerance: tol(ans, 0.01),
        suffix: "MPa",
        answerDisplay: r`${show(ans)}\,\mathrm{MPa}`,
        hint: "Find the internal torque in each segment by section cuts, then the surface stress τ = Tc/J of each segment — the thinner segment is not automatically the worst.",
        explanation: para(
          cuts,
          js,
          r`Surface stress per segment, $\tau = |T|\,(d/2)/J$: AB: $(${show(Math.abs(c.T1) * 1000)})(${show(s.d1 / 2)})/${show(c.J1, 4)} = ${show(c.tau1)}\,\mathrm{MPa}$; BC: $(${show(Math.abs(c.T2) * 1000)})(${show(s.d2 / 2)})/${show(c.J2, 4)} = ${show(c.tau2)}\,\mathrm{MPa}$.`,
          r`The largest is $${show(ans)}\,\mathrm{MPa}$, at the surface of segment ${where}.`,
        ),
        tags,
      });
    }

    const end = ask === "end";
    const phi = end ? c.th1 + c.th2 : c.th1;
    const ans = deg(phi);
    const toleranceDeg = end ? Math.max(0.01 * Math.abs(ans), 0.005 * (Math.abs(deg(c.th1)) + Math.abs(deg(c.th2))), 0.002) : tol(ans, 0.002);
    return numeric("", {
      body,
      question: end
        ? r`What is the rotation $\varphi_C$ of the free end C, in degrees, to three significant figures? Give its sign (same convention as the torques).`
        : r`What is the rotation $\varphi_B$ of the step B, in degrees, to three significant figures? Give its sign (same convention as the torques).`,
      answer: clean(ans),
      tolerance: clean(toleranceDeg),
      suffix: "°",
      answerDisplay: r`${show(ans)}^\circ`,
      hint,
      explanation: para(
        cuts,
        js,
        r`Twist of each segment, $\Delta\varphi_i = T_iL_i/(GJ_i)$, in N·mm, mm and MPa:`,
        twists,
        end
          ? r`Starting from $\varphi_A = 0$ at the wall: $\varphi_C = \Delta\varphi_{AB} + \Delta\varphi_{BC} = ${show(phi, 4)}\,\mathrm{rad} = ${show(ans)}^\circ$.`
          : r`Starting from $\varphi_A = 0$ at the wall: $\varphi_B = \Delta\varphi_{AB} = ${show(phi, 4)}\,\mathrm{rad} = ${show(ans)}^\circ$ (segment BC's twist only matters beyond B).`,
      ),
      tags,
    });
  },
});

define({
  id: "gen.sm.torsion-power",
  unitId: "sm6",
  title: "Power, speed and torque in a rotating shaft",
  make: (_seed, rng) => {
    const ask = pick(rng, ["torque", "torque", "diameter", "power"] as const);
    const RPM = [300, 450, 600, 720, 900, 1000, 1200, 1450, 1500, 1800, 2400, 3000, 3600];
    const tags = ["torsion", "power"];

    if (ask === "power") {
      const { T, n } = draw(
        () => ({ T: pick(rng, [20, 50, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1500, 2000]), n: pick(rng, RPM) }),
        (v) => {
          const P = (v.T * 2 * Math.PI * v.n) / 60 / 1000;
          return P >= 1 && P <= 1000;
        },
        { T: 50, n: 1500 },
      );
      const w = (2 * Math.PI * n) / 60;
      const P = (T * w) / 1000; // kW
      return numeric("", {
        body: r`A shaft turning at a steady $n = ${n}\,\mathrm{rpm}$ transmits a torque $T = ${T}\,\mathrm{N\cdot m}$.`,
        question: r`What power does it transmit, in kW, to three significant figures?`,
        answer: clean(P),
        tolerance: tol(P, 0.005),
        suffix: "kW",
        answerDisplay: r`${show(P)}\,\mathrm{kW}`,
        hint: "Power is torque times angular speed — and the angular speed must be in rad/s, not rpm.",
        explanation: para(
          r`Angular speed: $\omega = 2\pi n/60 = 2\pi(${n})/60 = ${show(w, 4)}\,\mathrm{rad/s}$.`,
          r`$$P = T\omega = (${T}\,\mathrm{N\cdot m})(${show(w, 4)}\,\mathrm{rad/s}) = ${show(T * w, 4)}\,\mathrm{W} = ${show(P)}\,\mathrm{kW}$$`,
        ),
        tags,
      });
    }

    const { P, n, ta } = draw(
      () => ({ P: pick(rng, [1.5, 2, 3, 4, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 75, 100]), n: pick(rng, RPM), ta: pick(rng, [30, 40, 50, 60, 70, 80]) }),
      (v) => {
        const T = (v.P * 1000) / ((2 * Math.PI * v.n) / 60);
        const d = Math.cbrt((16 * T * 1000) / (Math.PI * v.ta));
        return T >= 5 && T <= 3000 && d >= 8;
      },
      { P: 10, n: 1500, ta: 50 },
    );
    const w = (2 * Math.PI * n) / 60;
    const T = (P * 1000) / w; // N·m
    const torqueSteps = [
      r`Angular speed: $\omega = 2\pi n/60 = 2\pi(${n})/60 = ${show(w, 4)}\,\mathrm{rad/s}$.`,
      r`$$P = T\omega \;\Rightarrow\; T = \frac{P}{\omega} = \frac{${show(P * 1000)}\,\mathrm{W}}{${show(w, 4)}\,\mathrm{rad/s}} = ${show(T, 4)}\,\mathrm{N\cdot m}$$`,
    ];

    if (ask === "torque") {
      return numeric("", {
        body: r`A motor delivers $P = ${P}\,\mathrm{kW}$ to a shaft turning at a steady $n = ${n}\,\mathrm{rpm}$.`,
        question: r`What torque does the shaft transmit, in N·m, to three significant figures?`,
        answer: clean(T),
        tolerance: tol(T, 0.005),
        suffix: "N·m",
        answerDisplay: r`${show(T)}\,\mathrm{N\cdot m}`,
        hint: "Power is torque times angular speed. Convert rpm to rad/s and kW to W first.",
        explanation: para(...torqueSteps),
        tags,
      });
    }

    const Tn = T * 1000; // N·mm
    const d3 = (16 * Tn) / (Math.PI * ta);
    const d = Math.cbrt(d3);
    return numeric("", {
      body: r`A motor delivers $P = ${P}\,\mathrm{kW}$ to a solid circular steel shaft turning at $n = ${n}\,\mathrm{rpm}$. The allowable shear stress is $\tau_{\text{allow}} = ${ta}\,\mathrm{MPa}$.`,
      question: r`What is the minimum shaft diameter, in mm, to three significant figures? (Do not round up to a stock size.)`,
      answer: clean(d),
      tolerance: tol(d, 0.005),
      suffix: "mm",
      answerDisplay: r`${show(d)}\,\mathrm{mm}`,
      hint: "First get the torque from the power and the speed (in rad/s). Then require the maximum shear stress of a solid shaft, at its surface, to equal the allowable value.",
      explanation: para(
        ...torqueSteps,
        r`For a solid shaft $\tau_{\max} = Tc/J = 16T/(\pi d^3) \le \tau_{\text{allow}}$, so with $T = ${show(Tn, 4)}\,\mathrm{N\cdot mm}$:`,
        r`$$d \ge \Big(\frac{16T}{\pi\,\tau_{\text{allow}}}\Big)^{1/3} = \Big(\frac{16(${show(Tn, 4)})}{\pi(${ta})}\Big)^{1/3} = (${show(d3, 4)}\,\mathrm{mm}^3)^{1/3} = ${show(d)}\,\mathrm{mm}$$`,
      ),
      tags: [...tags, "design"],
    });
  },
});

define({
  id: "gen.sm.thin-wall-torsion",
  unitId: "sm6",
  title: "Thin-walled rectangular tube in torsion",
  make: (_seed, rng) => {
    type Ask = "tau-max" | "tau-thick" | "q" | "GJ" | "twist";
    const two = rng() < 0.5;
    const asks: Ask[] = two ? ["tau-max", "tau-max", "tau-thick", "q", "GJ", "twist"] : ["tau-max", "tau-max", "q", "GJ", "twist"];
    const ask = pick(rng, asks);
    const mat = pick(rng, SHAFTS);
    const G = mat.G * 1000;
    const v = draw(
      () => {
        const t1 = pick(rng, [2, 3, 4, 5, 6]);
        return {
          a: pick(rng, [60, 80, 100, 120, 150, 200, 250, 300]),
          b: pick(rng, [40, 50, 60, 80, 100, 120, 150, 200]),
          t1,
          t2: two ? pick(rng, [2, 3, 4, 5, 6]) : t1,
          T: pick(rng, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20]),
          L: pick(rng, [1, 1.5, 2, 2.5, 3, 4]),
        };
      },
      (v) => {
        if (v.a <= v.b || (two && v.t1 === v.t2) || Math.max(v.t1, v.t2) > v.b / 10) return false;
        const Ae = v.a * v.b;
        const tau = (v.T * 1e6) / (2 * Ae * Math.min(v.t1, v.t2));
        const S = (2 * v.a) / v.t1 + (2 * v.b) / v.t2;
        const phi = deg((v.T * 1e6 * v.L * 1000 * S) / (4 * Ae ** 2 * G));
        return tau >= 5 && tau <= mat.tauCap && phi >= 0.1 && phi <= 10;
      },
      { a: 150, b: 100, t1: 3, t2: two ? 2 : 3, T: 2, L: 2 },
    );
    const { a, b, t1, t2, T, L } = v;
    const Ae = a * b;
    const Tn = T * 1e6; // N·mm
    const q = Tn / (2 * Ae); // N/mm
    const tmin = Math.min(t1, t2);
    const tmax = Math.max(t1, t2);
    const S = (2 * a) / t1 + (2 * b) / t2; // ∮ ds/t
    const GJ = (4 * Ae ** 2 * G) / S; // N·mm²
    const phi = (Tn * L * 1000) / GJ; // rad
    const walls = two
      ? r`The top and bottom walls (mid-line length $${a}\,\mathrm{mm}$) are $t_1 = ${t1}\,\mathrm{mm}$ thick; the side walls (mid-line length $${b}\,\mathrm{mm}$) are $t_2 = ${t2}\,\mathrm{mm}$ thick.`
      : r`The wall is $t = ${t1}\,\mathrm{mm}$ thick all round.`;
    const body = r`A thin-walled ${mat.name} box tube ($G = ${mat.G}\,\mathrm{GPa}$) has a rectangular wall mid-line measuring $${a}\,\mathrm{mm} \times ${b}\,\mathrm{mm}$. ${walls} It carries a torque $T = ${T}\,\mathrm{kN\cdot m}$${ask === "twist" ? r` along its length $L = ${L}\,\mathrm{m}$` : ""}.`;
    const aeLine = r`Area enclosed by the wall mid-line: $A_e = (${a})(${b}) = ${show(Ae)}\,\mathrm{mm}^2$.`;
    const qLine = r`$$q = \frac{T}{2A_e} = \frac{${show(Tn)}\,\mathrm{N\cdot mm}}{2(${show(Ae)}\,\mathrm{mm}^2)} = ${show(q, 4)}\,\mathrm{N/mm}$$`;
    const sLine = two
      ? r`$\oint \mathrm{d}s/t = 2(${a})/${t1} + 2(${b})/${t2} = ${show(S, 4)}$.`
      : r`$\oint \mathrm{d}s/t = 2(${a} + ${b})/${t1} = ${show(S, 4)}$.`;
    const gjLine = r`$$(GJ)_{\text{eff}} = \frac{4A_e^2G}{\oint \mathrm{d}s/t} = \frac{4(${show(Ae)})^2(${show(G)})}{${show(S, 4)}} = ${show(GJ / 1e9, 4)}\times 10^{9}\,\mathrm{N\cdot mm^2} = ${show(GJ / 1e9)}\,\mathrm{kN\cdot m^2}$$`;
    const tags = ["torsion", "thin-walled-tube", "shear-flow"];

    let question: string;
    let ans: number;
    let suffix: string;
    let display: string;
    let floor: number;
    let hint: string;
    let steps: string[];
    switch (ask) {
      case "tau-max":
      case "tau-thick": {
        const thin = ask === "tau-max";
        const tw = thin ? tmin : tmax;
        ans = q / tw;
        question = thin
          ? r`What is the maximum shear stress in the tube wall, in MPa, to three significant figures?`
          : r`What is the shear stress in the **thicker** walls, in MPa, to three significant figures?`;
        suffix = "MPa";
        display = r`${show(ans)}\,\mathrm{MPa}`;
        floor = 0.01;
        hint = r`The shear flow $q = \tau t$ is the same all the way round the tube, and the torque equals $2A_e q$ with $A_e$ the area enclosed by the wall mid-line.`;
        steps = [
          aeLine,
          r`The shear flow is constant around the tube and $T = 2qA_e$:`,
          qLine,
          r`Then $\tau = q/t$${thin ? ", largest where the wall is thinnest" : ""}: $\tau = ${show(q, 4)}/${tw} = ${show(ans)}\,\mathrm{MPa}$${two ? (thin ? r` (the ${tmax} mm walls see only $${show(q / tmax)}\,\mathrm{MPa}$)` : r` (the ${tmin} mm walls see $${show(q / tmin)}\,\mathrm{MPa}$)`) : ""}.`,
        ];
        break;
      }
      case "q":
        ans = q;
        question = r`What is the shear flow $q$ in the tube wall, in N/mm, to three significant figures?`;
        suffix = "N/mm";
        display = r`${show(ans)}\,\mathrm{N/mm}`;
        floor = 0.01;
        hint = "Relate the torque to the shear flow through the area enclosed by the wall mid-line (not the area of material).";
        steps = [aeLine, r`The shear flow $q = \tau t$ is constant around the tube and $T = 2qA_e$:`, qLine];
        break;
      case "GJ":
        ans = GJ / 1e9;
        question = r`What is the effective torsional rigidity $(GJ)_{\text{eff}}$ of the tube, in $\mathrm{kN\cdot m^2}$, to three significant figures?`;
        suffix = "kN·m²";
        display = r`${show(ans)}\,\mathrm{kN\cdot m^2}`;
        floor = 0.005;
        hint = r`Use the thin-tube result $(GJ)_{\text{eff}} = 4A_e^2G/\oint \mathrm{d}s/t$, with $A_e$ enclosed by the mid-line. Remember $1\,\mathrm{kN\cdot m^2} = 10^{9}\,\mathrm{N\cdot mm^2}$.`;
        steps = [aeLine, sLine, gjLine];
        break;
      default:
        ans = deg(phi);
        question = r`What is the angle of twist over the length $L$, in degrees, to three significant figures?`;
        suffix = "°";
        display = r`${show(ans)}^\circ`;
        floor = 0.001;
        hint = r`Find the effective torsional rigidity $4A_e^2G/\oint \mathrm{d}s/t$ first, then use $\varphi = TL/(GJ)_{\text{eff}}$.`;
        steps = [
          aeLine,
          sLine,
          gjLine,
          r`$\varphi = TL/(GJ)_{\text{eff}} = (${show(Tn)})(${show(L * 1000)})/(${show(GJ / 1e9, 4)}\times 10^{9}) = ${show(phi, 4)}\,\mathrm{rad} = ${show(ans)}^\circ$.`,
        ];
    }
    return numeric("", {
      body,
      question,
      answer: clean(ans),
      tolerance: tol(ans, floor),
      suffix,
      answerDisplay: display,
      hint,
      explanation: para(...steps),
      tags,
    });
  },
});

/** Fixed–fixed shaft lengths L with "nice" load positions a (both mm). */
const SPAN_LOADS: [number, number[]][] = [
  [1000, [250, 400, 500, 600, 750]],
  [1200, [300, 400, 600, 800, 900]],
  [1500, [375, 500, 600, 900, 1000, 1125]],
  [1800, [450, 600, 900, 1200, 1350]],
  [2000, [500, 800, 1000, 1200, 1500]],
  [2400, [600, 800, 1200, 1600, 1800]],
  [3000, [750, 1000, 1200, 1500, 2000, 2250]],
];

define({
  id: "gen.sm.torsion-indeterminate",
  unitId: "sm6",
  title: "Statically indeterminate (fixed–fixed) shaft",
  make: (_seed, rng) => {
    const mat = pick(rng, SHAFTS);
    const G = mat.G * 1000;
    const ask = pick(rng, ["left", "left", "right", "rotation", "stress"] as const);
    const v = draw(
      () => {
        const [L, as] = pick(rng, SPAN_LOADS);
        return { L, a: pick(rng, as), M: pick(rng, [200, 300, 400, 500, 600, 800, 900, 1000, 1200, 1500, 2000]), d: pick(rng, [30, 40, 50, 60, 75, 80]) };
      },
      (v) => {
        const J = polarJ(v.d);
        const T1 = (v.M * (v.L - v.a)) / v.L;
        const T2 = (v.M * v.a) / v.L;
        const tau = (Math.max(T1, T2) * 1000 * (v.d / 2)) / J;
        const rot = deg((T1 * 1000 * v.a) / (G * J));
        return tau >= 5 && tau <= mat.tauCap && (ask !== "rotation" || (rot >= 0.05 && rot <= 10));
      },
      { L: 2000, a: 500, M: 600, d: 40 },
    );
    const { L, a, M, d } = v;
    const J = polarJ(d);
    const R0 = (M * (L - a)) / L; // |reaction| at z = 0 = internal torque in 0 < z < a
    const RL = (M * a) / L; // |reaction| at z = L
    const Lm = L / 1000;
    const am = a / 1000;
    const body = r`A uniform solid ${mat.name} shaft ($G = ${mat.G}\,\mathrm{GPa}$, diameter $d = ${d}\,\mathrm{mm}$) of length $L = ${show(Lm)}\,\mathrm{m}$ is built in at both ends, $z = 0$ and $z = L$. A point torque $M = ${M}\,\mathrm{N\cdot m}$ (right-handed about $+z$) is applied at $z = a = ${show(am)}\,\mathrm{m}$.`;
    const setup = [
      r`Let $T_0$ be the torque the wall applies to the shaft at $z = 0$ (positive about $+z$). Equilibrium gives only $T_0 + M + T_L = 0$ — one equation for two wall torques, so the shaft is statically indeterminate.`,
      r`Section cuts (keep the left part): $T(z) = -T_0$ for $0 < z < a$ and $T(z) = -T_0 - M$ for $a < z < L$. Compatibility: both ends are built in, so the total twist must vanish:`,
      r`$$\varphi(L) - \varphi(0) = \int_0^L \frac{T}{GJ}\,\mathrm{d}z = \frac{-T_0\,a + (-T_0 - M)(L - a)}{GJ} = 0 \;\Rightarrow\; T_0 = -M\Big(1 - \frac{a}{L}\Big)$$`,
    ];
    const hint = "Two unknown wall torques but one equilibrium equation: treat one wall torque as known, find T(z) by section cuts, and require the total twist from z = 0 to z = L to vanish.";
    const tags = ["torsion", "indeterminate", "compatibility"];

    if (ask === "left" || ask === "right") {
      const left = ask === "left";
      const ans = left ? R0 : RL;
      return numeric("", {
        body,
        question: left
          ? r`What is the magnitude of the reaction torque exerted by the wall at $z = 0$, in N·m, to three significant figures?`
          : r`What is the magnitude of the reaction torque exerted by the wall at $z = L$, in N·m, to three significant figures?`,
        answer: clean(ans),
        tolerance: tol(ans, 0.01),
        suffix: "N·m",
        answerDisplay: r`${show(ans)}\,\mathrm{N\cdot m}`,
        hint,
        explanation: para(
          ...setup,
          left
            ? r`So $|T_0| = M(1 - a/L) = (${M})(1 - ${show(am)}/${show(Lm)}) = ${show(R0)}\,\mathrm{N\cdot m}$, opposite in sense to $M$ — the same result as the fixed–fixed axial bar, $R_1 = P(1 - a/L)$. ($GJ$ cancels; the nearer wall takes the larger share, and the far wall takes $Ma/L = ${show(RL)}\,\mathrm{N\cdot m}$.)`
            : r`Then $T_L = -M - T_0 = -Ma/L$, so $|T_L| = (${M})(${show(am)})/${show(Lm)} = ${show(RL)}\,\mathrm{N\cdot m}$, opposite in sense to $M$. ($GJ$ cancels; the wall at $z = 0$ takes $M(1 - a/L) = ${show(R0)}\,\mathrm{N\cdot m}$, and the two together balance $M$.)`,
        ),
        tags,
      });
    }

    if (ask === "rotation") {
      const phi = (R0 * 1000 * a) / (G * J); // rad
      const ans = deg(phi);
      return numeric("", {
        body,
        question: r`What is the rotation of the shaft at the loaded section, $\varphi(a)$, in degrees, to three significant figures?`,
        answer: clean(ans),
        tolerance: tol(ans, 0.0005),
        suffix: "°",
        answerDisplay: r`${show(ans)}^\circ`,
        hint: hint + " Then integrate the twist rate from the wall to the load.",
        explanation: para(
          ...setup,
          r`So the segment $0 < z < a$ carries $T_1 = -T_0 = M(L - a)/L = ${show(R0)}\,\mathrm{N\cdot m}$. With $J = \pi d^4/32 = ${show(J, 4)}\,\mathrm{mm}^4$ and $\varphi(0) = 0$:`,
          r`$$\varphi(a) = \frac{T_1\,a}{GJ} = \frac{Ma(L - a)}{L\,GJ} = \frac{(${show(R0 * 1000, 4)})(${a})}{(${show(G)})(${show(J, 4)})} = ${show(phi, 4)}\,\mathrm{rad} = ${show(ans)}^\circ$$`,
        ),
        tags,
      });
    }

    const tau = (Math.max(R0, RL) * 1000 * (d / 2)) / J;
    return numeric("", {
      body,
      question: r`What is the maximum shear stress in the shaft, in MPa, to three significant figures?`,
      answer: clean(tau),
      tolerance: tol(tau, 0.01),
      suffix: "MPa",
      answerDisplay: r`${show(tau)}\,\mathrm{MPa}`,
      hint: hint + " The larger of the two segment torques gives the largest stress.",
      explanation: para(
        ...setup,
        r`So the segments carry $T_1 = M(L - a)/L = ${show(R0)}\,\mathrm{N\cdot m}$ ($0 < z < a$) and $T_2 = -Ma/L = ${show(-RL)}\,\mathrm{N\cdot m}$ ($a < z < L$). With $J = \pi d^4/32 = ${show(J, 4)}\,\mathrm{mm}^4$ and $c = ${show(d / 2)}\,\mathrm{mm}$:`,
        r`$$\tau_{\max} = \frac{|T|_{\max}\,c}{J} = \frac{(${show(Math.max(R0, RL) * 1000, 4)})(${show(d / 2)})}{${show(J, 4)}} = ${show(tau)}\,\mathrm{MPa}$$`,
      ),
      tags,
    });
  },
});

/* ------------------------------------------------------------------ */
/* Unit sm7 — beams                                                     */
/* ------------------------------------------------------------------ */

const I_UNIT = r`$\times 10^{6}\ \mathrm{mm}^4$`;
const inIRange = (I: number) => I >= 0.2e6 && I <= 2000e6;

define({
  id: "gen.sm.second-moment",
  unitId: "sm7",
  title: "Second moment of area of a cross-section",
  make: (_seed, rng) => {
    const variant = pick(rng, ["rect", "rect", "flat", "box", "circle", "tube"] as const);
    let I: number;
    let body: string;
    let work: string[];
    let hint: string;
    switch (variant) {
      case "rect":
      case "flat": {
        const flat = variant === "flat";
        const { b, h } = draw(
          () => ({ b: pick(rng, [20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200]), h: pick(rng, [60, 80, 100, 120, 150, 180, 200, 250, 300, 400]) }),
          (v) => v.h > v.b && inIRange(flat ? (v.h * v.b ** 3) / 12 : (v.b * v.h ** 3) / 12),
          { b: 50, h: 120 },
        );
        if (!flat) {
          I = (b * h ** 3) / 12;
          body = r`A solid rectangular beam section is $b = ${b}\,\mathrm{mm}$ wide and $h = ${h}\,\mathrm{mm}$ deep. Bending is about the horizontal centroidal axis.`;
          work = [r`$$I = \int_A y^2\,\mathrm{d}A = \frac{bh^3}{12} = \frac{(${b})(${h})^3}{12} = ${show(I, 4)}\,\mathrm{mm}^4$$`];
          hint = "Integrate y² over the section with y measured from the centroid; for a rectangle it is the width times the depth cubed, over 12.";
        } else {
          I = (h * b ** 3) / 12;
          body = r`A plank measuring $${b}\,\mathrm{mm} \times ${h}\,\mathrm{mm}$ is laid **flat**: it is now $${h}\,\mathrm{mm}$ wide and only $${b}\,\mathrm{mm}$ deep. Bending is about the horizontal centroidal axis.`;
          work = [
            r`Now the width is $${h}\,\mathrm{mm}$ and the depth is $${b}\,\mathrm{mm}$ — the depth is what gets cubed:`,
            r`$$I = \frac{(\text{width})(\text{depth})^3}{12} = \frac{(${h})(${b})^3}{12} = ${show(I, 4)}\,\mathrm{mm}^4$$`,
            r`On edge it would be $(${b})(${h})^3/12 = ${show((b * h ** 3) / 12, 4)}\,\mathrm{mm}^4$ — $${show((h / b) ** 2)}$ times stiffer.`,
          ];
          hint = "Which dimension is the depth (perpendicular to the bending axis) now? That is the one that gets cubed.";
        }
        break;
      }
      case "box": {
        const { B, H, t } = draw(
          () => ({ B: pick(rng, [60, 80, 100, 120, 150, 200]), H: pick(rng, [100, 120, 150, 200, 250, 300]), t: pick(rng, [5, 6, 8, 10, 12, 15, 20]) }),
          (v) => v.H >= v.B && v.t <= v.B / 5 && inIRange((v.B * v.H ** 3 - (v.B - 2 * v.t) * (v.H - 2 * v.t) ** 3) / 12),
          { B: 100, H: 200, t: 10 },
        );
        const bi = B - 2 * t;
        const hi = H - 2 * t;
        I = (B * H ** 3 - bi * hi ** 3) / 12;
        body = r`A rectangular box (hollow) section is $${B}\,\mathrm{mm}$ wide and $${H}\,\mathrm{mm}$ deep overall, with a uniform wall thickness of $${t}\,\mathrm{mm}$. Bending is about the horizontal centroidal axis.`;
        work = [
          r`Outer rectangle minus the hole ($${bi}\,\mathrm{mm} \times ${hi}\,\mathrm{mm}$); both share the same centroid:`,
          r`$$I = \frac{BH^3}{12} - \frac{b_ih_i^3}{12} = \frac{(${B})(${H})^3 - (${bi})(${hi})^3}{12} = ${show(I, 4)}\,\mathrm{mm}^4$$`,
        ];
        hint = "Treat the box as the full outer rectangle minus the inner hole; both have the same centroidal axis, so their I values simply subtract.";
        break;
      }
      case "circle": {
        const d = draw(
          () => pick(rng, [50, 60, 75, 80, 100, 120, 150, 200, 250, 300]),
          (x) => inIRange((Math.PI * x ** 4) / 64),
          100,
        );
        I = (Math.PI * d ** 4) / 64;
        body = r`A solid circular section has diameter $d = ${d}\,\mathrm{mm}$.`;
        work = [r`$$I = \frac{\pi R^4}{4} = \frac{\pi d^4}{64} = \frac{\pi(${d})^4}{64} = ${show(I, 4)}\,\mathrm{mm}^4$$`, r`(Half the polar moment $J = \pi d^4/32$, since $J = I_y + I_z$.)`];
        hint = "For a circle the second moment about a diameter is half the polar moment of inertia.";
        break;
      }
      default: {
        const { dOut, t } = draw(
          () => ({ dOut: pick(rng, [60, 75, 80, 100, 120, 150, 200, 250, 300]), t: pick(rng, [4, 5, 6, 8, 10, 12, 15, 20]) }),
          (v) => v.dOut - 2 * v.t >= 0.5 * v.dOut && inIRange((Math.PI * (v.dOut ** 4 - (v.dOut - 2 * v.t) ** 4)) / 64),
          { dOut: 100, t: 10 },
        );
        const dIn = dOut - 2 * t;
        I = (Math.PI * (dOut ** 4 - dIn ** 4)) / 64;
        body = r`A circular tube has outer diameter $${dOut}\,\mathrm{mm}$ and wall thickness $${t}\,\mathrm{mm}$.`;
        work = [
          r`Inner diameter $d_i = ${dOut} - 2(${t}) = ${dIn}\,\mathrm{mm}$; subtract the hole:`,
          r`$$I = \frac{\pi(d_o^4 - d_i^4)}{64} = \frac{\pi(${show(dOut ** 4)} - ${show(dIn ** 4)})}{64} = ${show(I, 4)}\,\mathrm{mm}^4$$`,
        ];
        hint = "Full circle minus the hole: both are centred on the same axis, so their second moments subtract.";
      }
    }
    const ans = I / 1e6;
    return numeric("", {
      body,
      question: r`What is the second moment of area $I$ about the horizontal centroidal (neutral) axis, in units of $10^{6}\,\mathrm{mm}^4$, to three significant figures?`,
      answer: clean(ans),
      tolerance: tol(ans, 0.001),
      suffix: I_UNIT,
      answerDisplay: r`${show(ans)}\times 10^{6}\,\mathrm{mm}^4`,
      hint,
      explanation: para(...work, r`In the requested units: $I = ${show(ans)}\times 10^{6}\,\mathrm{mm}^4$.`),
      tags: ["beams", "second-moment"],
    });
  },
});

define({
  id: "gen.sm.parallel-axis",
  unitId: "sm7",
  title: "Parallel-axis theorem",
  make: (_seed, rng) => {
    const variant = pick(rng, ["offset", "offset", "base", "pair"] as const);
    const tags = ["beams", "second-moment", "parallel-axis"];
    const question = (axis: string) => r`What is the second moment of area about ${axis}, in units of $10^{6}\,\mathrm{mm}^4$, to three significant figures?`;
    const hint = "Parallel-axis theorem: the second moment about any axis is the centroidal value plus the area times the square of the distance between the axes.";

    if (variant === "offset") {
      const { b, h, d } = draw(
        () => ({
          b: pick(rng, [20, 30, 40, 50, 60, 80, 100, 120, 150, 200]),
          h: pick(rng, [10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100]),
          d: pick(rng, [30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250]),
        }),
        (v) => v.d >= v.h / 2 && inIRange((v.b * v.h ** 3) / 12 + v.b * v.h * v.d ** 2),
        { b: 200, h: 20, d: 110 },
      );
      const Ic = (b * h ** 3) / 12;
      const Ad2 = b * h * d ** 2;
      const I = Ic + Ad2;
      return numeric("", {
        body: r`A rectangle $b = ${b}\,\mathrm{mm}$ wide and $h = ${h}\,\mathrm{mm}$ tall (for example a flange plate) has its centroid a distance $d = ${d}\,\mathrm{mm}$ from a horizontal axis $z'$ that is parallel to the rectangle's own horizontal centroidal axis.`,
        question: question(r`the axis $z'$`),
        answer: clean(I / 1e6),
        tolerance: tol(I / 1e6, 0.001),
        suffix: I_UNIT,
        answerDisplay: r`${show(I / 1e6)}\times 10^{6}\,\mathrm{mm}^4`,
        hint,
        explanation: para(
          r`Parallel-axis theorem: $I_{z'} = I_c + Ad^2$, with $I_c = bh^3/12$ about the rectangle's own centroid and $A = bh = ${b * h}\,\mathrm{mm}^2$.`,
          r`$$I_{z'} = \frac{(${b})(${h})^3}{12} + (${b * h})(${d})^2 = ${show(Ic, 4)} + ${show(Ad2, 4)} = ${show(I, 4)}\,\mathrm{mm}^4 = ${show(I / 1e6)}\times 10^{6}\,\mathrm{mm}^4$$`,
          Ad2 > 5 * Ic && r`The $Ad^2$ term dominates: area far from the axis is what makes $I$ large — the idea behind I-beams.`,
        ),
        tags,
      });
    }

    if (variant === "base") {
      const { b, h } = draw(
        () => ({ b: pick(rng, [20, 30, 40, 50, 60, 80, 100, 120, 150]), h: pick(rng, [40, 50, 60, 80, 100, 120, 150, 200, 250, 300]) }),
        (v) => inIRange((v.b * v.h ** 3) / 3),
        { b: 50, h: 120 },
      );
      const Ic = (b * h ** 3) / 12;
      const I = (b * h ** 3) / 3;
      return numeric("", {
        body: r`A rectangle $b = ${b}\,\mathrm{mm}$ wide and $h = ${h}\,\mathrm{mm}$ tall sits with its base on a horizontal axis $z'$.`,
        question: question(r`the base axis $z'$`),
        answer: clean(I / 1e6),
        tolerance: tol(I / 1e6, 0.001),
        suffix: I_UNIT,
        answerDisplay: r`${show(I / 1e6)}\times 10^{6}\,\mathrm{mm}^4`,
        hint: hint + " How far is the rectangle's centroid from its base?",
        explanation: para(
          r`The centroid is $d = h/2 = ${show(h / 2)}\,\mathrm{mm}$ above the base, so $I_{z'} = I_c + Ad^2 = bh^3/12 + bh(h/2)^2 = bh^3/3$:`,
          r`$$I_{z'} = ${show(Ic, 4)} + (${b * h})(${show(h / 2)})^2 = \frac{(${b})(${h})^3}{3} = ${show(I, 4)}\,\mathrm{mm}^4 = ${show(I / 1e6)}\times 10^{6}\,\mathrm{mm}^4$$`,
          r`Four times the centroidal value — the centroidal axis always gives the smallest $I$ of all parallel axes.`,
        ),
        tags,
      });
    }

    const { b, tp, d } = draw(
      () => ({ b: pick(rng, [100, 120, 150, 200, 250, 300]), tp: pick(rng, [10, 12, 15, 20, 25]), d: pick(rng, [50, 60, 75, 80, 100, 120, 150, 200]) }),
      (v) => v.d >= 2 * v.tp && inIRange(2 * ((v.b * v.tp ** 3) / 12 + v.b * v.tp * v.d ** 2)),
      { b: 200, tp: 20, d: 110 },
    );
    const Ic = (b * tp ** 3) / 12;
    const Ad2 = b * tp * d ** 2;
    const I = 2 * (Ic + Ad2);
    return numeric("", {
      body: r`Two identical flange plates, each $${b}\,\mathrm{mm}$ wide and $${tp}\,\mathrm{mm}$ thick, are placed symmetrically with their centroids at $y = \pm ${d}\,\mathrm{mm}$ from the neutral axis (ignore the web that joins them).`,
      question: question("the neutral axis"),
      answer: clean(I / 1e6),
      tolerance: tol(I / 1e6, 0.001),
      suffix: I_UNIT,
      answerDisplay: r`${show(I / 1e6)}\times 10^{6}\,\mathrm{mm}^4`,
      hint: hint + " Treat each plate separately and add.",
      explanation: para(
        r`Each plate: $I_c = bt^3/12 = (${b})(${tp})^3/12 = ${show(Ic, 4)}\,\mathrm{mm}^4$ and $Ad^2 = (${b * tp})(${d})^2 = ${show(Ad2, 4)}\,\mathrm{mm}^4$.`,
        r`$$I = 2\,(I_c + Ad^2) = 2\,(${show(Ic, 4)} + ${show(Ad2, 4)}) = ${show(I, 4)}\,\mathrm{mm}^4 = ${show(I / 1e6)}\times 10^{6}\,\mathrm{mm}^4$$`,
        `Almost all of it comes from the Ad² terms: the plates' own centroidal I is only ${sig((100 * 2 * Ic) / I, 2)} % of the total.`,
      ),
      tags,
    });
  },
});

define({
  id: "gen.sm.neutral-axis",
  unitId: "sm7",
  title: "Neutral axis (centroid) of a T-section",
  make: (_seed, rng) => {
    const inverted = rng() < 0.4;
    const ask = pick(rng, ["yb", "yb", "I"] as const);
    type Tee = { bf: number; tf: number; tw: number; hw: number };
    const props = (s: Tee) => {
      const Af = s.bf * s.tf;
      const Aw = s.tw * s.hw;
      const yf = inverted ? s.tf / 2 : s.hw + s.tf / 2;
      const yw = inverted ? s.tf + s.hw / 2 : s.hw / 2;
      const yna = (Af * yf + Aw * yw) / (Af + Aw);
      const If = (s.bf * s.tf ** 3) / 12;
      const Iw = (s.tw * s.hw ** 3) / 12;
      const Afd = Af * (yf - yna) ** 2;
      const Awd = Aw * (yw - yna) ** 2;
      return { Af, Aw, yf, yw, yna, If, Iw, Afd, Awd, I: If + Afd + Iw + Awd };
    };
    const s = draw<Tee>(
      () => ({
        bf: pick(rng, [80, 100, 120, 150, 160, 200, 240, 250, 300]),
        tf: pick(rng, [10, 12, 15, 16, 20, 24, 25, 30]),
        tw: pick(rng, [8, 10, 12, 15, 16, 20, 25]),
        hw: pick(rng, [80, 100, 120, 150, 160, 180, 200, 240, 250]),
      }),
      (v) => v.tw <= v.bf / 3 && v.tf <= v.hw / 3 && inIRange(props(v).I),
      { bf: 200, tf: 20, tw: 20, hw: 100 },
    );
    const p = props(s);
    const H = s.tf + s.hw;
    const body = inverted
      ? r`An inverted T-section has its flange at the **bottom**: a flange $b_f = ${s.bf}\,\mathrm{mm}$ wide and $t_f = ${s.tf}\,\mathrm{mm}$ thick, with a web $t_w = ${s.tw}\,\mathrm{mm}$ thick and $h_w = ${s.hw}\,\mathrm{mm}$ tall standing on it (total depth $${H}\,\mathrm{mm}$). The beam is made of one material.`
      : r`A T-section has a flange $b_f = ${s.bf}\,\mathrm{mm}$ wide and $t_f = ${s.tf}\,\mathrm{mm}$ thick on **top** of a web $t_w = ${s.tw}\,\mathrm{mm}$ thick and $h_w = ${s.hw}\,\mathrm{mm}$ tall (total depth $${H}\,\mathrm{mm}$). The beam is made of one material.`;
    const centroid = [
      r`One material, so the neutral axis passes through the centroid: $y_{NA} = \sum A_i\bar y_i/\sum A_i$, with $\bar y$ measured up from the bottom.`,
      [
        r`- flange: $A_f = (${s.bf})(${s.tf}) = ${p.Af}\,\mathrm{mm}^2$, $\bar y_f = ${inverted ? r`t_f/2` : r`h_w + t_f/2`} = ${show(p.yf)}\,\mathrm{mm}$`,
        r`- web: $A_w = (${s.tw})(${s.hw}) = ${p.Aw}\,\mathrm{mm}^2$, $\bar y_w = ${inverted ? r`t_f + h_w/2` : r`h_w/2`} = ${show(p.yw)}\,\mathrm{mm}$`,
      ].join("\n"),
      r`$$y_{NA} = \frac{A_f\bar y_f + A_w\bar y_w}{A_f + A_w} = \frac{(${p.Af})(${show(p.yf)}) + (${p.Aw})(${show(p.yw)})}{${p.Af + p.Aw}} = ${show(p.yna, 4)}\,\mathrm{mm}$$`,
    ];

    if (ask === "yb") {
      return numeric("", {
        body,
        question: r`How far above the bottom of the section is the neutral axis, in mm, to three significant figures?`,
        answer: clean(p.yna),
        tolerance: tol(p.yna, 0.01),
        suffix: "mm",
        answerDisplay: r`${show(p.yna)}\,\mathrm{mm}`,
        hint: "Split the section into two rectangles, locate each one's centroid from the bottom, and take the area-weighted average.",
        explanation: para(
          ...centroid,
          r`The neutral axis is pulled towards the wide flange (${inverted ? "at the bottom" : "at the top"}); the extreme fibre is $${show(Math.max(p.yna, H - p.yna), 4)}\,\mathrm{mm}$ away from it, at the ${p.yna > H - p.yna ? "bottom" : "top"}.`,
        ),
        tags: ["beams", "neutral-axis", "centroid"],
      });
    }

    const ans = p.I / 1e6;
    return numeric("", {
      body,
      question: r`What is the second moment of area of the section about its neutral axis, in units of $10^{6}\,\mathrm{mm}^4$, to three significant figures?`,
      answer: clean(ans),
      tolerance: tol(ans, 0.001),
      suffix: I_UNIT,
      answerDisplay: r`${show(ans)}\times 10^{6}\,\mathrm{mm}^4`,
      hint: "Locate the neutral axis first (area-weighted centroid). Then add each rectangle's own bh³/12 plus its area times the squared distance from its centroid to the neutral axis.",
      explanation: para(
        ...centroid,
        r`Parallel-axis theorem for each rectangle about the neutral axis:`,
        r`$$I = \frac{b_ft_f^3}{12} + A_f(\bar y_f - y_{NA})^2 + \frac{t_wh_w^3}{12} + A_w(\bar y_w - y_{NA})^2 = ${show(p.If, 4)} + ${show(p.Afd, 4)} + ${show(p.Iw, 4)} + ${show(p.Awd, 4)} = ${show(p.I, 4)}\,\mathrm{mm}^4$$`,
        r`So $I = ${show(ans)}\times 10^{6}\,\mathrm{mm}^4$.`,
      ),
      tags: ["beams", "neutral-axis", "second-moment"],
    });
  },
});

const MOMENTS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80];
const WIDTHS = [40, 50, 60, 75, 80, 100, 120, 150, 200];
const DEPTHS = [100, 120, 150, 180, 200, 240, 250, 300, 400];
const HEIGHTS = [10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 80, 100, 120, 150];
const MOMENT_CONVENTION = r`(course convention $M = -\int_A y\,\sigma_{xx}\,\mathrm{d}A$: positive $M$ is sagging and compresses the top)`;

define({
  id: "gen.sm.bending-stress",
  unitId: "sm7",
  title: "Bending stress in a rectangular beam",
  make: (_seed, rng) => {
    const ask = pick(rng, ["max", "at-y", "at-y", "allow"] as const);
    const tags = ["beams", "bending-stress"];

    if (ask === "allow") {
      const mat = pick(rng, [
        { name: "timber", sa: [8, 10, 12, 15] },
        { name: "steel", sa: [120, 150, 165, 200] },
        { name: "aluminium", sa: [80, 100, 120] },
      ]);
      const sa = pick(rng, mat.sa);
      const { b, h } = draw(
        () => ({ b: pick(rng, WIDTHS), h: pick(rng, DEPTHS) }),
        (v) => v.h >= v.b && (sa * v.b * v.h ** 2) / 6 / 1e6 >= 0.5 && (sa * v.b * v.h ** 2) / 6 / 1e6 <= 2000,
        { b: 100, h: 200 },
      );
      const S = (b * h ** 2) / 6;
      const Mn = sa * S; // N·mm
      const ans = Mn / 1e6; // kN·m
      return numeric("", {
        body: r`${art(mat.name, true)} ${mat.name} beam has a solid rectangular section $b = ${b}\,\mathrm{mm}$ wide and $h = ${h}\,\mathrm{mm}$ deep, bent about its horizontal centroidal axis. The allowable bending stress (tension or compression) is $\sigma_{\text{allow}} = ${sa}\,\mathrm{MPa}$.`,
        question: r`What is the largest bending-moment magnitude the section can carry, in kN·m, to three significant figures?`,
        answer: clean(ans),
        tolerance: tol(ans, 0.005),
        suffix: "kN·m",
        answerDisplay: r`${show(ans)}\,\mathrm{kN\cdot m}`,
        hint: "The largest stress is at the extreme fibre, |σ|max = |M|c/I. Set it equal to the allowable stress and solve for M (watch the N·mm → kN·m conversion).",
        explanation: para(
          r`Section modulus: $S = I/c = (bh^3/12)/(h/2) = bh^2/6 = (${b})(${h})^2/6 = ${show(S, 4)}\,\mathrm{mm}^3$.`,
          r`$$|M|_{\text{allow}} = \sigma_{\text{allow}}\,S = (${sa}\,\mathrm{MPa})(${show(S, 4)}\,\mathrm{mm}^3) = ${show(Mn, 4)}\,\mathrm{N\cdot mm} = ${show(ans)}\,\mathrm{kN\cdot m}$$`,
        ),
        tags: [...tags, "design"],
      });
    }

    const sgnM = rng() < 0.65 ? 1 : -1;
    const v = draw(
      () => ({ b: pick(rng, WIDTHS), h: pick(rng, DEPTHS), M: pick(rng, MOMENTS), y: pick(rng, HEIGHTS) * (rng() < 0.5 ? 1 : -1) }),
      (v) => {
        const smax = (6 * v.M * 1e6) / (v.b * v.h ** 2);
        const sy = (v.M * 1e6 * Math.abs(v.y)) / ((v.b * v.h ** 3) / 12);
        return v.h >= v.b && smax >= 5 && smax <= 200 && Math.abs(v.y) <= v.h / 2 && sy >= 1;
      },
      { b: 50, h: 120, M: 6, y: 30 },
    );
    const { b, h, M, y } = v;
    const Mk = sgnM * M; // kN·m
    const Mn = Mk * 1e6; // N·mm
    const I = (b * h ** 3) / 12;
    const body = r`A rectangular beam section is $b = ${b}\,\mathrm{mm}$ wide and $h = ${h}\,\mathrm{mm}$ deep. At the section of interest the bending moment is $M = ${Mk}\,\mathrm{kN\cdot m}$ ${MOMENT_CONVENTION}.`;

    if (ask === "max") {
      const smax = (6 * Math.abs(Mn)) / (b * h ** 2);
      return numeric("", {
        body,
        question: r`What is the largest magnitude of bending stress on the section, $|\sigma_{xx}|_{\max}$, in MPa, to three significant figures?`,
        answer: clean(smax),
        tolerance: tol(smax, 0.01),
        suffix: "MPa",
        answerDisplay: r`${show(smax)}\,\mathrm{MPa}`,
        hint: "The bending stress is linear in y and largest at the fibres farthest from the neutral axis (mid-depth for a rectangle). Work in N·mm and mm.",
        explanation: para(
          r`$I = bh^3/12 = (${b})(${h})^3/12 = ${show(I, 4)}\,\mathrm{mm}^4$, and the extreme fibres are at $c = h/2 = ${show(h / 2)}\,\mathrm{mm}$.`,
          r`$$|\sigma_{xx}|_{\max} = \frac{|M|\,c}{I} = \frac{6|M|}{bh^2} = \frac{6(${show(Math.abs(Mn))}\,\mathrm{N\cdot mm})}{(${b})(${h})^2} = ${show(smax)}\,\mathrm{MPa}$$`,
          sgnM > 0
            ? "Sagging moment: the top fibre is in compression and the bottom fibre in tension, both with this magnitude."
            : "Hogging (negative) moment: the top fibre is in tension and the bottom fibre in compression, both with this magnitude.",
        ),
        tags,
      });
    }

    const s = (-Mn * y) / I;
    const ys = y > 0 ? `+${y}` : `${y}`;
    return numeric("", {
      body,
      question: r`What is the bending stress $\sigma_{xx}$ at $y = ${ys}\,\mathrm{mm}$ (measured up from the neutral axis), in MPa, to three significant figures? Tension is positive.`,
      answer: clean(s),
      tolerance: tol(s, 0.01),
      suffix: "MPa",
      answerDisplay: r`${show(s)}\,\mathrm{MPa}`,
      hint: "Use the flexure formula with its minus sign; y is positive above the neutral axis, which is at mid-depth for a rectangle. Decide whether that fibre is squeezed or stretched.",
      explanation: para(
        r`$I = bh^3/12 = (${b})(${h})^3/12 = ${show(I, 4)}\,\mathrm{mm}^4$. The neutral axis is at mid-depth, so $y = ${ys}\,\mathrm{mm}$ lies ${y > 0 ? "above" : "below"} it.`,
        r`$$\sigma_{xx} = -\frac{My}{I} = -\frac{(${show(Mn)}\,\mathrm{N\cdot mm})(${y}\,\mathrm{mm})}{${show(I, 4)}\,\mathrm{mm}^4} = ${show(s)}\,\mathrm{MPa}$$`,
        r`${sgnM > 0 ? "Positive (sagging)" : "Negative (hogging)"} $M$ at a point ${y > 0 ? "above" : "below"} the neutral axis gives ${s < 0 ? "compression" : "tension"}.`,
      ),
      tags,
    });
  },
});

define({
  id: "gen.sm.curvature",
  unitId: "sm7",
  title: "Curvature, radius of curvature and bending strain",
  make: (_seed, rng) => {
    const mat = pick(rng, [
      { name: "steel", E: 200, cap: 200 },
      { name: "aluminium", E: 70, cap: 150 },
      { name: "timber", E: 14, cap: 20 },
    ]);
    const ask = pick(rng, ["kappa", "rho", "strain", "gauge"] as const);
    const E = mat.E * 1000; // MPa
    const tags = ["beams", "curvature", "bending-strain"];

    if (ask === "gauge") {
      const v = draw(
        () => {
          const h = pick(rng, DEPTHS);
          const where = pick(rng, ["top", "bottom", "inside"] as const);
          const yg = where === "top" ? h / 2 : where === "bottom" ? -h / 2 : pick(rng, HEIGHTS) * (rng() < 0.5 ? 1 : -1);
          return { b: pick(rng, WIDTHS), h, yg, eg: pick(rng, [100, 150, 200, 250, 300, 400, 500, 600, 800]) * (rng() < 0.5 ? 1 : -1) };
        },
        (v) => {
          const k = Math.abs(v.eg * 1e-6) / Math.abs(v.yg);
          const sSurf = E * k * (v.h / 2);
          return v.h >= v.b && Math.abs(v.yg) <= v.h / 2 && Math.abs(v.yg) >= 10 && sSurf <= mat.cap && sSurf >= 0.1 * mat.cap;
        },
        { b: 100, h: 200, yg: 100, eg: -300 },
      );
      const { b, h, yg, eg } = v;
      const I = (b * h ** 3) / 12;
      const kappa = -(eg * 1e-6) / yg; // 1/mm
      const Mn = E * I * kappa; // N·mm
      const ans = Mn / 1e6; // kN·m
      const at = yg === h / 2 ? " (the top surface)" : yg === -h / 2 ? " (the bottom surface)" : "";
      return numeric("", {
        body: r`${art(mat.name, true)} ${mat.name} beam ($E = ${mat.E}\,\mathrm{GPa}$) has a solid rectangular section $b = ${b}\,\mathrm{mm}$ wide and $h = ${h}\,\mathrm{mm}$ deep, bent about its horizontal centroidal axis. A strain gauge bonded at $y = ${yg > 0 ? "+" : ""}${yg}\,\mathrm{mm}$${at} — measured up from the neutral axis — reads $\varepsilon_{xx} = ${eg}\times 10^{-6}$.`,
        question: r`What bending moment $M$ acts on the section, in kN·m, to three significant figures? Give its sign in the course convention (positive = sagging).`,
        answer: clean(ans),
        tolerance: tol(ans, 0.001),
        suffix: "kN·m",
        answerDisplay: r`${show(ans)}\,\mathrm{kN\cdot m}`,
        hint: "Bending strain is linear through the depth and zero on the neutral axis, with a minus sign: compression above the axis means positive curvature. Get the curvature from the gauge, then M = EIκ.",
        explanation: para(
          r`Kinematics: $\varepsilon_{xx} = -\kappa y$, so $\kappa = -\varepsilon_{xx}/y = -(${eg}\times 10^{-6})/(${yg}\,\mathrm{mm}) = ${show(kappa * 1e6, 4)}\times 10^{-6}\,\mathrm{mm}^{-1}$.`,
          r`With $I = bh^3/12 = ${show(I, 4)}\,\mathrm{mm}^4$:`,
          r`$$M = EI\kappa = (${show(E)}\,\mathrm{MPa})(${show(I, 4)}\,\mathrm{mm}^4)(${show(kappa * 1e6, 4)}\times 10^{-6}\,\mathrm{mm}^{-1}) = ${show(Mn, 4)}\,\mathrm{N\cdot mm} = ${show(ans)}\,\mathrm{kN\cdot m}$$`,
          ans > 0 ? "Positive: the beam is sagging (top fibres shortened)." : "Negative: the beam is hogging (top fibres stretched).",
        ),
        tags,
      });
    }

    const sgnM = rng() < 0.65 ? 1 : -1;
    const v = draw(
      () => ({ b: pick(rng, WIDTHS), h: pick(rng, DEPTHS), M: pick(rng, MOMENTS), y: pick(rng, HEIGHTS) * (rng() < 0.5 ? 1 : -1) }),
      (v) => {
        const sSurf = (6 * v.M * 1e6) / (v.b * v.h ** 2);
        const I = (v.b * v.h ** 3) / 12;
        const k = (v.M * 1e6) / (E * I);
        return v.h >= v.b && sSurf >= 0.25 * mat.cap && sSurf <= mat.cap && Math.abs(v.y) <= v.h / 2 && k * Math.abs(v.y) * 1e6 >= 50;
      },
      { b: 100, h: 200, M: mat.name === "timber" ? 5 : 30, y: 50 },
    );
    const { b, h, M, y } = v;
    const Mk = sgnM * M;
    const Mn = Mk * 1e6;
    const I = (b * h ** 3) / 12;
    const EI = E * I; // N·mm²
    const kappa = Mn / EI; // 1/mm
    const body = r`${art(mat.name, true)} ${mat.name} beam ($E = ${mat.E}\,\mathrm{GPa}$) has a solid rectangular section $b = ${b}\,\mathrm{mm}$ wide and $h = ${h}\,\mathrm{mm}$ deep, bent about its horizontal centroidal axis by a moment $M = ${Mk}\,\mathrm{kN\cdot m}$ (course convention: positive $M$ is sagging).`;
    const eiLine = r`$I = bh^3/12 = ${show(I, 4)}\,\mathrm{mm}^4$, so $EI = (${show(E)}\,\mathrm{MPa})(${show(I, 4)}\,\mathrm{mm}^4) = ${show(EI / 1e9, 4)}\times 10^{9}\,\mathrm{N\cdot mm^2}$.`;
    const kLine = r`$$\kappa = \frac{M}{EI} = \frac{${show(Mk)}\times 10^{6}\,\mathrm{N\cdot mm}}{${show(EI / 1e9, 4)}\times 10^{9}\,\mathrm{N\cdot mm^2}} = ${show(kappa * 1e6, 4)}\times 10^{-6}\,\mathrm{mm}^{-1}$$`;

    if (ask === "kappa") {
      const ans = kappa * 1e6;
      return numeric("", {
        body,
        question: r`What is the curvature $\kappa = \mathrm{d}^2v/\mathrm{d}x^2$, in units of $10^{-6}\,\mathrm{mm}^{-1}$, to three significant figures (with its sign)?`,
        answer: clean(ans),
        tolerance: tol(ans, 0.005),
        suffix: r`$\times 10^{-6}\ \mathrm{mm}^{-1}$`,
        answerDisplay: r`${show(ans)}\times 10^{-6}\,\mathrm{mm}^{-1}`,
        hint: "Moment and curvature are proportional through the bending stiffness EI. Keep N, mm and MPa together.",
        explanation: para(eiLine, kLine, sgnM > 0 ? "Positive: sagging, concave up." : "Negative: hogging, concave down."),
        tags,
      });
    }

    if (ask === "rho") {
      const rhoMm = EI / Math.abs(Mn);
      const ans = rhoMm / 1000;
      return numeric("", {
        body,
        question: r`What is the radius of curvature $\rho = 1/|\kappa|$ of the bent beam, in metres, to three significant figures?`,
        answer: clean(ans),
        tolerance: tol(ans, 0.005),
        suffix: "m",
        answerDisplay: r`${show(ans)}\,\mathrm{m}`,
        hint: "The curvature is M/(EI); the radius of curvature is its reciprocal. Watch the mm → m conversion.",
        explanation: para(
          eiLine,
          r`$$\rho = \frac{1}{|\kappa|} = \frac{EI}{|M|} = \frac{${show(EI / 1e9, 4)}\times 10^{9}\,\mathrm{N\cdot mm^2}}{${show(Math.abs(Mk))}\times 10^{6}\,\mathrm{N\cdot mm}} = ${show(rhoMm, 4)}\,\mathrm{mm} = ${show(ans)}\,\mathrm{m}$$`,
          "A huge radius compared with the depth — the small-deflection assumptions are well satisfied.",
        ),
        tags,
      });
    }

    const eps = -kappa * y * 1e6; // μ
    const ys = y > 0 ? `+${y}` : `${y}`;
    return numeric("", {
      body,
      question: r`What is the bending strain $\varepsilon_{xx}$ at $y = ${ys}\,\mathrm{mm}$ (measured up from the neutral axis), in micro-strain ($10^{-6}$), to three significant figures, with its sign?`,
      answer: clean(eps),
      tolerance: tol(eps, 0.5),
      suffix: "μ",
      answerDisplay: r`${show(eps)}\,\mu`,
      hint: "Find the curvature from M/(EI); the bending strain is linear in y with a minus sign (positive curvature shortens the fibres above the neutral axis).",
      explanation: para(
        eiLine,
        kLine,
        r`$$\varepsilon_{xx} = -\kappa y = -(${show(kappa * 1e6, 4)}\times 10^{-6}\,\mathrm{mm}^{-1})(${y}\,\mathrm{mm}) = ${show(eps, 4)}\times 10^{-6} = ${show(eps)}\,\mu$$`,
        eps < 0 ? "Negative: that fibre is shortened (compression)." : "Positive: that fibre is stretched (tension).",
      ),
      tags,
    });
  },
});

define({
  id: "gen.sm.max-moment",
  unitId: "sm7",
  title: "Maximum bending moment in standard beams",
  make: (_seed, rng) => {
    const variant = pick(rng, ["ss-point", "ss-udl", "cant-point", "cant-udl"] as const);
    const LOADS = [5, 6, 8, 10, 12, 15, 16, 20, 24, 25, 30, 36, 40, 50];
    const UDLS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
    const tags = ["beams", "bending-moment"];
    const question = r`What is the magnitude of the maximum bending moment in the beam, in kN·m, to three significant figures?`;
    const out = (M: number, body: string, hint: string, steps: string[]) =>
      numeric("", {
        body,
        question,
        answer: clean(M),
        tolerance: tol(M, 0.005),
        suffix: "kN·m",
        answerDisplay: r`${show(M)}\,\mathrm{kN\cdot m}`,
        hint,
        explanation: para(...steps),
        tags,
      });

    if (variant === "ss-point") {
      const L = pick(rng, [2, 3, 4, 5, 6, 8, 10]);
      const a = pick(rng, gridBetween(0, L, 0.5));
      const P = pick(rng, LOADS);
      const bb = clean(L - a);
      const RA = (P * bb) / L;
      const RB = (P * a) / L;
      const M = RA * a;
      return out(
        M,
        r`A simply supported beam (pin at A, $x = 0$; roller at B, $x = L$) of span $L = ${L}\,\mathrm{m}$ carries a downward point load $P = ${P}\,\mathrm{kN}$ at $x = a = ${a}\,\mathrm{m}$. Neglect self-weight.`,
        "Find the support reactions first, then write the moment from a section cut on each side of the load. Where is the moment largest?",
        [
          r`Reactions: moments about B give $R_A = P(L - a)/L = (${P})(${show(bb)})/${L} = ${show(RA)}\,\mathrm{kN}$, and $R_B = Pa/L = ${show(RB)}\,\mathrm{kN}$ (both upward).`,
          r`Cut at $x < a$ and keep the left part: $M(x) = R_A x$ (positive = sagging). It grows up to the load and then falls linearly to zero at B, so the maximum is under the load:`,
          r`$$M_{\max} = R_A\,a = \frac{Pab}{L} = \frac{(${P})(${a})(${show(bb)})}{${L}} = ${show(M)}\,\mathrm{kN\cdot m}$$`,
        ],
      );
    }

    if (variant === "ss-udl") {
      const L = pick(rng, [2, 3, 4, 5, 6, 8, 10]);
      const w = pick(rng, UDLS);
      const RA = (w * L) / 2;
      const M = (w * L ** 2) / 8;
      return out(
        M,
        r`A simply supported beam of span $L = ${L}\,\mathrm{m}$ carries a uniformly distributed downward load $w = ${w}\,\mathrm{kN/m}$ over its whole length.`,
        "Use symmetry for the reactions, write M(x) from a section cut, and find where it peaks (where V = 0).",
        [
          r`By symmetry $R_A = R_B = wL/2 = ${show(RA)}\,\mathrm{kN}$. A cut at $x$ (left part) gives $M(x) = R_A x - wx^2/2 = wx(L - x)/2$, a parabola that peaks at mid-span, where $V = 0$:`,
          r`$$M_{\max} = M(L/2) = \frac{wL^2}{8} = \frac{(${w})(${L})^2}{8} = ${show(M)}\,\mathrm{kN\cdot m}$$`,
        ],
      );
    }

    const L = pick(rng, [1, 1.5, 2, 2.5, 3, 4, 5]);
    if (variant === "cant-point") {
      const P = pick(rng, LOADS);
      const M = P * L;
      return out(
        M,
        r`A cantilever is built in at $x = 0$ and free at $x = L = ${L}\,\mathrm{m}$. It carries a downward point load $P = ${P}\,\mathrm{kN}$ at the free end.`,
        "Cut at x and keep the free part, so no reactions are needed. The load's lever arm about the cut is largest at the wall.",
        [
          r`Cut at $x$ and keep the free part $[x, L]$: moment balance about the cut gives $M(x) = -P(L - x) = P(x - L)$, negative (hogging) in the course convention $M = -\int_A y\sigma_{xx}\,\mathrm{d}A$.`,
          r`$$|M|_{\max} = |M(0)| = PL = (${P})(${L}) = ${show(M)}\,\mathrm{kN\cdot m}$$`,
          r`It occurs at the wall, where $M(0) = -PL = ${show(-M)}\,\mathrm{kN\cdot m}$ (top fibres in tension).`,
        ],
      );
    }

    const w = pick(rng, UDLS);
    const M = (w * L ** 2) / 2;
    return out(
      M,
      r`A cantilever is built in at $x = 0$ and free at $x = L = ${L}\,\mathrm{m}$. It carries a uniformly distributed downward load $w = ${w}\,\mathrm{kN/m}$ along its whole length.`,
      "Cut at x and keep the free part: replace the distributed load on it by its resultant acting at its centre.",
      [
        r`Cut at $x$ and keep the free part $[x, L]$: the load on it is $w(L - x)$, acting at $(L - x)/2$ from the cut, so $M(x) = -w(L - x)^2/2$ (hogging, negative in the course convention).`,
        r`$$|M|_{\max} = |M(0)| = \frac{wL^2}{2} = \frac{(${w})(${L})^2}{2} = ${show(M)}\,\mathrm{kN\cdot m}$$`,
        r`It occurs at the wall, where $M(0) = -wL^2/2 = ${show(-M)}\,\mathrm{kN\cdot m}$.`,
      ],
    );
  },
});

define({
  id: "gen.sm.shear-value",
  unitId: "sm7",
  title: "Shear force at a section (course sign convention)",
  make: (_seed, rng) => {
    const variant = pick(rng, ["point-left", "point-right", "point-left", "point-right", "udl", "cant-udl"] as const);
    const conv = r`Course sign convention: $V = \int_A \sigma_{xy}\,\mathrm{d}A$ on the cross-section with outward normal $+x$, with $\mathrm{d}V/\mathrm{d}x + q = 0$ and $q$ positive upward (the opposite of the Beer/Hibbeler convention).`;
    const tags = ["beams", "shear-force", "sign-convention"];
    const out = (V: number, x: number, body: string, hint: string, steps: string[]) =>
      numeric("", {
        body,
        question: r`What is the internal shear force $V$ at $x = ${x}\,\mathrm{m}$, in kN, to three significant figures? Use the course sign convention.`,
        answer: clean(V),
        tolerance: tol(V, 0.001),
        suffix: "kN",
        answerDisplay: r`${show(V)}\,\mathrm{kN}`,
        hint,
        explanation: para(...steps),
        tags,
      });

    if (variant === "point-left" || variant === "point-right") {
      const left = variant === "point-left";
      const L = pick(rng, [3, 4, 5, 6, 8, 10]);
      const a = pick(rng, gridBetween(0, L, 0.5));
      const P = pick(rng, [6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 25, 30, 36, 40, 45, 50, 60]);
      const x = pick(rng, left ? gridBetween(0, a, 0.25) : gridBetween(a, L, 0.25));
      const La = clean(L - a);
      const RA = (P * La) / L;
      const RB = (P * a) / L;
      const V = left ? -RA : RB;
      const reactions = r`Reactions (moments about B, then $\sum F_y = 0$): $R_A = P(L - a)/L = (${P})(${show(La)})/${L} = ${show(RA)}\,\mathrm{kN}$ and $R_B = Pa/L = (${P})(${a})/${L} = ${show(RB)}\,\mathrm{kN}$, both upward.`;
      return out(
        V,
        x,
        r`A simply supported beam AB (pin at A, $x = 0$; roller at B, $x = L$) of span $L = ${L}\,\mathrm{m}$ carries one downward point load $P = ${P}\,\mathrm{kN}$ at $x = a = ${a}\,\mathrm{m}$. ${conv} So on the left segment $V = -R_A$.`,
        r`Find $R_A$ and $R_B$ first. Then draw the free body of the piece to the left of the cut: the shear force $V$ on its cut face points in $+y$ when positive.`,
        left
          ? [
              reactions,
              r`The section $x = ${x}\,\mathrm{m}$ is left of the load. Free body of the part $[0, x]$: $R_A$ acts up at A, and on the cut face (outward normal $+x$) the internal shear $V$ acts in $+y$. $\sum F_y = 0$: $R_A + V = 0$, so`,
              r`$$V = -R_A = -\frac{P(L - a)}{L} = ${show(V)}\,\mathrm{kN}$$`,
              r`(Beer/Hibbeler would call this $+${show(RA)}\,\mathrm{kN}$; in this course the left segment of a simply supported beam has negative $V$. Past the load $V$ jumps by $+P$ to $+R_B = +${show(RB)}\,\mathrm{kN}$.)`,
            ]
          : [
              reactions,
              r`The section $x = ${x}\,\mathrm{m}$ is right of the load. Free body of $[0, x]$, which now contains the load: $R_A - P + V = 0$, so`,
              r`$$V = P - R_A = \frac{Pa}{L} = ${show(V)}\,\mathrm{kN} = +R_B$$`,
              r`Check with the right part $[x, L]$: its cut face has outward normal $-x$, so the internal shear acts on it as $-V$, and $\sum F_y = 0$ gives $-V + R_B = 0$ ✓. (Left of the load $V = -R_A = ${show(-RA)}\,\mathrm{kN}$; the downward load makes $V$ jump by $+P$.)`,
            ],
      );
    }

    if (variant === "udl") {
      const L = pick(rng, [2, 3, 4, 5, 6, 8, 10]);
      const w = pick(rng, [2, 3, 4, 5, 6, 8, 10, 12, 15, 20]);
      const x = pick(rng, gridBetween(0, L, 0.5).filter((z) => Math.abs(z - L / 2) > 1e-9));
      const RA = (w * L) / 2;
      const V = w * x - RA;
      return out(
        V,
        x,
        r`A simply supported beam (pin at $x = 0$, roller at $x = L$) of span $L = ${L}\,\mathrm{m}$ carries a uniformly distributed downward load $w = ${w}\,\mathrm{kN/m}$ over its whole length, so $q = -w$. ${conv}`,
        r`Use symmetry for the reactions. The piece left of the cut carries $R_A$, the load on its length $x$, and the internal shear $V$ (positive upward on its cut face).`,
        [
          r`By symmetry $R_A = R_B = wL/2 = (${w})(${L})/2 = ${show(RA)}\,\mathrm{kN}$ (upward).`,
          r`Free body of $[0, x]$: $R_A$ up, the load $wx$ down, and $V$ in $+y$ on the cut face (outward normal $+x$): $R_A - wx + V = 0$, so`,
          r`$$V(x) = wx - \frac{wL}{2} = (${w})(${x}) - ${show(RA)} = ${show(V)}\,\mathrm{kN}$$`,
          r`Check: $\mathrm{d}V/\mathrm{d}x = +w = -q$ ✓. $V$ runs from $-wL/2$ at the left support to $+wL/2$ at the right one and is zero at mid-span.`,
        ],
      );
    }

    const L = pick(rng, [1.5, 2, 2.5, 3, 4, 5]);
    const w = pick(rng, [2, 3, 4, 5, 6, 8, 10, 12, 15, 20]);
    const x = pick(rng, gridBetween(0, L, 0.5));
    const Lx = clean(L - x);
    const V = -w * Lx;
    return out(
      V,
      x,
      r`A cantilever is built in at $x = 0$ and free at $x = L = ${L}\,\mathrm{m}$. It carries a uniformly distributed downward load $w = ${w}\,\mathrm{kN/m}$ along its whole length. ${conv}`,
      r`Keep the free part to the right of the cut, so no reactions are needed. On its cut face the outward normal points in $-x$, so the internal shear acts on it as $-V$.`,
      [
        r`Keep the free part $[x, L]$. Its cut face has outward normal $-x$, so the internal shear force on it is $-V$ (in the $y$ direction); the load on it is $w(L - x)$ downward. $\sum F_y = 0$: $-V - w(L - x) = 0$, so`,
        r`$$V(x) = -w(L - x) = -(${w})(${show(Lx)}) = ${show(V)}\,\mathrm{kN}$$`,
        r`At the wall $V(0) = -wL = ${show(-w * L)}\,\mathrm{kN}$; check $\mathrm{d}V/\mathrm{d}x = +w = -q$ ✓.`,
      ],
    );
  },
});
