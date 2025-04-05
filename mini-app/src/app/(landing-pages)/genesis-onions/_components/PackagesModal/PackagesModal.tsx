import { TokenCampaignOrders, TokenCampaignSpinPackages } from "@/db/schema";
import { Modal, Box } from "@mui/material";
import Typography from "@/components/Typography";
import { PackageItem } from "./PackageItem";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePackage } from "../../hooks/usePackage";
import { toast } from "sonner";
import { useAffiliate } from "../../hooks/useAffiliate";
import { customToast } from "../../GenesisOnions.utils";

interface Props {
    open: boolean;
    onClose: () => void;
    onOrderPaid: (order: TokenCampaignOrders) => void;
    onOrderPaymentFailed: (err: Error) => void;
}

export const PackagesModal = ({ open, onClose, onOrderPaid, onOrderPaymentFailed }: Props) => {
    const { inviteOnTelegram, isLoading: isLoadingInviteOnTelegram } = useAffiliate();

    const { packages, isErrorPackages, isLoadingPackages } = usePackage();

    if (isLoadingPackages) return null;
    if (isErrorPackages) return <div>Error! Try again later...</div>;

    const handleOrderPaid = (order: TokenCampaignOrders) => {
        onOrderPaid(order);

        onClose();
    };

    const handleInviteOnTelegram = () => {
        try {
            inviteOnTelegram();
        } catch (error) {
            customToast.error("Unable to open the invitation dialogue, please try again later.");
        }
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
                                onOrderPaid={handleOrderPaid}
                                onPaymentFailed={onOrderPaymentFailed}
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
            </Box>
        </Modal>
    );
};
