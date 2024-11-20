"use client";
import TonHubPicker from "@/app/_components/molecules/pickers/TonHubpicker";
import { ImageUpload } from "@/app/_components/Event/steps/ImageUpload";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { ListInput } from "konsta/react";
import FormBlock from "../../atoms/cards/FormBlock";

export const EventGeneralInfoFormFields = () => {
  const errors = useCreateEventStore((state) => state.generalStepErrors);
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const clearImageError = useCreateEventStore(
    (state) => state.clearImageErrors
  );

  return (
    <>
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
      {/* <FormBlock title="Registration"> */}
      {/*   <ListItem */}
      {/*     label */}
      {/*     title="Enable User Registration" */}
      {/*     after={ */}
      {/*       <Toggle */}
      {/*         component="div" */}
      {/*         checked */}
      {/*         className="-my-1" */}
      {/*       /> */}
      {/*     } */}
      {/*   /> */}
      {/*   <ListItem */}
      {/*     label */}
      {/*     title="Approve Users" */}
      {/*     after={ */}
      {/*       <Toggle */}
      {/*         component="div" */}
      {/*         checked */}
      {/*         className="-my-1" */}
      {/*       /> */}
      {/*     } */}
      {/*   /> */}
      {/*   <ListItem */}
      {/*     label */}
      {/*     title="Capacity" */}
      {/*     after={ */}
      {/*       <Toggle */}
      {/*         component="div" */}
      {/*         checked */}
      {/*         className="-my-1" */}
      {/*       /> */}
      {/*     } */}
      {/*   /> */}
      {/*   <ListInput */}
      {/*     label="Capacity" */}
      {/*     info="The number of participants allowed" */}
      {/*   /> */}
      {/* </FormBlock> */}
    </>
  );
};
