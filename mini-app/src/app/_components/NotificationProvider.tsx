"use client";

import React, { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import useNotificationStore from "@/zustand/useNotificationStore";
import { useSocketStore } from "@/zustand/useSocketStore";

type NotificationProviderProps = {
  children: React.ReactNode;
};

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const setSocket = useSocketStore((state) => state.setSocket);

  useEffect(() => {
    const isBrowser = typeof window !== "undefined";
    const telegram = isBrowser && (window as any).Telegram ? (window as any).Telegram : undefined;
    const telegramInitData = telegram && telegram.WebApp ? telegram.WebApp.initData || "" : "";

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) {
      console.error("Error: NEXT_PUBLIC_SOCKET_URL is not defined. Cannot establish socket connection.");
      return;
    }

    let socket: Socket;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleReconnect = (origin: "disconnect" | "connect_error") => {
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          console.log(`Attempting to reconnect after ${origin}...`);
          if (socket) socket.connect();
        }, 5000);
      }
    };

    try {
      socket = io(socketUrl, {
        transports: ["websocket"],
        auth: {
          initData: telegramInitData,
        },
      });
    } catch (initError) {
      console.error("Error initializing the socket connection:", initError);
      return;
    }

    // Store the socket instance in the Zustand store
    setSocket(socket);

    socket.on("connect", () => {
      console.log("Socket connected successfully.");
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    });

    socket.on("notification", (data: any) => {
      console.log("Received notification:", data);
      addNotification(data); // Adds only if not duplicate
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      scheduleReconnect("connect_error");
    });

    socket.on("error", (error) => {
      console.error("Socket encountered an error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.warn(`Socket disconnected: ${reason}`);
      scheduleReconnect("disconnect");
    });

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      socket.disconnect();
      setSocket(null); // Clear the socket instance
    };
  }, [addNotification, setSocket]);

  return <>{children}</>;
};

export default NotificationProvider;
