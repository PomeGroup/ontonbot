import { Server, Socket } from "socket.io";
import { SocketEvents, userSockets } from "../constants";
import { startNotificationWorker } from "../notificationWorker";
import { sanitizeString } from "@/lib/sanitizer";

import { handleDisconnection } from "./handleDisconnection";
import { handleTestEvent } from "./handleTestEvent";
import { handleUnknownEvent } from "./handleUnknownEvent";
// Track active user connections


export const handleNotifications = async (io: Server) => {
  // Start the RabbitMQ Notification Worker
  await startNotificationWorker(io);

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;

    // Handle unauthorized connections
    if (!user) {
      console.warn("Unauthorized connection attempt.");
      socket.disconnect();
      return;
    }

    // Log sanitized user information
    const sanitizedUsername = sanitizeString(user.username);
    console.log(`User ${sanitizedUsername} (ID: ${user.id}) connected.`);

    // Track user connections
    if (!userSockets.has(user.id)) {
      userSockets.set(user.id, new Set());
    }
    userSockets.get(user.id)?.add(socket.id);

    // Test event handler
    socket.on(SocketEvents.receive.test, (data, callback) => {
      handleTestEvent(data, callback, sanitizedUsername);
    });

    // Handle unknown events securely
    socket.onAny((event, ...args) => {
      handleUnknownEvent(socket, event, args);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      handleDisconnection(socket, sanitizedUsername, user.id);
    });
  });
};








