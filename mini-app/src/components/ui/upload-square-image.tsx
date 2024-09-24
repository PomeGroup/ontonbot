import { useState, useRef, useEffect, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CircleArrowUp } from "lucide-react";
import Image from "next/image";
import Cropper, { Area } from "react-easy-crop";
import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { cn, fileToBase64 } from "@/lib/utils";

/**
 * Props for the UploadImageFile component.
 */
type UploadSquareImageProps = {
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
export const UploadSquareImage = ({
  triggerText,
  infoText,
  changeText,
  onImageChange,
  isError = false,
  onDone,
  defaultImage,
}: UploadSquareImageProps) => {
  const webApp = useWebApp();
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    defaultImage
  );
  const [image, setImage] = useState<string | null>(defaultImage || null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = trpc.files.uploadImage.useMutation({
    onSuccess: (data) => {
      setImagePreview(data.imageUrl);
      onImageChange?.(data.imageUrl);
    },
  });

  useEffect(() => {
    setImagePreview(defaultImage);
    setImage(defaultImage || null);
  }, [defaultImage]);

  const handleSubmit = async () => {
    const fileInput = imageInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return;
    }
    const file = fileInput.files[0];
    const imageData = (await fileToBase64(file)) as string;
    setImage(imageData);
    setIsDialogOpen(true);
  };

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        }
      }, "image/jpeg");
    });
  };

  const handleCropSave = async () => {
    if (image && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      if (croppedImage) {
        uploadImage.mutate({
          init_data: webApp?.initData || "",
          image: croppedImage,
        });
        setIsDialogOpen(false);
      }
    }
  };

  return (
    <Drawer
      onOpenChange={(open) => {
        open ? webApp?.MainButton.hide() : webApp?.MainButton.show();
        webApp?.HapticFeedback.impactOccurred("medium");
      }}
    >
      <DrawerTrigger asChild>
        <Button
          type="button"
          className={cn(
            "w-full h-auto flex flex-col border gap-3.5 border-dashed rounded-xl p-3",
            isError ? "border-red-500 bg-red-400/10" : "border-primary"
          )}
          variant={isError ? "destructive" : "outline"}
        >
          {imagePreview ? (
            <div className="flex gap-4 items-center justify-start w-full">
              <Image
                alt="Uploaded image"
                className="rounded-xl"
                src={imagePreview}
                width={80}
                height={80}
              />
              <p className="font-semibold flex items-center gap-2 text-lg">
                <CircleArrowUp className="w-5" />
                {changeText}
              </p>
            </div>
          ) : (
            <>
              <p className="font-semibold flex items-center gap-2 text-lg">
                <CircleArrowUp className="w-5" />
                {triggerText}
              </p>
              {infoText && (
                <p className="text-muted-foreground text-sm w-full text-balance">
                  {infoText}
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
            alt="Uploaded Images"
            className="w-full h-auto"
          />
        )}
        <Dialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crop Image</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[300px]">
              {image && (
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleCropSave}
                type="button"
              >
                Save Cropped Image
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <DrawerFooter>
          <input
            ref={imageInputRef}
            type="file"
            name="image"
            accept="image/*"
            className="hidden"
            onChange={handleSubmit}
          />
          <Button
            type="button"
            className="w-full"
            onClick={() => imageInputRef.current?.click()}
            isLoading={uploadImage.isLoading}
          >
            <CircleArrowUp className="w-5" />
            <span>{imagePreview ? "Change Image" : "Upload Images"}</span>
          </Button>
          {imagePreview && (
            <DrawerClose asChild>
              <Button
                className="w-16 mx-auto rounded-full mt-4"
                variant="secondary"
                onClick={() => onDone?.(imagePreview)}
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
