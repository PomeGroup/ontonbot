"use client";
import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { useCallback, useEffect, useRef } from "react";
import { z } from "zod";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { toast } from "sonner";
import { FiAlertCircle } from "react-icons/fi";
import * as React from "react";
import { dataValidationSchema } from "@/zodSchema/dataValidationSchema"; // Import icon for errors
import TimePlaceForm from "@/app/_components/Event/steps/TimePlaceForm";

export const TimePlaceStep = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const setCurrentStep = useCreateEventStore((state) => state.setCurrentStep);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const editOptions = useCreateEventStore((state) => state.edit);
  const eventData = useCreateEventStore((state) => state.eventData);
  const setErrors = useCreateEventStore(
    (state) => state.setTimePlaceStepErrors
  );
  const clearErrors = useCreateEventStore(
    (state) => state.clearTimePlaceStepErrors
  );

  const startDateLimit = (Date.now() - 1000 * 3600 * 4) / 1000; // 4 hours before now

  let lastToastIdRef = useRef<string | number | null>(null); // Store the ID of the last toast using a ref

  const handleSubmit = useCallback(() => {
    if (!formRef.current) {
      return;
    }

    const secondStepDataSchema = z
      .object({
        // if it was an update we let users enter whenever time they want
        start_date: z
          .number()
          .positive("Start date must be a valid positive timestamp")
          .refine(
            (data) => Boolean(editOptions?.eventHash) || data > startDateLimit,
            {
              message: "Start date must be in the future",
            }
          ),
        end_date: z
          .number()
          .positive("End date must be a valid positive timestamp")
          // End date must be greater than now
          .min((Date.now() + 1000 * 60 * 4) / 1000, {
            message: "End date must be in the future",
          })
          .refine(
            (data) =>
              Boolean(editOptions?.eventHash) || data > eventData?.start_date!,
            {
              message: "End date must be after start date",
            }
          ),
        timezone: z.string().min(1),
        duration: z.number().refine((data) => data > 0, {
          message: "Duration must be greater than 0",
        }),
        eventLocationType: z.enum(["online", "in_person"]),
        location: z.string().optional(),
        cityId: z.number().optional(),
        countryId: z.number().optional(),
      })
      .refine(
        (data) => {
          if (data.eventLocationType === "online") {
            return dataValidationSchema.urlSchema.safeParse(data.location)
              .success;
          }
          return true;
        },
        {
          message: "Please enter a valid URL for online events",
          path: ["location"],
        }
      )
      .refine(
        (data) => {
          if (data.eventLocationType === "in_person") {
            return data.cityId !== undefined && data.countryId !== undefined;
          }
          return true;
        },
        {
          message: "City and Country are required for in-person events",
          path: ["cityId", "countryId"],
        }
      );

    const formData = new FormData(formRef.current);
    const formDataObject = Object.fromEntries(formData.entries()) as Record<
      string,
      any
    >;
    console.log("form data", formDataObject);

    formDataObject.start_date =
      new Date(formDataObject?.start_date).getTime() / 1000;
    formDataObject.end_date =
      new Date(formDataObject?.end_date).getTime() / 1000;
    formDataObject.duration =
      (formDataObject.end_date || 0) - (formDataObject.start_date || 0);
    formDataObject.timezone = eventData?.timezone || "";
    formDataObject.eventLocationType = eventData?.eventLocationType || "online";
    formDataObject.cityId = eventData?.cityId
      ? Number(eventData.cityId)
      : undefined;
    formDataObject.countryId = eventData?.countryId
      ? Number(eventData.countryId)
      : undefined;

    const formDataParsed = secondStepDataSchema.safeParse(formDataObject);

    if (!formDataParsed.success) {
      setErrors(formDataParsed.error.flatten().fieldErrors);

      const flattenedErrors = formDataParsed.error.flatten().fieldErrors;

      const errorMessages = [
        flattenedErrors.start_date && (
          <div
            key="start_date"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.start_date[0]}
          </div>
        ),
        flattenedErrors.end_date && (
          <div
            key="end_date"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.end_date[0]}
          </div>
        ),
        flattenedErrors.timezone && (
          <div
            key="timezone"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.timezone[0]}
          </div>
        ),
        flattenedErrors.location && (
          <div
            key="location"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.location[0]}
          </div>
        ),
        flattenedErrors.cityId && (
          <div
            key="cityId"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.cityId[0]}
          </div>
        ),
        flattenedErrors.countryId && (
          <div
            key="countryId"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.countryId[0]}
          </div>
        ),
      ].filter(Boolean); // Filter out undefined messages

      // Dismiss the previous error toast, if any
      if (lastToastIdRef.current) {
        toast.dismiss(lastToastIdRef.current); // Correctly dismissing the last toast using ref
      }

      // Show new toast with errors
      lastToastIdRef.current = toast.error(<div>{errorMessages}</div>, {
        duration: 3000, // Set duration for 5 seconds
      });

      return;
    }

    const data = formDataParsed.data;

    setEventData({
      ...eventData,
      ...data,
    });
    clearErrors();
    setCurrentStep(3);
  }, [Object.values(eventData || {})]);

  useEffect(() => {
    setEventData({
      ...eventData,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      eventLocationType: eventData?.eventLocationType || "online",
    });
  }, []);

  return (
    <>
      <form
        onSubmit={(e) => e.preventDefault()}
        ref={formRef}
      >
        <TimePlaceForm />
      </form>
      <MainButton
        text="Next Step"
        onClick={handleSubmit}
      />
    </>
  );
};
