"use client";

import React, { useEffect, useState } from "react";
import useNotificationStore from "@/zustand/useNotificationStore";
import { Input } from "@/components/ui/input";
import { useSocketStore } from "@/zustand/useSocketStore";
import { Dialog, DialogButton } from "konsta/react";
import useWebApp from "@/hooks/useWebApp";

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
  /** NEW: Track if user has exceeded attempts */
  const [hasExceededAttempts, setHasExceededAttempts] = useState(false);

  // Listen for notifications
  useEffect(() => {
    console.log("Checking for new notifications...");

    // Check for POA_PASSWORD or POA_SIMPLE
    const newNotification = notifications.find(
      (n) =>
        (n.type === "POA_PASSWORD" || n.type === "POA_SIMPLE") &&
        !handledNotificationIds.has(n.notificationId)
    );

    if (newNotification) {
      console.log("New notification found:", newNotification.notificationId);
      setNotificationToShow(newNotification);

      // For both POA_SIMPLE and POA_PASSWORD, set the countdown (actionTimeout)
      const timeoutValue = Number(newNotification.actionTimeout) || 0;
      setTimeLeft(timeoutValue);

      // Trigger haptic feedback
      hapticFeedback?.impactOccurred("heavy");

      // Mark this notification as handled
      setHandledNotificationIds((prev) => new Set(prev).add(newNotification.notificationId));
    } else {
      console.log("No new applicable notification found.");
    }
  }, [notifications, handledNotificationIds, hapticFeedback]);

  // Countdown effect for both POA_SIMPLE and POA_PASSWORD
  useEffect(() => {
    if (!notificationToShow || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [notificationToShow, timeLeft]);

  // When time runs out, close the dialog automatically
  useEffect(() => {
    if (notificationToShow && timeLeft === 0) {
      handleClose();
    }
  }, [timeLeft, notificationToShow]);

  const handleConfirmPassword = () => {
    if (!socket || !notificationToShow) return;

    // Reset any previous error before sending
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
          // EXCEEDED ATTEMPTS → hide input & disable resubmit
          setPasswordError(response.message);
          setHasExceededAttempts(true);
        } else {
          // If success or any other status, close the dialog
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

  // Show countdown for both types
  const title = notificationToShow
    ? `${notificationToShow.title || ""} (${timeLeft}s left)`
    : "Notification";

  return (
    <Dialog
      opened={opened}
      title={title}
      content={
        notificationToShow ? (
          <>
            <p className={"text-left"} >{notificationToShow.desc || ""}</p>
            {isPoaPassword && (
              <div style={{ marginTop: "1rem" }}>
                {/* Hide input if attempts exceeded */}
                {!hasExceededAttempts && (
                  <Input
                    type="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                  />
                )}
                {passwordError && (
                  <p style={{ color: "red", marginTop: "0.5rem" ,textAlign: "left" }}>
                    {passwordError}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <p>Your response has been saved.</p>
        )
      }
      buttons={
        notificationToShow ? (
          notificationToShow.type === "POA_SIMPLE" ? (
            <>
              <DialogButton onClick={handleNo}>No</DialogButton>
              <DialogButton strong onClick={handleYes}>
                Yes
              </DialogButton>
            </>
          ) : (
            // POA_PASSWORD
            <>
              {/* If attempts exceeded, clicking Confirm only closes the dialog */}
              <DialogButton
                strong
                onClick={hasExceededAttempts ? handleClose : handleConfirmPassword}
                disabled={!hasExceededAttempts && !password}
              >
                Confirm
              </DialogButton>
            </>
          )
        ) : null
      }
    />
  );
};

export default NotificationHandler;
