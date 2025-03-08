ALTER TABLE "event_registrants"
    ADD COLUMN "telegram_invite_link" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "events"
    ADD COLUMN "event_telegram_group" bigint;