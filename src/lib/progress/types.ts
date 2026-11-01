/** Local calendar day, "YYYY-MM-DD". */
export type DayKey = string;

export interface StepAttempt {
  tries: number;
  correct: boolean;
  /** Answer was shown after the second miss. */
  revealed: boolean;
  firstTry: boolean;
  at: number;
}

export interface LessonProgress {
  id: string;
  status: "in-progress" | "completed";
  /** Index of the step to resume at. */
  stepIndex: number;
  attempts: Record<string, StepAttempt>;
  startedAt: number;
  completedAt?: number;
  timesCompleted: number;
  bestFirstTryPct?: number;
  lastFirstTryPct?: number;
  updatedAt: number;
}

export interface ProblemStat {
  key: string;
  unitId: string;
  lessonId?: string;
  /** Short label so the review page can describe it without loading content. */
  label?: string;
  tags?: string[];
  seen: number;
  correct: number;
  wrong: number;
  lastResult: "correct" | "wrong";
  lastAt: number;
  /** Spaced-repetition schedule. */
  dueAt: number;
  intervalDays: number;
  updatedAt: number;
}

export interface PracticeSummary {
  id: string;
  unitId: string;
  mode: "quick" | "practice" | "review";
  total: number;
  firstTry: number;
  eventually: number;
  xp: number;
  at: number;
}

export interface Settings {
  theme: "system" | "light" | "dark";
  sound: boolean;
  practiceLength: 5 | 15;
  /** Offer a tutor nudge automatically after the first miss. */
  autoOfferNudge: boolean;
  name?: string;
}

export interface Streak {
  current: number;
  longest: number;
  lastQualifyingDay: DayKey | null;
  /** Up to 2 automatic streak protections. */
  charges: number;
  /** Lessons completed toward the next charge (3 per charge). */
  chargeProgress: number;
  usedChargeDays: DayKey[];
}

export interface DayActivity {
  problems: number;
  lessons: number;
}

export interface ProgressState {
  version: 1;
  createdAt: number;
  updatedAt: number;
  lessons: Record<string, LessonProgress>;
  problems: Record<string, ProblemStat>;
  xpByDay: Record<DayKey, number>;
  activity: Record<DayKey, DayActivity>;
  streak: Streak;
  settings: Settings;
  sessions: PracticeSummary[];
}

export const XP = {
  stepFirstTry: 10,
  stepSecondTry: 6,
  stepRevealed: 2,
  lessonComplete: 30,
  lessonRepeat: 10,
  practiceFirstTry: 8,
  practiceEventually: 4,
  practiceComplete: 15,
  reviewFirstTry: 10,
} as const;

export const STREAK_PROBLEMS_PER_DAY = 3;
export const LESSONS_PER_CHARGE = 3;
export const MAX_CHARGES = 2;

export function emptyProgress(now = Date.now()): ProgressState {
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
