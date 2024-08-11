"use client";

import Alerts from "@/app/_components/molecules/alerts";
import Stepper from "@/app/_components/molecules/stepper";
import useAuth from "@/hooks/useAuth";
import { useCreateEventStore } from "./createEventStore";
import { FirstStep } from "./firstTab";
import { SecondStep } from "./secondTab";
import { ThirdStep } from "./thirdTab";

const CreateEventAdminPage = () => {
  const { authorized, isLoading } = useAuth();
  const currentStep = useCreateEventStore((state) => state.currentStep);

  if (isLoading) {
    return null;
  }

  if (authorized === false) {
    return <Alerts.NotAuthorized />;
  }

  return (
    <>
      <Stepper
        steps={[
          { icon: <span>1</span> },
          { icon: <span>2</span> },
          { icon: <span>3</span> },
        ]}
        currentStep={currentStep}
      />

      {currentStep === 0 && <FirstStep />}
      {currentStep === 1 && <SecondStep />}
      {currentStep === 2 && <ThirdStep />}
    </>
  );
};

export default CreateEventAdminPage;

export const dynamic = "force-dynamic";
