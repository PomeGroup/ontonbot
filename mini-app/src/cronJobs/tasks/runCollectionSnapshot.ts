import tonCenter from "@/services/tonCenter";
import snapshotCollectionsDB from "@/db/modules/snapshotCollections.db";
import { SnapshotCollectionInsert } from "@/db/schema/snapshotCollections";
import { logger } from "@/server/utils/logger";

const pageSize = 100;

/**
 * Cron-friendly task: grab every NFT owner in a collection and
 * write a snapshot. Returns rows inserted.
 */
export const runCollectionSnapshot = async (collectionAddress: string): Promise<number> => {
  const runtime = new Date();
  const rows: SnapshotCollectionInsert[] = [];
  let offset = 0;

  /* paginate through TON Center */
  while (true) {
    const page = await tonCenter.fetchNFTItemsWithRetry(
      "", // ownerAddress → grab all
      collectionAddress,
      "", // nft_address
      -1, // index filter
      pageSize,
      offset
    );

    if (!page?.nft_items?.length) break;

    for (const item of page.nft_items) {
      rows.push({
        snapshotRuntime: runtime,
        collectionAddress,
        nftAddress: item.address,
        ownerAddress: item.owner_address,
        nftIndex: Number(item.index),
      });
    }
    offset += pageSize;
  }

  const inserted = await snapshotCollectionsDB.insertSnapshotRows(rows);

  logger.info(`Snapshot job: ${inserted}/${rows.length} rows stored for ${collectionAddress} @ ${runtime.toISOString()}`);

  return inserted;
};
