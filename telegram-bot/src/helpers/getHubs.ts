import { redisTools } from "../lib/redisTools";
import axios from "axios";

export interface HubsResponse {
  status: string;
  data: HubType[];
}

export interface HubType {
  id: number;
  attributes: Attributes;
}

export interface Attributes {
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export type SocietyHub = {
  id: number;
  name: string;
};


export const tonSocietyClient = axios.create({
  baseURL: process.env.TON_SOCIETY_BASE_URL,
  headers: {
    "x-api-key": process.env.TON_SOCIETY_API_KEY,
    "x-partner-id": "onton",
  },
});

export async function getHubs(): Promise<SocietyHub[]> {
  // Define a cache key – you can parameterize if needed.
  const cacheKey = redisTools.cacheKeys.hubs;

  // 1. Try to read from the cache
  const cachedResult: SocietyHub[] = await redisTools.getCache(cacheKey);
  if (cachedResult) {
    // If we have a cached copy, return it
    return cachedResult;
  }

  try {
    // 2. Otherwise, fetch fresh data
    const response = await tonSocietyClient.get<HubsResponse>("/hubs", {
      params: {
        _start: 0,
        _end: 100,
      },
    });

    if (response.status === 200 && response.data) {
      // sort hubs by attributes.title
      const sortedHubs = response.data.data.sort((a, b) => a.attributes.title.localeCompare(b.attributes.title));
      const transformedHubs = sortedHubs.map((hub) => ({
        id: hub.id,
        name: hub.attributes.title,
      }));

      // 3. Cache the transformed result
      await redisTools.setCache(cacheKey, transformedHubs, redisTools.cacheLvl.medium);

      // 4. Return the data
      return transformedHubs;
    }

    // If response is invalid:
    throw new Error("Invalid response from the server");
  } catch (error) {
    throw new Error("Error fetching hubs");
  }
}