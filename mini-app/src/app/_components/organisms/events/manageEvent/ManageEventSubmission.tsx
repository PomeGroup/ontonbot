import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import UpdateEventSuccessDialog from "@/app/_components/Event/steps/UpdateEventSuccessDialog";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useRouter } from "next/navigation";
import { useEventValidation } from "./hooks/useEventValidation";
import { useUpdateEvent } from "./hooks/useUpdateEvent";

export const ManageEventSubmission = () => {
  const { edit: editOptions } = useCreateEventStore();
  const { ensureValidOrRedirect } = useEventValidation();
  const { showSuccessDialog, setShowSuccessDialog } = useUpdateEvent();
  const router = useRouter();

  const handleSubmit = () => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    const res = ensureValidOrRedirect();
    if (res.success) {
      setTimeout(() => {
        router.push("?page=overview");
      }, 1);
    }
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
