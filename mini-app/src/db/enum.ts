import { pgEnum } from "drizzle-orm/pg-core";

export const eventParticipationType = pgEnum("event_participation_type", ["in_person", "online"]);
export const rewardType = pgEnum("reward_types", ["ton_society_sbt"]);
export const rewardStatus = pgEnum("reward_status", [
  "pending_creation",
  "created",
  "created_by_ui",
  "received",
  "notified",
  "notified_by_ui",
  "notification_failed",
  "failed",
  "fixed_failed",
]);
export const ticketStatus = pgEnum("event_ticket_status", ["MINTING", "USED", "UNUSED"]);

export const orderState = pgEnum("order_state", [
  "created",
  "mint_request",
  "minted",
  "failed",
  "validation_failed",
]);
export const developmentEnvironment = pgEnum("development_environment", [
  "local",
  "development",
  "staging",
  "production",
]);

// Type Exports
export type EventParticipationType = (typeof eventParticipationType.enumValues)[number];
export type RewardType = (typeof rewardType.enumValues)[number];
export type RewardStatus = (typeof rewardStatus.enumValues)[number];
export type TicketStatus = (typeof ticketStatus.enumValues)[number];
export type OrderState = (typeof orderState.enumValues)[number];
export type DevelopmentEnvironment = (typeof developmentEnvironment.enumValues)[number];
