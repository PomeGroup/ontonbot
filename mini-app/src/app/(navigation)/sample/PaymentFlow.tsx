"use client";
import React, { useState } from "react";
import useTransferPayment from "./useTransferPayment";
import { toast } from "sonner";

interface PaymentFlowProps {
  orderId: number;
  walletAddress?: string;
  finalPrice: number; // in TON or USD
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * PaymentFlow: A button that triggers payment using tonConnect.
 */
export default function PaymentFlow({ orderId, walletAddress, finalPrice, onSuccess, onCancel }: PaymentFlowProps) {
  const [loading, setLoading] = useState(false);
  const transfer = useTransferPayment();

  async function handlePay() {
    if (!walletAddress) {
      toast.error("No destination address!");
      return;
    }
    try {
      setLoading(true);
      // For example: transfer TON.
      // If you want USDT, pass "USDT" as the third argument.
      await transfer(walletAddress, finalPrice, "TON", { comment: `OnionCampaign=${orderId}` });
      toast.success("Transaction successful!");
      onSuccess?.();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Transaction canceled or failed!");
      onCancel?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePay}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        disabled={loading}
      >
        {loading ? "Processing..." : `Pay ${finalPrice} TON`}
      </button>
    </div>
  );
}
