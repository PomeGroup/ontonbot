-- AlterTable
ALTER TABLE "NFTCollection" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "last_registered_item_index" SET DEFAULT -1;

-- AlterTable
ALTER TABLE "NFTItem" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Transactions" ALTER COLUMN "id" DROP DEFAULT;
