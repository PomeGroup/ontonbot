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

  const userEventFields =
    trpc.userEventFields.getUserEventFields.useQuery(
      {
        event_hash: eventHash,
        init_data: initData,
      },
      {
        queryKey: [
          "userEventFields.getUserEventFields",
          {
            event_hash: eventHash,
            init_data: initData,
          },
        ],
        enabled: Boolean(initData) && Boolean(eventHash), // Run the query only if initData is present and initialized
      }
    );

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

  const eventPasswordField = useMemo(() => {
    return eventData.data?.dynamic_fields.find(v => v.title === 'secret_phrase_onton_input')
  }, [eventData.data?.dynamic_fields.length])

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

  const userEventPasswordField = useMemo(() => {
    console.log(userEventFields.data)
    if (eventPasswordField?.id) {
      return userEventFields.data?.[eventPasswordField.id]
    }
  }, [eventPasswordField?.id, userEventFields.isFetching, userEventFields.isSuccess])

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
        userEventFields,
        eventPasswordField,
        userEventPasswordField
      }}
    >
      {children}
    </EventDataContext.Provider>
  );
};
