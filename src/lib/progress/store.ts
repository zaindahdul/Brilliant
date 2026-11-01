"use client";

/**
 * Client progress store: zustand + localStorage (instant, survives closing the
 * tab) + background sync to the local server file (survives clearing the
 * browser, works across browsers).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  completeLesson,
  mergeProgress,
  normalizeProgress,
  recordPracticeSession,
  recordProblemResult,
  recordStepAttempt,
  resetLesson,
  setLessonStep,
  startLesson,
  type LessonStats,
  type ProblemResultInput,
} from "./logic";
import { emptyProgress, type PracticeSummary, type ProgressState, type Settings, type StepAttempt } from "./types";

export const STORAGE_KEY = "nudge-progress-v1";

export type SyncStatus = "idle" | "saving" | "saved" | "offline" | "error";

interface ProgressStore {
  state: ProgressState;
  hydrated: boolean;
  sync: SyncStatus;
  lastSyncedAt: number | null;

  // mutations
  replace: (next: ProgressState) => void;
  mergeIn: (remote: ProgressState) => void;
  startLesson: (lessonId: string) => void;
  setLessonStep: (lessonId: string, stepIndex: number) => void;
  recordStepAttempt: (lessonId: string, stepId: string, attempt: StepAttempt) => void;
  recordProblemResult: (input: ProblemResultInput) => void;
  completeLesson: (lessonId: string, stats: LessonStats) => { xp: number; earnedCharge: boolean };
  resetLesson: (lessonId: string) => void;
  recordPracticeSession: (summary: Omit<PracticeSummary, "xp"> & { xp?: number }) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;

  _setHydrated: (v: boolean) => void;
  _setSync: (s: SyncStatus, at?: number) => void;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      state: emptyProgress(),
      hydrated: false,
      sync: "idle",
      lastSyncedAt: null,

      replace: (next) => set({ state: next }),
      mergeIn: (remote) => set({ state: mergeProgress(get().state, remote) }),
      startLesson: (lessonId) => set({ state: startLesson(get().state, lessonId) }),
      setLessonStep: (lessonId, idx) => set({ state: setLessonStep(get().state, lessonId, idx) }),
      recordStepAttempt: (lessonId, stepId, attempt) => set({ state: recordStepAttempt(get().state, lessonId, stepId, attempt) }),
      recordProblemResult: (input) => set({ state: recordProblemResult(get().state, input) }),
      completeLesson: (lessonId, stats) => {
        const res = completeLesson(get().state, lessonId, stats);
        set({ state: res.state });
        return { xp: res.xp, earnedCharge: res.earnedCharge };
      },
      resetLesson: (lessonId) => set({ state: resetLesson(get().state, lessonId) }),
      recordPracticeSession: (summary) => set({ state: recordPracticeSession(get().state, summary) }),
      updateSettings: (patch) => {
        const cur = get().state;
        set({ state: { ...cur, settings: { ...cur.settings, ...patch }, updatedAt: Date.now() } });
      },
      resetAll: () => set({ state: emptyProgress() }),

      _setHydrated: (v) => set({ hydrated: v }),
      _setSync: (s, at) => set({ sync: s, ...(at ? { lastSyncedAt: at } : {}) }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ state: s.state }),
      skipHydration: true,
      merge: (persisted, current) => {
        const p = persisted as { state?: unknown } | undefined;
        const normalized = p?.state ? normalizeProgress(p.state) : null;
        return { ...current, state: normalized ?? current.state };
      },
    },
  ),
);

/** Convenience selectors. */
export const useProgress = () => useProgressStore((s) => s.state);
export const useHydrated = () => useProgressStore((s) => s.hydrated);
