import Typography from "@/components/Typography";
import { AlertGeneric } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import ManageEventCard from "../ManageEventCard";
import ManageEventDivider from "../ManageEventDivider";

const ManageEventRegistration = () => {
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
          <Switch />
        </div>
        <div className="mt-1 flex-1 font-normal text-[13px] leading-4 tracking-normal text-[#3C3C4399]">
          Participants need to fill out a form with their information when joining your event.
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
            Approval Required
          </Typography>
          <Switch />
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
          <Switch />
        </div>
        <div className="mt-1 flex-1 font-normal text-[13px] leading-4 tracking-normal text-[#3C3C4399]">
          Max Capacity is 100 guests. Automatically closes registration once capacity is reached, Counting only approved
          guests.
        </div>
        <Input
          label="Max Capacity"
          placeholder="100"
          name="capacity"
        />
      </div>
      {/* Divider */}
      <ManageEventDivider />

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
          name="event_password"
        />
        <AlertGeneric variant="info-light">Password is case-insensitive and must be at least 4 characters.</AlertGeneric>
      </div>
    </ManageEventCard>
  );
};

export default ManageEventRegistration;
