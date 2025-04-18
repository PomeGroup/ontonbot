import { cn } from "@/utils";
import React, { forwardRef } from "react";

interface SectionProps {
  className?: string;
  children?: React.ReactNode;
}

const Section = forwardRef<HTMLDivElement, SectionProps>(({ children, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-4 bg-brand-bg min-h-screen", className)}
    >
      {children}
    </div>
  );
});

Section.displayName = "Section";

export default Section;
