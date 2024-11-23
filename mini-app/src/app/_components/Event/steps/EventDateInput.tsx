import { ListInput } from "konsta/react";
import React from "react";

interface EventDateInputProps {
  isStart: boolean;
  date: string;
  setDate: (_: string) => void;
  error?: string;
  disabled?: boolean;
}

const EventDateInput: React.FC<EventDateInputProps> = ({ isStart, date, setDate, error, disabled }) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  return (
    <ListInput
      outline
      type="datetime-local"
      label={isStart ? "Starts at" : "Ends at"}
      name={isStart ? "start_date" : "end_date"}
      error={error}
      disabled={disabled}
      value={date}
      onChange={handleDateChange}
    />
  );
};

export default EventDateInput;
