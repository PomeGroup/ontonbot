CREATE TABLE IF NOT EXISTS "user_wallet_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"wallet_address" text NOT NULL,
	"place_of_connection" "campaign_type" NOT NULL,
	"last_balance" numeric(30, 0) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
