"use client";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HubSelectorDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedHubs: string[];
  toggleHubSelection: (hubId: string) => void;
  hubs: { id: string; name: string }[];
  selectAllHubs: () => void;
  deselectAllHubs: () => void;
}

const HubSelectorDrawer: React.FC<HubSelectorDrawerProps> = ({
  isOpen,
  onOpenChange,
  selectedHubs,
  toggleHubSelection,
  hubs,
  selectAllHubs,
  deselectAllHubs,
}) => {
  const allSelected = selectedHubs.length === hubs.length;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Select Hubs</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-4  ">
          <div
            className="flex justify-between items-center cursor-pointer p-4"
            onClick={allSelected ? deselectAllHubs : selectAllHubs}
          >
            <span className="text-zinc-400">Select All</span>
            <Checkbox
              checked={allSelected}
              onCheckedChange={allSelected ? deselectAllHubs : selectAllHubs}
            />
          </div>
          <Separator className="my-2" />
          <ScrollArea className="h-[50vh] w-full rounded-md border-0 p-4 ">
            {hubs.map((hub) => (
              <div
                key={hub.id}
                className="flex   justify-between items-center border-b-2 border-b-gray-800 cursor-pointer h-12 "
                onClick={() => toggleHubSelection(hub.id)}
              >
                <span className="text-zinc-400">{hub.name}</span>
                <Checkbox
                  checked={selectedHubs.includes(hub.id)}
                  onCheckedChange={() => toggleHubSelection(hub.id)}
                />
              </div>
            ))}


          </ScrollArea>
        </div>

        <DrawerFooter className="flex justify-end space-x-4 p-4">
          <button
            className="bg-blue-100 w-20 m-auto text-blue-600 px-4 py-2 rounded-full hover:bg-blue-200"
            onClick={() => onOpenChange(false)}
          >
            Done
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default HubSelectorDrawer;
