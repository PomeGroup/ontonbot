import { Address, Cell } from "@ton/core";
import axios from "axios";
import { TonClient} from "@ton/ton";


export const is_mainnet = process.env.ENV?.toLowerCase() == "production" || process.env.ENV?.toLowerCase() == "staging";
// export const is_mainnet = false;
/* -------------------------------------------------------------------------- */
/*                                   API KEY                                  */
/* -------------------------------------------------------------------------- */
const apiKeys = is_mainnet
  ? [
      "e4ae62d46c2e4e9267ce0cc085bccad46225aacef8f8085d90dea06784207d08",
      "7b1bb4ebea4a47b5b5c061d6269a51c517cc5251b2405eedefd2e636f4ef3266",
      "51a79c3e82d6fb3a97360a6406f955e25bd787c75a0fa37ab5383291b20c825c",
      "56f164ae58ab79ade2d4ae1ecb5a1717c320f69aa9b3c52c6069c90a9bbc7552",
    ]
  : [
      "5481fc1517a904264da06f24f66c1b7a67ff11b4f5847f3942e3526c998bb9f1",
      "1dd90a08cac83c13d27078fdb5f73752b393c8db47d9bf959d288fe486b9bcd1",
    ];

const BASE_URL = is_mainnet ? "https://toncenter.com/api/v3" : "https://testnet.toncenter.com/api/v3";
//user contract address
const USDT_CADDRESS = is_mainnet
  ? "0:0:B113A994B5024A16719F69139328EB759596C38A25F59028B146FECDC3621DFE"
  : "0:F418A04CF196EBC959366844A6CDF53A6FD6FFF1EADAFC892F05210BBA31593E";

const ORDER_PREFIX = "onton_order=";
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

// Function to cycle through API keys
export const getApiKey = (() => {
  let index = 0;

  return function () {
    const apiKey = apiKeys[index];
    index = (index + 1) % apiKeys.length; // Update index for next call
    return apiKey;
  };
})();

export function v2_client(){
  const toncenterBaseEndpoint: string = !is_mainnet ? "https://testnet.toncenter.com" : "https://toncenter.com";

  const client = new TonClient({
    endpoint: `${toncenterBaseEndpoint}/api/v2/jsonRPC`,
    apiKey: getApiKey(),
  });

  return client;
}

/* -------------------------------------------------------------------------- */
/*                                  FETCH NFT                                 */
/* -------------------------------------------------------------------------- */

export interface NFTItem {
  address: string;
  init: boolean;
  index: string;
  collection_address: string;
  owner_address: string;
  content: {
    uri: string;
  };
  last_transaction_lt: string;
  code_hash: string;
  data_hash: string;
  collection: {
    address: string;
    owner_address: string;
    last_transaction_lt: string;
    next_item_index: string;
    collection_content: {
      uri: string;
    };
    data_hash: string;
    code_hash: string;
  };
}

interface AddressBook {
  [key: string]: {
    user_friendly: string;
  };
}

interface TonCenterResponse {
  nft_items: NFTItem[];
  address_book: AddressBook;
}

// Function to fetch NFT items
async function fetchNFTItems(
  ownerAddress: string,
  collectionAddress: string,
  nft_address: string = "",
  limit: number = 100,
  offset: number = 0
): Promise<TonCenterResponse> {
  let url: string = "";
  if (!nft_address) {
    url = `${BASE_URL}/nft/items?owner_address=${ownerAddress}&collection_address=${collectionAddress}&limit=${limit}&offset=${offset}`;
  } else {
    url = `${BASE_URL}/nft/items?address=${nft_address}&owner_address=${ownerAddress}`;
  }

  const apiKey = getApiKey();
  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "X-Api-Key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Error fetching data: ${response.statusText} , collection: ${collectionAddress} owner: ${ownerAddress} nft: ${nft_address} response: ${response.text} `
    );
  }

  const data: TonCenterResponse = await response.json();
  return data;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to fetch NFT items with retry
