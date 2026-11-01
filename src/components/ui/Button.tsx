"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ink" | "gold" | "ghost" | "outline" | "danger" | "soft";
type Size = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  ledge?: boolean;
  full?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover [--ledge:var(--primary-ink)] disabled:bg-surface-3 disabled:text-muted",
  ink: "bg-ink-btn text-bg hover:bg-ink-btn-hover [--ledge:rgba(0,0,0,0.45)] disabled:bg-surface-3 disabled:text-muted",
  gold: "bg-gold text-[#2a1f00] hover:brightness-105 [--ledge:#b58600] disabled:bg-surface-3 disabled:text-muted",
  ghost: "bg-transparent text-text hover:bg-surface-2",
  outline: "bg-surface text-text border border-border-strong hover:bg-surface-2",
  danger: "bg-danger text-white hover:brightness-110 [--ledge:var(--danger-ink)]",
  soft: "bg-surface-2 text-text hover:bg-surface-3",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-6 text-base",
  xl: "h-14 px-7 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", ledge = false, full = false, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold select-none whitespace-nowrap",
        "transition-colors duration-150 disabled:cursor-not-allowed disabled:shadow-none",
        variants[variant],
        sizes[size],
        ledge && "ledge",
        full && "w-full",
        className,
      )}
      {...props}
    />
  );
});
