import { pgTable, timestamp, varchar, integer, serial, uniqueIndex } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/*  NFT-collection owner snapshots                                            */
/* -------------------------------------------------------------------------- */

export const snapshotCollections = pgTable(
  "nft_collection_snapshot",
  {
    id: serial("id").primaryKey(),
    snapshotRuntime: timestamp("snapshot_runtime", { withTimezone: true }).notNull(),
    collectionAddress: varchar("collection_address", { length: 66 }).notNull(),
    nftAddress: varchar("nft_address", { length: 66 }).notNull(),
    ownerAddress: varchar("owner_address", { length: 66 }).notNull(),
    nftIndex: integer("nft_index").notNull(),
  },
  (t) => ({
    snapshotUnique: uniqueIndex("snapshot_runtime_nft_idx").on(t.snapshotRuntime, t.nftAddress),
  })
);

export type SnapshotCollectionRow = InferSelectModel<typeof snapshotCollections>;
export type SnapshotCollectionInsert = Omit<SnapshotCollectionRow, "id">;
