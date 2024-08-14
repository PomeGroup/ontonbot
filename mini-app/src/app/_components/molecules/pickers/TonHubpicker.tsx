"use client";

import { trpc } from "@/app/_trpc/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SocietyHub, ZodErrors } from "@/types";
import { FC, useEffect, useState } from "react";
import Card from "../../atoms/cards";
import Labels from "../../atoms/labels";

// https://society.ton.org/v1/society-hubs

const TonHubPicker: FC<{
  value: SocietyHub;
  onValueChange: (value: SocietyHub) => void;
  errors: ZodErrors;
}> = ({ value, onValueChange, errors }) => {
  const [hubs, setHubs] = useState<Array<SocietyHub>>([]);
  const hubsResponse = trpc.events.getHubs.useQuery();

  useEffect(() => {
    if (hubsResponse.data?.status === "success")
      setHubs(hubsResponse.data.hubs);
    else {
      console.log(hubsResponse.data);
    }
  }, [hubsResponse.status]);

  function onHubChange(id: string) {
    const hub = hubs.find((hub) => hub.id === id)!;
    onValueChange(hub);
  }

  return (
    <Card className="flex flex-col items-start pt-1 w-full">
      <div className="flex justify-between w-full">
        <Labels.Label>TON Hub</Labels.Label>
        <Labels.Label>
          {errors?.society_hub && (
            <div className="text-red-500 text-end">{errors.society_hub}</div>
          )}
        </Labels.Label>
      </div>
      <Select
        value={value?.id}
        onValueChange={onHubChange}
      >
        <SelectTrigger className="w-full dark:bg-separator">
          <SelectValue placeholder="Select TON Hub" />
        </SelectTrigger>
        <SelectContent
          ref={(ref) => {
            if (!ref) return;
            ref.ontouchstart = (e) => {
              e.preventDefault();
            };
          }}
          className="max-h-[250px] dark:bg-separatorwo"
        >
          <SelectGroup className="max-h-[250px]">
            {hubs.map((societyHub) => (
              <SelectItem
                className="dark:hover:bg-separator"
                key={societyHub.id}
                value={societyHub.id}
              >
                {societyHub.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Card>
  );
};

export default TonHubPicker;
