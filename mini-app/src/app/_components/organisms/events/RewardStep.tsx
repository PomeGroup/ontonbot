// RewardStep.tsx
"use client";

import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { IoInformationCircle } from "react-icons/io5";
import { toast } from "sonner";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { EventDataSchema, UpdateEventDataSchema } from "@/types";
import { FiAlertCircle } from "react-icons/fi";
import { trpc } from "@/app/_trpc/client";
import { RewardForm } from "../../Event/steps/RewardStepFrom";
import { rewardStepValidation } from "@/zodSchema/event/validation";
import UpdateEventSuccessDialog from "../../Event/steps/UpdateEventSuccessDialog";
import { useMainButton } from "@/hooks/useMainButton";
import { useSectionStore } from "@/zustand/useSectionStore";

export const RewardStep = () => {
  const { setEventData, eventData, edit: editOptions, setRewardStepErrors, clearRewardStepErrors } = useCreateEventStore();
  const { setSection } = useSectionStore();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { clearSections } = useSectionStore();
  const [passwordDisabled, setPasswordDisabled] = useState(
    !!editOptions?.eventHash || eventData?.eventLocationType === "in_person"
  );
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [passwordValue, setPasswordValue] = useState(editOptions?.eventHash ? "{** click to change password **}" : "");
  const [sbtOption, setSbtOption] = useState<"custom" | "default">("default");

  const addEvent = trpc.events.addEvent.useMutation({
    onSuccess(data) {

      toast("Event created successfully", {
        icon: <IoInformationCircle />,
        duration: 4000,
      });
      setEventData({});
      setSection("none");
      router.replace(`/events/${data?.eventHash}/manage`)
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const updateEvent = trpc.events.updateEvent.useMutation({
    onSuccess(data) {
      setEventData({});
      toast("Event updated successfully", {
        icon: <IoInformationCircle />,
        duration: 4000,
      });

      if (eventData?.paid_event?.has_payment) {
        setShowSuccessDialog(true);
      } else {

        setSection("none");
        router.replace(`/events/${data?.eventId}/manage`);
      }

    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const formDataObject = Object.fromEntries(formData.entries());
    const stepInputsObject = {
      ...formDataObject,
      ts_reward_url: eventData?.ts_reward_url,
      video_url: eventData?.video_url,
      secret_phrase: passwordDisabled ? undefined : formDataObject.secret_phrase,
    };
    console.log("stepInputsObject", stepInputsObject);
    if (sbtOption === "custom" && (!eventData?.ts_reward_url || !eventData?.video_url) && !editOptions?.eventHash) {
      const errors = {
        ts_reward_url: !eventData?.ts_reward_url ? ["Please upload a reward image."] : undefined,
        video_url: !eventData?.video_url ? ["Please upload a video."] : undefined,
      };
      console.error("SBT validation errors:", errors);
      setRewardStepErrors(errors);
      toast.error(
        <div className="flex items-center">
          <FiAlertCircle className="mr-2" />
          Please upload both an image and a video for your custom SBT reward.
        </div>,
        { duration: 5000 }
      );
      return;
    }
    const isPaid = eventData?.paid_event?.has_payment ?? false;
    const hasRegistration = eventData?.has_registration ?? false;
    const thirdStepDataSchema = rewardStepValidation(isPaid, hasRegistration, Boolean(editOptions?.eventHash))
    const formDataParsed = thirdStepDataSchema.safeParse(stepInputsObject);

    if (!formDataParsed.success) {

      const errors = formDataParsed.error.flatten().fieldErrors;

      console.error("Third step validation errors:", errors);
      setRewardStepErrors(errors);
      const errorMessages = [
        errors.secret_phrase ? (
          <div
            key="secret_phrase"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {errors.secret_phrase[0]}
          </div>
        ) : null,
        errors.ts_reward_url ? (
          <div
            key="ts_reward_url"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {errors.ts_reward_url[0] || "Please upload a reward image"}
          </div>
        ) : null,
      ].filter(Boolean);
      toast.error(errorMessages);
      return;
    }

    clearRewardStepErrors();
    const dataToSubmit = {
      ...eventData,
      ...formDataParsed.data,
      secret_phrase: eventData?.secret_phrase || formDataParsed.data.secret_phrase,
    };

    if (editOptions?.eventHash) {
      const updateParsedData = UpdateEventDataSchema.safeParse(dataToSubmit);
      if (updateParsedData.success) {
        updateEvent.mutate({
          event_uuid: editOptions.eventHash,
          eventData: updateParsedData.data,
        });
        clearSections();
      } else {
        const errors = updateParsedData.error.flatten().fieldErrors;
        console.error("Update event validation errors:", errors);
        const errorMessages = Object.values(errors)
          .flat()
          .map((v, i) => <div key={i}>* {v}</div>);
        toast.error(errorMessages);
      }
      return;
    }

    const parsedEventData = EventDataSchema.safeParse(dataToSubmit);
    if (parsedEventData.success) {
      addEvent.mutate({
        eventData: parsedEventData.data,
      });
      clearSections();
    } else {
      const errors = parsedEventData.error.flatten().fieldErrors;
      console.error("Create event validation errors:", errors);
      const errorMessages = Object.values(errors)
        .flat()
        .map((v, i) => <div key={i}>* {v}</div>);
      toast.error(errorMessages);
    }
  };

  const clearImageError = () => {
    clearRewardStepErrors();
  };

  const clearVideoError = () => {
    clearRewardStepErrors();
  };

  useMainButton(
    () => {
      formRef.current?.requestSubmit();
    },
    editOptions?.eventHash ? "Update event" : "Create Event",
    {
      disabled: updateEvent.isLoading || addEvent.isLoading,
      isLoading: updateEvent.isLoading || addEvent.isLoading,
    }
  );

  return (
    <>
    <form
      ref={formRef}
      onSubmit={handleSubmit}
    >
      <RewardForm
        passwordDisabled={passwordDisabled}
        setPasswordDisabled={setPasswordDisabled}
        passwordValue={passwordValue}
        setPasswordValue={setPasswordValue}
        sbtOption={sbtOption}
        setSbtOption={setSbtOption}
        clearImageError={clearImageError}
        clearVideoError={clearVideoError}
      />

    </form>
    <UpdateEventSuccessDialog
      open={showSuccessDialog}

      eventUuid={editOptions?.eventHash}
      onClose={() => setShowSuccessDialog(false)}
    />
    </>
  );
};
