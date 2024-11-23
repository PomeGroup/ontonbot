"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
const ORIENTATION_VERTICAL = "vertical";
const ORIENTATION_HORIZONTAL = "horizontal";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  {
    orientation?: typeof ORIENTATION_VERTICAL | typeof ORIENTATION_HORIZONTAL;
  } & React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, orientation = ORIENTATION_HORIZONTAL, ...props }, ref) => {
  const orientationClass = orientation === ORIENTATION_VERTICAL ? "flex flex-col" : "flex";

  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", orientationClass, className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-cn-primary ring-offset-cn-background focus:outline-none focus-visible:ring-2 focus-visible:ring-cn-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
