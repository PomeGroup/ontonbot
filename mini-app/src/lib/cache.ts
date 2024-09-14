import crypto from "crypto";
import NodeCache from "node-cache";

// Create a new cache instance with a default TTL (time-to-live) of 10 minutes
// and a check period of 2 minutes to prune expired entries.
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
/**
 * Generates an MD5 hash for a given key.
 *
 * @param key - The input key.
 * @returns The MD5 hash of the key.
 */
const generateHash = (key: string): string => {
  return crypto.createHash("md5").update(key).digest("hex");
};
/**
 * Sets a value in the cache.
 *
 * @param key - The cache key.
 * @param value - The value to store.
 * @param ttl - Optional time-to-live for this specific cache entry.
 */
export const setCache = (key: string, value: any, ttl?: number): void => {
  const hashedKey = generateHash(key);
  if (ttl !== undefined) {
    cache.set(hashedKey, value, ttl);
  } else {
    cache.set(hashedKey, value);
  }
};

/**
 * Gets a value from the cache.
 *
 * @param key - The cache key.
 * @returns The cached value or undefined if not found.
 */
export const getCache = (key: string): any | undefined => {
  const hashedKey = generateHash(key);
  return cache.get(hashedKey);
};

/**
 * Deletes a value from the cache.
 *
 * @param key - The cache key.
 */
export const deleteCache = (key: string): void => {
  const hashedKey = generateHash(key);
  cache.del(hashedKey);
};

export const cacheKeys = {
  getEventsWithFilters: `getEventsWithFilters_`,
  cronJobLock: "cronJobLock",
  ontonSettings: "ontonSettings",
  ontonSettingsProtected: "ontonSettingsProtected",
};
