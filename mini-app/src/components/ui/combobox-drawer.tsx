"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import useWebApp from "@/hooks/useWebApp";
import {FiAlertCircle} from "react-icons/fi";

interface ComboboxDrawerProps {
  options?: { value: string; label: string }[];
  placeholder?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  className?: string;
  defaultValue?: string;
  onSelect?: (_value: string) => void;
  errors?: (string | undefined)[];
  onInputChange?: (_inputValue: string) => void;
  disabled?: boolean;
}

export function ComboboxDrawer({
  options,
  placeholder = "Select an option...",
  emptyMessage = "No option found.",
  searchPlaceholder = "Search...",
  className,
  defaultValue,
  onSelect,
  errors,
  onInputChange,
  disabled = false,
}: ComboboxDrawerProps) {
  const webApp = useWebApp();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue); // Track the selected value
  const [search, setSearch] = useState(""); // Track the search input
  const commandListRef = useRef<HTMLDivElement>(null); // Ref to control scrolling

  // Synchronize internal value state with defaultValue prop
  useEffect(() => {
    setValue(defaultValue); // Ensure the selected value is in sync with defaultValue
  }, [defaultValue]);

  // Scroll to the top when input changes
  const handleInputChange = (inputValue: string) => {
    setSearch(inputValue); // Only update search input
    onInputChange?.(inputValue); // Call onInputChange callback if provided
    if (commandListRef.current) {
      commandListRef.current.scrollTop = 0; // Scroll to the top of the CommandList
    }
  };

  // Handle when a selection is made from the list
  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue); // Update the actual selected value
    setSearch(
      options?.find((option) => option.value === selectedValue)?.label || ""
    ); // Update search to show the selected value
    setOpen(false); // Close the drawer
    onSelect?.(selectedValue); // Call the onSelect callback if provided
  };

  // Handle the drawer close and reset the search text if no selection is made
  const handleDrawerClose = () => {
    setOpen(false);
    // Reset the search input to the selected value when closing the drawer
    setSearch(options?.find((option) => option.value === value)?.label || "");
  };

  return (
    <div className="relative w-full">
      {/* Trigger the Drawer when the button is clicked */}
      <Drawer
        open={open} // Bind the drawer state to `open`
        onOpenChange={(isOpen) => {
          setOpen(isOpen); // Update the state when the drawer opens/closes
          if (isOpen) {
            webApp?.MainButton.hide();
          } else {
            handleDrawerClose(); // Reset search on close if no selection
            webApp?.MainButton.show();
          }
        }}
      >
        <DrawerTrigger asChild>
          <Button
            variant="secondary"
            role="combobox"
            aria-expanded={open}
            className={cn(`${className} justify-between`, {
              "border-red-300 border": Boolean(errors?.length),
            })}
            disabled={disabled}
          >
            {/* Show the selected value label, or the searchPlaceholder */}
            {options?.find((option) => option.value === value)?.label ||
              placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DrawerTrigger>

        {/* Drawer content with height 90vh and close button at the bottom */}
        <DrawerContent
          className="p-0 h-[90vh] flex flex-col justify-between"
          showCloseButton={false}
        >
          <Command>
            <CommandInput
              value={search} // Use search state
              onValueChange={handleInputChange} // Handle input change and scroll
              placeholder={searchPlaceholder}
            />
            <div className="overflow-y-auto overflow-x-hidden max-h-full vaul-scrollable">
              <CommandList
                ref={commandListRef}
                className="max-h-full"
              >
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options?.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      keywords={[option.label]}
                      onSelect={(currentValue) => {
                        handleSelect(currentValue); // Call handleSelect to update value
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </div>
          </Command>

          {/* Close button at the bottom */}
          <div className="p-4">
            <Button
              variant="link"
              className="w-full"
              onClick={() => setOpen(false)} // Set the drawer state to close
            >
              X Close
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {errors && (
        <div className="text-red-300  pl-3 pt-1  text-sm flex items-center">
          <FiAlertCircle className="mr-2" /> {errors}
        </div>
      )}
    </div>
  );
}
