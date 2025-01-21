DO $$ BEGIN
 CREATE TYPE "public"."user_flags_enum" AS ENUM('event_moderator', 'ton_society_verified');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_custom_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"user_flag" "user_flags_enum" NOT NULL,
	"value" text,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_custom_flags" ADD CONSTRAINT "user_custom_flags_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_custom_flags_user_id_user_flag_index" ON "user_custom_flags" USING btree ("user_id","user_flag");