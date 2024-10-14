"use client";
import useWebApp from "@/hooks/useWebApp";
import { type RouterOutput } from "@/server";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect } from "react";
import Stepper from "../../molecules/stepper";
import { useCreateEventStore } from "../../../../zustand/createEventStore";
import { FirstStep } from "./firstTab";
import { SecondStep } from "./secondTab";
import { ThirdStep } from "./thirdTab";
import { useWithBackButton } from "../../atoms/buttons/web-app/useWithBackButton";

type ManageEventProps = {
  eventUUID?: string;
  event?: RouterOutput["events"]["getEvent"];
  edit?: boolean;
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
    if (props.eventUUID) {
      setEdit({
        eventHash: props.eventUUID,
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
                id: String(props.event.society_hub.id), // Convert id to string
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
  }, [props.eventUUID, props.event]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (props.eventUUID) {
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
  useWithBackButton({ handleBack })

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

      {currentStep === 1 && <FirstStep edit={props.edit} />}
      {currentStep === 2 && <SecondStep />}
      {currentStep === 3 && <ThirdStep />}
    </>
  );
};

export default ManageEvent;
