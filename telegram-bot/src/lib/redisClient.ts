import { createClient, RedisClientType } from "redis";
import { logger } from "../utils/logger";

let redisClient: RedisClientType | undefined;

const connectToRedis = async (): Promise<void> => {
  if (!redisClient) {
    redisClient = createClient({
      url: `redis://${process.env.IP_REDIS || "redis"}:${process.env.REDIS_PORT || 6379}`,
    });

    redisClient.on("error", (err) => {
      // logger.error("Redis error:", err);
    });

    redisClient.on("connect", () => {
      logger.log("Connected to Redis");
    });

    await redisClient.connect();
  }
};

// This function guarantees that redisClient is never undefined
export const getRedisClient = async (): Promise<RedisClientType> => {
  if (!redisClient) {
    await connectToRedis();
  }

  if (!redisClient) {
    throw new Error("Redis client initialization failed");
  }

  return redisClient;
};
