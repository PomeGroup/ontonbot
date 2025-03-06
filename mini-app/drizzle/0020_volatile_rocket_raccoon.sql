ALTER TABLE "affiliate_click" ALTER COLUMN "id" SET DEFAULT nextval
        ('affiliate_click_id_seq'::regclass);