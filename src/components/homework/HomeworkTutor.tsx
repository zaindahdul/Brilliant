"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Pencil, Sparkles } from "lucide-react";
import type { TutorContext } from "@/lib/ai/prompt";
import { homeworkSets, sectionLessons } from "@/content/homework";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow } from "@/components/ui/Card";
import { RichText } from "@/components/ui/RichText";
import { TutorChat } from "@/components/tutor/TutorChat";
import { cn } from "@/lib/cn";

const sections = Array.from(new Set(homeworkSets.flatMap((h) => h.sections.filter((s) => s.book === "lay").map((s) => s.section))));

export function HomeworkTutor() {
  const params = useSearchParams();
  const [section, setSection] = useState(params.get("section") ?? "");
  const [problemNo, setProblemNo] = useState(params.get("problem") ?? "");
  const [text, setText] = useState("");
  const [tried, setTried] = useState("");
  const [started, setStarted] = useState<{ text: string; tried: string; section: string; problemNo: string } | null>(null);
  const [resolved, setResolved] = useState(false);
  const [session, setSession] = useState(0);

  const hwNumber = useMemo(() => homeworkSets.find((h) => h.sections.some((s) => s.section === (started?.section ?? section)))?.number, [started, section]);

  const context: TutorContext | null = useMemo(() => {
    if (!started) return null;
    return {
      courseTitle: "Linear Algebra (Math 54)",
      unitTitle: hwNumber ? `Homework ${hwNumber}` : "Homework",
      lessonTitle: started.section ? `Lay §${started.section}${started.problemNo ? ` #${started.problemNo}` : ""}` : "Textbook problem",
      stepId: `hw:${started.section || "x"}:${started.problemNo || "x"}:${session}`,
      stepType: "homework",
      body: started.text,
      question: undefined,
      attempts: started.tried.trim() ? [{ answer: `Learner's own notes on what they tried: ${started.tried.trim().slice(0, 500)}`, correct: false }] : [],
      resolved,
      nudgeLevel: 1,
      mode: "homework",
    };
  }, [started, resolved, hwNumber, session]);

  const lessons = sectionLessons[started?.section ?? section] ?? [];

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
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Section</span>
              <select value={section} onChange={(e) => setSection(e.target.value)} className="h-10 rounded-xl border border-border-strong bg-surface px-3">
                <option value="">— pick a section —</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    §{s}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Problem number (optional)</span>
              <input value={problemNo} onChange={(e) => setProblemNo(e.target.value)} placeholder="e.g. 21" className="h-10 rounded-xl border border-border-strong bg-surface px-3 focus:border-blue focus:outline-none" />
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">The problem, in your own typing</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={"e.g. Determine whether the vectors (1, 2, 3), (0, 1, 1) and (1, 3, 4) are linearly independent. Use $...$ for math if you like."}
              className="thin-scroll resize-y rounded-xl border border-border-strong bg-surface px-3 py-2 focus:border-blue focus:outline-none"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">What you&apos;ve tried so far (optional, but this is where the good nudges come from)</span>
            <textarea value={tried} onChange={(e) => setTried(e.target.value)} rows={3} placeholder="I set up the matrix and row reduced, but I got a row of zeros and I'm not sure what that means…" className="thin-scroll resize-y rounded-xl border border-border-strong bg-surface px-3 py-2 focus:border-blue focus:outline-none" />
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
                setStarted({ text: text.trim(), tried, section, problemNo });
              }}
            >
              <Sparkles size={16} /> Start with a nudge
            </Button>
          </div>
        </Card>
        {lessons.length > 0 && (
          <Card className="p-4 text-sm">
            <Eyebrow>Lessons for §{section}</Eyebrow>
            <div className="mt-2 flex flex-wrap gap-2">
              {lessons.map((id) => (
                <Link key={id} href={`/lesson/${id}`} className="rounded-full border border-border px-2.5 py-0.5 hover:border-border-strong">
                  {id.replace(/^u\d+-l\d+-/, "").replace(/-/g, " ")}
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
                  {id.replace(/^u\d+-l\d+-/, "").replace(/-/g, " ")}
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
