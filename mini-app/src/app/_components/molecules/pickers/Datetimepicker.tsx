import { Input } from "@/components/ui/input";
import { getDateFromUnix, getTimeFromUnix } from "@/utils";
import React, { FC, useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { toast } from "sonner"; // Import toast for showing errors

interface DatetimepickerProps {
  title: string;
  value: number | null;
  setTimestamp: (_timestamp: number) => void;
  errors?: (string | undefined)[];
  disabled?: boolean;
  greaterThan?: number; // New parameter for minimum date validation
  lowerThan?: number; // New parameter for maximum date validation
}

const Datetimepicker: FC<DatetimepickerProps> = ({
  title,
  value,
  setTimestamp,
  errors,
  disabled = false,
  greaterThan,
  lowerThan, // Destructure the new prop
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

  // Calculate minDate and minTime for greaterThan, and maxDate and maxTime for lowerThan
  let minDate: string | undefined;
  let minTime: string | undefined;
  let maxDate: string | undefined;
  let maxTime: string | undefined;

  if (greaterThan) {
    const greaterDate = new Date(greaterThan * 1000);
    minDate = greaterDate.toISOString().split("T")[0]; // Format: 'YYYY-MM-DD'
    minTime = greaterDate.toISOString().split("T")[1].slice(0, 5); // Format: 'HH:MM'
  }

  if (lowerThan) {
    const lowerDate = new Date(lowerThan * 1000);
    maxDate = lowerDate.toISOString().split("T")[0]; // Format: 'YYYY-MM-DD'
    maxTime = lowerDate.toISOString().split("T")[1].slice(0, 5); // Format: 'HH:MM'
  }

  // Function to handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const selectedDateTime =
      new Date(`${selectedDate}T${time}`).getTime() / 1000;

    // Validate the date selection before updating
    if (greaterThan && selectedDateTime < greaterThan) {
      toast.error(
        `The selected date/time must be after ${new Date(greaterThan * 1000).toLocaleString()}.`
      );
      return; // Discard change if invalid
    }

    if (lowerThan && selectedDateTime > lowerThan) {
      toast.error(
        `The selected date/time must be before ${new Date(lowerThan * 1000).toLocaleString()}.`
      );
      return; // Discard change if invalid
    }

    // If valid, update the state and timestamp
    setDate(selectedDate);
    updateTimestamp(selectedDate, time);
  };

  // Function to handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedTime = e.target.value;
    const selectedDateTime =
      new Date(`${date}T${selectedTime}`).getTime() / 1000;

    // Validate the time selection before updating
    if (greaterThan && selectedDateTime < greaterThan) {
      toast.error(
        `The selected date/time must be after ${new Date(greaterThan * 1000).toLocaleString()}.`
      );
      return; // Discard change if invalid
    }

    if (lowerThan && selectedDateTime > lowerThan) {
      toast.error(
        `The selected date/time must be before ${new Date(lowerThan * 1000).toLocaleString()}.`
      );
      return; // Discard change if invalid
    }

    // If valid, update the state and timestamp
    setTime(selectedTime);
    updateTimestamp(date, selectedTime);
  };

  // Function to update the timestamp
  const updateTimestamp = (date: string, time: string) => {
    let dateTimeString = "";
    if (date) {
      dateTimeString += date;
      dateTimeString += time ? `T${time}` : "T00:00";
    } else if (time) {
      dateTimeString = `1970-01-01T${time}`;
    }

    if (dateTimeString) {
      const combinedDateTime = new Date(dateTimeString).getTime() / 1000;

      setTimestamp(combinedDateTime); // Set timestamp if valid
    } else {
      setTimestamp(0);
    }
  };

  useEffect(() => {
    updateTimestamp(date, time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="grid grid-cols-10 gap-2">
        <div className="col-span-2 flex items-center">
          <label >{title}</label>
        </div>
        <div className="col-span-4">
          <Input
            type="time"
            value={time}
            onChange={handleTimeChange}
            disabled={disabled}
            min={date === minDate ? minTime : undefined}
            max={date === maxDate ? maxTime : undefined} // Set the maximum time for the date

          />
        </div>
        <div className="col-span-4">
          <Input
            type="date"
            value={date}
            onChange={handleDateChange}
            disabled={disabled}
            min={minDate} // Set the minimum date
            max={maxDate} // Set the maximum date
          />
        </div>
      </div>

      {errors?.map((error) => (
        <div
          className="text-red-300 pt-1 text-sm flex items-center"
          key={error}
        >
          <FiAlertCircle className="mr-2" /> {error}
        </div>
      ))}
    </div>
  );
};

export default Datetimepicker;
