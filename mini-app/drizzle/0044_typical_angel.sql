ALTER TABLE "affiliate_links" ALTER COLUMN "created_at" SET DEFAULT now
        ();--> statement-breakpoint
ALTER TABLE "affiliate_links" ALTER COLUMN "created_at" DROP NOT NULL;