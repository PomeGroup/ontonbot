CREATE TABLE IF NOT EXISTS "token_campaign_eligible_users" (
	"user_telegram_id" bigint PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now()
);
