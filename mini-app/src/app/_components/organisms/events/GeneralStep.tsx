import React, { useRef } from "react";
import { toast } from "sonner";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { generalStepDataSchema } from "@/zodSchema/event/validation";
import { ErrorMessage } from "@/app/_components/molecules/alerts/ErrorMessage";
import { useMainButton } from "@/hooks/useMainButton";
import BasicEventInputs from "../../Event/steps/BasicEventInputs";

let lastToastId: string | number | null = null;

export const GeneralStep = () => {
  const formRef = useRef<HTMLFormElement>(null);

  const { setCurrentStep, setEventData, eventData, clearGeneralErrors, setGeneralStepErrors } = useCreateEventStore(
    (state) => ({
      setCurrentStep: state.setCurrentStep,
      setEventData: state.setEventData,
      eventData: state.eventData,
      clearGeneralErrors: state.clearGeneralStepErrors,
      setGeneralStepErrors: state.setGeneralStepErrors,
    })
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    formData.append("image_url", eventData?.image_url || "");

    const formDataObject = Object.fromEntries(formData.entries());
    const formDataParsed = generalStepDataSchema.safeParse(formDataObject);

    if (!formDataParsed.success) {
      const flattenedErrors = formDataParsed.error.flatten().fieldErrors;
      setGeneralStepErrors(flattenedErrors);

      const errorMessages = Object.entries(flattenedErrors)
        .filter(([, messages]) => messages && messages.length > 0)
        .map(([field, messages]) => (
          <ErrorMessage
            key={field}
            message={messages![0]}
          />
        ));

      if (lastToastId) {
        toast.dismiss(lastToastId);
      }

      lastToastId = toast.error(<div>{errorMessages}</div>, { duration: 3000 });
      return;
    }

    setEventData(formDataParsed.data);
    clearGeneralErrors();
    setCurrentStep(2);
  };

  useMainButton(() => {
    formRef.current?.requestSubmit();
  }, "Next Step");

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
    >
      <BasicEventInputs />
    </form>
  );
};
