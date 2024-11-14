/* -------------------------------------------------------------------------- */
/*                                   API KEY                                  */
/* -------------------------------------------------------------------------- */
const apiKeys = [
  "e4ae62d46c2e4e9267ce0cc085bccad46225aacef8f8085d90dea06784207d08",
  "7b1bb4ebea4a47b5b5c061d6269a51c517cc5251b2405eedefd2e636f4ef3266",
  "51a79c3e82d6fb3a97360a6406f955e25bd787c75a0fa37ab5383291b20c825c",
];

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
    url = `https://toncenter.com/api/v3/nft/items?owner_address=${ownerAddress}&collection_address=${collectionAddress}&limit=${limit}&offset=${offset}`;
  } else {
    url = `https://toncenter.com/api/v3/nft/items?address=${nft_address}&owner_address=${ownerAddress}`;
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
    throw new Error(`Error fetching data: ${response.statusText} , collection: ${collectionAddress} owner: ${ownerAddress} nft: ${nft_address} response: ${response.text} `  );
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
      const result = await fetchNFTItems(
        ownerAddress,
        collectionAddress,
        nft_address,
        limit,
        offset
      );
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
/*                                     END                                    */
/* -------------------------------------------------------------------------- */

const tonCenter = {
  fetchNFTItemsWithRetry,
};

export default tonCenter;
