import { pushToQueue, consumeFromQueue ,QueueNamesType } from "@/lib/rabbitMQ";
import { Options } from "amqplib";
import { v4 as uuidv4 } from 'uuid';
/**
 * Push a message to a specified queue.
 *
 * @param queue - The queue name to push the message to.
 * @param message - The message to push.
 */
export const pushMessageToQueue = async (queue: QueueNamesType, message: any): Promise<void> => {
  try {
    const options: Options.Publish = {
      messageId: message.notificationId ? message.notificationId.toString() : uuidv4() ,
      appId: 'OnTon', // Replace with your actual app ID
      userId: message.userId ? message.userId.toString() : undefined,
      contentType: 'application/json', // Optional but recommended
      timestamp: Date.now(),
      deliveryMode : 2,
      // Add any other properties you need
    };
    await pushToQueue(queue, message, options);
    console.log(`Message pushed to queue '${queue}':`, message);
  } catch (error) {
    console.error(`Error pushing message to queue '${queue}':`, error);
    throw error;
  }
};

/**
 * Consume messages from a specified queue.
 *
 * @param queue - The queue name to consume messages from.
 * @param onMessage - Callback to handle the consumed message.
 * @param prefetchCount - Number of messages to prefetch (default: 1).
 */
export const consumeQueueMessages = async (
  queue: QueueNamesType,
  onMessage: (message: any) => Promise<void>,
  prefetchCount = 40
): Promise<void> => {
  try {
    await consumeFromQueue(queue, onMessage, prefetchCount);
    console.log(`Started consuming messages from queue '${queue}' with prefetch count ${prefetchCount}`);
  } catch (error) {
    console.error(`Error consuming messages from queue '${queue}':`, error);
    throw error;
  }
};

/**
 * RabbitMQ Service to handle all queue actions.
 */
export const rabbitMQService = {
  pushMessageToQueue,
  consumeQueueMessages,
};
