"use client";

import useWebApp from "@/hooks/useWebApp";
import { useState } from "react";
import MainButton from "../atoms/buttons/web-app/MainButton";
import ModalDialog from "../SecretSavedModal";
import { trpc } from "@/app/_trpc/client";
import { useConfig } from "@/context/ConfigContext";
import CustomSheet from "../Sheet/CustomSheet";
import Task from "../Task";
import { TG_SUPPORT_GROUP } from "@/constants";
import { sleep } from "@/utils";
import CustomButton from "../Button/CustomButton";

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

  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const webApp = useWebApp();
  const joinTaskStatus = trpc.users.joinOntonTasks.useQuery(undefined, {
    refetchOnWindowFocus: true,
  });

  const [isJoinedX, setJoinedX] = useState<"done" | "not_done" | "checking">(
    localStorage.getItem("n-j-x")
      ? "not_done"
      : joinTaskStatus.isSuccess
        ? joinTaskStatus.data?.all_done
          ? "done"
          : "not_done"
        : "done"
  );
  const allTasksDone = joinTaskStatus.data?.ch && joinTaskStatus.data.gp && isJoinedX;
  const config = useConfig();

  if (!config.tjo && !joinTaskStatus.isFetched && joinTaskStatus.isLoading) {
    return <MainButton progress />;
  }

  if (!config.tjo && (!joinTaskStatus.data?.all_done || isJoinedX !== "done" || isTasksOpen)) {
    const closeTasksOpen = () => {
      setIsTasksOpen(false);
    };

    return (
      <>
        {!isTasksOpen && (
          <MainButton
            text="Complete tasks to Attend"
            onClick={() => {
              setIsTasksOpen(true);
              localStorage.setItem("n-j-x", "88a0bd0a-39fb-4dd0-ad5e-cfb73a2ac54a");
            }}
          />
        )}

        <CustomSheet
          title="Pre-registration tasks"
          opened={isTasksOpen}
          onClose={closeTasksOpen}
        >
          <div className="space-y-4">
            <Task
              title="ONTON Community Chat"
              status={joinTaskStatus.isFetching ? "checking" : !!joinTaskStatus.data?.gp ? "done" : "not_done"}
              onClick={() => {
                webApp?.openTelegramLink(TG_SUPPORT_GROUP);
              }}
            />
            <Task
              title="ONTON Announcement Channel"
              status={joinTaskStatus.isFetching ? "checking" : !!joinTaskStatus.data?.ch ? "done" : "not_done"}
              onClick={() => {
                webApp?.openTelegramLink("https://t.me/ontonlive");
              }}
            />
            <Task
              title="Follow ONTON on X"
              status={
                joinTaskStatus.isFetching || isJoinedX === "checking"
                  ? "checking"
                  : isJoinedX === "done"
                    ? "done"
                    : "not_done"
              }
              onClick={async () => {
                setJoinedX("checking");
                webApp?.openLink("https://x.com/ontonbot");
                await sleep(30_000);
                setJoinedX("done");
                localStorage.removeItem("n-j-x");
              }}
            />
          </div>
          <div className="mt-6">
            <CustomButton
              variant={allTasksDone ? undefined : "outline"}
              onClick={closeTasksOpen}
            >
              Close
            </CustomButton>
          </div>
        </CustomSheet>
      </>
    );
  }

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
