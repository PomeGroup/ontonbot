import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

const alertVariants = cva(
  "relative w-full rounded-xl p-2 items-center grid grid-cols-12",
  {
    variants: {
      variant: {
        default: "bg-disabled-font/10 text-disabled-font",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

const AlertGeneric = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "info" | "destructive";
  }
>(({ className, ...props }, ref) => (
  <Alert
    ref={ref}
    className={cn("gap-1", className)}
  >
    {props.variant === "info" && <Info className="col-span-1" />}
    <AlertDescription className="col-span-11">
      {props.children}
    </AlertDescription>
  </Alert>
));
AlertGeneric.displayName = "AlertGeneric";

export { Alert, AlertDescription, AlertGeneric, AlertTitle };
