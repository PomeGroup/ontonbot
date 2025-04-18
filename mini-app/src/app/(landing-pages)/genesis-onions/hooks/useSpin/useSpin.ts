import { trpc } from "@/app/_trpc/client";
import {
  AFFILIATE_HASH_SEARCH_PARAM_KEY,
  GENESIS_ONIONS_CAMPAIGN_TYPE,
  RAFFLE_CAROUSEL_RESULT_PADDING,
} from "../../GenesisOnions.constants";
import { useMemo } from "react";
import { generateWeightedArray } from "./useSpin.utils";
import { TokenCampaignNftCollections } from "@/db/schema";
import { useSearchParams } from "next/navigation";

export const useSpin = () => {
  const searchParams = useSearchParams();
  const affiliateHashQueryParam = searchParams.get(AFFILIATE_HASH_SEARCH_PARAM_KEY)?.trim();
  const {
    data: collections,
    isError: isErrorCollections,
    isLoading: isLoadingCollections,
    refetch: refetchCollections,
  } = trpc.campaign.getCollectionsByCampaignType.useQuery({
    campaignType: GENESIS_ONIONS_CAMPAIGN_TYPE,
    affiliateHash: affiliateHashQueryParam,
  });

  const spinMutation = trpc.campaign.spinForNft.useMutation();
  const slides = useMemo(() => {
    if (!collections?.length) return null;
    const filteredCollections = collections.filter((collection) => collection.isForSale);

    return generateWeightedArray(filteredCollections as TokenCampaignNftCollections[]);
  }, [collections]);

  const spin = async () => {
    if (!slides) throw new Error("Spin attempted before slides are ready");

    const response = await spinMutation.mutateAsync({
      campaignType: GENESIS_ONIONS_CAMPAIGN_TYPE,
    });

    const resultId = response.id;

    // Define padding boundaries (adjust as needed)
    const minIndex = RAFFLE_CAROUSEL_RESULT_PADDING;
    const maxIndex = slides.length - RAFFLE_CAROUSEL_RESULT_PADDING - 1;

    // Find *all* matching indices
    const matchingIndices = slides
      .map((slide, index) => ({ id: slide.id, index }))
      .filter(({ id, index }) => id === resultId && index >= minIndex && index <= maxIndex)
      .map(({ index }) => index);

    if (matchingIndices.length === 0) {
      throw new Error("No index found for the resultId within padded range");
    }

    // Pick one randomly (or you can pick the middle one, or first one, etc.)
    const chosenIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];

    return chosenIndex;
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
