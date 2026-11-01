import { clsx, type ClassValue } from "clsx";

/** Tiny className combiner. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
