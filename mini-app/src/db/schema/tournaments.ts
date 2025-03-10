import {
  pgTable,
  serial,
  text,
  timestamp,
  bigint,
  integer,
  json,
  uuid,
  index,
  uniqueIndex,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

// Import references to other tables.
// Adjust the import paths to match your project structure.
import { games } from "./games";
import { users } from "@/db/schema/users"; // or wherever your 'users' table is defined

/*** Enums ***/
export const tournamentStateEnum = pgEnum("tournament_state", ["Active", "Concluded", "TonAddressPending"]);

export const entryTypeEnum = pgEnum("tournament_entry_type", ["Tickets", "Pass"]);

export const prizePoolStatusEnum = pgEnum("prize_pool_status", ["Undefined", "BuildingUp", "Ready", "Settled"]);

export const prizeTypeEnum = pgEnum("prize_type", ["None", "Coin"]);

/*** Tournaments Table ***/
export const tournaments = pgTable(
  "tournaments",
  {
    id: serial("id").primaryKey(),

    // host short ID
    hostTournamentId: text("host_tournament_id").notNull(),
    // host "TournamentGuid"
    hostTournamentGuid: uuid("host_tournament_guid"),

    // Foreign key to 'games' table
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id),

    // Reference a user in your system who created/registered this tournament
    createdByUserId: bigint("created_by_user_id", { mode: "number" })
      .references(() => users.user_id)
      .notNull(),

    // New field: event organizer / “owner”
    owner: bigint("owner", { mode: "number" }).references(() => users.user_id), // remove `.notNull()` if optional

    // Basic fields
    name: text("name"),
    imageUrl: text("image_url"),
    state: tournamentStateEnum("state"), // "Active", "Concluded", etc.

    // Start/end dates
    createDate: timestamp("create_date"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),

    // Additional fields
    playersCount: integer("players_count").default(0),
    entryFee: bigint("entry_fee", { mode: "number" }),

    // TON details
    tonEntryType: entryTypeEnum("ton_entry_type"),
    tonTournamentAddress: text("ton_tournament_address"),

    // Prize details
    prizePoolStatus: prizePoolStatusEnum("prize_pool_status"),
    prizeType: prizeTypeEnum("prize_type"),
    currentPrizePool: bigint("current_prize_pool", { mode: "number" }),

    // Ton Society additional fields
    activityId: integer("activity_id"),
    tsRewardImage: text("ts_reward_image"),
    tsRewardVideo: text("ts_reward_video"),
    hidden: boolean("hidden").default(false),

    // Store raw host JSON if needed
    rawHostJson: json("raw_host_json").$type<Record<string, unknown>>(),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
  },
  (table) => ({
    // Unique index on the host tournament ID
    hostTournamentIdUnique: uniqueIndex("tournaments_host_tournament_id_unique").on(table.hostTournamentId),

    // Example indexes
    gameIdIdx: index("tournaments_game_id_idx").on(table.gameId),
    createdByUserIdIdx: index("tournaments_created_by_user_id_idx").on(table.createdByUserId),
    ownerIdx: index("tournaments_owner_idx").on(table.owner),
    stateIdx: index("tournaments_state_idx").on(table.state),
    activityIdIdx: index("tournaments_activity_id_idx").on(table.activityId),
  })
);

export type TournamentsRow = InferSelectModel<typeof tournaments>;
export type TournamentsRowInsert = Omit<TournamentsRow, "id" | "createdAt" | "updatedAt">;
export type tournamentStateType = (typeof tournamentStateEnum.enumValues)[number];
export type tournamentEntryType = (typeof entryTypeEnum.enumValues)[number];
export type tournamentPrizePoolStatusType = (typeof prizePoolStatusEnum.enumValues)[number];
export type tournamentPrizeType = (typeof prizeTypeEnum.enumValues)[number];
