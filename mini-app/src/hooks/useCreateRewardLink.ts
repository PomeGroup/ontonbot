import { trpc } from "@/app/_trpc/client";
import useWebApp from "./useWebApp";
import { useEffect } from "react";
import { TRPCClientError } from "@trpc/client";

export function useCreateRewardLink(props: { eventHash: string; tasksCompleted: boolean }) {
  const WebApp = useWebApp();
  const initData = WebApp?.initData;

  const trpcUtils = trpc.useUtils();
  const createRewardLink = trpc.users.createUserReward.useMutation({
    onSuccess: () => {
      trpcUtils.users.getVisitorReward.invalidate();
    },
    onError(error) {
      if (error instanceof TRPCClientError) {
        console.log(error.message);
      }
    },
  });

  useEffect(() => {
    if (!initData) return;
    createRewardLink.mutate({
      event_uuid: props.eventHash,
    });
  }, [initData, props.tasksCompleted]);
}
