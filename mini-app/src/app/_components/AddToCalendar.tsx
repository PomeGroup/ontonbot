"use client";

import * as React from "react";
import { FaGoogle, FaYahoo, FaCalendarPlus } from "react-icons/fa";
import { PiMicrosoftOutlookLogoThin } from "react-icons/pi";
import { Button, KButton } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { Block, Sheet } from "konsta/react";
import { cn } from "@/utils";

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
  )}&dates=${startFormatted}/${endFormatted}&details=${encodeURIComponent(description)}`;

  const outlookLink = `https://outlook.live.com/owa/?path=/calendar/action/compose&rru=addevent&startdt=${new Date(
    startDate
  ).toISOString()}&enddt=${new Date(endDate).toISOString()}&subject=${encodeURIComponent(
    title
  )}&body=${encodeURIComponent(description)}`;

  const yahooLink = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeURIComponent(
    title
  )}&st=${new Date(startDate).toISOString()}&et=${new Date(endDate).toISOString()}&desc=${encodeURIComponent(description)}`;

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
      <KButton
        className="w-full"
        tonal
        itemType="button"
        // @ts-expect-error
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <FaCalendarPlus className="mr-2" />
        Add to Calendar
      </KButton>
      {createPortal(
        <Sheet
          opened={isOpen}
          onBackdropClick={setIsOpen}
          className={cn("w-full")}
        >
          <Block className="flex flex-col gap-2 justify-between">
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
                <PiMicrosoftOutlookLogoThin className="mr-2" />
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
            <KButton
              className="w-full"
              onClick={() => setIsOpen(false)}
              tonal
            >
              Close
            </KButton>
          </Block>
        </Sheet>,
        document.body
      )}
    </>
  );
};

export default AddToCalendar;
