import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const applyAuthMiddleware = (io: Server) => {
  io.use((socket: Socket, next) => {
    try {
      const { initData } = socket.handshake.auth;

      if (!initData) {
        return next(new Error("Authentication failed: Missing initData."));
      }

      const decodedData = jwt.verify(initData, JWT_SECRET);  //as TelegramInitData

      if (!decodedData || !decodedData.id) {
        return next(new Error("Authentication failed: Invalid Telegram initData."));
      }

      socket.data.user = decodedData; // Attach user data to the socket
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed."));
    }
  });
};
