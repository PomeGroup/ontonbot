import React, { FC } from "react";
import CustomButton from "./Button/CustomButton";
import CustomCard from "./atoms/cards/CustomCard";
import DataStatus, { DataStatusProps } from "./molecules/alerts/DataStatus";
import Typography from "@/components/Typography";
import Image from "next/image";
import { Page } from "konsta/react";
import useWebApp from "@/hooks/useWebApp";
import { TG_BOT_LINK, TG_SUPPORT_GROUP } from "@/constants";
import { useRouter } from "next/navigation";

interface ErrorStateProps {
  errorCode: "blocked_bot" | "banned" | "event_not_found" | "something_went_wrong";
}

export const ErrorState: FC<ErrorStateProps> = ({ errorCode }) => {
  const webApp = useWebApp();
  const router = useRouter();

  // Configuration object mapping error codes to their properties and handlers
  const errorConfigs = {
    blocked_bot: {
      errorMessage: "NTON Bot is blocked!",
      desc: "Unblock the bot and continue using the mini app.",
      buttonTextPrimary: "Unblock Bot",
      buttonTextSecondary: "Maybe Later",
      dataStatus: "blocked" as DataStatusProps["status"],
      primaryHandler: () => webApp?.openTelegramLink(TG_BOT_LINK), // Call utility to unblock bot
      secondaryHandler: () => webApp?.close(), // clsoe the miniapp
    },
    banned: {
      errorMessage: "You have been banned from NTON",
      desc: "Your access to ONTON has been restricted due to a violation of our policies.",
      buttonTextPrimary: "Contact Support",
      buttonTextSecondary: "Close",
      dataStatus: "rejected" as DataStatusProps["status"],
      primaryHandler: () => webApp?.openTelegramLink(TG_SUPPORT_GROUP), // Open support channel
      secondaryHandler: () => webApp?.close(), // clsoe the miniapp
    },
    event_not_found: {
      errorMessage: "This event is no longer available.",
      desc: "Find more events to participate in.",
      buttonTextPrimary: "Explore more Events",
      buttonTextSecondary: "Report Issue",
      dataStatus: "not_found" as DataStatusProps["status"],
      primaryHandler: () => router.push("/"), // Go to home page
      secondaryHandler: () => webApp?.openTelegramLink(TG_SUPPORT_GROUP), // Open support channel
    },
    something_went_wrong: {
      errorMessage: "An unexpected error occurred.",
      desc: "Please try again or contact support.",
      buttonTextPrimary: "Retry",
      buttonTextSecondary: "Contact Support",
      dataStatus: "danger" as DataStatusProps["status"],
      primaryHandler: () => window.location.reload(), // Reload page as default retry
      secondaryHandler: () => webApp?.openTelegramLink(TG_SUPPORT_GROUP), // Open support channel
    },
  };

  // Select config based on errorCode, fallback to ''
  const config = errorConfigs[errorCode] || errorConfigs["something_went_wrong"];
  const { errorMessage, desc, buttonTextPrimary, buttonTextSecondary, dataStatus, primaryHandler, secondaryHandler } =
    config;

  return (
    <Page className="p-4 flex flex-col gap-9">
      <CustomCard
        className="flex-1 flex flex-col items-center justify-center text-center"
        defaultPadding
      >
        <Typography
          variant="title1"
          weight="bold"
        >
          {errorMessage.split(/(NTON)/).map((part, index) =>
            part === "NTON" ? (
              <React.Fragment key={index}>
                <Image
                  src="/onton_logo.svg"
                  alt="onton icon"
                  width={22}
                  height={22}
                  className="inline align-baseline"
                />
                {part}
              </React.Fragment>
            ) : (
              part
            )
          )}
        </Typography>
        <DataStatus
          status={dataStatus}
          size="lg"
        />
        <Typography
          weight="normal"
          variant="title3"
          className="text-balance"
        >
          {desc}
        </Typography>
      </CustomCard>
      <div className="flex flex-col gap-3">
        <CustomButton onClick={primaryHandler}>{buttonTextPrimary}</CustomButton>
        <CustomButton
          variant="outline"
          onClick={secondaryHandler}
        >
          {buttonTextSecondary}
        </CustomButton>
      </div>
    </Page>
  );
};
