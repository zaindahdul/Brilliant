"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ink" | "gold" | "ghost" | "outline" | "danger" | "soft";
type Size = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** A small press-down on click, for the one primary action on a screen. */
  ledge?: boolean;
  full?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover disabled:bg-surface-3 disabled:text-muted",
  ink: "bg-ink-btn text-bg hover:bg-ink-btn-hover disabled:bg-surface-3 disabled:text-muted",
  gold: "bg-gold text-[#2a1f00] hover:brightness-105 disabled:bg-surface-3 disabled:text-muted",
  ghost: "bg-transparent text-text hover:bg-surface-2 disabled:text-muted",
  outline: "bg-transparent text-text border border-border-strong hover:bg-surface-2 disabled:text-muted",
  danger: "bg-danger text-white hover:brightness-110",
  soft: "bg-surface-2 text-text hover:bg-surface-3 disabled:text-muted",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-10 px-4 text-[15px]",
  lg: "h-11 px-5 text-[15px]",
  xl: "h-12 px-6 text-base",
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
        "transition-colors duration-150 disabled:cursor-not-allowed",
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
