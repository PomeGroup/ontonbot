import { cn } from "@/utils";
import { ReactNode } from "react";

export const typographyClassNameMappings = {
  title1: "text-[28px] font-normal leading-[34px]",
  title2: "text-[22px] font-thin leading-[28px]",
  title3: "text-[20px] font-thin leading-[24px]",
  headline: "text-[18px] font-light leading-[22px]",
  body: "text-[16px] font-thin leading-[22px]",
  callout: "text-[16px] font-light leading-[22px]",
  subheadline1: "text-[14px] font-extralight leading-[20px]",
  subheadline2: "text-[14px] font-thin leading-[18px]",
  caption1: "text-[12px] font-thin leading-[16px]",
  caption2: "text-[11px] font-thin leading-[13px]",
  footnote: "text-[13px] font-thin leading-[18px]",
};

interface TypographyProps {
  variant: keyof typeof typographyClassNameMappings;
  children: ReactNode;
  bold?: boolean;
  className?: string;
  truncate?: boolean;
}

export default function Typography({ variant, bold, children, className, truncate }: TypographyProps) {
  return (
    <div className={cn(typographyClassNameMappings[variant], bold && "!font-bold", truncate && "truncate", className)}>
      {children}
    </div>
  );
}
