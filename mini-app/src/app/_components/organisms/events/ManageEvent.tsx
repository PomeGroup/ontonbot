"use client";

import useWebApp from "@/hooks/useWebApp";
import { type RouterOutput } from "@/server";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { GeneralStep } from "./GeneralStep";
import { TimePlaceStep } from "./TimePlaceStep";
import { RewardStep } from "./RewardStep";
import Stepper from "@/app/_components/molecules/stepper";
import { Block } from "konsta/react";
import RegistrationStep from "../../Event/steps/EventRegistration";

type ManageEventProps = {
  event?: RouterOutput["events"]["getEvent"];
};

const steps = [
  { icon: <span>1</span>, label: "General" },
  { icon: <span>2</span>, label: "Time/place" },
  { icon: <span>3</span>, label: "Registration" },
  { icon: <span>4</span>, label: "Reward" },
];

const ManageEvent = (props: ManageEventProps) => {
  const params = useParams<{ hash: string }>();
  const { currentStep, setCurrentStep, setEdit, setEventData, resetState, clearGeneralErrors } = useCreateEventStore(
    (state) => ({
      currentStep: state.currentStep,
      setCurrentStep: state.setCurrentStep,
      setEdit: state.setEdit,
      setEventData: state.setEventData,
      resetState: state.resetState,
      clearGeneralErrors: state.clearGeneralStepErrors,
    })
  );

  const [isReset, setIsReset] = useState(false);

  const webApp = useWebApp();
  const router = useRouter();

  useEffect(() => {
    clearGeneralErrors();
  }, []);

  useLayoutEffect(() => {
    resetState();
    setIsReset(true);

    if (params.hash && isReset) {
      setEdit({
        eventHash: params.hash,
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

          // User Registration Attributes 📎
          has_registration: Boolean(props.event.has_registration),
          has_approval: Boolean(props.event.has_approval),
          capacity: props.event.capacity || null,
          has_waiting_list: Boolean(props.event.has_waiting_list),
          paid_event: {
            payment_type: props.event.payment_details?.payment_type,
            payment_recipient_address: props.event?.payment_details.recipient_address,
            nft_description: props.event.payment_details?.description || undefined,
            nft_title: props.event.payment_details?.title || undefined,
            has_payment: Boolean(props.event.payment_details?.payment_type),
            payment_amount: props.event.payment_details?.price,
            nft_image_url: props.event.payment_details?.ticketImage || undefined,
            bought_capacity: props.event.payment_details?.bought_capacity,
          },
        });
      }
    }
  }, [params.hash, props.event, isReset]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (params.hash) {
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
      <Block className="!-mb-2">
        <Stepper
          steps={steps}
          currentStep={currentStep}
        />
      </Block>

      <Block className="!p-0">
        {isReset && currentStep === 1 && <GeneralStep />}
        {isReset && currentStep === 2 && <TimePlaceStep />}
        {isReset && currentStep === 3 && <RegistrationStep />}
        {isReset && currentStep === 4 && <RewardStep />}
      </Block>
    </>
  );
};

export default ManageEvent;
