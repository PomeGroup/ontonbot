import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  errors?: (string | undefined)[];
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <>
        <textarea
          className={cn(
            "flex h-32 w-full rounded-xl bg-muted px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-none text-white",
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
      </>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
