-- Custom SQL migration file, put you code below! --
CREATE SEQUENCE "public"."sbt_reward_collections_id_seq"
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START 1
    CACHE 1;

ALTER TABLE sbt_reward_collections
    ALTER COLUMN id SET DEFAULT nextval('sbt_reward_collections_id_seq'::regclass);