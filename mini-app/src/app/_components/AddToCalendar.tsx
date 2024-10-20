"use client";

import * as React from "react";
import { FaGoogle, FaYahoo, FaCalendarPlus } from "react-icons/fa";
import { SiMicrosoftoutlook } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator"; // Assuming shadcn drawer is structured like this

type Props = {
  title: string;
  startDate: number; // UTC timestamp in milliseconds
  endDate: number; // UTC timestamp in milliseconds
  description: string;
};

const formatDateToGoogleCalendar = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

const AddToCalendar = ({ title, startDate, endDate, description }: Props) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const startFormatted = formatDateToGoogleCalendar(startDate);
  const endFormatted = formatDateToGoogleCalendar(endDate);

  const googleCalendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${startFormatted}/${endFormatted}&details=${encodeURIComponent(
    description
  )}`;

  const outlookLink = `https://outlook.live.com/owa/?path=/calendar/action/compose&rru=addevent&startdt=${new Date(
    startDate
  ).toISOString()}&enddt=${new Date(endDate).toISOString()}&subject=${encodeURIComponent(
    title
  )}&body=${encodeURIComponent(description)}`;

  const yahooLink = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeURIComponent(
    title
  )}&st=${new Date(startDate).toISOString()}&et=${new Date(
    endDate
  ).toISOString()}&desc=${encodeURIComponent(description)}`;

  // Function to open the link using Telegram Web App API and close drawer
  const openInOSBrowser = (url: string) => {
    if (window.Telegram.WebApp) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, "_blank", "noopener noreferrer");
    }
    setIsOpen(false); // Close drawer after clicking link
  };

  return (
    <>
      <Drawer
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-gray-100 active:bg-gray-800 active:text-gray-300"
          >
            <FaCalendarPlus className="mr-2" />
            Add to Calendar
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[60vh] flex flex-col justify-between text-gray-100">
          <div className="space-y-2 p-4">
            <Button
              variant="link"
              className="flex items-center"
              onClick={() => openInOSBrowser(googleCalendarLink)}
            >
              <FaGoogle className="mr-2" />
              Add to Google Calendar
            </Button>
            <Separator className="bg-gray-700 my-2" />
            <Button
              variant="link"
              className="flex items-center"
              onClick={() => openInOSBrowser(outlookLink)}
            >
              <SiMicrosoftoutlook className="mr-2" />
              Add to Outlook Calendar
            </Button>
            <Separator className="bg-gray-700 my-2" />
            <Button
              variant="link"
              className="flex items-center"
              onClick={() => openInOSBrowser(yahooLink)}
            >
              <FaYahoo className="mr-2" />
              Add to Yahoo Calendar
            </Button>
          </div>
          {/* Close button at the bottom */}
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-gray-100 active:bg-gray-800 active:text-gray-300"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default AddToCalendar;
