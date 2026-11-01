"use client";

import { Check, Lightbulb, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Math as TeX, RichText } from "@/components/ui/RichText";
import { cn } from "@/lib/cn";

export type Phase = "answering" | "wrong1" | "correct" | "revealed";

interface Props {
  phase: Exclude<Phase, "answering">;
  hint?: string;
  explanation: string;
  answer?: { kind: "text" | "math"; value: string };
  onTryAgain: () => void;
  onContinue: () => void;
  onNudge?: () => void;
  onAskWhy?: () => void;
  isLast?: boolean;
  /** In practice mode we don't show the targeted hint on the first miss. */
  practice?: boolean;
}

export function FeedbackPanel({ phase, hint, explanation, answer, onTryAgain, onContinue, onNudge, onAskWhy, isLast, practice }: Props) {
  const good = phase === "correct";
  return (
    <div
      className={cn(
        "slide-up rounded-3xl border-2 p-4 sm:p-5",
        good ? "border-primary/50 bg-primary-soft" : phase === "wrong1" ? "border-danger/40 bg-danger-soft" : "border-border bg-surface-2",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-white", good ? "bg-primary" : phase === "wrong1" ? "bg-danger" : "bg-text")}>
          {good ? <Check size={16} strokeWidth={3} /> : phase === "wrong1" ? <RotateCcw size={15} strokeWidth={3} /> : <Lightbulb size={15} strokeWidth={2.5} />}
        </span>
        <span className={cn("eyebrow", good ? "text-primary-ink" : phase === "wrong1" ? "text-danger-ink" : "text-text")}>
          {good ? "Correct" : phase === "wrong1" ? "Try once more" : "Keep learning"}
        </span>
      </div>

      {phase === "wrong1" && (
        <div className="text-[15px] leading-relaxed">
          {practice ? <p>Not quite. Take another look — you get one more try.</p> : hint ? <RichText text={hint} /> : <p>Not quite. Re-read the question and try again.</p>}
        </div>
      )}

      {phase === "revealed" && (
        <div className="grid gap-2 text-[15px] leading-relaxed">
          {answer && (
            <p className="font-medium">
              The answer is {answer.kind === "math" ? <TeX tex={answer.value} /> : <RichText text={answer.value} inline />}.
            </p>
          )}
          <RichText text={explanation} />
        </div>
      )}

      {phase === "correct" && (
        <div className="text-[15px] leading-relaxed">
          <RichText text={explanation} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {phase === "wrong1" ? (
          <>
            <Button variant="ink" size="lg" ledge onClick={onTryAgain} autoFocus>
              Try again
            </Button>
            {onNudge && (
              <Button variant="outline" size="lg" onClick={onNudge}>
                <Sparkles size={16} /> Get a nudge
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant={good ? "primary" : "ink"} size="lg" ledge onClick={onContinue} autoFocus>
              {isLast ? "Finish lesson" : "Continue"}
            </Button>
            {onAskWhy && (
              <Button variant="ghost" size="lg" onClick={onAskWhy}>
                <Sparkles size={16} /> {good ? "Explain it back" : "Talk it through"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
