"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Pencil, Sparkles } from "lucide-react";
import type { TutorContext } from "@/lib/ai/prompt";
import { defaultHomeworkCourseId, getHomeworkCourse, homeworkCourses, homeworkTitle, lessonsForSection, prettyLessonId, sectionLabel, type HomeworkCourse, type HomeworkSet } from "@/content/homework";
import { useClock } from "@/lib/useClock";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow } from "@/components/ui/Card";
import { RichText } from "@/components/ui/RichText";
import { TutorChat } from "@/components/tutor/TutorChat";
import { cn } from "@/lib/cn";

/** Sections the tutor takes problems from: the class's own textbook (Math 54's ODE sections are left out). */
function tutorSections(hc: HomeworkCourse): string[] {
  return Array.from(new Set(hc.sets.flatMap((h) => h.sections.filter((s) => s.book === hc.book).map((s) => s.section))));
}

/** The class a link asks for: `?course=`, else whichever class assigns `?section=` (links from before there were two). */
function courseFromParams(course: string | null, section: string | null): string | null {
  if (getHomeworkCourse(course)) return course;
  if (section === null) return null;
  return homeworkCourses.find((hc) => tutorSections(hc).includes(section))?.courseId ?? null;
}

/** The set a problem belongs to: the one the link named (`?hw=` id, or number in older links) if it assigns the section, else the first that does. */
function findSet(hc: HomeworkCourse, section: string, hw: string | null): HomeworkSet | undefined {
  const assigns = (h: HomeworkSet) => h.sections.some((s) => s.section === section);
  return hc.sets.find((h) => (h.id === hw || (h.number !== undefined && String(h.number) === hw)) && assigns(h)) ?? hc.sets.find(assigns);
}

const examples: Record<string, { number: string; problem: string; tried: string }> = {
  "linear-algebra": {
    number: "e.g. 21",
    problem: "e.g. Determine whether the vectors (1, 2, 3), (0, 1, 1) and (1, 3, 4) are linearly independent. Use $...$ for math if you like.",
    tried: "I set up the matrix and row reduced, but I got a row of zeros and I'm not sure what that means…",
  },
  "solid-mechanics": {
    number: "e.g. 2.9",
    problem: "e.g. A steel bar (E = 200 GPa, A = 100 mm²) is built in at both ends and carries a 10 kN axial load at its midpoint. Find the support reactions. Use $...$ for math if you like.",
    tried: "I drew the free-body diagram and wrote equilibrium, but there are two unknown reactions and only one equation…",
  },
};

