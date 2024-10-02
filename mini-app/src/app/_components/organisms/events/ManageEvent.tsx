import useWebApp from "@/hooks/useWebApp";
import { type RouterOutput } from "@/server";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect } from "react";
import Stepper from "../../molecules/stepper";
import { useCreateEventStore } from "../../../../zustand/createEventStore";
import { FirstStep } from "./firstTab";
import { SecondStep } from "./secondTab";
import { ThirdStep } from "./thirdTab";

type ManageEventProps = {
  eventHash?: string;
  event?: RouterOutput["events"]["getEvent"];
};
const ManageEvent = (props: ManageEventProps) => {
  const currentStep = useCreateEventStore((state) => state.currentStep);
  const setCurrentStep = useCreateEventStore((state) => state.setCurrentStep);
  const setEdit = useCreateEventStore((state) => state.setEdit);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  // const editOptions = useCreateEventStore((state) => state.edit);
  const resetState = useCreateEventStore((state) => state.resetState);
  const webApp = useWebApp();
  const router = useRouter();

  useLayoutEffect(() => {
    resetState();
    if (props.eventHash) {
      setEdit({
        eventHash: props.eventHash,
      });
      if (props.event) {
        setEventData({
          title: props.event.title || undefined,
          description: props.event.description || undefined,
          image_url: props.event.image_url || undefined,
          subtitle: props.event.subtitle || undefined,
          start_date: props.event.start_date || undefined,
          end_date: props.event.end_date || undefined,
          location: props.event.location || undefined,
          society_hub:
            props.event.society_hub?.id && props.event.society_hub?.name
              ? {
                  id: props.event.society_hub.id,
                  name: props.event.society_hub.name,
                }
              : undefined,
          eventLocationType: props.event.participationType,
          countryId: props.event.countryId || undefined,
          cityId: props.event.cityId || undefined,
          ts_reward_url: props.event.tsRewardImage || undefined,
        });
      }
    }
  }, [props.eventHash, props.event]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (props.eventHash) {
      router.push("/");
    } else {
      webApp?.showConfirm("Discard Changes?", (confirmed) => {
        if (confirmed) {
          resetState();
          router.push("/");
        }
      });
    }
  }, [webApp, currentStep, setCurrentStep, router]);

  useEffect(() => {
    webApp?.BackButton.show();
    webApp?.BackButton.onClick(handleBack);
    return () => {
      webApp?.BackButton.offClick(handleBack);
      webApp?.BackButton.hide();
    };
  }, [webApp, currentStep, setCurrentStep, router]);

  useEffect(() => {
    document.location.pathname.endsWith("create") && resetState();
  }, []);

  return (
    <>
      <Stepper
        steps={[
          { icon: <span>1</span>, label: "General info" },
          { icon: <span>2</span>, label: "Time and place" },
          { icon: <span>3</span>, label: "Reward Setting" },
        ]}
        currentStep={currentStep}
      />

      {currentStep === 1 && <FirstStep />}
      {currentStep === 2 && <SecondStep />}
      {currentStep === 3 && <ThirdStep />}
    </>
  );
};

export default ManageEvent;
