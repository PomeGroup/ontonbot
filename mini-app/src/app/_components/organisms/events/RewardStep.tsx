// RewardStep.tsx
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { IoInformationCircle } from "react-icons/io5";
import { toast } from "sonner";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { EventDataSchema, UpdateEventDataSchema } from "@/types";
import { FiAlertCircle } from "react-icons/fi";
import { trpc } from "@/app/_trpc/client";
import { RewardForm } from "../../Event/steps/RewardStepFrom";
import { rewardStepValidation } from "@/zodSchema/event/validation";
import { useMainButton } from "@/hooks/useMainButton";

export const RewardStep = () => {
  const {
    setEventData,
    eventData,
    edit: editOptions,
    setRewardStepErrors,
    clearRewardStepErrors,
  } = useCreateEventStore();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [passwordDisabled, setPasswordDisabled] = useState(
    !!editOptions?.eventHash || eventData?.eventLocationType === "in_person"
  );
  const [passwordValue, setPasswordValue] = useState(
    editOptions?.eventHash ? "{** click to change password **}" : ""
  );
  const [sbtOption, setSbtOption] = useState<"custom" | "default">("default");

  const addEvent = trpc.events.addEvent.useMutation({
    onSuccess(data) {
      setEventData({});
      toast("Event created successfully", {
        icon: <IoInformationCircle />,
        duration: 4000,
      });
      router.push(`/events/${data.eventHash}/edit`);
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
      router.push(`/events/${data.eventId}`);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const thirdStepDataSchema = rewardStepValidation(passwordDisabled);

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

    if (
      sbtOption === "custom" &&
      (!eventData?.ts_reward_url || !eventData?.video_url) &&
      !editOptions?.eventHash
    ) {
      setRewardStepErrors({
        ts_reward_url: !eventData?.ts_reward_url ? ["Please upload a reward image."] : undefined,
        video_url: !eventData?.video_url ? ["Please upload a video."] : undefined,
      });

      toast.error(
        <div className="flex items-center">
          <FiAlertCircle className="mr-2" />
          Please upload both an image and a video for your custom SBT reward.
        </div>,
        { duration: 5000 }
      );
      return;
    }

    const formDataParsed = thirdStepDataSchema.safeParse(stepInputsObject);

    if (!formDataParsed.success) {
      setRewardStepErrors(formDataParsed.error.flatten().fieldErrors);
      const flattenedErrors = formDataParsed.error.flatten().fieldErrors;
      const errorMessages = [
        flattenedErrors.secret_phrase ? (
          <div
            key="secret_phrase"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.secret_phrase[0]}
          </div>
        ) : null,
        flattenedErrors.ts_reward_url ? (
          <div
            key="ts_reward_url"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" />{" "}
            {flattenedErrors.ts_reward_url[0] || "Please upload a reward image"}
          </div>
        ) : null,
      ].filter(Boolean);

      toast.error(errorMessages);
      return;
    }

    clearRewardStepErrors();

    const dataToSubmit = { ...eventData, ...formDataParsed.data };

    if (editOptions?.eventHash) {
      const updateParsedData = UpdateEventDataSchema.safeParse(dataToSubmit);
      if (updateParsedData.success) {
        updateEvent.mutate({
          event_uuid: editOptions.eventHash,
          eventData: updateParsedData.data,
        });
      }

      // flattenedErrors and show toast
      if (updateParsedData.error) {
        const flattenedErrors = updateParsedData.error?.flatten().fieldErrors;
        const errorMessages = Object.values(flattenedErrors)
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
    }
    if (parsedEventData.error) {
      const flattenedErrors = parsedEventData.error?.flatten().fieldErrors;
      const errorMessages = Object.values(flattenedErrors)
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
  );
};
