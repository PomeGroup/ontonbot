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

  const getStepState = (index: number) => {
    if (index < currentStep - 1) return "completed";
    if (index === currentStep - 1 && index === steps.length - 1)
      return "in-progress-last";
    if (index === currentStep - 1) return "in-progress";
    if (index === steps.length - 1) return "last";
    return "not-active";
  };

  return (
    <ol className="flex items-center w-full text-xs text-secondary font-medium sm:text-base">
      {steps.map((step, index) => {
        const stepState = getStepState(index);

        return (
          <React.Fragment key={index}>
            <li
              onClick={() => index < currentStep && setCurrentStep(index + 1)}
              className={cn(
                "flex w-full justify-center relative",
                {
                  "text-primary after:bg-primary": [
                    "completed",
                    "in-progress",
                    "in-progress-last",
                  ].includes(stepState),
                  "text-secondary after:bg-muted-foreground":
                    stepState === "not-active",
                  "text-secondary": stepState === "last",
                },
                stepState === "last" || stepState === "in-progress-last"
                  ? "after:hidden"
                  : "after:inline-block",
                "after:content-[''] after:w-full after:h-0.5 after:absolute lg:after:top-5 after:top-3 after:left-1/2"
              )}
            >
              <div className="block whitespace-nowrap z-10">
                <span
                  className={cn(
                    "w-6 h-6 flex justify-center items-center mx-auto mb-2 text-sm rounded-full lg:w-10 lg:h-10",
                    {
                      "bg-primary text-white border-transparent": [
                        "completed",
                        "in-progress",
                        "in-progress-last",
                      ].includes(stepState),
                      "bg-muted text-muted-foreground border-muted":
                        stepState === "not-active" || stepState === "last",
                    }
                  )}
                >
                  {stepState === "completed" ? (
                    <IoIosCheckmark className="text-4xl" />
                  ) : (
                    step.icon || index + 1
                  )}
                </span>
                {step.label}
              </div>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
};

export default Stepper;
