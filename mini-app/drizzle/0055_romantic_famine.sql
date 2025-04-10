ALTER TABLE "user_wallet_balances" ALTER COLUMN "user_id" SET DATA TYPE bigint;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_wallet_balances" ADD CONSTRAINT "user_wallet_balances_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
