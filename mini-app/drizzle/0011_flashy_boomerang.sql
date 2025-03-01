CREATE TABLE IF NOT EXISTS "users_score" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"activity_type" "users_score_activity_type",
	"point" smallint,
	"active" boolean,
	"item_id" bigint,
	"item_type" "user_score_item_type",
	"created_at" timestamp (6)
);
--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "ton_society_status" "ton_society_status_enum" DEFAULT 'NOT_CLAIMED' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_score" ADD CONSTRAINT "users_score_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_score_user_id_activity_type_active_item_id_item_type_key" ON "users_score" USING btree ("user_id","activity_type","active","item_id","item_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_score_activity_type_idx" ON "users_score" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_score_item_id_item_type_idx" ON "users_score" USING btree ("item_id","item_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_score_user_id_idx" ON "users_score" USING btree ("user_id");