export function HomeworkTutor({ lessonTitles = {} }: { lessonTitles?: Record<string, string> }) {
  const params = useSearchParams();
  const clock = useClock();
  // Until the learner picks a class (or a link names one), use the one with the nearest deadline.
  const [pickedCourse, setPickedCourse] = useState(() => courseFromParams(params.get("course"), params.get("section")));
  const hc = getHomeworkCourse(pickedCourse ?? defaultHomeworkCourseId(clock.today ?? "")) ?? homeworkCourses[0];
  const sections = tutorSections(hc);
  const [sectionPick, setSection] = useState(params.get("section") ?? "");
  const section = sections.includes(sectionPick) ? sectionPick : "";
  const [problemNo, setProblemNo] = useState(params.get("problem") ?? "");
  const [text, setText] = useState("");
  const [tried, setTried] = useState("");
  const [started, setStarted] = useState<{ courseId: string; hw: string | null; text: string; tried: string; section: string; problemNo: string } | null>(null);
  const [resolved, setResolved] = useState(false);
  const [session, setSession] = useState(0);
  const hwParam = params.get("hw");
  const example = examples[hc.courseId] ?? examples["linear-algebra"];

  const context: TutorContext | null = useMemo(() => {
    if (!started) return null;
    const course = getHomeworkCourse(started.courseId) ?? homeworkCourses[0];
    const set = findSet(course, started.section, started.hw);
    return {
      courseId: course.courseId,
      courseTitle: course.tutorTitle,
      unitTitle: set ? homeworkTitle(set) : "Homework",
      lessonTitle: started.section ? `${course.bookLabel} ${sectionLabel(started.section)}${started.problemNo ? ` #${started.problemNo}` : ""}` : "Textbook problem",
      stepId: `hw:${course.courseId}:${started.section || "x"}:${started.problemNo || "x"}:${session}`,
      stepType: "homework",
      body: started.text,
      question: undefined,
      attempts: started.tried.trim() ? [{ answer: `Learner's own notes on what they tried: ${started.tried.trim().slice(0, 500)}`, correct: false }] : [],
      resolved,
      nudgeLevel: 1,
      mode: "homework",
    };
  }, [started, resolved, session]);

  const lessons = started ? lessonsForSection(started.section, (getHomeworkCourse(started.courseId) ?? hc).sectionLessons) : lessonsForSection(section, hc.sectionLessons);

  if (!started) {
    return (
      <div className="mx-auto grid w-full max-w-2xl gap-5 px-4 py-8">
        <Link href="/homework" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft size={16} /> Homework
        </Link>
        <div>
          <Eyebrow>Homework tutor</Eyebrow>
          <h1 className="mt-1 font-serif text-3xl">Bring a problem</h1>
          <p className="mt-2 text-muted">
            Type the problem from your textbook (typing it is part of reading it carefully). The tutor will nudge, not solve. When you think you&apos;re done, switch to <em>check my work</em>.
          </p>
        </div>
        <Card className="grid gap-4 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Class</span>
              <select
                value={hc.courseId}
                onChange={(e) => {
                  setPickedCourse(e.target.value);
                  setSection("");
                }}
                className="h-10 rounded-xl border border-border-strong bg-surface px-3"
              >
                {homeworkCourses.map((c) => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Section</span>
              <select
                value={section}
                onChange={(e) => {
                  setSection(e.target.value);
                  setPickedCourse(hc.courseId);
                }}
                className="h-10 rounded-xl border border-border-strong bg-surface px-3"
              >
                <option value="">— pick a section —</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {sectionLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Problem number (optional)</span>
              <input value={problemNo} onChange={(e) => setProblemNo(e.target.value)} maxLength={24} placeholder={example.number} className="h-10 rounded-xl border border-border-strong bg-surface px-3 focus:border-blue focus:outline-none" />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">The problem, in your own typing</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={8000}
              placeholder={example.problem}
              className="thin-scroll resize-y rounded-xl border border-border-strong bg-surface px-3 py-2 focus:border-blue focus:outline-none"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">What you&apos;ve tried so far (optional, but this is where the good nudges come from)</span>
            <textarea value={tried} onChange={(e) => setTried(e.target.value)} rows={3} placeholder={example.tried} className="thin-scroll resize-y rounded-xl border border-border-strong bg-surface px-3 py-2 focus:border-blue focus:outline-none" />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">Problem text is sent only to the AI provider you configured, together with the tutor instructions.</p>
            <Button
              variant="ink"
              ledge
              disabled={text.trim().length < 10}
              onClick={() => {
                setResolved(false);
                setSession((s) => s + 1);
                setStarted({ courseId: hc.courseId, hw: hwParam, text: text.trim(), tried, section, problemNo: problemNo.trim().slice(0, 24) });
              }}
            >
              <Sparkles size={16} /> Start with a nudge
            </Button>
          </div>
        </Card>
        {lessons.length > 0 && (
          <Card className="p-4 text-sm">
            <Eyebrow>Lessons for {sectionLabel(section)}</Eyebrow>
            <div className="mt-2 flex flex-wrap gap-2">
              {lessons.map((id) => (
                <Link key={id} href={`/lesson/${id}`} className="rounded-full border border-border px-2.5 py-0.5 hover:border-border-strong">
                  {lessonTitles[id] ?? prettyLessonId(id)}
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="grid content-start gap-3">
        <button type="button" onClick={() => setStarted(null)} className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft size={16} /> Edit the problem
        </button>
        <Card className="p-5">
          <Eyebrow>{context?.lessonTitle}</Eyebrow>
          <div className="mt-2 text-[15.5px]">
            <RichText text={started.text} />
          </div>
          {started.tried.trim() && (
            <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
              <div className="eyebrow mb-1">What I&apos;ve tried</div>
              <RichText text={started.tried} />
            </div>
          )}
        </Card>
        <Card className="grid gap-2 p-4">
          <Eyebrow>Mode</Eyebrow>
          <div className="flex rounded-full bg-surface-2 p-1">
            <button type="button" onClick={() => setResolved(false)} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold", !resolved ? "bg-text text-bg" : "text-muted")}>
              <Pencil size={14} /> Still working
            </button>
            <button type="button" onClick={() => setResolved(true)} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold", resolved ? "bg-primary text-white" : "text-muted")}>
              <CheckCircle2 size={14} /> Check my work
            </button>
          </div>
          <p className="text-xs text-muted">{resolved ? "Paste your finished solution. The tutor verifies step by step and stops at the first error." : "Nudges only. Commit to an attempt before asking for the next one."}</p>
        </Card>
        {lessons.length > 0 && (
          <Card className="p-4 text-sm">
            <Eyebrow>Related lessons</Eyebrow>
            <div className="mt-2 flex flex-wrap gap-2">
              {lessons.map((id) => (
                <Link key={id} href={`/lesson/${id}`} className="rounded-full border border-border px-2.5 py-0.5 hover:border-border-strong">
                  {lessonTitles[id] ?? prettyLessonId(id)}
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
      <Card className="flex min-h-[70dvh] flex-col overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-soft text-purple">
            <Sparkles size={16} />
          </span>
          <div className="text-sm font-semibold">Nudge · homework tutor</div>
        </div>
        {context && (
          <TutorChat
            chatId={context.stepId + (resolved ? ":check" : ":work")}
            context={context}
            className="flex-1"
            placeholder={resolved ? "Paste your solution here…" : "What have you tried? Where exactly are you stuck?"}
            intro={
              <>
                <p>Start by telling me what you&apos;ve tried — even a wrong attempt gives me something precise to react to. Or ask for a nudge.</p>
                <p>I won&apos;t write the solution. When you&apos;ve finished it yourself, flip to &ldquo;check my work&rdquo; and I&apos;ll go through it step by step.</p>
              </>
            }
          />
        )}
      </Card>
    </div>
  );
}
