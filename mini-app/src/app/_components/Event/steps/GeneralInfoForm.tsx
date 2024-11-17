"use client";
import TonHubPicker from "@/app/_components/molecules/pickers/TonHubpicker";
import { ImageUpload } from "@/app/_components/Event/steps/ImageUpload";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { Toggle } from "@/components/ui/switch";
import { BlockTitle, List, ListInput, ListItem } from "konsta/react";

export const EventGeneralInfoFormFields = () => {
  const errors = useCreateEventStore((state) => state.generalStepErrors);
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const clearImageError = useCreateEventStore((state) => state.clearImageError);

  return (
    <div>
      <BlockTitle>Basic</BlockTitle>
      <List>
        <ListInput
          outline
          placeholder="Event Title"
          name="title"
          defaultValue={eventData?.title}
          error={errors?.title?.join(". ")}
        />
        <ListInput
          outline
          placeholder="Subtitle"
          name="subtitle"
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
          name="description"
          inputClassName="min-h-20"
          error={errors?.description?.join(". ")}
          defaultValue={eventData?.description}
        />
      </List>
      <BlockTitle>User Registration</BlockTitle>
      <List>
        <ListItem
          label
          title="Enable User Registration"
          after={
            <Toggle
              component="div"
              className="-my-1"
            />
          }
        />
      </List>
    </div>
  );
};
