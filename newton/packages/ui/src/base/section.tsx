import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@ui/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const sectionVariants = cva(
  "bg-telegram-6-10-section-bg-color rounded-none", // Base styles for the wrapper
  {
    variants: {
      variant: {
        default: "",
        plain: "bg-transparent",
        bottomRounded: "rounded-bl-lg rounded-br-lg p-4 pt-0",
        topRounded: "rounded-tl-lg rounded-tr-lg p-4 pb-0",
        rounded: "rounded-lg p-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface WrapperProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sectionVariants> {
  asChild?: boolean;
}

const Section = React.forwardRef<HTMLDivElement, WrapperProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        className={cn(sectionVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Section.displayName = "Section";

export { Section, sectionVariants };
