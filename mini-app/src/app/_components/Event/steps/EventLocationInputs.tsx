import { useCreateEventStore } from "@/zustand/createEventStore";
import { Radio, ListInput, ListItem, Block, BlockTitle } from "konsta/react";
import React from "react";
import ListLayout from "../../atoms/cards/ListLayout";
import { SelectLocation } from "./SelectLocation";
import { cn } from "@/utils";

const EventLocationManager = () => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const editOptions = useCreateEventStore((state) => state.edit);
  const errors = useCreateEventStore((state) => state.timeplaceStepErrors);

  const eventEnded = Boolean(editOptions?.eventHash && eventData?.hasEnded);

  return (
    <>
      {eventEnded && (
        <>
          <BlockTitle className="text-red-500">Event is Ended</BlockTitle>
          <Block margin="-mb-3 mt-8">
            <p className="text-red-400">This event has ended and can no longer be edited.</p>
          </Block>
        </>
      )}

      <ListLayout
        inset={false}
        title="Location"
      >
        <ListItem
          title="Online"
          after={
            <Radio
              onChange={() => setEventData({ eventLocationType: "online" })}
              checked={eventData?.eventLocationType === "online"}
              className={cn({ "opacity-50": Boolean(editOptions?.eventHash) })}
              disabled={Boolean(editOptions?.eventHash)}
            />
          }
        />
        <ListItem
          title="In-Person"
          after={
            <Radio
              onChange={() => setEventData({ eventLocationType: "in_person" })}
              checked={eventData?.eventLocationType === "in_person"}
              className={cn({ "opacity-50": Boolean(editOptions?.eventHash) })}
              disabled={Boolean(editOptions?.eventHash)}
            />
          }
        />
        {eventData?.eventLocationType === "online" && (
          <ListInput
            outline
            label="URL"
            placeholder={"https://example.com"}
            name="location"
            error={errors?.location?.[0]}
            defaultValue={eventData?.location}
          />
        )}
        {eventData?.eventLocationType === "in_person" && <SelectLocation />}
        {eventData?.eventLocationType === "in_person" && (
          <ListInput
            outline
            placeholder={"Room 123, Building 456"}
            label="Address"
            name="location"
            error={errors?.location?.[0]}
            defaultValue={eventData?.location}
          />
        )}
      </ListLayout>
    </>
  );
};

export default EventLocationManager;
