"use client";
import React, { useRef, useState } from "react";
import dynamic from 'next/dynamic';
import { z } from "zod";

import "react-quill/dist/quill.snow.css"; // Import Quill CSS
import "./react-quill.css"; // Custom CSS
import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import TonHubPicker from "@/app/_components/molecules/pickers/TonHubpicker";
import { Input } from "@/components/ui/input";
import { UploadImageFile } from "@/components/ui/upload-file";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { StepLayout } from "./stepLayout";
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
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
    <UploadImageFile
      triggerText="Upload Event Image"
      infoText="Image must be in 1:1 ratio"
      changeText="Change Image"
      isError={isError}
      onDone={handleImageChange}
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
  // description: z.string().min(1, { message: "Description must be at least 1 character" }),
  image_url: z
    .string({ required_error: "Please select an image" })
    .url({ message: "Please select an image" }),
  hub: z
    .string({ required_error: "Please select a hub" })
    .min(1, { message: "Please select a hub" }),
});

// Main Component
export const FirstStep = () => {
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
// Define the Quill toolbar modules
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      [{ 'color': [] },'link', 'image','clean'],
    ]
  };
  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    formData.append("hub", eventData?.society_hub?.id || "");
    formData.append("image_url", eventData?.image_url || "");

    const formDataObject = Object.fromEntries(formData.entries());
    const formDataParsed = firstStepDataSchema.safeParse(formDataObject);

    if (!formDataParsed.success) {
      setErrors(formDataParsed.error.flatten().fieldErrors);
      return;
    }

    const data = formDataParsed.data;
    setEventData({
      ...eventData,
      ...data,
    });

    setCurrentStep(2); // Move to the next step on success
  };

  // Function to clear image URL error
  const clearImageError = () => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      image_url: undefined, // Clear the image URL error when valid image is uploaded
    }));
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
    >
      <StepLayout>
        <div className="space-y-4">
          {/* Title Input */}
          <Input
            placeholder="Event Title"
            name="title"
            errors={errors?.title}
            defaultValue={eventData?.title}
          />

          {/* Subtitle Input */}
          <Input
            placeholder="Subtitle"
            name="subtitle"
            errors={errors?.subtitle}
            defaultValue={eventData?.subtitle}
          />
        </div>

        {/* Hub Picker */}
        <TonHubPicker
          onValueChange={(data) => {
            if (data) {
              setEventData({ society_hub: data });
            }
          }}
          value={eventData?.society_hub}
          errors={errors?.hub}
        />

        {/* Image Upload */}
        <ImageUpload
          isError={Boolean(errors?.image_url)}
          clearError={clearImageError}
        />

        {/* Description Editor */}
        <ReactQuill
          value={eventData?.description || ""}
          onChange={(value) =>
            setEventData({ ...eventData, description: value })
          }
          placeholder="Enter the event description here..."
          modules={modules}
        />

        {/* Submit Button */}
        <MainButton
          text="Next Step"
          onClick={() => formRef.current?.requestSubmit()}
        />
      </StepLayout>
    </form>
  );
};
