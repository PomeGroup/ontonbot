import React, { useLayoutEffect } from "react";
import { UserRegistrationForm } from "./UserRegistrationForm";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useMainButton } from "@/hooks/useMainButton";

const RegistrationStep = () => {
  const { eventData, setEventData, setCurrentStep } = useCreateEventStore((state) => ({
    eventData: state.eventData,
    setEventData: state.setEventData,
    setCurrentStep: state.setCurrentStep,
  }));

  useLayoutEffect(() => {
    if (eventData?.eventLocationType === "in_person") {
      setEventData({ has_registration: true });
    }
  }, []);

  useMainButton(() => {
    setCurrentStep(4);
  }, "Next Step");

  return <UserRegistrationForm />;
};

export default RegistrationStep;
