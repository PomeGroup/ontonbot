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

interface EventTypeDrawerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    participationType: string[];
    toggleParticipationType: (type: string) => void;
}

const EventTypeDrawer: React.FC<EventTypeDrawerProps> = ({
                                                             isOpen,
                                                             onOpenChange,
                                                             participationType,
                                                             toggleParticipationType,
                                                         }) => {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={onOpenChange}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Event Type</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleParticipationType("online")}
              >
                <span className="text-zinc-400">Online</span>
                <Checkbox
                  checked={participationType.includes("online")}
                  onCheckedChange={() => toggleParticipationType("online")}
                />
              </div>
              <Separator className="my-0" />
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleParticipationType("in_person")}
              >
                <span className="text-zinc-400">In-person</span>
                <Checkbox
                  checked={participationType.includes("in_person")}
                  onCheckedChange={() => toggleParticipationType("in_person")}
                />
              </div>
            </div>
          </div>
          <DrawerFooter className="flex justify-end space-x-4 p-4 ">
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

export default EventTypeDrawer;
