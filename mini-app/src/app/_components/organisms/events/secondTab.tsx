import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { Title3 } from "@/app/_components/atoms/typography/Titles";
import Datetimepicker from "@/app/_components/molecules/pickers/Datetimepicker";
import { trpc } from "@/app/_trpc/client";
import { AlertGeneric } from "@/components/ui/alert";
import { Combobox } from "@/components/ui/combobox";
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
    duration?: string[] | undefined;
    cityId?: string[] | undefined;
    countryId?: string[] | undefined;
  }>();

  const handleSubmit = () => {
    if (!formRef.current) {
      return;
    }

    const secondStepDataSchema = z
      .object({
        start_date: z.number().refine((data) => data > Date.now(), {
          message: "Start date must be in the future",
        }),
        end_date: z.number().refine((data) => data > eventData?.start_date!, {
          message: "End date must be after start date",
        }),
        timezone: z.string().min(1),
        duration: z.number().refine((data) => data > 0, {
          message: "Duration must be greater than 0",
        }),
        eventLocationType: z.enum(["online", "in_person"]),
        location: z.string().min(1),
        cityId: z.number().optional(),
        countryId: z.number().optional(),
      })
      .refine(
        (data) => {
          if (data.eventLocationType === "online") {
            return z.string().url().safeParse(data.location).success;
          }
          return true;
        },
        {
          message: "Please enter a valid URL for online events",
          path: ["location"],
        }
      )
      .refine(
        (data) => {
          if (data.eventLocationType === "in_person") {
            return data.cityId !== undefined && data.countryId !== undefined;
          }
          return true;
        },
        {
          message: "City and Country are required for in-person events",
          path: ["cityId", "countryId"],
        }
      );

    const formData = new FormData(formRef.current);
    const formDataObject = Object.fromEntries(formData.entries()) as Record<
      string,
      any
    >;
    formDataObject.start_date = eventData?.start_date;
    formDataObject.end_date = eventData?.end_date;
    formDataObject.duration =
      (eventData?.end_date || 0) - (eventData?.start_date || 0);
    formDataObject.timezone = eventData?.timezone || "";
    formDataObject.location = eventData?.location || "";
    formDataObject.eventLocationType = eventData?.eventLocationType || "online";
    formDataObject.cityId = eventData?.cityId
      ? Number(eventData.cityId)
      : undefined;
    formDataObject.countryId = eventData?.countryId
      ? Number(eventData.countryId)
      : undefined;

    const formDataParsed = secondStepDataSchema.safeParse(formDataObject);

    if (!formDataParsed.success) {
      setErrors(formDataParsed.error.flatten().fieldErrors);
      return;
    }

    const data = formDataParsed.data;

    setEventData({
      ...eventData,
      ...data,
    });
    setCurrentStep(3);
  };

  useEffect(() => {
    setEventData({
      ...eventData,
      start_date: eventData?.start_date || (new Date().getTime() / 1000) >> 0,
      end_date:
        eventData?.end_date || ((new Date().getTime() / 1000) >> 0) + 60 * 60,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      eventLocationType: eventData?.eventLocationType || "online",
    });
  }, []);

  return (
    <>
      <form
        onSubmit={(e) => e.preventDefault()}
        ref={formRef}
      >
        <StepLayout title="Ticket Info">
          <Datetimepicker
            title="Starts at"
            errors={errors?.start_date}
            setTimestamp={(time) =>
              setEventData({
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
                  // duraton in hours between 2 dates
                  Math.floor(
                    ((eventData?.end_date - eventData?.start_date) / 60 / 60) *
                      10
                  ) / 10}{" "}
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
          {errors?.duration && (
            <span className="text-red-500">{errors?.duration[0]}</span>
          )}
          <AlertGeneric
            className="!mt-4"
            variant="info"
          >
            The time is set by your location and time zone.
          </AlertGeneric>
          <Title3>Location</Title3>

          <RadioGroup
            orientation="horizontal"
            className="flex justify-between"
            value={eventData?.eventLocationType}
            onValueChange={(value) => {
              setEventData({
                eventLocationType: value as "in_person" | "online",
                location: "", // Reset location when changing type
                cityId: undefined,
                countryId: undefined,
              });
            }}
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
            <div className="space-y-4">
              <SelectLocation
                cityErrors={errors?.cityId}
                countryErrors={errors?.countryId}
              />
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
                placeholder="Location Detail"
              />
            </div>
          )}

          {eventData?.eventLocationType === "online" && (
            <Input
              type="url"
              value={eventData?.location || ""}
              errors={errors?.location}
              onChange={(e) =>
                setEventData({
                  ...eventData,
                  location: e.target.value,
                })
              }
              placeholder="https://example.com"
            />
          )}
        </StepLayout>
      </form>
      <MainButton
        text="Next Step"
        onClick={handleSubmit}
      />
    </>
  );
};

const SelectLocation = (props: {
  cityErrors?: string[];
  countryErrors?: string[];
}) => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const countries = trpc.location.getCountries.useQuery({});
  const cities = trpc.location.getCities.useQuery(
    {
      countryId: eventData?.countryId!,
    },
    {
      enabled: Boolean(eventData?.countryId),
    }
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <Combobox
        options={countries.data?.map((country) => ({
          label: country.title,
          value: country.id.toString(),
        }))}
        onSelect={(data) => {
          if (data) {
            setEventData({ countryId: Number(data) });
          }
        }}
        errors={props.countryErrors}
        className="w-full"
        defaultValue={eventData?.countryId?.toString()}
      />

      <Combobox
        options={cities.data?.map((city) => ({
          label: city.title,
          value: city.id.toString(),
        }))}
        defaultValue={eventData?.cityId?.toString()}
        onSelect={(data) => {
          if (data) {
            setEventData({ cityId: Number(data) });
          }
        }}
        errors={props.cityErrors}
        className="w-full"
      />
    </div>
  );
};
