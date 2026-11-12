"use client";

import { X } from "lucide-react";
import type { TutorContext } from "@/lib/ai/prompt";
import { cn } from "@/lib/cn";
import { TutorChat } from "./TutorChat";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Current step context; the panel resets when `chatId` changes. */
  chatId: string;
  context: TutorContext;
  /** Increment to request a hint automatically (e.g. from the action bar after a miss). */
  nudgeRequest: number;
}

/** A side panel on wide screens, a bottom sheet on narrow ones. */
export function TutorPanel({ open, onClose, chatId, context, nudgeRequest }: Props) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex h-[80dvh] flex-col rounded-t-2xl border-t border-border bg-surface shadow-md transition-transform duration-200",
        "lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:w-[400px] lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none",
        open ? "translate-y-0 lg:translate-x-0" : "invisible translate-y-full lg:translate-x-full lg:translate-y-0",
      )}
      aria-hidden={!open}
      role="dialog"
      aria-label="Tutor"
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div>
          <p className="text-[15px] font-semibold leading-tight">Tutor</p>
          <p className="text-xs text-muted">Hints only. It never gives the answer.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close tutor" className="-mr-2 rounded-full p-2 text-muted transition-colors hover:text-text">
          <X size={18} />
        </button>
      </div>
      <TutorChat
        chatId={chatId}
        context={context}
        nudgeRequest={nudgeRequest}
        className="min-h-0 flex-1"
        intro={<p>Say what you have tried, or ask for a hint. I can see this step and your attempts, and I will help you work it out yourself.</p>}
      />
    </div>
  );
}
