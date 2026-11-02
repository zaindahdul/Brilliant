"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Volume2, VolumeX } from "lucide-react";
import type { Lesson, Step } from "@/content/types";
import { withLessonContext } from "@/content/context";
import { isQuestion } from "@/content/types";
import { checkAnswer, formatAnswer, isAnswerEmpty, type AnswerValue } from "@/lib/check";
import { toPlainText } from "@/lib/markdown";
import { useProgressStore } from "@/lib/progress/store";
import { getStreakStatus, lessonStats } from "@/lib/progress/logic";
import { sounds } from "@/lib/sound";
import type { TutorContext } from "@/lib/ai/prompt";
import { Button } from "@/components/ui/Button";
import { ProgressBar, type SegmentState } from "./ProgressBar";
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
      if (e.key === "Enter" && !typing) {
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

  const segments: SegmentState[] = steps.map((s, i) => {
    const r = results[s.id];
    if (r === "correct") return "correct";
    if (r === "wrong") return "wrong";
    if (r === "reading") return "reading";
    if (i === index) return "current";
    return "upcoming";
  });

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

  return (
    <div className="min-h-dvh">
      <div ref={topRef} />
      {/* top chrome: back, progress, tutor */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/90 backdrop-blur">
        <div className={cn("mx-auto flex max-w-3xl items-center gap-3 px-3 py-2.5", tutorOpen && "sm:mr-[400px]")}>
          <button type="button" onClick={exit} aria-label="Exit lesson" className="rounded-full p-2 text-muted hover:bg-surface-2">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <ProgressBar segments={segments} label={`Step ${index + 1} of ${steps.length}`} />
          </div>
          <button
            type="button"
            aria-label={settings.sound ? "Mute sounds" : "Unmute sounds"}
            onClick={() => store.getState().updateSettings({ sound: !settings.sound })}
            className="rounded-full p-2 text-muted hover:bg-surface-2"
          >
            {settings.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            type="button"
            onClick={() => setTutorOpen((o) => !o)}
            className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors", tutorOpen ? "bg-purple text-white" : "bg-purple-soft text-purple hover:brightness-95")}
          >
            <Sparkles size={15} /> <span className="hidden sm:inline">Tutor</span>
          </button>
        </div>
      </header>

      <main className={cn("mx-auto w-full max-w-2xl px-4 pb-40 pt-6 transition-[margin]", tutorOpen && "sm:mr-[400px] lg:mx-auto lg:pr-[400px]")}>
        <div className="eyebrow mb-3">
          {unit.title} · {q ? `Problem ${questionIds.indexOf(q.id) + 1} of ${questionIds.length}` : "Concept"}
        </div>
        <div key={step.id}>
          <StepView step={step} answer={st.answer} onAnswer={(a) => setSt((s) => ({ ...s, answer: a, invalid: undefined }))} onSubmit={check} phase={st.phase} wrongChoiceIds={st.wrongChoiceIds} attemptKey={st.attemptKey} />
        </div>

        {st.invalid && <p className="mt-3 text-sm text-danger">{st.invalid}</p>}

        <div className="mt-5">
          {q && st.phase !== "answering" ? (
            <FeedbackPanel
              phase={st.phase}
              hint={st.feedback ?? q.hint}
              explanation={q.explanation}
              answer={formatAnswer(q)}
              onTryAgain={tryAgain}
              onContinue={continueNext}
              onNudge={() => {
                setTutorOpen(true);
                setNudgeRequest((n) => n + 1);
              }}
              onAskWhy={() => setTutorOpen(true)}
              isLast={isLast}
            />
          ) : (
            <div className="flex items-center gap-3">
              <Button variant={q ? "ink" : "primary"} size="xl" ledge onClick={q ? check : continueNext} disabled={!canCheck} className="min-w-40">
                {q ? "Check" : isLast ? "Finish lesson" : "Continue"}
              </Button>
              {q && (
                <button type="button" onClick={() => setTutorOpen(true)} className="text-sm font-medium text-muted hover:text-text">
                  Stuck? Ask for a nudge
                </button>
              )}
            </div>
          )}
        </div>
      </main>

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

function plainCorrectAnswer(step: Exclude<Step, { type: "reading" }>): string {
  switch (step.type) {
    case "mc":
      return toPlainText(step.choices.find((c) => c.id === step.correct)?.text ?? "");
    case "multi":
      return step.correct.map((id) => toPlainText(step.choices.find((c) => c.id === id)?.text ?? "")).join(" + ");
    case "numeric":
      return String(step.answer);
    case "matrix":
      return step.answer.map((r) => `[${r.join(", ")}]`).join(" ");
    case "order":
      return step.correct.map((id) => toPlainText(step.items.find((x) => x.id === id)?.text ?? "")).join(" → ");
    case "goal":
      return "the diagram must satisfy the stated goal";
  }
}
