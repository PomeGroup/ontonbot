import { cn } from "@/utils";
import { ChangeEventHandler, HTMLProps, ReactNode, useEffect, useRef, useState } from "react";
import styles from './index.module.css';

export function OntonInput({
  label,
  value,
  className,
  error,
  startAdornment,
  ...props
}: HTMLProps<HTMLInputElement> & { error?: string, startAdornment?: ReactNode }) {
  return (
    <div className={className}>
      <div className={styles.wrapper}>
        {startAdornment}
        <InternalInputWrapper
          active={!!value}
          label={label || ''}
          error={!!error}
          className="w-full"
        >
          <input
            type="text"
            className="w-full h-11 leading-5.5 bg-transparent px-4 pt-4 pb-1 focus:outline-none"
            value={value}
            {...props}
          />
        </InternalInputWrapper>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export function OntonExpandableInput({
  label,
  value,
  name,
  onChange,
  className,
}: {
  label: string;
  value: string;
  name: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  className?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Adjust height based on content
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [value]);

  return (
    <InternalInputWrapper
      className={className}
      label={label}
      active={isFocused || !!value}
    >
      <textarea
        name={name}
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        rows={1}
        className="w-full leading-5.5 px-4 pt-4 pb-1 bg-transparent resize-none focus:outline-none"
      />
    </InternalInputWrapper>
  );
};

function InternalInputWrapper({
  className,
  active,
  label,
  children,
  error,
}: {
  className?: string;
  active: boolean;
  label: string;
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div className={className}>
      <div className={cn("relative w-full bg-[#7474801F] !rounded-[10px] border", error && "border-red-500")}>
        <label
          className={cn(
            "text-base absolute left-4 top-3 text-gray-500 pointer-events-none !leading-[16px]",
            "transition-transform transform-gpu origin-top-left duration-200 antialiased",
            styles.wrapperLabel,
            active && styles.wrapperLabelActive
          )}
        >
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}
