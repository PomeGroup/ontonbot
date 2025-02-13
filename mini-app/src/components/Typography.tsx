import { cn } from "@/utils";
import { cva, VariantProps } from "class-variance-authority";
import { ReactNode } from "react";

export const typographyVariants = cva("", {
  variants: {
    variant: {
      title1: "text-3xl font-normal leading-[34px]",
      title2: "text-[22px] font-thin leading-[28px]",
      title3: "text-xl font-thin leading-[24px]",
      headline: "text-lg font-light leading-[22px]",
      body: "text-base font-thin leading-[22px]",
      callout: "text-base font-light leading-[22px]",
      subheadline1: "text-sm font-extralight leading-[20px]",
      subheadline2: "text-sm font-light leading-[18px]",
      caption1: "text-xs font-light leading-[16px]",
      caption2: "text-[11px] font-light leading-[13px]",
      footnote: "text-[13px] font-light leading-[18px]",
    },
    weight: {
      thin: "font-thin", // font-weight: 100
      extralight: "font-extralight", // font-weight: 200
      light: "font-light", // font-weight: 300
      normal: "font-normal", // font-weight: 400
      medium: "font-medium", // font-weight: 500
      semibold: "font-semibold", // font-weight: 600
      bold: "font-bold", // font-weight: 700
      extrabold: "font-extrabold", // font-weight: 800
      black: "font-black", // font-weight: 900
    },
    truncate: {
      false: null,
      true: "truncate",
    },
    bold: {
      false: null,
      true: "font-bold",
    },
  },
  defaultVariants: {
    weight: "thin",
    variant: "body",
    truncate: false,
    bold: false,
  },
});

interface TypographyProps extends VariantProps<typeof typographyVariants> {
  children: ReactNode;
  className?: string;
}

export default function Typography({ children, className, ...props }: TypographyProps) {
  return <div className={cn(typographyVariants(props), className)}>{children}</div>;
}
