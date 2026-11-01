"use client";

import { useSyncExternalStore } from "react";
import { dayKey } from "./progress/logic";
import type { DayKey } from "./progress/types";

/**
 * Time, the hydration-safe way. The server/prerender snapshot has no time at
 * all (so static shells never bake in "today"); the client fills it in on
 * hydration and refreshes once a minute.
 */
export interface Clock {
  today: DayKey | null;
  now: number | null;
  hour: number | null;
  dateLabel: string | null;
}

const EMPTY: Clock = { today: null, now: null, hour: null, dateLabel: null };

let snapshot: Clock | null = null;
const listeners = new Set<() => void>();
let timer: number | null = null;

function compute(): Clock {
  const d = new Date();
  return {
    today: dayKey(d),
    now: d.getTime(),
    hour: d.getHours(),
    dateLabel: d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
  };
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (timer === null) {
    timer = window.setInterval(() => {
      snapshot = compute();
      listeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot(): Clock {
  snapshot ??= compute();
  return snapshot;
}

function getServerSnapshot(): Clock {
  return EMPTY;
}

export function useClock(): Clock {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
