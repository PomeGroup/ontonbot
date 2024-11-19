import { trpc } from "@/app/_trpc/client";
import { ComboboxDrawer } from "@/components/ui/combobox-drawer";
import { cn } from "@/utils";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { Block } from "konsta/react";
import { useEffect, useState } from "react";

export const SelectLocation = () => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const setEventData = useCreateEventStore((state) => state.setEventData);
  const errors = useCreateEventStore((state) => state.timeplaceStepErrors);

  // Fetch countries without search parameter
  const countries = trpc.location.getCountries.useQuery({});

  // State to store search input for cities
  const [citySearch, setCitySearch] = useState<string>("");

  // Fetch cities dynamically based on search input
  const cities = trpc.location.getCities.useQuery(
    {
      countryId: eventData?.countryId!,
      search: citySearch,
    },
    {
      enabled: Boolean(eventData?.countryId),
    }
  );

  // Fetch city details by cityId when editing
  const { data: cityData } = trpc.location.getCityById.useQuery(
    {
      cityId: eventData?.cityId!,
    },
    {
      enabled: Boolean(eventData?.cityId) && !citySearch.length, // Fetch only if cityId exists and no search term is provided
    }
  );

  // Determine if the city combobox should be disabled
  const isCityDisabled = !eventData?.countryId;

  useEffect(() => {
    // Prepopulate city data when editing
    if (cityData && !citySearch) {
      setCitySearch(cityData.title); // Set the city title if we fetched the city
    }
  }, [cityData, citySearch]);

  return (
    <Block className="space-y-2">
      <ComboboxDrawer
        options={countries.data?.map((country) => ({
          label: country.title,
          value: country.id.toString(),
        }))}
        placeholder="Select a country"
        onSelect={(data) => {
          if (data) {
            setEventData({
              countryId: Number(data),
              cityId: undefined, // Reset the city when a new country is selected
            });
            setCitySearch("");
          }
        }}
        errors={errors?.countryId}
        className="w-full"
        defaultValue={eventData?.countryId?.toString()}
        searchPlaceholder="Type to search for countries..."
      />

      {/* Combobox for selecting a city */}
      <ComboboxDrawer
        options={cities.data?.map((city) => ({
          label: city.title,
          value: city.id.toString(),
        }))}
        placeholder="Select a city"
        onInputChange={(inputValue) =>
          !isCityDisabled && setCitySearch(inputValue)
        } // Disable input change if no country is selected
        defaultValue={eventData?.cityId?.toString()}
        onSelect={(data) => {
          if (data && !isCityDisabled) {
            setEventData({ cityId: Number(data) });
          }
        }}
        errors={errors?.cityId}
        className={cn(
          "w-full",
          isCityDisabled && "opacity-50 cursor-not-allowed" // Add disabled style
        )}
        searchPlaceholder={
          isCityDisabled
            ? "Select a country first..."
            : "Type to search for cities..."
        }
        disabled={isCityDisabled}
      />
    </Block>
  );
};
