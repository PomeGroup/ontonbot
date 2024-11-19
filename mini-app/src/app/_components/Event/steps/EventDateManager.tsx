import { useCreateEventStore } from "@/zustand/createEventStore";
import React, { useState, useEffect } from "react";
import { Block, BlockTitle, Chip, ListItem } from "konsta/react";
import FormBlock from "../../atoms/cards/FormBlock";
import EventDateInput from "./EventDateInput";

export const EventDateManager = () => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const editOptions = useCreateEventStore((state) => state.edit);
  const errors = useCreateEventStore((state) => state.timeplaceStepErrors);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    if (eventData?.start_date) {
      const formattedStartDate = new Date(
        new Date(eventData.start_date * 1000).toString().split("GMT")[0] +
          " UTC"
      )
        .toISOString()
        .split(".")[0];
      setStartDate(formattedStartDate);
    }

    if (eventData?.end_date) {
      const formattedEndDate = new Date(
        new Date(eventData.end_date * 1000).toString().split("GMT")[0] + " UTC"
      )
        .toISOString()
        .split(".")[0];
      setEndDate(formattedEndDate);
    }
  }, [eventData?.start_date, eventData?.end_date]);

  const eventEnded = Boolean(editOptions?.eventHash && eventData?.hasEnded);

  useEffect(() => {
    if (startDate && endDate) {
      const durationInSeconds =
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / 1000;
      setDuration(durationInSeconds);
    }
  }, [startDate, endDate]);

  return (
    <>
      {eventEnded && (
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
        <EventDateInput
          isStart={true}
          date={startDate}
          setDate={setStartDate}
          error={errors?.start_date?.[0]}
          disabled={eventEnded}
        />
        <EventDateInput
          isStart={false}
          date={endDate}
          setDate={setEndDate}
          error={errors?.end_date?.[0]}
          disabled={eventEnded}
        />
        <ListItem
          title="Duration"
          after={
            <Chip>
              {duration > 0 && Math.floor((duration / 60 / 60) * 10) / 10} hours
            </Chip>
          }
        />
        <ListItem
          header="The time is based on your location and timezone."
          title="Timezone"
          after={<Chip>{eventData?.timezone}</Chip>}
        />
      </FormBlock>
    </>
  );
};
