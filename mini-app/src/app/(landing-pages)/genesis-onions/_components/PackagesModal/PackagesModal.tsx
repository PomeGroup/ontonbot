import { TokenCampaignOrders, TokenCampaignSpinPackages } from "@/db/schema";
import { Modal, Box } from "@mui/material";
import Typography from "@/components/Typography";
import { PackageItem } from "./PackageItem";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePackage } from "../../hooks/usePackage";

interface Props {
    open: boolean;
    onClose: () => void;
    onOrderPaid: (order: TokenCampaignOrders) => void;
}

export const PackagesModal = ({ open, onClose, onOrderPaid }: Props) => {
    const { packages, isErrorPackages, isLoadingPackages } = usePackage()

    if (isLoadingPackages) return null;
    if (isErrorPackages) return <div>Error! Try again later...</div>;

    const handleOpenWalletModal = (order?: TokenCampaignOrders) => {
        if (order) {
            // TODO: it causes the CheckOrderModal to open while the wallet modal is open in front of it. it'd be better to start polling here, then after transaction made, open that CheckOrderModal
            onOrderPaid(order);
        }

        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            className="text-white"
        >
            <Box
                className="bg-navy px-4 py-5 flex flex-col gap-4 rounded-t-3xl w-full"
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                }}
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography variant="title2">Secure Spin Bundles</Typography>

                    <button
                        onClick={onClose}
                        className="border-2 p-0.5 rounded-full border-white w-7 h-7 flex items-center justify-center"
                    >
                        <X />
                    </button>
                </Box>

                <div className="flex flex-col gap-3">
                    <Typography
                        variant="callout"
                        weight="normal"
                    >
                        Select your preferred package to continue:
                    </Typography>

                    <div className="grid grid-cols-3 gap-2">
                        {packages?.map((pkg) => (
                            <PackageItem
                                onOpenWalletModal={handleOpenWalletModal}
                                key={pkg.id}
                                pkg={pkg as TokenCampaignSpinPackages}
                            />
                        ))}
                    </div>
                </div>

                <Typography
                    variant="footnote"
                    weight="normal"
                >
                    Save time: Spin faster with Spin Bundles to hunt for the rarest ONIONs!
                </Typography>

                <hr />

                <div className="flex gap-1 items-center h-11 justify-between">
                    <Typography
                        variant="footnote"
                        className="flex-1"
                    >
                        <span>Earn 1 free spin for every</span>
                        <Typography
                            weight="bold"
                            className="inline px-1"
                        >
                            5
                        </Typography>
                        <span>successful invites!</span>
                    </Typography>

                    <Button
                        variant="outline"
                        className="h-full text-white border flex-1 bg-transparent"
                    >
                        <Typography
                            variant="body"
                            weight="medium"
                        >
                            Invite Friends
                        </Typography>
                    </Button>
                </div>
            </Box>
        </Modal>
    );
};
