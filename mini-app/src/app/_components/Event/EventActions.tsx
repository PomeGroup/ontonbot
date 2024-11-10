import AddToCalendar from "../AddToCalendar";
import { useEventData } from "./eventPageContext";

export const EventActions = () => {
  const { isNotEnded, startUTC, endUTC, eventData } = useEventData();

  return (
    <div className="flex space-x-2">
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
