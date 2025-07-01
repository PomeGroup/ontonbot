import Typography from "@/components/Typography";
import { AlertGeneric } from "@/components/ui/alert";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import ManageEventCard from "../ManageEventCard";

const ManageEventDate = () => {
  const timezoneOffset = new Date().getTimezoneOffset(); // in minutes
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60)
    .toString()
    .padStart(2, "0");
  const offsetMinutes = (Math.abs(timezoneOffset) % 60).toString().padStart(2, "0");
  const sign = timezoneOffset <= 0 ? "+" : "-";
  const userTimeZone = `GMT ${sign}${offsetHours}:${offsetMinutes}`;

  return (
    <ManageEventCard title="Date / Time">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {/* From: */}
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
              <TimePicker className="[&_svg]:w-0 [&>div]:relative [&>div>div]:ms-0 [&>div>div]:absolute [&>div>div]:w-full [&_button]:h-full [&_button]:w-full [&_input]:px-[10px] [&_input]:py-[12px] [&_input]:text-[12px] [&_fieldset]:border-none bg-brand-divider rounded-2lg [&>div]:pe-0 max-w-[120px]" />
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
              />
            </div>
          </div>
        </div>
        {/* To: */}
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
              <TimePicker className="[&_svg]:w-0 [&_input]:px-[10px] [&>div]:relative [&>div>div]:ms-0 [&>div>div]:absolute [&>div>div]:w-full [&_button]:h-full [&_button]:w-full [&_input]:py-[10px] [&_input]:text-[12px] [&_fieldset]:border-none bg-brand-divider rounded-2lg [&>div]:pe-0 max-w-[120px]" />
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
              />
            </div>
          </div>
        </div>
      </LocalizationProvider>
      <div className="rounded-2lg border border-brand-divider-dark py-3 px-3 flex ">
        <div className="flex-1 flex items-center gap-1">
          <label
            className="text-cn-muted-text font-normal text-xs leading-4"
            htmlFor="duration"
          >
            Duration:
          </label>
        </div>
        <div className="flex-1 flex items-center gap-1">
          <label
            className="text-cn-muted-text font-normal text-xs leading-4 align-middle"
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
