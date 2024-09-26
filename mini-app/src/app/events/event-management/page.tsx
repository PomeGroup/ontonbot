"use client";

import React, { useState, useMemo } from "react";
import { trpc } from "@/app/_trpc/client";
import { useRouter } from "next/navigation";
import EventCard from "@/app/_components/EventCard/EventCard";
import SearchBar from "@/app/_components/SearchBar/SearchBar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import useWebApp from "@/hooks/useWebApp";
import { OntonEvent } from "@/types/event.types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  MoreHorizontal,
  Globe,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
} from "lucide-react";

const EventList = ({ filter = "all" }) => {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<OntonEvent[]>([]);
  const webApp = useWebApp();
  const UserId = webApp?.initDataUnsafe?.user?.id;

  const { data: eventsData, isLoading } = trpc.events.getEvents.useQuery(
    { init_data: webApp?.initData || "" },
    {
      enabled: Boolean(webApp?.initData),
      onSuccess: (data: OntonEvent[]) => setSearchResults(data || []), // Correct type
    }
  );

  // Mock data - replace with actual data fetching logic
  const eventData = useMemo(
    () => ({
      title: "TON Gateway 2024",
      subtitle: "Dubai 2024",
      description:
        "The Gateway is an annual event for the TON Community. At the Gateway, TON ecosystem comes together to collaborate.",
      image_url: "/placeholder.svg?height=200&width=400&text=The+Gateway",
      host: "Jeremy crew",
      website: "thegateway.org",
      date: "10 May 2024",
      time: "12:00 to 15:00",
      duration: "3 hours",
      location: "Helsinki XR Center",
      price: "$500",
      about:
        "The Gateway is an annual event for the TON Community. With TON blockchain, the mission is to put crypto in every pocket by acting as a gateway to Web3 for millions of people in Telegram.",
      sections: [
        "Develop a visual language for new products and events.",
        "Work with the team to develop and change",
      ],
    }),
    []
  );

  const filteredEvents = searchResults.filter((event) => {
    const now = Date.now();
    switch (filter) {
      case "upcoming":
        return event.startDate > now;
      case "past":
        return event.endDate < now;
      case "ongoing":
        return event.startDate <= now && event.endDate >= now;
      default:
        return true;
    }
  });

  // if (isLoading) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div className="container mx-auto p-4">
      <SearchBar
        includeQueryParam={false}
        onUpdateResults={setSearchResults}
        tabValue={filter}
      />
      <ScrollArea className="h-[600px] mt-4">
        {filteredEvents.map((event) => (
          <EventCard
            key={event.eventUuid}
            event={event}
            currentUserId={UserId}
            mode={filter === "ongoing" ? "ongoing" : "normal"}
          />
        ))}
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      <div className="flex-1 overflow-auto">
        <div className="relative">
          <Image
            src={eventData.image_url}
            alt="Event banner"
            className="w-full h-48 object-cover"
            unoptimized
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent text-white">
            <h2 className="text-2xl font-bold">{eventData.title}</h2>
            <p>{eventData.subtitle}</p>
          </div>
        </div>

        <div className="p-4">
          <p className="text-gray-600 mb-4">{eventData.description}</p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage
                  src="/placeholder.svg?height=24&width=24"
                  alt="Host"
                />
                <AvatarFallback>HC</AvatarFallback>
              </Avatar>
              <span className="text-sm">Hosted by: {eventData.host}</span>
            </div>
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              <span className="text-sm text-blue-600">{eventData.website}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="text-sm">{eventData.date}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm">
                {eventData.time} • {eventData.duration}
              </span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm">{eventData.location}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              <span className="text-sm">{eventData.price}</span>
            </div>
          </div>

          <Button
            className="w-full mb-4"
            variant="outline"
          >
            Check-in guests
          </Button>

          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">YouTube Video</span>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Image
                  src="/placeholder.svg?height=40&width=40"
                  alt="SBT Award"
                  className="w-10 h-10 mr-2"
                />
                <div>
                  <h3 className="font-semibold">Gateway Participants 2024</h3>
                  <p className="text-sm text-gray-500">
                    The Open Network Conference ho...
                  </p>
                </div>
              </div>
              <ChevronLeft className="h-5 w-5 transform rotate-180" />
            </CardContent>
          </Card>

          <h3 className="font-bold text-lg mb-2">About</h3>
          <p className="text-gray-600 mb-4">{eventData.about}</p>

          <h3 className="font-bold text-lg mb-2">Section title</h3>
          <ul className="list-disc pl-5 mb-4">
            {eventData.sections.map((section, index) => (
              <li
                key={index}
                className="text-gray-600"
              >
                {section}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="bg-white p-4">
        <Button className="w-full">Manage event</Button>
      </footer>
    </div>
  );
};

export default EventList;
