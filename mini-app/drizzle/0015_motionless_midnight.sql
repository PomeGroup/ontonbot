DO $$ BEGIN
 CREATE TYPE "public"."development_environment" AS ENUM('local', 'development', 'staging', 'production');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onton_setting" (
	"env" "development_environment" NOT NULL,
	"var" varchar(255) NOT NULL,
	"value" text,
	"protected" boolean DEFAULT true,
	CONSTRAINT "onton_setting_env_var_pk" PRIMARY KEY("env","var")
);
