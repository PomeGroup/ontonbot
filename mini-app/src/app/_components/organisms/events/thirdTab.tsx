import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { trpc } from "@/app/_trpc/client";
import { AlertGeneric } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import useWebApp from "@/hooks/useWebApp";
import { EventDataSchema, UpdateEventDataSchema } from "@/types";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);

  const addEvent = trpc.events.addEvent.useMutation({
    onSuccess(data) {
      setEventData({});
      toast("Event created successfully", {
        icon: <IoInformationCircle />,
        duration: 1500,
      });
      router.push(`/events/${data.eventId}/edit`);
    },
  });
  const updateEvent = trpc.events.updateEvent.useMutation({
    onSuccess(data) {
      setEventData({});
      toast("Event updated successfully", {
        icon: <IoInformationCircle />,
        duration: 1500,
      });
      router.push(`/events/${data.eventId}`);
    },
  });
  const webApp = useWebApp();

  const thirdStepDataSchema = z.object({
    secret_phrase: editOptions
      ? z.string().min(4).max(20).optional()
      : z.string().min(4).max(20),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    // get form data
    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    const formDataObject = Object.fromEntries(formData.entries());
    const formDataParsed = thirdStepDataSchema.safeParse(formDataObject);

    if (formDataParsed.success) {
      setErrors({});
      setEventData({
        secret_phrase: formDataParsed.data.secret_phrase,
      });

      const dataToSubmit = { ...formDataParsed.data, ...eventData };

      const updateParsedData = UpdateEventDataSchema.safeParse(dataToSubmit);
      if (updateParsedData.success && editOptions?.eventHash) {
        updateEvent.mutate({
          event_uuid: editOptions.eventHash,
          init_data: webApp?.initData || "",
          eventData: updateParsedData.data,
        });
        return;
      }

      const parsedEventData = EventDataSchema.safeParse(dataToSubmit);
      if (parsedEventData.success) {
        addEvent.mutate({
          eventData: parsedEventData.data,
          init_data: webApp?.initData || "",
        });
      }

      return;
    }

    setErrors(formDataParsed.error.flatten().fieldErrors);
  };

  const handleButtonClick = useCallback(() => {
    if (formRef.current) {
      formRef.current.requestSubmit(); // Programmatically submit the form
    }
  }, [formRef]);

  return (
    <StepLayout title="Event's password">
      <TgsFilePlayer
        src="/pass_lock.tgs"
        autoplay
        loop
        className="w-40 h-40 mx-auto"
      />
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-2"
      >
        <Input
          placeholder="Enter your chosen password"
          name="secret_phrase"
          errors={errors?.secret_phrase}
        />

        <AlertGeneric variant="info">
          By setting a password for the event, you can prevent checking-in
          unexpectedly and receiving reward without attending the event.
        </AlertGeneric>

        {editOptions?.eventHash ? (
          <MainButton
            onClick={handleButtonClick}
            text="Update event"
            disabled={updateEvent.isLoading}
            progress={updateEvent.isLoading}
          />
        ) : (
          <MainButton
            onClick={handleButtonClick}
            text="Create event"
            disabled={addEvent.isLoading}
            progress={addEvent.isLoading}
          />
        )}
      </form>
    </StepLayout>
  );
};
