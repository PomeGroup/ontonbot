// rateLimiter.ts
import { Server, Socket } from "socket.io";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "./constants";


const userRateLimits = new Map<string, { count: number; firstRequestTimestamp: number }>();

export const applyRateLimiting = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user.id;

    socket.onAny((event, ...args) => {
      const now = Date.now();
      const rateLimitInfo = userRateLimits.get(userId) || { count: 0, firstRequestTimestamp: now };

      if (now - rateLimitInfo.firstRequestTimestamp > RATE_LIMIT_WINDOW_MS) {
        // Reset the rate limit window
        rateLimitInfo.count = 1;
        rateLimitInfo.firstRequestTimestamp = now;
      } else {
        rateLimitInfo.count += 1;
      }

      userRateLimits.set(userId, rateLimitInfo);

      if (rateLimitInfo.count > RATE_LIMIT_MAX) {
        socket.emit("error", "Rate limit exceeded");
        socket.disconnect();
      }
    });
  });
};
