import React from "react";
import { cn } from "../../lib/utils";

interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {}

export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ className, ...props }, ref) => {
    return (
      <hr
        ref={ref}
        className={cn("border-t-4 border-black w-full m-0", className)}
        {...props}
      />
    );
  }
);

Divider.displayName = "Divider";
