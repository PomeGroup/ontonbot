"use client";

import React from "react";
import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { trpc } from "@/app/_trpc/client";
import { AlertGeneric } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { UploadImageFile } from "@/components/ui/upload-file";
import useWebApp from "@/hooks/useWebApp";
import { EventDataSchema, UpdateEventDataSchema } from "@/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { IoInformationCircle } from "react-icons/io5";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { StepLayout } from "./stepLayout";

import { FiAlertCircle } from "react-icons/fi"; // React icon for errors

let lastToastId: string | number | null = null; // Store the ID of the last toast

export const ThirdStep = () => {
  const webApp = useWebApp();
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const eventData = useCreateEventStore((state) => state.eventData);
  const editOptions = useCreateEventStore((state) => state.edit);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [errors, setErrors] = useState<{
    secret_phrase?: string[] | undefined;
    ts_reward_url?: string[] | undefined;
  }>();

  const [passwordDisabled, setPasswordDisabled] = useState(
    !!editOptions?.eventHash
  );
  const [passwordValue, setPasswordValue] = useState(
    editOptions?.eventHash ? "{** click to change password **}" : ""
  );

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
      secret_phrase: passwordDisabled
        ? undefined
        : formDataObject.secret_phrase,
    };

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
            init_data: webApp?.initData || "",
            eventData: updateParsedData.data,
          });
          return;
        }
      }

      const parsedEventData = EventDataSchema.safeParse(dataToSubmit);
      console.log("dataToSubmit", dataToSubmit);
      console.log("parsedEventData", parsedEventData);
      if (parsedEventData.success) {
        addEvent.mutate({
          eventData: parsedEventData.data,
          init_data: webApp?.initData || "",
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

  const handlePasswordClick = () => {
    setPasswordDisabled(false);
    setPasswordValue(""); // Clear the placeholder text
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

  return (
    <StepLayout>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {/* Secret Phrase Field */}
        <div className="space-y-2">
          <label htmlFor="secret_phrase">Events password</label>
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
            By setting a password for the event, you can prevent checking-in
            unexpectedly and receiving a reward without attending the event.
          </AlertGeneric>
        </div>
        {/* Reward Image Upload */}
        <div className="space-y-2">
          <label htmlFor="reward_image">Reward Image</label>
          <AlertGeneric variant="info">
            Events reward badge, visible on TON society. It cannot be changed
            after event creation.
          </AlertGeneric>
          {editOptions?.eventHash ? (
            eventData?.ts_reward_url ? (
              <div className="flex justify-center gap-4 items-center pt-2 w-full">
                <Image
                  src={eventData?.ts_reward_url}
                  alt="reward image"
                  width={300}
                  height={300}
                  className="rounded-xl"
                />
              </div>
            ) : null
          ) : (
            <UploadImageFile
              changeText="Upload Reward Image"
              infoText="Image must be in 1:1 ratio"
              triggerText="Upload"
              drawerDescriptionText="Upload your SBT reward image"
              onDone={(url) => {
                setEventData({ ...eventData, ts_reward_url: url });
                clearImageError(); // Clear error when a valid image is uploaded
              }}
              isError={Boolean(errors?.ts_reward_url)}
              defaultImage={eventData?.ts_reward_url}
            />
          )}
        </div>
      </form>

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
  );
};
