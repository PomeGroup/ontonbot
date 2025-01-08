// Handle unknown events
import { Socket } from "socket.io";
import { SocketEvents } from "@/sockets/constants";
import { sanitizeObject, sanitizeString } from "@/lib/sanitizer";
import { logger } from "@/server/utils/logger";

export const handleUnknownEvent = (socket: Socket, event: string, args: any[]) => {
  // Ignore events defined in SocketEvents.receive
  logger.log("Received event:", event);
  if (Object.values(SocketEvents.receive).includes(event)) return;

  const sanitizedEvent = sanitizeString(event);
  const sanitizedArgs = args.map((arg) => sanitizeObject(arg));
  logger.warn(`Unknown event: ${sanitizedEvent} received with args:`, sanitizedArgs);

  // Notify client about unsupported events
  socket.emit(SocketEvents.send.notFound, {
    status: "404",
    message: `Unsupported event: ${sanitizedEvent}`,
  });
};
