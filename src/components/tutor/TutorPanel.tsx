"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles, Square, X } from "lucide-react";
import type { TutorContext } from "@/lib/ai/prompt";
import { Button } from "@/components/ui/Button";
import { RichText } from "@/components/ui/RichText";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Current step context; the panel resets when `chatId` changes. */
  chatId: string;
  context: TutorContext;
  /** Increment to request a nudge automatically (e.g. from the feedback panel). */
  nudgeRequest: number;
}

interface Status {
  configured: boolean;
  provider?: string;
  model?: string;
  help?: string;
}

let statusCache: Status | null = null;

/**
 * The latest step context, read by the transport when a message is sent.
 * Only one tutor panel exists at a time, so a module-level slot is enough and
 * keeps React refs out of render.
 */
let latestContext: TutorContext | null = null;

const transport = new DefaultChatTransport({
  api: "/api/tutor",
  body: () => ({ context: latestContext }),
});

function normalizeMath(text: string): string {
  return text.replace(/\\\[((?:.|\n)*?)\\\]/g, (_, m) => `$$${m}$$`).replace(/\\\(((?:.|\n)*?)\\\)/g, (_, m) => `$${m}$`);
}

export function TutorPanel({ open, onClose, chatId, context, nudgeRequest }: Props) {
  const [status, setStatus] = useState<Status | null>(statusCache);
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

  useEffect(() => {
    if (statusCache) return;
    fetch("/api/tutor/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: Status) => {
        statusCache = s;
        setStatus(s);
      })
      .catch(() => setStatus({ configured: false, help: "Could not reach the tutor API." }));
  }, []);

  const { messages, sendMessage, status: chatStatus, stop, error } = useChat({ id: chatId, transport });
  const busy = chatStatus === "submitted" || chatStatus === "streaming";

  const requestNudge = useCallback(async () => {
    const lvl = Math.min(3, level) as 1 | 2 | 3;
    latestContext = { ...context, nudgeLevel: lvl };
    const text = context.resolved
      ? "I've finished this step. Help me check that I actually understand it."
      : lvl === 1
        ? "I'm stuck. Give me a small nudge in the right direction — don't tell me the answer."
        : lvl === 2
          ? "Still stuck. Can you be more specific about where my thinking is going wrong?"
          : "I still can't get it. Walk me through the method step by step, but let me do the calculation.";
    if (!context.resolved) setLevel((l) => Math.min(3, l + 1));
    await sendMessage({ text });
  }, [context, level, sendMessage]);

  // External nudge request (from the "Get a nudge" button in the feedback panel).
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

      <div ref={listRef} className="thin-scroll flex-1 overflow-y-auto px-4 py-3">
        {notConfigured ? (
          <div className="rounded-2xl border border-border bg-surface-2 p-3 text-sm">
            <p className="font-semibold">The AI tutor isn&apos;t connected yet.</p>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-muted">{status?.help}</pre>
            <p className="mt-2 text-muted">Until then, the built-in hints after a miss still work.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="grid gap-3 text-sm text-muted">
            <p>
              Tell me what you&apos;ve tried, or ask for a nudge. I can see this step and your attempts, but I won&apos;t give you the answer — you&apos;ll get further by committing to a guess and checking it.
            </p>
            <ul className="list-disc pl-5">
              <li>&ldquo;Here&apos;s my thinking: … where does it go wrong?&rdquo;</li>
              <li>&ldquo;What does &lsquo;pivot in every row&rsquo; buy me here?&rdquo;</li>
              <li>&ldquo;Quiz me on this idea.&rdquo;</li>
            </ul>
          </div>
        ) : (
          <div className="grid gap-3">
            {messages.map((m) => {
              const text = m.parts
                .filter((p) => p.type === "text")
                .map((p) => (p as { text: string }).text)
                .join("");
              if (!text.trim() && m.role === "assistant") return null;
              return (
                <div key={m.id} className={cn("max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-relaxed", m.role === "user" ? "justify-self-end bg-blue-soft" : "justify-self-start bg-surface-2")}>
                  <RichText text={normalizeMath(text)} />
                </div>
              );
            })}
            {chatStatus === "submitted" && <div className="justify-self-start rounded-2xl bg-surface-2 px-3.5 py-2.5 text-sm text-muted">thinking…</div>}
            {error && <div className="rounded-2xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger-ink">Something went wrong talking to the tutor. Try again.</div>}
          </div>
        )}
      </div>

      <div className="grid gap-2 border-t border-border p-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="soft" onClick={() => void requestNudge()} disabled={busy || notConfigured}>
            <Sparkles size={14} /> {context.resolved ? "Check my understanding" : level === 1 ? "Give me a nudge" : level === 2 ? "A bigger nudge" : "Walk me through it"}
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
          className="flex items-end gap-2"
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
            rows={2}
            placeholder={context.resolved ? "Explain in your own words why that's the answer…" : "What have you tried so far?"}
            disabled={notConfigured}
            className="thin-scroll min-h-11 flex-1 resize-none rounded-2xl border border-border-strong bg-surface px-3 py-2 text-sm focus:border-blue focus:outline-none"
          />
          <Button type="submit" size="md" variant="ink" disabled={busy || !input.trim() || notConfigured} aria-label="Send">
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
}
