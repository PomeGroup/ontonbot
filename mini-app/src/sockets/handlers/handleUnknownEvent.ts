// Handle unknown events
import { Socket } from "socket.io";
import { SocketEvents } from "@/sockets/constants";
import { sanitizeObject, sanitizeString } from "@/lib/sanitizer";

export const handleUnknownEvent = (socket: Socket, event: string, args: any[]) => {
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
