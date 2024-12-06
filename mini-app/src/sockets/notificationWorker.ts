import { RabbitMQ } from "@/lib/rabbitMQ";
import { prefetchCount, QueueNames } from "@/sockets/constants";
import { emitNotification } from "./emitters/emitNotification";
import { Server } from "socket.io";
import { Message, Channel } from "amqplib";

export const startNotificationWorker = async (io: Server): Promise<void> => {
  console.log("Starting RabbitMQ Notification Worker...");

  const rabbit = RabbitMQ.getInstance();

  try {
    console.log("Setting up queues...");
    await rabbit.setupQueues(); // Set up necessary queues and exchanges
    console.log("Queue setup completed successfully.");
  } catch (setupError) {
    console.error("Error during queue setup:", setupError);
    return;
  }

  // Verify queue state before consuming
  console.log("Verifying queue state before starting consumption...");
  await rabbit
    .consume(
      QueueNames.NOTIFICATIONS,
      async (msg: Message, channel: Channel) => {
        try {
          const content = msg.content.toString();
          console.log("Received message:", content);
          const message = JSON.parse(content);
          console.log("Received notification:", message);

          // Emit the notification or requeue it if the user is not online
          await emitNotification(io, message.userId, message, channel, msg);
        } catch (error) {
          console.error("Error processing RabbitMQ message:", error);
          channel.nack(msg, false, true); // Requeue the message
        }
      },
      prefetchCount,
    )
    .catch((error) => {
      console.error("Error starting notification consumption:", error);
    });
};

