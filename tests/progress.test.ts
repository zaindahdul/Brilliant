import { describe, expect, it } from "vitest";
import { completeLesson, dayDiff, dayKey, getStreakStatus, mergeProgress, recordProblemResult, recordStepAttempt, shiftDay, startLesson, xpTotal, dueProblems, normalizeProgress } from "@/lib/progress/logic";
import { emptyProgress, XP } from "@/lib/progress/types";

const ts = (day: string, hour = 12) => new Date(`${day}T${String(hour).padStart(2, "0")}:00:00`).getTime();

describe("days", () => {
  it("computes keys and diffs", () => {
    expect(dayKey(new Date(2026, 9, 31, 23, 59))).toBe("2026-10-31");
    expect(dayDiff("2026-10-31", "2026-11-01")).toBe(1);
    expect(dayDiff("2026-10-31", "2026-11-02")).toBe(2);
    expect(shiftDay("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("streak", () => {
  const problem = (state: ReturnType<typeof emptyProgress>, day: string, i: number) =>
    recordProblemResult(state, { key: `k${day}-${i}`, unitId: "u1", correct: true, firstTry: true, source: "lesson", now: ts(day) });

  it("needs 3 problems or 1 lesson to count a day", () => {
    let s = emptyProgress(ts("2026-10-30"));
    s = problem(s, "2026-10-31", 1);
    s = problem(s, "2026-10-31", 2);
    expect(s.streak.current).toBe(0);
    s = problem(s, "2026-10-31", 3);
    expect(s.streak.current).toBe(1);
    expect(getStreakStatus(s, "2026-10-31")).toEqual({ current: 1, status: "done-today" });
    expect(getStreakStatus(s, "2026-11-01")).toEqual({ current: 1, status: "at-risk" });
    expect(getStreakStatus(s, "2026-11-02")).toEqual({ current: 0, status: "broken" });
  });

  it("extends on consecutive days and resets after a gap", () => {
    let s = emptyProgress(ts("2026-10-30"));
    s = completeLesson(s, "l1", { questions: 5, firstTry: 5, eventually: 5 }, ts("2026-10-31")).state;
    s = completeLesson(s, "l2", { questions: 5, firstTry: 5, eventually: 5 }, ts("2026-11-01")).state;
    expect(s.streak.current).toBe(2);
    s = completeLesson(s, "l3", { questions: 5, firstTry: 5, eventually: 5 }, ts("2026-11-04")).state;
    expect(s.streak.current).toBe(1);
    expect(s.streak.longest).toBe(2);
  });

  it("spends a charge to cover a single missed day", () => {
    let s = emptyProgress(ts("2026-10-30"));
    // three lessons -> one charge
    s = completeLesson(s, "a", { questions: 1, firstTry: 1, eventually: 1 }, ts("2026-10-31")).state;
    s = completeLesson(s, "b", { questions: 1, firstTry: 1, eventually: 1 }, ts("2026-10-31")).state;
    const third = completeLesson(s, "c", { questions: 1, firstTry: 1, eventually: 1 }, ts("2026-10-31"));
    s = third.state;
    expect(third.earnedCharge).toBe(true);
    expect(s.streak.charges).toBe(1);
    expect(s.streak.current).toBe(1);
    // skip Nov 1, learn Nov 2
    expect(getStreakStatus(s, "2026-11-02")).toEqual({ current: 1, status: "protected" });
    s = completeLesson(s, "d", { questions: 1, firstTry: 1, eventually: 1 }, ts("2026-11-02")).state;
    expect(s.streak.current).toBe(2);
    expect(s.streak.charges).toBe(0);
    expect(s.streak.usedChargeDays).toEqual(["2026-11-01"]);
  });
});

describe("xp and attempts", () => {
  it("awards xp by outcome", () => {
    let s = emptyProgress(ts("2026-10-31"));
    s = recordProblemResult(s, { key: "a", unitId: "u1", correct: true, firstTry: true, source: "lesson", now: ts("2026-10-31") });
    s = recordProblemResult(s, { key: "b", unitId: "u1", correct: true, firstTry: false, source: "lesson", now: ts("2026-10-31") });
    s = recordProblemResult(s, { key: "c", unitId: "u1", correct: false, firstTry: false, source: "lesson", now: ts("2026-10-31") });
    expect(xpTotal(s)).toBe(XP.stepFirstTry + XP.stepSecondTry + XP.stepRevealed);
    const res = completeLesson(s, "l", { questions: 3, firstTry: 1, eventually: 2 }, ts("2026-10-31"));
    expect(res.xp).toBe(XP.lessonComplete);
    expect(res.state.lessons.l.lastFirstTryPct).toBe(33);
    const again = completeLesson(res.state, "l", { questions: 3, firstTry: 3, eventually: 3 }, ts("2026-11-01"));
    expect(again.xp).toBe(XP.lessonRepeat);
    expect(again.state.lessons.l.bestFirstTryPct).toBe(100);
  });

  it("schedules missed problems for review", () => {
    let s = emptyProgress(ts("2026-10-31"));
    s = recordProblemResult(s, { key: "a", unitId: "u1", correct: false, firstTry: false, source: "lesson", now: ts("2026-10-31") });
    expect(dueProblems(s, ts("2026-10-31"))).toHaveLength(0);
    expect(dueProblems(s, ts("2026-11-01"))).toHaveLength(1);
    s = recordProblemResult(s, { key: "a", unitId: "u1", correct: true, firstTry: true, source: "review", now: ts("2026-11-01") });
    expect(s.problems.a.intervalDays).toBe(1);
    expect(dueProblems(s, ts("2026-11-01", 13))).toHaveLength(0);
    expect(dueProblems(s, ts("2026-11-03"))).toHaveLength(1);
  });

  it("records step attempts and lesson resume index", () => {
    let s = startLesson(emptyProgress(), "l1", 1000);
    s = recordStepAttempt(s, "l1", "s1", { tries: 2, correct: true, revealed: false, firstTry: false, at: 2000 });
    expect(s.lessons.l1.attempts.s1.correct).toBe(true);
    expect(s.lessons.l1.status).toBe("in-progress");
  });
});

describe("merge", () => {
  it("keeps the newest record per entity and max counters", () => {
    const a = emptyProgress(1000);
    const b = emptyProgress(1000);
    let sa = recordProblemResult(a, { key: "p", unitId: "u1", correct: true, firstTry: true, source: "lesson", now: ts("2026-10-31") });
    const sb = recordProblemResult(b, { key: "q", unitId: "u1", correct: false, firstTry: false, source: "lesson", now: ts("2026-10-31", 13) });
    sa = completeLesson(sa, "l1", { questions: 1, firstTry: 1, eventually: 1 }, ts("2026-10-31", 14)).state;
    const m = mergeProgress(sa, sb);
    expect(Object.keys(m.problems).sort()).toEqual(["p", "q"]);
    expect(m.lessons.l1.status).toBe("completed");
    expect(m.updatedAt).toBe(Math.max(sa.updatedAt, sb.updatedAt));
    expect(m.xpByDay["2026-10-31"]).toBe(Math.max(sa.xpByDay["2026-10-31"], sb.xpByDay["2026-10-31"]));
  });
  it("normalises partial data", () => {
    expect(normalizeProgress(null)).toBeNull();
    expect(normalizeProgress({ version: 2 })).toBeNull();
    const n = normalizeProgress({ version: 1, lessons: {} })!;
    expect(n.settings.theme).toBe("system");
    expect(n.streak.charges).toBe(0);
  });
});
