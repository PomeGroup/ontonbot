/*
  Warnings:

  - A unique constraint covering the columns `[address]` on the table `NFTCollection` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "NFTCollection" ADD COLUMN     "last_registered_item_index" INTEGER DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "NFTCollection_address_key" ON "NFTCollection"("address");
