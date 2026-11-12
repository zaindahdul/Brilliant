"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { TutorContext } from "@/lib/ai/prompt";
import { defaultHomeworkCourseId, getHomeworkCourse, homeworkCourses, homeworkTitle, lessonsForSection, prettyLessonId, sectionLabel, type HomeworkCourse, type HomeworkSet } from "@/content/homework";
import { useClock } from "@/lib/useClock";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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

const FIELD = "w-full min-w-0 rounded-xl border border-border-strong bg-surface px-3 focus:border-blue focus:outline-none";
const LINK = "underline decoration-border-strong underline-offset-4 hover:text-text";

function LessonLinks({ label, ids, titles }: { label: string; ids: string[]; titles: Record<string, string> }) {
  if (ids.length === 0) return null;
  return (
    <p className="text-sm text-muted">
      {label}{" "}
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && ", "}
          <Link href={`/lesson/${id}`} className={LINK}>
            {titles[id] ?? prettyLessonId(id)}
          </Link>
        </span>
      ))}
    </p>
  );
}

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
      <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:py-14">
        <Link href="/homework" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft size={16} /> Homework
        </Link>
        <h1 className="mt-8 font-serif text-4xl">Work a problem</h1>
        <p className="mt-2 text-muted">Type the problem from your textbook. The tutor gives hints, walks through the method with you and checks your finished solution. It will not write the solution.</p>

        <div className="mt-8 grid gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Class</span>
              <select
                value={hc.courseId}
                onChange={(e) => {
                  setPickedCourse(e.target.value);
                  setSection("");
                }}
                className={cn(FIELD, "h-11")}
              >
                {homeworkCourses.map((c) => (
                  <option key={c.courseId} value={c.courseId}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Section</span>
              <select
                value={section}
                onChange={(e) => {
                  setSection(e.target.value);
                  setPickedCourse(hc.courseId);
                }}
                className={cn(FIELD, "h-11")}
              >
                <option value="">Any</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {sectionLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">
                Problem number <span className="font-normal text-muted">(optional)</span>
              </span>
              <input value={problemNo} onChange={(e) => setProblemNo(e.target.value)} maxLength={24} className={cn(FIELD, "h-11")} />
            </label>
          </div>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">The problem</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} maxLength={8000} className={cn(FIELD, "thin-scroll resize-y py-2.5 text-[15px]")} />
            <span className="text-muted">Typing it out is part of reading it carefully. Math can go between dollar signs.</span>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">
              What you have tried <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea value={tried} onChange={(e) => setTried(e.target.value)} rows={3} className={cn(FIELD, "thin-scroll resize-y py-2.5 text-[15px]")} />
            <span className="text-muted">Even a wrong attempt gives the tutor something precise to respond to.</span>
          </label>
          <div>
            <Button
              variant="primary"
              size="xl"
              ledge
              disabled={text.trim().length < 10}
              onClick={() => {
                setResolved(false);
                setSession((s) => s + 1);
                setStarted({ courseId: hc.courseId, hw: hwParam, text: text.trim(), tried, section, problemNo: problemNo.trim().slice(0, 24) });
              }}
            >
              Start
            </Button>
          </div>
        </div>

        {section && (
          <div className="mt-10">
            <LessonLinks label={`Lessons for ${sectionLabel(section)}:`} ids={lessons} titles={lessonTitles} />
          </div>
        )}
      </div>
    );
  }

  const modeButton = (active: boolean) => cn("flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors", active ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text");

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-8 lg:grid-cols-[1fr_1.1fr]">
      <div className="grid content-start gap-5">
        <button type="button" onClick={() => setStarted(null)} className="inline-flex items-center gap-1 justify-self-start text-sm text-muted hover:text-text">
          <ArrowLeft size={16} /> Edit the problem
        </button>
        <div>
          <p className="text-sm text-muted">{context?.lessonTitle}</p>
          <div className="mt-2 text-base">
            <RichText text={started.text} />
          </div>
          {started.tried.trim() && (
            <div className="mt-4 rounded-xl bg-surface-2 p-4 text-[15px]">
              <p className="mb-1 text-sm text-muted">What I have tried</p>
              <RichText text={started.tried} />
            </div>
          )}
        </div>
        <div>
          <div role="group" aria-label="Mode" className="flex rounded-full bg-surface-2 p-1">
            <button type="button" aria-pressed={!resolved} onClick={() => setResolved(false)} className={modeButton(!resolved)}>
              Still working
            </button>
            <button type="button" aria-pressed={resolved} onClick={() => setResolved(true)} className={modeButton(resolved)}>
              Check my work
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">{resolved ? "Paste your finished solution. The tutor goes through it step by step and stops at the first error." : "Hints only. Commit to an attempt before asking for the next one."}</p>
        </div>
        <LessonLinks label="Related lessons:" ids={lessons} titles={lessonTitles} />
      </div>
      <Card className="flex h-[75dvh] flex-col overflow-hidden">
        {context && (
          <TutorChat
            chatId={context.stepId + (resolved ? ":check" : ":work")}
            context={context}
            className="min-h-0 flex-1"
            placeholder={resolved ? "Paste your solution" : "Message the tutor"}
            intro={<p>{resolved ? "Paste your finished solution and I will go through it with you step by step." : "Tell me what you have tried, or ask for a hint. I will not write the solution, but I will help you get there."}</p>}
          />
        )}
      </Card>
    </div>
  );
}
