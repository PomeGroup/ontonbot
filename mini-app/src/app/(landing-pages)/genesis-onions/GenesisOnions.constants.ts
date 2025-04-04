import ImageGolden from "./_assets/images/nfts/nft-gold.png";
import ImageSilver from "./_assets/images/nfts/nft-silver.png";
import ImageBronze from "./_assets/images/nfts/nft-bronze.png";
import { campaignTypes } from "@/db/schema";

export const Gold = {
    image: ImageGolden,
    name: 'Gold',
    title: "Gold @NION",
    color: {
        colorCode: '#F5DA8A',
        className: 'text-gold'
    }
}

export const Silver = {
    image: ImageSilver,
    name: 'Silver',
    title: "Silver @NION",
    color: {
        colorCode: '#DFDDDD',
        className: 'text-silver'
    }
}

export const Bronze = {
    image: ImageBronze,
    name: 'Bronze',
    title: "Bronze @NION",
    color: {
        colorCode: '#D3766A',
        className: 'text-bronze'
    }
}

export {
    ImageGolden,
    ImageSilver,
    ImageBronze,
}

export const SPIN_PRICE_IN_TON = 5

export const GENESIS_ONIONS_CAMPAIGN_TYPE = campaignTypes.enumValues[0]
export const CLEAR_PRIZE_MODAL_TIMEOUT = 5000 // ms
export const ORDER_POLLING_INTERVAL = 2000 // ms