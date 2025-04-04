import { trpc } from "@/app/_trpc/client";
import { GENESIS_ONIONS_CAMPAIGN_TYPE } from "../../GenesisOnions.constants";
import { useMemo, useState } from "react";
import { generateWeightedArray } from "./useSpin.utils";
import { TokenCampaignNftCollections } from "@/db/schema";

export const useSpin = () => {
    const { data: collections, isError: isErrorCollections, isLoading: isLoadingCollections } = trpc.campaign.getCollectionsByCampaignType.useQuery(
        { campaignType: GENESIS_ONIONS_CAMPAIGN_TYPE },
    );

    const [selectedIndex, setSelectedIndex] = useState<number | undefined>();
    const spinMutation = trpc.campaign.spinForNft.useMutation();
    const slides = useMemo(() => collections?.length ? generateWeightedArray(collections as TokenCampaignNftCollections[]) : null, [collections]);

    const spin = async () => spinMutation.mutateAsync({
        campaignType: GENESIS_ONIONS_CAMPAIGN_TYPE,
    }).then(response => {
        const resultId = response.id

        const index = slides?.findLastIndex(slide => slide.id === resultId)
        console.log('index', index)
        if (typeof index === 'undefined' || index < 0) throw new Error('No index found for the resultId')

        setSelectedIndex(index)

        return index
    });

    return {
        collections,
        slides,
        isErrorCollections,
        isLoadingCollections,
        selectedIndex,
        spin,
    }
}