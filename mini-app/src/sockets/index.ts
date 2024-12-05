import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { applyAuthMiddleware } from "./authMiddleware";
import { handleNotifications } from "./notificationHandler";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

(async () => {
  // Redis clients for the adapter
  const pubClient = createClient({ url: `redis://${REDIS_HOST}:${REDIS_PORT}` });
  const subClient = pubClient.duplicate(); // A separate client for subscriptions

  await pubClient.connect();
  await subClient.connect();

  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
    transports: ["websocket", "polling"],
  });

  // Apply Redis adapter to Socket.IO
  io.adapter(createAdapter(pubClient, subClient));

  // Apply authentication middleware
  applyAuthMiddleware(io);

  // Handle socket events
  handleNotifications(io);

  const PORT = process.env.SOCKET_PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Socket.IO server listening on port ${PORT}`);
  });
})();
