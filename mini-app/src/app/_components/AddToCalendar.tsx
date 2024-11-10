"use client";

import * as React from "react";
import { FaGoogle, FaYahoo, FaCalendarPlus } from "react-icons/fa";
import { SiMicrosoftoutlook } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
// Assuming shadcn drawer is structured like this

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
            className="w-full"
            size='sm'
          >
            <FaCalendarPlus className="mr-2" />
            Add to Calendar
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[60vh] flex flex-col justify-between">
          <div className="space-y-2 p-4 divide-black divide-y-2 w-full">
            <Button
              variant="link"
              className="flex rounded-none items-center w-full"
              onClick={() => openInOSBrowser(googleCalendarLink)}
            >
              <FaGoogle className="mr-2" />
              Add to Google Calendar
            </Button>
            <Button
              variant="link"
              className="flex rounded-none items-center w-full"
              onClick={() => openInOSBrowser(outlookLink)}
            >
              <SiMicrosoftoutlook className="mr-2" />
              Add to Outlook Calendar
            </Button>
            <Button
              variant="link"
              className="flex rounded-none items-center w-full"
              onClick={() => openInOSBrowser(yahooLink)}
            >
              <FaYahoo className="mr-2" />
              Add to Yahoo Calendar
            </Button>
          </div>
          {/* Close button at the bottom */}
          <div className="p-4">
            <Button
              variant="primary"
              className='w-full'
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
