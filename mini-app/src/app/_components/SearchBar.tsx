import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSearch, FaTimes } from "react-icons/fa";
import EventSearchSuggestion from "@/app/_components/EventSearchSuggestion";
import { useSearchEvents } from "@/hooks/useSearchEvents";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { VscSettings } from "react-icons/vsc";
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
    const [participationType, setParticipationType] = useState<string[]>(["online", "in_person"]);
    const [sortBy, setSortBy] = useState<string>("default");

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
            const participationType = searchParams.get("participationType")?.split(",") || ["online", "in_person"];
            const sortBy = searchParams.get("sortBy") || "default";
            const searchTerm = searchParams.get("query") || "";
            setSearchTerm(searchTerm);
            setParticipationType(participationType);
            setSortBy(sortBy);
        }
    }, [searchParams]);

    useEffect(() => {
        if (searchTerm) {
            setShowSuggestions(true);
        }
    }, [searchTerm]);

    const handleCloseSuggestions = () => {
        setShowSuggestions(false);
        setSearchTerm("");  // Clear the search term to show the button
    };

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleSearchChange(event);
        setShowSuggestions(event.target.value.length > 2);
    };

    const handleFilterApply = () => {
        const queryParams = new URLSearchParams({
            query: searchTerm,
            participationType: participationType.join(","),
            sortBy: sortBy,
        });
        router.push(`/search?${queryParams.toString()}`);
    };

    return (
        <div className="relative flex items-center">
            <div
                className={`flex-grow transition-all duration-300 ${
                    searchTerm ? 'animate-grow' : 'animate-shrink'
                }`}
            >
                <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-10 pr-10 p-2 rounded-md focus:ring-0 focus:outline-none focus:text-zinc-100 transition-width duration-300"
                    onChange={handleSearchInputChange}
                    value={searchTerm}
                    onFocus={handleSearchInputChange}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-500 w-5 h-5" />
                </div>
                {searchTerm && (
                    <FaTimes
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-600"
                        onClick={handleCloseSuggestions}
                    />
                )}
                {showSuggestions && (
                    <EventSearchSuggestion
                        searchTerm={searchTerm}
                        onClose={handleCloseSuggestions}
                        autoSuggestions={autoSuggestions}
                        setAutoSuggestions={setAutoSuggestions}
                    />
                )}
            </div>
            {!searchTerm && (
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

                            <VscSettings className="w-8 h-8" />
                        </button>
                    </DrawerTrigger>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>Filter Events</DrawerTitle>
                            <DrawerDescription>
                                Select filters to apply
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 space-y-6">
                            <div className="space-y-4">
                                <p className="text-sm font-medium text-gray-700">EVENT TYPE</p>
                                <div className="flex flex-col space-y-2">
                                    <label className="flex items-center space-x-3">
                                        <Checkbox
                                            checked={participationType.includes("online")}
                                            onCheckedChange={(checked) => {
                                                setParticipationType(prev =>
                                                    checked ? [...prev, "online"] : prev.filter(t => t !== "online")
                                                );
                                            }}
                                        />
                                        <span className="text-gray-700">Online</span>
                                    </label>
                                    <label className="flex items-center space-x-3">
                                        <Checkbox
                                            checked={participationType.includes("in_person")}
                                            onCheckedChange={(checked) => {
                                                setParticipationType(prev =>
                                                    checked ? [...prev, "in_person"] : prev.filter(t => t !== "in_person")
                                                );
                                            }}
                                        />
                                        <span className="text-gray-700">In-person</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm font-medium text-gray-700">SORT BY</p>
                                <RadioGroup
                                    orientation="vertical"
                                    value={sortBy}
                                    onValueChange={setSortBy}
                                >
                                    <label className="flex items-center space-x-3">
                                        <RadioGroupItem value="default" />
                                        <span className="text-gray-700">Default</span>
                                    </label>
                                    <label className="flex items-center space-x-3">
                                        <RadioGroupItem value="start_date_asc" />
                                        <span className="text-gray-700">Time</span>
                                    </label>
                                    <label className="flex items-center space-x-3">
                                        <RadioGroupItem value="most_people_reached" />
                                        <span className="text-gray-700">Most People Reached</span>
                                    </label>
                                </RadioGroup>
                            </div>
                        </div>

                        <DrawerFooter className="flex justify-between items-center p-4">
                            <DrawerClose asChild>
                                <button
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                    onClick={handleFilterApply}
                                >
                                    Apply Filters
                                </button>
                            </DrawerClose>
                            <button
                                className="text-blue-600 hover:underline"
                                onClick={() => {
                                    setParticipationType(["online", "in_person"]);
                                    setSortBy("default");
                                }}
                            >
                                Reset Filters
                            </button>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            )}
        </div>
    );
};

export default SearchBar;
