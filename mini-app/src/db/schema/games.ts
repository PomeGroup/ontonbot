import { pgTable, serial, uuid, text, timestamp, json, index, uniqueIndex } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

/**
 * The 'games' table stores basic info about each Host game.
 * One game can have multiple tournaments.
 */
export const games = pgTable(
  "games",
  {
    id: serial("id").primaryKey(),
    // host "gameId" is typically a UUID, e.g. "f50fcb6e-591b-4345-8233-f97db10c40fb"
    hostGameId: uuid("host_game_id").notNull(),
    // Optional: a human-friendly name or label for the game
    name: text("name"),
    imageUrl: text("image_url"),
    // If you want to store additional data from host about the game,
    // you could add a JSON column:
    rawGameJson: json("raw_game_json").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
  },
  (table) => ({
    // Ensure each host gameId is unique
    gamesHostGameIdUnique: uniqueIndex("games_host_game_id_unique").on(table.hostGameId),
    // Example index on name, if you wish
    nameIdx: index("games_name_idx").on(table.name),
  })
);

// Drizzle type for selecting rows
export type GamesRow = InferSelectModel<typeof games>;
