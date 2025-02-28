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

export interface TonSocietyActivityFullResponse {
  status: string; // typically "success" or "error"
  data: {
    title: string;
    subtitle: string;
    description: string;
    link: string;
    public_path: string;
    additional_info: string;
    start_date: string; // e.g. "2024-12-02"
    end_date: string; // e.g. "2024-12-09"
    publishedAt?: string;
    rewards?: {
      mint_type?: string;
      collection?: {
        cover?: {
          url: string;
        };
        image?: {
          url: string;
        };
        title?: string;
        description?: string;
        item_image?: {
          url: string;
        };
        item_title?: string;
        item_description?: string;
        item_metadata?: {
          activity_type?: string;
          place?: {
            type?: string;
            venue_name?: string;
          };
        };
        item_video?: {
          url: string;
        };
      };
      collection_address?: string; // might not exist in all cases
      hub?: {
        id: number;
      };
    };
    join_button?: {
      title?: string;
      link?: string;
    };
  };
}

export type RewardType = InferSelectModel<typeof rewards>;
export type VisitorsType = InferSelectModel<typeof visitors>;
export type EventType = InferSelectModel<typeof events>;
export type EventTypeSecure = Omit<EventType, "wallet_address" | "wallet_seed_phrase" | "secret_phrase">;
