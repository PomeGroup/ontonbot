import ManageEventRegistration from "./attendance/ManageEventRegistration";
import ManageEventReward from "./attendance/ManageEventReward";
import ManageEventTicket from "./attendance/MangeEventTicket";
import { ManageEventSubmission } from "./ManageEventSubmission";

const ManageEventAttendance = () => {
  return (
    <div className="flex flex-col gap-4">
      <ManageEventRegistration />
      <ManageEventTicket />
      <ManageEventReward />

      {/* 
        Handle update/create event submission
       */}
      <ManageEventSubmission />
    </div>
  );
};

export default ManageEventAttendance;
