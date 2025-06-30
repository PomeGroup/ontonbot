import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";

const ManageEventHub = () => {
  return (
    // a button and a drawer from buttom opens
    <Drawer>
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
            className="w-full flex-1 bg-brand-divider"
          >
            {/* Placeholder text */}
            <p className="text-[#8f8f90]">Select Hub</p>
            <ChevronRight className="ml-auto h-5.5 text-[#3C3C434D]" />
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent
        title="Select Hub"
        aria-label="Select Hub"
      >
        <ScrollArea className="overflow-y-auto">
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
          <div>1</div>
        </ScrollArea>

        <Button variant="primary">Submit</Button>
      </DrawerContent>
    </Drawer>
  );
};

export default ManageEventHub;
