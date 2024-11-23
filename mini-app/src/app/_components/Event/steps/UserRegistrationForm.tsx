import { ListItem, Toggle, ListInput } from "konsta/react";
import { UserRoundCheck, ArrowUpToLine, FileUser, Clock } from "lucide-react";
import FormBlock from "../../atoms/cards/FormBlock";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { cn } from "@/utils";

export function UserRegistrationForm() {
  const eventData = useCreateEventStore((state) => state.eventData);
  const editOtions = useCreateEventStore((state) => state.edit);
  const setEventData = useCreateEventStore((state) => state.setEventData);

  return (
    <FormBlock
      inset={false}
      title="Registration"
    >
      <ListItem
        label
        media={<FileUser />}
        title="User Registration"
        footer="Enable user registration to allow attendees to fill out details like name, company, position, and notes during the event sign-up."
        after={
          <Toggle
            onChange={() => setEventData({ has_registration: !eventData?.has_registration })}
            className={cn({ "opacity-50": editOtions?.eventHash })}
            readOnly={Boolean(editOtions?.eventHash)}
            disabled={Boolean(editOtions?.eventHash)}
            component="div"
            checked={eventData?.has_registration}
          />
        }
      />
      {eventData?.has_registration && (
        <>
          <ListItem
            label
            title="Require Approval"
            media={<UserRoundCheck />}
            after={
              <Toggle
                component="div"
                onChange={() => setEventData({ has_approval: !eventData?.has_approval })}
                checked={eventData?.has_approval}
              />
            }
          />
          <ListItem
            label
            title={
              <p className="space-x-4">
                <span>Capacity</span>
                <small className={"dark:text-zinc-400"}>
                  {eventData.capacity !== null ? eventData.capacity : "unlimited"}
                </small>
              </p>
            }
            media={<ArrowUpToLine />}
            after={
              <Toggle
                onChange={() => setEventData({ capacity: eventData?.capacity ? null : 100 })}
                component="div"
                checked={eventData?.capacity !== null}
              />
            }
          />
          {eventData?.capacity && (
            <>
              <ListInput
                title="Max Capacity"
                type="number"
                name="capacity"
                inputMode="number"
                defaultValue={eventData.capacity}
                inputClassName={cn("placeholder:tracking-[.2rem] tracking-widest")}
                placeholder={"100"}
                outline
                info="Automatically close registration once capacity is reached, counting only approved guests."
              />
              <ListItem
                label
                title={
                  <p className="space-x-4">
                    <span>Over-Capacity</span>
                    <small className="dark:text-zinc-400">waitlist</small>
                  </p>
                }
                footer="Accept registrations over the max-capacity, with approval required for users over capacity."
                media={<Clock />}
                after={
                  <Toggle
                    component="div"
                    checked={eventData.has_waiting_list}
                    onChange={() =>
                      setEventData({
                        has_waiting_list: !eventData.has_waiting_list,
                      })
                    }
                  />
                }
              />
            </>
          )}
        </>
      )}
    </FormBlock>
  );
}
