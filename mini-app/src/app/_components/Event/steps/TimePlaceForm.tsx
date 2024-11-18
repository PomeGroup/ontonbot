import { useCreateEventStore } from "@/zustand/createEventStore";
import {
  Radio,
  ListInput,
  Block,
  BlockTitle,
  ListItem,
  Chip,
} from "konsta/react";
import React from "react";
import FormBlock from "../../atoms/cards/FormBlock";
import { SelectLocation } from "./SelectLocation";

const TimePlaceForm = () => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const errors = useCreateEventStore((state) => state.timeplaceStepErrors);
  const editOptions = useCreateEventStore((state) => state.edit);

  const startDate =
    eventData?.start_date &&
    new Date(
      new Date(eventData.start_date * 1000).toString().split("GMT")[0] + " UTC"
    )
      .toISOString()
      .split(".")[0];

  const endDate =
    eventData?.end_date &&
    new Date(
      new Date(eventData.end_date * 1000).toString().split("GMT")[0] + " UTC"
    )
      .toISOString()
      .split(".")[0];

  return (
    <>
      {eventData?.hasEnded && (
        <>
          <BlockTitle className="text-red-500">Event is Ended</BlockTitle>
          <Block margin="-mb-3 mt-8">
            <p className="text-red-300">
              This event has ended and can no longer be edited.
            </p>
          </Block>
        </>
      )}
      <FormBlock title="Event Date">
        <ListInput
          outline
          type="datetime-local"
          label="Starts at"
          name="start_date"
          error={errors?.start_date?.[0]}
          disabled={eventData?.hasEnded}
          defaultValue={startDate}
        />
        <ListInput
          outline
          type="datetime-local"
          label="Ends at"
          error={errors?.end_date?.[0]}
          name="end_date"
          disabled={eventData?.hasEnded}
          defaultValue={endDate}
        />
        <ListItem
          title="Duration"
          after={
            <Chip>
              {eventData?.end_date &&
                eventData?.start_date &&
                // duration in hours between 2 dates
                Math.floor(
                  ((eventData?.end_date - eventData?.start_date) / 60 / 60) * 10
                ) / 10}{" "}
              hours
            </Chip>
          }
        />
        <ListItem
          header="The time is based on your location and timezone."
          title="Timezone"
          after={<Chip>{eventData?.timezone}</Chip>}
        />
      </FormBlock>
      <FormBlock title="Location">
        <ListItem
          title="Online"
          after={
            <Radio
              onClick={() => setEventData({ eventLocationType: "online" })}
              checked={eventData?.eventLocationType === "online"}
            />
          }
        />
        <ListItem
          title="In-Person"
          after={
            <Radio
              onClick={() => setEventData({ eventLocationType: "in_person" })}
              checked={eventData?.eventLocationType === "in_person"}
            />
          }
        />
        {eventData?.eventLocationType === "online" && (
          <ListInput
            outline
            label="URL"
            name="location"
            error={errors?.location?.[0]}
            defaultValue={eventData?.location}
          />
        )}
        {eventData?.eventLocationType === "in_person" && <SelectLocation />}
        {eventData?.eventLocationType === "in_person" && (
          <ListInput
            outline
            label="Address"
            name="location"
            error={errors?.location?.[0]}
            defaultValue={eventData?.location}
          />
        )}
      </FormBlock>
    </>
  );
};

export default TimePlaceForm;
/*
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
                ((eventData?.end_date - eventData?.start_date) / 60 / 60) * 10
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
*/
