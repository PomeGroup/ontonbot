/**
 * Calculates the time difference between two dates and returns it with an appropriate suffix.
 *
 * @param {Date} startDate - The starting date
 * @param {Date} endDate - The ending date
 * @returns {{ diffValue: number, suffix: "min" | "hour" }} - Object containing the time difference value and unit suffix
 */
export function getDiffValueAndSuffix(startDate: Date, endDate: Date) {
  const diffTime = endDate.getTime() - startDate.getTime();
  const oneHour = 1000 * 60 * 60;
  const isLessThanOneHour = diffTime < oneHour;
  const diffValue = isLessThanOneHour ? Math.ceil(diffTime / (1000 * 60)) : Math.ceil(diffTime / oneHour);
  const suffix: "min" | "hour" = isLessThanOneHour ? "min" : "hour";

  return { diffValue, suffix, formattedValue: `${diffValue} ${suffix}` };
}

/**
 * Converts a duration in milliseconds to a human-readable time format (HH:MM:SS.SSS).
 *
 * @param {number} duration - The duration in milliseconds.
 * @return {string} The time in the format HH:MM:SS.SSS.
 */
export const msToTime = (duration: number): string => {
  const milliseconds = Math.floor((duration % 1000) / 100);
  let seconds: number | string = Math.floor((duration / 1000) % 60);
  let minutes: number | string = Math.floor((duration / (1000 * 60)) % 60);
  let hours: number | string = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? `0${hours}` : hours;
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  seconds = seconds < 10 ? `0${seconds}` : seconds;

  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

// Converts a date to  round date to interval
export const roundDateToInterval = (date: number | undefined, interval: number): number | undefined => {
  return date ? Math.floor(date / interval) * interval : date;
};
