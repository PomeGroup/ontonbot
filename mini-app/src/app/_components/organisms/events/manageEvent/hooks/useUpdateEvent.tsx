import { trpc } from "@/app/_trpc/client";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useSectionStore } from "@/zustand/useSectionStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IoInformationCircle } from "react-icons/io5";
import { toast } from "sonner";
import { useEventValidation } from "./useEventValidation";

export const useUpdateEvent = () => {
  const { setEventData, eventData, clearGeneralStepErrors } = useCreateEventStore((state) => ({
    setEventData: state.setEventData,
    eventData: state.eventData,
    clearGeneralStepErrors: state.clearGeneralStepErrors,
  }));
  const { setSection } = useSectionStore();
  const { clearSections } = useSectionStore();
  const router = useRouter();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { validateForUpdate } = useEventValidation();

  const updateEvent = trpc.events.updateEvent.useMutation({
    onSuccess(data) {
      setEventData({});
      toast("Event updated successfully", {
        icon: <IoInformationCircle />,
        duration: 4000,
      });

      if (eventData?.paid_event?.has_payment) {
        setShowSuccessDialog(true);
      } else {
        setSection("none");
        router.replace(`/events/${data?.eventId}`);
        clearSections();
      }
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const handleUpdate = (eventHash: string) => {
    // Validate & prepare data
    // NOTE: It handles errors too
    const parsedEventData = validateForUpdate();

    if (parsedEventData.success) {
      updateEvent.mutate({
        event_uuid: eventHash,
        eventData: parsedEventData.data,
      });
    }
  };

  return { handleUpdate, showSuccessDialog, setShowSuccessDialog };
};
