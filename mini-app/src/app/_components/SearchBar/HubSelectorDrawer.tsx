"use client";
import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Hub {
  id: string;
  name: string;
}

interface HubSelectorDrawerProps {
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
  selectedHubs: string[];
  setSelectedHubs: (_hubs: string[]) => void;
  hubs: Hub[];
}

const HubSelectorDrawer: React.FC<HubSelectorDrawerProps> = ({
  isOpen,
  onOpenChange,
  selectedHubs,
  setSelectedHubs,
  hubs,
}) => {
  const [localSelectedHubs, setLocalSelectedHubs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedHubs([...selectedHubs]);
    }
  }, [isOpen, selectedHubs]);

  const toggleHubSelection = (hubId: string) => {
    setLocalSelectedHubs((prev) =>
      prev.includes(hubId) ? prev.filter((id) => id !== hubId) : [...prev, hubId]
    );
  };

  const selectAllHubs = () => {
    setLocalSelectedHubs(hubs.map((hub) => hub.id));
  };

  const deselectAllHubs = () => {
    setLocalSelectedHubs([]);
  };

  const handleDoneClick = () => {
    setSelectedHubs(localSelectedHubs);
    onOpenChange(false);
  };

  const allSelected = localSelectedHubs.length === hubs.length;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Select Hubs</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 py-1 space-y-2">
          <div
            className="flex justify-between items-center cursor-pointer p-0 px-10"
            onClick={allSelected ? deselectAllHubs : selectAllHubs}
          >
            <span className="text-zinc-400">Select All</span>
            <Checkbox
              checked={allSelected}
              onCheckedChange={allSelected ? deselectAllHubs : selectAllHubs}
              className="h-5 w-5"
            />
          </div>
          <Separator className="my-2" />
          <ScrollArea className="h-[50vh] w-full rounded-md border-0 p-4 py-0">
            {hubs.map((hub) => (
              <div
                key={hub.id}
                className={`flex justify-between items-center border-b-2 border-b-gray-800 px-6 cursor-pointer h-12 ${
                  localSelectedHubs.includes(hub.id) ? "bg-gray-700 " : ""
                }`}
                onClick={() => toggleHubSelection(hub.id)}
              >
                <span className="text-zinc-400">{hub.name}</span>
                <Checkbox
                  checked={localSelectedHubs.includes(hub.id)}
                  className="h-6 w-6"
                />
              </div>
            ))}
          </ScrollArea>
        </div>

        <DrawerFooter className="flex justify-end space-x-4 p-4 py-1">
          <button
            className="bg-blue-100 w-20 m-auto text-blue-600 px-4 py-2 rounded-full hover:bg-blue-200"
            onClick={handleDoneClick}
          >
            Done
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default HubSelectorDrawer;
