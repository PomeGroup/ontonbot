export type ClientSecretAuthRequest = {
  ClientSecret: string;
};

export type ClientSecretAuthResponse = {
  jwtToken: string;
  userId: string;
  nickname: string;
};

export type TournamentDetailsResponse = {
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
};

export type LeaderboardEntry = {
  userId: string;
  nickname: string;
  matchId: string;
  tournamentId: string;
  position: number;
  points: number;
  endedAt: string;
};

export type LeaderboardResponse = {
  data: LeaderboardEntry[];
  pageNumber: number;
  pageSize: number;
  firstPage: string;
  lastPage: string;
  totalPages: number;
  totalRecords: number;
};
