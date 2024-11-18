-- AlterTable
ALTER TABLE "NFTItem" ADD COLUMN     "transactionsId" UUID;

-- AddForeignKey
ALTER TABLE "NFTItem" ADD CONSTRAINT "NFTItem_transactionsId_fkey" FOREIGN KEY ("transactionsId") REFERENCES "Transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
