import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import UpdateEventSuccessDialog from "@/app/_components/Event/steps/UpdateEventSuccessDialog";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useCreateEvent } from "./hooks/useCreateEvent";
import { useUpdateEvent } from "./hooks/useUpdateEvent";

export const ManageEventSubmission = () => {
  const { edit: editOptions } = useCreateEventStore();
  const { handleCreate } = useCreateEvent();
  const { handleUpdate, showSuccessDialog, setShowSuccessDialog } = useUpdateEvent();

  const handleSubmit = () => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    setTimeout(() => {
      if (editOptions?.eventHash) {
        handleUpdate(editOptions.eventHash);
      } else {
        handleCreate();
      }
    }, 100);
  };

  return (
    <>
      <MainButton
        text="Submit"
        onClick={handleSubmit}
      />
      <UpdateEventSuccessDialog
        open={showSuccessDialog}
        eventUuid={editOptions?.eventHash}
        onClose={() => setShowSuccessDialog(false)}
      />
    </>
  );
};

export default ManageEventSubmission;
