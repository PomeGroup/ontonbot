import ManageEventRegistration from "./attendance/ManageEventRegistration";
import ManageEventReward from "./attendance/ManageEventReward";
import ManageEventTicket from "./attendance/MangeEventTicket";

const ManageEventAttendance = () => {
  return (
    <div className="flex flex-col gap-4">
      <ManageEventRegistration />
      <ManageEventTicket />
      <ManageEventReward />
    </div>
  );
};

export default ManageEventAttendance;
