"use client";

import { FC, ReactNode, useEffect } from "react";
import EventSkeleton from "./molecules/skeletons/EventSkeleton";
import { trpc } from "../_trpc/client";
import { useUserStore } from "@/context/store/user.store";
import useWebApp from "@/hooks/useWebApp";
import { Card, Page } from "konsta/react";

const UserSaver: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { setUser } = useUserStore();
  const webApp = useWebApp();

  const syncUser = trpc.users.syncUser.useQuery();

  // Second effect: Handle user saving after WebApp is ready
  useEffect(() => {
    if (syncUser.isSuccess) {
      setUser(syncUser.data);
      webApp?.ready();
    }
  }, [syncUser.isSuccess, syncUser.data?.wallet_address, syncUser.data, setUser, webApp]);

  // Show loading state until everything is ready
  if (syncUser.isLoading) {
    return (
      <div className="h-screen px-4">
        <EventSkeleton />
      </div>
    );
  }

  if (syncUser.isError) {
    return (
      <Page>
        <Card>
          This is a simple card with plain text, but cards can also contain their own header, footer, list view, image, or
          any other element.
        </Card>
      </Page>
    );
  }

  if (syncUser.data.has_blocked_the_bot) {
    return (
      <Page>
        <Card>
          This is a simple card with plain text, but cards can also contain their own header, footer, list view, image, or
          any other element.
        </Card>
      </Page>
    );
  }

  return <>{children}</>;
};

export default UserSaver;
