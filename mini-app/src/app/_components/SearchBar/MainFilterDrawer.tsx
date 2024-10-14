"use client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import React from "react";
import { IoIosArrowForward } from "react-icons/io";
import { IoOptionsOutline } from "react-icons/io5";
import { z } from "zod";
export type SortByType = z.infer<typeof searchEventsInputZod>["sortBy"];
export type setSortByType = (_value: string) => void;
interface MainFilterDrawerProps {
  onOpenChange: (_open: boolean) => void;
  participationType: string[];
  hubText: string;
  sortBy: SortByType;
  setSortBy: setSortByType;
  setIsEventTypeDrawerOpen: (_open: boolean) => void;
  setIsHubDrawerOpen: (_open: boolean) => void;
  resetFilters: () => void;
  applyingFilters: boolean;
  setApplyingFilters: (_value: boolean) => void;
  allParticipationTypes: string[];
}

const MainFilterDrawer: React.FC<MainFilterDrawerProps> = ({
  onOpenChange,
  participationType,
  hubText,
  sortBy,
  setSortBy,
  setIsEventTypeDrawerOpen,
  setIsHubDrawerOpen,
  resetFilters,
  applyingFilters,
  setApplyingFilters,
  allParticipationTypes,
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
        <div className="p-4 py-2 space-y-2 cursor-pointer ">
          <div
            className="space-y-3 border-b-[1px] border-b-zinc-700 pb-1"
            onClick={() => setIsEventTypeDrawerOpen(true)}
          >
            <p className=" font-medium text-primary">EVENT TYPE</p>
            <div className="cursor-pointer text-sm  text-gray-500 flex items-center">
              {participationType.length === 0 ||
              participationType.length == allParticipationTypes.length
                ? "All"
                : participationType.join(", ").replace("_", " ")}
              <IoIosArrowForward className="ml-auto" />
            </div>
          </div>
          <div
            className="flex items-center cursor-pointer  border-b-[1px] border-b-zinc-700 pb-1"
            onClick={() => setIsHubDrawerOpen(true)}
          >
            <div className="flex-1 space-y-3">
              <p className="font-medium text-primary">Ton hub</p>
              <div className="text-gray-500 text-sm line-clamp-1 w-11/12 overflow-hidden">
                {hubText}
              </div>
            </div>

            <IoIosArrowForward className="text-sm text-gray-500 ml-2 mt-8" />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-primary pt-2">SORT BY</p>
            <RadioGroup
              orientation="vertical"
              value={sortBy}
              onValueChange={(value) => setSortBy(value)}
            >
              <label className="flex justify-between items-center  border-b-[1px] border-b-zinc-700 pb-2">
                <span className="text-gray-500 text-sm ">Time</span>
                <RadioGroupItem
                  value="start_date_desc"
                  className="h-4 w-4"
                />
              </label>

              <label className="flex justify-between items-center">
                <span className="text-gray-500 text-sm ">
                  Most People Reached
                </span>
                <RadioGroupItem
                  value="most_people_reached"
                  className="h-4 w-4"
                />
              </label>
            </RadioGroup>
          </div>
        </div>

        <DrawerFooter className="flex justify-end space-x-4 p-4">
          <DrawerClose asChild>
            <button
              className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-200"
              onClick={() => {
                setApplyingFilters(!applyingFilters);
              }}
            >
              Apply filters
            </button>
          </DrawerClose>
          <button
            className="text-blue-600 hover:underline px-4 py-2 rounded-full"
            onClick={() => {
              resetFilters();
              // close the drawer
              onOpenChange(false);
            }}
          >
            Reset filters
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MainFilterDrawer;
