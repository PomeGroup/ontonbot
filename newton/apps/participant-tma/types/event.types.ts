import { PaymentType } from "./order.types";

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
  userHasTicket: boolean;
  needToUpdateTicket: boolean;
  chosenNFTaddress: string;
  orderAlreadyPlace: boolean;
  isSoldOut: boolean;
}

export interface OrganizerType {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    wallet_address: null | string;
    language_code: string;
    role: "organizer" | "admin" | "user";
    created_at: string;
    org_channel_name: string | null
    org_image: string | null
    hosted_event_count: number
  }

export interface EventDataOnlyType {
  website?: {
    label: string;
    link: string;
  };
  organizer?: OrganizerType;
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
    payment_type: PaymentType;
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
  society_hub: string;
  society_hub_id: string;
  activity_id: number;
  collection_address: string;
  secret_phrase: string;
  start_date: number;
  end_date: number;
  timezone: string;
  location: string;
  owner: number;
  hidden: boolean;
  ticketToCheckIn: boolean;
  created_at: string;
}
