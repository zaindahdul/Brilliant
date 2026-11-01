"use client";

import { Sparkles, X } from "lucide-react";
import type { TutorContext } from "@/lib/ai/prompt";
import { cn } from "@/lib/cn";
import { TutorChat, useTutorStatus } from "./TutorChat";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Current step context; the panel resets when `chatId` changes. */
  chatId: string;
  context: TutorContext;
  /** Increment to request a nudge automatically (e.g. from the feedback panel). */
  nudgeRequest: number;
}

export function TutorPanel({ open, onClose, chatId, context, nudgeRequest }: Props) {
  const status = useTutorStatus();
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col rounded-t-3xl border-t border-border bg-surface shadow-md transition-transform duration-200",
        "sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[400px] sm:rounded-none sm:border-l sm:border-t-0",
        open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-x-full sm:translate-y-0",
      )}
      aria-hidden={!open}
      role="dialog"
      aria-label="Tutor"
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-soft text-purple">
          <Sparkles size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Nudge · tutor</div>
          <div className="truncate text-xs text-muted">{status?.configured ? `Nudges only — never answers · ${status.model}` : "Nudges only — never answers"}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close tutor" className="rounded-full p-2 text-muted hover:bg-surface-2">
          <X size={18} />
        </button>
      </div>
      <TutorChat
        chatId={chatId}
        context={context}
        nudgeRequest={nudgeRequest}
        className="flex-1"
        intro={
          <>
            <p>
              Tell me what you&apos;ve tried, or ask for a nudge. I can see this step and your attempts, but I won&apos;t give you the answer — you&apos;ll get further by committing to a guess and checking it.
            </p>
            <ul className="list-disc pl-5">
              <li>&ldquo;Here&apos;s my thinking: … where does it go wrong?&rdquo;</li>
              <li>&ldquo;What does &lsquo;pivot in every row&rsquo; buy me here?&rdquo;</li>
              <li>&ldquo;Quiz me on this idea.&rdquo;</li>
            </ul>
          </>
        }
      />
    </div>
  );
}
