// Handle disconnection
import { userSockets } from "@/sockets/constants";
import { Socket } from "socket.io";
import { logger } from "@/server/utils/logger";

export const handleDisconnection = (socket: Socket, sanitizedUsername: string, userId: number) => {
  logger.log(`User ${sanitizedUsername} (ID: ${userId}) disconnected.`);
  userSockets.get(userId)?.delete(socket.id);

  if (userSockets.get(userId)?.size === 0) {
    userSockets.delete(userId);
  }
};
