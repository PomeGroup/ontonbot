DROP INDEX IF EXISTS "airdrop_update_counter_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "eventf_update_counter_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "eventt_update_counter_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "events_update_counter_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "orders_update_counter_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "rewards_update_counter_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "tickets_update_counter_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "uef_update_counter_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "users_update_counter_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "visitors_update_counter_idx";--> statement-breakpoint
ALTER TABLE "airdrop_routines" DROP COLUMN IF EXISTS "update_counter";--> statement-breakpoint
ALTER TABLE "event_fields" DROP COLUMN IF EXISTS "update_counter";--> statement-breakpoint
ALTER TABLE "event_tickets" DROP COLUMN IF EXISTS "update_counter";--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "update_counter";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "update_counter";--> statement-breakpoint
ALTER TABLE "rewards" DROP COLUMN IF EXISTS "update_counter";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "update_counter";--> statement-breakpoint
ALTER TABLE "user_event_fields" DROP COLUMN IF EXISTS "update_counter";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "update_counter";--> statement-breakpoint
ALTER TABLE "visitors" DROP COLUMN IF EXISTS "update_counter";