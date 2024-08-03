import { cn } from "@/utils";
import React from "react";

const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "my-4 rounded-[14px] p-4 border border-separator flex items-center justify-start",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Card;
