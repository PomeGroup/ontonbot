"use client";

import ManageEvent from "@/app/_components/organisms/events/manageEvent/ManageEvent";
import { useGetEvent } from "@/hooks/events.hooks";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useParams } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

export default function CreateEventAdminPage() {
  const [isReset, setIsReset] = useState(false);

  const params = useParams<{ hash: string }>();
  const event = useGetEvent(params.hash);

  const { setEventData, clearGeneralStepErrors, clearAttendanceStepErrors, resetState, setEdit } = useCreateEventStore(
    (s) => ({
      setEventData: s.setEventData,
      setEdit: s.setEdit,
      clearGeneralStepErrors: s.clearGeneralStepErrors,
      clearAttendanceStepErrors: s.clearAttendanceStepErrors,
      resetState: s.resetState,
    })
  );

  const eventData = event.data;

  // 1) Clear errors on mount
  useEffect(() => {
    clearGeneralStepErrors();
    clearAttendanceStepErrors();
  }, [clearGeneralStepErrors]);

  // TODO: This is cancer in the code!
  useLayoutEffect(() => {
    resetState();
    setIsReset(true);

    if (params.hash && isReset) {
      setEdit({ eventHash: params.hash });

      if (eventData) {
        setEventData({
          title: eventData.title || undefined,
          description: eventData.description || undefined,
          image_url: eventData.image_url || undefined,
          subtitle: eventData.subtitle || undefined,
          start_date: eventData.start_date || undefined,
          end_date: eventData.end_date || undefined,
          location: eventData.location || undefined,
          category_id: eventData.category_id || undefined,
          // @ts-ignore
          society_hub: eventData.society_hub
            ? {
                id: eventData.society_hub.id,
                name: eventData.society_hub.name,
              }
            : undefined,
          eventLocationType: eventData.participationType,
          countryId: eventData.countryId || undefined,
          cityId: eventData.cityId || undefined,
          ts_reward_url: eventData.tsRewardImage || undefined,

          // Registration
          has_registration: Boolean(eventData.has_registration),
          has_approval: Boolean(eventData.has_approval),
          capacity: eventData.capacity || null,
          has_waiting_list: Boolean(eventData.has_waiting_list),
        });
      }
    }
  }, [eventData]);

  if (event.error) {
    return <div>Error: {event.error.message}</div>;
  }
  if (!event.data) {
    return <div>Loading event data...</div>;
  }

  return (
    <div>
      <ManageEvent event={eventData} />
    </div>
  );
}
