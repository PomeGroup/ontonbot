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
import { trpc } from "@/app/_trpc/client";

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
  const [selectedHubs, setSelectedHubs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("default");
  const [showFilterButton, setShowFilterButton] = useState(true);
  const [isEventTypeDrawerOpen, setIsEventTypeDrawerOpen] = useState(false);
  const [isHubDrawerOpen, setIsHubDrawerOpen] = useState(false);
  const webApp = useWebApp();
  const hubsResponse = trpc.events.getHubs.useQuery();
 
  const hubs = hubsResponse.data?.hubs || [];
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
      const selectedHubs = searchParams
          .get("selectedHubs")
          ?.split(",") || [];
      const sortBy = searchParams.get("sortBy") || "default";
      const searchTerm = searchParams.get("query") || "";
      setSearchTerm(searchTerm);
      setParticipationType(participationType);
      setSelectedHubs(selectedHubs);
      setSortBy(sortBy);
    }
  }, [searchParams]);

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
    setShowFilterButton(true);
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
      selectedHubs: selectedHubs.join(","),
      sortBy: sortBy,
    });

    if (!includeQueryParam) {
      router.push(`/search?${queryParams.toString()}`);
    } else {
      window.location.href = `/search?${queryParams.toString()}`;
      return false;
    }
  };

  const toggleParticipationType = (type: string) => {
    setParticipationType((prev) =>
        prev.includes(type)
            ? prev.filter((t) => t !== type)
            : [...prev, type]
    );
  };

  const toggleHubSelection = (hubId: string) => {
    setSelectedHubs((prev) =>
        prev.includes(hubId)
            ? prev.filter((id) => id !== hubId)
            : [...prev, hubId]
    );
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
                <div className="cursor-pointer text-blue-500">
                  {selectedHubs
                    .map((hubId) => hubs.find((hub) => hub.id === hubId)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </div>
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
                  onClick={handleFilterApply}
                >
                  Filter Events
                </button>
              </DrawerClose>
              <button
                className="text-blue-600 hover:underline px-4 py-2 rounded-full"
                onClick={() => {
                  setParticipationType(["online", "in_person"]);
                  setSelectedHubs([]);
                  setSortBy("default");
                }}
              >
                Reset filters
              </button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* Event Type Drawer */}
      <Drawer
        open={isEventTypeDrawerOpen}
        onOpenChange={setIsEventTypeDrawerOpen}
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
          <DrawerFooter className="flex justify-end space-x-4 p-4">
            <button
              className="text-blue-600 hover:underline px-4 py-2 rounded-full"
              onClick={() => setIsEventTypeDrawerOpen(false)}
            >
              Done
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Hub Drawer */}
      <Drawer
        open={isHubDrawerOpen}
        onOpenChange={setIsHubDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Select Hubs</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            {hubs.map((hub) => {
              return (
                <div
                  key={hub.id}
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleHubSelection(hub.id)}
                >
                  <span className="text-zinc-400">{hub.name}</span>
                  <Checkbox
                    checked={selectedHubs.includes(hub.id)}
                    onCheckedChange={() => toggleHubSelection(hub.id)}
                  />
                </div>
              );
            })}
          </div>
          <DrawerFooter className="flex justify-end space-x-4 p-4">
            <button
              className="text-blue-600 hover:underline px-4 py-2 rounded-full"
              onClick={() => setIsHubDrawerOpen(false)}
            >
              Done
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default SearchBar;
