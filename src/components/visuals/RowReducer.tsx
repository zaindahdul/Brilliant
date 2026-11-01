"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import type { RowReducerConfig } from "@/content/types";
import { fracMatrixToLatex, parseFrac, toFracMatrix, type FracMatrix, isZero, ONE } from "@/lib/fraction";
import { applyRowOp, isRef, isRref, rowOpToLatex, type RowOp } from "@/lib/linalg";
import { Math as TeX } from "@/components/ui/RichText";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface Props {
  config: RowReducerConfig;
  onGoal?: (satisfied: boolean, detail?: string) => void;
  disabled?: boolean;
}

type OpType = "replace" | "scale" | "swap";

/**
 * The learner performs elementary row operations themselves. Nothing is done
 * for them — the component only validates the operation and shows the result.
 */
export function RowReducer({ config, onGoal, disabled = false }: Props) {
  const initial = useMemo(() => toFracMatrix(config.matrix), [config.matrix]);
  const [history, setHistory] = useState<{ m: FracMatrix; op: RowOp | null }[]>([{ m: initial, op: null }]);
  const current = history[history.length - 1].m;
  const rows = current.length;

  const [opType, setOpType] = useState<OpType>("replace");
  const [i, setI] = useState(1);
  const [j, setJ] = useState(0);
  const [k, setK] = useState("-1");
  const [error, setError] = useState<string | null>(null);

  const inRef = isRef(current);
  const inRref = isRref(current);

  useEffect(() => {
    const target = config.target ?? "rref";
    onGoal?.(target === "free" ? true : target === "ref" ? inRef : inRref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const apply = () => {
    setError(null);
    let op: RowOp;
    if (opType === "swap") {
      if (i === j) return setError("Pick two different rows to swap.");
      op = { type: "swap", i, j };
    } else {
      const f = parseFrac(k);
      if (!f) return setError("Enter the scalar as an integer or fraction, like -2 or 3/2.");
      if (opType === "scale") {
        if (isZero(f)) return setError("Scaling a row by 0 is not allowed — it destroys information.");
        if (f.n === 1 && f.d === 1) return setError("Scaling by 1 changes nothing.");
        op = { type: "scale", i, by: f };
      } else {
        if (i === j) return setError("A replacement must use two different rows.");
        if (isZero(f)) return setError("Adding 0 times a row changes nothing.");
        op = { type: "replace", i, j, by: f };
      }
    }
    const next = applyRowOp(current, op);
    setHistory((h) => [...h, { m: next, op }]);
  };

  const undo = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  const reset = () => setHistory([{ m: initial, op: null }]);

  const rowOptions = Array.from({ length: rows }, (_, r) => r);
  const f = (x: { n: number; d: number }) => (x.d === 1 ? String(x.n) : `${x.n}/${x.d}`);
  const previewOp = (): string => {
    const fr = parseFrac(k);
    if (opType === "swap") return `R_${i + 1} \\leftrightarrow R_${j + 1}`;
    if (!fr) return "";
    if (opType === "scale") return rowOpToLatex({ type: "scale", i, by: fr });
    return rowOpToLatex({ type: "replace", i, j, by: fr });
  };
  void f;
  void ONE;

  return (
    <div className="mx-auto grid w-full max-w-[520px] gap-3">
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4">
        <div className="text-2xl">
          <TeX tex={fracMatrixToLatex(current, config.augmented, config.rightColumns ?? 1)} display />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className={cn("rounded-full px-2.5 py-0.5 font-semibold", inRef ? "bg-primary-soft text-primary-ink" : "bg-surface-2 text-muted")}>{inRef ? "✓ echelon form" : "not yet in echelon form"}</span>
          <span className={cn("rounded-full px-2.5 py-0.5 font-semibold", inRref ? "bg-primary-soft text-primary-ink" : "bg-surface-2 text-muted")}>{inRref ? "✓ reduced echelon form" : "not reduced yet"}</span>
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-semibold text-muted">{history.length - 1} op{history.length === 2 ? "" : "s"}</span>
        </div>
      </div>

      {!disabled && (
        <div className="grid gap-3 rounded-2xl border border-border bg-surface-2/60 p-3">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["replace", "Add a multiple of a row"],
                ["scale", "Scale a row"],
                ["swap", "Swap rows"],
              ] as [OpType, string][]
            ).map(([t, label]) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setOpType(t);
                  setError(null);
                }}
                className={cn("rounded-full border px-3 py-1.5 text-sm font-medium transition-colors", opType === t ? "border-text bg-text text-bg" : "border-border bg-surface hover:border-border-strong")}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>R</span>
            <RowSelect value={i} onChange={setI} options={rowOptions} />
            {opType === "replace" && (
              <>
                <span>→ R{i + 1} +</span>
                <ScalarInput value={k} onChange={setK} />
                <span>× R</span>
                <RowSelect value={j} onChange={setJ} options={rowOptions} />
              </>
            )}
            {opType === "scale" && (
              <>
                <span>→</span>
                <ScalarInput value={k} onChange={setK} />
                <span>× R{i + 1}</span>
              </>
            )}
            {opType === "swap" && (
              <>
                <span>↔ R</span>
                <RowSelect value={j} onChange={setJ} options={rowOptions} />
              </>
            )}
            <Button size="sm" variant="ink" onClick={apply} className="ml-auto">
              Apply
            </Button>
          </div>
          {previewOp() && (
            <div className="text-sm text-muted">
              Preview: <TeX tex={previewOp()} />
            </div>
          )}
          {error && <div className="text-sm text-danger">{error}</div>}

          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={undo} disabled={history.length <= 1}>
              <Undo2 size={14} /> Undo
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} disabled={history.length <= 1}>
              <RotateCcw size={14} /> Start over
            </Button>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <ol className="grid gap-1 text-sm text-muted">
          {history.slice(1).map((h, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-5 text-right">{idx + 1}.</span>
              <TeX tex={rowOpToLatex(h.op!)} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function RowSelect({ value, onChange, options }: { value: number; onChange: (v: number) => void; options: number[] }) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-9 rounded-lg border border-border-strong bg-surface px-2 font-mono text-sm" aria-label="row">
      {options.map((o) => (
        <option key={o} value={o}>
          {o + 1}
        </option>
      ))}
    </select>
  );
}

function ScalarInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} aria-label="scalar" className="h-9 w-16 rounded-lg border border-border-strong bg-surface px-2 text-center font-mono text-sm focus:border-blue focus:outline-none" />;
}
