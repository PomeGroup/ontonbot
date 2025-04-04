import { trpc } from "@/app/_trpc/client";
import { ORDER_POLLING_INTERVAL } from "../GenesisOnions.constants";
import { useConfig } from "@/context/ConfigContext";
import { useState } from "react";
import { TokenCampaignOrders } from "@/db/schema";
import useTransferPayment from "@/app/(navigation)/sample/useTransferPayment";

export const useOrder = () => {
    const transfer = useTransferPayment();
    const config = useConfig();
    const ontonWalletAddress = config?.ONTON_WALLET_ADDRESS || "UQDIh_j4EZPAouFr4MJOZFogV8ux2zSdED36KQ7ODUp-um9H";

    const [submittedOrder, setSubmittedOrder] = useState<TokenCampaignOrders | null>(null);
    const [isPaying, setIsPaying] = useState(false);

    const addOrderMutation = trpc.campaign.addOrder.useMutation();

    const submitOrder = async (spinPackageId: number) => {
        const order = await addOrderMutation.mutateAsync({
            spinPackageId,
            walletAddress: ontonWalletAddress,
        });

        setSubmittedOrder(order);

        return order
    };

    const { data: order, isError, isLoading } = trpc.campaign.getOrder.useQuery({ orderId: submittedOrder?.id! }, {
        enabled: !!submittedOrder?.id,
        staleTime: ORDER_POLLING_INTERVAL
    });

    // Mutation to set the status => "confirming" or "cancel"
    const updateStatusMutation = trpc.campaign.updateOrderStatusConfirmCancel.useMutation();

    const pay = async (orderArg?: TokenCampaignOrders) => {
        const theOrder = orderArg ?? submittedOrder

        console.log(1, { theOrder, orderArg, submittedOrder })
        if (!theOrder) return
        console.log(2)

        const walletAddress = theOrder?.wallet_address
        const orderId = theOrder.id
        console.log(3, walletAddress, orderId)

        if (!walletAddress) {
            throw new Error("Wallet address not found");
        }
        console.log(4)

        setIsPaying(true);
        console.log(5)

        try {
            console.log(6)
            // (A) First, set order => "confirming"
            await updateStatusMutation.mutateAsync({ orderId, status: "confirming" });

            console.log(7)
            // (B) Then do the TonConnect transfer
            await transfer(walletAddress, parseFloat(theOrder.finalPrice), "TON", { comment: `OnionCampaign=${theOrder.uuid}` });
            console.log(8)
        } catch (error) {
            console.error("Payment error:", error);
            // (D) If error, set the order => "cancel"
            await updateStatusMutation.mutateAsync({ orderId, status: "cancelled" });

            throw new Error("Transaction canceled or failed!");
        } finally {
            setIsPaying(false);
        }
    }

    return {
        submitOrder,
        pay,
        order,
        isError,
        isLoading,
        isPaying
    };
};
