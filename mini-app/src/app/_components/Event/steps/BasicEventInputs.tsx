import React from "react";
import ListLayout from "../../atoms/cards/ListLayout";
import { ListInput } from "konsta/react";
import TonHubPicker from "../../molecules/pickers/TonHubpicker";
import { ImageUpload } from "./ImageUpload";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useGetHubs } from "@/hooks/events.hooks";

const BasicEventInputs = () => {
  const errors = useCreateEventStore((state) => state.generalStepErrors);
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const clearImageError = useCreateEventStore((state) => state.clearImageErrors);
  const hubsResponse = useGetHubs();

  return (
    <ListLayout
      title="Basic"
      isLoading={hubsResponse.isLoading}
    >
      <ListInput
        outline
        placeholder="Event Title"
        name="title"
        label="Event Title"
        defaultValue={eventData?.title}
        error={errors?.title?.join(". ")}
      />
      <ListInput
        outline
        placeholder="Subtitle"
        name="subtitle"
        label="Subtitle"
        defaultValue={eventData?.subtitle}
        error={errors?.subtitle?.join(". ")}
      />
      <TonHubPicker
        onValueChange={(data) => {
          if (data) {
            setEventData({ society_hub: data });
          }
        }}
        value={eventData?.society_hub}
        errors={errors?.hub}
      />
      <ListInput
        type="textarea"
        outline
        placeholder="Description"
        label="Description"
        name="description"
        inputClassName="min-h-20"
        error={errors?.description?.join(". ")}
        defaultValue={eventData?.description}
      />
      <ImageUpload
        isError={Boolean(errors?.image_url)}
        clearError={clearImageError}
      />
    </ListLayout>
  );
};

export default BasicEventInputs;
