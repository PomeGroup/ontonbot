import DataStatus from "@/app/_components/molecules/alerts/DataStatus";
import { trpc } from "@/app/_trpc/client";
import { TokenCampaignOrders } from "@/db/schema";
import { Modal, Box } from "@mui/material";
import { useEffect } from "react";

interface Props {
    order: TokenCampaignOrders;
    onClose: () => void;
    onSuccess: () => void;
    onCancel: () => void;
}

const FINAL_STATUSES = ["completed", "cancel", "failed"];


export const CheckOrderModal = ({ order: orderArg, onClose, onSuccess, onCancel }: Props) => {
    const orderId = orderArg.id;

    const { data: order, refetch } = trpc.campaign.getOrder.useQuery({ orderId }, { enabled: true });

    // do a long polling until you get the desired status
    useEffect(() => {
        if (!order) return;

        let intervalId: NodeJS.Timeout | null = null;

        // If the order is NOT final, poll every 2 seconds
        if (!FINAL_STATUSES.includes(order.status)) {
            intervalId = setInterval(() => refetch(), 2000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [order, refetch]);

    // if the order is final, call onSuccess / onCancel
    useEffect(() => {
        if (!order) return;
        if (FINAL_STATUSES.includes(order.status)) {
            if (order.status === "completed") {
                onSuccess?.();
            } else {
                onCancel?.();
            }
        }
    }, [order, onSuccess, onCancel]);

    return (
        <Modal
            open
            onClose={onClose}
            className="text-white"
        >
            <Box
                className="bg-navy/95 px-4 py-5 flex flex-col gap-4 rounded-t-3xl w-full"
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                }}
            >
                <DataStatus
                    status="pending"
                    title={`Checking Your Payment`}
                    description={<div className="text-white my-10 px-10">Hold on a second, we need to make sure the payment went through successfully.</div>}
                />
            </Box>
        </Modal>
    );
};
