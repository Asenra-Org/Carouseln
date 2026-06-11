import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-black text-[14px] uppercase tracking-wide transition-all duration-150 ease-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-[#FFB800] text-black border-4 border-black px-6 py-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000]",
      secondary:
        "bg-white text-black border-4 border-black px-6 py-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000]",
      outline:
        "bg-white text-black border-4 border-black px-6 py-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000]",
      ghost:
        "bg-transparent text-black px-4 py-2 border-2 border-transparent hover:border-black hover:bg-gray-50",
      destructive:
        "bg-red-600 text-white border-4 border-black px-6 py-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
