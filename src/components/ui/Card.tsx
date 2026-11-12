import { cn } from "@/lib/cn";

export function Card({ className, children, as: Tag = "div" }: { className?: string; children: React.ReactNode; as?: "div" | "section" | "article" }) {
  return <Tag className={cn("rounded-2xl border border-border bg-surface", className)}>{children}</Tag>;
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("eyebrow", className)}>{children}</div>;
}

export function Pill({ children, className, tone = "neutral" }: { children: React.ReactNode; className?: string; tone?: "neutral" | "green" | "gold" | "blue" | "danger" | "purple" }) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    green: "bg-primary-soft text-primary-ink",
    gold: "bg-gold-soft text-gold-ink",
    blue: "bg-blue-soft text-blue",
    danger: "bg-danger-soft text-danger-ink",
    purple: "bg-purple-soft text-purple",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

/** A thin progress track. */
export function Meter({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = Math.min(100, (100 * value) / Math.max(1, max));
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-surface-3", className)} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}
