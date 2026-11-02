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
import { Card, Eyebrow } from "@/components/ui/Card";
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
      if (e.key === "Enter" && !typing) {
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
      <div className="mx-auto grid w-full max-w-lg gap-5 px-4 py-10">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <Eyebrow>Level check · {unit.title}</Eyebrow>
          <h1 className="mt-1 font-serif text-3xl">Prove it to yourself</h1>
          <p className="mt-2 text-muted">No hints on the first miss, problems shuffled and partly generated fresh, surface details changed. This is where you find out what actually stuck.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="grid gap-2 p-5">
            <div className="font-serif text-xl">Quick check</div>
            <p className="text-sm text-muted">5 problems · about 5 minutes</p>
            <Button variant="ink" ledge onClick={() => start(5)}>
              Start quick check
            </Button>
          </Card>
          <Card className="grid gap-2 p-5">
            <div className="font-serif text-xl">Practice</div>
            <p className="text-sm text-muted">15 problems · about 15 minutes</p>
            <Button variant="primary" ledge onClick={() => start(15)}>
              Start practice
            </Button>
          </Card>
        </div>
        <p className="text-xs text-muted">Your default was {settings.practiceLength} — this choice updates it.</p>
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
      <div className="mx-auto grid w-full max-w-lg gap-5 px-4 py-10">
        <div className="text-center">
          <Eyebrow>{mode === "review" ? "Review complete" : "Level check complete"}</Eyebrow>
          <h1 className="mt-2 font-serif text-4xl">{headline}</h1>
        </div>
        <Card className="grid grid-cols-3 divide-x divide-border p-0">
          <Stat label="First try" value={`${pct(firstTry)}%`} />
          <Stat label="Eventually correct" value={`${pct(eventually)}%`} />
          <Stat label="Completed" value={`${set.length} of ${set.length}`} />
        </Card>
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5 text-sm font-semibold text-gold-ink">
            <Sparkles size={15} /> +{finished.xp} XP
          </span>
        </div>
        <p className="text-center text-[15px] text-muted">{nextAction}</p>
        <div className="grid gap-2">
          {!fixed && (
            <Button variant="primary" size="xl" ledge full onClick={() => start(set.length <= 5 ? 5 : 15)}>
              Another set <ArrowRight size={18} />
            </Button>
          )}
          <Link href={backHref} className="contents">
            <Button variant="outline" size="lg" full>
              Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- problem ---------- */
  const canCheck = !isAnswerEmpty(st.answer);
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/90 backdrop-blur">
        <div className={cn("mx-auto flex max-w-3xl items-center gap-3 px-3 py-2.5", tutorOpen && "sm:mr-[400px]")}>
          <button type="button" onClick={() => router.push(backHref)} aria-label="Exit" className="rounded-full p-2 text-muted hover:bg-surface-2">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-1 items-center gap-1" aria-label={`Problem ${index + 1} of ${set.length}`}>
            {set.map((p, i) => {
              const r = results.find((x) => x.key === p.key);
              return <div key={p.key} className={cn("h-2.5 flex-1 rounded-sm", r ? (r.eventually ? (r.firstTry ? "bg-primary" : "bg-primary/60") : "bg-danger") : i === index ? "bg-blue" : "bg-surface-3")} />;
            })}
          </div>
          <button type="button" onClick={() => setTutorOpen((o) => !o)} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold", tutorOpen ? "bg-purple text-white" : "bg-purple-soft text-purple")}>
            <Sparkles size={15} /> <span className="hidden sm:inline">Tutor</span>
          </button>
        </div>
      </header>

      <main className={cn("mx-auto w-full max-w-2xl px-4 pb-40 pt-6", tutorOpen && "sm:mr-[400px] lg:mx-auto lg:pr-[400px]")}>
        <div className="eyebrow mb-3">
          Problem {index + 1} of {set.length}
        </div>
        <div key={current!.key}>
          <StepView step={q!} answer={st.answer} onAnswer={(a) => setSt((s) => ({ ...s, answer: a, invalid: undefined }))} onSubmit={check} phase={st.phase} wrongChoiceIds={st.wrongChoiceIds} attemptKey={st.attemptKey} />
        </div>
        {st.invalid && <p className="mt-3 text-sm text-danger">{st.invalid}</p>}
        <div className="mt-5">
          {st.phase !== "answering" ? (
            <FeedbackPanel
              phase={st.phase}
              hint={st.feedback}
              explanation={q!.explanation}
              answer={formatAnswer(q!)}
              onTryAgain={tryAgain}
              onContinue={next}
              onNudge={() => {
                setTutorOpen(true);
                setNudgeRequest((n) => n + 1);
              }}
              onAskWhy={() => setTutorOpen(true)}
              isLast={index + 1 >= set.length}
              practice
            />
          ) : (
            <Button variant="ink" size="xl" ledge onClick={check} disabled={!canCheck} className="min-w-40">
              Check
            </Button>
          )}
        </div>
      </main>

      {tutorContext && <TutorPanel open={tutorOpen} onClose={() => setTutorOpen(false)} chatId={`practice:${current!.key}`} context={tutorContext} nudgeRequest={nudgeRequest} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-4 text-center">
      <div className="font-serif text-2xl">{value}</div>
      <div className="mt-1 text-xs font-medium text-muted">{label}</div>
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
