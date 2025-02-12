"use client";

import Typography from "@/components/Typography";
import { Button } from "konsta/react";
import useWebApp from "@/hooks/useWebApp";
import { Card } from "konsta/react";
import React from "react";
import { useEventData } from "../../Event/eventPageContext";

const SupportButton = () => {
  const webApp = useWebApp();
  const hapticfeedback = webApp?.HapticFeedback;
  const { eventData } = useEventData();

  return (
    <Card
      header={
        <>
          <Typography
            weight={"bold"}
            variant="title3"
          >
            Support
          </Typography>
        </>
      }
    >
      <Typography
        variant="body"
        weight="normal"
        className="!-mt-6"
      >
        Do you have issues with SBT or payment?
      </Typography>
      <Button
        outline
        large
        className="rounded-2lg !mt-2"
        onClick={() => {
          hapticfeedback?.impactOccurred("medium");
          webApp?.openTelegramLink("https://t.me/ontonsupport");
        }}
      >
        <Typography
          variant={"headline"}
          weight={"semibold"}
          className="capitalize"
        >
          ONTON Support
        </Typography>
      </Button>
      {eventData.data?.organizer?.org_support_telegram_user_name && (
        <>
          <Typography
            variant="body"
            weight="normal"
            className="mt-2"
          >
            Do you have questions about the event?
          </Typography>
          <Button
            outline
            large
            className="rounded-2lg !mt-2 caption-bottom"
            onClick={() => {
              hapticfeedback?.impactOccurred("medium");
              webApp?.openTelegramLink(`https://t.me/${eventData.data?.organizer?.org_support_telegram_user_name}`);
            }}
          >
            <Typography
              variant={"headline"}
              weight={"semibold"}
              className="capitalize"
            >
              Event Support
            </Typography>
          </Button>
        </>
      )}
    </Card>
  );
};

export default SupportButton;
