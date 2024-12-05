"use client";

import { FC, ReactNode } from "react";
import AttributeItem from "@ui/components/blocks/AttributeItem";
import { z } from "zod";

import { formatDateRange, formatTimeRange } from "~/utils/date";

type Props = {
  data: [string, ReactNode][];
  event: {
    start_date: number;
    end_date: number;
  };
};
const EventAttributes: FC<Props> = ({ data, event }) => {
  // add date and time ton the data
  const date = formatDateRange(event.start_date, event.end_date);
  const time = formatTimeRange(event.start_date, event.end_date);

  const attributes = [...data];
  attributes.push(["Date", date]);
  attributes.push(["Time", time]);

  return (
    <div className="-mt-2 w-[90vw]">
      {attributes.map((attribute) => {
        return (
          <AttributeItem
            key={attribute[0]}
            label={attribute[0]}
            value={attribute[1]}
            variant={
              z.string().url().safeParse(attribute[1]).success ? "link" : "base"
            }
          />
        );
      })}
    </div>
  );
};

export default EventAttributes;
