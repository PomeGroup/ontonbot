import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/utils";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useState } from "react";

const ManageEventDescription = () => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const errors = useCreateEventStore((state) => state.generalStepErrors);
  const setEventData = useCreateEventStore((state) => state.setEventData);

  const [open, setOpen] = useState(false);

  const descError = errors?.description?.[0];
  return (
    // a button and a drawer from buttom opens
    <Drawer
      onClose={() => {
        setOpen(false);
      }}
      onOpenChange={(state) => {
        setOpen(state);
      }}
      open={open}
    >
      <DrawerTrigger asChild>
        <div>
          <label
            className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
            htmlFor={"hub"}
          >
            Description
          </label>

          <Button
            type="button"
            variant="ghost"
            className={cn(
              "w-full text-start flex-1 bg-brand-divider text-[#8f8f90]",
              descError && "border border-red-500 border-solid"
            )}
          >
            {/* Placeholder text */}
            <p className="me-auto truncate">{eventData.description ?? "What is the event about?"}</p>
          </Button>
          {descError && <span className="text-xs text-red-500">{descError}</span>}
        </div>
      </DrawerTrigger>
      <DrawerContent title="What is the event about?">
        <ScrollArea className="overflow-y-auto">
          <textarea
            className="w-full rounded-2lg px-3 py-2 bg-brand-divider min-h-[300px]"
            placeholder="What is the event about?"
            defaultValue={eventData.description}
            onBlur={(e) => {
              e.preventDefault();
              setEventData({ description: e.target.value });
            }}
          />
        </ScrollArea>

        <Button
          type="button"
          variant="primary"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          Save
        </Button>
      </DrawerContent>
    </Drawer>
  );
};

export default ManageEventDescription;
