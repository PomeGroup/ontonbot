import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { trpc } from "@/app/_trpc/client";
import { AlertGeneric } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import useWebApp from "@/hooks/useWebApp";
import { EventDataSchema, UpdateEventDataSchema } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IoInformationCircle } from "react-icons/io5";
import { toast } from "sonner";
import { z } from "zod";
import TgsFilePlayer from "../../atoms/TgsFilePlayer";
import { useCreateEventStore } from "./createEventStore";
import { StepLayout } from "./stepLayout";

export const ThirdStep = () => {
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const eventData = useCreateEventStore((state) => state.eventData);
  const editOptions = useCreateEventStore((state) => state.edit);
  const [errors, setErrors] = useState<{
    secret_phrase?: string[] | undefined;
  }>();
  const router = useRouter();

  const addEvent = trpc.events.addEvent.useMutation({
    onSuccess(data) {
      setEventData({});
      toast("Event created successfully", {
        duration: 10000000,
        icon: <IoInformationCircle />,
      });
      router.push(`/events/${data.eventId}/edit`);
    },
  });
  const updateEvent = trpc.events.updateEvent.useMutation({
    onSuccess(data) {
      setEventData({});
      toast("Event updated successfully", {
        duration: 10000000,
        icon: <IoInformationCircle />,
      });
      router.push(`/events/${data.eventId}`);
    },
  });
  const webApp = useWebApp();

  const thirdStepDataSchema = z.object({
    // if it's edit it's not required
    secret_phrase: editOptions
      ? z.string().min(4).max(20).optional()
      : z.string().min(4).max(20),
  });
  const handleSubmit = () => {
    const parseData = thirdStepDataSchema.safeParse({
      secret_phrase: eventData?.secret_phrase,
    });

    if (parseData.success) {
      setErrors({});
      const updateParsedData = UpdateEventDataSchema.safeParse(eventData);
      if (updateParsedData.success && editOptions?.eventHash) {
        updateEvent.mutate({
          event_uuid: editOptions.eventHash,
          init_data: webApp?.initData || "",
          eventData: updateParsedData.data,
        });
        return;
      }

      const parsedEventData = EventDataSchema.safeParse(eventData);
      if (parsedEventData.success) {
        addEvent.mutate({
          eventData: parsedEventData.data,
          init_data: webApp?.initData || "",
        });
      }

      return;
    }

    setErrors(parseData.error.flatten().fieldErrors);
  };

  return (
    <StepLayout title="Event's password">
      <TgsFilePlayer
        src="/pass_lock.tgs"
        autoplay
        loop
        className="w-40 h-40 mx-auto"
      />
      <Input
        placeholder="Enter your chosen password"
        onChange={(e) =>
          setEventData({
            ...eventData,
            secret_phrase: e.target.value.trim().toLowerCase(),
          })
        }
        errors={errors?.secret_phrase}
      />

      <AlertGeneric variant="info">
        By setting a password for the event, you can prevent checking-in
        unexpectedly and receiving reward without attending the event.
      </AlertGeneric>
      {editOptions?.eventHash ? (
        <MainButton
          onClick={handleSubmit}
          text="Update event"
          disabled={updateEvent.isLoading}
          progress={updateEvent.isLoading}
        />
      ) : (
        <MainButton
          onClick={handleSubmit}
          text="Create event"
          disabled={addEvent.isLoading}
          progress={addEvent.isLoading}
        />
      )}
    </StepLayout>
  );
};
