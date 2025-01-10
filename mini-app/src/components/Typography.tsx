import { cn } from "@/utils";
import { ReactNode } from "react";

const classNameMappings = {
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
  variant: keyof typeof classNameMappings;
  children: ReactNode;
  bold?: boolean;
  className?: string;
}

export default function Typography({ variant, bold, children, className }: TypographyProps) {
  return <div className={cn(classNameMappings[variant], bold && "!font-bold", className)}>{children}</div>;
}
