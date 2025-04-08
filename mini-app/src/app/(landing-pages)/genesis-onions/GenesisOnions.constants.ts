import { campaignTypes } from "@/db/schema";

export const SPIN_PRICE_IN_TON = 5
export const GENESIS_ONIONS_CAMPAIGN_TYPE = campaignTypes.enumValues[0]
export const CLEAR_PRIZE_MODAL_TIMEOUT = 5000 // ms
export const ORDER_POLLING_INTERVAL = 2000 // ms
export const GENESIS_ONIONS_PAGE_ROUTE = "/genesis-onions"
export const RAFFLE_CAROUSEL_RESULT_PADDING = 5
export const RAFFLE_CAROUSEL_SLIDES_COUNT = 30
export const PROBABILITY_WEIGHTS = {
    GOLD: 0.2,
    SILVER: .4,
    BRONZE: .5,
}
export const AFFILIATE_HASH_SEARCH_PARAM_KEY = 'affiliate'
export const AFFILIATE_HASH_LOCAL_KEY = 'genesis-onion-affiliate-id'
export const DELAY_BETWEEN_PACKAGE_ORDERS = 2000 // ms