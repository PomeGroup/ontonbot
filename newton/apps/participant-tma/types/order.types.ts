export type PaymentType = "TON" | "USDT";
export interface GetOrderResponse {
  user_id: number | null;
  created_at: Date | null;
  event_uuid: string | null;
  count: number | null;
  uuid: string;
  transaction_id: string | null;
  total_price: string | null;
  state: UpdateOrderState | null;
  failed_reason: string | null;
  nft_collection_address: string;
  payment_type: PaymentType;
}

export type UpdateOrderState = "created" | "mint_request" | "minted" | "failed" | "validation_failed";
