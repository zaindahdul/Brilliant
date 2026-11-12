"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Square } from "lucide-react";
import type { TutorContext } from "@/lib/ai/prompt";
import { Button } from "@/components/ui/Button";
import { RichText } from "@/components/ui/RichText";
import { cn } from "@/lib/cn";
import { useTutorStatus } from "./useTutorStatus";

export { useTutorStatus, type TutorStatus } from "./useTutorStatus";

/**
 * The latest step context, read by the transport when a message is sent.
 * Only one tutor chat is active at a time, so a module-level slot is enough
 * and keeps React refs out of render.
 */
let latestContext: TutorContext | null = null;

const transport = new DefaultChatTransport({
  api: "/api/tutor",
  body: () => ({ context: latestContext }),
});

export function normalizeMath(text: string): string {
  return text.replace(/\\\[((?:.|\n)*?)\\\]/g, (_, m) => `$$${m}$$`).replace(/\\\(((?:.|\n)*?)\\\)/g, (_, m) => `$${m}$`);
}

interface Props {
  /** The chat resets when this changes. */
  chatId: string;
  context: TutorContext;
  /** Increment to request a nudge automatically. */
  nudgeRequest?: number;
  /** Shown when there are no messages yet. */
  intro?: React.ReactNode;
  className?: string;
  placeholder?: string;
}

export function TutorChat({ chatId, context, nudgeRequest = 0, intro, className, placeholder }: Props) {
  const status = useTutorStatus();
  const [input, setInput] = useState("");
  const [level, setLevel] = useState(1);
  const [prevChatId, setPrevChatId] = useState(chatId);
  const listRef = useRef<HTMLDivElement>(null);
  const lastNudge = useRef(0);

  // Reset per step (React's "adjust state during render" pattern).
  if (prevChatId !== chatId) {
    setPrevChatId(chatId);
    setLevel(1);
    setInput("");
  }

  useEffect(() => {
    latestContext = { ...context, nudgeLevel: level as 1 | 2 | 3 };
  });

  const { messages, sendMessage, status: chatStatus, stop, error } = useChat({ id: chatId, transport });
  const busy = chatStatus === "submitted" || chatStatus === "streaming";

  const requestNudge = useCallback(async () => {
    const lvl = Math.min(3, level) as 1 | 2 | 3;
    latestContext = { ...context, nudgeLevel: lvl };
    const text = context.resolved
      ? "I've finished this. Help me check that I actually understand it."
      : lvl === 1
        ? "I'm stuck. Give me a small hint in the right direction, without telling me the answer."
        : lvl === 2
          ? "Still stuck. Can you be more specific about where my thinking is going wrong?"
          : "I still can't get it. Walk me through the method step by step, but let me do the calculation.";
    if (!context.resolved) setLevel((l) => Math.min(3, l + 1));
    await sendMessage({ text });
  }, [context, level, sendMessage]);

  useEffect(() => {
    if (nudgeRequest === 0 || nudgeRequest === lastNudge.current) return;
    lastNudge.current = nudgeRequest;
    if (busy) return;
    const t = window.setTimeout(() => void requestNudge(), 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nudgeRequest]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatStatus]);

  const submit = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  };

  const notConfigured = status !== null && !status.configured;
  const hintLabel = context.resolved ? "Check my understanding" : level === 1 ? "Give me a hint" : level === 2 ? "A bigger hint" : "Walk me through it";

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div ref={listRef} className="thin-scroll flex-1 overflow-y-auto px-4 py-4">
        {notConfigured ? (
          <div className="text-sm">
            <p className="font-medium">The AI tutor is not connected yet.</p>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-muted">{status?.help}</pre>
            <p className="mt-2 text-muted">The built-in hint after a miss works without it.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="grid gap-3 text-[15px] leading-relaxed text-muted">{intro}</div>
        ) : (
          <div className="grid gap-4">
            {messages.map((m) => {
              const text = m.parts
                .filter((p) => p.type === "text")
                .map((p) => (p as { text: string }).text)
                .join("");
              if (!text.trim() && m.role === "assistant") return null;
              return m.role === "user" ? (
                <div key={m.id} className="max-w-[88%] justify-self-end rounded-2xl bg-surface-2 px-3.5 py-2 text-[15px] leading-relaxed">
                  <RichText text={normalizeMath(text)} />
                </div>
              ) : (
                <div key={m.id} className="text-[15px] leading-relaxed">
                  <RichText text={normalizeMath(text)} />
                </div>
              );
            })}
            {chatStatus === "submitted" && <div className="text-sm text-muted">Thinking…</div>}
            {error && <div className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger-ink">{error.message?.trim() || "Something went wrong talking to the tutor. Try again."}</div>}
          </div>
        )}
      </div>

      <div className="grid shrink-0 gap-2 border-t border-border p-3">
        <div className="flex gap-2">
          <Button size="sm" variant="soft" onClick={() => void requestNudge()} disabled={busy || notConfigured}>
            {hintLabel}
          </Button>
          {busy && (
            <Button size="sm" variant="ghost" onClick={() => stop()}>
              <Square size={12} /> Stop
            </Button>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="flex items-end gap-2 rounded-2xl border border-border-strong bg-surface py-1.5 pl-3.5 pr-1.5 focus-within:border-blue"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            rows={1}
            aria-label={placeholder ?? "Message the tutor"}
            placeholder={placeholder ?? "Message the tutor"}
            disabled={notConfigured}
            className="thin-scroll max-h-32 min-h-8 flex-1 resize-none self-center bg-transparent py-1 text-[15px] [field-sizing:content] focus:outline-none"
          />
          <button type="submit" disabled={busy || !input.trim() || notConfigured} aria-label="Send" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-btn text-bg transition-colors disabled:bg-surface-3 disabled:text-muted">
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
}
