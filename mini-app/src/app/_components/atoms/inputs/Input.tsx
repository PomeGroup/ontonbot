import { cn } from "@/utils";
import React, { ChangeEvent, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  type = "text",
  value,
  onChange,
  placeholder = "",
  className = "",
  ...rest // captures all other props
}) => {
  const inputClass = cn(
    "w-full h-10 rounded-lg border border-separator p-2",
    className
  );

  return (
    <input
      className={inputClass}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...rest} // spread any additional props
    />
  );
};

export default Input;
