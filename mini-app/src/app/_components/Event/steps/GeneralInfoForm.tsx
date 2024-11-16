import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TonHubPicker from "@/app/_components/molecules/pickers/TonHubpicker";
import { ImageUpload } from "@/app/_components/Event/steps/ImageUpload";
import { useCreateEventStore } from "@/zustand/createEventStore";

export const EventGeneralInfoFormFields = () => {
  const errors = useCreateEventStore((state) => state.generalStepErrors);
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const clearImageError = useCreateEventStore((state) => state.clearImageError);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Event Title"
        name="title"
        errors={errors?.title}
        defaultValue={eventData?.title}
      />
      <Input
        placeholder="Subtitle"
        name="subtitle"
        errors={errors?.subtitle}
        defaultValue={eventData?.subtitle}
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

      <Textarea
        placeholder="Description"
        name="description"
        errors={errors?.description}
        defaultValue={eventData?.description}
      />
    </div>
  );
};
