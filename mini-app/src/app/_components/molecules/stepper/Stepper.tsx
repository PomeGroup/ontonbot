import { useCreateEventStore } from "@/app/_components/organisms/events/createEventStore";
import { cn } from "@/lib/utils";
import React from "react";
import { IoIosCheckmark } from "react-icons/io";

type StepperProps = {
  steps: {
    icon: React.ReactNode;
    label: string;
  }[];
  currentStep: number;
};

const Stepper = ({ steps, currentStep }: StepperProps) => {
  const setCurrentStep = useCreateEventStore((state) => state.setCurrentStep);
  return (
    <ol className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <>
          <li
            key={index}
            className={cn(
              "flex w-96 text-center px-1 items-center text-white relative flex-col"
            )}
            onClick={() => index < currentStep && setCurrentStep(index + 1)}
          >
            <span
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full lg:h-12 lg:w-12 shrink-0",
                index < currentStep
                  ? "bg-main-button-color"
                  : "bg-disabled-font"
              )}
            >
              {index < currentStep - 1 ? (
                <IoIosCheckmark className="text-4xl" />
              ) : (
                step.icon
              )}
            </span>
            <span className={"mt-1 text-sm"}>{step.label}</span>
          </li>
          {index !== steps.length - 1 && (
            <div
              className={cn("h-[1px] -translate-y-1  w-full", {
                "bg-main-button-color": index < currentStep,
                "bg-disabled-font": index >= currentStep,
              })}
            />
          )}
        </>
      ))}
    </ol>
  );
};

export default Stepper;
