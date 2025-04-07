import Typography from "@/components/Typography";
import { cn } from "@/utils";
import React, { forwardRef } from "react";

interface SectionProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

const Section = forwardRef<HTMLDivElement, SectionProps>(({ title, children, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-4 bg-brand-bg min-h-screen", className)}
    >
      <Typography
        variant="title3"
        bold
      >
        {title}
      </Typography>
      {children}
    </div>
  );
});

Section.displayName = "Section";

export default Section;
