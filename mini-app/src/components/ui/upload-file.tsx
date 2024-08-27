import { useCreateEventStore } from "@/app/_components/organisms/events/createEventStore";
import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { cn, fileToBase64 } from "@/lib/utils";
import { CircleArrowUp } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";

type UploadFileProps = {
  triggerText: React.ReactNode;
  infoText: React.ReactNode;
  changeText: React.ReactNode;
  onImageChange?: (img_url: string) => void;
  isError?: boolean;
};

export const UploadImageFile = (props: UploadFileProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const webApp = useWebApp();
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    undefined
  );
  const uploadImage = trpc.files.uploadImage.useMutation({
    onSuccess: (data) => {
      setImagePreview(data.imageUrl);
      props.onImageChange?.(data.imageUrl);
    },
  });

  useEffect(() => {
    // Set the initial image preview when the component mounts
    setImagePreview(eventData?.image_url);
  }, [eventData?.image_url]);

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

  const setImageAsEventImage = () => {
    setEventData({
      ...eventData,
      image_url: imagePreview,
    });
  };

  return (
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
          className={cn(
            "w-full h-auto flex flex-col border border-primary gap-3.5 border-dashed rounded-xl p-3",
            props.isError ? "border-red-500 bg-red-400/10" : "border-primary"
          )}
          variant={props.isError ? "destructive" : "outline"}
        >
          {imagePreview ? (
            <div className="flex gap-4 items-center justify-start w-full">
              <Image
                alt="upload file"
                className="rounded-xl"
                src={imagePreview}
                width={80}
                height={80}
              />
              <p className="font-semibold flex items-center gap-2 text-lg">
                <CircleArrowUp className="w-5" />
                {props.changeText}
              </p>
            </div>
          ) : (
            <>
              <p className="font-semibold flex items-center gap-2 text-lg">
                <CircleArrowUp className="w-5" />
                {props.triggerText}
              </p>
              {props.infoText && (
                <p className="text-muted-foreground text-sm w-full text-balance">
                  {props.infoText}
                </p>
              )}
            </>
          )}
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
  );
};
