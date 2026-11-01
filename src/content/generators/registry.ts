/**
 * Generator registry. Each generator produces a fresh, exactly-checked problem
 * from a seed, so practice sets never repeat and surface details change while
 * the underlying idea stays the same (the way Brilliant's practice does).
 *
 * Generator modules import `define` from here; `index.ts` imports the modules
 * so that every generator is registered before anything calls `generate`.
 */
import type { QuestionStep } from "../types";
import { rngFrom, type Rng } from "@/lib/random";

export interface Generator {
  id: string;
  unitId: string;
  title: string;
  make: (seed: number, rng: Rng) => QuestionStep;
}

export interface GeneratedProblem {
  key: string;
  unitId: string;
  step: QuestionStep;
}

const registry: Record<string, Generator> = {};

export function define(g: Generator) {
  if (registry[g.id]) throw new Error(`generator ${g.id} defined twice`);
  registry[g.id] = g;
}

export function generate(id: string, seed: number): GeneratedProblem | null {
  const g = registry[id];
  if (!g) return null;
  const key = `gen:${id}:${seed}`;
  const rng = rngFrom(key);
  const step = g.make(seed, rng);
  return { key, unitId: g.unitId, step: { ...step, id: key } };
}

export function hasGenerator(id: string): boolean {
  return id in registry;
}

export function parseGeneratedKey(key: string): { id: string; seed: number } | null {
  const m = key.match(/^gen:(.+):(\d+)$/);
  return m ? { id: m[1], seed: Number(m[2]) } : null;
}

export function listGenerators(): Generator[] {
  return Object.values(registry);
}
