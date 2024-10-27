// SbtOptionContent.tsx
"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { BiSolidLeftArrow, BiSolidRightArrow } from "react-icons/bi";
import { AlertGeneric } from "@/components/ui/alert";
import { UploadImageFile } from "@/components/ui/upload-file";
import { UploadVideoFile } from "@/components/ui/upload-video-file";
import LazyLoadVideo from "./LazyLoadVideo";

import React from "react";

interface SbtOptionContentProps {
    sbtOption: "custom" | "default";
    rewardCollections: any[];
    sbtCollectionIsLoading: boolean;
    selectedSbtId: number | null;
    handleSbtSelection: (_id: number) => void;
    handleSlideChange: (_swiper: any) => void;
    setEventData: (_data: any) => void;
    errors: { ts_reward_url?: string[]; video_url?: string[] };
    clearImageError: () => void;
    clearVideoError: () => void;
}



export const SbtOptionContent: React.FC<SbtOptionContentProps> = ({
                                                                      sbtOption,
                                                                      rewardCollections,
                                                                      sbtCollectionIsLoading,
                                                                      selectedSbtId,
                                                                      handleSbtSelection,
                                                                      handleSlideChange,
                                                                      setEventData,
                                                                      errors,
                                                                      clearImageError,
                                                                      clearVideoError,
                                                                  }) => {
    if (sbtOption === "default" && rewardCollections && rewardCollections?.length > 0) {
        return sbtCollectionIsLoading ? (
            <div>Loading SBT Videos...</div>
        ) : (
            <div className="space-y-2">
                <div className="text-center w-full space-y-1">
                    <div className="font-bold text-lg">Select SBT Video</div>
                    <div className="flex items-center justify-center text-gray-500 text-sm">
                        <BiSolidLeftArrow className="mr-1" />
                        <span>Drag left or right to check other badges</span>
                        <BiSolidRightArrow className="ml-1" />
                    </div>
                </div>
                <Swiper
                    spaceBetween={20}
                    slidesPerView={1.5}
                    centeredSlides={true}
                    className="sbt-video-swiper"
                    onSlideChange={handleSlideChange}
                >
                    {rewardCollections.map((collection) => (
                        <SwiperSlide key={collection.id}>
                            <LazyLoadVideo
                                src={collection.videoLink || ""}
                                hubName={collection.hubName || ""}
                                collectionId={collection.id || 0}
                                coverImage={collection.imageLink || ""}
                                selected={selectedSbtId === collection.id}
                                onClick={() => handleSbtSelection(collection.id)}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <label htmlFor="reward_image">Reward Image</label>
            <AlertGeneric variant="info">
                Events reward badge, visible on TON society. It cannot be changed after event creation.
            </AlertGeneric>
            <UploadImageFile
                changeText="Change SBT Image"
                infoText="Image must be in 1:1 ratio"
                triggerText="Upload SBT Image"
                drawerDescriptionText="Upload your custom SBT reward image"
                onDone={(url) => {
                    setEventData({ ts_reward_url: url });
                    clearImageError();
                }}
                isError={Boolean(errors?.ts_reward_url)}
            />

            <div className="my-2">
                <label htmlFor="event_video">Event Video</label>
                <AlertGeneric variant="info" className="my-4">
                    Upload a video related to your event. Only MP4 format is allowed, and the file size must be under 5 MB.
                </AlertGeneric>
                <UploadVideoFile
                    changeText="Change SBT Video"
                    infoText="Only MP4 files under 5 MB"
                    triggerText="Upload SBT Video"
                    drawerDescriptionText="Upload a promotional video for your custom SBT"
                    onDone={(url) => {
                        setEventData({ video_url: url });
                        clearVideoError();
                    }}
                    isError={Boolean(errors?.video_url)}
                />
            </div>
        </div>
    );
};
