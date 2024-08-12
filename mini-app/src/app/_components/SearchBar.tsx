import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaSearch, FaTimes } from "react-icons/fa";
import EventSearchSuggestion from "@/app/_components/EventSearchSuggestion";
import { useSearchEvents } from "@/hooks/useSearchEvents";

interface SearchBarProps {
    includeQueryParam?: boolean; // Add a prop to control whether the query param is included
}

const SearchBar: React.FC<SearchBarProps> = ({ includeQueryParam = true }) => {
    const router = useRouter();
    const [showSuggestions, setShowSuggestions] = useState(false);
    const {
        searchTerm,
        setSearchTerm,
        autoSuggestions,
        setAutoSuggestions,
        handleSearchChange,
    } = useSearchEvents();
    const searchParams = useSearchParams();
    const searchTermQuery = searchParams.get('query');

    // useEffect to initialize searchTerm only once with searchTermQuery
    useEffect(() => {
        if (searchTermQuery && !searchTerm) {
            setSearchTerm(searchTermQuery);
        }
    }, [searchTermQuery]);

    const handleCloseSuggestions = () => {
        setShowSuggestions(false);
    };

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleSearchChange(event);
        setShowSuggestions(event.target.value.length > 2);
    };

    const closeSuggestions = () => {
        setShowSuggestions(false);
    };

    const handleFocus = () => {
        if (searchTerm.length > 2) {
            setShowSuggestions(true);
        }
    };

    return (
        <div className="relative">
            <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-10 p-2 rounded-md focus:ring-0 focus:outline-none focus:text-zinc-100"
                onChange={handleSearchInputChange}
                value={searchTerm} // use searchTerm directly
                onFocus={handleFocus}
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
                    onClose={closeSuggestions}
                    autoSuggestions={autoSuggestions}
                    setAutoSuggestions={setAutoSuggestions}
                />
            )}
        </div>
    );
};

export default SearchBar;
