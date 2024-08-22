import {pgEnum} from "drizzle-orm/pg-core";

export const eventParticipationType = pgEnum("event_participation_type", [
    "in_person",
    "online",
]);
export const rewardType = pgEnum("reward_types", ["ton_society_sbt"]);
export const rewardStatus = pgEnum("reward_status", [
    "pending_creation",
    "created",
    "received",
    "notified",
    "notification_failed",
    "failed",
]);
export const ticketStatus = pgEnum("event_ticket_status", [
    "MINTING",
    "USED",
    "UNUSED",
]);
export const orderState = pgEnum("order_state", [
    "created",
    "mint_request",
    "minted",
    "failed",
    "validation_failed",
]);