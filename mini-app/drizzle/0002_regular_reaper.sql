-- First migration: Add nullable columns and fill data
ALTER TABLE "rewards" ADD COLUMN "event_start_date" integer;
ALTER TABLE "rewards" ADD COLUMN "event_end_date" integer;

-- Update existing records by joining with events table through visitors
UPDATE rewards r 
SET event_start_date = COALESCE(e.start_date, EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 week'))::integer),
    event_end_date = COALESCE(e.end_date, EXTRACT(EPOCH FROM NOW())::integer)
FROM visitors v 
JOIN events e ON v.event_uuid = e.event_uuid 
WHERE r.visitor_id = v.id;

-- Second migration: Make columns NOT NULL
ALTER TABLE "rewards" ALTER COLUMN "event_start_date" SET NOT NULL;
ALTER TABLE "rewards" ALTER COLUMN "event_end_date" SET NOT NULL;
