import React, { useRef, useState } from "react";

import { z } from "zod";
import { toast } from "sonner";
import { FiAlertCircle } from "react-icons/fi"; // React icon for errors
import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import TonHubPicker from "@/app/_components/molecules/pickers/TonHubpicker";
import { Input } from "@/components/ui/input";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { StepLayout } from "./stepLayout";
import { Textarea } from "@/components/ui/textarea";
import { UploadSquareImage } from "@/components/ui/upload-square-image";
import { Section } from "@telegram-apps/telegram-ui";
import CancelEventCard from "@/app/events/[UUID]/CancelEventCard";
import NewRegisterationCard from "@/app/events/[UUID]/NewRegisterationCard";

let lastToastId: string | number | null = null; // Store the ID of the last toast

// Image Upload Component
const ImageUpload = ({
  isError,
  clearError,
}: {
  isError: boolean;
  clearError: () => void;
}) => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);

  const handleImageChange = (img_url: string) => {
    setEventData({ ...eventData, image_url: img_url });
    clearError(); // Clear the error once a valid image is uploaded
  };

  return (
    <UploadSquareImage
      triggerText="Upload Event Image"
      infoText="Image must be in 1:1 ratio"
      changeText="Change Image"
      isError={isError}
      onImageChange={handleImageChange}
      defaultImage={eventData?.image_url}
    />
  );
};

// Schema for Form Validation using Zod
const firstStepDataSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Title must be at least 2 characters" })
    .max(40, { message: "Title must be less than 40 characters" }),
  subtitle: z
    .string()
    .min(2, { message: "Subtitle must be at least 2 characters" })
    .max(100),
  description: z
    .string({ required_error: "Please enter a description" })
    .min(1, { message: "Description must be at least 1 character" }),
  image_url: z
    .string({ required_error: "Please select an image" })
    .url({ message: "Please select a valid image" }),
  hub: z
    .string({ required_error: "Please select a hub" })
    .min(1, { message: "Please select a hub" }),
});

export const FirstStep = ({edit = false}: {edit?: boolean}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const setCurrentStep = useCreateEventStore((state) => state.setCurrentStep);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const eventData = useCreateEventStore((state) => state.eventData);

  const [errors, setErrors] = useState<{
    title?: string[] | undefined;
    subtitle?: string[] | undefined;
    description?: string[] | undefined;
    image_url?: string[] | undefined;
    hub?: string[] | undefined;
  }>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    formData.append("hub", eventData?.society_hub?.id || "");
    formData.append("image_url", eventData?.image_url || "");
    formData.append("description", eventData?.description || "");

    const formDataObject = Object.fromEntries(formData.entries());
    const formDataParsed = firstStepDataSchema.safeParse(formDataObject);

    if (!formDataParsed.success) {
      console.log("eventData?.description", eventData?.description)
      setErrors(formDataParsed.error.flatten().fieldErrors);
      const flattenedErrors = formDataParsed.error.flatten().fieldErrors;

      // Prepare error messages with icons
      const errorMessages = Object.keys(flattenedErrors).map((field) => {
        const error = flattenedErrors[field as keyof typeof flattenedErrors];

        if (!error) return null;

        switch (field) {
          case "title":
            return (
              <div key="title" className="flex items-center">
                <FiAlertCircle className="mr-2" /> {error[0]}
              </div>
            );
          case "subtitle":
            return (
              <div key="subtitle" className="flex items-center">
                <FiAlertCircle className="mr-2" /> {error[0]}
              </div>
            );
          case "description":
            return (
              <div key="description" className="flex items-center">
                <FiAlertCircle className="mr-2" /> {error[0]}
              </div>
            );
          case "image_url":
            return (
              <div key="image_url" className="flex items-center">
                <FiAlertCircle className="mr-2" /> {error[0]}
              </div>
            );
          case "hub":
            return (
              <div key="hub" className="flex items-center">
                <FiAlertCircle className="mr-2" /> {error[0]}
              </div>
            );
          default:
            return null;
        }
      }).filter(Boolean);


      // Dismiss the previous error toast, if any
      if (lastToastId) {
        toast.dismiss(lastToastId);
      }

      // Show the new toast with multiline error messages and store the toast ID
      lastToastId = toast.error(
        <div>{errorMessages}</div>,
        { duration: 3000 } // Set duration to 5 seconds
      );
      return;
    }

    const data = formDataParsed.data;
    setEventData({ ...eventData, ...data, });
    setCurrentStep(2);
  };

  const clearImageError = () => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      image_url: undefined,
    }));
  };
  return (
    <main>
      { edit &&
      <Section className={"py-6"}>
        <CancelEventCard />
        <NewRegisterationCard />
      </Section>}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
      >
        <StepLayout>
          <div className="space-y-4">
            <Input placeholder="Event Title" name="title" errors={errors?.title} defaultValue={eventData?.title} />
            <Input placeholder="Subtitle" name="subtitle" errors={errors?.subtitle} defaultValue={eventData?.subtitle} />
          </div>

          <TonHubPicker
            onValueChange={(data) => { data && setEventData({ ...eventData, society_hub: data }); }}
            value={eventData?.society_hub}
            errors={errors?.hub}
          />

          <ImageUpload
            isError={Boolean(errors?.image_url)}
            clearError={clearImageError}
          />

          <Textarea
            placeholder="Description" name="description" errors={errors?.description} defaultValue={eventData?.description}
            onChange={(e) => setEventData({ description: e.target.value })}
          />
          <MainButton text="Next Step" onClick={() => formRef.current?.requestSubmit()} />
        </StepLayout>
      </form></main>
  );
}
