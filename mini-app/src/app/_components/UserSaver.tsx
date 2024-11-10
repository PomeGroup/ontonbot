"use client";

import { FC, ReactNode, useEffect } from "react";
import EventSkeleton from "./molecules/skeletons/EventSkeleton";
import { trpc } from "../_trpc/client";
import { useUserStore } from "@/context/store/user.store";


const UserSaver: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { setUser } = useUserStore()

  const syncUser = trpc.users.syncUser.useQuery()

  // Second effect: Handle user saving after WebApp is ready
  useEffect(() => {
    if (syncUser.isSuccess) {
      setUser(syncUser.data)
    }
  }, [syncUser.isSuccess, syncUser.data?.wallet_address]);

  // Show loading state until everything is ready

  return (
    <>
      {!syncUser.isSuccess ? (
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
