"use client";

import { useRef, useState } from "react";
import { useProgressStore } from "@/lib/progress/store";
import { normalizeProgress } from "@/lib/progress/logic";
import { useTutorStatus } from "@/components/tutor/useTutorStatus";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-[15px] font-medium">{label}</p>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cn("relative block h-7 w-12 rounded-full transition-colors", on ? "bg-primary" : "bg-surface-3")}>
      <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left]", on ? "left-6" : "left-1")} />
    </button>
  );
}

function Segmented<T extends string | number>({ value, options, onChange, label }: { value: T; options: readonly { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-full bg-surface-2 p-1">
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} className={cn("rounded-full px-3 py-1 text-sm font-medium transition-colors", value === o.value ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <p className="text-sm text-muted">{title}</p>
      <div className="mt-1 divide-y divide-border border-y border-border">{children}</div>
    </section>
  );
}

export function SettingsPanel() {
  const state = useProgressStore((s) => s.state);
  const update = useProgressStore((s) => s.updateSettings);
  const mergeIn = useProgressStore((s) => s.mergeIn);
  const resetAll = useProgressStore((s) => s.resetAll);
  const tutor = useTutorStatus();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:py-14">
      <h1 className="font-serif text-4xl">Settings</h1>

      <Section title="Learning">
        <Row label="Your name" hint="Used in the greeting. Optional.">
          <input aria-label="Your name" value={s.name ?? ""} onChange={(e) => update({ name: e.target.value })} className="h-10 w-44 rounded-xl border border-border-strong bg-surface px-3 text-[15px] focus:border-blue focus:outline-none" />
        </Row>
        <Row label="Sounds" hint="Short tones for right, wrong and lesson complete.">
          <Toggle on={s.sound} onChange={(v) => update({ sound: v })} label="Sounds" />
        </Row>
        <Row label="Hint after a miss" hint="Get a hint asks the tutor straight away after a first wrong answer.">
          <Toggle on={s.autoOfferNudge} onChange={(v) => update({ autoOfferNudge: v })} label="Hint after a miss" />
        </Row>
        <Row label="Theme">
          <Segmented
            label="Theme"
            value={s.theme}
            onChange={(v) => update({ theme: v })}
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </Row>
      </Section>

      <Section title="AI tutor">
        <Row label={tutor === null ? "Checking…" : tutor.configured ? "Connected" : "Not connected"} hint={tutor?.configured ? tutor.model : undefined}>
          <span className={cn("block h-2.5 w-2.5 rounded-full", tutor === null ? "bg-surface-3" : tutor.configured ? "bg-primary" : "bg-gold")} aria-hidden />
        </Row>
        {tutor !== null && !tutor.configured && (
          <div className="py-4">
            <pre className="whitespace-pre-wrap rounded-xl bg-surface-2 p-3 font-mono text-xs text-muted">{tutor.help}</pre>
          </div>
        )}
        <p className="py-4 text-sm text-muted">The tutor sees the step you are on and your attempts. It gives hints and walks through the method with you, and it is instructed never to give the answer.</p>
      </Section>

      <Section title="Your data">
        <p className="py-4 text-sm text-muted">
          Progress is saved in this browser and in <code>data/progress.json</code> on this computer.
        </p>
        <div className="flex flex-wrap gap-2 py-4">
          <Button variant="outline" onClick={exportJson}>
            Export
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            Import
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
            variant="ghost"
            className="text-danger!"
            onClick={() => {
              if (window.confirm("Reset ALL progress, streaks and XP? This cannot be undone.")) {
                resetAll();
                setMsg("Progress reset.");
              }
            }}
          >
            Reset everything
          </Button>
        </div>
        {msg && <p className="py-3 text-sm text-muted">{msg}</p>}
      </Section>
    </div>
  );
}
