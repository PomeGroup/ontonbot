import { TokenCampaignNftCollections } from "@/db/schema";
import { PROBABILITY_WEIGHTS, RAFFLE_CAROUSEL_SLIDES_COUNT } from "../../GenesisOnions.constants";

export const generateWeightedArray = (
    campaigns: TokenCampaignNftCollections[],
    totalItems = RAFFLE_CAROUSEL_SLIDES_COUNT
): TokenCampaignNftCollections[] => {
    // Separate out one of each: Gold, Silver, Bronze
    const firstThree: TokenCampaignNftCollections[] = [];
    const remainingCampaigns: TokenCampaignNftCollections[] = [];

    const pickedTypes = new Set<string>();

    for (const campaign of campaigns) {
        const name = campaign.name?.toLowerCase() || "";
        if (name.includes("gold") && !pickedTypes.has("gold")) {
            firstThree.push(campaign);
            pickedTypes.add("gold");
        } else if (name.includes("silver") && !pickedTypes.has("silver")) {
            firstThree.push(campaign);
            pickedTypes.add("silver");
        } else if (name.includes("bronze") && !pickedTypes.has("bronze")) {
            firstThree.push(campaign);
            pickedTypes.add("bronze");
        } else {
            remainingCampaigns.push(campaign);
        }
    }

    const allCampaigns = [...campaigns];
    const campaignCounts = allCampaigns.map(campaign => ({
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

    // Build the items array excluding the first three
    const weightedItems: TokenCampaignNftCollections[] = [];

    const remainingCounts = campaignCounts.map(({ campaign, count }) => {
        const isInFirstThree = firstThree.includes(campaign);
        return {
            campaign,
            count: isInFirstThree ? Math.max(0, count - 1) : count
        };
    });

    for (const { campaign, count } of remainingCounts) {
        for (let i = 0; i < count; i++) {
            weightedItems.push(campaign);
        }
    }

    // Shuffle the remaining items
    shuffleArray(weightedItems);

    // Combine with the first 3
    const finalItems = [...firstThree.slice(0, 3), ...weightedItems];

    return finalItems.slice(0, totalItems);
};

// Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

const getCampaignWeight = (collection: TokenCampaignNftCollections) => {
    const name = collection.name?.toLowerCase() || "";
    if (name.includes('gold')) return PROBABILITY_WEIGHTS.GOLD;
    if (name.includes('silver')) return PROBABILITY_WEIGHTS.SILVER;
    if (name.includes('bronze')) return PROBABILITY_WEIGHTS.BRONZE;
    return 0.1;
};
