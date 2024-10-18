"use client";

import useWebApp from "@/hooks/useWebApp";
import {   useState } from "react";
import { trpc } from "../_trpc/client";
import ModalDialog from "./SecretSavedModal";
import MainButton from "./atoms/buttons/web-app/MainButton";
import {boolean} from "drizzle-orm/pg-core";


// Child component
function ClaimRewardButtonChild(props: {
  link: string | null;
  isNotified: boolean;
}) {
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
          text={props.isNotified ? "Reward claimed!" : "Claim Reward"}
          onClick={openRewardLink}
          color={props.isNotified ? "secondary" : "primary"}
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

export function ClaimRewardButton(props: { eventId: string ,initData: string }) {

  console.log("initData", props.initData);
  const visitorReward = trpc.users.getVisitorReward.useQuery(
    {
      event_uuid: props.eventId,
      init_data: props.initData,
    },
    {
      enabled: !!boolean(props.initData)  , // Run the query only if initData is present and initialized
        queryKey: [
            "users.getVisitorReward",
            { event_uuid: props.eventId, init_data: props.initData },
        ],
      retry: false,
    }
  );
  // Conditional rendering of the button or child component
  if (props.initData) {
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
        color={"secondary"}
      />
    );
  }
}
