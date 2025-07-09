import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import UpdateEventSuccessDialog from "@/app/_components/Event/steps/UpdateEventSuccessDialog";
import { trpc } from "@/app/_trpc/client";
import { EventDataSchema, UpdateEventDataSchema } from "@/types";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useSectionStore } from "@/zustand/useSectionStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { IoInformationCircle } from "react-icons/io5";
import { toast } from "sonner";
import { ZodError } from "zod";

const useCreateEvent = () => {
  const { setEventData, eventData, setRewardStepErrors, clearRewardStepErrors } = useCreateEventStore();
  const { setSection } = useSectionStore();
  const router = useRouter();
  const sbtOption = eventData.reward.type;

  const addEvent = trpc.events.addEvent.useMutation({
    onSuccess(data) {
      toast("Event created successfully", {
        icon: <IoInformationCircle />,
        duration: 4000,
      });
      setEventData({});
      router.replace(`/events/${data?.eventHash}/manage`);
      setSection("none");
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const validateCustomSBT = () => {
    if (sbtOption === "custom" && (!eventData?.ts_reward_url || !eventData?.video_url)) {
      const errors = {
        ts_reward_url: !eventData?.ts_reward_url ? ["Please upload a reward image."] : undefined,
        video_url: !eventData?.video_url ? ["Please upload a video."] : undefined,
      };
      setRewardStepErrors(errors);
      toast.error(
        <div className="flex items-center">
          <FiAlertCircle className="mr-2" />
          Please upload both an image and a video for your custom SBT reward.
        </div>,
        { duration: 5000 }
      );
      return false;
    }
    return true;
  };

  const prepareEventData = () => {
    clearRewardStepErrors();
    const dataToSubmit = { ...eventData };

    if (eventData.paid_event?.has_payment) {
      dataToSubmit.paid_event = {
        ...eventData.paid_event,
        payment_amount: Number(eventData.paid_event.payment_amount),
      };
    }

    return dataToSubmit;
  };

  const handleCreate = () => {
    if (!validateCustomSBT()) return;

    const dataToSubmit = prepareEventData();
    const parsedEventData = EventDataSchema.safeParse(dataToSubmit);

    if (parsedEventData.success) {
      addEvent.mutate({ eventData: parsedEventData.data });
    } else {
      handleValidationErrors(parsedEventData.error, "Create event");
    }
  };

  return { handleCreate };
};

const useUpdateEvent = () => {
  const { setEventData, eventData, edit: editOptions } = useCreateEventStore();
  const { setSection } = useSectionStore();
  const { clearSections } = useSectionStore();
  const router = useRouter();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

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

  const prepareUpdateData = () => {
    const dataToSubmit = { ...eventData };

    if (eventData.paid_event?.has_payment) {
      dataToSubmit.paid_event = {
        ...eventData.paid_event,
        payment_amount: Number(eventData.paid_event.payment_amount),
      };
    }

    return dataToSubmit;
  };

  const handleUpdate = (eventHash: string) => {
    const dataToSubmit = prepareUpdateData();
    const updateParsedData = UpdateEventDataSchema.safeParse(dataToSubmit);

    if (updateParsedData.success) {
      updateEvent.mutate({
        event_uuid: eventHash,
        eventData: updateParsedData.data,
      });
    } else {
      handleValidationErrors(updateParsedData.error, "Update event");
    }
  };

  return { handleUpdate, showSuccessDialog, setShowSuccessDialog };
};

const handleValidationErrors = (error: ZodError, context: string) => {
  const errors = error.flatten().fieldErrors;
  console.error(`${context} validation errors:`, errors);

  const errorMessages = Object.entries(errors).flatMap(([field, messages]) =>
    messages?.map((msg, idx) => (
      <div key={`${field}-${idx}`}>
        {field}: {msg}
      </div>
    ))
  );

  toast.error(errorMessages);
};

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
