import DataStatus from "@/app/_components/molecules/alerts/DataStatus";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useDebouncedState } from "@mantine/hooks";
import { ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import isURL from "validator/lib/isURL";
import ManageEventCard from "../ManageEventCard";

const ManageEventCountry = () => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const errors = useCreateEventStore((state) => state.timeplaceStepErrors);
  const setEventData = useCreateEventStore((state) => state.setEventData);

  const [open, setOpen] = React.useState(false);

  // Fetch countries without search parameter
  const countries = trpc.location.getCountries.useQuery({});

  const countryError = errors?.countryId?.[0];

  return (
    <Drawer
      open={open}
      onOpenChange={(state) => {
        setOpen(state);
      }}
      onClose={() => {
        setOpen(false);
      }}
    >
      <DrawerTrigger asChild>
        <div>
          <label
            className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
            htmlFor={"country"}
          >
            Country
          </label>
          <Button
            variant="ghost"
            className={cn("w-full flex-1 bg-brand-divider", countryError && "border-red-500 border border-solid")}
          >
            {/* Placeholder text */}
            {eventData.countryId ? (
              <p>{countries.data?.find((v) => v.id === eventData.countryId)?.title}</p>
            ) : (
              <p className="text-[#8f8f90]">Your Event&apos;s Country</p>
            )}
            <ChevronRight className="ml-auto h-5.5 text-[#3C3C434D]" />
          </Button>
          {countryError && (
            <p className="flex-1 font-normal py-1 text-[13px] leading-4 tracking-normal text-red-400">{countryError}</p>
          )}
        </div>
      </DrawerTrigger>
      <DrawerContent
        title="Where the Event is held?"
        aria-label="Where the Event is held?"
      >
        <ScrollArea className="overflow-y-auto">
          <RadioGroup
            value={eventData.countryId?.toString()}
            onValueChange={(value) => {
              setEventData({
                countryId: Number(value),
              });
            }}
            className="flex flex-col items-start"
          >
            {countries.data?.map((country) => (
              <div
                key={country.id}
                className="flex items-center space-x-2 flex-1"
              >
                <RadioGroupItem
                  value={country.id.toString()}
                  id={`country-${country.id}`}
                />
                <label htmlFor={`country-${country.id}`}>{country.title}</label>
              </div>
            ))}
          </RadioGroup>
        </ScrollArea>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
          variant="primary"
        >
          Save
        </Button>
      </DrawerContent>
    </Drawer>
  );
};

const ManageEventCity = () => {
  const eventData = useCreateEventStore((state) => state.eventData);

  const [open, setOpen] = React.useState(false);
  // Determine if the city combobox should be disabled
  const isCountrySelected = Boolean(eventData?.countryId);

  const errors = useCreateEventStore((state) => state.timeplaceStepErrors);
  const setEventData = useCreateEventStore((state) => state.setEventData);

  const cityError = errors?.cityId?.[0];

  // State to store search input for cities
  const [citySearchD, setCitySearchD] = useDebouncedState<string>("", 1000);
  const [citySearch, setCitySearch] = useState<string>("");

  // Fetch cities dynamically based on search input
  const cities = trpc.location.getCities.useQuery(
    {
      countryId: eventData?.countryId!,
      search: citySearchD,
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
      enabled: Boolean(eventData?.cityId),
    }
  );

  useEffect(() => {
    // Prepopulate city data when editing
    if (cityData && !citySearchD) {
      setCitySearchD(cityData.title);
    }
  }, [cityData]);

  return (
    <Drawer
      open={isCountrySelected ? open : false}
      onOpenChange={(state) => {
        setOpen(state);
      }}
      onClose={() => {
        setOpen(false);
      }}
    >
      <DrawerTrigger
        disabled={!isCountrySelected}
        asChild
      >
        <div>
          <label
            className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
            htmlFor={"city"}
          >
            City
          </label>
          <Button
            variant="ghost"
            disabled={!isCountrySelected}
            className={cn("w-full flex-1 bg-brand-divider", cityError && "border-red-500 border border-solid")}
          >
            {/* Placeholder text */}
            {eventData.cityId ? <p>{cityData?.title}</p> : <p className="text-[#8f8f90]">Your Event&apos;s City</p>}
            <ChevronRight className="ml-auto h-5.5 text-[#3C3C434D]" />
          </Button>
          {cityError && (
            <p className="flex-1 font-normal py-1 text-[13px] leading-4 tracking-normal text-red-400">{cityError}</p>
          )}
        </div>
      </DrawerTrigger>
      <DrawerContent
        title="Where the Event is held?"
        aria-label="Where the Event is held?"
      >
        {!cities.data?.length && cities.isLoading && (
          <div>
            <DataStatus
              status="pending"
              title="Loading Cities"
            />
          </div>
        )}

        {cities.isError && (
          <div>
            <DataStatus
              status="danger"
              title="Loading Failed"
            />
          </div>
        )}

        {cities.data && (
          <>
            <Input
              label="Search"
              placeholder="Find your city"
              value={citySearch}
              onChange={(e) => {
                e.preventDefault();
                setCitySearchD(e.target.value);
                setCitySearch(e.target.value);
              }}
            />
            <ScrollArea className="overflow-y-auto">
              <RadioGroup
                value={eventData.cityId?.toString()}
                onValueChange={(value) => {
                  setEventData({
                    cityId: Number(value),
                  });
                }}
                className="flex flex-col items-start"
              >
                {cities.data?.map((city) => (
                  <div
                    key={city.id}
                    className="flex items-center space-x-2 flex-1"
                  >
                    <RadioGroupItem
                      value={city.id.toString()}
                      id={`city-${city.id}`}
                    />
                    <label htmlFor={`city-${city.id}`}>{city.title}</label>
                  </div>
                ))}
              </RadioGroup>
            </ScrollArea>
          </>
        )}

        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
          variant="primary"
        >
          Save
        </Button>
      </DrawerContent>
    </Drawer>
  );
};

