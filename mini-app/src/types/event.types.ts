import { rewards, visitors } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { TONSOcietyAPISchemaT } from "./ton-society-api-types";
import { z } from "zod";

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

export interface EventType extends EventDataOnlyType {
  organizer: {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    wallet_address: null | string;
    language_code: string;
    role: "organizer" | "admin" | "user";
    created_at: string;
  };
  eventTicket?: {
    created_at: Date | null;
    event_id: number;
    title: string;
    description: string;
    id: number;
    price: number;
    ticketImage: string;
    count: number;
    collectionAddress: string | null;
  };
  userTicket?: {
    status: "USED" | "UNUSED" | null;
    user_id: number | null;
    name: string | null;
    created_at: Date | null;
    event_uuid: string | null;
    id: number;
    telegram: string | null;
    company: string | null;
    position: string | null;
    nftAddress: string | null;
    ticket_id: number;
  };
  orderAlreadyPlace: boolean;
  isSoldOut: boolean;
}

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

export interface EventDataOnlyType {
  website?: {
    label: string;
    link: string;
  };
  event_id: number;
  event_uuid: string;
  type: number;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  wallet_address: string;
  wallet_seed_phrase: string;
  society_hub_id: string;
  collection_address: string;
  secret_phrase: string;
  timezone: string;
  location: string;
  owner: number;
  hidden: boolean;
  created_at: string;
  participationType?: "in_person" | "online"; // Add this field
  society_hub: {
    id: number | string | null;
    name: string | null;
  };
  dynamic_fields: any[];
  activity_id: number | null;
  organizer: any;
  eventTicket?: any;
  isSoldOut?: boolean;
  userOrder?: any;
  userTicket?: any;
  ticketToCheckIn?: boolean;
  start_date?: Date | null;
  end_date?: Date | null;
}

export const EventSchema = z.object({
  type: z.number().nullable(),
  event_uuid: z.string(),
  event_id: z.number(),
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  tsRewardImage: z.string().nullable(),
  society_hub: z
    .object({
      id: z.union([z.string(), z.number(), z.null()]),
      name: z.string().nullable(),  // Ensure `name` is nullable in the Zod schema
    })
    .nullable(),  // Allow `society_hub` to be nullable
}).nullable(); // Allow entire event object to be nullable








