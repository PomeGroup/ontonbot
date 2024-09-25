export function formatDateRange(startTimestamp: number, endTimestamp: number) {
  const startDate = new Date(startTimestamp * 1000);
  const endDate = new Date(endTimestamp * 1000);

  const startDay = startDate.getDate();
  const endDay = endDate.getDate();

  const startMonth = startDate.toLocaleString("default", { month: "short" });
  const endMonth = endDate.toLocaleString("default", { month: "short" });

  if (startMonth === endMonth) {
    if (startDay === endDay) {
      return `${startDay} ${startMonth}`;
    }
    return `${startDay} - ${endDay} ${endMonth}`;
  } else {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }
}

export function formatTimeRange(startTimestamp: number, endTimestamp: number) {
  const startDate = new Date(startTimestamp * 1000);
  const endDate = new Date(endTimestamp * 1000);

  const start = startDate.toLocaleString("default", {
    hour: "numeric",
    minute: "numeric",
  });
  const end = endDate.toLocaleString("default", {
    hour: "numeric",
    minute: "numeric",
  });

  return `${start} - ${end}`;
}
