import React, { useLayoutEffect } from "react";
import { UserRegistrationForm } from "./UserRegistrationForm";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useMainButton } from "@/hooks/useMainButton";
import PaidEventCreationInputs from "./PaidEventCreationInputs";

const RegistrationStep = () => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const { eventData, setEventData, submitMainbutton } = useCreateEventStore((state) => ({
    eventData: state.eventData,
    setEventData: state.setEventData,
    setCurrentStep: state.setCurrentStep,
    submitMainbutton: state.registrationStepMainButtonClick,
  }));

  useLayoutEffect(() => {
    if (eventData?.eventLocationType === "in_person") {
      setEventData({ has_registration: true });
    }
  }, []);

  useMainButton(() => {
    formRef.current?.requestSubmit();
  }, "Next Step");

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        submitMainbutton();
      }}
    >
      <UserRegistrationForm />;
      <PaidEventCreationInputs />
    </form>
  );
};

export default RegistrationStep;
