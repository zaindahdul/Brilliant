"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Upload, Trash2 } from "lucide-react";
import { useProgressStore } from "@/lib/progress/store";
import { normalizeProgress } from "@/lib/progress/logic";
import { Button } from "@/components/ui/Button";
import { Card, Eyebrow, Pill } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-primary" : "bg-surface-3")}>
        <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform", on ? "left-6" : "left-1")} />
      </button>
    </label>
  );
}

export function SettingsPanel() {
  const state = useProgressStore((s) => s.state);
  const update = useProgressStore((s) => s.updateSettings);
  const mergeIn = useProgressStore((s) => s.mergeIn);
  const resetAll = useProgressStore((s) => s.resetAll);
  const [tutor, setTutor] = useState<{ configured: boolean; provider?: string; model?: string; help?: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tutor/status", { cache: "no-store" })
      .then((r) => r.json())
      .then(setTutor)
      .catch(() => setTutor({ configured: false, help: "Could not reach /api/tutor/status" }));
  }, []);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nudge-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const parsed = normalizeProgress(JSON.parse(await file.text()));
      if (!parsed) throw new Error("not a progress file");
      mergeIn(parsed);
      setMsg("Imported and merged with your current progress.");
    } catch {
      setMsg("That file doesn't look like a Nudge progress export.");
    }
  };

  const s = state.settings;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 px-4 py-8">
      <div>
        <Eyebrow>Settings</Eyebrow>
        <h1 className="mt-1 font-serif text-4xl">Make it yours</h1>
      </div>

      <Card className="grid gap-1 p-5">
        <Eyebrow className="mb-2">Learning</Eyebrow>
        <label className="flex items-center justify-between gap-4 py-2">
          <span className="font-medium">Your name</span>
          <input value={s.name ?? ""} onChange={(e) => update({ name: e.target.value })} placeholder="optional" className="h-10 w-48 rounded-xl border border-border-strong bg-surface px-3 text-sm focus:border-blue focus:outline-none" />
        </label>
        <Toggle on={s.sound} onChange={(v) => update({ sound: v })} label="Sounds" hint="Short tones for correct, wrong and lesson complete." />
        <Toggle on={s.autoOfferNudge} onChange={(v) => update({ autoOfferNudge: v })} label="Offer a nudge after a miss" hint="Shows the 'Get a nudge' button in the try-again panel." />
        <div className="flex items-center justify-between gap-4 py-2">
          <span>
            <span className="font-medium">Default level-check length</span>
            <span className="block text-sm text-muted">Quick check (5) or practice (15).</span>
          </span>
          <div className="flex rounded-full bg-surface-2 p-1">
            {([5, 15] as const).map((n) => (
              <button key={n} type="button" onClick={() => update({ practiceLength: n })} className={cn("rounded-full px-3 py-1 text-sm font-semibold", s.practiceLength === n ? "bg-text text-bg" : "text-muted")}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="grid gap-3 p-5">
        <Eyebrow>Appearance</Eyebrow>
        <div className="flex gap-2">
          {(["system", "light", "dark"] as const).map((t) => (
            <button key={t} type="button" onClick={() => update({ theme: t })} className={cn("rounded-full border px-4 py-2 text-sm font-medium capitalize", s.theme === t ? "border-text bg-text text-bg" : "border-border bg-surface hover:border-border-strong")}>
              {t}
            </button>
          ))}
        </div>
      </Card>

      <Card className="grid gap-3 p-5">
        <Eyebrow>AI tutor</Eyebrow>
        {tutor === null ? (
          <p className="text-sm text-muted">Checking…</p>
        ) : tutor.configured ? (
          <p className="text-sm">
            <Pill tone="green">Connected</Pill> <span className="text-muted">
              {tutor.provider} · {tutor.model}
            </span>
          </p>
        ) : (
          <div className="text-sm">
            <Pill tone="gold">Not connected</Pill>
            <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 font-mono text-xs text-muted">{tutor.help}</pre>
          </div>
        )}
        <p className="text-sm text-muted">
          The tutor receives the current step, your attempts, and (privately) the answer so it can diagnose — its instructions forbid revealing it. Change the model with <code>AI_MODEL</code> in <code>.env.local</code>.
        </p>
      </Card>

      <Card className="grid gap-3 p-5">
        <Eyebrow>Your data</Eyebrow>
        <p className="text-sm text-muted">
          Progress lives in this browser and in <code>data/progress.json</code> on your machine. Export a backup before switching computers.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportJson}>
            <Download size={16} /> Export JSON
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Import JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importJson(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm("Reset ALL progress, streaks and XP? This cannot be undone.")) {
                resetAll();
                setMsg("Progress reset.");
              }
            }}
          >
            <Trash2 size={16} /> Reset everything
          </Button>
        </div>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </Card>
    </div>
  );
}
