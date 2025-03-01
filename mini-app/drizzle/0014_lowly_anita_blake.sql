-- 1) Create the "task_function_enum" type if it doesn't already exist
DO
$$
    BEGIN
        CREATE TYPE "task_function_enum" AS ENUM (
            'addUserTicketFromOnton',
            'anotherFunctionName'
            -- Add more enum variants as needed
            );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;
--> statement-breakpoint

-- 2) Add the "task_function" column to "callback_tasks" using the new enum
ALTER TABLE "callback_tasks"
    ADD COLUMN "task_function" "task_function_enum" NOT NULL;
--> statement-breakpoint

-- 3) Drop "endpoint" and "headers" if they exist
ALTER TABLE "callback_tasks"
    DROP COLUMN IF EXISTS "endpoint";
--> statement-breakpoint

ALTER TABLE "callback_tasks"
    DROP COLUMN IF EXISTS "headers";
