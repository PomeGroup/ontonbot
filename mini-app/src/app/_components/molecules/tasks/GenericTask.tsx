"use client";

import { cn } from "@/utils";
import clsx from "clsx";
import { useTheme } from "next-themes";
import Image from "next/image";
import React from "react";
import { twMerge } from "tailwind-merge";

const GenericTask: React.FC<{
  title: string;
  description: string;
  completed: boolean | undefined;
  defaultEmoji: string;
  isError?: boolean;
  errorMessage?: string;
  onClick?: (_e: any) => void;
  className?: string;
}> = ({
  title,
  description,
  completed,
  defaultEmoji,
  onClick,
  className,
  errorMessage,
  isError,
}) => {
  const { theme } = useTheme();

  const bgColorClass = clsx({
    "bg-tertiary": !completed || theme !== "light",
    "bg-[rgb(234,249,230)]": completed && theme === "light",
  });
  console.log("***- generic task completed value is: ", title, completed);
  return (
    <div
      className={cn(
        "my-4 rounded-[14px] p-4 border flex items-center justify-start cursor-pointer",

        {
          "border-confirm": completed,
          "border-separator": !completed && !isError,
          "border-destructive": isError,
        },

        className
      )}
      onClick={onClick}
    >
      <div
        className={twMerge(
          `rounded-lg mr-[10px] min-w-[40px] min-h-[40px] flex items-center justify-center`,
          bgColorClass
        )}
      >
        {completed !== undefined &&
          (isError ? (
            <Image
              className="fill-tertiary"
              src="/red-cross-mark.svg"
              alt="error"
              width={16}
              height={16}
            />
          ) : completed ? (
            <Image
              className="fill-tertiary"
              src="/checkmark.svg"
              alt="checkmark"
              width={16}
              height={16}
            />
          ) : (
            defaultEmoji
          ))}
      </div>

      <div className="flex flex-col">
        <div className="text-[17px] font-medium leading-[22px]">
          {title === "secret_phrase_onton_input" ? "Event Password" : title}
        </div>
        <div
          className={cn("text-secondary text-[14px] leading-none font-normal", {
            "text-destructive": isError,
          })}
        >
          {isError && Boolean(errorMessage) ? errorMessage : description}
        </div>
      </div>
    </div>
  );
};

export default GenericTask;
