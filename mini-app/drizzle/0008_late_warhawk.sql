ALTER TYPE "event_trigger_type" ADD VALUE 'password';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'POA_PASSWORD';--> statement-breakpoint
DROP INDEX IF EXISTS "unique_event_creation";--> statement-breakpoint
ALTER TABLE "event_payment_info" ALTER COLUMN "price" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "society_hub_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "total_price" SET DATA TYPE real;