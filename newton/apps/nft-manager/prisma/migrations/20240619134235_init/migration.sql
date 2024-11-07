-- CreateEnum
CREATE TYPE "TransactionsType" AS ENUM ('failed', 'paid', 'pending');

-- CreateEnum
CREATE TYPE "TransactionsErrorType" AS ENUM ('order_does_not_exist', 'not_enough_ton', 'transaction_already_exists', 'internal_error', 'no_order_id', 'no_comment', 'internal_error_on_mint_request', 'invalid_order_update_data');

-- AlterTable
ALTER TABLE "Transactions" ADD COLUMN     "error_type" "TransactionsErrorType",
ADD COLUMN     "failed_reason" TEXT,
ADD COLUMN     "type" "TransactionsType" NOT NULL DEFAULT 'paid';
