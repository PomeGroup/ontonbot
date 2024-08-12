import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { trpc } from "@/app/_trpc/client";
import { AlertGeneric } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import useWebApp from "@/hooks/useWebApp";
import { EventDataSchema } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { useCreateEventStore } from "./createEventStore";
import { StepLayout } from "./stepLayout";

const thirdStepDataSchema = z.object({
  secret_phrase: z.string().min(4).max(20),
});
export const ThirdStep = () => {
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const eventData = useCreateEventStore((state) => state.eventData);
  const [errors, setErrors] = useState<{
    secret_phrase?: string[] | undefined;
  }>();
  const router = useRouter();
  const addEvent = trpc.events.addEvent.useMutation({
    onSuccess() {
      setEventData({});
      router.push("/");
    },
  });
  const webApp = useWebApp();

  const handleSubmit = () => {
    const parseData = thirdStepDataSchema.safeParse({
      secret_phrase: eventData?.secret_phrase,
    });

    if (!addEvent.isIdle) {
      return;
    }

    if (parseData.success) {
      setErrors({});
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
      <Input
        type="password"
        placeholder="Enter your chosen password"
        onChange={(e) =>
          setEventData({
            ...eventData,
            secret_phrase: e.target.value,
          })
        }
        errors={errors?.secret_phrase}
      />

      <AlertGeneric variant="info">
        By setting a password for the event, you can prevent checking-in
        unexpectedly and receiving reward without attending the event.
      </AlertGeneric>
      <MainButton
        onClick={handleSubmit}
        text="Create event"
        disabled={addEvent.isLoading}
        progress={addEvent.isLoading}
      />
    </StepLayout>
  );
};
