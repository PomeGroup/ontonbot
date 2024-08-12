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
import useWebApp from "@/hooks/useWebApp";
import { fileToBase64 } from "@/lib/utils";
import { SocietyHub } from "@/types";
import React, { useMemo, useRef, useState } from "react";
import { z, ZodError } from "zod";
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
  const [hub, setHub] = useState<SocietyHub>(eventData?.society_hub!);
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
    formData.append("hub", hub?.id || "");
    formData.append("image_url", eventData?.image_url || "");
    const formDataObject = Object.fromEntries(formData.entries());
    const formDataParsed = firstStepDataSchema.safeParse(formDataObject);

    console.log(formDataParsed);

    if (!formDataParsed.success) {
      setErrors(formDataParsed.error.flatten().fieldErrors);
      return;
    }

    const data = formDataParsed.data;

    setEventData({
      ...eventData,
      society_hub: {
        id: hub?.id || "",
        name: hub?.name || "",
      },
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
            placeholder="Name"
            name="title"
            errors={errors?.title}
            value={eventData?.title}
            required
          />
          <Input
            placeholder="Subtitle"
            name="subtitle"
            errors={errors?.subtitle}
            value={eventData?.subtitle}
            required
          />
          <Textarea
            placeholder="Description"
            name="description"
            required
            errors={errors?.description}
            value={eventData?.description}
          />
        </div>

        <TonHubPicker
          onValueChange={(data) => {
            setHub(data);
          }}
          value={hub}
          errors={errors?.hub}
        />
        <ImageUploadDrawer errors={errors?.image_url} />
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
  const formRef = useRef<HTMLFormElement>(null);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const eventData = useCreateEventStore((state) => state.eventData);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    eventData?.image_url
  );
  const uploadImage = trpc.files.uploadImage.useMutation({
    onSuccess: (data) => {
      setImagePreview(data.imageUrl);
    },
  });

  const setImageAsEventImage = () => {
    setEventData({
      ...eventData,
      image_url: imagePreview,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);

    const image = (await fileToBase64(formData.get("image") as Blob)) as string;
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
            variant="secondary"
            className="w-full h-12.5 flex items-center gap-2"
            isLoading={uploadImage.isLoading}
          >
            <CircleArrowUp className="w-5" />
            Upload Event’s Image
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Upload Image</DrawerTitle>
            <DrawerDescription>
              Upload your event’s poster from your device
            </DrawerDescription>
          </DrawerHeader>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="event image"
              className="w-full h-auto"
            />
          )}
          <DrawerFooter>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
            >
              <input
                ref={imageInputRef}
                type="file"
                name="image"
                accept="image/*"
                onChange={(e) => {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }}
                id="event_image_input"
                className="hidden"
              />
              <Button
                variant="secondary"
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
            </form>
            {imagePreview && (
              <DrawerClose asChild>
                <Button
                  className="w-16 h-10 mx-auto rounded-full mt-8"
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
