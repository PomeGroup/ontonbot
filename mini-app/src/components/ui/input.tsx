import * as React from "react";

import { cn } from "@/lib/utils";
import { FiAlertCircle } from "react-icons/fi";
import { KeyIcon } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  errors?: (string | undefined)[];
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex h-11.5 bn b w-full rounded-xl bg-muted p-1 xxs:px-3 xxs:py-2 text-sm ring-offset-background text-black items-center space-x-2",
          className,
          {
            "ring-red-300 ring-1": props.errors?.length,
          }
        )}
      >
        <KeyIcon />
        <input
          type={type}
          className="bg-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 border-none w-full h-full"
          ref={ref}
          {...props}
        />
        {props.errors?.map((error) => (
          <div
            className="text-red-300 pl-3 pt-1 text-sm flex items-center"
            key={error}
          >
            <FiAlertCircle className="mr-2" /> {error}
          </div>
        ))}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
