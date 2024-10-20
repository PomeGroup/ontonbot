"use client";

import useWebApp from "@/hooks/useWebApp";
import { FC, ReactNode, useEffect, useState } from "react";
import { trpc } from "../_trpc/client";
import EventSkeleton from "./molecules/skeletons/EventSkeleton";


const UserSaver: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const WebApp = useWebApp();
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  const userSaver = trpc.users.addUser.useMutation();
  const [isChecked, setIsChecked] = useState(false);

  // First effect: Check if WebApp is ready
  useEffect(() => {
    if (WebApp && WebApp.initDataUnsafe?.user?.id) {
      setIsWebAppReady(true);
    }
  }, [WebApp]);

  // Second effect: Handle user saving after WebApp is ready
  useEffect(() => {
    const checkAndSaveUser = async () => {
      if (!isWebAppReady || !WebApp || !WebApp.initDataUnsafe?.user?.id) {
        return;
      }

      const userId = WebApp.initDataUnsafe.user.id;
      const initData = WebApp.initData;

      try {
        const savedUser = localStorage.getItem(`user_${userId}`);

        if (savedUser) {
          setIsChecked(true);
          return;
        }

        userSaver.mutate(
          { initData },
          {
            onSuccess: () => {
              localStorage.setItem(`user_${userId}`, "true");
              setIsChecked(true);
            },
            onError: (error) => {
              console.error("Mutation error:", error);
              setIsChecked(true);
            },
          }
        );
      } catch (error) {
        console.error("Error in checkAndSaveUser:", error);
        setIsChecked(true);
      }
    };

    if (
      isWebAppReady &&
      !isChecked &&
      !userSaver.isLoading &&
      !userSaver.isSuccess
    ) {
      checkAndSaveUser();
    }
  }, [
    isWebAppReady,
    isChecked,
    WebApp,
    userSaver.isLoading,
    userSaver.isSuccess,
  ]);

  // Show loading state until everything is ready
  const isLoading = !isWebAppReady || !isChecked || userSaver.isLoading;

  return (
    <>
      {isLoading ? (
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
