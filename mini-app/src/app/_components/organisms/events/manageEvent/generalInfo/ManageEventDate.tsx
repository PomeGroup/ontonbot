import Typography from "@/components/Typography";
import { AlertGeneric } from "@/components/ui/alert";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import ManageEventCard from "../ManageEventCard";

const ManageEventDate = () => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const errors = useCreateEventStore((state) => state.timeplaceStepErrors);

  // event duration in hours and minutes
  const eventDuration = useMemo(() => {
    if (!eventData.start_date || !eventData.end_date) return "N/A";
    const start = new Date(eventData.start_date * 1000); // convert to ms
    const end = new Date(eventData.end_date * 1000); // convert to ms
    const duration = Math.abs(end.getTime() - start.getTime()); // in ms
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, [eventData.start_date, eventData.end_date]);

  const userTimeZone = useMemo(() => {
    const timezoneOffset = new Date().getTimezoneOffset(); // in minutes
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60)
      .toString()
      .padStart(2, "0");
    const offsetMinutes = (Math.abs(timezoneOffset) % 60).toString().padStart(2, "0");
    const sign = timezoneOffset <= 0 ? "+" : "-";
    return `GMT ${sign}${offsetHours}:${offsetMinutes}`;
  }, []);

  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [startDay, setStartDay] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [endDay, setEndDay] = useState<Dayjs | null>(null);

  const startUnix = useMemo(() => {
    if (!startDay || !startTime) return undefined;
    return startDay.hour(startTime.hour()).minute(startTime.minute()).second(0).millisecond(0).valueOf(); // in ms
  }, [startDay, startTime]);

  const endUnix = useMemo(() => {
    if (!endDay || !endTime) return undefined;
    return endDay.hour(endTime.hour()).minute(endTime.minute()).second(0).millisecond(0).valueOf(); // in ms
  }, [endDay, endTime]);

  // Set the start date and end date in the event data
  useEffect(() => {
    if (startUnix) {
      setEventData({
        start_date: startUnix / 1000,
      });
    }

    if (endUnix) {
      setEventData({
        end_date: endUnix / 1000,
      });
    }
  }, [endUnix, startUnix]);

  return (
    <ManageEventCard title="Date / Time">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {/* From: */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <Typography
              className="w-12.5 text-[18px]"
              variant="headline"
            >
              From:
            </Typography>
            <div className="flex gap-3">
              <div className="flex flex-col">
                <label
                  className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
                  htmlFor={"hub"}
                >
                  Time
                </label>
                <TimePicker
                  className="[&_svg]:w-0 [&>div]:relative [&>div>div]:ms-0 [&>div>div]:absolute [&>div>div]:w-full [&_button]:h-full [&_button]:w-full [&_input]:px-[10px] [&_input]:py-[12px] [&_input]:text-[12px] [&_fieldset]:border-none bg-brand-divider rounded-2lg [&>div]:pe-0 max-w-[120px]"
                  onChange={(v) => setStartTime(v)}
                  value={eventData.start_date ? dayjs(eventData.start_date * 1000) : null}
                />
              </div>
              <div className="flex flex-col">
                <label
                  className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
                  htmlFor={"hub"}
                >
                  Date
                </label>
                <DatePicker
                  className="[&_input]:py-[12px] [&_input]:px-[10px] [&_input]:text-[12px] [&_fieldset]:border-none bg-brand-divider rounded-2lg "
                  slotProps={{
                    openPickerIcon: {
                      className: "text-primary p-0",
                    },
                  }}
                  value={eventData.start_date ? dayjs(eventData.start_date * 1000) : null}
                  onChange={(v) => setStartDay(v)}
                />
              </div>
            </div>
            {/* Error */}
          </div>
          {errors?.start_date?.length && <p className="mt-1 text-red-400">{errors.start_date?.[0]}</p>}
        </div>
        {/* To: */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <Typography
              className="w-12.5 text-[18px]"
              variant="headline"
            >
              To:
            </Typography>
            <div className="flex gap-3">
              <div className="flex flex-col">
                <label
                  className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
                  htmlFor={"hub"}
                >
                  Time
                </label>
                <TimePicker
                  className="[&_svg]:w-0 [&_input]:px-[10px] [&>div]:relative [&>div>div]:ms-0 [&>div>div]:absolute [&>div>div]:w-full [&_button]:h-full [&_button]:w-full [&_input]:py-[10px] [&_input]:text-[12px] [&_fieldset]:border-none bg-brand-divider rounded-2lg [&>div]:pe-0 max-w-[120px]"
                  onChange={(v) => setEndTime(v)}
                  value={eventData.end_date ? dayjs(eventData.end_date * 1000) : null}
                />
              </div>
              <div className="flex flex-col">
                <label
                  className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
                  htmlFor={"hub"}
                >
                  Date
                </label>
                <DatePicker
                  className="[&_input]:px-[10px] [&_input]:py-[10px] [&_input]:text-[12px] [&_fieldset]:border-none bg-brand-divider rounded-2lg "
                  slotProps={{
                    openPickerIcon: {
                      className: "text-primary p-0",
                    },
                  }}
                  onChange={(v) => setEndDay(v)}
                  value={eventData.end_date ? dayjs(eventData.end_date * 1000) : null}
                />
              </div>
            </div>
          </div>
          {errors?.end_date?.length && <p className="mt-1 text-red-400">{errors.end_date?.[0]}</p>}
        </div>
      </LocalizationProvider>
      <div className="rounded-2lg border border-brand-divider-dark py-3 px-3 flex flex-wrap">
        {/* Timestamp */}
        <div className="flex-1 flex items-center gap-1">
          <label
            className="text-cn-muted-text font-normal text-xs leading-4"
            htmlFor="duration"
          >
            Duration:
          </label>
          {eventData.end_date && eventData.start_date && (
            <span className="text-black font-medium text-base">{eventDuration}</span>
          )}
        </div>
        {/* Event Duration */}
        <div className="flex-1 flex items-center gap-1">
          <label
            className="text-cn-muted-text font-normal text-xs leading-4"
            htmlFor="timezone"
          >
            Timezone:{" "}
          </label>
          <span className="text-black font-medium text-base">{userTimeZone}</span>
        </div>
      </div>
      <AlertGeneric variant="info-light">Time is based on your location and timezone</AlertGeneric>
    </ManageEventCard>
  );
};

export default ManageEventDate;
