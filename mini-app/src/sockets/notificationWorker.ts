import { consumeFromQueue, QueueNames } from "@/lib/rabbitMQ";
import { emitNotification } from "./notificationHandler";
import { Server } from "socket.io";
import { Message, Channel } from "amqplib";


export const startNotificationWorker = async (io: Server): Promise<void> => {
  console.log("Starting RabbitMQ Notification Worker...");

  await consumeFromQueue(
    QueueNames.NOTIFICATIONS,
    async (msg: Message, channel: Channel) => {
      try {
        const content = msg.content.toString();
        const message = JSON.parse(content);

        console.log("Received notification:", message);

        // Emit the notification or requeue it if the user is not online
        emitNotification(io, message.userId, message, channel, msg);
      } catch (error) {
        console.error("Error processing RabbitMQ message:", error);
        channel.nack(msg, false, true); // Requeue the message
      }
    },
    10 // Prefetch count
  );
};
