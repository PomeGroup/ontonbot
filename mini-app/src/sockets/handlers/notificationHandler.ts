import { Server, Socket } from "socket.io";
import { SocketEvents, userSockets } from "../constants";
import { startNotificationWorker } from "../notificationWorker";
import { sanitizeString } from "@/lib/sanitizer";

import { handleDisconnection } from "./handleDisconnection";
import { handleTestEvent } from "./handleTestEvent";
import { handleUnknownEvent } from "./handleUnknownEvent";
import { handleNotificationReply } from "./notificationReply";
import { logger } from "@/server/utils/logger";
// Track active user connections


export const handleNotifications = async (io: Server) => {
  // Start the RabbitMQ Notification Worker
  await startNotificationWorker(io);


  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;
    logger.log(`Socket Handler - user.id: ${user.id}, type: ${typeof user.id}`);
    // Handle unauthorized connections
    if (!user) {
      logger.warn("Unauthorized connection attempt.");
      socket.disconnect();
      return;
    }

    // Log sanitized user information
    const sanitizedUsername = sanitizeString(user.username);
    logger.log(`User ${sanitizedUsername} (ID: ${user.id}) connected.`);

    // // Track user connections
    // if (!userSockets.has(user.id)) {
    //   userSockets.set(user.id, new Set());
    // }
    // const userSocketSet = userSockets.get(user.id);
    // userSockets.get(user.id)?.add(socket.id);
    // logger.log(`Updated userSockets for User ${user.id}:`, userSocketSet);
    // Join the user to a room based on user ID
    socket.join(`user_${user.id}`);
    logger.log(`User ${user.id} joined room user_${user.id}`);
    // Handle notification reply event
    // Expecting client to emit: socket.emit("notificationReply", { notificationId: "123", answer: "yes" }, (response) => { ... });
    socket.on(SocketEvents.receive.notificationReply, (data, callback) => {
      // Use the handler to validate and process the reply
      handleNotificationReply(io, data, callback, sanitizedUsername , user.id);
    });
    // Test event handler
    socket.on(SocketEvents.receive.test, (data, callback) => {
      handleTestEvent(data, callback, sanitizedUsername);
    });

    // Handle unknown events securely
    socket.onAny((event, ...args) => {
      handleUnknownEvent(socket, event, args);
    });
    socket.on(SocketEvents.send.error, (error) => {
      logger.error(`Error on socket ${socket.id}:`, error.message);
      socket.emit("error", "An unexpected error occurred.");
    });
    // Handle disconnection
    socket.on("disconnect", () => {
      handleDisconnection(socket, sanitizedUsername, user.id);
    });
  });
};








