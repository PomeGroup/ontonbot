import { trpc } from "@/app/_trpc/client";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useSectionStore } from "@/zustand/useSectionStore";
import { useRouter } from "next/navigation";
import { IoInformationCircle } from "react-icons/io5";
import { toast } from "sonner";
import { useEventValidation } from "./useEventValidation";

export const useCreateEvent = () => {
  const { setEventData } = useCreateEventStore((s) => ({
    setEventData: s.setEventData,
  }));

  const { validateForCreate } = useEventValidation();

  const { setSection } = useSectionStore();
  const router = useRouter();

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

  const handleCreate = () => {
    // Validate & prepare data
    // NOTE: It handles errors too
    const parsedEventData = validateForCreate();

    if (parsedEventData.success) {
      addEvent.mutate({ eventData: parsedEventData.data });
    }
  };

  return { handleCreate };
};
