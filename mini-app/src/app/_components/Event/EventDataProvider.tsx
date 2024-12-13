import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { useEffect, useMemo, useState } from "react";
import zod from "zod";
import { EventDataContext } from "./eventPageContext";
import { useGetEvent } from "@/hooks/events.hooks";

export const EventDataProvider = ({ children, eventHash }: { children: React.ReactNode; eventHash: string }) => {
  const webApp = useWebApp();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initData, setInitData] = useState<string>("");
  const trpcUtils = trpc.useUtils();

  const userEventFields = trpc.userEventFields.getUserEventFields.useQuery(
    {
      event_hash: eventHash,
    },
    {
      queryKey: [
        "userEventFields.getUserEventFields",
        {
          event_hash: eventHash,
        },
      ],
      enabled: Boolean(eventHash), // Run the query only if initData is present and initialized
    }
  );

  useEffect(() => {
    if (userEventFields.isSuccess) {
      trpcUtils.users.getVisitorReward.invalidate({}, { refetchType: "all" });
    }
  }, [userEventFields.isSuccess, userEventFields.data]);

  useEffect(() => {
    if (webApp?.initData && !isInitialized) {
      setInitData(webApp.initData);
      setIsInitialized(true);
    }
  }, [webApp?.initData, isInitialized]);

  const eventData = useGetEvent();

  const eventPasswordField = useMemo(() => {
    return eventData.data?.dynamic_fields?.find((v) => v.title === "secret_phrase_onton_input");
  }, [eventData.data?.dynamic_fields?.length]);

  const { isLocationUrl, endUTC, startUTC, location } = useMemo(() => {
    if (!eventData.data) {
      return {
        isLocationUrl: false,
        endUTC: 0,
        startUTC: 0,
      };
    }
    const startUTC = Number(eventData.data.start_date) * 1000;
    const endUTC = Number(eventData.data.end_date) * 1000;

    const location = eventData.data.location;
    const urlSchema = zod.string().url();
    const { success } = urlSchema.safeParse(location);
    return {
      endUTC,
      isLocationUrl: success,
      startUTC,
      location,
    };
  }, [eventData.data?.start_date, eventData.data?.end_date, eventData.data?.location]);

  // const userEventPasswordField = useMemo(() => {
  //   // console.log(userEventFields.data);
  //   if (eventPasswordField?.id) {
  //     return userEventFields.data?.[eventPasswordField.id];
  //   }
  // }, [eventPasswordField?.id, userEventFields.isFetching, userEventFields.isSuccess]);

  return (
    <EventDataContext.Provider
      value={{
        eventData,
        isNotEnded: Boolean(eventData.data?.isNotEnded),
        isStarted: Boolean(eventData.data?.isStarted),
        endUTC,
        // hasEnteredPassword: Boolean(eventData.data?.participationType === "in_person" || userEventPasswordField?.completed),
        startUTC,
        location,
        initData,
        eventHash,
        userEventFields,
        isLocationUrl,
      //  eventPasswordField,
      //  userEventPasswordField,
      }}
    >
      {children}
    </EventDataContext.Provider>
  );
};
