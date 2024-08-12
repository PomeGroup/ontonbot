import { useCreateEventStore } from "@/app/events/create/createEventStore";
import { cn } from "@/lib/utils";
import React from "react";

type StepperProps = {
  steps: {
    icon: React.ReactNode;
  }[];
  currentStep: number;
};

const Stepper = ({ steps, currentStep }: StepperProps) => {
  const setCurrentStep = useCreateEventStore((state) => state.setCurrentStep);
  return (
    <ol className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <li
          key={index}
          className={cn(
            "flex items-center text-white ",
            {
              "after:content-[''] after:w-full after:mx-1 after:h-[1px]  after:inline-block flex-1":
                index !== steps.length - 1,
            },
            index < currentStep
              ? "after:bg-main-button-color"
              : "after:bg-disabled-font"
          )}
          onClick={() => index < currentStep && setCurrentStep(index + 1)}
        >
          <span
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full lg:h-12 lg:w-12 shrink-0",
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
