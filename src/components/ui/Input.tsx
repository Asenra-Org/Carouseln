import React from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        <input
          ref={ref}
          className={cn(
            "bg-[var(--color-surface)] border-2 border-black rounded-none px-4 py-3",
            "font-ui text-[14px] text-black placeholder:text-[var(--color-text-muted)]",
            "focus:outline-none focus:border-black focus:shadow-[4px_4px_0px_0px_#000] focus:-translate-y-[2px] focus:-translate-x-[2px]",
            "transition-all duration-100",
            error && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-[4px_4px_0px_0px_#FF3333]",
            className
          )}
          {...props}
        />
        {error && <span className="text-[var(--color-error)] text-[12px] font-ui mt-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
