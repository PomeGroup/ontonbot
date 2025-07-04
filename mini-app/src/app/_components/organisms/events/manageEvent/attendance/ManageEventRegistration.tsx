import Typography from "@/components/Typography";
import { AlertGeneric } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCreateEventStore } from "@/zustand/createEventStore";
import ManageEventCard from "../ManageEventCard";
import ManageEventDivider from "../ManageEventDivider";

const ManageEventRegistration = () => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const errors = useCreateEventStore((state) => state.rewardStepErrors);
  const setEventData = useCreateEventStore((state) => state.setEventData);

  return (
    <ManageEventCard title="Registration">
      {/* Registration Form */}
      <div>
        <div className="flex justify-between items-center">
          <Typography
            variant="body"
            weight="medium"
          >
            Registration Form
          </Typography>
          <Switch
            checked={eventData.has_registration}
            onCheckedChange={(checked) => {
              setEventData({
                has_registration: checked,
              });
            }}
          />
        </div>
        <div className="mt-1 flex-1 font-normal text-[13px] leading-4 tracking-normal text-[#3C3C4399]">
          Participants need to fill out a form with their information when joining your event.
        </div>
      </div>
      {/* Divider */}
      <ManageEventDivider />

      {eventData.has_registration && (
        <>
          {/* Has Approval */}
          <div>
            <div className="flex justify-between items-center">
              <Typography
                variant="body"
                weight="medium"
              >
                Approval Required
              </Typography>
              <Switch
                checked={eventData.has_approval}
                onCheckedChange={(checked) => {
                  setEventData({
                    has_approval: checked,
                  });
                }}
              />
            </div>
            <div className="mt-1 flex-1 font-normal text-[13px] leading-4 tracking-normal text-[#3C3C4399]">
              Your participants need to be approved by you after filling out the registration form.
            </div>
          </div>
          {/* Divider */}
          <ManageEventDivider />
          {/* Has Approval */}
          <div>
            <div className="flex justify-between items-center">
              <Typography
                variant="body"
                weight="medium"
              >
                Capacity
              </Typography>
            </div>
            <div className="mt-1 flex-1 font-normal text-[13px] leading-4 tracking-normal text-[#3C3C4399]">
              Max Capacity is 100 guests. Automatically closes registration once capacity is reached, Counting only approved
              guests.
            </div>
            <Input
              label="Max Capacity"
              placeholder="100"
              name="capacity"
              type="number"
              min={1}
              defaultValue={eventData.capacity || 100}
              onBlur={(e) => {
                e.preventDefault();
                setEventData({
                  capacity: e.target.value ? parseInt(e.target.value, 10) : 100,
                });
              }}
            />
          </div>
          {/* Divider */}
          <ManageEventDivider />
        </>
      )}

      {/* Proof of attendance */}
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex justify-between items-center">
            <Typography
              variant="body"
              weight="medium"
            >
              Proof of Attendance
            </Typography>
          </div>
          <div className="mt-1 flex-1 font-normal text-[13px] leading-4 tracking-normal text-[#3C3C4399]">
            Setting a password prevents unexpected check-ins and rewards without attending the event.
          </div>
        </div>
        <Input
          label="Event Password"
          placeholder="Your Event’s Passkey"
          errors={errors?.secret_phrase}
          name="event_password"
          defaultValue={eventData.secret_phrase || ""}
          onBlur={(e) => {
            e.preventDefault();
            if (Boolean(e?.target?.value?.trim()))
              setEventData({
                secret_phrase: (e.target.value as string).toLowerCase().trim(),
              });
          }}
        />
        <AlertGeneric variant="info-light">Password is case-insensitive and must be at least 4 characters.</AlertGeneric>
      </div>
    </ManageEventCard>
  );
};

export default ManageEventRegistration;
