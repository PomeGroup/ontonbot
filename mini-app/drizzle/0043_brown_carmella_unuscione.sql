DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1
                       FROM pg_enum
                       WHERE enumlabel = 'onion1-campaign'
                         AND enumtypid = (SELECT oid
                                          FROM pg_type
                                          WHERE typname = 'affiliate_item_type')) THEN
            ALTER TYPE affiliate_item_type ADD VALUE 'onion1-campaign';
        END IF;
    END
$$;
