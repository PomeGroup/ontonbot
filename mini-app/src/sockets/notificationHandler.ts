import { Server, Socket } from "socket.io";

const userSockets: Map<number, Set<string>> = new Map();

export const handleNotifications = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;

    if (!user) {
      socket.disconnect();
      return;
    }

    console.log(`User ${user.username} (ID: ${user.id}) connected.`);

    if (!userSockets.has(user.id)) {
      userSockets.set(user.id, new Set());
    }
    userSockets.get(user.id)?.add(socket.id);

    socket.on("disconnect", () => {
      console.log(`User ${user.username} (ID: ${user.id}) disconnected.`);
      userSockets.get(user.id)?.delete(socket.id);

      if (userSockets.get(user.id)?.size === 0) {
        userSockets.delete(user.id);
      }
    });
  });
};

export const emitNotification = (io: Server, userId: number, message: any) => {
  const sockets = userSockets.get(userId);
  if (!sockets || sockets.size === 0) {
    console.warn(`No active connections for user ${userId}.`);
    return;
  }

  sockets.forEach((socketId) => {
    io.to(socketId).emit("notification", message);
    console.log(`Notification sent to User ${userId} via Socket ${socketId}:`, message);
  });
};
