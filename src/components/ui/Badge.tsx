import React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "success" | "error" | "neutral";
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", children, ...props }, ref) => {
    const variants = {
      gold: "bg-[var(--color-gold)] text-black border-2 border-black",
      success: "bg-[var(--color-green)] text-black border-2 border-black",
      error: "bg-[var(--color-pink)] text-black border-2 border-black",
      neutral: "bg-white text-black border-2 border-black",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-none px-3 py-1 text-[12px] font-ui font-bold uppercase tracking-[0.04em] shadow-[2px_2px_0px_0px_#000]",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
