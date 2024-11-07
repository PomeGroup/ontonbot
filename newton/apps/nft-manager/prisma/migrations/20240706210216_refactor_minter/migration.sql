-- CreateEnum
CREATE TYPE "NftItemState" AS ENUM ('created', 'mint_request', 'minted', 'failed');

-- AlterTable
ALTER TABLE "NFTItem" ADD COLUMN     "index" INTEGER,
ADD COLUMN     "order_id" TEXT,
ADD COLUMN     "state" "NftItemState" NOT NULL DEFAULT 'created',
ADD COLUMN     "try_count" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Transactions" ADD COLUMN     "create_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_processed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tx_comment" VARCHAR(255) NOT NULL DEFAULT 'empty';

-- CreateTable
CREATE TABLE "WatchWallet" (
    "id" UUID NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "last_checked_lt" TEXT NOT NULL DEFAULT '0',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchWallet_address_key" ON "WatchWallet"("address");
