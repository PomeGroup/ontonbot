import AddToCalendar from "../AddToCalendar";
import ShareEventButton from "../ShareEventButton";
import { useEventData } from "./eventPageContext";

export const EventActions = ({ eventHash }: { eventHash: string }) => {
  const { isNotEnded, startUTC, endUTC, eventData } = useEventData();

  return (
    <div className="flex space-x-2">
      <ShareEventButton event_uuid={eventHash} />
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
