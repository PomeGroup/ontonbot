"use client";
import { KButton } from "@/components/ui/button";
import { KSheet } from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import searchEventsInputZod from "@/zodSchema/searchEventsInputZod";
import React from "react";
import { IoIosArrowForward } from "react-icons/io";
import { IoOptionsOutline } from "react-icons/io5";
import { z } from "zod";

/** The union from your Zod schema: 'default' | 'time' | 'most_people_reached' | etc. */
export type SortByType = z.infer<typeof searchEventsInputZod>["sortBy"];

/** This is how you want the parent to set the sort:
 *  i.e. (newValue: SortByType) => void
 */
export type setSortByType = (value: SortByType) => void;

interface MainFilterDrawerProps {
  onOpenChange: (open: boolean) => void;
  /** This can be ("online"|"in_person")[], but you have it as string[] in your snippet */
  participationType: string[];
  hubText: string;
  sortBy: SortByType;
  setSortBy: setSortByType;
  setIsEventTypeDrawerOpen: (open: boolean) => void;
  setIsHubDrawerOpen: (open: boolean) => void;
  resetFilters: () => void;
  applyingFilters: boolean;
  setApplyingFilters: (value: boolean) => void;
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
    <KSheet
      trigger={(open, setOpen) => (
        <button
          onClick={() => setOpen(true)}
          className="p-[6px] rounded-md text-gray-500 hover:text-gray-700 bg-[#7474801F]"
        >
          <IoOptionsOutline className="w-7 h-7" />
        </button>
      )}
    >
      {(open, setOpen) => (
        <>
          <div className="p-4 py-4 space-y-2 cursor-pointer">
            {/* EVENT TYPE */}
            <div
              className="space-y-3 border-b-[1px] pb-1"
              onClick={() => setIsEventTypeDrawerOpen(true)}
            >
              <p className=" font-medium">Event Type</p>
              <div className="cursor-pointer text-sm flex items-center">
                {participationType.length === 0 ||
                  participationType.length === allParticipationTypes.length
                  ? "All"
                  : participationType.join(", ").replace("_", " ")}
                <IoIosArrowForward className="ml-auto" />
              </div>
            </div>

            {/* HUB SELECTOR */}
            <div
              className="flex items-center cursor-pointer border-b pb-1"
              onClick={() => setIsHubDrawerOpen(true)}
            >
              <div className="flex-1 space-y-3">
                <p className="font-medium">Ton Hub</p>
                <div className="text-sm line-clamp-1 w-11/12 overflow-hidden">
                  {hubText}
                </div>
              </div>
              <IoIosArrowForward className="text-sm ml-2 mt-8" />
            </div>

            {/* SORT BY */}
            <div className="space-y-4">
              <p className="text-sm font-medium pt-2">Sort By</p>
              <RadioGroup
                orientation="vertical"
                /* The RadioGroup wants a string, so `sortBy` is also a string union.
                   If TS complains, cast: (sortBy as string) */
                value={sortBy}
                onValueChange={(value) => {
                  // 'value' is always string -> cast to SortByType
                  setSortBy(value as SortByType);
                }}
              >
                <label className="flex justify-between items-center border-b-[1px] pb-2">
                  <span className="text-sm">Time</span>
                  <RadioGroupItem value="start_date_desc" className="h-4 w-4" />
                </label>
                <label className="flex justify-between items-center">
                  <span className="text-sm">Most People Reached</span>
                  <RadioGroupItem
                    value="most_people_reached"
                    className="h-4 w-4"
                  />
                </label>
              </RadioGroup>
            </div>
          </div>

          {/* APPLY / RESET BUTTONS */}
          <div className="flex gap-1 p-4 flex-col">
            <KButton
              className="py-5 rounded-3xl"
              onClick={() => {
                setApplyingFilters(!applyingFilters);
                onOpenChange(false);
                setOpen(false);
              }}
            >
              Apply filters
            </KButton>
            <KButton
              tonal
              className="py-5 rounded-3xl"
              onClick={() => {
                resetFilters();
                onOpenChange(false);
                setOpen(false);
              }}
            >
              Reset filters
            </KButton>
          </div>
        </>
      )}
    </KSheet>
  );
};

export default MainFilterDrawer;
