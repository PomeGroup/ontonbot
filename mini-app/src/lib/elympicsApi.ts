import axios, { AxiosError, AxiosInstance } from "axios";
import { configDotenv } from "dotenv";

configDotenv();

// 1) Create an Axios client. Adapt the base URL if needed.
//    Typically: https://api.elympics.cc/v2
export const elympicsClient: AxiosInstance = axios.create({
  baseURL: process.env.ELYMPICS_BASE_URL || "https://api.elympics.cc/v2",
  // If you need default headers, place them here or pass them per-request
});

// 2) Type definitions for request/response

/** Response from POST /auth/user/telegram-auth-v2 */
export interface TelegramAuthResponse {
  jwtToken: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
}

/** Payload for POST /auth/user/telegram-auth-v2 */
export interface TelegramAuthRequest {
  typedData: Record<string, unknown>; // or more specific type
  gameId: string;
  initDataRaw: string;
}

// GET /v2/tournament/tournament?tournamentId=xxxx
export interface TournamentDetailsResponse {
  Id: string; // 'o17yuwmr', for example
  TournamentGuid: string;
  GameId: string;
  Name: string;
  OwnerId: string;
  State: "Active" | "Planned" | "Finished" | string;
  CreateDate: string; // e.g. "2025-03-09T20:47:18.132941Z"
  StartDate: string; // e.g. "2025-03-09T20:47:18.999Z"
  EndDate: string; // e.g. "2025-03-09T21:47:18.999Z"
  IsDefault: boolean;
  PlayersCount: number;
  Prizes: any[]; // or define if known
  TonDetails: {
    RequiredTickets: boolean;
    TournamentAddress: string;
    EntryType: string; // e.g. "Tickets"
  };
  Scores: any[]; // or define if known
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

/** Leaderboard entry */
export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  matchId: string;
  tournamentId: string;
  position: number;
  points: number;
  endedAt: string; // e.g. "2025-03-09T21:16:13.765Z"
}

/** Response from /leaderboard endpoint */
export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  pageNumber: number;
  pageSize: number;
  firstPage: string;
  lastPage: string;
  totalPages: number;
  totalRecords: number;
}

// 3) Define functions for each relevant Elympics endpoint

/**
 * 3.1) Authenticate user via Telegram (POST /auth/user/telegram-auth-v2)
 * @param apiBearerToken  The Bearer token for the "client-secret" auth
 * @param payload         The request body: gameId, initDataRaw, typedData
 * @returns               TelegramAuthResponse with jwtToken, userId, etc.
 */
export async function authenticateUserViaTelegram(
  apiBearerToken: string,
  payload: TelegramAuthRequest
): Promise<TelegramAuthResponse> {
  try {
    const response = await elympicsClient.post<TelegramAuthResponse>("/auth/user/telegram-auth-v2", payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiBearerToken}`,
      },
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error, "Error authenticating user via Telegram");
  }
}

/**
 * 3.2) Get Tournament Details (GET /tournament/tournament?tournamentId=xxx)
 * @param apiPublisherKey  The "Elympics-Publisher-API-Key"
 * @param apiBearerToken   The "Authorization: Bearer ..." token
 * @param tournamentId     The ID (slug) of the tournament (e.g., "o17yuwmr")
 */
export async function getTournamentDetails(
  apiPublisherKey: string,
  apiBearerToken: string,
  tournamentId: string
): Promise<TournamentDetailsResponse> {
  try {
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
}

/**
 * 3.3) Get Leaderboard (GET /leaderboardservice/leaderboard?GameId=...&TournamentId=...)
 * @param apiBearerToken  The "Authorization: Bearer ..." token
 * @param gameId          Elympics game ID (UUID)
 * @param tournamentId    Elympics tournament ID
 */
export async function getTournamentLeaderboard(
  apiBearerToken: string,
  gameId: string,
  tournamentId: string
): Promise<LeaderboardResponse> {
  try {
    const url =
      `/leaderboardservice/leaderboard?GameId=${encodeURIComponent(gameId)}` +
      `&TournamentId=${encodeURIComponent(tournamentId)}`;

    const response = await elympicsClient.get<LeaderboardResponse>(url, {
      headers: {
        Authorization: `Bearer ${apiBearerToken}`,
      },
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error, "Error fetching leaderboard");
  }
}

// 4) Utility: central Axios error handler
function handleAxiosError(error: unknown, message: string): never {
  if (error instanceof AxiosError && error.response) {
    // Log or handle HTTP error response details
    throw new Error(`${message}. HTTP Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
  }
  throw new Error(`${message}. Unknown error: ${String(error)}`);
}
