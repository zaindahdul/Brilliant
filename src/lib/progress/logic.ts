/**
 * Pure progress/streak/XP/spaced-review logic. No React, no storage —
 * everything here is unit-testable.
 */
import {
  LESSONS_PER_CHARGE,
  MAX_CHARGES,
  STREAK_PROBLEMS_PER_DAY,
  XP,
  type DayKey,
  type LessonProgress,
  type PracticeSummary,
  type ProblemStat,
  type ProgressState,
  type StepAttempt,
} from "./types";

/* ------------------------------------------------------------------ */
/* Days                                                                */
/* ------------------------------------------------------------------ */

export function dayKey(d: Date = new Date()): DayKey {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dayKeyFromTs(ts: number): DayKey {
  return dayKey(new Date(ts));
}

/** Whole days from a to b (b - a). */
export function dayDiff(a: DayKey, b: DayKey): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ta = Date.UTC(ay, am - 1, ad);
  const tb = Date.UTC(by, bm - 1, bd);
  return Math.round((tb - ta) / 86_400_000);
}

export function shiftDay(key: DayKey, days: number): DayKey {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function clone<T>(x: T): T {
  return structuredClone(x);
}

function touch(state: ProgressState, now: number) {
  state.updatedAt = now;
}

function addXp(state: ProgressState, amount: number, now: number) {
  const key = dayKeyFromTs(now);
  state.xpByDay[key] = (state.xpByDay[key] ?? 0) + amount;
}

function bumpActivity(state: ProgressState, now: number, field: "problems" | "lessons") {
  const key = dayKeyFromTs(now);
  const a = state.activity[key] ?? { problems: 0, lessons: 0 };
  a[field] += 1;
  state.activity[key] = a;
}

export function dayQualifies(state: ProgressState, key: DayKey): boolean {
  const a = state.activity[key];
  if (!a) return false;
  return a.problems >= STREAK_PROBLEMS_PER_DAY || a.lessons >= 1;
}

/**
 * Re-evaluate the streak after activity on `day`. Mirrors Brilliant's rule:
 * a day counts after 3 problems or 1 full lesson, and a missed day can be
 * covered automatically by a Streak Charge.
 */
export function updateStreak(state: ProgressState, day: DayKey) {
  const s = state.streak;
  if (!dayQualifies(state, day) || s.lastQualifyingDay === day) return;
  if (s.lastQualifyingDay === null) {
    s.current = 1;
  } else {
    const gap = dayDiff(s.lastQualifyingDay, day);
    if (gap <= 0) return; // activity recorded for an earlier day (clock skew) — ignore
    if (gap === 1) {
      s.current += 1;
    } else if (gap === 2 && s.charges > 0) {
      s.charges -= 1;
      s.usedChargeDays.push(shiftDay(s.lastQualifyingDay, 1));
      s.current += 1;
    } else {
      s.current = 1;
    }
  }
  s.lastQualifyingDay = day;
  s.longest = Math.max(s.longest, s.current);
}

export type StreakStatus = "done-today" | "at-risk" | "protected" | "broken" | "none";

/** What to display right now, without mutating anything. */
export function getStreakStatus(state: ProgressState, today: DayKey = dayKey()): { current: number; status: StreakStatus } {
  const s = state.streak;
  if (s.lastQualifyingDay === null || s.current === 0) return { current: 0, status: "none" };
  const gap = dayDiff(s.lastQualifyingDay, today);
  if (gap <= 0) return { current: s.current, status: "done-today" };
  if (gap === 1) return { current: s.current, status: "at-risk" };
  if (gap === 2 && s.charges > 0) return { current: s.current, status: "protected" };
  return { current: 0, status: "broken" };
}

/* ------------------------------------------------------------------ */
/* Spaced review                                                        */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;

function scheduleProblem(p: ProblemStat, correct: boolean, now: number) {
  if (correct) {
    const next = p.intervalDays === 0 ? 1 : p.intervalDays === 1 ? 3 : Math.min(60, Math.round(p.intervalDays * 2.2));
    p.intervalDays = next;
    p.dueAt = now + next * DAY;
  } else {
    p.intervalDays = 0;
    p.dueAt = now + DAY / 2; // show up again later today / tomorrow
  }
}

export interface ProblemResultInput {
  key: string;
  unitId: string;
  lessonId?: string;
  label?: string;
  tags?: string[];
  correct: boolean;
  /** Correct on the first try (only meaningful when correct). */
  firstTry: boolean;
  source: "lesson" | "practice" | "review";
  now?: number;
}

/** Record one problem outcome: stats, spaced schedule, XP, activity and streak. */
export function recordProblemResult(state: ProgressState, input: ProblemResultInput): ProgressState {
  const now = input.now ?? Date.now();
  const s = clone(state);
  const existing = s.problems[input.key];
  const p: ProblemStat = existing ?? {
    key: input.key,
    unitId: input.unitId,
    lessonId: input.lessonId,
    label: input.label,
    tags: input.tags,
    seen: 0,
    correct: 0,
    wrong: 0,
    lastResult: "wrong",
    lastAt: now,
    dueAt: now,
    intervalDays: 0,
    updatedAt: now,
  };
  p.seen += 1;
  if (input.correct) p.correct += 1;
  else p.wrong += 1;
  p.lastResult = input.correct ? "correct" : "wrong";
  p.lastAt = now;
  p.label = input.label ?? p.label;
  p.tags = input.tags ?? p.tags;
  p.lessonId = input.lessonId ?? p.lessonId;
  scheduleProblem(p, input.correct, now);
  p.updatedAt = now;
  s.problems[input.key] = p;

  let xp = 0;
  if (input.source === "lesson") xp = input.correct ? (input.firstTry ? XP.stepFirstTry : XP.stepSecondTry) : XP.stepRevealed;
  else if (input.source === "practice") xp = input.correct ? (input.firstTry ? XP.practiceFirstTry : XP.practiceEventually) : 0;
  else xp = input.correct ? XP.reviewFirstTry : 0;
  if (xp) addXp(s, xp, now);

  bumpActivity(s, now, "problems");
  updateStreak(s, dayKeyFromTs(now));
  touch(s, now);
  return s;
}

/* ------------------------------------------------------------------ */
/* Lessons                                                             */
/* ------------------------------------------------------------------ */

export function startLesson(state: ProgressState, lessonId: string, now = Date.now()): ProgressState {
  if (state.lessons[lessonId]) return state;
  const s = clone(state);
  s.lessons[lessonId] = {
    id: lessonId,
    status: "in-progress",
    stepIndex: 0,
    attempts: {},
    startedAt: now,
    timesCompleted: 0,
    updatedAt: now,
  };
  touch(s, now);
  return s;
}

export function setLessonStep(state: ProgressState, lessonId: string, stepIndex: number, now = Date.now()): ProgressState {
  const s = clone(state);
  const lp = s.lessons[lessonId] ?? startLesson(s, lessonId, now).lessons[lessonId];
  if (lp.stepIndex === stepIndex && s.lessons[lessonId]) return state;
  lp.stepIndex = stepIndex;
  lp.updatedAt = now;
  s.lessons[lessonId] = lp;
  touch(s, now);
  return s;
}

export function recordStepAttempt(state: ProgressState, lessonId: string, stepId: string, attempt: StepAttempt): ProgressState {
  const s = clone(state);
  const lp = s.lessons[lessonId] ?? startLesson(s, lessonId, attempt.at).lessons[lessonId];
  lp.attempts[stepId] = attempt;
  lp.updatedAt = attempt.at;
  s.lessons[lessonId] = lp;
  touch(s, attempt.at);
  return s;
}

export interface LessonStats {
  questions: number;
  firstTry: number;
  eventually: number;
}

export function lessonStats(lp: LessonProgress | undefined, questionIds: string[]): LessonStats {
  let firstTry = 0;
  let eventually = 0;
  for (const id of questionIds) {
    const a = lp?.attempts[id];
    if (!a) continue;
    if (a.correct) {
      eventually += 1;
      if (a.firstTry) firstTry += 1;
    }
  }
  return { questions: questionIds.length, firstTry, eventually };
}

/** Mark a lesson complete; awards XP, bumps activity/streak and charge progress. Returns xp earned. */
export function completeLesson(
  state: ProgressState,
  lessonId: string,
  stats: LessonStats,
  now = Date.now(),
): { state: ProgressState; xp: number; earnedCharge: boolean } {
  const s = clone(state);
  const lp = s.lessons[lessonId] ?? startLesson(s, lessonId, now).lessons[lessonId];
  const repeat = lp.timesCompleted > 0;
  lp.status = "completed";
  lp.completedAt = now;
  lp.timesCompleted += 1;
  lp.stepIndex = 0;
  const pct = stats.questions ? Math.round((100 * stats.firstTry) / stats.questions) : 100;
  lp.lastFirstTryPct = pct;
  lp.bestFirstTryPct = Math.max(lp.bestFirstTryPct ?? 0, pct);
  lp.updatedAt = now;
  s.lessons[lessonId] = lp;

  const xp = repeat ? XP.lessonRepeat : XP.lessonComplete;
  addXp(s, xp, now);
  bumpActivity(s, now, "lessons");

  let earnedCharge = false;
  if (!repeat) {
    s.streak.chargeProgress += 1;
    if (s.streak.chargeProgress >= LESSONS_PER_CHARGE) {
      s.streak.chargeProgress = 0;
      if (s.streak.charges < MAX_CHARGES) {
        s.streak.charges += 1;
        earnedCharge = true;
      }
    }
  }
  updateStreak(s, dayKeyFromTs(now));
  touch(s, now);
  return { state: s, xp, earnedCharge };
}

/** Restart a lesson from the top (keeps completion history). */
export function resetLesson(state: ProgressState, lessonId: string, now = Date.now()): ProgressState {
  const s = clone(state);
  const lp = s.lessons[lessonId];
  if (!lp) return state;
  lp.attempts = {};
  lp.stepIndex = 0;
  lp.status = "in-progress";
  lp.updatedAt = now;
  touch(s, now);
  return s;
}

/* ------------------------------------------------------------------ */
/* Practice sessions                                                    */
/* ------------------------------------------------------------------ */

export function recordPracticeSession(state: ProgressState, summary: Omit<PracticeSummary, "xp"> & { xp?: number }): ProgressState {
  const s = clone(state);
  const bonus = summary.total > 0 ? XP.practiceComplete : 0;
  const xp = (summary.xp ?? 0) + bonus;
  addXp(s, bonus, summary.at);
  s.sessions = [{ ...summary, xp }, ...s.sessions.filter((x) => x.id !== summary.id)].slice(0, 100);
  updateStreak(s, dayKeyFromTs(summary.at));
  touch(s, summary.at);
  return s;
}

/* ------------------------------------------------------------------ */
/* Derived views                                                        */
/* ------------------------------------------------------------------ */

export function xpTotal(state: ProgressState): number {
  return Object.values(state.xpByDay).reduce((a, b) => a + b, 0);
}

export function xpThisWeek(state: ProgressState, today: DayKey = dayKey()): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += state.xpByDay[shiftDay(today, -i)] ?? 0;
  return sum;
}

