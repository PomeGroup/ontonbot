"use client";

import Typography from "@/components/Typography";
import useWebApp from "@/hooks/useWebApp";
import { Card } from "konsta/react";
import React from "react";
import { useEventData } from "../../Event/eventPageContext";
import CustomButton from "../../Button/CustomButton";

const SupportButtons = () => {
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
        className="!-mt-6 mb-2"
      >
        Do you have issues with SBT or payment?
      </Typography>
      <CustomButton
        variant="outline"
        onClick={() => {
          hapticfeedback?.impactOccurred("medium");
          webApp?.openTelegramLink("https://t.me/ontonsupport");
        }}
      >
        ONTON Support
      </CustomButton>
      {eventData.data?.organizer?.org_support_telegram_user_name && (
        <>
          <Typography
            variant="body"
            weight="normal"
            className="my-2"
          >
            Do you have questions about the event?
          </Typography>
          <CustomButton
            variant="outline"
            onClick={() => {
              hapticfeedback?.impactOccurred("medium");
              webApp?.openTelegramLink(`https://t.me/${eventData.data?.organizer?.org_support_telegram_user_name}`);
            }}
          >
            Organizer Support
          </CustomButton>
        </>
      )}
    </Card>
  );
};

export default SupportButtons;
