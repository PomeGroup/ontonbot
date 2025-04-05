import { TokenCampaignNftCollections } from "@/db/schema";
import { PROBABILITY_WEIGHTS, RAFFLE_CAROUSEL_SLIDES_COUNT } from "../../GenesisOnions.constants";

export const generateWeightedArray = (
    campaigns: TokenCampaignNftCollections[],
    totalItems = RAFFLE_CAROUSEL_SLIDES_COUNT
): TokenCampaignNftCollections[] => {
    const campaignCounts = campaigns.map(campaign => ({
        campaign,
        count: Math.floor(totalItems * (getCampaignWeight(campaign) / 1))
    }));

    let countSum = campaignCounts.reduce((sum, { count }) => sum + count, 0);
    const campaignsByWeight = [...campaignCounts].sort((a, b) =>
        b.campaign.probabilityWeight - a.campaign.probabilityWeight
    );

    while (countSum < totalItems) {
        for (const item of campaignsByWeight) {
            if (countSum >= totalItems) break;
            item.count++;
            countSum++;
        }
    }

    const items: TokenCampaignNftCollections[] = [];

    if (totalItems >= campaigns.length) {
        for (const campaign of campaigns) {
            items.push(campaign);
        }
    }

    const remainingCounts = campaignCounts.map(item => ({
        campaign: item.campaign,
        count: Math.max(0, item.count - 1)
    }));

    for (const { campaign, count } of remainingCounts) {
        for (let i = 0; i < count; i++) {
            items.push(campaign);
        }
    }

    if (items.length < totalItems) {
        const needed = totalItems - items.length;
        const weightedCampaigns: TokenCampaignNftCollections[] = [];

        for (const { campaign, count } of campaignCounts) {
            for (let i = 0; i < count; i++) {
                weightedCampaigns.push(campaign);
            }
        }

        shuffleArray(weightedCampaigns);
        items.push(...weightedCampaigns.slice(0, needed));
    }

    // ✅ Shuffle the entire array to avoid grouping
    shuffleArray(items);

    return items.slice(0, totalItems);
};

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

const getCampaignWeight = (collection: TokenCampaignNftCollections) => {
    if (collection.name?.toLowerCase().includes('gold')) return PROBABILITY_WEIGHTS.GOLD
    if (collection.name?.toLowerCase().includes('silver')) return PROBABILITY_WEIGHTS.SILVER
    if (collection.name?.toLowerCase().includes('bronze')) return PROBABILITY_WEIGHTS.BRONZE

    return .1
}
