CREATE TABLE IF NOT EXISTS "sbt_reward_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"hubID" integer,
	"hubName" varchar,
	"videoLink" varchar,
	"imageLink" varchar
);