const ManageEventLocation = () => {
  const eventData = useCreateEventStore((state) => state.eventData);
  const errors = useCreateEventStore((state) => state.timeplaceStepErrors);
  const setEventData = useCreateEventStore((state) => state.setEventData);

  const [open, setOpen] = React.useState(false);

  const isLocationError = errors?.cityId || errors?.countryId || errors?.location;

  const countries = trpc.location.getCountries.useQuery(
    {},
    {
      staleTime: Infinity,
    }
  );

  // Fetch city details by cityId when editing
  const { data: cityData } = trpc.location.getCityById.useQuery(
    {
      cityId: eventData?.cityId!,
    },
    {
      enabled: Boolean(eventData?.cityId),
    }
  );
  return (
    <ManageEventCard title="Location">
      <Drawer
        open={open}
        onOpenChange={(state) => {
          setOpen(state);
        }}
        onClose={() => {
          setOpen(false);
        }}
      >
        <DrawerTrigger asChild>
          <div>
            <label
              className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
              htmlFor={"hub"}
            >
              Event&apos;s Place
            </label>
            <Button
              variant="ghost"
              className={cn("w-full flex-1 bg-brand-divider", isLocationError && "border-red-500 border border-solid")}
            >
              {eventData.eventLocationType === "in_person" ? (
                eventData.countryId || eventData.cityId ? (
                  <p className="truncate">
                    {cityData?.title}, {countries.data?.find((i) => i.id === eventData.countryId)?.title}
                  </p>
                ) : (
                  <p className="text-[#8f8f90]">Select location</p>
                )
              ) : eventData.location ? (
                <p className="truncate">{eventData.location}</p>
              ) : (
                <p className="text-[#8f8f90]">Select location</p>
              )}

              <ChevronRight className="ml-auto min-w-5.5 h-5.5 text-[#3C3C434D]" />
            </Button>
            {isLocationError && (
              <p className="flex-1 font-normal py-1 text-[13px] leading-4 tracking-normal text-red-400">
                Please select a valid location
              </p>
            )}
          </div>
        </DrawerTrigger>
        <DrawerContent
          title="Where the Event is held?"
          aria-label="Where the Event is held?"
        >
          <ScrollArea className="overflow-y-auto">
            <Tabs
              defaultValue={eventData.eventLocationType}
              onValueChange={(value) => {
                setEventData({
                  eventLocationType: value as "in_person" | "online",
                  location: eventData.location && value === "online" && isURL(eventData.location) ? eventData.location : "",
                });
              }}
              className="w-full"
            >
              <TabsList>
                <TabsTrigger value="in_person">In-person</TabsTrigger>
                <TabsTrigger value="online">Online</TabsTrigger>
              </TabsList>
              <TabsContent
                value="in_person"
                className="flex flex-col gap-4 font-normal"
              >
                <ManageEventCountry />
                <ManageEventCity />
                <Input
                  label="Detail"
                  title="Your Event's Location Details"
                  name="address-info"
                  placeholder="Your Event's Location Details"
                  type="text"
                  info="Type info’s detail and choose it on the map so attendees can access easier"
                  value={eventData.location}
                  errors={errors?.location}
                  onChange={(e) => {
                    setEventData({
                      location: e.target.value,
                    });
                  }}
                />
              </TabsContent>
              <TabsContent value="online">
                <Input
                  label="Event's Link"
                  title="Event's Link"
                  name="eventLink"
                  placeholder="Even location link"
                  type="url"
                  errors={errors?.location}
                  value={eventData.location}
                  onChange={(e) => {
                    setEventData({
                      location: e.target.value,
                    });
                  }}
                />
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <Button
            type="button"
            variant="primary"
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
            }}
          >
            Submit
          </Button>
        </DrawerContent>
      </Drawer>
    </ManageEventCard>
  );
};

export default ManageEventLocation;
