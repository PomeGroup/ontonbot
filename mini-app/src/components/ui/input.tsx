import * as React from "react";

import { cn } from "@/lib/utils";
import { FiAlertCircle } from "react-icons/fi";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  errors?: string[] | string;
  prefix_icon?: React.ReactNode;
  label?: React.ReactNode;
  info?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  const errors = React.useMemo(
    () => (props.errors ? (Array.isArray(props.errors) ? props.errors : [props.errors]) : []).filter(Boolean),
    [props.errors]
  );

  return (
    <div>
      {props.label && (
        <label
          className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
          htmlFor={props.name}
        >
          {props.label}
        </label>
      )}
      <div
        className={cn(
          "dark:text-white text-black flex h-10 bn b w-full rounded-2lg bg-brand-divider p-1 xxs:px-3 xxs:py-2 text-sm ring-offset-cn-background items-center space-x-2",
          className,
          {
            "ring-red-400 ring-1": errors?.length > 0,
          }
        )}
      >
        <label htmlFor="input">{props.prefix_icon}</label>
        <input
          type={type}
          name={props.name}
          className="bg-transparent file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-brand-muted placeholder:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 border-none w-full h-full"
          ref={ref}
          {...props}
        />
      </div>
      {props.info && (
        <div className="mt-0.5 px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal text-[#3C3C4399]">
          {props.info}
        </div>
      )}
      {errors?.map((error, index) => (
        <div
          className="text-red-400 pl-3 pt-1 text-sm flex items-center"
          key={index}
        >
          <FiAlertCircle className="mr-2" /> {error}
        </div>
      ))}
    </div>
  );
});
Input.displayName = "Input";

export { Input };
