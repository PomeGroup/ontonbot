"use client";

import { SocietyHub } from "@/types";
import { FC, useEffect, useState } from "react";
import * as React from "react";
import { ListInput } from "konsta/react";
import { useGetHubsManageEvent } from "@/hooks/events.hooks";
import { useCreateEventStore } from "@/zustand/createEventStore";

// https://society.ton.org/v1/society-hubs

const TonHubPicker: FC<{
  value?: SocietyHub;
  onValueChange: (_value: SocietyHub) => void;
  errors?: string[];
}> = ({ value, onValueChange, errors }) => {
  const [hubs, setHubs] = useState<Array<SocietyHub>>([]);
  const hubsResponse = useGetHubsManageEvent();
  const setEventData = useCreateEventStore((state) => state.setEventData);

  useEffect(() => {
    if (hubsResponse.data?.status) {
      console.log(hubsResponse.data.hubs);
      setHubs(hubsResponse.data.hubs);
      setEventData({ society_hub: hubsResponse.data.hubs[0] });
    }
  }, [hubsResponse.data?.hubs, hubsResponse.data?.status, hubsResponse.status, setEventData]);

  const onHubChange = (e: any) => {
    const hub = hubs.find((hub) => hub.id === e.target.value)!;
    onValueChange(hub);
  };

  return (
    <ListInput
      outline
      placeholder="Select TON Hub"
      label="TON Hub"
      dropdown
      name="hub"
      type="select"
      value={value?.id}
      onChange={onHubChange}
      defaultValue={"select_option"}
      error={errors?.length ? errors?.join(". ") : undefined}
    >
      <option
        disabled
        value="select_option"
      >
        Select TON Hub
      </option>
      {hubs.map((societyHub) => (
        <option
          key={societyHub.id}
          value={societyHub.id}
          className="text-black"
        >
          {societyHub.name}
        </option>
      ))}
    </ListInput>
  );
};

export default TonHubPicker;
