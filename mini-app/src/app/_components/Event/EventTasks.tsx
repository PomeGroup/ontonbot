import useAuth from "@/hooks/useAuth";
import AllTasks from "@/app/_components/Tasks";
import Tasks from "@/app/_components/molecules/tasks";
import { useState } from "react";
import { useEventData } from "./eventPageContext";
import { ClaimRewardButton } from "./ClaimRewardButton";

export const EventTasks = ({ eventHash }: { eventHash: string }) => {
  const { eventData, isStarted, isNotEnded, initData } = useEventData();
  const [isWalletConnected, setIsWalletConnected] = useState<
    boolean | undefined
  >(undefined);
  const { role, user } = useAuth();

  if (
    isStarted &&
    isNotEnded &&
    eventData.data?.dynamic_fields &&
    initData &&
    role !== "admin" &&
    user?.user_id !== eventData.data.owner
  ) {
    return (
      <>
        <Tasks.Wallet
          initData={initData as string}
          isWalletConnected={isWalletConnected}
          setIsWalletConnected={setIsWalletConnected}
        />
        <AllTasks
          // @ts-expect-error
          tasks={eventData.data.dynamic_fields}
          eventHash={eventHash}
        />
        {isWalletConnected && (
          <ClaimRewardButton
            initData={initData as string}
            eventId={eventData.data?.event_uuid as string}
            isWalletConnected={isWalletConnected}
          />
        )}
      </>
    );
  }

  return (
    <div>
      {isNotEnded
        ? "Event is not started yet"
        : "Event is ended already"}{" "}
    </div>
  );
};
