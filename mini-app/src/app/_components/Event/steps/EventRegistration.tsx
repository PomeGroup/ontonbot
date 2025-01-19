import React, { useLayoutEffect } from "react";
import { UserRegistrationForm } from "./UserRegistrationForm";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useMainButton } from "@/hooks/useMainButton";
import PaidEventCreationInputs from "./PaidEventCreationInputs";
import { useTonWallet } from "@tonconnect/ui-react";
import { useSectionStore } from "@/zustand/useSectionStore";

const RegistrationStep = () => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const tonWallet = useTonWallet();
  const { setSection } = useSectionStore();


  const { eventData, setEventData, submitMainbutton, isEdit } = useCreateEventStore((state) => ({
    eventData: state.eventData,
    setEventData: state.setEventData,
    setCurrentStep: state.setCurrentStep,
    submitMainbutton: state.registrationStepMainButtonClick,
    isEdit: Boolean(state.edit?.eventHash),
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
        setSection("event_setup_form_reward_step");
        submitMainbutton(tonWallet?.account.address || null);
      }}
    >
      { <UserRegistrationForm />}
      { <PaidEventCreationInputs />}
    </form>
  );
};

export default RegistrationStep;
