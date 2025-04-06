import { trpc } from "@/app/_trpc/client";
import { GENESIS_ONIONS_CAMPAIGN_TYPE } from "../GenesisOnions.constants";

export const usePackage = () => {
    // get list of packages that user can buy to have more spins
    const {
        data: packages,
        isError: isErrorPackages,
        isLoading: isLoadingPackages,
    } = trpc.campaign.getActiveSpinPackagesByCampaignType.useQuery({
        campaignType: GENESIS_ONIONS_CAMPAIGN_TYPE,
    });

    return {
        packages,
        isErrorPackages,
        isLoadingPackages,
    };
};
