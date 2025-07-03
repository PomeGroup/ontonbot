import Typography from "@/components/Typography";
import { AlertGeneric } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UploadImageFile } from "@/components/ui/upload-file";
import useWebApp from "@/hooks/useWebApp";
import { useCreateEventStore } from "@/zustand/createEventStore";
import ManageEventCard from "../ManageEventCard";
import ManageEventCategory from "./ManageEventCategory";
import ManageEventDescription from "./ManageEventDescription";
import ManageEventHub from "./ManageEventHub";

const ManageEventGeneralInfo = () => {
  const webApp = useWebApp();
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const errors = useCreateEventStore((state) => state.generalStepErrors);

  return (
    <ManageEventCard title={"General Info"}>
      <Input
        label="Name"
        title="Name of the event"
        name="name"
        placeholder="What is this event called?"
        type="text"
        defaultValue={eventData.title}
        errors={errors?.title}
        onBlur={(e) => {
          e.preventDefault();
          setEventData({ title: e.target.value });
        }}
      />
      <Input
        label="Subtitle"
        title="Subtitle of the event"
        name="subtitle"
        placeholder="What happens in the event?"
        type="text"
        defaultValue={eventData.subtitle}
        errors={errors?.subtitle}
        onBlur={(e) => {
          e.preventDefault();
          setEventData({ title: e.target.value });
        }}
      />

      {/* Hub and Category */}
      <div className="flex gap-4">
        <ManageEventHub />
        <ManageEventCategory />
      </div>

      {/* Description */}
      <ManageEventDescription />

      {/* Info box */}
      <AlertGeneric variant="info-light">
        You agree to{" "}
        <button
          className="text-primary"
          onClick={(e) => {
            e.preventDefault();
            webApp?.openLink("https://onton.live/tos/");
          }}
        >
          ONTON Terms and Conditions
        </button>{" "}
        each time you create an event.
      </AlertGeneric>

      {/* Event Banner */}
      <div className="flex flex-col gap-3">
        <Typography
          variant="callout"
          weight="semibold"
        >
          Event Banner
        </Typography>
        <UploadImageFile
          triggerText="Upload Event’s Image"
          drawerDescriptionText="Upload your event's poster from your device"
          isError={!!errors?.image_url}
          infoText={
            <span>
              <span className="font-semibold">Limitations: </span>
              Image must be in <span className="font-semibold">1:1 ratio</span>
              (same height and width) and <span className="font-semibold">less than 5MB.</span>
            </span>
          }
          changeText="Change Image"
          onImageChange={(fileUrl) => {
            setEventData({
              image_url: fileUrl,
            });
          }}
        />
      </div>

      {/* Introduction Video */}
      <div className="flex justify-between items-center">
        <Typography
          variant="callout"
          weight="semibold"
        >
          Event’s Introduction Video
        </Typography>
        <Switch />
      </div>
    </ManageEventCard>
  );
};

export default ManageEventGeneralInfo;
