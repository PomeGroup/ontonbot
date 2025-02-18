import { useState } from "react";
import EventKeyValue from "./organisms/events/EventKewValue";

type Props = {
  startDate: number;
  endDate: number;
};

const formatDate = (date: number) => {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
  };
  const formattedDate = new Date(date).toLocaleDateString("en-US", options);
  const formattedTime = new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formattedDate}, ${formattedTime}`;
};

const EventDates = ({ startDate, endDate }: Props) => {
  const [startDateStr] = useState(formatDate(startDate));
  const [endDateStr] = useState(formatDate(endDate));

  return (
    <>
      {/* Start Date */}
      <EventKeyValue
        label="Start Date"
        value={<time>{startDateStr}</time>}
      />

      {/* End Date */}
      <EventKeyValue
        label="End Date"
        value={<time>{endDateStr}</time>}
      />
    </>
  );
};

export default EventDates;
