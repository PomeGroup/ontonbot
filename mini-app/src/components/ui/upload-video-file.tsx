import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { getErrorMessages } from "@/lib/error";
import { cn, fileToBase64 } from "@/lib/utils";
import { CircleArrowUp } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
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
  onVideoChange?: (_video_url: string) => void;
  isError?: boolean;
  onDone?: (_video_url: string) => void;
  defaultVideo?: string;
  drawerDescriptionText?: string;
};

export const UploadVideoFile = (props: UploadFileProps) => {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const webApp = useWebApp();
  const [videoPreview, setVideoPreview] = useState<string | undefined>(
      props.defaultVideo
  );

  const uploadVideo = trpc.files.uploadVideo.useMutation({
    onSuccess: (data) => {
      const updatedUrl = `${data.videoUrl}?t=${Date.now()}`;
      setVideoPreview(updatedUrl);
      props.onVideoChange?.(updatedUrl);
      if (videoInputRef.current) {
        videoInputRef.current.value = ""; // Clear input value to allow re-uploading the same file
      }
    },
  });

  const handleSubmit = async () => {
    const fileInput = videoInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return;
    }

    const file = fileInput.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5 MB");
      return;
    }

    if (file.type !== "video/mp4") {
      alert("Only MP4 format is allowed");
      return;
    }

    const video = (await fileToBase64(file)) as string;

    uploadVideo.mutate({
      init_data: webApp?.initData || "",
      video,
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
            {videoPreview ? (
                <div className="flex gap-4 items-center justify-start w-full">
                  <video key={videoPreview} width="40" height="40" controls>
                    <source src={videoPreview} type="video/mp4" />
                  </video>
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
            <DrawerTitle>Upload Video</DrawerTitle>
            {!videoPreview && (
                <DrawerDescription>
                  {props.drawerDescriptionText || "Upload an MP4 video from your device (max 5 MB)"}
                </DrawerDescription>
            )}
          </DrawerHeader>
          {videoPreview && (
              <video key={videoPreview} controls width="100" height="100" className="w-full h-auto">
                <source src={videoPreview} type="video/mp4" />
              </video>
          )}
          {uploadVideo.error && (
              <div className="text-red-500 text-sm w-full text-balance mt-2">
                {getErrorMessages(uploadVideo.error.message).map(
                    (errMessage, idx: number) => (
                        <p key={idx}>{errMessage}</p>
                    )
                )}
              </div>
          )}
          <DrawerFooter>
            <input
                ref={videoInputRef}
                type="file"
                name="video"
                accept="video/mp4"
                onChange={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                id="event_video_input"
                className="hidden"
            />
            <Button
                type="button"
                className="w-full h-12.5 flex items-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  videoInputRef.current?.click();
                }}
                isLoading={uploadVideo.isLoading}
            >
              <CircleArrowUp className="w-5" />
              <span>{videoPreview ? "Change Video" : "Upload Video"}</span>
            </Button>
            {videoPreview && (
                <DrawerClose asChild>
                  <Button
                      className="w-16 h-10 mx-auto rounded-full mt-4"
                      variant="secondary"
                      onClick={() =>
                          typeof props?.onDone === "function" &&
                          props.onDone(videoPreview)
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
