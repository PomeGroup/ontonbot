import React, { useRef } from "react";
import { toast } from "sonner";
import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { generalStepDataSchema } from "@/zodSchema/event/validation";
import { ErrorMessage } from "@/app/_components/molecules/alerts/ErrorMessage";
import { EventGeneralInfoFormFields } from "@/app/_components/Event/steps/GeneralInfoForm";

let lastToastId: string | number | null = null;

export const GeneralStep = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const setCurrentStep = useCreateEventStore((state) => state.setCurrentStep);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const eventData = useCreateEventStore((state) => state.eventData);
  const clearGeneralErrors = useCreateEventStore((state) => state.clearGeneralStepErrors);
  const setGeneralStepErrors = useCreateEventStore((state) => state.setGeneralStepErrors);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    formData.append("image_url", eventData?.image_url || "");

    const formDataObject = Object.fromEntries(formData.entries());
    const formDataParsed = generalStepDataSchema.safeParse({
      ...formDataObject,
      has_registration: Boolean(eventData?.has_registration),
      has_approval: Boolean(eventData?.has_approval),
      has_waiting_list: Boolean(eventData?.has_waiting_list),
      capacity: !isNaN(Number(formDataObject.capacity))
        ? Number(formDataObject.capacity)
        : eventData?.capacity || null,
    });

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

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
    >
      <EventGeneralInfoFormFields />
      <MainButton
        text="Next Step"
        onClick={() => formRef.current?.requestSubmit()}
      />
    </form>
  );
};
