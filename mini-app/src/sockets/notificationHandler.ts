import { Server, Socket } from "socket.io";
import { SocketEvents } from "./configs";
import { z } from "zod";
import { testEventSchema } from "@/zodSchema/SocketZodSchemas";

// Track active user connections
const userSockets: Map<number, Set<string>> = new Map();



export const handleNotifications = (io: Server) => {
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

// Handle specific "test-event"
const handleTestEvent = (data: any, callback: Function, sanitizedUsername: string) => {
  try {
    // Validate and sanitize input using Zod
    const validatedData = testEventSchema.parse(data);

    console.log(`Received test-event from ${sanitizedUsername}: ${validatedData.message}`);

    // Send success response
    if (callback) {
      callback({ status: "success", message: "Test event processed successfully" });
    }
  } catch (error) {
    console.error("Error processing test-event:", error);

    // Handle validation errors
    if (callback) {
      callback({
        status: "error",
        message: error instanceof z.ZodError ? error.errors[0].message : "Invalid input",
      });
    }
  }
};

// Handle unknown events
const handleUnknownEvent = (socket: Socket, event: string, args: any[]) => {
  // Ignore events defined in SocketEvents.receive
  if (event in SocketEvents.receive) return;

  const sanitizedEvent = sanitizeString(event);
  const sanitizedArgs = args.map((arg) => sanitizeObject(arg));

  console.warn(`Unknown event: ${sanitizedEvent} received with args:`, sanitizedArgs);

  // Notify client about unsupported events
  socket.emit(SocketEvents.send.notFound, {
    status: "404",
    message: `Unsupported event: ${sanitizedEvent}`,
  });
};

// Handle disconnection
const handleDisconnection = (socket: Socket, sanitizedUsername: string, userId: number) => {
  console.log(`User ${sanitizedUsername} (ID: ${userId}) disconnected.`);
  userSockets.get(userId)?.delete(socket.id);

  if (userSockets.get(userId)?.size === 0) {
    userSockets.delete(userId);
  }
};

// Emit a notification securely
export const emitNotification = (io: Server, userId: number, message: any) => {
  const sockets = userSockets.get(userId);
  if (!sockets || sockets.size === 0) {
    console.warn(`No active connections for user ${userId}.`);
    return;
  }

  // Ensure the message structure is valid and sanitized
  const sanitizedMessage = {
    ...message,
    id: `${userId}-${Date.now()}`, // Unique notification ID
    message: sanitizeString(message.message),
  };

  sockets.forEach((socketId) => {
    io.to(socketId).emit(SocketEvents.send.notification, sanitizedMessage);
    console.log(`Notification sent to User ${userId} via Socket ${socketId}:`, sanitizedMessage);
  });
};

// Utility to sanitize strings
const sanitizeString = (input: any) => {
  if (typeof input === "string") {
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  return input;
};

// Utility to sanitize objects recursively
const sanitizeObject = (obj: any): any => {
  if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, sanitizeString(value)])
    );
  }
  return sanitizeString(obj);
};
