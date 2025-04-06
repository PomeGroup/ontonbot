import { trpc } from "@/app/_trpc/client";
import { useUserStore } from "@/context/store/user.store";
import { useTonAddress, useTonConnectModal } from "@tonconnect/ui-react";
import { useEffect } from "react";

export const useWallet = () => {
    const walletModal = useTonConnectModal();
    const tonWalletAddress = useTonAddress();
    const { user } = useUserStore();
    const addWalletMutation = trpc.users.addWallet.useMutation();

    useEffect(() => {
        if (!user?.user_id || !tonWalletAddress) return;

        // user has connected wallet or changed wallet
        if (!user?.wallet_address) {
            addWalletMutation.mutate({
                wallet: tonWalletAddress,
            });
        }
    }, [user, tonWalletAddress, addWalletMutation]);

    return {
        walletModal,
    };
};