async function fetchNFTItemsWithRetry(
  ownerAddress: string,
  collectionAddress: string,
  nft_address: string = "",
  limit: number = 100,
  offset: number = 0,
  retries: number = 3, // Number of retries
  delayMs: number = 1000 // Delay between retries (in milliseconds)
): Promise<TonCenterResponse | undefined> {
  let attempt = 0;

  while (attempt < retries) {
    try {
      // Call fetchNFTItems function
      const result = await fetchNFTItems(ownerAddress, collectionAddress, nft_address, limit, offset);
      return result; // Return the result if successful
    } catch (error) {
      attempt++;
      if (attempt >= retries) {
        throw new Error(`Failed after ${retries} retries: ${error}`);
      }
      console.log(`Retrying... Attempt ${attempt} of ${retries}`);
      await delay(delayMs); // Wait before retrying
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                Jetton Wallet                               */
/* -------------------------------------------------------------------------- */

async function getJettonWallet(address: string, retries: number = 3, limit = 1, offset = 0) {
  const endpoint = `${BASE_URL}/jetton/wallets`;
  const params: Record<string, any> = { address, limit, offset };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const apiKey = getApiKey();
      const response = await axios.get(endpoint, {
        params,
        headers: { accept: "application/json", "X-Api-Key": apiKey },
      });
      return response.data;
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`getJettonWallet Failed after ${retries} attempts`);
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                Transactions                                */
/* -------------------------------------------------------------------------- */
interface FetchTransactionsParams {
  account: string;
  start_utime: number | null;
  limit: number;
  sort: "asc" | "desc";
  start_lt: bigint | null;
  retries?: number;
  offset?: number;
}

async function fetchTransactions({
  account,
  start_utime,
  limit,
  sort,
  start_lt,
  offset = 0,
  retries = 3, // Default retry count
}: FetchTransactionsParams): Promise<any> {
  const endpoint = `${BASE_URL}/transactions`;
  const params: Record<string, any> = { account, limit, offset, sort };
  if (start_lt) {
    params.start_lt = start_lt;
  } else if (start_utime) {
    params.start_utime = start_utime;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const apiKey = getApiKey();
      const response = await axios.get(endpoint, {
        params,
        headers: { accept: "application/json", "X-Api-Key": apiKey },
      });
      return response.data;
    } catch (error) {
      await delay(50);
      if (attempt === retries) {
        throw error;
        throw new Error(`fetchTransactions Failed after ${retries} attempts`);
      }
    }
  }
}

async function fetchAllTransactions(
  account: string,
  start_utime: number | null = null,
  start_lt: bigint | null = null,
  limit = 100,
  sort = "asc"
) {
  let allTransactions = [];
  let offset = 0;
  while (true) {
    const response = await fetchTransactions({
      account,
      start_utime,
      start_lt,
      limit,
      sort: sort as "asc" | "desc",
      offset: offset,
    });

    if (!response || !response.transactions || response.transactions.length === 0) {
      break;
    }

    allTransactions.push(...response.transactions);

    offset += limit;
  }

  return allTransactions;
}

// Parse Jetton transactions
// Check if this jetton transactions have comment and if they do
// Add the comment and jetton type to transaction
type Transaction = Record<string, any>;
type InMsg = {
  source: string | null;
  destination: string | null;
  opcode: string;
  value: number;
  created_at: string;
  message_content: {
    hash: string;
    body: string;
    decoded: {
      type: string;
      comment: string;
    };
  };
};
type OrderTransaction = {
  value: number;
  order_uuid: string;
  order_type: "TON" | "USDT";
  verfied: boolean;
  owner: Address;
};

async function parseTransactions(transactions: Transaction[]) {
  const orders: OrderTransaction[] = [];
  for (const trx of transactions) {
    // console.log(trx.hash);
    const in_msg: InMsg | null = trx?.in_msg;
    if (!in_msg) continue;

    const source = in_msg.source;
    const destination = in_msg.destination;
    const message_content = in_msg.message_content;
    const created_at = in_msg.created_at;
    const opcode = in_msg.opcode;

    if (!source || !destination || opcode === undefined || opcode === null || !message_content) continue;

    if (opcode === "0x00000000") {
      //Ton Transfer with comment
      const decoded = message_content.decoded;
      if (decoded) {
        const comment = decoded.comment;
        // console.log(comment);
        if (comment.startsWith(ORDER_PREFIX)) {
          orders.push({
            order_uuid: comment.replace(ORDER_PREFIX, ""),
            value: in_msg.value / 1e9,
            order_type: "TON",
            verfied: true,
            owner: Address.parse(source),
          });
        }
      }
    } else if (opcode === "0x7362d09c") {
      const cell = Cell.fromBase64(in_msg.message_content.body);
      const originalBody = cell.beginParse();
      let body = originalBody.clone();
      const op = body.loadUint(32);
      if (op !== 0x7362d09c) continue;
      // if opcode is 0x7362d09c: it's a Jetton transfer notification

      body.skip(64); // skip query_id
      const jettonAmount = body.loadCoins();
      const jettonSender = body.loadAddressAny();
      const originalForwardPayload = body.loadBit() ? body.loadRef().beginParse() : body;
      let forwardPayload = originalForwardPayload.clone();

      // IMPORTANT: we have to verify the source of this message because it can be faked
      const jetton_wallet_data = await getJettonWallet(source);
      let jetton_master = "";
      if (jetton_wallet_data?.jetton_wallets) {
        if (jetton_wallet_data?.jetton_wallets[0].jetton) {
          jetton_master = jetton_wallet_data.jetton_wallets[0].jetton;
        }
      }
      // console.log("jetton_master" , jetton_master)

      if (forwardPayload.remainingBits > 32) {
        const forwardOp = forwardPayload.loadUint(32);
        if (forwardOp == 0) {
          // if forward payload opcode is 0: it's a simple Jetton transfer with comment
          const comment = forwardPayload.loadStringTail();
          // console.log('jetton commnet ====>' , comment , comment.startsWith(ORDER_PREFIX))
          // console.log(jetton_master , USDT_CADDRESS)
          if (comment.startsWith(ORDER_PREFIX)) {
            orders.push({
              order_uuid: comment.replace(ORDER_PREFIX, ""),
              value: Number(jettonAmount) / 1e6,
              order_type: "USDT",
              verfied: jetton_master === USDT_CADDRESS,
              owner: Address.parse(jettonSender?.toString()!),
            });
          }
        }
      }

      //Jetton transfer with comment
    }
  }
  return orders;
}

/* -------------------------------------------------------------------------- */
/*                                     END                                    */
/* -------------------------------------------------------------------------- */

const tonCenter = {
  fetchNFTItemsWithRetry,
  fetchTransactions,
  fetchAllTransactions,
  parseTransactions,
};

export default tonCenter;
