DO $$ BEGIN
 CREATE TYPE "public"."ticket_types" AS ENUM('OFFCHAIN', 'NFT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
