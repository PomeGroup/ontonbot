/* app/payment/[orderId]/page.tsx */
"use client";

import { ErrorState } from "@/app/_components/ErrorState";
import DataStatus from "@/app/_components/molecules/alerts/DataStatus";
import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { Preloader } from "konsta/react";
import { useParams, useRouter } from "next/navigation";

export default function PaymentWatcher() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  /* poll every 3 s until finished */
  const { data, isLoading, isError } = trpc.orders.getOrder.useQuery(
    { order_id: orderId },
    {
      refetchInterval: 3_000, // 3 seconds
      staleTime: 0,
    }
  );

  if (isLoading || !data)
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Preloader size="w-12 h-12" />
        <Typography variant="headline">Waiting for payment…</Typography>
      </div>
    );

  if (isError) return <ErrorState errorCode="something_went_wrong" />;

  /* ----- states ------------------------------------------------ */
  const { order } = data;

  if (order.state === "completed")
    return (
      <div className="flex flex-col gap-4 p-4 items-center min-h-screen justify-center">
        <DataStatus
          status="success"
          title="Payment Success"
          description={`Thank you! Your order #${order.uuid.slice(0, 8)} is confirmed.`}
        />
        <Button
          variant="primary"
          className="w-full"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            router.replace(`/events/${order.event_uuid}`);
          }}
        >
          Back&nbsp;to&nbsp;Event
        </Button>
      </div>
    );

  if (order.state === "failed" || order.state === "cancelled")
    return (
      <div className="flex flex-col gap-4 p-4 items-center min-h-screen justify-center">
        <DataStatus
          status="rejected"
          title="Payment Failed"
          description={`Your order #${order.uuid.slice(0, 8)} has been cancelled.`}
        />
        <Button
          variant="primary"
          className="w-full"
          onClick={(e) => {
            e.preventDefault();
            router.replace(`/events/${order.event_uuid}`);
          }}
        >
          Back&nbsp;to&nbsp;Event
        </Button>
      </div>
    );

  /* still processing / confirming / new */
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Preloader size="w-12 h-12" />
      <Typography variant="headline">
        {order.state === "processing" ? "Processing on-chain…" : "Awaiting payment…"}
      </Typography>
      <Typography variant="body">Order&nbsp;#{order.uuid.slice(0, 8)}</Typography>
    </div>
  );
}
