"use client";

import React, { useEffect, useState } from "react";
import useNotificationStore from "@/zustand/useNotificationStore";
import { Input } from "@/components/ui/input";
import { useSocketStore } from "@/zustand/useSocketStore";
import { Dialog, DialogButton } from "konsta/react";
import useWebApp from "@/hooks/useWebApp";
import { NotificationItemType, NotificationStatus, NotificationType } from "@/db/enum";

type Notification = {
  notificationId: string;
  userId: number;
  type: NotificationType;
  title: string;
  desc: string;
  actionTimeout: number;
  additionalData: {
    participant_id?: number;
    event_id?: number;
    poa_id?: string;
    notification_id?: number;
  };
  priority: number;
  itemId: string;
  item_type: NotificationItemType;
  status: NotificationStatus;
  createdAt: string;
  expiresAt: string;
  id: string;
};

const NotificationHandler: React.FC = () => {
  const WebApp = useWebApp();
  const hapticFeedback = WebApp?.HapticFeedback;
  const notifications = useNotificationStore((state) => state.notifications);
  const socket = useSocketStore((state) => state.socket);

  const [handledNotificationIds, setHandledNotificationIds] = useState<Set<string>>(new Set());
  const [notificationToShow, setNotificationToShow] = useState<Notification | undefined>(undefined);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [hasExceededAttempts, setHasExceededAttempts] = useState(false);

  // Listen for notifications
  useEffect(() => {
    const newNotification = notifications.find(
      (n) =>
        (n.type === "POA_PASSWORD" || n.type === "POA_SIMPLE") &&
        !handledNotificationIds.has(n.notificationId),
    );

    if (newNotification) {
      setNotificationToShow(newNotification);
      const timeoutValue = Number(newNotification.actionTimeout) || 0;
      setTimeLeft(timeoutValue);
      hapticFeedback?.impactOccurred("heavy");
      setHandledNotificationIds((prev) => new Set(prev).add(newNotification.notificationId));
    }
  }, [notifications, handledNotificationIds, hapticFeedback]);

  // Handle countdown
  useEffect(() => {
    if (!notificationToShow || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [notificationToShow, timeLeft]);

  // Auto close when time hits 0
  useEffect(() => {
    if (notificationToShow && timeLeft === 0) {
      handleClose();
    }
  }, [timeLeft, notificationToShow]);

  // Listen for "notification_close" event from the backend
  useEffect(() => {
    if (!socket) return;

    const handleNotificationClose = (data: { notificationId: number }) => {
      if (notificationToShow && Number(notificationToShow.notificationId) === data.notificationId) {
        // If the currently displayed notification matches the closed one, close it
        handleClose();
      }
    };

    socket.on("notification_close", handleNotificationClose);

    return () => {
      socket.off("notification_close", handleNotificationClose);
    };
  }, [socket, notificationToShow]);

  const handleConfirmPassword = () => {
    if (!socket || !notificationToShow) return;
    setPasswordError("");

    socket.emit(
      "notification_reply",
      {
        notificationId: notificationToShow.notificationId,
        answer: password,
        type: "POA_PASSWORD",
      },
      (response: { status: string; message: string }) => {
        if (response.status === "password_error" || response.status === "error") {
          setPasswordError(response.message);
        } else if (response.status === "password_attempts_error") {
          setPasswordError(response.message);
          setHasExceededAttempts(true);
        } else {
          // If success or any other positive status, the backend will also emit "notification_close"
          // which will trigger handleClose via the socket event listener
          handleClose();
        }
      },
    );
  };

  const handleYes = () => {
    if (!socket || !notificationToShow) return;
    socket.emit(
      "notification_reply",
      {
        notificationId: notificationToShow.notificationId,
        answer: "yes",
        type: "POA_SIMPLE",
      },
      () => {
        handleClose();
      },
    );
  };

  const handleNo = () => {
    if (!socket || !notificationToShow) return;
    socket.emit(
      "notification_reply",
      {
        notificationId: notificationToShow.notificationId,
        answer: "no",
        type: "POA_SIMPLE",
      },
      () => {
        handleClose();
      },
    );
  };

  const handleClose = () => {
    setNotificationToShow(undefined);
    setTimeLeft(0);
    setPassword("");
    setPasswordError("");
    setHasExceededAttempts(false);
  };

  const opened = !!notificationToShow;
  const isPoaPassword = notificationToShow?.type === "POA_PASSWORD";

  const dialogTitle = notificationToShow?.title || "NOTIFICATION";
  const formattedTime = timeLeft > 0 ? `(${new Date(timeLeft * 1000).toISOString().slice(14, 19)})` : "(00:00)";

  return (
    <Dialog
      opened={opened}
      title=""
      className="myDialog max-w-[400px] w-11/12 p-0 mx-auto bg-white bg-opacity-100"
      colors={{ bgIos: "bg-white", bgMaterial: "bg-white" }}
      translucent={false}
      content={
        notificationToShow ? (
          <div className="flex flex-col p-0 text-center space-y-3 relative ">
            <h2 className="text-sm font-semibold">{dialogTitle}</h2>
            {isPoaPassword && (
              <div>
                <p className="text-sm font-medium">
                  Enter the event password in <span className="font-semibold">{formattedTime}</span>
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Enter the SBT claim code shared by the organizer.
                </p>
              </div>
            )}
            {isPoaPassword && (
              <div className="w-full mt-3">
                <Input
                  type="password"
                  placeholder="SBT password"
                  className="rounded-md border-0 w-full"
                  value={password}
                  disabled={hasExceededAttempts}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                />
              </div>
            )}
            {passwordError && <p className="text-red-500 text-sm mt-1 text-left">{passwordError}</p>}
          </div>
        ) : (
          <div className="p-4">
            <p>Your response has been saved.</p>
          </div>
        )
      }
      buttons={
        notificationToShow ? (
          notificationToShow.type === "POA_SIMPLE" ? (
            <div className="flex justify-end space-x-0 px-0 pb-0 bg-white">
              <DialogButton onClick={handleNo} className="w-1/2">
                No
              </DialogButton>
              <DialogButton strong onClick={handleYes} className="w-1/2">
                Yes
              </DialogButton>
            </div>
          ) : (
            // POA_PASSWORD
            <div className="p-0 bg-white w-full flex justify-center">
              <DialogButton
                strong
                className="bg-blue-500 text-white w-full"
                onClick={hasExceededAttempts ? handleClose : handleConfirmPassword}
                disabled={!hasExceededAttempts && !password}
              >
                {hasExceededAttempts ? "Close" : "Confirm"}
              </DialogButton>
            </div>
          )
        ) : null
      }
    />
  );
};

export default NotificationHandler;
