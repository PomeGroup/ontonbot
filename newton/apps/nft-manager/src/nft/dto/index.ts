import { TransactionsErrorType } from "@prisma/client";
import {
  Address,
  WalletContractV3R1,
  WalletContractV3R2,
  WalletContractV4,
} from "@ton/ton";

export interface CollectionDTO {
  name: string;
  description: string;
  commonContentUrl: string;
  numerator: number;
  denominator: number;
  recipient: string;
}

export interface CollectionFiles {
  image: Express.Multer.File[];
  cover?: Express.Multer.File[];
}

export interface CollectionMetadata {
  name: string;
  description: string;
  image: Express.Multer.File;
  cover?: Express.Multer.File;
}

export interface ItemDTO {
  name: string;
  description: string;
  attributes?: Record<string, string>;
}

export interface ItemMetaData {
  name: string;
  description: string;
  image_url: string;
  attributes?: Record<string, string>;
}

export type WalletContract =
  | WalletContractV3R1
  | WalletContractV3R2
  | WalletContractV4;

export interface CollectionDeployment {
  collectionAddress: string;
  seqno: number;
}
export interface participantData {
  address: Address;
  index: bigint;
  nft_id: string;
  attributes: Record<string, string>;
}
export interface GetNftResponse {
  nft_items: NftItem[];
}

export interface NftItem {
  address: string;
  collection_address: string;
  owner_address: string;
  init: boolean;
  index: string;
  last_transaction_lt: string;
  code_hash: string;
  data_hash: string;
  content: Content;
  collection: Collection;
}

export interface Content {
  uri: string;
}

export interface Collection {
  address: string;
  owner_address: string;
  last_transaction_lt: string;
  next_item_index: string;
  collection_content: CollectionContent;
  code_hash: string;
  data_hash: string;
}

export interface CollectionContent {
  uri: string;
}
export interface GetTransactionsResponse {
  transactions: Transaction[];
  address_book: AddressBook;
}

export interface Transaction {
  account: string;
  hash: string;
  lt: string;
  now: number;
  orig_status: string;
  end_status: string;
  total_fees: string;
  prev_trans_hash: string;
  prev_trans_lt: string;
  description: string;
  block_ref: BlockRef;
  in_msg: InMsg;
  out_msgs: OutMsg[];
  account_state_before: AccountStateBefore;
  account_state_after: AccountStateAfter;
  mc_block_seqno: number;
}

export interface BlockRef {
  workchain: number;
  shard: string;
  seqno: number;
}

export interface InMsg {
  hash: string;
  source: string;
  destination: string;
  value: string;
  fwd_fee: string;
  ihr_fee: string;
  created_lt: string;
  created_at: string;
  opcode: string;
  ihr_disabled: boolean;
  bounce: boolean;
  bounced: boolean;
  import_fee: string;
  message_content: MessageContent;
  init_state: InitState;
}

export interface MessageContent {
  hash: string;
  body: string;
  decoded: Decoded;
}

export interface InitState {
  hash: string;
  body: string;
}

export interface OutMsg {
  hash: string;
  source: string;
  destination: string;
  value: string;
  fwd_fee: string;
  ihr_fee: string;
  created_lt: string;
  created_at: string;
  opcode: string;
  ihr_disabled: boolean;
  bounce: boolean;
  bounced: boolean;
  import_fee: string;
  message_content?: MessageContent2;
  init_state: InitState2;
}

export interface MessageContent2 {
  hash: string;
  body: string;
  decoded?: Decoded;
}

export interface Decoded {
  type?: "text_comment";
  comment?: string;
}

export interface InitState2 {
  hash: string;
  body: string;
}

export interface AccountStateBefore {
  hash: string;
  balance: string;
  account_status: string;
  frozen_hash: string;
  code_hash: string;
  data_hash: string;
}

export interface AccountStateAfter {
  hash: string;
  balance: string;
  account_status: string;
  frozen_hash: string;
  code_hash: string;
  data_hash: string;
}

export interface AddressBook {
  additionalProp1: AdditionalProp1;
  additionalProp2: AdditionalProp2;
  additionalProp3: AdditionalProp3;
}

export interface AdditionalProp1 {
  user_friendly: string;
}

export interface AdditionalProp2 {
  user_friendly: string;
}

export interface AdditionalProp3 {
  user_friendly: string;
}

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
}

export type UpdateOrderState =
  | "created"
  | "mint_request"
  | "minted"
  | "failed"
  | "validation_failed";

// TODO:(low priority) make the data more type safe
export class ErrorWithData extends Error {
  data: Record<string, any>;
  type: TransactionsErrorType;
  constructor(
    message: string,
    type: TransactionsErrorType,
    data?: Record<string, any>,
  ) {
    super(message);
    this.data = data;
    this.type = type;
  }
}

export type ItemTransfer = {
  query_id: string;
  nft_address: string;
  transaction_hash: string;
  transaction_lt: string;
  transaction_now: number;
  old_owner: string;
  new_owner: string;
  response_destination: string;
  custom_payload: string;
  forward_amount: string;
  forward_payload: string;
};

export type GetItemTransfersResponse = {
  nft_transfers: ItemTransfer[];
};
