import { Input } from "@/components/ui/input";
import { getDateFromUnix, getTimeFromUnix } from "@/utils";
import { FC, useEffect, useState } from "react";

interface DatetimepickerProps {
  title: string;
  value: number | null;
  setTimestamp: (timestamp: number) => void;
  errors?: (string | undefined)[];
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
      : `${currentDate!.year}-${currentDate!.month}-${currentDate!.day}`
  );
  const [time, setTime] = useState(
    value
      ? `${formTime.hours}:${formTime.minutes}`
      : `${currentTime.hours}:${currentTime.minutes}`
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
    <div>
      <div className="w-full flex items-center justify-between">
        <label>{title}</label>
        <Input
          type="time"
          value={time}
          onChange={handleTimeChange}
        />
        <Input
          type="date"
          value={date}
          onChange={handleDateChange}
        />
      </div>
      <div className="text-red-500">
        {errors?.map((error) => <p key={error}>{error}</p>)}
      </div>
    </div>
  );
};

export default Datetimepicker;
