export const ConnectWalletModal = () => {
    const walletModal = useTonConnectModal();
    const tonWalletAddress = useTonAddress();
    const { user } = useUserStore();
    const addWalletMutation = trpc.users.addWallet.useMutation({
        onSuccess: () => {
            // any invalidations if needed
            onClose();
        },
    });

    useEffect(() => {
        if (!user?.user_id) return;
        if (tonWalletAddress) {
            // user has connected wallet or changed wallet
            onClose();
            if (!user?.wallet_address) {
                // If user doesn't have a wallet in DB, update
                toast.success("Your wallet is now connected");
                addWalletMutation.mutate({
                    wallet: tonWalletAddress,
                });
            }
        }
    }, [user, tonWalletAddress, addWalletMutation, onClose]);

    const handleConnect = () => {
        walletModal.open();
    };


}