"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { QuestionStep } from "@/content/types";
import { generate } from "@/content/generators";
import { checkAnswer, formatAnswer, isAnswerEmpty, type AnswerValue } from "@/lib/check";
import { toPlainText } from "@/lib/markdown";
import { useProgressStore } from "@/lib/progress/store";
import { XP } from "@/lib/progress/types";
import { newSeed, rngFrom, shuffle } from "@/lib/random";
import { sounds } from "@/lib/sound";
import type { TutorContext } from "@/lib/ai/prompt";
import { Button } from "@/components/ui/Button";
import { ActionBar, PlayerHeader, TUTOR_OFFSET } from "./PlayerChrome";
import { FeedbackPanel, type Phase } from "./FeedbackPanel";
import { StepView } from "./StepView";
import { TutorPanel } from "@/components/tutor/TutorPanel";
import { cn } from "@/lib/cn";

export interface PracticeProblem {
  key: string;
  unitId: string;
  lessonId?: string;
  /** The problem's own course, for sets that mix courses (review); the tutor falls back to `course.id`. */
  courseId?: string;
  step: QuestionStep;
}

interface Props {
  unit: { id: string; title: string };
  course: { id: string; title: string };
  /** Static problems authored for this unit. */
  problems: PracticeProblem[];
  generatorIds: string[];
  /** When given, the set is fixed (review mode) and the chooser is skipped. */
  fixed?: PracticeProblem[];
  mode?: "practice" | "review";
  backHref: string;
}

interface Result {
  key: string;
  firstTry: boolean;
  eventually: boolean;
}

interface StepState {
  answer: AnswerValue | null;
  phase: Phase;
  tries: number;
  wrongChoiceIds: string[];
  feedback?: string;
  invalid?: string;
  attemptKey: number;
}

const fresh = (): StepState => ({ answer: null, phase: "answering", tries: 0, wrongChoiceIds: [], attemptKey: 0 });

function buildSet(problems: PracticeProblem[], generatorIds: string[], count: number): PracticeProblem[] {
  const staticShuffled = shuffle(problems, rngFrom(newSeed()));
  const gens = generatorIds.filter(Boolean);
  const out: PracticeProblem[] = [];
  let si = 0;
  let gi = 0;
  // interleave: roughly half static, half generated (generated fills any gap)
  while (out.length < count) {
    const wantStatic = out.length % 2 === 0 && si < staticShuffled.length;
    if (wantStatic || gens.length === 0) {
      if (si < staticShuffled.length) out.push(staticShuffled[si++]);
      else if (gens.length === 0) break;
      else {
        const g = generate(gens[gi++ % gens.length], newSeed());
        if (g) out.push({ key: g.key, unitId: g.unitId, step: g.step });
      }
    } else {
      const g = generate(gens[gi++ % gens.length], newSeed());
      if (g) out.push({ key: g.key, unitId: g.unitId, step: g.step });
      else if (si < staticShuffled.length) out.push(staticShuffled[si++]);
      else break;
    }
  }
  return out;
}

