"use client";

import React, { useEffect, useState } from "react";
import useNotificationStore from "@/zustand/useNotificationStore";
import { useSocketStore } from "@/zustand/useSocketStore";
import { Dialog, DialogButton } from "konsta/react";

type Notification = {
  notificationId: string;
  userId: number;
  type: string;
  title: string;
  desc: string;
  actionTimeout: number | string;
  additionalData: {
    eventId: number;
    poaId: string;
  };
  priority: number;
  itemId: string;
  item_type: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  id: string;
};

const NotificationHandler: React.FC = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const socket = useSocketStore((state) => state.socket);

  const [handledNotificationIds, setHandledNotificationIds] = useState<Set<string>>(new Set());
  const [notificationToShow, setNotificationToShow] = useState<Notification | undefined>(undefined);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // On notifications update, look for a new POA_SIMPLE notification not handled before
  useEffect(() => {
    console.log("Checking for new POA_SIMPLE notifications...");

    // Find a POA_SIMPLE notification not in handledNotificationIds
    const newNotification = notifications.find(
      (n) =>
        n.type === "POA_SIMPLE" && !handledNotificationIds.has(n.notificationId)
    );

    // If we found a new POA_SIMPLE notification
    if (newNotification) {
      console.log("New POA_SIMPLE notification found:", newNotification.notificationId);
      setNotificationToShow(newNotification);
      setTimeLeft(Number(newNotification.actionTimeout));
      // Mark this notification as handled so it won't be shown again
      setHandledNotificationIds((prev) => new Set(prev).add(newNotification.notificationId));
    } else {
      // If no new POA_SIMPLE notification found and currently showing one, do nothing.
      // If currently not showing any notification, everything stays idle.
      console.log("No new POA_SIMPLE notification found.");
    }
  }, [notifications, handledNotificationIds]);

  useEffect(() => {
    console.log("timeLeft changed:", timeLeft, "notificationToShow:", notificationToShow);

    if (!notificationToShow || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [notificationToShow, timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0 && notificationToShow) {
      // Time expired: treat as if user said "No"
      handleNo();
    }
  }, [timeLeft, notificationToShow]);

  const handleYes = () => {
    if (!socket || !notificationToShow) return;
    socket.emit("poa_simple_answer", {
      notificationId: notificationToShow.notificationId,
      answer: "yes",
    });
    handleClose();
  };

  const handleNo = () => {
    // User declined or time expired, just close the dialog
    handleClose();
  };

  const handleClose = () => {
    setNotificationToShow(undefined);
    setTimeLeft(0);
    // Do NOT remove from handledNotificationIds, to avoid re-showing
  };

  const opened = !!notificationToShow;

  return (
    <Dialog
      opened={opened}
      onBackdropClick={handleNo}
      title={ `Confirmation in ${timeLeft} seconds`}
      content={
        notificationToShow ? (
          <>
            <p>{notificationToShow?.title || ""}</p>
            <p>{notificationToShow.desc || ""}</p>

          </>
        ) : (
          <p>No new POA_SIMPLE notifications at the moment.</p>
        )
      }
      buttons={
        notificationToShow ? (
          <>
            <DialogButton onClick={handleNo}>No</DialogButton>
            <DialogButton strong onClick={handleYes}>Yes</DialogButton>
          </>
        ) : null
      }
    />
  );
};

export default NotificationHandler;
