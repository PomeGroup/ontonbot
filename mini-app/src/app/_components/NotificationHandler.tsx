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
  id: string; // appears to be the same as notificationId, but included for completeness
};

const NotificationHandler: React.FC = () => {
  const WebApp = useWebApp();
  const hapticFeedback = WebApp?.HapticFeedback;
  const notifications = useNotificationStore((state) => state.notifications);
  const socket = useSocketStore((state) => state.socket);

  const [handledNotificationIds, setHandledNotificationIds] = useState<Set<string>>(new Set());
  const [notificationToShow, setNotificationToShow] = useState<Notification | undefined>(undefined);

  const [timeLeft, setTimeLeft] = useState<number>(0);

  // For POA_PASSWORD
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [hasExceededAttempts, setHasExceededAttempts] = useState(false);

  // Listen for notifications
  useEffect(() => {
    console.log("Checking for new notifications...");

    const newNotification = notifications.find(
      (n) =>
        (n.type === "POA_PASSWORD" || n.type === "POA_SIMPLE") &&
        !handledNotificationIds.has(n.notificationId)
    );

    if (newNotification) {
      console.log("New notification found:", newNotification.notificationId);
      setNotificationToShow(newNotification);

      const timeoutValue = Number(newNotification.actionTimeout) || 0;
      setTimeLeft(timeoutValue);

      hapticFeedback?.impactOccurred("heavy");
      setHandledNotificationIds((prev) => new Set(prev).add(newNotification.notificationId));
    } else {
      console.log("No new applicable notification found.");
    }
  }, [notifications, handledNotificationIds, hapticFeedback]);

  // Countdown effect
  useEffect(() => {
    if (!notificationToShow || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [notificationToShow, timeLeft]);

  // Auto-close when timer hits 0
  useEffect(() => {
    if (notificationToShow && timeLeft === 0) {
      handleClose();
    }
  }, [timeLeft, notificationToShow]);

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
        console.log("Server responded to password confirmation:", response);

        if (response.status === "password_error" || response.status === "error") {
          setPasswordError(response.message);
        } else if (response.status === "password_attempts_error") {
          setPasswordError(response.message);
          setHasExceededAttempts(true);
        } else {
          handleClose();
        }
      }
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
      (response: { status: string; message: string }) => {
        console.log("Server responded to 'yes' reply:", response);
      }
    );
    handleClose();
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
      (response: { status: string; message: string }) => {
        console.log("Server responded to 'no' reply:", response);
      }
    );
    handleClose();
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
  // Format timeLeft to mm:ss
  const formattedTime = timeLeft > 0 ? `(${new Date(timeLeft * 1000).toISOString().slice(14, 19)})` : "(00:00)";

  return (
    <Dialog
      opened={opened}
      title=""
      className="myDialog max-w-[400px] w-11/12  p-0 mx-auto bg-white bg-opacity-100"
      colors={{ bgIos: "bg-white" , bgMaterial: "bg-white" ,}}

      translucent={false}
      content={
        notificationToShow ? (
          <div className="flex flex-col  p-0 text-center space-y-3 relative ">
            {/* Dialog Title */}
            <h2 className="text-sm font-semibold">{dialogTitle}</h2>

            {isPoaPassword && (
              <div>
                <p className="text-sm font-medium">
                  Enter the event password in <span className="font-semibold">{formattedTime}</span>
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Enter the SBT claim code that the organizer shared  with you on the event page.
                </p>
              </div>
            )}

            {/* If attempts exceeded, hide input */}
            {isPoaPassword  && (
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
            {/* Show error if any */}
            {passwordError && (
              <p className="text-red-500 text-sm mt-1 text-left">{passwordError}</p>
            )}
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
                className="bg-blue-500 text-white w-full "
                onClick={hasExceededAttempts ? handleClose : handleConfirmPassword}
                disabled={!hasExceededAttempts && !password}
              >
                {hasExceededAttempts   ? "Close" : "Confirm"}
              </DialogButton>
            </div>
          )
        ) : null
      }
    />
  );
};

export default NotificationHandler;
