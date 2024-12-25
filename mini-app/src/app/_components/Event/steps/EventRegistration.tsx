import React, { useLayoutEffect } from "react";
import { UserRegistrationForm } from "./UserRegistrationForm";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useMainButton } from "@/hooks/useMainButton";
import { useTonWallet } from "@tonconnect/ui-react";

const RegistrationStep = () => {
  const formRef = React.useRef<HTMLFormElement>(null);

  const tonWallet = useTonWallet();

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
        submitMainbutton(tonWallet?.account.address || null);
      }}
    >
      {((isEdit && !eventData.paid_event.has_payment) || !isEdit) && <UserRegistrationForm />}
      {/* {((isEdit && eventData.paid_event.has_payment) || !isEdit) && <PaidEventCreationInputs />} */}
    </form>
  );
};

export default RegistrationStep;
