import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { getErrorMessages } from "@/lib/error";
import { cn, fileToBase64 } from "@/lib/utils";
import { CircleArrowUp } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button, KButton } from "./button";
import { Block, BlockTitle, Sheet } from "konsta/react";
import { createPortal } from "react-dom";

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
  const [videoPreview, setVideoPreview] = useState<string | undefined>(props.defaultVideo);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

  // Function to check if the video is square
  const checkIfSquareVideo = async (file: File): Promise<boolean> => {
    console.log("File metadata loaded: ", File);
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      console.log("Video metadata loaded: ", video);
      // Set up event listeners
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src); // Free up memory

        resolve(video.videoWidth === video.videoHeight);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src); // Free up memory
        reject(new Error("Failed to load video metadata. Please ensure the video is a valid MP4 file."));
      };

      // Assign the video source
      video.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async () => {
    const fileInput = videoInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return;
    }

    const file = fileInput.files[0];

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5 MB");
      return;
    }

    // Validate file type
    if (file.type !== "video/mp4") {
      alert("Only MP4 format is allowed");
      return;
    }

    try {
      // Check if the video is square
      const isSquare = await checkIfSquareVideo(file);
      if (!isSquare) {
        alert("Only square videos are allowed");
        return;
      }

      // Convert file to base64 for upload
      const video = (await fileToBase64(file)) as string;

      // Proceed with upload
      uploadVideo.mutate({
        video,
        subfolder: "event",
      });
    } catch (error) {
      console.error(error);
      alert("Failed to upload video. Please try again.");
    }
  };

  useEffect(() => {
    if (isSheetOpen) {
      webApp?.MainButton.hide();
    } else {
      webApp?.MainButton.show();
    }
  }, [isSheetOpen]);

  return (
    <>
      <Button
        className={cn(
          "w-full h-auto flex flex-col border border-cn-primary gap-3.5 border-dashed rounded-xl p-3",
          props.isError ? "border-red-300 bg-red-400/10" : "border-cn-primary"
        )}
        onClick={() => setIsSheetOpen(true)}
        type="button"
        variant={props.isError ? "destructive" : "outline"}
      >
        {videoPreview ? (
          <div className="flex gap-4 items-center justify-start w-full">
            <video
              key={videoPreview}
              width="80"
              height="80"
              autoPlay
              loop
              muted
              playsInline
              className="rounded-xl"
            >
              <source
                src={videoPreview}
                type="video/mp4"
              />
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
              <p className="text-cn-muted-foreground text-sm w-full text-balance">{props.infoText}</p>
            )}
          </>
        )}
      </Button>
      {createPortal(
        <Sheet
          opened={isSheetOpen}
          onBackdropClick={() => setIsSheetOpen(false)}
          className={cn("w-full")}
        >
          <BlockTitle>Upload Video</BlockTitle>
          <Block className="space-y-2">
            {!videoPreview && (
              <p>{props.drawerDescriptionText || "Upload an MP4 video from your device (max 5 MB)"}</p>
            )}
            {videoPreview && (
              <video
                key={videoPreview}
                controls
                width="100"
                height="100"
                className="w-full h-auto"
              >
                <source
                  src={videoPreview}
                  type="video/mp4"
                />
              </video>
            )}
            {uploadVideo.error && (
              <div className="text-red-500 text-sm w-full text-balance mt-2">
                {getErrorMessages(uploadVideo.error.message).map((errMessage, idx: number) => (
                  <p key={idx}>{errMessage}</p>
                ))}
              </div>
            )}
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
            <KButton
              itemType="button"
              clear
              className="w-full h-12.5 flex items-center gap-2"
              disabled={uploadVideo.isLoading}
              onClick={(e) => {
                e.preventDefault();
                // click on upload input
                videoInputRef.current?.click();
              }}
            >
              <CircleArrowUp className="w-5" />
              <span>{videoPreview ? "Change Video" : "Upload Video"}</span>
            </KButton>
            {videoPreview && (
              <KButton
                className="w-16 h-10 mx-auto rounded-full mt-4"
                onClick={(e) => {
                  e.preventDefault();
                  setIsSheetOpen(false);
                  typeof props?.onDone === "function" && props.onDone(videoPreview);
                }}
                itemType="button"
              >
                Done
              </KButton>
            )}
          </Block>
        </Sheet>,
        document.body
      )}
    </>
  );
};
