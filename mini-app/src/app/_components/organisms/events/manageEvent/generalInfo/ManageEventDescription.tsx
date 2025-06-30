import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

const ManageEventDescription = () => {
  return (
    // a button and a drawer from buttom opens
    <Drawer>
      <DrawerTrigger asChild>
        <div>
          <label
            className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
            htmlFor={"hub"}
          >
            Description
          </label>

          <Button
            variant="ghost"
            className="w-full text-start flex-1 bg-brand-divider text-[#8f8f90]"
          >
            {/* Placeholder text */}
            <p className="me-auto">What is the event about?</p>
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent title="What is the event about?">
        <ScrollArea className="overflow-y-auto">
          <textarea
            className="w-full rounded-2lg px-3 py-2 bg-brand-divider min-h-[300px]"
            placeholder="What is the event about?"
          />
        </ScrollArea>

        <Button variant="primary">Save</Button>
      </DrawerContent>
    </Drawer>
  );
};

export default ManageEventDescription;
