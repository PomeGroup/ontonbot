import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import CircleArrowUp from "@/app/_components/atoms/icons/CircleArrowUp";
import TonHubPicker from "@/app/_components/molecules/pickers/TonHubpicker";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadImageFile } from "@/components/ui/upload-file";
import useWebApp from "@/hooks/useWebApp";
import { fileToBase64 } from "@/lib/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ZodError, z } from "zod";
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
        {/* <ImageUploadDrawer errors={errors?.image_url} /> */}
      </StepLayout>
      <MainButton
        text="Next Step"
        onClick={() => formRef.current?.requestSubmit()}
      />
    </form>
  );
};

const ImageUploadDrawer = (props: { errors?: (string | undefined)[] }) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const webApp = useWebApp();
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const eventData = useCreateEventStore((state) => state.eventData);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    undefined
  );
  const uploadImage = trpc.files.uploadImage.useMutation({
    onSuccess: (data) => {
      setImagePreview(data.imageUrl);
    },
  });

  useEffect(() => {
    // Set the initial image preview when the component mounts
    setImagePreview(eventData?.image_url);
  }, [eventData?.image_url]);

  const setImageAsEventImage = () => {
    setEventData({
      ...eventData,
      image_url: imagePreview,
    });
  };

  const handleSubmit = async () => {
    const fileInput = imageInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return;
    }

    const file = fileInput.files[0];
    const image = (await fileToBase64(file)) as string;
    uploadImage.mutate({
      init_data: webApp?.initData || "",
      image,
    });
  };

  const errors = useMemo(() => {
    if (uploadImage.error) {
      try {
        return (JSON.parse(uploadImage.error.message) as Array<ZodError>).map(
          (e, idx) => <p key={idx}>{e.message}</p>
        );
      } catch (error) {
        return uploadImage.error.message;
      }
    }
  }, [uploadImage.error]);

  return (
    <div>
      <Drawer
        onOpenChange={(open) => {
          webApp?.HapticFeedback.impactOccurred("medium");
          if (open) {
            webApp?.MainButton.hide();
          } else {
            webApp?.MainButton.show();
          }
        }}
      >
        <DrawerTrigger asChild>
          <Button
            variant="default"
            className="w-full h-12.5 flex items-center gap-2"
            isLoading={uploadImage.isLoading}
          >
            <CircleArrowUp className="w-5" />
            {imagePreview ? "Change Image" : "Upload Event’s Image"}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Upload Image</DrawerTitle>
            {!imagePreview && (
              <DrawerDescription>
                Upload your event’s poster from your device
              </DrawerDescription>
            )}
          </DrawerHeader>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="event image"
              className="w-full h-auto"
            />
          )}
          <DrawerFooter>
            <input
              ref={imageInputRef}
              type="file"
              name="image"
              accept="image/*"
              onChange={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              id="event_image_input"
              className="hidden"
            />
            <Button
              type="button"
              className="w-full h-12.5 flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                imageInputRef.current?.click();
              }}
              isLoading={uploadImage.isLoading}
            >
              <CircleArrowUp className="w-5" />
              <span>{imagePreview ? "Change Image" : "Upload Image"}</span>
            </Button>
            {uploadImage.isError && (
              <div className="text-red-500">{errors}</div>
            )}
            {imagePreview && (
              <DrawerClose asChild>
                <Button
                  className="w-16 h-10 mx-auto rounded-full mt-4"
                  variant="secondary"
                  onClick={setImageAsEventImage}
                >
                  Done
                </Button>
              </DrawerClose>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <div className="text-red-500">
        {props.errors?.map((e, idx) => <p key={idx}>{e}</p>)}
      </div>
    </div>
  );
};
