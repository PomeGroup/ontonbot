import amqp, { Connection, Channel, Message } from "amqplib";

// Define the valid queue names using a TypeScript enum
export const QueueNames = {
  NOTIFICATIONS: `${process.env.STAGE_NAME || "onton"}-notifications`,
  TG_MESSAGES: `${process.env.STAGE_NAME || "onton"}-tg_messages`,
} as const;

export type QueueNamesType = typeof QueueNames[keyof typeof QueueNames];

// Singleton class for RabbitMQ
class RabbitMQ {
  private static instance: RabbitMQ;
  private connection: Connection | null = null;
  private channels: Map<QueueNamesType, Channel> = new Map();
  private readonly url: string;
  private readonly username: string;
  private readonly password: string;
  private readonly port: number;

  private constructor(url: string, username: string, password: string, port: number) {
    this.url = process.env.IP_RABBITMQ || url;
    this.username = process.env.RABBITMQ_DEFAULT_USER || username;
    this.password = process.env.RABBITMQ_DEFAULT_PASS || password;
    this.port = parseInt(process.env.RABBITMQ_NODE_PORT!) || port;
  }

  /**
   * Initialize the RabbitMQ singleton instance
   */
  public static getInstance(): RabbitMQ {
    if (!RabbitMQ.instance) {
      RabbitMQ.instance = new RabbitMQ(
        process.env.RABBITMQ_URL || "localhost",
        process.env.RABBITMQ_DEFAULT_USER || "guest",
        process.env.RABBITMQ_DEFAULT_PASS || "guest",
        parseInt(process.env.RABBITMQ_NODE_PORT!) || 5672
      );
    }
    return RabbitMQ.instance;
  }

  /**
   * Establish a persistent connection to RabbitMQ
   */
  private async connect(): Promise<Connection> {
    if (!this.connection) {
      try {
        this.connection = await amqp.connect({
          protocol: "amqp",
          hostname: this.url,
          port: this.port,
          username: this.username,
          password: this.password,
        });

        this.connection.on("error", (err) => {
          console.error("RabbitMQ connection error:", err);
          this.connection = null;
        });

        this.connection.on("close", () => {
          console.warn("RabbitMQ connection closed.");
          this.connection = null;
        });

        console.log("RabbitMQ connection established successfully.");
      } catch (error) {
        console.error("Error connecting to RabbitMQ:", error);
        throw error;
      }
    }
    return this.connection;
  }

  /**
   * Ensure the connection is valid and reconnect if needed
   */
  private async ensureConnection(): Promise<void> {
    if (!this.connection) {
      await this.connect();
    } else {
      try {
        await this.connection.createChannel();
      } catch (error) {
        console.warn("Connection was invalid, reconnecting...");
        this.connection = null;
        await this.connect();
      }
    }
  }

  /**
   * Get or create a channel for a queue
   */
  private async getChannel(queue: QueueNamesType): Promise<Channel> {
    await this.ensureConnection();

    if (this.channels.has(queue)) {
      return this.channels.get(queue) as Channel;
    }

    try {
      const connection = await this.connect();
      const channel = await connection.createChannel();
      await channel.assertQueue(queue, { durable: true });
      this.channels.set(queue, channel);
      console.log(`Channel created for queue: '${queue}'`);
      return channel;
    } catch (error) {
      console.error(`Error creating channel for queue '${queue}':`, error);
      throw error;
    }
  }

  /**
   * Push a message to a queue
   */
  public async push(queue: QueueNamesType, message: Record<string, any>): Promise<void> {
    try {
      const channel = await this.getChannel(queue);
      const buffer = Buffer.from(JSON.stringify(message));
      const sent = channel.sendToQueue(queue, buffer, { persistent: true });

      if (sent) {
        console.log(`Message sent to queue '${queue}':`, message);
      } else {
        console.warn(`Message not sent to queue '${queue}':`, message);
      }
    } catch (error) {
      console.error(`Error pushing message to queue '${queue}':`, error);
    }
  }

  /**
   * Consume messages from a queue
   */
  public async consume(
    queue: QueueNamesType,
    onMessage: (_msg: Message, _channel: Channel) => Promise<void>,
    prefetchCount = 1
  ): Promise<void> {
    try {
      const channel = await this.getChannel(queue);
      await channel.prefetch(prefetchCount);

      await channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            await onMessage(msg, channel); // Pass both `msg` and `channel` to the callback
          } catch (error) {
            console.error(`Error processing message from queue '${queue}':`, error);
            channel.nack(msg); // Requeue the message
          }
        }
      });

      console.log(`Consuming messages from queue '${queue}' with prefetch count ${prefetchCount}`);
    } catch (error) {
      console.error(`Error consuming messages from queue '${queue}':`, error);
    }
  }

  /**
   * Close all channels and the connection
   */
  public async close(): Promise<void> {
    try {
      for (const [queue, channel] of this.channels.entries()) {
        await channel.close();
        console.log(`Channel for queue '${queue}' closed.`);
      }
      this.channels.clear();

      if (this.connection) {
        await this.connection.close();
        console.log("RabbitMQ connection closed.");
        this.connection = null;
      }
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
    }
  }
}

// Export utility functions
const rabbit = RabbitMQ.getInstance();

export const pushToQueue = async (queue: QueueNamesType, message: Record<string, any>) => {
  await rabbit.push(queue, message);
};

export const consumeFromQueue = async (
  queue: QueueNamesType,
  onMessage: (_msg: Message, _channel: Channel) => Promise<void>,
  prefetchCount = 1
) => {
  await rabbit.consume(queue, onMessage, prefetchCount);
};
