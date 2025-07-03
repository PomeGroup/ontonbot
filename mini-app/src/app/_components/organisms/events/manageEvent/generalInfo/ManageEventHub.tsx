import DataStatus from "@/app/_components/molecules/alerts/DataStatus";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/utils";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

const ManageEventHub = () => {
  const hubsQuery = trpc.hubs.getHubs.useQuery();

  const [open, setOpen] = useState(false);

  const eventData = useCreateEventStore((state) => state.eventData);
  const errors = useCreateEventStore((state) => state.generalStepErrors);
  const setEventData = useCreateEventStore((state) => state.setEventData);

  const hubError = errors?.hub?.[0];

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
            Hub
          </label>
          <Button
            variant="ghost"
            className={cn("w-full flex-1 bg-brand-divider", hubError && "border border-red-500 border-solid")}
          >
            {/* Placeholder text */}
            {eventData.society_hub?.name ? (
              <p>{eventData.society_hub.name}</p>
            ) : (
              <p className="text-[#8f8f90]">Select Hub</p>
            )}
            <ChevronRight className="ml-auto h-5.5 text-[#3C3C434D]" />
          </Button>
          {hubError && <span className="text-xs text-red-500">{hubError}</span>}
        </div>
      </DrawerTrigger>
      <DrawerContent
        title="Select Hub"
        aria-label="Select Hub"
      >
        {hubsQuery.isLoading && (
          <DataStatus
            status="pending"
            title="Fetching Hubs List"
          />
        )}
        <ScrollArea className="overflow-y-auto">
          <RadioGroup
            value={eventData.society_hub?.id?.toString()}
            onValueChange={(value) => {
              setEventData({
                society_hub: hubsQuery.data?.hubs.find((hub) => hub.id.toString() === value),
              });
            }}
            className="flex flex-col items-start"
          >
            {hubsQuery.data?.hubs.map((hub) => (
              <div
                key={hub.id}
                className="flex items-center space-x-2 flex-1"
              >
                <RadioGroupItem
                  value={hub.id.toString()}
                  id={`hub-${hub.id}`}
                />
                <label htmlFor={`hub-${hub.id}`}>{hub.name}</label>
              </div>
            ))}
          </RadioGroup>
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

export default ManageEventHub;
