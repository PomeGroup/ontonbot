import { ListItem, Toggle, ListInput } from "konsta/react";
import { UserRoundCheck, ArrowUpToLine, FileUser } from "lucide-react";
import FormBlock from "../../atoms/cards/FormBlock";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { cn } from "@/utils";

export function UserRegistrationForm() {
  const eventData = useCreateEventStore((state) => state.eventData);
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
            component="div"
            checked={eventData?.has_registration}
          />
        }
      />
      <ListItem
        label
        title="Require Approval"
        className={cn({ hidden: !Boolean(eventData?.has_registration) })}
        media={<UserRoundCheck />}
        after={
          <Toggle
            component="div"
            checked={eventData?.has_approval}
          />
        }
      />
      <ListItem
        label
        title={
          <p className="space-x-4">
            <span>Capacity</span>
            <small className="dark:text-zinc-400">unlimited</small>
          </p>
        }
        className={cn({ hidden: !Boolean(eventData?.has_registration) })}
        media={<ArrowUpToLine />}
        after={
          <Toggle
            component="div"
            checked={eventData?.has_capacity}
          />
        }
      />
      {/* <ListItem */}
      {/*   label */}
      {/*   title={ */}
      {/*     <p className="space-x-4"> */}
      {/*       <span>Over-Capacity</span> */}
      {/*       <small className="dark:text-zinc-400">waitlist</small> */}
      {/*     </p> */}
      {/*   } */}
      {/*   media={<Clock />} */}
      {/*   after={ */}
      {/*     <Toggle */}
      {/*       component="div" */}
      {/*       checked */}
      {/*       className="" */}
      {/*     /> */}
      {/*   } */}
      {/* /> */}
      <ListInput
        title="Max Capacity"
        inputClassName={cn("placeholder:tracking-[.2rem]")}
        className={cn({ hidden: !Boolean(eventData?.has_registration) })}
        placeholder={"100"}
        outline
        info="Automatically close registration once capacity is reached, counting only approved guests."
      />
    </FormBlock>
  );
}
