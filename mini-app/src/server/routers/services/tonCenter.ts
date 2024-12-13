import axios from "axios";

/* -------------------------------------------------------------------------- */
/*                                   API KEY                                  */
/* -------------------------------------------------------------------------- */
const apiKeys = [
  "e4ae62d46c2e4e9267ce0cc085bccad46225aacef8f8085d90dea06784207d08",
  "7b1bb4ebea4a47b5b5c061d6269a51c517cc5251b2405eedefd2e636f4ef3266",
  "51a79c3e82d6fb3a97360a6406f955e25bd787c75a0fa37ab5383291b20c825c",
];

const is_mainnet = process.env.ENV == "production" || process.env.ENV == "staging";
const BASE_URL = is_mainnet ? "https://toncenter.com/api/v3" : "https://testnet.toncenter.com/api/v3";

// Function to cycle through API keys
const getApiKey = (() => {
  let index = 0;

  return function () {
    const apiKey = apiKeys[index];
    index = (index + 1) % apiKeys.length; // Update index for next call
    return apiKey;
  };
})();

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
/*                                Transactions                                */
/* -------------------------------------------------------------------------- */
interface FetchTransactionsParams {
  account: string;
  start_utime: number;
  limit: number;
  sort: "asc" | "desc";
  start_lt?: bigint;
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
      if (attempt === retries) {
        throw new Error(`fetchTransactions Failed after ${retries} attempts`);
      }
    }
  }
}

async function fetchAllTransactions(account: string, start_utime: number, limit = 100, sort = "asc") {
  let allTransactions = [];
  let offset = 0;
  while (true) {
    const response = await fetchTransactions({
      account,
      start_utime: start_utime,
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

/* -------------------------------------------------------------------------- */
/*                                     END                                    */
/* -------------------------------------------------------------------------- */

const tonCenter = {
  fetchNFTItemsWithRetry,
  fetchTransactions,
  fetchAllTransactions
};

export default tonCenter;
