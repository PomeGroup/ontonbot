--> statement-breakpoint
DROP INDEX IF EXISTS "event_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "created_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "title_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "type_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "event_uuid_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "price_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "collection_address_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "wallet_address_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "society_hub_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "start_date_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "end_date_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "owner_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "hidden_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "event_ticket_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "transaction_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "state_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "telegram_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "full_name_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "company_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "owner_address_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "visitor_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "name_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "order_uuid_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "nft_address_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "ticket_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "event_field_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "completed_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "username_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "role_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "last_visit_idx";--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "event_uuid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "visitors" ALTER COLUMN "event_uuid" SET NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airdrop_event_id_idx" ON "airdrop_routines" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airdrop_user_id_idx" ON "airdrop_routines" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airdrop_status_idx" ON "airdrop_routines" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airdrop_created_at_idx" ON "airdrop_routines" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventf_title_idx" ON "event_fields" ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventf_type_idx" ON "event_fields" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventf_event_id_idx" ON "event_fields" ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_event_uuid_idx" ON "event_tickets" ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_title_idx" ON "event_tickets" ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_price_idx" ON "event_tickets" ("price");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_collection_address_idx" ON "event_tickets" ("collection_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eventt_created_at_idx" ON "event_tickets" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_event_uuid_idx" ON "events" ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_type_idx" ON "events" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_title_idx" ON "events" ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_wallet_address_idx" ON "events" ("wallet_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_society_hub_idx" ON "events" ("society_hub");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_start_date_idx" ON "events" ("start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_end_date_idx" ON "events" ("end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_owner_idx" ON "events" ("owner");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_hidden_idx" ON "events" ("hidden");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_created_at_idx" ON "events" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_event_uuid_idx" ON "orders" ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_user_id_idx" ON "orders" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_event_ticket_id_idx" ON "orders" ("event_ticket_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_transaction_id_idx" ON "orders" ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_state_idx" ON "orders" ("state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_telegram_idx" ON "orders" ("telegram");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_full_name_idx" ON "orders" ("full_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_company_idx" ON "orders" ("company");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_owner_address_idx" ON "orders" ("owner_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_visitor_id_idx" ON "rewards" ("visitor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_type_idx" ON "rewards" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_status_idx" ON "rewards" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rewards_created_at_idx" ON "rewards" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_name_idx" ON "tickets" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_telegram_idx" ON "tickets" ("telegram");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_company_idx" ON "tickets" ("company");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_order_uuid_idx" ON "tickets" ("order_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "tickets" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_nft_address_idx" ON "tickets" ("nft_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_event_uuid_idx" ON "tickets" ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_ticket_id_idx" ON "tickets" ("event_ticket_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_user_id_idx" ON "tickets" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_created_at_idx" ON "tickets" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_event_field_id_idx" ON "user_event_fields" ("event_field_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_user_id_idx" ON "user_event_fields" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_completed_idx" ON "user_event_fields" ("completed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uef_created_at_idx" ON "user_event_fields" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_wallet_address_idx" ON "users" ("wallet_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_user_id_idx" ON "visitors" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_event_uuid_idx" ON "visitors" ("event_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_last_visit_idx" ON "visitors" ("last_visit");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitors_created_at_idx" ON "visitors" ("created_at");
