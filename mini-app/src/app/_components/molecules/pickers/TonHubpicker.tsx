"use client";

import { SocietyHub } from "@/types";
import { FC, useEffect, useState } from "react";
import * as React from "react";
import { ListInput } from "konsta/react";
import { useGetHubs } from "@/hooks/events.hooks";

// https://society.ton.org/v1/society-hubs

const TonHubPicker: FC<{
  value?: SocietyHub;
  onValueChange: (_value: SocietyHub) => void;
  errors?: string[];
}> = ({ value, onValueChange, errors }) => {
  const [hubs, setHubs] = useState<Array<SocietyHub>>([]);
  const hubsResponse = useGetHubs();

  useEffect(() => {
    if (hubsResponse.data?.status === "success") setHubs(hubsResponse.data.hubs);
    else {
      console.log(hubsResponse.data);
    }
  }, [hubsResponse.status]);

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
