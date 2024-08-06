import NodeCache from "node-cache";

// Create a new cache instance with a default TTL (time-to-live) of 10 minutes
// and a check period of 2 minutes to prune expired entries.
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

/**
 * Sets a value in the cache.
 *
 * @param key - The cache key.
 * @param value - The value to store.
 * @param ttl - Optional time-to-live for this specific cache entry.
 */
export const setCache = (key: string, value: any, ttl?: number): void => {
    if (ttl !== undefined) {
        cache.set(key, value, ttl);
    } else {
        cache.set(key, value);
    }
};

/**
 * Gets a value from the cache.
 *
 * @param key - The cache key.
 * @returns The cached value or undefined if not found.
 */
export const getCache = (key: string): any | undefined => {
    return cache.get(key);
};

/**
 * Deletes a value from the cache.
 *
 * @param key - The cache key.
 */
export const deleteCache = (key: string): void => {
    cache.del(key);
};
