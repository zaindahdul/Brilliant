"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import type { Lesson, Step } from "@/content/types";
import { withLessonContext } from "@/content/context";
import { isQuestion } from "@/content/types";
import { checkAnswer, formatAnswer, isAnswerEmpty, type AnswerValue } from "@/lib/check";
import { toPlainText } from "@/lib/markdown";
import { useProgressStore } from "@/lib/progress/store";
import { getStreakStatus, lessonStats } from "@/lib/progress/logic";
import { sounds } from "@/lib/sound";
import type { TutorContext } from "@/lib/ai/prompt";
import { plainCorrectAnswer } from "@/lib/ai/context";
import { Button } from "@/components/ui/Button";
import { ActionBar, PlayerHeader, TUTOR_OFFSET } from "./PlayerChrome";
import { FeedbackPanel, type Phase } from "./FeedbackPanel";
import { StepView } from "./StepView";
import { LessonSummary } from "./LessonSummary";
import { TutorPanel } from "@/components/tutor/TutorPanel";
import { cn } from "@/lib/cn";

interface Props {
  lesson: Lesson;
  unit: { id: string; title: string };
  course: { id: string; title: string };
  next: { id: string; title: string } | null;
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

type ResultMap = Record<string, "correct" | "wrong" | "reading">;

/** Waits for persisted progress, then mounts the player at the saved step. */
export function LessonPlayer(props: Props) {
  const hydrated = useProgressStore((s) => s.hydrated);
  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted">
        <div className="animate-pulse">Loading your place…</div>
      </div>
    );
  }
  return <LessonPlayerInner key={props.lesson.id} {...props} />;
}

function resumePoint(lessonId: string, steps: Step[]): { index: number; results: ResultMap } {
  const lp = useProgressStore.getState().state.lessons[lessonId];
  const index = lp && lp.status === "in-progress" ? Math.min(lp.stepIndex, steps.length - 1) : 0;
  const results: ResultMap = {};
  if (lp && lp.status === "in-progress") {
    for (let i = 0; i < index; i++) {
      const s = steps[i];
      if (!isQuestion(s)) results[s.id] = "reading";
      else if (lp.attempts[s.id]) results[s.id] = lp.attempts[s.id].correct ? "correct" : "wrong";
    }
  }
  return { index, results };
}

