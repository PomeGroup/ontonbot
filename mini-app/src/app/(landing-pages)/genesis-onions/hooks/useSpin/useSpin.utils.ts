import { TokenCampaignNftCollections } from "@/db/schema";

export const generateWeightedArray = (
    campaigns: TokenCampaignNftCollections[],
    totalItems = 30
): TokenCampaignNftCollections[] => {
    // Calculate total weight
    const totalWeight = campaigns.reduce((sum, campaign) => sum + campaign.probabilityWeight, 0);

    // Calculate counts for each campaign
    const campaignCounts = campaigns.map(campaign => ({
        campaign,
        count: Math.floor(totalItems * (campaign.probabilityWeight / totalWeight))
    }));

    // Adjust counts to reach exactly totalItems
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

    // Generate the items array
    const items: TokenCampaignNftCollections[] = [];

    // Add first occurrence of each campaign (if we have space)
    if (totalItems >= campaigns.length) {
        for (const campaign of campaigns) {
            items.push(campaign);
        }
    }

    // Add remaining items according to their weights
    const remainingCounts = campaignCounts.map(item => ({
        campaign: item.campaign,
        count: Math.max(0, item.count - 1) // Subtract the first occurrence we already added
    }));

    for (const { campaign, count } of remainingCounts) {
        for (let i = 0; i < count; i++) {
            items.push(campaign);
        }
    }

    // If we didn't have space for all first occurrences, just fill with weighted distribution
    if (items.length < totalItems) {
        const needed = totalItems - items.length;
        const weightedCampaigns: TokenCampaignNftCollections[] = [];

        for (const { campaign, count } of campaignCounts) {
            for (let i = 0; i < count; i++) {
                weightedCampaigns.push(campaign);
            }
        }

        // Shuffle and take needed items
        for (let i = weightedCampaigns.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [weightedCampaigns[i], weightedCampaigns[j]] = [weightedCampaigns[j], weightedCampaigns[i]];
        }

        items.push(...weightedCampaigns.slice(0, needed));
    }

    // Ensure we have exactly totalItems
    return items.slice(0, totalItems);
};