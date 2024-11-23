import React from "react";
import { cn } from "@/lib/utils";

const Label: React.FC<{
  children: React.ReactNode;
  className?: string; // Allow passing custom class names
}> = ({ children, className }) => {
  return <div className={cn("text-[12px] font-medium text-cn-secondary", className)}>{children}</div>;
};

export default Label;
