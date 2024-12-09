import { QueueNamesType, RabbitMQ } from "@/lib/rabbitMQ";
import { prefetchCount, QueueNames, UserId } from "@/sockets/constants";
import { emitNotification } from "./emitters/emitNotification";
import { Server } from "socket.io";
import { Message, Channel } from "amqplib";

// Define the queue name as a constant
const NOTIFICATIONS_QUEUE = QueueNames.NOTIFICATIONS;

// Shutdown flag
let isShuttingDown = false;

// Listen for shutdown signals
process.on('SIGINT', () => {
  console.log('Received SIGINT. Initiating graceful shutdown...');
  isShuttingDown = true;
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Initiating graceful shutdown...');
  isShuttingDown = true;
});

/**
 * Shutdown Function to Clean Up Resources
 */
const shutdown = async (rabbit: RabbitMQ, queue: QueueNamesType, consumerTag: string) => {
  console.log('Shutting down RabbitMQ Notification Worker...');

  const shutdownTimeout = setTimeout(() => {
    console.warn('Shutdown timeout reached. Forcing exit.');
    process.exit(1);
  }, 10000); // 10 seconds timeout

  try {
    // Cancel the consumer to stop receiving new messages
    await rabbit.cancelConsumer(queue, consumerTag);
    console.log('Consumer canceled.');

    // Close RabbitMQ connections gracefully
    await rabbit.close();
    console.log('RabbitMQ connections closed.');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }

  clearTimeout(shutdownTimeout);
  console.log('Shutdown complete. Exiting process.');
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
        console.log("Received message:", content);
        const message = JSON.parse(content);
        const userId: UserId = Number(message.userId);

        // Emit the notification or requeue it if the user is not online
        await emitNotification(io, userId, message, channel, msg);
      } catch (error) {
        console.error("Error processing RabbitMQ message:", error);
        channel.nack(msg, false, true); // Requeue the message
      }

      // If shutdown is requested, initiate shutdown after processing current message
      if (isShuttingDown) {
        console.log('Shutdown flag detected during message processing. Initiating shutdown...');
        // Note: Do not await shutdown here to prevent blocking message processing
        // Shutdown will be handled in the periodic check
      }
    },
    prefetchCount
  );
};

// Worker Function
export const startNotificationWorker = async (io: Server): Promise<void> => {
  console.log("Starting RabbitMQ Notification Worker...");

  const rabbit = RabbitMQ.getInstance();

  try {
    console.log("Setting up queues...");
    await rabbit.setupQueues(); // Set up necessary queues and exchanges
    console.log("Queue setup completed successfully.");
  } catch (setupError) {
    console.error("Error during queue setup:", setupError);
    await rabbit.close();
    return;
  }

  // Store the consumer tag
  let consumerTag: string = '';

  // Consume Messages
  try {
    consumerTag = await consumeMessages(rabbit, io, NOTIFICATIONS_QUEUE);
    console.log(`Started consuming with consumer tag: ${consumerTag}`);
  } catch (consumeError) {
    console.error("Error starting notification consumption:", consumeError);
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
  process.on('exit', () => {
    if (!isShuttingDown) {
      console.log('Process exiting without shutdown signal.');
    }
  });
};
