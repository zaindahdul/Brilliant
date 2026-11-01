"use client";

import { useMemo } from "react";
import type { Step } from "@/content/types";
import type { AnswerValue } from "@/lib/check";
import { RichText } from "@/components/ui/RichText";
import { Visual } from "@/components/visuals/Visual";
import { ChoiceList } from "./inputs/ChoiceList";
import { NumericInput } from "./inputs/NumericInput";
import { MatrixInput, emptyCells } from "./inputs/MatrixInput";
import { OrderList } from "./inputs/OrderList";
import { rngFrom, shuffle } from "@/lib/random";
import type { Phase } from "./FeedbackPanel";

interface Props {
  step: Step;
  answer: AnswerValue | null;
  onAnswer: (a: AnswerValue | null) => void;
  onSubmit: () => void;
  phase: Phase;
  wrongChoiceIds: string[];
  /** Key that changes when the step should re-mount its visual (e.g. "Try again"). */
  attemptKey: number;
}

export function StepView({ step, answer, onAnswer, onSubmit, phase, wrongChoiceIds, attemptKey }: Props) {
  const locked = phase !== "answering";
  const inputState = phase === "correct" ? "correct" : phase === "wrong1" ? "wrong" : "idle";

  const choices = useMemo(() => {
    if (step.type === "mc" && step.shuffle) return shuffle(step.choices, rngFrom(step.id));
    if (step.type === "mc" || step.type === "multi") return step.choices;
    return [];
  }, [step]);

  const orderItems = useMemo(() => (step.type === "order" ? shuffle(step.items, rngFrom(step.id + ":order")) : []), [step]);

  return (
    <div className="grid gap-5">
      {step.title && <h2 className="font-serif text-2xl leading-tight sm:text-[28px]">{step.title}</h2>}
      {step.body && <RichText text={step.body} className="text-[16.5px]" />}

      {step.visual && step.type !== "goal" && (
        <div key={attemptKey}>
          <Visual spec={step.visual} disabled={locked && step.type !== "reading"} />
        </div>
      )}

      {step.type !== "reading" && (
        <div className="grid gap-4 rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-5">
          <div className="text-[16.5px] font-medium leading-relaxed">
            <RichText text={step.question} />
          </div>

          {step.type === "goal" && (
            <div key={attemptKey}>
              <Visual spec={step.visual} disabled={locked} onGoal={(satisfied, detail) => onAnswer({ kind: "goal", satisfied, detail })} />
            </div>
          )}

          {(step.type === "mc" || step.type === "multi") && (
            <ChoiceList
              choices={choices}
              multi={step.type === "multi"}
              selected={answer?.kind === "choice" ? [answer.id] : answer?.kind === "choices" ? answer.ids : []}
              onChange={(ids) => onAnswer(step.type === "mc" ? (ids[0] ? { kind: "choice", id: ids[0] } : null) : { kind: "choices", ids })}
              disabled={locked}
              wrongIds={phase === "wrong1" ? wrongChoiceIds : phase === "revealed" ? wrongChoiceIds : []}
              correctIds={phase === "correct" || phase === "revealed" ? (step.type === "mc" ? [step.correct] : step.correct) : []}
            />
          )}

          {step.type === "numeric" && (
            <NumericInput
              value={answer?.kind === "number" ? answer.text : ""}
              onChange={(text) => onAnswer({ kind: "number", text })}
              onSubmit={onSubmit}
              disabled={locked}
              placeholder={step.placeholder}
              prefix={step.prefix}
              suffix={step.suffix}
              state={inputState}
              autoFocus
            />
          )}

          {step.type === "matrix" && (
            <MatrixInput
              rows={step.answer.length}
              cols={step.answer[0].length}
              cells={answer?.kind === "matrix" ? answer.cells : emptyCells(step.answer.length, step.answer[0].length)}
              onChange={(cells) => onAnswer({ kind: "matrix", cells })}
              onSubmit={onSubmit}
              disabled={locked}
              prefix={step.prefix}
              augmented={step.augmented}
              state={inputState}
            />
          )}

          {step.type === "order" && (
            <OrderList items={orderItems} sequence={answer?.kind === "order" ? answer.ids : []} onChange={(ids) => onAnswer({ kind: "order", ids })} disabled={locked} state={inputState} />
          )}
        </div>
      )}
    </div>
  );
}
