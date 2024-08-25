"use client";
import React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { IoOptionsOutline } from "react-icons/io5";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { Separator } from "@/components/ui/separator";

interface MainFilterDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participationType: string[];
  hubText: string;
  sortBy: string;
  setSortBy: (value: string) => void;
  setIsEventTypeDrawerOpen: (open: boolean) => void;
  setIsHubDrawerOpen: (open: boolean) => void;
  handleFilterApply: () => void;
  resetFilters: () => void;
  setApplyingFilters: (value: boolean) => void;
}

const MainFilterDrawer: React.FC<MainFilterDrawerProps> = ({
  isOpen,
  onOpenChange,
  participationType,
  hubText,
  sortBy,
  setSortBy,
  setIsEventTypeDrawerOpen,
  setIsHubDrawerOpen,
  handleFilterApply,
  resetFilters,
  setApplyingFilters,
}) => {
  return (
    <Drawer onOpenChange={onOpenChange}>
      <DrawerTrigger>
        <button className="ml-4 p-2 rounded-md text-gray-500 hover:text-gray-700">
          <IoOptionsOutline className="w-7 h-7" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter List</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-6 cursor-pointer">
          <div
            className="space-y-4"
            onClick={() => setIsEventTypeDrawerOpen(true)}
          >
            <p className="text-sm font-medium text-zinc-100">EVENT TYPE</p>
            <div className="cursor-pointer text-blue-500">
              {participationType.join(", ").replace("_", " ")}
            </div>
          </div>
          <div
            className="space-y-4"
            onClick={() => setIsHubDrawerOpen(true)}
          >
            <p className="text-sm font-medium text-zinc-100">Ton hub</p>
            <div className="cursor-pointer text-blue-500">{hubText}</div>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-medium text-zinc-100">SORT BY</p>
            <RadioGroup
              orientation="vertical"
              value={sortBy}
              onValueChange={setSortBy}
            >
              <Separator className="my-0" />
              <label className="flex justify-between items-center">
                <span className="text-zinc-400">Time</span>
                <RadioGroupItem value="start_date_asc" />
              </label>
              <Separator className="my-0" />
              <label className="flex justify-between items-center">
                <span className="text-zinc-400">Most People Reached</span>
                <RadioGroupItem value="most_people_reached" />
              </label>
            </RadioGroup>
          </div>
        </div>

        <DrawerFooter className="flex justify-end space-x-4 p-4">
          <DrawerClose asChild>
            <button
              className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-200"
              onClick={() => {
                    setApplyingFilters(true);

              }}
            >
              Filter Events
            </button>
          </DrawerClose>
          <button
            className="text-blue-600 hover:underline px-4 py-2 rounded-full"
            onClick={resetFilters}
          >
            Reset filters
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MainFilterDrawer;
