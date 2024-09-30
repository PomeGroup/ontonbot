"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type AttributeItemProps = {
  label: string;
  value: ReactNode;
  isDate?: boolean;
};

const AttributeItem = ({
  label,
  value,
  isDate = false,
}: AttributeItemProps) => {
  return (
    <div
      className={cn(
        "flex min-h-10 h-full w-full items-center justify-between px-2 gap-5",
        isDate && "bg-secondary rounded-lg"
      )}
    >
      <span className="text-telegram-6-10-subtitle-text-color type-body type-body-1">
        {label}
      </span>
      <span
        className={cn(
          "text-telegram-text-color type-body type-body-1 flex-1 text-right",
          "overflow-hidden text-ellipsis"
        )}
        style={{ wordWrap: "break-word" }}
      >
        {value}
      </span>
    </div>
  );
};

export default AttributeItem;
