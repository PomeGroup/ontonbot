import { useConfig } from "@/context/ConfigContext";
import { getTimeLeft } from "@/lib/time.utils";
import { useEffect, useState } from "react";

export const useConfigDate = (configKey: string) => {
  const config = useConfig();
  const endDateString = config[configKey];

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    endDate: Date | null;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    endDate: null,
  });

  useEffect(() => {
    const endDate = endDateString ? new Date(endDateString) : null;
    if (!endDate) return;

    const updateTimer = () => {
      const { days, hours, minutes, seconds } = getTimeLeft(endDate);
      setTimeLeft({ days, hours, minutes, seconds, endDate });
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [endDateString]);

  return timeLeft;
};
