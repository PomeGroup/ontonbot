"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/app/_trpc/client";
import useTransferPayment from "./useTransferPayment";

interface PaymentFlowProps {
  orderId: number;
  walletAddress?: string;
  finalPrice: number; // in TON or USD
  onSuccess?: () => void;
  onCancel?: () => void;
  orderUuid: string;
}

/**
 * The statuses that mean the order is done (either success or canceled/failed).
 * Adjust if your system has different final states.
 */
const FINAL_STATUSES = ["completed", "cancel", "failed"];

/**
 * PaymentFlow:
 * 1) Polls order state from `getOrder`.
 * 2) On "Pay" click:
 *    - sets order status => "confirming" via `updateOrderStatusConfirmCancel`.
 *    - calls `useTransferPayment` to do the Ton transaction.
 *    - if user cancels or fails, sets order status => "cancel".
 * 3) Continues polling until we see a final status (completed/cancel/failed).
 */
export default function PaymentFlow({
  orderId,
  orderUuid,
  walletAddress,
  finalPrice,
  onSuccess,
  onCancel,
}: PaymentFlowProps) {
  const [isPaying, setIsPaying] = useState(false);
  const transfer = useTransferPayment();

  // 1) Query the order
  const { data: order, refetch } = trpc.campaign.getOrder.useQuery({ orderId }, { enabled: true });

  // 2) Local polling logic
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

  // 3) If order is final, call onSuccess / onCancel
  useEffect(() => {
    if (!order) return;
    if (FINAL_STATUSES.includes(order.status)) {
      if (order.status === "completed") {
        toast.success(`Order #${order.id} status: ${order.status} (Payment Success)`);
        onSuccess?.();
      } else {
        toast.error(`Order #${order.id} status: ${order.status} (Payment Canceled/Failed)`);
        onCancel?.();
      }
    }
  }, [order, onSuccess, onCancel]);

  // 4) Mutation to set the status => "confirming" or "cancel"
  const updateStatusMutation = trpc.campaign.updateOrderStatusConfirmCancel.useMutation({
    onSuccess() {
      refetch(); // Re-fetch to see updated status
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  // 5) Payment function
  async function handlePay() {
    if (!walletAddress) {
      toast.error("No destination address!");
      return;
    }
    try {
      setIsPaying(true);

      // (A) First, set order => "confirming"
      await updateStatusMutation.mutateAsync({ orderId, status: "confirming" });
      console.log(`Order #${orderId} status set to "confirming" with comment: "OnionCampaign=${orderUuid}"`);
      // (B) Then do the TonConnect transfer
      await transfer(walletAddress, finalPrice, "TON", { comment: `OnionCampaign=${orderUuid}` });
      toast.success("Transaction broadcasted! We'll keep checking the order status...");

      // (C) Rely on cron job or on-chain to set final status => "processing" or "completed"
      // Polling will pick up changes. No immediate status update here.
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Transaction canceled or failed!");

      // (D) If error, set the order => "cancel"
      await updateStatusMutation.mutateAsync({ orderId, status: "cancelled" });

      onCancel?.();
    } finally {
      setIsPaying(false);
      await refetch();
    }
  }

  // 6) Rendering
  if (!order) {
    return <p className="text-gray-600">Fetching order info…</p>;
  }

  const { status } = order;
  const isFinal = FINAL_STATUSES.includes(status);

  return (
    <div>
      {isFinal ? (
        <div>
          {status === "completed" ? (
            <p className="text-green-600">Payment was successful! Current status: {status}</p>
          ) : (
            <p className="text-red-600">Payment canceled or failed. Current status: {status}</p>
          )}
        </div>
      ) : (
        <button
          onClick={handlePay}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={isPaying}
        >
          {isPaying ? "Processing..." : `Pay ${finalPrice} TON`}
        </button>
      )}

      <p className="mt-2 text-gray-600">
        Order Status: <strong>{status}</strong>
      </p>
    </div>
  );
}
