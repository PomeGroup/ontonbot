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

const ManageEventCategory = () => {
  const categoriesQuery = trpc.events.getCategories.useQuery();
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const errors = useCreateEventStore((state) => state.generalStepErrors);

  const [open, setOpen] = useState(false);

  const categoryError = errors?.category_id?.[0];

  return (
    // a button and a drawer from buttom opens
    <Drawer
      open={open}
      onClose={() => {
        setOpen(false);
      }}
      onOpenChange={(state) => {
        setOpen(state);
      }}
    >
      <DrawerTrigger asChild>
        <div>
          <label
            className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
            htmlFor={"category"}
          >
            Category
          </label>
          <Button
            variant="ghost"
            className={cn("w-full flex-1 bg-brand-divider", categoryError && "border border-red-500 border-solid")}
          >
            {
              /* Placeholder text */
              eventData.category_id ? (
                <p>
                  {categoriesQuery.data?.find((cat) => cat.category_id === eventData.category_id)?.name || "Select Category"}
                </p>
              ) : (
                <p className="text-[#8f8f90]">Select Category</p>
              )
            }
            <ChevronRight className="ml-auto h-5.5 text-[#3C3C434D]" />
          </Button>
          {categoryError && <span className="text-xs text-red-500">{categoryError}</span>}
        </div>
      </DrawerTrigger>
      <DrawerContent
        title="Select Category"
        aria-label="Select Category"
      >
        {categoriesQuery.isLoading && (
          <DataStatus
            status="pending"
            title="Fetching Categories"
          />
        )}
        <ScrollArea className="overflow-y-auto">
          <RadioGroup
            value={eventData.category_id?.toString()}
            onValueChange={(value) => {
              setEventData({
                category_id: Number(value),
              });
            }}
            className="flex flex-col items-start"
          >
            {categoriesQuery.data?.map((cat) => (
              <div
                key={cat.category_id}
                className="flex items-center space-x-2 flex-1"
              >
                <RadioGroupItem
                  value={cat.category_id.toString()}
                  id={`cat-${cat.category_id}`}
                />
                <label htmlFor={`cat-${cat.category_id}`}>{cat.name}</label>
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

export default ManageEventCategory;
