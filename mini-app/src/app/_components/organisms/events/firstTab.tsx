import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import TonHubPicker from "@/app/_components/molecules/pickers/TonHubpicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadImageFile } from "@/components/ui/upload-file";
import React, { useRef, useState } from "react";
import { z } from "zod";
import { useCreateEventStore } from "./createEventStore";
import { StepLayout } from "./stepLayout";

const firstStepDataSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  image_url: z
    .string({
      required_error: "Please select an image",
    })
    .url({
      message: "Please select an image",
    }),
  hub: z
    .string({
      required_error: "Please select a hub",
    })
    .min(1, {
      message: "Please select a hub",
    }),
});
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
    setCurrentStep(2);
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
    >
      <StepLayout title="General Info">
        <div className="space-y-4">
          <Input
            placeholder="Event Title"
            name="title"
            errors={errors?.title}
            defaultValue={eventData?.title}
          />
          <Input
            placeholder="Subtitle"
            name="subtitle"
            errors={errors?.subtitle}
            defaultValue={eventData?.subtitle}
          />
          <Textarea
            placeholder="Description"
            name="description"
            errors={errors?.description}
            defaultValue={eventData?.description}
          />
        </div>
        <TonHubPicker
          onValueChange={(data) => {
            if (data) {
              setEventData({ society_hub: data });
            }
          }}
          value={eventData?.society_hub}
          errors={errors?.hub}
        />
        <UploadImageFile
          triggerText="Upload Event Image"
          infoText="Image must be in 1:1 ratio(same height and width)"
          changeText="Change Image"
          isError={Boolean(errors?.image_url)}
        />
      </StepLayout>
      <MainButton
        text="Next Step"
        onClick={() => formRef.current?.requestSubmit()}
      />
    </form>
  );
};
