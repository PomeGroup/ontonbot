import { type RouterOutput } from "@/server";
import { useLayoutEffect } from "react";
import Stepper from "../../molecules/stepper";
import { useCreateEventStore } from "./createEventStore";
import { FirstStep } from "./firstTab";
import { SecondStep } from "./secondTab";
import { ThirdStep } from "./thirdTab";

type ManageEventProps = {
  eventHash?: string;
  event?: RouterOutput["events"]["getEvent"];
};
const ManageEvent = (props: ManageEventProps) => {
  const currentStep = useCreateEventStore((state) => state.currentStep);
  const setEdit = useCreateEventStore((state) => state.setEdit);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const resetState = useCreateEventStore((state) => state.resetState);

  useLayoutEffect(() => {
    if (props.eventHash) {
      setEdit({
        eventHash: props.eventHash,
      });
      if (props.event) {
        setEventData({
          title: props.event.title || undefined,
          description: props.event.description || undefined,
          image_url: props.event.image_url || undefined,
          subtitle: props.event.subtitle || undefined,
          start_date: props.event.start_date || undefined,
          end_date: props.event.end_date || undefined,
          location: props.event.location || undefined,
          society_hub:
            props.event.society_hub?.id && props.event.society_hub?.name
              ? {
                  id: props.event.society_hub.id,
                  name: props.event.society_hub.name,
                }
              : undefined,
          eventLocationType: props.event.participationType,
          countryId: props.event.countryId || undefined,
          cityId: props.event.cityId || undefined,
        });
      }
    } else {
      resetState();
    }
  }, [props.eventHash, props.event]);

  return (
    <>
      <Stepper
        steps={[
          { icon: <span>1</span>, label: "General info" },
          { icon: <span>2</span>, label: "Time and place" },
          { icon: <span>3</span>, label: "Event’s Password" },
        ]}
        currentStep={currentStep}
      />

      {currentStep === 1 && <FirstStep />}
      {currentStep === 2 && <SecondStep />}
      {currentStep === 3 && <ThirdStep />}
    </>
  );
};

export default ManageEvent;
