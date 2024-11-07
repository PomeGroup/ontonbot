import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@ui/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const sectionVariants = cva(
  "bg-telegram-secondary-bg-color min-h-screen", // Base styles for the wrapper
  {
    variants: {
      variant: {
        default: "p-4",
        withSections: "grid gap-4",
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

const Page = React.forwardRef<HTMLDivElement, WrapperProps>(
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
Page.displayName = "Section";

export { Page, sectionVariants };
