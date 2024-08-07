import { cn } from "@/lib/utils";
import React from "react";

type StepperProps = {
  steps: {
    icon: React.ReactNode;
  }[];
  currentStep: number;
};

const Stepper = ({ steps, currentStep }: StepperProps) => {
  return (
    <ol className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <li
          key={index}
          className={cn(
            "flex items-center text-white ",
            {
              "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block flex-1":
                index !== steps.length - 1,
            },
            index < currentStep
              ? "after:border-main-button-color"
              : "after:border-disabled-font"
          )}
        >
          <span
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0",
              index < currentStep ? "bg-main-button-color" : "bg-disabled-font"
            )}
          >
            {step.icon}
          </span>
        </li>
      ))}
    </ol>
  );
};

export default Stepper;