export function PracticePlayer({ unit, course, problems, generatorIds, fixed, mode = "practice", backHref }: Props) {
  const router = useRouter();
  const store = useProgressStore;
  const hydrated = useProgressStore((s) => s.hydrated);
  const settings = useProgressStore((s) => s.state.settings);

  const [set, setSet] = useState<PracticeProblem[] | null>(fixed ?? null);
  const [index, setIndex] = useState(0);
  const [st, setSt] = useState<StepState>(fresh);
  const [results, setResults] = useState<Result[]>([]);
  const [finished, setFinished] = useState<{ xp: number } | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [nudgeRequest, setNudgeRequest] = useState(0);
  const sessionIdRef = useRef<string | null>(null);
  const sessionId = () => (sessionIdRef.current ??= `${unit.id}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`);

  const play = useCallback(
    (name: keyof typeof sounds) => {
      if (settings.sound) sounds[name]();
    },
    [settings.sound],
  );

  const start = (count: 5 | 15) => {
    store.getState().updateSettings({ practiceLength: count });
    sessionIdRef.current = null;
    setSet(buildSet(problems, generatorIds, count));
    setIndex(0);
    setSt(fresh());
    setResults([]);
    setFinished(null);
  };

  const current = set?.[index];
  const q = current?.step;

  const check = useCallback(() => {
    if (!current || !q || st.phase !== "answering") return;
    const res = checkAnswer(q, st.answer);
    if (res.invalid) return setSt((s) => ({ ...s, invalid: res.invalid }));
    const tries = st.tries + 1;
    const now = Date.now();
    const label = toPlainText(q.question).slice(0, 90);
    const source = mode === "review" ? "review" : "practice";
    if (res.correct) {
      play("correct");
      store.getState().recordProblemResult({ key: current.key, unitId: current.unitId, lessonId: current.lessonId, label, tags: q.tags, correct: true, firstTry: tries === 1, source, now });
      setResults((r) => [...r, { key: current.key, firstTry: tries === 1, eventually: true }]);
      setSt((s) => ({ ...s, phase: "correct", tries, invalid: undefined }));
      return;
    }
    play("wrong");
    const wrongChoiceIds = st.answer?.kind === "choice" ? [...st.wrongChoiceIds, st.answer.id] : st.wrongChoiceIds;
    if (tries === 1) return setSt((s) => ({ ...s, phase: "wrong1", tries, wrongChoiceIds, feedback: res.feedback, invalid: undefined }));
    store.getState().recordProblemResult({ key: current.key, unitId: current.unitId, lessonId: current.lessonId, label, tags: q.tags, correct: false, firstTry: false, source, now });
    setResults((r) => [...r, { key: current.key, firstTry: false, eventually: false }]);
    setSt((s) => ({ ...s, phase: "revealed", tries, wrongChoiceIds, invalid: undefined }));
  }, [current, q, st, mode, play, store]);

  const tryAgain = () => setSt((s) => ({ ...s, phase: "answering", invalid: undefined, attemptKey: s.attemptKey + 1, answer: s.answer?.kind === "matrix" ? s.answer : null }));

  const next = useCallback(() => {
    if (!set) return;
    if (index + 1 >= set.length) {
      const firstTry = results.filter((r) => r.firstTry).length;
      const eventually = results.filter((r) => r.eventually).length;
      const xpEarned = firstTry * (mode === "review" ? XP.reviewFirstTry : XP.practiceFirstTry) + (eventually - firstTry) * (mode === "review" ? 0 : XP.practiceEventually);
      store.getState().recordPracticeSession({ id: sessionId(), unitId: unit.id, mode: mode === "review" ? "review" : set.length <= 5 ? "quick" : "practice", total: set.length, firstTry, eventually, at: Date.now(), xp: xpEarned });
      play("complete");
      setFinished({ xp: xpEarned + (set.length ? XP.practiceComplete : 0) });
      return;
    }
    setIndex((i) => i + 1);
    setSt(fresh());
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, index, results, mode, unit.id, play, store]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!set || finished) return;
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");
      // Enter on a focused link or button (other than an answer choice) activates that control, not the primary action.
      const onControl = !!target?.closest?.("a, button:not([role=radio]):not([role=checkbox])");
      if (e.key === "Enter" && !typing && !onControl) {
        e.preventDefault();
        if (st.phase === "answering") check();
        else if (st.phase === "wrong1") tryAgain();
        else next();
      }
      if (!typing && q && st.phase === "answering" && /^[1-9]$/.test(e.key) && (q.type === "mc" || q.type === "multi")) {
        const choice = q.choices[Number(e.key) - 1];
        if (!choice || st.wrongChoiceIds.includes(choice.id)) return;
        if (q.type === "mc") setSt((s) => ({ ...s, answer: { kind: "choice", id: choice.id } }));
        else
          setSt((s) => {
            const ids = s.answer?.kind === "choices" ? s.answer.ids : [];
            return { ...s, answer: { kind: "choices", ids: ids.includes(choice.id) ? ids.filter((x) => x !== choice.id) : [...ids, choice.id] } };
          });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [set, finished, st.phase, st.wrongChoiceIds, q, check, next]);

  const tutorContext: TutorContext | null = useMemo(() => {
    if (!q) return null;
    const attempts: TutorContext["attempts"] = [];
    if (st.answer && st.phase !== "answering") attempts.push({ answer: describe(q, st.answer), correct: st.phase === "correct" });
    for (const id of st.wrongChoiceIds) if (st.phase === "answering") attempts.push({ answer: toPlainText((q.type === "mc" || q.type === "multi" ? q.choices.find((c) => c.id === id)?.text : id) ?? id), correct: false });
    const resolved = st.phase === "correct" || st.phase === "revealed";
    return {
      courseId: current!.courseId ?? course.id,
      courseTitle: course.title,
      unitTitle: unit.title,
      lessonTitle: mode === "review" ? "Review session" : "Level Check",
      stepId: current!.key,
      stepType: q.type,
      body: toPlainText(q.body),
      question: toPlainText(q.question),
      choices: q.type === "mc" || q.type === "multi" ? q.choices.map((c) => ({ id: c.id, text: toPlainText(c.text) })) : undefined,
      correctAnswer: toPlainText(formatAnswer(q).value),
      explanation: toPlainText(q.explanation),
      hint: toPlainText(q.hint),
      attempts,
      resolved,
      nudgeLevel: 1,
      mode: resolved ? "debrief" : "practice",
    };
  }, [q, st, current, course.id, course.title, unit.title, mode]);

  if (!hydrated) return <div className="flex min-h-dvh items-center justify-center text-muted">Loading…</div>;

  /* ---------- chooser ---------- */
  if (!set) {
    return (
      <div className="mx-auto w-full max-w-lg px-5 py-10 sm:py-14">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft size={16} /> Back
        </Link>
        <p className="mt-8 text-sm text-muted">{unit.title}</p>
        <h1 className="mt-1 font-serif text-4xl">Level check</h1>
        <p className="mt-3 text-muted">Fresh problems, shuffled, with no hint on the first miss. Your first-try score here is the honest one.</p>
        <div className="mt-8 grid gap-3">
          <Button variant="primary" size="xl" ledge full onClick={() => start(5)}>
            5 problems
          </Button>
          <Button variant="outline" size="xl" full onClick={() => start(15)}>
            15 problems
          </Button>
        </div>
      </div>
    );
  }

  if (set.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-muted">
        Nothing to practise here yet.{" "}
        <Link href={backHref} className="underline">
          Go back
        </Link>
        .
      </div>
    );
  }

  /* ---------- summary ---------- */
  if (finished) {
    const firstTry = results.filter((r) => r.firstTry).length;
    const eventually = results.filter((r) => r.eventually).length;
    const pct = (n: number) => Math.round((100 * n) / set.length);
    const headline = pct(firstTry) >= 90 ? "Excellent!" : pct(firstTry) >= 70 ? "Solid." : pct(firstTry) >= 50 ? "Getting there." : "Worth another pass.";
    const nextAction = pct(firstTry) >= 80 ? "Move on — and come back in a few days for a spaced review." : pct(eventually) >= 80 ? "You get there with a second look. Re-do the lessons for the problems you missed, then try again tomorrow." : "Re-read the unit's lessons and talk the missed problems through with the tutor.";
    return (
      <div className="mx-auto w-full max-w-lg px-5 py-14 text-center">
        <p className="text-sm text-muted">{mode === "review" ? "Review complete" : "Level check complete"}</p>
        <h1 className="mt-2 font-serif text-4xl">{headline}</h1>
        <p className="mt-6 font-serif text-6xl tabular-nums">{pct(firstTry)}%</p>
        <p className="mt-1 text-sm text-muted">
          right on the first try · {eventually} of {set.length} by the second · +{finished.xp} XP
        </p>
        <p className="mx-auto mt-6 max-w-sm text-[15px] text-muted">{nextAction}</p>
        <div className="mt-8 grid gap-2">
          {!fixed && (
            <Button variant="primary" size="xl" ledge full onClick={() => start(set.length <= 5 ? 5 : 15)}>
              Another set <ArrowRight size={18} />
            </Button>
          )}
          <Link href={backHref} className="contents">
            <Button variant={fixed ? "primary" : "ghost"} size="xl" full>
              Done
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- problem ---------- */
  const canCheck = !isAnswerEmpty(st.answer);
  const resolved = st.phase === "correct" || st.phase === "revealed";
  const isLast = index + 1 >= set.length;
  return (
    <div className={cn("min-h-dvh", tutorOpen && TUTOR_OFFSET)}>
      <PlayerHeader onExit={() => router.push(backHref)} done={results.length} current={index + 1} total={set.length} label={`Problem ${index + 1} of ${set.length}`} />

      <main className="mx-auto w-full max-w-2xl px-4 pb-36 pt-4">
        <div key={current!.key}>
          <StepView step={q!} answer={st.answer} onAnswer={(a) => setSt((s) => ({ ...s, answer: a, invalid: undefined }))} onSubmit={check} phase={st.phase} wrongChoiceIds={st.wrongChoiceIds} attemptKey={st.attemptKey} />
        </div>
        {st.invalid && <p className="mt-3 text-sm text-danger">{st.invalid}</p>}
        {st.phase !== "answering" && <FeedbackPanel phase={st.phase} hint={st.feedback} explanation={q!.explanation} answer={q!.type === "mc" || q!.type === "multi" ? undefined : formatAnswer(q!)} practice />}
      </main>

      <ActionBar
        tutorOpen={tutorOpen}
        secondary={
          <Button
            variant="ghost"
            size="lg"
            className="-ml-3"
            onClick={() => {
              setTutorOpen(true);
              if (st.phase === "wrong1" && settings.autoOfferNudge) setNudgeRequest((n) => n + 1);
            }}
          >
            <Sparkles size={16} /> {resolved ? "Talk it through" : st.phase === "wrong1" ? "Get a hint" : "Ask the tutor"}
          </Button>
        }
      >
        {st.phase === "answering" ? (
          <Button variant="primary" size="xl" ledge onClick={check} disabled={!canCheck} className="min-w-32">
            Check
          </Button>
        ) : st.phase === "wrong1" ? (
          <Button variant="primary" size="xl" ledge onClick={tryAgain} autoFocus className="min-w-32">
            Try again
          </Button>
        ) : (
          <Button variant="primary" size="xl" ledge onClick={next} autoFocus className="min-w-32">
            {isLast ? "Finish" : "Continue"}
          </Button>
        )}
      </ActionBar>

      {tutorContext && <TutorPanel open={tutorOpen} onClose={() => setTutorOpen(false)} chatId={`practice:${current!.key}`} context={tutorContext} nudgeRequest={nudgeRequest} />}
    </div>
  );
}

function describe(step: QuestionStep, a: AnswerValue): string {
  switch (a.kind) {
    case "choice":
      return toPlainText((step.type === "mc" ? step.choices.find((c) => c.id === a.id)?.text : undefined) ?? a.id);
    case "choices":
      return a.ids.map((id) => toPlainText((step.type === "multi" ? step.choices.find((c) => c.id === id)?.text : undefined) ?? id)).join(" + ");
    case "number":
      return a.text;
    case "matrix":
      return a.cells.map((r) => `[${r.join(", ")}]`).join(" ");
    case "order":
      return a.ids.join(" → ");
    case "goal":
      return a.satisfied ? "goal satisfied" : "goal not satisfied";
  }
}
