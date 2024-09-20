import { events, rewards, visitors } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { TONSOcietyAPISchemaT } from "./ton-society-api-types";

export type TonSocietyRegisterActivityT = {
  title: string;
  subtitle: string;
  additional_info?: string;
  description: string;
  hub_id: number;
  start_date: string;
  end_date: string;
  cta_button?: {
    label: string;
    link: string;
  };
  rewards?: TONSOcietyAPISchemaT["RewardsManualMint"];
};

export type TonSocietyRegisterActivityResponse = {
  status: "success" | "failed";
  data: {
    activity_id: number;
    activity_url: string;
  };
};

export type RewardType = InferSelectModel<typeof rewards>;
export type VisitorsType = InferSelectModel<typeof visitors>;
export type EventType = InferSelectModel<typeof events>;

export type OntonEvent = {
  eventUuid: string;
  title?: string;
  startDate: number;
  endDate: number;
  location?: string;
  imageUrl?: string;
  subtitle?: string;
  organizerFirstName?: string;
  organizerLastName?: string;
  organizerUsername?: string;
  organizerUserId?: number;
  ticketToCheckIn?: boolean;
  timezone?: string;
  website?: string | null;
  reservedCount?: number;
  visitorCount?: number;
  ticketPrice?: number;
  city?: string;
  country?: string;
  participationType?: string;
};
