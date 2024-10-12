"use client";
import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { Title3 } from "@/app/_components/atoms/typography/Titles";
import Datetimepicker from "@/app/_components/molecules/pickers/Datetimepicker";
import { trpc } from "@/app/_trpc/client";
import { AlertGeneric } from "@/components/ui/alert";
import { ComboboxDrawer } from "@/components/ui/combobox-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { cn } from "@/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { StepLayout } from "./stepLayout";
import { toast } from "sonner";
import { FiAlertCircle } from "react-icons/fi";
import * as React from "react"; // Import icon for errors

export const SecondStep = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const setCurrentStep = useCreateEventStore((state) => state.setCurrentStep);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const editOptions = useCreateEventStore((state) => state.edit);
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
  const startDateLimit = (Date.now() - 1000 * 3600 * 4) / 1000; // 4 hours before now

  let lastToastIdRef = useRef<string | number | null>(null); // Store the ID of the last toast using a ref
  const currentTime = Date.now() / 1000;

  const hasEventEnded = !!(
    editOptions?.eventHash &&
    eventData?.end_date &&
    eventData.end_date < currentTime
  );

  const handleSubmit = useCallback(() => {
    if (!formRef.current) {
      return;
    }

    const secondStepDataSchema = z
      .object({
        // if it was an update we let users enter whenever time they want
        start_date: z
          .number()
          .positive("Start date must be a valid positive timestamp")
          .refine(
            (data) => Boolean(editOptions?.eventHash) || data > startDateLimit,
            {
              message: "Start date must be in the future",
            }
          ),
        end_date: z
          .number()
          .positive("End date must be a valid positive timestamp")
          // End date must be greater than now
          .min((Date.now() + 1000 * 60 * 4) / 1000, {
            message: "End date must be in the future",
          })
          .refine(
            (data) =>
              Boolean(editOptions?.eventHash) || data > eventData?.start_date!,
            {
              message: "End date must be after start date",
            }
          ),
        timezone: z.string().min(1),
        duration: z.number().refine((data) => data > 0, {
          message: "Duration must be greater than 0",
        }),
        eventLocationType: z.enum(["online", "in_person"]),
        location: z.string().optional(),
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

      const flattenedErrors = formDataParsed.error.flatten().fieldErrors;

      const errorMessages = [
        flattenedErrors.start_date && (
          <div
            key="start_date"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.start_date[0]}
          </div>
        ),
        flattenedErrors.end_date && (
          <div
            key="end_date"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.end_date[0]}
          </div>
        ),
        flattenedErrors.timezone && (
          <div
            key="timezone"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.timezone[0]}
          </div>
        ),
        flattenedErrors.location && (
          <div
            key="location"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.location[0]}
          </div>
        ),
        flattenedErrors.cityId && (
          <div
            key="cityId"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.cityId[0]}
          </div>
        ),
        flattenedErrors.countryId && (
          <div
            key="countryId"
            className="flex items-center"
          >
            <FiAlertCircle className="mr-2" /> {flattenedErrors.countryId[0]}
          </div>
        ),
      ].filter(Boolean); // Filter out undefined messages

      // Dismiss the previous error toast, if any
      if (lastToastIdRef.current) {
        toast.dismiss(lastToastIdRef.current); // Correctly dismissing the last toast using ref
      }

      // Show new toast with errors
      lastToastIdRef.current = toast.error(<div>{errorMessages}</div>, {
        duration: 3000, // Set duration for 5 seconds
      });

      return;
    }

    const data = formDataParsed.data;

    setEventData({
      ...eventData,
      ...data,
    });
    setCurrentStep(3);
  }, [Object.values(eventData || {})]);

  useEffect(() => {
    setEventData({
      ...eventData,
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
        <StepLayout title="">
          <Datetimepicker
            title="Starts at"
            errors={errors?.start_date}
            greaterThan={startDateLimit}
            // lowerThan={ (editOptions?.eventHash && eventData?.end_date) ? eventData?.end_date : undefined}
            setTimestamp={(time) =>
              setEventData({
                start_date: time,
              })
            }
            value={eventData?.start_date || null}
            disabled={hasEventEnded}
          />
          <Datetimepicker
            title="Ends at"
            errors={errors?.end_date}
            setTimestamp={(time) =>
              setEventData({
                end_date: time,
              })
            }
            value={eventData?.end_date || currentTime + 3600 * 2}
            disabled={hasEventEnded}
            // greaterThan={eventData?.start_date}
          />
          {hasEventEnded && (
            <div className="text-red-300 pl-3 pt-1 text-sm flex items-center">
              <FiAlertCircle className="mr-2" /> This event has ended and can no
              longer be edited.
            </div>
          )}
          <div className="flex justify-between items-between">
            <label
              htmlFor="duration"
              className="space-x-1"
            >
              <span className="mr-6">Duration</span>
              <span className="text-md font-semibold text-white">
                {eventData?.end_date &&
                  eventData?.start_date &&
                  // duration in hours between 2 dates
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
            <div className="text-red-300 pl-3   text-sm flex items-center">
              <FiAlertCircle className="mr-2" /> {errors?.duration[0]}
            </div>
          )}
          <AlertGeneric
            className="!mt-4"
            variant="info"
          >
            The time is based on your location and timezone.
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
            </div>
          )}

          {eventData?.eventLocationType === "in_person" && (
            <div className="space-y-4">
              <Input
                type="text"
                name="location"
                defaultValue={eventData?.location}
                errors={errors?.location}
                placeholder="Location Detail"
              />
            </div>
          )}

          {eventData?.eventLocationType === "online" && (
            <Input
              type="url"
              name="location"
              defaultValue={eventData?.location}
              errors={errors?.location}
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

  // Fetch countries without search parameter
  const countries = trpc.location.getCountries.useQuery({});

  // State to store search input for cities
  const [citySearch, setCitySearch] = useState<string>("");

  // Fetch cities dynamically based on search input
  const cities = trpc.location.getCities.useQuery(
    {
      countryId: eventData?.countryId!,
      search: citySearch,
    },
    {
      enabled: Boolean(eventData?.countryId) && citySearch.length > 0,
    }
  );

  // Fetch city details by cityId when editing
  const { data: cityData } = trpc.location.getCityById.useQuery(
    {
      cityId: eventData?.cityId!,
    },
    {
      enabled: Boolean(eventData?.cityId) && !citySearch.length, // Fetch only if cityId exists and no search term is provided
    }
  );

  // Determine if the city combobox should be disabled
  const isCityDisabled = !eventData?.countryId;

  useEffect(() => {
    // Prepopulate city data when editing
    if (cityData && !citySearch) {
      setCitySearch(cityData.title); // Set the city title if we fetched the city
    }
  }, [cityData, citySearch]);

  return (
    <div className="flex w-full flex-col gap-4 pb-0">
      {/* Combobox for selecting a country */}
      <ComboboxDrawer
        options={countries.data?.map((country) => ({
          label: country.title,
          value: country.id.toString(),
        }))}
        placeholder="Select a country"
        onSelect={(data) => {
          if (data) {
            setEventData({
              countryId: Number(data),
              cityId: undefined, // Reset the city when a new country is selected
            });
            setCitySearch("");
          }
        }}
        errors={props.countryErrors}
        className="w-full"
        defaultValue={eventData?.countryId?.toString()}
        searchPlaceholder="Type to search for countries..."
      />

      {/* Combobox for selecting a city */}
      <div>
        <ComboboxDrawer
          options={cities.data?.map((city) => ({
            label: city.title,
            value: city.id.toString(),
          }))}
          placeholder="Select a city"

          onInputChange={(inputValue) =>
            !isCityDisabled && setCitySearch(inputValue)
          } // Disable input change if no country is selected
          defaultValue={eventData?.cityId?.toString()}
          onSelect={(data) => {
            if (data && !isCityDisabled) {
              setEventData({ cityId: Number(data) });
            }
          }}
          errors={props.cityErrors}
          className={cn(
            "w-full",
            isCityDisabled && "opacity-50 cursor-not-allowed" // Add disabled style
          )}
          searchPlaceholder={
            isCityDisabled
              ? "Select a country first..."
              : "Type to search for cities..."
          }
          disabled={isCityDisabled}
        />
      </div>
    </div>
  );
};
