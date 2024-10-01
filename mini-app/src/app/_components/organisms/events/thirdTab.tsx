import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { trpc } from "@/app/_trpc/client";
import { AlertGeneric } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { UploadImageFile } from "@/components/ui/upload-file";
import useWebApp from "@/hooks/useWebApp";
import { EventDataSchema, UpdateEventDataSchema } from "@/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { IoInformationCircle } from "react-icons/io5";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateEventStore } from "./createEventStore";
import { StepLayout } from "./stepLayout";

export const ThirdStep = () => {
  const webApp = useWebApp();
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const eventData = useCreateEventStore((state) => state.eventData);
  const editOptions = useCreateEventStore((state) => state.edit);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [errors, setErrors] = useState<{
    secret_phrase?: string[] | undefined;
    ts_reward_url?: string[] | undefined;
  }>();

  const addEvent = trpc.events.addEvent.useMutation({
    onSuccess(data) {
      setEventData({});
      toast("Event created successfully", {
        icon: <IoInformationCircle />,
        duration: 4000,
      });
      router.push(`/events/${data.eventHash}/edit`);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const updateEvent = trpc.events.updateEvent.useMutation({
    onSuccess(data) {
      setEventData({});
      toast("Event updated successfully", {
        icon: <IoInformationCircle />,
        duration: 4000,
      });
      router.push(`/events/${data.eventId}`);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const thirdStepDataSchema = z.object({
    secret_phrase: editOptions?.eventHash
      ? z.string().min(4).max(20).optional()
      : z.string().min(4).max(20),
    ts_reward_url: z.string().url({ message: "Please select an image" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    // get form data
    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    const formDataObject = Object.fromEntries(formData.entries());
    const stepInputsObject = {
      ...formDataObject,
      ts_reward_url: eventData?.ts_reward_url,
    };
    const formDataParsed = thirdStepDataSchema.safeParse(stepInputsObject);

    if (formDataParsed.success) {
      setErrors({});
      setEventData({
        secret_phrase: formDataParsed.data.secret_phrase,
        ts_reward_url: formDataParsed.data.ts_reward_url,
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
    <StepLayout>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        <div className="space-y-2">
          <label htmlFor="secret_phrase">Event&#39;s password</label>
          <Input
            placeholder="Enter your chosen password"
            name="secret_phrase"
            errors={errors?.secret_phrase}
          />

          <AlertGeneric variant="info">
            By setting a password for the event, you can prevent checking-in
            unexpectedly and receiving reward without attending the event.
          </AlertGeneric>
        </div>
        <div className="space-y-2">
          <label htmlFor="reward_image">Reward Image</label>
          <AlertGeneric variant="info">
            Event&#39;s reward badge, visible on TON society. It can not be
            changed after event creation.
          </AlertGeneric>
          {
            // if it was update we show the image and say it's not editable
            editOptions?.eventHash ? (
              eventData?.ts_reward_url ? (
                <div className="flex justify-center gap-4 items-center pt-2 w-full">
                  <Image
                    src={eventData?.ts_reward_url}
                    alt="reward image"
                    width={300}
                    height={300}
                    className="rounded-xl"
                  />
                </div>
              ) : null
            ) : (
              <UploadImageFile
                changeText="Upload Reward Image"
                infoText="Image must be in 1:1 ratio"
                triggerText="Upload"
                onDone={(url) => {
                  setEventData({ ...eventData, ts_reward_url: url });
                }}
                isError={Boolean(errors?.ts_reward_url)}
                defaultImage={eventData?.ts_reward_url}
              />
            )
          }
        </div>
      </form>
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
    </StepLayout>
  );
};
