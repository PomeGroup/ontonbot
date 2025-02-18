"use client";

import Typography from "@/components/Typography";
import useWebApp from "@/hooks/useWebApp";
import React from "react";
import { useEventData } from "../../Event/eventPageContext";
import CustomButton from "../../Button/CustomButton";
import { sleep } from "@/utils";
import CustomCard from "../cards/CustomCard";

const SupportButtons = () => {
  const webApp = useWebApp();
  const hapticfeedback = webApp?.HapticFeedback;

  const { eventData } = useEventData();
  // trim @ from the start of the username
  const orgSupportTelegramUserName = eventData.data?.organizer?.org_support_telegram_user_name?.replace(/^@/, "");
  return (
    <CustomCard
      title={"Support"}
      defaultPadding
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
      {orgSupportTelegramUserName && (
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
              webApp?.openTelegramLink(`https://t.me/${orgSupportTelegramUserName}`);
              sleep(100).then(() => {
                webApp?.close();
              });
            }}
          >
            Organizer Support
          </CustomButton>
        </>
      )}
    </CustomCard>
  );
};

export default SupportButtons;
