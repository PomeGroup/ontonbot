import * as React from "react";

import { cn } from "@/lib/utils";
import { FiAlertCircle } from "react-icons/fi";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  errors?: (string | undefined)[];
  prefix_icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <div>
      <div
        className={cn(
          "dark:text-white text-black flex h-10 bn b w-full rounded-xl bg-cn-muted p-1 xxs:px-3 xxs:py-2 text-sm ring-offset-cn-background items-center space-x-2",
          className,
          {
            "ring-red-400 ring-1": props.errors?.length,
          }
        )}
      >
        {props.prefix_icon}
        <input
          type={type}
          className="bg-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-cn-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 border-none w-full h-full"
          ref={ref}
          {...props}
        />
      </div>
      {props.errors?.map((error) => (
        <div
          className="text-red-400 pl-3 pt-1 text-sm flex items-center"
          key={error}
        >
          <FiAlertCircle className="mr-2" /> {error}
        </div>
      ))}
    </div>
  );
});
Input.displayName = "Input";

export { Input };
