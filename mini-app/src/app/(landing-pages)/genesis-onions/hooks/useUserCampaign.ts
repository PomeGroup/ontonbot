import { trpc } from "@/app/_trpc/client";
import { GENESIS_ONIONS_CAMPAIGN_TYPE } from "../GenesisOnions.constants";

export const useUserCampaign = () => {
    const trpcUtils = trpc.useUtils();

    const {
        data: eligibility,
        isLoading: isLoadingEligibility,
        isError: isErrorEligibility,
        refetch: refetchEligibility,
    } = trpc.campaign.checkUserEligible.useQuery();

    const {
        data: userSpinStats,
        isError: isErrorUserSpinStats,
        isLoading: isLoadingUserSpinStats,
        refetch: refetchUserSpinStats,
    } = trpc.campaign.getUserSpinStats.useQuery({});

    const {
        data: userCollection,
        isLoading: isLoadingUserCollection,
        isError: isErrorUserCollection,
    } = trpc.campaign.getUserCollectionsResult.useQuery({ campaignType: GENESIS_ONIONS_CAMPAIGN_TYPE });

    const invalidateUserSpinStats = () => trpcUtils.campaign.getUserSpinStats.invalidate();
    const invalidateUserCollection = () => trpcUtils.campaign.getUserCollectionsResult.invalidate({ campaignType: GENESIS_ONIONS_CAMPAIGN_TYPE });

    return {
        // user spin stats
        userSpinStats,
        isErrorUserSpinStats,
        isLoadingUserSpinStats,
        refetchUserSpinStats,
        invalidateUserSpinStats,
        // user collection
        userCollection,
        isLoadingUserCollection,
        isErrorUserCollection,
        invalidateUserCollection,
        // eligibility
        isEligible: eligibility?.eligible,
        isLoadingEligibility,
        isErrorEligibility,
        refetchEligibility
    };
};
