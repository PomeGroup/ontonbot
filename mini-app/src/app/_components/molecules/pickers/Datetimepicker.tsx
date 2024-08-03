import { useState, FC, useEffect } from "react";
import { ZodErrors } from "@/types";
import { getDateFromUnix, getTimeFromUnix } from "@/utils";
import Card from "../../atoms/cards";
import Labels from "../../atoms/labels";

interface DatetimepickerProps {
  title: string;
  value: number | null;
  setTimestamp: (timestamp: number) => void;
  errors: ZodErrors;
}

const Datetimepicker: FC<DatetimepickerProps> = ({
  title,
  value,
  setTimestamp,
  errors,
}) => {
  const formDate = getDateFromUnix(value || 0);
  const formTime = getTimeFromUnix(value || 0);

  const currentTimestamp = new Date().getTime() / 1000;

  const currentTime = getTimeFromUnix(currentTimestamp);

  const currentDate = getDateFromUnix(currentTimestamp);

  const [date, setDate] = useState(
    value && formDate
      ? `${formDate.year}-${formDate.month}-${formDate.day}`
      : `${currentDate!.year}-${currentDate!.month}-${currentDate!.day}`,
  );
  const [time, setTime] = useState(
    value
      ? `${formTime.hours}:${formTime.minutes}`
      : `${currentTime.hours}:${currentTime.minutes}`,
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    updateTimestamp(e.target.value, time);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    updateTimestamp(date, e.target.value);
  };

  const updateTimestamp = (date: string, time: string) => {
    let dateTimeString = "";
    if (date) {
      dateTimeString += date;
      dateTimeString += time ? `T${time}` : "T00:00";
    } else if (time) {
      dateTimeString = `1970-01-01T${time}`;
    }
    if (dateTimeString) {
      const combinedDateTime = new Date(dateTimeString);
      setTimestamp(combinedDateTime.getTime() / 1e3);
    } else {
      setTimestamp(0);
    }
  };

  useEffect(() => {
    updateTimestamp(date, time);
  }, []);

  return (
    <Card className="flex flex-col items-start pt-1 w-full">
      <div className="flex justify-between w-full">
        <Labels.Label>{title}</Labels.Label>
        <Labels.Label>
          {errors?.end_date && (
            <div className="text-red-500 text-end">{errors.end_date}</div>
          )}
        </Labels.Label>
      </div>

      <div className="w-full flex flex-row justify-around text-muted-foreground border-separator bg-separator rounded-lg p-2">
        <input
          type="time"
          value={time}
          onChange={handleTimeChange}
          className="bg-transparent text-foreground"
        />
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="bg-transparent text-foreground"
        />
      </div>
    </Card>
  );
};

export default Datetimepicker;
