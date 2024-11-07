"use client";

import { ReactNode } from "react";

export type AttributeItemProps = {
  label: string;
  value: ReactNode;
};

const AttributeItem = ({ label, value }: AttributeItemProps) => {
  return (
    <div className="flex h-10 w-full items-center justify-between">
      <span className="text-telegram-6-10-subtitle-text-color type-body type-body-1">
        {label}
      </span>
      <span className="text-telegram-text-color type-body type-body-1 line-clamp-1">
        {value}
      </span>
    </div>
  );
};

export default AttributeItem;
