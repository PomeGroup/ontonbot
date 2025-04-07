import Typography from "@/components/Typography";
import React, { forwardRef } from "react";

interface SectionProps {
  title: string;
  children?: React.ReactNode;
}

const Section = forwardRef<HTMLDivElement, SectionProps>(({ title, children }, ref) => {
  return (
    <div
      ref={ref}
      className="bg-brand-bg p-4 min-h-screen"
    >
      <Typography
        variant="title3"
        bold
        className="mb-4"
      >
        {title}
      </Typography>
      <div className="flex flex-col w-full gap-2">{children}</div>
    </div>
  );
});

Section.displayName = "Section";

export default Section;
