DO
$$
    BEGIN
        CREATE TYPE "api_name_enum" AS ENUM ('TONFEST', 'TS_API');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;
--> statement-breakpoint

DO
$$
    BEGIN
        CREATE TYPE "item_type_enum" AS ENUM ('EVENT', 'ALL_ITEMS');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;
--> statement-breakpoint

DO
$$
    BEGIN
        CREATE TYPE "step_name_enum" AS ENUM (
            'event_created',
            'event_updated',
            'payment_completed',
            'order_completed',
            'event_completed', -- Note: appears twice in your list
            'event_started',
            'event_ended'
            );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;
--> statement-breakpoint

DO
$$
    BEGIN
        CREATE TYPE "callback_task_run_status_enum" AS ENUM ('PENDING', 'SUCCESS', 'FAILURE');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "callback_task_runs"
(
    "id"               serial PRIMARY KEY                                        NOT NULL,
    "run_uuid"         uuid                            DEFAULT gen_random_uuid() NOT NULL,
    "callback_task_id" integer                                                   NOT NULL,
    "status"           "callback_task_run_status_enum" DEFAULT 'PENDING'         NOT NULL,
    "payload"          json,
    "response"         json,
    "attempts"         integer                         DEFAULT 0                 NOT NULL,
    "created_at"       timestamp                       DEFAULT now(),
    "updated_at"       timestamp(3),
    "updated_by"       text                            DEFAULT 'system'          NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "callback_tasks"
(
    "id"               serial PRIMARY KEY                  NOT NULL,
    "task_uuid"        uuid      DEFAULT gen_random_uuid() NOT NULL,
    "step_name"        "step_name_enum"                    NOT NULL,
    "api_name"         "api_name_enum"                     NOT NULL,
    "endpoint"         text,
    "payload_template" json,
    "active"           boolean   DEFAULT true              NOT NULL,
    "retry_policy"     json,
    "item_type"        "item_type_enum"                    NOT NULL,
    "item_id"          bigint,
    "created_at"       timestamp DEFAULT now(),
    "updated_at"       timestamp(3),
    "updated_by"       text      DEFAULT 'system'          NOT NULL
);
--> statement-breakpoint
DO
$$
    BEGIN
        ALTER TABLE "callback_task_runs"
            ADD CONSTRAINT "callback_task_runs_callback_task_id_callback_tasks_id_fk" FOREIGN KEY ("callback_task_id") REFERENCES "public"."callback_tasks" ("id") ON DELETE no action ON UPDATE no action;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_task_runs_run_uuid_idx" ON "callback_task_runs" USING btree ("run_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_task_runs_callback_task_id_idx" ON "callback_task_runs" USING btree ("callback_task_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "callback_task_runs_run_uuid_unique" ON "callback_task_runs" USING btree ("run_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_tasks_task_uuid_idx" ON "callback_tasks" USING btree ("task_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_tasks_step_name_idx" ON "callback_tasks" USING btree ("step_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_tasks_api_name_idx" ON "callback_tasks" USING btree ("api_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_tasks_item_type_idx" ON "callback_tasks" USING btree ("item_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "callback_tasks_item_id_idx" ON "callback_tasks" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "callback_tasks_task_uuid_unique" ON "callback_tasks" USING btree ("task_uuid");