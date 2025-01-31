DO $$ BEGIN
 CREATE TYPE "public"."access_role" AS ENUM('owner', 'admin', 'checkin_officer');
 CREATE TYPE "public"."item_type" AS ENUM (
     'event'
     );
 CREATE TYPE "public"."user_role_status" AS ENUM (
     'active',
     'deactive'
     );
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"item_id" bigint NOT NULL,
	"item_type" "item_type" NOT NULL,
	"user_id" bigint NOT NULL,
	"role" "access_role" NOT NULL,
	"status" "user_role_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	CONSTRAINT "user_roles_item_id_item_type_user_id_role_pk" PRIMARY KEY("item_id","item_type","user_id","role")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_item_id_item_type_idx" ON "user_roles" USING btree ("item_id","item_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");