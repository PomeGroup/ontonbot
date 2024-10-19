"use client";
import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { z } from "zod";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";

// Extract the participationType from the Zod schema
type SearchEventsInput = z.infer<typeof searchEventsInputZod>;
type ParticipationType = NonNullable<
  SearchEventsInput["filter"]
>["participationType"];

interface EventTypeDrawerProps {
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
  participationType: ParticipationType;
  setParticipationTypes: (_types: ParticipationType) => void;
}

const EventTypeDrawer: React.FC<EventTypeDrawerProps> = ({
  isOpen,
  onOpenChange,
  participationType,
  setParticipationTypes,
}) => {
  // Create local state to track the participation type selections
  const [localParticipationType, setLocalParticipationType] =
    useState<ParticipationType>([]);

  // Log the incoming participation type from the parent for debugging
  useEffect(() => {
    console.log("Incoming participationType from parent:", participationType);
  }, [participationType]);

  // When the drawer opens, reset the local state to the incoming participationType prop
  useEffect(() => {
    if (isOpen) {
      console.log("Drawer opened. Resetting local state to parent value.");
      setLocalParticipationType([...participationType]); // Spread operator to prevent nested arrays
    }
  }, [isOpen, participationType]);

  // Handle toggling participation type locally
  const handleToggleType = (type: string) => {
    //@ts-ignore
    setLocalParticipationType((prev) => {
      //@ts-ignore
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleDoneClick = () => {
    console.log("Applying local participation types:", localParticipationType);
    setParticipationTypes(localParticipationType);
    onOpenChange(false);
  };

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
          <div className="space-y-0">
            {/* Online event row */}
            <div
              className={`flex justify-between items-center cursor-pointer p-2 border-b-2 border-b-gray-800 ${
                localParticipationType.includes("online") ? "bg-gray-700" : ""
              }`}
              onClick={() => handleToggleType("online")}
            >
              <span className="text-zinc-400">Online</span>
              <Checkbox
                checked={localParticipationType.includes("online") || localParticipationType.length === 0}
                className="h-6 w-6"
              />
            </div>

            {/* In-person event row */}
            <div
              className={`flex justify-between items-center cursor-pointer p-2 ${
                localParticipationType.includes("in_person")
                  ? "bg-gray-700"
                  : ""
              }`}
              onClick={() => handleToggleType("in_person")}
            >
              <span className="text-zinc-400">In-person</span>
              <Checkbox
                checked={localParticipationType.includes("in_person")  || localParticipationType.length === 0}
                className="h-6 w-6"
              />
            </div>
          </div>
        </div>
        <DrawerFooter className="flex justify-end space-x-4 p-4">
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

export default EventTypeDrawer;
