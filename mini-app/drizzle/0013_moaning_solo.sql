DO
$$
    BEGIN
        CREATE TYPE "http_method_enum" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;
ALTER TABLE "callback_tasks"
    ADD COLUMN "method" "http_method_enum" DEFAULT 'POST' NOT NULL;--> statement-breakpoint
ALTER TABLE "callback_tasks"
    ADD COLUMN "headers" json;