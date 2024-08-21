"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IoSearchOutline,
  IoCloseOutline,
  IoOptionsOutline,
} from "react-icons/io5";
import EventSearchSuggestion from "@/app/_components/EventSearchSuggestion";
import { useSearchEvents } from "@/hooks/useSearchEvents";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { VscSettings } from "react-icons/vsc";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import useWebApp from "@/hooks/useWebApp";

interface SearchBarProps {
  includeQueryParam?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ includeQueryParam = true }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [participationType, setParticipationType] = useState<string[]>([
    "online",
    "in_person",
  ]);
  const [sortBy, setSortBy] = useState<string>("default");
  const [showFilterButton, setShowFilterButton] = useState(true);
  const webApp = useWebApp();
  const {
    searchTerm,
    setSearchTerm,
    autoSuggestions,
    setAutoSuggestions,
    handleSearchChange,
  } = useSearchEvents();

  useEffect(() => {
    if (includeQueryParam) {
      const participationType = searchParams
        .get("participationType")
        ?.split(",") || ["online", "in_person"];
      const sortBy = searchParams.get("sortBy") || "default";
      const searchTerm = searchParams.get("query") || "";
      setSearchTerm(searchTerm);
      setParticipationType(participationType);
      setSortBy(sortBy);
    }
  }, [searchParams]);

  // useEffect(() => {
  //     if (searchTerm) {
  //         setShowSuggestions(true);
  //     }
  // }, [searchTerm]);

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
    setShowFilterButton(true);
    //setSearchTerm("");  // Clear the search term to show the button
  };

  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isFocused = document.activeElement === event.target;
    setShowFilterButton(!isFocused);
    handleSearchChange(event);
    setShowSuggestions(event.target.value.length > 2);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleFilterApply();
    }
  };

  const handleFilterApply = () => {
    const queryParams = new URLSearchParams({
      query: searchTerm,
      participationType: participationType.join(","),
      //      startDate:  (Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 600)).toString(),
      sortBy: sortBy,
    });
    // console.log("queryParams", queryParams.toString());
    if (!includeQueryParam) {
      router.push(`/search?${queryParams.toString()}`);
    } else {
      window.location.href = `/search?${queryParams.toString()}`; // Correct usage of window.location.href
      return false; // it must be false to prevent the default action
    }
  };

  return (
    <div className="relative flex items-center">
      <div
        className={`flex-grow transition-all duration-300 ${
          searchTerm ? "animate-grow" : "animate-shrink"
        }`}
      >
        <input
          type="text"
          placeholder="Search"
          className="w-full pl-10 pr-10 p-2 rounded-2xl focus:ring-0 focus:outline-none focus:text-zinc-100 transition-width duration-300"
          onChange={handleSearchInputChange}
          onKeyDown={handleKeyDown} // Listen for Enter key
          value={searchTerm}
          onFocus={handleSearchInputChange}
          onBlur={handleSearchInputChange}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <IoSearchOutline className="text-gray-500 w-5 h-5" />
        </div>
        {!showFilterButton && (
          <IoCloseOutline
            className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-white w-4 h-4 p-1 rounded-full bg-gray-600"
            onClick={handleCloseSuggestions}
          />
        )}
        {showSuggestions && (
          <EventSearchSuggestion
            searchTerm={searchTerm}
            onClose={handleCloseSuggestions}
            autoSuggestions={autoSuggestions}
            setAutoSuggestions={setAutoSuggestions}
            handleFilterApply={handleFilterApply}
          />
        )}
      </div>
      {showFilterButton && (
        <Drawer
          onOpenChange={(open) => {
            if (open) {
              webApp?.MainButton.hide();
            } else {
              if (webApp?.MainButton.isVisible === false) {
                webApp?.MainButton.hide();
              } else {
                webApp?.MainButton.show();
              }
            }
          }}
        >
          <DrawerTrigger>
            <button className="ml-4 p-2 rounded-md text-gray-500 hover:text-gray-700">
              <IoOptionsOutline className="w-7 h-7" />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filter List</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-medium text-zinc-100">EVENT TYPE</p>
                <div className="flex flex-col space-y-2">
                  <label className="flex justify-between items-center">
                    <span className="text-zinc-400">Online</span>
                    <Checkbox
                      checked={participationType.includes("online")}
                      onCheckedChange={(checked) => {
                        setParticipationType((prev) =>
                          checked
                            ? [...prev, "online"]
                            : prev.filter((t) => t !== "online")
                        );
                      }}
                    />
                  </label>
                  <Separator className="my-0" />
                  <label className="flex justify-between items-center">
                    <span className="text-zinc-400">In-person</span>
                    <Checkbox
                      checked={participationType.includes("in_person")}
                      onCheckedChange={(checked) => {
                        setParticipationType((prev) =>
                          checked
                            ? [...prev, "in_person"]
                            : prev.filter((t) => t !== "in_person")
                        );
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-zinc-100">SORT BY</p>
                <RadioGroup
                  orientation="vertical"
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <label className="flex justify-between items-center">
                    <span className="text-zinc-400">Default</span>
                    <RadioGroupItem value="default" />
                  </label>
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
                  onClick={handleFilterApply}
                >
                  Filter Events
                </button>
              </DrawerClose>
              <button
                className="text-blue-600 hover:underline px-4 py-2 rounded-full"
                onClick={() => {
                  setParticipationType(["online", "in_person"]);
                  setSortBy("default");
                }}
              >
                Reset filters
              </button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

export default SearchBar;
