import { parseTimezone } from "./parseTimezone";

export const formatDateInTimezone = (timestamp, timeZone) => {
  const parsedTimeZone = parseTimezone(timeZone);
  const date = new Date(timestamp * 1000);
  let formattedDate;

  if (typeof parsedTimeZone === "string") {
    // IANA timezone or UTC
    formattedDate = date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: parsedTimeZone,
    });
    return `${formattedDate} (${parsedTimeZone})`;
  } else if (
    typeof parsedTimeZone === "object" &&
    parsedTimeZone.offsetHours !== undefined
  ) {
    // GMT offset (e.g., GMT+5 or GMT-3)
    const offsetMillis = parsedTimeZone.offsetHours * 60 * 60 * 1000;
    const adjustedDate = new Date(date.getTime() + offsetMillis);
    formattedDate = adjustedDate.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${formattedDate} (${parsedTimeZone.label})`;
  }
  throw new Error("Invalid timezone format");
};
