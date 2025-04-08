import { trpc } from "@/app/_trpc/client";
import { ORDER_POLLING_INTERVAL } from "../GenesisOnions.constants";
import { useConfig } from "@/context/ConfigContext";
import { useState } from "react";
import { TokenCampaignOrders } from "@/db/schema";
import { useAffiliate } from "./useAffiliate";

export const useOrder = () => {
  const { affiliateHash } = useAffiliate();
  const config = useConfig();
  const ontonWalletAddress = config?.ONTON_WALLET_ADDRESS_CAMPAIGN || "UQDIh_j4EZPAouFr4MJOZFogV8ux2zSdED36KQ7ODUp-um9H";

  const [submittedOrder, setSubmittedOrder] = useState<TokenCampaignOrders | null>(null);

  const addOrderMutation = trpc.campaign.addOrder.useMutation();

  const submitOrder = async (spinPackageId: number) => {
    const order = await addOrderMutation.mutateAsync({
      spinPackageId,
      walletAddress: ontonWalletAddress,
      affiliateHash: affiliateHash ?? undefined,
    });

    setSubmittedOrder(order);

    return order;
  };

  const {
    data: order,
    isError,
    isLoading,
  } = trpc.campaign.getOrder.useQuery(
    { orderId: submittedOrder?.id! },
    {
      enabled: !!submittedOrder?.id,
      staleTime: ORDER_POLLING_INTERVAL,
    }
  );

  // Mutation to set the status => "confirming" or "cancel"
  const updateStatusMutation = trpc.campaign.updateOrderStatusConfirmCancel.useMutation();

  return {
    submitOrder,
    order,
    isError,
    isLoading,
    updateStatusMutation,
  };
};
