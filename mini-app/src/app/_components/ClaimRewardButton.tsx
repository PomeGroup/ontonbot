"use client";

import useWebApp from "@/hooks/useWebApp";
import { useMemo, useState } from "react";
import { trpc } from "../_trpc/client";
import MainButton from "./atoms/buttons/web-app/MainButton";
import ModalDialog from "./SecretSavedModal";

// Child component
function ClaimRewardButtonChild(props: {
  link: string | null;
  isNotified: boolean;
}) {
  const webApp = useWebApp();
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  function openRewardLink() {
    if (props.link) {
      webApp?.openLink(props.link);
    } else {
      setIsRewardModalOpen(true);
    }
  }

  return (
    <>
      {!isRewardModalOpen && (
        <MainButton
          text={props.isNotified ? "Reward claimed!" : "Claim Reward"}
          onClick={openRewardLink}
          color={props.isNotified ? "#747480" : "#2ea6ff"}
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

// Parent component
export function ClaimRewardButton(props: { eventId: string }) {
  const WebApp = useWebApp();
  const initData = useMemo(() => WebApp?.initData || "", [WebApp?.initData]);

  const visitorReward = trpc.users.getVisitorReward.useQuery(
    { init_data: initData, event_uuid: props.eventId },
    {
      enabled: Boolean(initData) && Boolean(props.eventId),
      retry: false,
      queryKey: [
        "users.getVisitorReward",
        {
          init_data: initData,
          event_uuid: props.eventId,
        },
      ],
    }
  );

  return visitorReward.isSuccess ? (
    <ClaimRewardButtonChild
      isNotified={
        visitorReward.data.type === "reward_link_generated" &&
        visitorReward.data.status === "notified"
      }
      link={visitorReward.data.data}
    />
  ) : (
    <MainButton
      text="Claim Reward"
      color={"#747480"}
    />
  );
}
