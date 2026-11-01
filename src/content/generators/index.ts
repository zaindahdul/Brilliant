/**
 * Parameterised problem generators. Importing this module registers every
 * generator (one module per course); see `registry.ts` for the API.
 */
export { generate, hasGenerator, parseGeneratedKey, listGenerators, type Generator, type GeneratedProblem } from "./registry";
import "./linear-algebra";
import "./solid-mechanics";
