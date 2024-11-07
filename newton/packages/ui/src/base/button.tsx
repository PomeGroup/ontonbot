import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background disabled:cursor-not-allowed transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        regular: "h-[50px]",
        icon: "h-9 w-9 rounded-[100px]",
      },
      buttonColor: {
        filled: "bg-telegram-button-color text-telegram-button-text-color",
        tinted:
          "bg-wallet-second-button-color text-telegram-6-10-accent-text-color",
        gray: "bg-wallet-tertiary-fill-background text-telegram-text-color",
        disabled:
          "bg-wallet-button-main-disabled-color text-wallet-text-main-disabled-color",
      },
    },
    defaultVariants: {
      variant: "regular",
      buttonColor: "filled",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, buttonColor, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, buttonColor, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
