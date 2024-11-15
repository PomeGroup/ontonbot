"use client";

import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { trpc } from "@/app/_trpc/client";
import { AlertGeneric } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { EventDataSchema, UpdateEventDataSchema } from "@/types";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { IoInformationCircle } from "react-icons/io5";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateEventStore } from "@/zustand/createEventStore";
import "swiper/css";
import { StepLayout } from "./stepLayout";
import { FiAlertCircle } from "react-icons/fi"; // React icon for errors
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SbtOptionContent } from "./SbtOptionContent";
let lastToastId: string | number | null = null; // Store the ID of the last toast

export const RewardStep = () => {
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const eventData = useCreateEventStore((state) => state.eventData);
  const editOptions = useCreateEventStore((state) => state.edit);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [errors, setErrors] = useState<{
    secret_phrase?: string[] | undefined;
    ts_reward_url?: string[] | undefined;
    video_url?: string[] | undefined;
  }>();
  const [selectedSbtId, setSelectedSbtId] = useState<number | null>(null);
  const [passwordDisabled, setPasswordDisabled] = useState(
    !!editOptions?.eventHash
  );
  const [passwordValue, setPasswordValue] = useState(
    editOptions?.eventHash ? "{** click to change password **}" : ""
  );

  const {
    data: rewardCollections,
    isLoading: sbtCollectionIsLoading,
    refetch,
  } = trpc.sbtRewardCollection.getRewardCollectionsByHubID.useQuery(
    { hubID: Number(eventData?.society_hub?.id) || 0 },
    {
      enabled: false,
      cacheTime: 1000 * 60,
    }
  );
  const [sbtOption, setSbtOption] = useState<"custom" | "default">(
    rewardCollections && rewardCollections.length > 0 ? "default" : "custom"
  );
  useEffect(() => {
    if (eventData?.society_hub?.id) {
      refetch().then(() => {
        console.log("Refetched SBT Videos");
        console.log("Reward Collections", rewardCollections);
      });
    }

    // Automatically set the sbtOption to "custom" if rewardCollections is empty
    if (rewardCollections && rewardCollections.length === 0) {
      setSbtOption("custom");
    }
    else {
      setSbtOption("default");
    }
  }, [eventData?.society_hub?.id, rewardCollections]);
  // Add Event Mutation
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

  // Update Event Mutation
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
  const handleSbtSelection = (id: number) => {
    setSelectedSbtId(id);
    console.log("Selected SBT Collection ID:", id);
  };
  // Zod schema for validation
  const thirdStepDataSchema = z.object({
    secret_phrase: passwordDisabled
      ? z.string().optional()
      : z
        .string()
        .min(4, { message: "Password must be at least 4 characters" })
        .max(20, { message: "Password must be less than 20 characters" }),
    ts_reward_url: z
      .string()
      .optional() // This allows the field to be undefined
      .refine(
        (url) =>
          url === undefined ||
          url === "" ||
          z.string().url().safeParse(url).success,
        { message: "Please upload a valid reward image URL" }
      ),
    event_video_url: z
      .string()
      .optional()
      .refine(
        (url) =>
          url === undefined ||
          url === "" ||
          z.string().url().safeParse(url).success,
        { message: "Please upload a valid video URL" }
      ),
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    const formDataObject = Object.fromEntries(formData.entries());
    const stepInputsObject = {
      ...formDataObject,
      ts_reward_url: eventData?.ts_reward_url,
      video_url: eventData?.video_url,
      secret_phrase: passwordDisabled
        ? undefined
        : formDataObject.secret_phrase,
    };


    if (sbtOption === "custom" && (!eventData?.ts_reward_url || !eventData?.video_url) && !editOptions?.eventHash) {
      // Set errors if the image or video URL is missing
      setErrors((prevErrors) => ({
        ...prevErrors,
        ts_reward_url: !eventData?.ts_reward_url ? ["Please upload a reward image."] : undefined,
        video_url: !eventData?.video_url ? ["Please upload a video."] : undefined,
      }));

      toast.error(
        <div>
          <div className="flex items-center">
            <FiAlertCircle className="mr-2" />
            {"Please upload both an image and a video for your custom SBT reward."}
          </div>
        </div>,
        { duration: 5000 }
      );
      return;
    }

    const formDataParsed = thirdStepDataSchema.safeParse(stepInputsObject);
    if (formDataParsed.success) {
      setErrors({}); // Clear all errors
      setEventData({
        secret_phrase: formDataParsed.data.secret_phrase,
        ts_reward_url: formDataParsed.data.ts_reward_url,
      });

      const dataToSubmit = { ...formDataParsed.data, ...eventData };

      if (editOptions?.eventHash) {
        const updateParsedData = UpdateEventDataSchema.safeParse(dataToSubmit);
        if (updateParsedData.success) {
          updateEvent.mutate({
            event_uuid: editOptions.eventHash,
            eventData: updateParsedData.data,
          });
          return;
        }
      }

      const parsedEventData = EventDataSchema.safeParse(dataToSubmit);
      if (parsedEventData.success) {
        addEvent.mutate({
          eventData: parsedEventData.data,
        });
      }
      return;
    }

    // Set errors if validation fails
    setErrors(formDataParsed.error.flatten().fieldErrors);
    const flattenedErrors = formDataParsed.error.flatten().fieldErrors;

    // Prepare error messages with icons
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

    // Dismiss the previous error toast, if any
    if (lastToastId) {
      toast.dismiss(lastToastId);
    }

    // Show the new toast with multiline error messages and store the toast ID
    lastToastId = toast.error(
      <div>{errorMessages}</div>,
      { duration: 5000 } // Set duration to 5 seconds
    );
  };
  useEffect(() => {
    console.log("eventData", eventData);
  }, [eventData]);
  const handlePasswordClick = () => {
    setPasswordDisabled(false);
    setPasswordValue(""); // Clear the placeholder text
  };

  const clearVideoError = () => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      event_video_url: undefined,
    }));
  };
  // Handle form submission on button click
  const handleButtonClick = useCallback(() => {
    if (formRef.current) {
      formRef.current.requestSubmit(); // Trigger form submit
    }
  }, [formRef]);

  // Clear image error when a valid image is uploaded
  const clearImageError = () => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      ts_reward_url: undefined, // Clear the ts_reward_url error
    }));
  };


  const handleSlideChange = (swiper: any) => {
    if (!rewardCollections || rewardCollections.length === 0) return;

    const currentIndex = swiper.activeIndex;
    const currentSlide = rewardCollections[currentIndex];

    if (currentSlide) {
      setSelectedSbtId(currentSlide.id);
      setEventData({
        ...eventData,
        ts_reward_url: currentSlide.imageLink,
        video_url: currentSlide.videoLink,
      });
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
    >
      <StepLayout>
        {/* Secret Phrase Field */}
        <div className="space-y-2">
          <Label
            htmlFor="secret_phrase"
            className="font-bold text-lg"
          >
            Events password
          </Label>
          <div
            onClick={handlePasswordClick}
            className="relative"
          >
            <Input
              placeholder="Enter your chosen password"
              name="secret_phrase"
              value={passwordValue}
              disabled={passwordDisabled}
              onChange={(e) => setPasswordValue(e.target.value)}
              errors={errors?.secret_phrase}
            />
            {passwordDisabled && (
              <div className="absolute inset-0 bg-transparent cursor-pointer"></div>
            )}
          </div>
          <AlertGeneric variant="info">
            Password is in-case sensitive and must be at least 4 characters
          </AlertGeneric>
          <AlertGeneric variant="info">
            By setting a password for the event, you can prevent checking-in
            unexpectedly and receiving a reward without attending the event.
          </AlertGeneric>
        </div>
        {!editOptions?.eventHash && (
          <>
            {/* SBT Option Selection */}
            <div className="space-y-2">
              <Label className="font-bold text-lg mb-2">Choose SBT Option</Label>

              <RadioGroup
                onValueChange={(value: "custom" | "default") => setSbtOption(value)}
                value={sbtOption}
              >
                <div className="flex space-x-4">
                  {rewardCollections && rewardCollections.length > 0 && (
                    <>
                      <RadioGroupItem value="default" id="default" className="w-4 h-4" />
                      <Label htmlFor="default"> Default Collections</Label>
                    </>
                  )}

                  <RadioGroupItem
                    value="custom"
                    id="custom"
                    className={"w-4 h-4 color-white"}
                  />
                  <Label htmlFor="custom"  > Customized SBT</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Conditionally Render SBT Content */}
            <div className="space-y-2">
              <SbtOptionContent
                sbtOption={sbtOption}
                rewardCollections={rewardCollections || []}
                sbtCollectionIsLoading={sbtCollectionIsLoading}
                selectedSbtId={selectedSbtId}
                handleSbtSelection={handleSbtSelection}
                handleSlideChange={handleSlideChange}
                setEventData={setEventData}

                errors={errors || {}}
                clearImageError={clearImageError}
                clearVideoError={clearVideoError}
              />

            </div>
          </>
        )}

        {/* Submit Button */}
        {editOptions?.eventHash ? (
          <MainButton
            onClick={handleButtonClick}
            text="Update event"
            disabled={updateEvent.isLoading}
            progress={updateEvent.isLoading}
          />
        ) : (
          <MainButton
            onClick={handleButtonClick}
            text="Create event"
            disabled={addEvent.isLoading}
            progress={addEvent.isLoading}
          />
        )}
      </StepLayout>
    </form>
  );
};
