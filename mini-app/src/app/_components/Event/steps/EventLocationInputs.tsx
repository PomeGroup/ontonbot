import { useCreateEventStore } from "@/zustand/createEventStore";
import { Radio, ListInput, ListItem } from "konsta/react";
import React from "react";
import FormBlock from "../../atoms/cards/FormBlock";
import { SelectLocation } from "./SelectLocation";

const EventLocationManager = () => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const errors = useCreateEventStore((state) => state.timeplaceStepErrors);

  return (
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
  );
};

export default EventLocationManager;