export function xpToday(state: ProgressState, today: DayKey = dayKey()): number {
  return state.xpByDay[today] ?? 0;
}

export function dueProblems(state: ProgressState, now = Date.now()): ProblemStat[] {
  return Object.values(state.problems)
    .filter((p) => p.dueAt <= now && (p.lastResult === "wrong" || p.intervalDays > 0))
    .sort((a, b) => a.dueAt - b.dueAt);
}

export function weakProblems(state: ProgressState, limit = 12): ProblemStat[] {
  return Object.values(state.problems)
    .filter((p) => p.wrong > 0)
    .sort((a, b) => b.wrong - b.correct - (a.wrong - a.correct) || b.lastAt - a.lastAt)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Merging (local ↔ server)                                             */
/* ------------------------------------------------------------------ */

/** Field-wise merge: newest record wins, counters take the max. */
export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const [older, newer] = a.updatedAt <= b.updatedAt ? [a, b] : [b, a];
  const out: ProgressState = clone(newer);
  out.createdAt = Math.min(a.createdAt, b.createdAt);

  for (const [id, lp] of Object.entries(older.lessons)) {
    const cur = out.lessons[id];
    if (!cur || lp.updatedAt > cur.updatedAt) out.lessons[id] = clone(lp);
  }
  for (const [key, p] of Object.entries(older.problems)) {
    const cur = out.problems[key];
    if (!cur || p.updatedAt > cur.updatedAt) out.problems[key] = clone(p);
  }
  for (const [day, xp] of Object.entries(older.xpByDay)) out.xpByDay[day] = Math.max(out.xpByDay[day] ?? 0, xp);
  for (const [day, act] of Object.entries(older.activity)) {
    const cur = out.activity[day] ?? { problems: 0, lessons: 0 };
    out.activity[day] = { problems: Math.max(cur.problems, act.problems), lessons: Math.max(cur.lessons, act.lessons) };
  }
  const seen = new Set(out.sessions.map((x) => x.id));
  for (const sess of older.sessions) if (!seen.has(sess.id)) out.sessions.push(sess);
  out.sessions.sort((x, y) => y.at - x.at);
  out.sessions = out.sessions.slice(0, 100);
  // streak: prefer the one with the later qualifying day, then the longer one
  const sa = a.streak;
  const sb = b.streak;
  const pick =
    (sa.lastQualifyingDay ?? "") === (sb.lastQualifyingDay ?? "")
      ? sa.current >= sb.current
        ? sa
        : sb
      : (sa.lastQualifyingDay ?? "") > (sb.lastQualifyingDay ?? "")
        ? sa
        : sb;
  out.streak = clone(pick);
  out.streak.longest = Math.max(sa.longest, sb.longest, out.streak.current);
  out.updatedAt = Math.max(a.updatedAt, b.updatedAt);
  return out;
}

/** Defensive normalisation of whatever came out of storage. */
export function normalizeProgress(raw: unknown, now = Date.now()): ProgressState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<ProgressState>;
  if (r.version !== 1) return null;
  const base = structuredClone(emptyBase(now));
  return {
    ...base,
    ...r,
    lessons: r.lessons ?? {},
    problems: r.problems ?? {},
    xpByDay: r.xpByDay ?? {},
    activity: r.activity ?? {},
    streak: { ...base.streak, ...(r.streak ?? {}) },
    settings: { ...base.settings, ...(r.settings ?? {}) },
    sessions: Array.isArray(r.sessions) ? r.sessions : [],
    createdAt: typeof r.createdAt === "number" ? r.createdAt : now,
    updatedAt: typeof r.updatedAt === "number" ? r.updatedAt : now,
    version: 1,
  };
}

function emptyBase(now: number): ProgressState {
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    lessons: {},
    problems: {},
    xpByDay: {},
    activity: {},
    streak: { current: 0, longest: 0, lastQualifyingDay: null, charges: 0, chargeProgress: 0, usedChargeDays: [] },
    settings: { theme: "system", sound: true, practiceLength: 5, autoOfferNudge: true },
    sessions: [],
  };
}
