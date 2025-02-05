import { QueueNamesType, RabbitMQ } from "@/lib/rabbitMQ";
import { prefetchCount, QueueNames, UserId } from "@/sockets/constants";
import { emitNotification } from "./emitters/emitNotification";
import { Server } from "socket.io";
import { Message, Channel } from "amqplib";
import { logger } from "@/server/utils/logger";
// Define the queue name as a constant
const NOTIFICATIONS_QUEUE = QueueNames.NOTIFICATIONS;

// Shutdown flag
let isShuttingDown = false;

// Listen for shutdown signals
process.on("SIGINT", () => {
  logger.log("Received SIGINT. Initiating graceful shutdown...");
  isShuttingDown = true;
});

process.on("SIGTERM", () => {
  logger.log("Received SIGTERM. Initiating graceful shutdown...");
  isShuttingDown = true;
});

/**
 * Shutdown Function to Clean Up Resources
 */
const shutdown = async (rabbit: RabbitMQ, queue: QueueNamesType, consumerTag: string) => {
  logger.log("Shutting down RabbitMQ Notification Worker...");

  const shutdownTimeout = setTimeout(() => {
    logger.warn("Shutdown timeout reached. Forcing exit.");
    process.exit(1);
  }, 10000); // 10 seconds timeout

  try {
    // Cancel the consumer to stop receiving new messages
    await rabbit.cancelConsumer(queue, consumerTag);
    logger.log("Consumer canceled.");

    // Close RabbitMQ connections gracefully
    await rabbit.close();
    logger.log("RabbitMQ connections closed.");
  } catch (error) {
    logger.error("Error during shutdown:", error);
  }

  clearTimeout(shutdownTimeout);
  logger.log("Shutdown complete. Exiting process.");
  process.exit(0);
};

/**
 * Function to consume messages and return the consumer tag
 */
const consumeMessages = async (rabbit: RabbitMQ, io: Server, queue: QueueNamesType): Promise<string> => {
  return await rabbit.consume(
    queue,
    async (msg: Message, channel: Channel) => {
      try {
        const content = msg.content.toString();
        logger.log("Received message:", content);
        const message = JSON.parse(content);
        const userId: UserId = Number(message.userId);

        // Emit the notification or requeue it if the user is not online
        await emitNotification(io, userId, message, channel, msg);
      } catch (error) {
        logger.error("Error processing RabbitMQ message:", error);
        channel.nack(msg, false, true); // Requeue the message
      }

      // If shutdown is requested, initiate shutdown after processing current message
      if (isShuttingDown) {
        logger.log("Shutdown flag detected during message processing. Initiating shutdown...");
        // Note: Do not await shutdown here to prevent blocking message processing
        // Shutdown will be handled in the periodic check
      }
    },
    prefetchCount
  );
};

// Worker Function
export const startNotificationWorker = async (io: Server): Promise<void> => {
  logger.log("Starting RabbitMQ Notification Worker...");

  const rabbit = RabbitMQ.getInstance();

  try {
    logger.log("Setting up queues...");
    await rabbit.setupQueues(); // Set up necessary queues and exchanges
    logger.log("Queue setup completed successfully.");
  } catch (setupError) {
    logger.error("Error during queue setup:", setupError);
    await rabbit.close();
    return;
  }

  // Store the consumer tag
  let consumerTag: string = "";

  // Consume Messages
  try {
    consumerTag = await consumeMessages(rabbit, io, NOTIFICATIONS_QUEUE);
    logger.log(`Started consuming with consumer tag: ${consumerTag}`);
  } catch (consumeError) {
    logger.error("Error starting notification consumption:", consumeError);
    await rabbit.close();
    return;
  }

  // Periodically check for shutdown signal
  const checkShutdown = setInterval(async () => {
    if (isShuttingDown) {
      clearInterval(checkShutdown);
      await shutdown(rabbit, NOTIFICATIONS_QUEUE, consumerTag);
    }
  }, 1000); // Check every second

  // Optional: Listen for process exit to ensure shutdown
  process.on("exit", () => {
    if (!isShuttingDown) {
      logger.log("Process exiting without shutdown signal.");
    }
  });
};
