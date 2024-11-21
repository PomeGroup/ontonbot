import React from "react";
import FormBlock from "../../atoms/cards/FormBlock";
import { ListInput } from "konsta/react";
import TonHubPicker from "../../molecules/pickers/TonHubpicker";
import { ImageUpload } from "./ImageUpload";
import { useCreateEventStore } from "@/zustand/createEventStore";

const BasicEventInputs = () => {
  const errors = useCreateEventStore((state) => state.generalStepErrors);
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const clearImageError = useCreateEventStore(
    (state) => state.clearImageErrors
  );

  return (
    <FormBlock title="Basic">
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
      <ImageUpload
        isError={Boolean(errors?.image_url)}
        clearError={clearImageError}
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
    </FormBlock>
  );
};

export default BasicEventInputs;
