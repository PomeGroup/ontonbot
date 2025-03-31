ALTER TABLE "orders"
    ADD COLUMN "default_price" real DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "orders"
SET "default_price" = "total_price";--> statement-breakpoint
ALTER TABLE "orders"
    ADD COLUMN "coupon_id" bigint;--> statement-breakpoint
DO
$$
    BEGIN
        ALTER TABLE "orders"
            ADD CONSTRAINT "orders_coupon_id_coupon_items_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon_items" ("id") ON DELETE no action ON UPDATE no action;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_coupon_id_idx" ON "orders" USING btree ("coupon_id");