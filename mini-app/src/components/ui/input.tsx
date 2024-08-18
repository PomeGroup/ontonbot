import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  errors?: (string | undefined)[];
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div>
        <input
          type={type}
          className={cn(
            "flex h-11.5 bn b w-full rounded-xl bg-muted px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-none text-white",
            className,
            {
              "ring-red-500 ring-1": props.errors?.length,
            }
          )}
          ref={ref}
          {...props}
        />
        <div className="text-red-500">
          {props.errors?.map((error) => <p key={error}>{error}</p>)}
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
