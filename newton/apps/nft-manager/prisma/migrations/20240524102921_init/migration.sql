-- CreateTable
CREATE TABLE "NFTCollection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "address" VARCHAR(255) NOT NULL,
    "metadata_url" VARCHAR(255) NOT NULL,
    "item_meta_data" JSONB NOT NULL,

    CONSTRAINT "NFTCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFTItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "address" VARCHAR(255) NOT NULL,
    "metadata_url" VARCHAR(255) NOT NULL,
    "collection_id" UUID NOT NULL,

    CONSTRAINT "NFTItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "src" VARCHAR(255) NOT NULL,
    "logical_time" BIGINT NOT NULL,
    "hash" VARCHAR(255) NOT NULL,
    "value" REAL NOT NULL,
    "ticket_value" REAL NOT NULL,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NFTItem" ADD CONSTRAINT "NFTItem_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "NFTCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
