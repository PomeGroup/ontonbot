import React, { FC, ReactNode, useState } from "react";
import Task from "../Task";
import CustomButton from "../Button/CustomButton";
import { trpc } from "@/app/_trpc/client";
import { TG_SUPPORT_GROUP } from "@/constants";
import useWebApp from "@/hooks/useWebApp";
import { sleep } from "@/utils";
import CustomSheet from "../Sheet/CustomSheet";
import MainButton from "../atoms/buttons/web-app/MainButton";
import { useConfig } from "@/context/ConfigContext";
import { useEventData } from "./eventPageContext";

const PreRegistrationTasks: FC<{ children: ReactNode }> = (props) => {
  const webApp = useWebApp();
  const config = useConfig();
  const eventData = useEventData();

  const [isTasksOpen, setIsTasksOpen] = useState(false);
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

  const allTasksDone = joinTaskStatus.data?.ch && joinTaskStatus.data?.gp && isJoinedX === "done";

  // if it was not ts verified and lock was not set we will show it
  const areTasksRequired = !eventData.organizer?.is_ts_verified && !config.tjo;
  console.log("areTasksRequired: ", areTasksRequired);

  const closeTasksOpen = () => {
    setIsTasksOpen(false);
  };

  if (areTasksRequired && !joinTaskStatus.isFetched && joinTaskStatus.isLoading) {
    return <MainButton progress />;
  }

  if (areTasksRequired && (!joinTaskStatus.data?.all_done || isJoinedX !== "done" || isTasksOpen)) {
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
                await sleep(30000);
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

  return <>{props.children}</>;
};

export default PreRegistrationTasks;
