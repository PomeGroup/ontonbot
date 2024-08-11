import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { Title3 } from "@/app/_components/atoms/typography/Titles";
import Datetimepicker from "@/app/_components/molecules/pickers/Datetimepicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useCreateEventStore } from "./createEventStore";
import { StepLayout } from "./stepLayout";

export const SecondStep = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const setCurrentStep = useCreateEventStore((state) => state.setCurrentStep);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const eventData = useCreateEventStore((state) => state.eventData);
  const [errors, setErrors] = useState<{
    start_date?: string[] | undefined;
    end_date?: string[] | undefined;
    timezone?: string[] | undefined;
    location?: string[] | undefined;
  }>();

  const secondStepDataSchema = z.object({
    start_date: z.number(),
    end_date: z.number(),
    timezone: z.string().min(1),
    location:
      eventData?.eventLocationType === "online"
        ? z.string().url("Please enter a valid url")
        : z.string().min(1, "Please enter a valid location"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    formData.append("timezone", eventData?.timezone || "");
    formData.append("location", eventData?.location || "");
    const formDataObject = Object.fromEntries(formData.entries()) as Record<
      string,
      any
    >;
    formDataObject.start_date = eventData?.start_date;
    formDataObject.end_date = eventData?.end_date;
    const formDataParsed = secondStepDataSchema.safeParse(formDataObject);

    if (!formDataParsed.success) {
      setErrors(formDataParsed.error.flatten().fieldErrors);
      return;
    }

    const data = formDataParsed.data;

    setEventData({ ...eventData, ...data });
    setCurrentStep(2);
  };

  useEffect(() => {
    setEventData({
      ...eventData,
      start_date: new Date().getTime() / 1000,
      end_date: new Date().getTime() / 1000 + 60 * 60,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      eventLocationType: "online",
    });
  }, []);

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
      >
        <StepLayout title="Ticket Info">
          <Datetimepicker
            title="Starts at"
            errors={errors?.start_date}
            setTimestamp={(time) =>
              setEventData({
                ...eventData,
                start_date: time,
              })
            }
            value={eventData?.start_date || null}
          />
          <Datetimepicker
            title="Ends at"
            errors={errors?.end_date}
            setTimestamp={(time) =>
              setEventData({
                ...eventData,
                end_date: time,
              })
            }
            value={eventData?.end_date || null}
          />
          <div className="flex justify-between items-between">
            <label
              htmlFor="duration"
              className="space-x-1"
            >
              <span className="mr-6">Duration</span>
              <span className="text-md font-semibold text-white">
                {eventData?.end_date &&
                  eventData?.start_date &&
                  ((Number(eventData.end_date) - Number(eventData.start_date)) /
                    60 /
                    60) >>
                    0}{" "}
                hours
              </span>
            </label>
            <label
              htmlFor="duration"
              className="space-x-1"
            >
              <span className="mr-6">Timezone</span>
              <span className="text-md font-semibold text-white">
                {eventData?.timezone}
              </span>
            </label>
          </div>
          <Title3>Location</Title3>

          <RadioGroup
            orientation="horizontal"
            className="flex justify-between"
            value={eventData?.eventLocationType || "online"}
            onValueChange={(value) =>
              setEventData({
                ...eventData,
                eventLocationType: value as "in_person" | "online",
              })
            }
          >
            <Label>Type</Label>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="in_person"
                id="in_person"
              />
              <Label htmlFor="in_person">In-Person</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="online"
                id="online"
              />
              <Label htmlFor="online">Online</Label>
            </div>
          </RadioGroup>
          {eventData?.eventLocationType === "in_person" && (
            <Input
              type="text"
              value={eventData?.location || ""}
              onChange={(e) =>
                setEventData({
                  ...eventData,
                  location: e.target.value,
                })
              }
              placeholder="Location Detail"
            />
          )}

          {eventData?.eventLocationType === "online" && (
            <Input
              type="text"
              value={eventData?.location || ""}
              errors={errors?.location}
              onChange={(e) =>
                setEventData({
                  ...eventData,
                  location: e.target.value,
                })
              }
              placeholder="Event URL"
            />
          )}
        </StepLayout>
      </form>
      <MainButton
        text="Next Step"
        onClick={() => formRef.current?.requestSubmit()}
      />
    </>
  );
};
