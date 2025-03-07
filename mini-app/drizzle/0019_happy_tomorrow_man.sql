CREATE SEQUENCE "public"."affiliate_links_id_seq"
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START 1
    CACHE 1;

CREATE SEQUENCE "public"."affiliate_click_id_seq"
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START 1
    CACHE 1;

CREATE TYPE "public"."affiliate_item_type" AS ENUM (
    'EVENT'
    );

CREATE TABLE IF NOT EXISTS "affiliate_click"
(
    "id"               integer PRIMARY KEY NOT NULL,
    "affiliate_lnk_id" bigint              NOT NULL,
    "user_id"          bigint              NOT NULL,
    "created_at"       timestamp(6)        NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "affiliate_links"
(
    "id"                 bigint PRIMARY KEY DEFAULT nextval
                                                    ('affiliate_links_id_seq'::regclass) NOT NULL,
    "Item_id"            bigint                                                          NOT NULL,
    "item_type"          "affiliate_item_type"                                           NOT NULL,
    "creator_user_id"    bigint                                                          NOT NULL,
    "title"              varchar(255),
    "group_title"        varchar(255),
    "link_hash"          varchar(255)                                                    NOT NULL,
    "total_clicks"       bigint             DEFAULT 0,
    "total_purchase"     bigint             DEFAULT 0,
    "active"             boolean            DEFAULT true                                 NOT NULL,
    "affiliator_user_id" bigint                                                          NOT NULL,
    "created_at"         date                                                            NOT NULL,
    "updated_at"         date
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_click_affiliate_link_id_idx" ON "affiliate_click" USING btree ("affiliate_lnk_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_click_user_id_idx" ON "affiliate_click" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_links_link_hash_key" ON "affiliate_links" USING btree ("link_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_links_Item_id_item_type_idx" ON "affiliate_links" USING btree ("Item_id", "item_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_links_affiliator_user_id_idx" ON "affiliate_links" USING btree ("affiliator_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_links_creator_user_id_idx" ON "affiliate_links" USING btree ("creator_user_id");