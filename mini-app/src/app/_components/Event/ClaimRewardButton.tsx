"use client";

import useWebApp from "@/hooks/useWebApp";
import { useState } from "react";
import MainButton from "../atoms/buttons/web-app/MainButton";
import ModalDialog from "../SecretSavedModal";
import { trpc } from "@/app/_trpc/client";

// Child component
function ClaimRewardButtonChild(props: { link: string | null; isNotified: boolean }) {
  const webApp = useWebApp();
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  function openRewardLink() {
    if (props.link) {
      webApp?.openTelegramLink(props.link);
    } else {
      setIsRewardModalOpen(true);
    }
  }

  return (
    <>
      {!isRewardModalOpen && (
        <MainButton
          text={"Claim Reward"}
          onClick={openRewardLink}
          color={"primary"}
        />
      )}

      <ModalDialog
        isVisible={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        description="We successfully collected your data, you'll receive your reward link through a bot message."
        closeButtonText="Back to ONTON"
        icon="/checkmark.svg"
      />
    </>
  );
}

export function ClaimRewardButton(props: { eventId: string; initData: string }) {
  const visitorReward = trpc.users.getVisitorReward.useQuery(
    {
      event_uuid: props.eventId,
    },
    {
      queryKey: ["users.getVisitorReward", { event_uuid: props.eventId }],
      retry: false,
    }
  );

  // Conditional rendering of the button or child component
  if (props.initData) {
    return visitorReward.isLoading ? (
      <MainButton
        text="Loading..."
        color="primary"
        disabled
        progress
      />
    ) : visitorReward.isSuccess ? (
      <ClaimRewardButtonChild
        isNotified={
          visitorReward.data.type === "reward_link_generated" &&
          (visitorReward.data.status === "notified" || visitorReward.data.status === "notified_by_ui")
        }
        link={visitorReward.data.data}
      />
    ) : (
      <MainButton
        text={visitorReward.error.message || "Something With Reward Went Wrong"}
        color="secondary"
      />
    );
  }
}
