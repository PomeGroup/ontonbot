import { bigint, boolean, index, integer, pgTable, serial, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { games, tournaments, users } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

export const gameLeaderboard = pgTable(
  "game_leaderboard",
  {
    id: serial("id").primaryKey(),

    hostUserId: text("host_user_id").notNull(),

    telegramUserId: bigint("telegram_user_id", { mode: "number" })
      .references(() => users.user_id)
      .notNull(),

    tournamentId: integer("tournament_id")
      .references(() => tournaments.id)
      .notNull(),
    gameId: integer("game_id")
      .references(() => games.id)
      .notNull(),
    hostTournamentId: text("host_tournament_id").notNull(),

    nickname: text("nickname"),
    matchId: uuid("match_id"),
    position: integer("position"),
    points: integer("points"),
    endedAt: timestamp("ended_at"),
    rewardCreated: boolean("reward_created").default(false),
    notificationReceived: boolean("notification_received").default(false),
    hasClaimed: boolean("has_claimed").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).defaultNow(),
  },
  (table) => ({
    hostTournamentIdx: index("gl_host_tournament_idx").on(table.hostTournamentId),
    telegramUserIdx: index("gl_telegram_user_idx").on(table.telegramUserId),
    uniqueUserTournament: uniqueIndex("unique_user_tournament").on(table.hostTournamentId, table.telegramUserId),
  })
);

export type GameLeaderboardRow = InferSelectModel<typeof gameLeaderboard>;
export type GameLeaderboardRowInsert = Omit<
  GameLeaderboardRow,
  "id" | "createdAt" | "updatedAt" | "rewardCreated" | "notificationReceived" | "hasClaimed"
>;
