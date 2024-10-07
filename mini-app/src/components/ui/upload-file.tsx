import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { getErrorMessages } from "@/lib/error";
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

/**
 * Props for the UploadImageFile component.
 */
type UploadFileProps = {
  /**
   * The text to display on the trigger button.
   */
  triggerText: React.ReactNode;

  /**
   * The text to display below the trigger button, providing additional information.
   */
  infoText: React.ReactNode;

  /**
   * The text to display on the change button, shown after an image has been uploaded.
   */
  changeText: React.ReactNode;

  /**
   * An optional callback function called when an image is uploaded, passing the uploaded image URL as an argument.
   */
  onImageChange?: (_img_url: string) => void;

  /**
   * An optional boolean indicating whether an error has occurred.
   */
  isError?: boolean;

  /**
   * An optional callback function called when the upload is complete, passing the uploaded image URL as an argument.
   */
  onDone?: (_img_url: string) => void;

  /**
   * An optional default image URL to display before an image is uploaded.
   */
  defaultImage?: string;
};

/**
 * A component for uploading an image file.
 *
 * @param {UploadFileProps} props - The component props.
 * @return {JSX.Element} The JSX element representing the component.
 */
export const UploadImageFile = (props: UploadFileProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
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
    setImagePreview(props?.defaultImage);
  }, [props?.defaultImage]);

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
      subfolder: "event",
    });
  };

  return (
    <Drawer
      onOpenChange={(open) => {
        if (open) {
          webApp?.MainButton.hide();
        } else {
          webApp?.MainButton.show();
        }
        try {
          webApp?.HapticFeedback.impactOccurred("medium");
        } catch (error) {}
      }}
    >
      <DrawerTrigger asChild>
        <Button
          className={cn(
            "w-full h-auto flex flex-col border border-primary gap-3.5 border-dashed rounded-xl p-3",
            props.isError ? "border-red-300 bg-red-400/10" : "border-primary"
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
          <Image
            src={imagePreview}
            width={400}
            height={400}
            alt="event image"
            draggable="false"
            className="w-full h-auto"
          />
        )}
        {uploadImage.error && (
          <div className="text-red-500 text-sm w-full text-balance mt-2">
            {getErrorMessages(uploadImage.error.message).map(
              (errMessage, idx: number) => (
                <p key={idx}>{errMessage}</p>
              )
            )}
          </div>
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
                onClick={() =>
                  typeof props?.onDone === "function" &&
                  props.onDone(imagePreview)
                }
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
