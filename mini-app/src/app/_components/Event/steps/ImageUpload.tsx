import { UploadImageFile } from "@/components/ui/upload-file";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { Block } from "konsta/react";

export const ImageUpload = ({ isError, clearError }: { isError: boolean; clearError: () => void }) => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);

  const handleImageChange = (img_url: string) => {
    setEventData({ ...eventData, image_url: img_url });
    clearError();
  };

  return (
    <Block>
      <UploadImageFile
        triggerText="Upload Event Image"
        drawerDescriptionText="Upload your event's poster from your device"
        infoText="Image must be in 1:1 ratio"
        changeText="Change Image"
        isError={isError}
        onDone={handleImageChange}
        defaultImage={eventData?.image_url}
      />
    </Block>
  );
};
