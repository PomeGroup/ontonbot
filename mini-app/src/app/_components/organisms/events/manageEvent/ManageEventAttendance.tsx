import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import ManageEventRegistration from "./attendance/ManageEventRegistration";
import ManageEventReward from "./attendance/ManageEventReward";
import ManageEventTicket from "./attendance/MangeEventTicket";

const ManageEventAttendance = () => {
  return (
    <div className="flex flex-col gap-4">
      <ManageEventRegistration />
      <ManageEventTicket />
      <ManageEventReward />

      {/* Submit the data to the server */}
      <MainButton
        text="Submit"
        onClick={() => {
          const activeElement = document.activeElement;
          if (activeElement instanceof HTMLElement) {
            activeElement.blur();
          }

          setTimeout(() => {
            // TODO: handle errors guide the user to find the field errors
          }, 0);
        }}
      />
    </div>
  );
};

export default ManageEventAttendance;
