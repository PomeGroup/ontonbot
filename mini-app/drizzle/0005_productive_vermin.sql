DO $$ BEGIN
 CREATE TYPE "public"."event_poa_result_status" AS ENUM('REPLIED', 'EXPIRED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "event_poa_results" ALTER COLUMN "status" SET DATA TYPE event_poa_result_status;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_user_id_type_item_id_item_type_key" ON "notifications" USING btree ("user_id","type","item_id","item_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_expires_at_idx" ON "notifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_item_id_item_type_idx" ON "notifications" USING btree ("item_id","item_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" USING btree ("type");