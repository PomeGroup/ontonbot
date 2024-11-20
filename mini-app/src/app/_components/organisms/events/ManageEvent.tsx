"use client";

import useWebApp from "@/hooks/useWebApp";
import { type RouterOutput } from "@/server";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { GeneralStep } from "./GeneralStep";
import { TimePlaceStep } from "./TimePlaceStep";
import { RewardStep } from "./RewardStep";
import Stepper from "@/app/_components/molecules/stepper";
import { Block } from "konsta/react";

type ManageEventProps = {
  eventHash?: string;
  event?: RouterOutput["events"]["getEvent"];
};

const ManageEvent = (props: ManageEventProps) => {
  const currentStep = useCreateEventStore((state) => state.currentStep);
  const setCurrentStep = useCreateEventStore((state) => state.setCurrentStep);
  const setEdit = useCreateEventStore((state) => state.setEdit);
  const setEventData = useCreateEventStore((state) => state.setEventData);

  const resetState = useCreateEventStore((state) => state.resetState);
  const [isReset, setIsReset] = useState(false);

  const webApp = useWebApp();
  const router = useRouter();

  useLayoutEffect(() => {
    resetState();
    setIsReset(true);

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
      <Block>
        <Stepper
          steps={[
            { icon: <span>1</span>, label: "General" },
            { icon: <span>2</span>, label: "Time/place" },
            { icon: <span>3</span>, label: "Reward" },
          ]}
          currentStep={currentStep}
        />
      </Block>

      <Block className="!p-0">
        {isReset && currentStep === 1 && <GeneralStep />}
        {isReset && currentStep === 2 && <TimePlaceStep />}
        {isReset && currentStep === 3 && <RewardStep />}
      </Block>
    </>
  );
};

export default ManageEvent;
