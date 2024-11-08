import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { useEffect, useMemo, useState } from "react";
import zod from "zod";
import { EventDataContext } from "./eventPageContext";

export const EventDataProvider = ({
  children,
  eventHash,
}: {
  children: React.ReactNode;
  eventHash: string;
}) => {
  const webApp = useWebApp();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initData, setInitData] = useState<string>("");

  useEffect(() => {
    if (webApp?.initData && !isInitialized) {
      setInitData(webApp.initData);
      setIsInitialized(true);
    }
  }, [webApp?.initData, isInitialized]);

  const eventData = trpc.events.getEvent.useQuery(
    {
      event_uuid: eventHash,
      init_data: initData,
    },
    {
      queryKey: [
        "events.getEvent",
        { event_uuid: eventHash, init_data: initData },
      ],
      enabled: Boolean(initData),
    }
  );

  useEffect(() => {
    if (eventData.data) {
      console.log("eventHash", eventData);
    }
  }, [eventData]);

  const { success, isNotEnded, isStarted, endUTC, startUTC, location } =
    useMemo(() => {
      if (!eventData.data) {
        return {
          success: false,
          endUTC: 0,
          startUTC: 0,
        };
      }
      const startUTC = Number(eventData.data.start_date) * 1000;
      const endUTC = Number(eventData.data.end_date) * 1000;

      const currentTime = Date.now();
      const isNotEnded = currentTime < endUTC;
      const isStarted = currentTime > startUTC;
      const location = eventData.data.location;
      const urlSchema = zod.string().url();
      const { success } = urlSchema.safeParse(location);
      return {
        isNotEnded,
        isStarted,
        success,
        endUTC,
        startUTC,
        location,
      };
    }, [
      eventData.data?.start_date,
      eventData.data?.end_date,
      eventData.data?.location,
    ]);

  return (
    <EventDataContext.Provider
      value={{
        eventData,
        isNotEnded: Boolean(isNotEnded),
        isStarted: Boolean(isStarted),
        endUTC,
        startUTC,
        location,
        success,
        initData,
        eventHash,
      }}
    >
      {children}
    </EventDataContext.Provider>
  );
};
