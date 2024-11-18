/*
  Warnings:

  - Added the required column `owner_address` to the `NFTItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NFTItem" ADD COLUMN     "owner_address" VARCHAR(255) NOT NULL;
