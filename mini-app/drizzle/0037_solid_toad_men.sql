-- Custom SQL migration file, put you code below! --
-- 1) token_campaign_nft_collections
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1
                       FROM pg_class
                       WHERE relkind = 'S'
                         AND relname = 'token_campaign_nft_collections_id_seq') THEN
            CREATE SEQUENCE "token_campaign_nft_collections_id_seq";
        END IF;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;

SELECT setval(
               'token_campaign_nft_collections_id_seq',
               COALESCE((SELECT MAX("id") + 1 FROM "token_campaign_nft_collections"), 1),
               false
       );

ALTER TABLE "token_campaign_nft_collections"
    ALTER COLUMN "id" SET DEFAULT nextval('token_campaign_nft_collections_id_seq');


-- 2) token_campaign_orders
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1
                       FROM pg_class
                       WHERE relkind = 'S'
                         AND relname = 'token_campaign_orders_id_seq') THEN
            CREATE SEQUENCE "token_campaign_orders_id_seq";
        END IF;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;

SELECT setval(
               'token_campaign_orders_id_seq',
               COALESCE((SELECT MAX("id") + 1 FROM "token_campaign_orders"), 1),
               false
       );

ALTER TABLE "token_campaign_orders"
    ALTER COLUMN "id" SET DEFAULT nextval('token_campaign_orders_id_seq');


-- 3) token_campaign_spin_packages
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1
                       FROM pg_class
                       WHERE relkind = 'S'
                         AND relname = 'token_campaign_spin_packages_id_seq') THEN
            CREATE SEQUENCE "token_campaign_spin_packages_id_seq";
        END IF;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;

SELECT setval(
               'token_campaign_spin_packages_id_seq',
               COALESCE((SELECT MAX("id") + 1 FROM "token_campaign_spin_packages"), 1),
               false
       );

ALTER TABLE "token_campaign_spin_packages"
    ALTER COLUMN "id" SET DEFAULT nextval('token_campaign_spin_packages_id_seq');


-- 4) token_campaign_user_collections
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1
                       FROM pg_class
                       WHERE relkind = 'S'
                         AND relname = 'token_campaign_user_collections_id_seq') THEN
            CREATE SEQUENCE "token_campaign_user_collections_id_seq";
        END IF;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;

SELECT setval(
               'token_campaign_user_collections_id_seq',
               COALESCE((SELECT MAX("id") + 1 FROM "token_campaign_user_collections"), 1),
               false
       );

ALTER TABLE "token_campaign_user_collections"
    ALTER COLUMN "id" SET DEFAULT nextval('token_campaign_user_collections_id_seq');


-- 5) token_campaign_user_spins
DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1
                       FROM pg_class
                       WHERE relkind = 'S'
                         AND relname = 'token_campaign_user_spins_id_seq') THEN
            CREATE SEQUENCE "token_campaign_user_spins_id_seq";
        END IF;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;

SELECT setval(
               'token_campaign_user_spins_id_seq',
               COALESCE((SELECT MAX("id") + 1 FROM "token_campaign_user_spins"), 1),
               false
       );

ALTER TABLE "token_campaign_user_spins"
    ALTER COLUMN "id" SET DEFAULT nextval('token_campaign_user_spins_id_seq');
-- End of custom SQL migration file --