function LessonPlayerInner({ lesson, unit, course, next }: Props) {
  const router = useRouter();
  const settings = useProgressStore((s) => s.state.settings);
  const lessonProgress = useProgressStore((s) => s.state.lessons[lesson.id]);
  const store = useProgressStore;

  const steps = lesson.steps;
  const questionIds = useMemo(() => steps.filter(isQuestion).map((s) => s.id), [steps]);

  const [resume] = useState(() => resumePoint(lesson.id, steps));
  const [index, setIndex] = useState<number>(resume.index);
  const [results, setResults] = useState<ResultMap>(resume.results);
  const [st, setSt] = useState<StepState>(fresh);
  const [done, setDone] = useState<{ xp: number; earnedCharge: boolean } | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [nudgeRequest, setNudgeRequest] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  // Make sure the lesson exists in progress (external system update — fine in an effect).
  useEffect(() => {
    if (!store.getState().state.lessons[lesson.id]) store.getState().startLesson(lesson.id);
  }, [lesson.id, store]);

  const step: Step | undefined = steps[index];
  const isLast = index === steps.length - 1;

  const play = useCallback(
    (name: keyof typeof sounds) => {
      if (settings.sound) sounds[name]();
    },
    [settings.sound],
  );

  const scrollTop = () => topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });

  const goTo = useCallback(
    (nextIndex: number) => {
      setSt(fresh());
      setIndex(nextIndex);
      store.getState().setLessonStep(lesson.id, nextIndex);
      scrollTop();
    },
    [lesson.id, store],
  );

  const finish = useCallback(() => {
    const lp = store.getState().state.lessons[lesson.id];
    const stats = lessonStats(lp, questionIds);
    const res = store.getState().completeLesson(lesson.id, stats);
    play("complete");
    setDone(res);
    scrollTop();
  }, [lesson.id, questionIds, play, store]);

  const check = useCallback(() => {
    if (!step || !isQuestion(step) || st.phase !== "answering") return;
    const result = checkAnswer(step, st.answer);
    if (result.invalid) {
      setSt((s) => ({ ...s, invalid: result.invalid }));
      return;
    }
    const tries = st.tries + 1;
    const now = Date.now();
    const key = `${lesson.id}:${step.id}`;
    const label = toPlainText(step.question).slice(0, 90);
    if (result.correct) {
      play("correct");
      store.getState().recordStepAttempt(lesson.id, step.id, { tries, correct: true, revealed: false, firstTry: tries === 1, at: now });
      store.getState().recordProblemResult({ key, unitId: unit.id, lessonId: lesson.id, label, tags: step.tags, correct: true, firstTry: tries === 1, source: "lesson", now });
      setResults((r) => ({ ...r, [step.id]: "correct" }));
      setSt((s) => ({ ...s, phase: "correct", tries, invalid: undefined }));
      return;
    }
    play("wrong");
    const wrongChoiceIds = st.answer?.kind === "choice" ? [...st.wrongChoiceIds, st.answer.id] : st.wrongChoiceIds;
    if (tries === 1) {
      setSt((s) => ({ ...s, phase: "wrong1", tries, wrongChoiceIds, feedback: result.feedback, invalid: undefined }));
      return;
    }
    store.getState().recordStepAttempt(lesson.id, step.id, { tries, correct: false, revealed: true, firstTry: false, at: now });
    store.getState().recordProblemResult({ key, unitId: unit.id, lessonId: lesson.id, label, tags: step.tags, correct: false, firstTry: false, source: "lesson", now });
    setResults((r) => ({ ...r, [step.id]: "wrong" }));
    setSt((s) => ({ ...s, phase: "revealed", tries, wrongChoiceIds, invalid: undefined }));
  }, [step, st, lesson.id, unit.id, play, store]);

  const tryAgain = useCallback(() => {
    setSt((s) => ({
      ...s,
      phase: "answering",
      invalid: undefined,
      attemptKey: s.attemptKey + 1,
      // keep matrix entries (one wrong cell is common); clear everything else
      answer: s.answer?.kind === "matrix" ? s.answer : null,
    }));
  }, []);

  const continueNext = useCallback(() => {
    if (step && !isQuestion(step)) setResults((r) => ({ ...r, [step.id]: "reading" }));
    if (isLast) finish();
    else goTo(index + 1);
  }, [index, step, isLast, finish, goTo]);

  // Keyboard: Enter = primary action, 1–9 = choose option
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || !step) return;
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      // Enter on a focused link or button (other than an answer choice) activates that control, not the primary action.
      const onControl = !!target?.closest?.("a, button:not([role=radio]):not([role=checkbox])");
      if (e.key === "Enter" && !typing && !onControl) {
        e.preventDefault();
        if (!isQuestion(step)) continueNext();
        else if (st.phase === "answering") check();
        else if (st.phase === "wrong1") tryAgain();
        else continueNext();
      }
      if (!typing && isQuestion(step) && st.phase === "answering" && /^[1-9]$/.test(e.key) && (step.type === "mc" || step.type === "multi")) {
        const idx = Number(e.key) - 1;
        const choice = step.choices[idx];
        if (!choice || st.wrongChoiceIds.includes(choice.id)) return;
        if (step.type === "mc") setSt((s) => ({ ...s, answer: { kind: "choice", id: choice.id } }));
        else
          setSt((s) => {
            const ids = s.answer?.kind === "choices" ? s.answer.ids : [];
            return { ...s, answer: { kind: "choices", ids: ids.includes(choice.id) ? ids.filter((x) => x !== choice.id) : [...ids, choice.id] } };
          });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, step, st.phase, st.wrongChoiceIds, check, tryAgain, continueNext]);

  const tutorContext: TutorContext | null = useMemo(() => {
    if (!step) return null;
    const q = isQuestion(step) ? step : null;
    const attempts: TutorContext["attempts"] = [];
    const lp = lessonProgress?.attempts[step.id];
    if (q && st.answer && st.phase !== "answering") {
      attempts.push({ answer: describeAnswer(q, st.answer), correct: st.phase === "correct" });
    }
    if (q && st.phase === "answering" && st.tries > 0 && st.wrongChoiceIds.length) {
      for (const id of st.wrongChoiceIds) attempts.push({ answer: q.type === "mc" || q.type === "multi" ? toPlainText(q.choices.find((c) => c.id === id)?.text ?? id) : id, correct: false });
    }
    const resolved = st.phase === "correct" || st.phase === "revealed" || (!!lp && (lp.correct || lp.revealed));
    return {
      courseId: course.id,
      courseTitle: course.title,
      unitTitle: unit.title,
      lessonTitle: lesson.title,
      stepId: step.id,
      stepType: step.type,
      body: toPlainText(q ? withLessonContext(lesson, q).body : step.body),
      question: q ? toPlainText(q.question) : undefined,
      choices: q && (q.type === "mc" || q.type === "multi") ? q.choices.map((c) => ({ id: c.id, text: toPlainText(c.text) })) : undefined,
      correctAnswer: q ? plainCorrectAnswer(q) : undefined,
      explanation: q ? toPlainText(q.explanation) : undefined,
      hint: q ? toPlainText(q.hint) : undefined,
      attempts,
      resolved,
      nudgeLevel: 1,
      mode: resolved ? "debrief" : "stuck",
    };
  }, [step, st, lessonProgress, course.id, course.title, unit.title, lesson]);

  const exit = () => router.push(`/course/${course.id}`);

  if (!step) {
    return <div className="flex min-h-dvh items-center justify-center text-muted">This lesson has no steps.</div>;
  }

  if (done) {
    const streak = getStreakStatus(store.getState().state);
    const lp = store.getState().state.lessons[lesson.id];
    return (
      <div className="min-h-dvh px-4">
        <LessonSummary
          title={lesson.title}
          stats={lessonStats(lp, questionIds)}
          xp={done.xp}
          streak={streak}
          earnedCharge={done.earnedCharge}
          next={next}
          courseHref={`/course/${course.id}`}
          onRedo={() => {
            store.getState().resetLesson(lesson.id);
            setDone(null);
            setResults({});
            setSt(fresh());
            setIndex(0);
          }}
        />
      </div>
    );
  }

  const q = isQuestion(step) ? step : null;
  const canCheck = q ? !isAnswerEmpty(st.answer) : true;
  const resolved = st.phase === "correct" || st.phase === "revealed";
  const stepsDone = steps.filter((s) => results[s.id]).length;

  // After a first miss the tutor button asks for a hint straight away; otherwise it just opens the chat.
  const openTutor = () => {
    setTutorOpen(true);
    if (st.phase === "wrong1" && settings.autoOfferNudge) setNudgeRequest((n) => n + 1);
  };

  return (
    <div className={cn("min-h-dvh", tutorOpen && TUTOR_OFFSET)}>
      <div ref={topRef} />
      <PlayerHeader onExit={exit} done={stepsDone} current={index + 1} total={steps.length} label={`Step ${index + 1} of ${steps.length}`} />

      <main className="mx-auto w-full max-w-2xl px-4 pb-36 pt-4">
        <div key={step.id}>
          <StepView step={step} answer={st.answer} onAnswer={(a) => setSt((s) => ({ ...s, answer: a, invalid: undefined }))} onSubmit={check} phase={st.phase} wrongChoiceIds={st.wrongChoiceIds} attemptKey={st.attemptKey} />
        </div>

        {st.invalid && <p className="mt-3 text-sm text-danger">{st.invalid}</p>}

        {q && st.phase !== "answering" && <FeedbackPanel phase={st.phase} hint={st.feedback ?? q.hint} explanation={q.explanation} answer={q.type === "mc" || q.type === "multi" ? undefined : formatAnswer(q)} />}
      </main>

      <ActionBar
        tutorOpen={tutorOpen}
        secondary={
          q && (
            <Button variant="ghost" size="lg" onClick={openTutor} className="-ml-3">
              <Sparkles size={16} /> {resolved ? "Talk it through" : st.phase === "wrong1" ? "Get a hint" : "Ask the tutor"}
            </Button>
          )
        }
      >
        {!q ? (
          <Button variant="primary" size="xl" ledge onClick={continueNext} className="min-w-32">
            {isLast ? "Finish" : "Continue"}
          </Button>
        ) : st.phase === "answering" ? (
          <Button variant="primary" size="xl" ledge onClick={check} disabled={!canCheck} className="min-w-32">
            Check
          </Button>
        ) : st.phase === "wrong1" ? (
          <Button variant="primary" size="xl" ledge onClick={tryAgain} autoFocus className="min-w-32">
            Try again
          </Button>
        ) : (
          <Button variant="primary" size="xl" ledge onClick={continueNext} autoFocus className="min-w-32">
            {isLast ? "Finish" : "Continue"}
          </Button>
        )}
      </ActionBar>

      {tutorContext && <TutorPanel open={tutorOpen} onClose={() => setTutorOpen(false)} chatId={`${lesson.id}:${step.id}`} context={tutorContext} nudgeRequest={nudgeRequest} />}
    </div>
  );
}

function describeAnswer(step: Step, a: AnswerValue): string {
  switch (a.kind) {
    case "choice": {
      if (step.type === "mc") return toPlainText(step.choices.find((c) => c.id === a.id)?.text ?? a.id);
      return a.id;
    }
    case "choices": {
      if (step.type === "multi") return a.ids.map((id) => toPlainText(step.choices.find((c) => c.id === id)?.text ?? id)).join(" + ");
      return a.ids.join(", ");
    }
    case "number":
      return a.text;
    case "matrix":
      return a.cells.map((r) => `[${r.join(", ")}]`).join(" ");
    case "order": {
      if (step.type === "order") return a.ids.map((id) => toPlainText(step.items.find((x) => x.id === id)?.text ?? id)).join(" → ");
      return a.ids.join(" → ");
    }
    case "goal":
      return a.satisfied ? "diagram satisfies the goal" : `diagram does not satisfy the goal${a.detail ? ` (${a.detail})` : ""}`;
  }
}

