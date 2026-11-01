/**
 * Exact rational arithmetic with small integers — enough for row reduction,
 * determinants and inverses of the matrices that show up in a first course.
 */
export interface Frac {
  n: number; // numerator (carries the sign)
  d: number; // denominator (> 0)
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function frac(n: number, d = 1): Frac {
  if (d === 0) throw new Error("division by zero");
  if (!Number.isInteger(n) || !Number.isInteger(d)) {
    // convert decimals with up to 6 places
    const scale = 1e6;
    n = Math.round(n * scale);
    d = Math.round(d * scale);
  }
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  const num = n / g;
  return { n: num === 0 ? 0 : num, d: d / g }; // never -0
}

export const ZERO: Frac = { n: 0, d: 1 };
export const ONE: Frac = { n: 1, d: 1 };

export function add(a: Frac, b: Frac): Frac {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d);
}
export function sub(a: Frac, b: Frac): Frac {
  return frac(a.n * b.d - b.n * a.d, a.d * b.d);
}
export function mul(a: Frac, b: Frac): Frac {
  return frac(a.n * b.n, a.d * b.d);
}
export function div(a: Frac, b: Frac): Frac {
  if (b.n === 0) throw new Error("division by zero");
  return frac(a.n * b.d, a.d * b.n);
}
export function neg(a: Frac): Frac {
  return { n: a.n === 0 ? 0 : -a.n, d: a.d };
}
export function isZero(a: Frac): boolean {
  return a.n === 0;
}
export function eq(a: Frac, b: Frac): boolean {
  return a.n === b.n && a.d === b.d;
}
export function toNumber(a: Frac): number {
  return a.n / a.d;
}
export function isInt(a: Frac): boolean {
  return a.d === 1;
}

/** "3/4", "-2", "0.5" -> Frac. Returns null when unparseable. */
export function parseFrac(s: string): Frac | null {
  const t = s.replace(/\s+/g, "");
  if (t === "") return null;
  const m = t.match(/^(-?\d+)\/(-?\d+)$/);
  if (m) {
    const d = Number(m[2]);
    if (d === 0) return null;
    return frac(Number(m[1]), d);
  }
  if (/^-?\d+$/.test(t)) return frac(Number(t));
  if (/^-?\d*\.\d+$/.test(t)) return frac(Number(t));
  return null;
}

export function toInput(v: number | string): Frac {
  if (typeof v === "number") return frac(v);
  const p = parseFrac(v);
  if (!p) throw new Error(`bad fraction literal: ${v}`);
  return p;
}

/** Plain text like "3/4" or "-2". */
export function fracToString(a: Frac): string {
  return a.d === 1 ? String(a.n) : `${a.n}/${a.d}`;
}

/** LaTeX like "-\tfrac{3}{4}". */
export function fracToLatex(a: Frac): string {
  if (a.d === 1) return String(a.n);
  const sign = a.n < 0 ? "-" : "";
  return `${sign}\\tfrac{${Math.abs(a.n)}}{${a.d}}`;
}

export type FracMatrix = Frac[][];

export function toFracMatrix(m: (number | string)[][]): FracMatrix {
  return m.map((row) => row.map(toInput));
}

export function fracMatrixToNumbers(m: FracMatrix): number[][] {
  return m.map((row) => row.map(toNumber));
}

export function fracMatrixToLatex(m: FracMatrix, augmented = false, rightColumns = 1): string {
  const cols = m[0]?.length ?? 0;
  const body = m.map((row) => row.map(fracToLatex).join("&")).join("\\\\");
  const right = Math.max(1, Math.min(rightColumns, cols - 1));
  if (augmented && cols > 1) {
    const spec = "c".repeat(cols - right) + "|" + "c".repeat(right);
    return `\\left[\\begin{array}{${spec}}${body}\\end{array}\\right]`;
  }
  return `\\begin{bmatrix}${body}\\end{bmatrix}`;
}
