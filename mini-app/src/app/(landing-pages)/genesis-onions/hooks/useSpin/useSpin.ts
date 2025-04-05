import { trpc } from "@/app/_trpc/client";
import { GENESIS_ONIONS_CAMPAIGN_TYPE } from "../../GenesisOnions.constants";
import { useMemo } from "react";
import { generateWeightedArray } from "./useSpin.utils";
import { TokenCampaignNftCollections } from "@/db/schema";

export const useSpin = () => {
    const {
        data: collections,
        isError: isErrorCollections,
        isLoading: isLoadingCollections,
        refetch: refetchCollections,
    } = trpc.campaign.getCollectionsByCampaignType.useQuery({ campaignType: GENESIS_ONIONS_CAMPAIGN_TYPE });

    const spinMutation = trpc.campaign.spinForNft.useMutation();
    const slides = useMemo(
        () => (collections?.length ? generateWeightedArray(collections as TokenCampaignNftCollections[]) : null),
        [collections]
    );

    const spin = async () => {
        if (!slides) throw new Error("Spin attempted before slides are ready");

        const response = await spinMutation.mutateAsync({ campaignType: GENESIS_ONIONS_CAMPAIGN_TYPE });
        const resultId = response.id;

        const index = slides.findLastIndex((slide) => slide.id === resultId);
        if (index == null || index < 0) throw new Error("No index found for the resultId");

        return index;
    };

    return {
        collections,
        refetchCollections,
        slides,
        isErrorCollections,
        isLoadingCollections,
        spin,
    };
};
