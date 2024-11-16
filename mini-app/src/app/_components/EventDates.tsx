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
    <div className="text-center space-y-1">
      {/* Start Date */}
      <EventKeyValue
        variant={"filled_value"}
        label="Start Date"
        value={<time className="font-medium">{startDateStr}</time>}
      />

      {/* End Date */}
      <EventKeyValue
        variant={"filled_value"}
        label="End Date"
        value={<time className="font-medium">{endDateStr}</time>}
      />
    </div>
  );
};

export default EventDates;
