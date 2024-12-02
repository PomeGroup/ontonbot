import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { applyAuthMiddleware } from "./authMiddleware";
import { handleNotifications, emitNotification } from "./notificationHandler"; // Import these functions

const IP_REDIS = process.env.IP_REDIS;
const REDIS_PORT = Number(process.env.REDIS_PORT);
const SOCKET_PORT = Number(process.env.SOCKET_PORT);

(async () => {
  try {
    console.log("Starting socket server");

    if (!IP_REDIS || !REDIS_PORT) {
      throw new Error("Missing IP_REDIS or REDIS_PORT environment variable.");

    }

    if (!SOCKET_PORT) {
      throw new Error("Missing SOCKET_PORT environment variable.");
    }

    // Redis clients for the adapter
    const pubClient = createClient({ url: `redis://${IP_REDIS}:${REDIS_PORT}` });
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    const httpServer = createServer();
    const io = new Server(httpServer, {
      cors: { origin: "*" },
      transports: ["websocket", "polling"],
    });

    io.adapter(createAdapter(pubClient, subClient));

    applyAuthMiddleware(io);

    // Handle user connections and manage notifications
    handleNotifications(io);

    httpServer.listen(SOCKET_PORT, () => {
      console.log(`Socket.IO server listening on port ${SOCKET_PORT}`);
    });


  } catch (error) {
    console.error("Error starting the socket server:", error);
    process.exit(1);
  }
})();
