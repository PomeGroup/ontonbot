import { ReactNode } from "react";

export type TicketType = {
  id: number;
  full_name: string;
  telegram: string;
  company: string;
  position: string;
  status: string;
  nftAddress: string | null;
  event_uuid: string;
  ticket_id: number;
  user_id: number;
  order_uuid: string;
  created_at: string;
  ticketData: {
    id: number;
    event_uuid: string | null;
    title: string;
    description: string;
    price: number;
    ticketImage: string;
    count: number;
    collectionAddress: string | null;
    created_at: string;
  };
  needsInfoUpdate: boolean;
};

export type TicketAttributes = [string, ReactNode][];
