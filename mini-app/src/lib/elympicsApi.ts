import axios, { AxiosError, AxiosInstance } from "axios";
import { configDotenv } from "dotenv";
import { redisTools } from "@/lib/redisTools";

configDotenv();

/**
 * 1) Create an Axios client. Adapt the base URL if needed.
 *    Typically: https://api.elympics.cc/v2
 */
export const elympicsClient: AxiosInstance = axios.create({
  baseURL: process.env.ELYMPICS_BASE_URL || "https://api.elympics.cc/v2",
});

/**
 * 2) Type definitions for your requests and responses
 */
export interface ClientSecretAuthRequest {
  clientSecret: string;
}

export interface ClientSecretAuthResponse {
  jwtToken: string;
  userId: string;
  nickname: string;
}

export interface TournamentDetailsResponse {
  Id: string;
  TournamentGuid: string;
  GameId: string;
  Name: string;
  OwnerId: string;
  State: "Active" | "Planned" | "Finished" | string;
  CreateDate: string;
  StartDate: string;
  EndDate: string;
  IsDefault: boolean;
  PlayersCount: number;
  Prizes: any[];
  TonDetails: {
    RequiredTickets: boolean;
    TournamentAddress: string;
    EntryType: string;
  };
  Scores: any[];
  TotalGamesCount: number;
  GamesLeftToPlay: number;
  PrizePool: any[];
  PrizePoolText: string;
  Coin: {
    Currency: {
      Ticker: string;
      Address: string;
      Decimals: number;
      IconUrl: string;
    };
    Chain: {
      ExternalId: number;
      Type: string; // "TON", for example
    };
  };
  EntryFee: number;
  PrizePoolStatus: string;
  PrizeType: string;
  CurrentPrizePool: number;
  DistributionPercents: number[];
}

export interface LeaderboardResponse {
  data: {
    userId: string;
    nickname: string;
    matchId: string;
    tournamentId: string;
    position: number;
    points: number;
    endedAt: string;
  }[];
  pageNumber: number;
  pageSize: number;
  firstPage: string;
  lastPage: string;
  totalPages: number;
  totalRecords: number;
}

/**
 * 3) Utility: central Axios error handler
 */
function handleAxiosError(error: unknown, message: string): never {
  if (error instanceof AxiosError && error.response) {
    throw new Error(`${message}. HTTP Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
  }
  throw new Error(`${message}. Unknown error: ${String(error)}`);
}

/**
 * 4) Fetch a new Master API token from Elympics (PUT /auth/user/clientSecretAuth)
 */
async function authenticateUserViaClientSecret(payload: ClientSecretAuthRequest): Promise<ClientSecretAuthResponse> {
  try {
    const response = await elympicsClient.put<ClientSecretAuthResponse>("/auth/user/clientSecretAuth", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error, "Error authenticating user via client secret");
  }
}

/**
 * 5) Retrieve the Master API token, cached in Redis for 10 minutes
 */
const getMasterApiBearerToken = async (): Promise<string> => {
  // Attempt to retrieve the entire auth object from Redis
  let authData = await redisTools.getCache(redisTools.cacheKeys.elympicsMasterJwt);

  if (!authData) {
    // No cached token, fetch a new one
    const clientSecret = process.env.ELYMPICS_CLIENT_SECRET || "YOUR-CLIENT-SECRET";

    const res = await authenticateUserViaClientSecret({
      clientSecret,
    });

    // Store the entire response { jwtToken, userId, nickname } in Redis
    // with a 10-minute TTL (cacheLvl.short is 600 seconds if that's how it's set)
    authData = { ...res };
    await redisTools.setCache(redisTools.cacheKeys.elympicsMasterJwt, authData, redisTools.cacheLvl.short);
  }

  // authData is { jwtToken, userId, nickname }
  return authData.jwtToken;
};

/**
 * 6) Get Tournament Details, automatically uses the cached Master Bearer token
 *    GET /tournament/tournament?tournamentId=xxx
 */
export const getTournamentDetails = async (
  apiPublisherKey: string,
  tournamentId: string
): Promise<TournamentDetailsResponse> => {
  try {
    const apiBearerToken = await getMasterApiBearerToken();
    const url = `/tournament/tournament?tournamentId=${encodeURIComponent(tournamentId)}`;

    const response = await elympicsClient.get<TournamentDetailsResponse>(url, {
      headers: {
        "Elympics-Publisher-API-Key": apiPublisherKey,
        Authorization: `Bearer ${apiBearerToken}`,
      },
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error, "Error fetching tournament details");
  }
};

/**
 * Get Tournament Leaderboard
 *
 * GET /leaderboardservice/leaderboard?GameId=...&TournamentId=...
 * Caches the result for 1 minute.
 */
export async function getTournamentLeaderboard(gameId: string, tournamentId: string): Promise<LeaderboardResponse> {
  try {
    // 1) Construct a Redis cache key (e.g. "leaderboard:gameId:tournamentId")
    const cacheKey = `${redisTools.cacheKeys.leaderboard}${gameId}:${tournamentId}`;

    // 2) Check if we have a cached response in Redis
    const cached = await redisTools.getCache(cacheKey);
    if (cached) {
      // If yes, return that immediately
      return cached as LeaderboardResponse;
    }

    // 3) If not cached, fetch a valid Bearer token from getMasterApiBearerToken()
    const apiBearerToken = await getMasterApiBearerToken();

    // 4) Build the request URL
    const url =
      `/leaderboardservice/leaderboard?GameId=${encodeURIComponent(gameId)}` +
      `&TournamentId=${encodeURIComponent(tournamentId)}`;

    // 5) Make the request
    const response = await elympicsClient.get<LeaderboardResponse>(url, {
      headers: {
        Authorization: `Bearer ${apiBearerToken}`,
      },
    });

    // 6) Cache the result for 1 minute
    // You can use a hardcoded 60 seconds or your existing cacheLvl.guard (if set to 60)
    await redisTools.setCache(cacheKey, response.data, 60);

    // 7) Return the freshly fetched data
    return response.data;
  } catch (error) {
    handleAxiosError(error, "Error fetching leaderboard");
  }
}
