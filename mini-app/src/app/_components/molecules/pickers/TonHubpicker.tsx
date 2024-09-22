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
import { SocietyHub } from "@/types";
import { FC, useEffect, useState } from "react";

// https://society.ton.org/v1/society-hubs

const TonHubPicker: FC<{
  value?: SocietyHub;
  onValueChange: (_value: SocietyHub) => void;
  errors?: (string | undefined)[];
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
    <div>
      <Select
        value={value?.id}
        onValueChange={onHubChange}
      >
        <SelectTrigger
          className="w-full"
          isError={Boolean(errors?.length)}
        >
          <SelectValue placeholder="Select TON Hub" />
        </SelectTrigger>
        <SelectContent
          ref={(ref) => {
            if (!ref) return;
            ref.ontouchstart = (e) => {
              e.preventDefault();
            };
          }}
          className="max-h-[250px]"
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

      <div className="text-red-500">
        {errors?.map((error) => <p key={error}>{error}</p>)}
      </div>
    </div>
  );
};

export default TonHubPicker;
