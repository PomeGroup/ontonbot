"use client";

import useWebApp from "@/hooks/useWebApp";
import { FC, ReactNode, useEffect } from "react";
import { trpc } from "../_trpc/client";
import EventSkeleton from "./molecules/skeletons/EventSkeleton";

const UserSaver: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const WebApp = useWebApp();
  const initData = WebApp?.initData || "";
  const userSaver = trpc.users.addUser.useMutation();

  useEffect(() => {
    if (!initData || !userSaver.isIdle) return;

    userSaver.mutate({ initData });
  }, [initData]);

  return (
    <>
      {userSaver.isIdle || userSaver.isLoading ? (
        <div className="h-screen px-4">
          <EventSkeleton />
        </div>
      ) : (
        children
      )}
    </>
  );
};

export default UserSaver;
