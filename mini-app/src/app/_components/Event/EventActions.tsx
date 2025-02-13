import { cn } from "@/utils";
import AddToCalendar from "../AddToCalendar";
import { useEventData } from "./eventPageContext";

export const EventActions = () => {
  const { isNotEnded, startUTC, endUTC, eventData } = useEventData();

  return (
    <div
      className={cn("flex space-x-4", {
        "mt-4": isNotEnded,
      })}
    >
      {isNotEnded && (
        <AddToCalendar
          startDate={startUTC}
          endDate={endUTC}
          title={eventData.data?.title!}
          description={eventData.data?.subtitle!}
        />
      )}
    </div>
  );
};
