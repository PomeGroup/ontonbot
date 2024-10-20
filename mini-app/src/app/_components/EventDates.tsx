import { FaHourglassStart } from "react-icons/fa";
import { FaHourglassEnd } from "react-icons/fa6";
import { useState } from "react";

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
    <div className="text-sm text-center text-muted-foreground">
      {/* Start Date */}
      <div className="flex items-start justify-start my-2">
        <FaHourglassStart className="mr-2" />
        <time className="font-medium">{startDateStr}</time>
      </div>

      {/* End Date */}
      <div className="flex items-start justify-start my-2">
        <FaHourglassEnd className="mr-2" />
        <time className="font-medium">{endDateStr}</time>
      </div>
    </div>
  );
};

export default EventDates;
