/* app/payment/[orderId]/page.tsx */
"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import CustomButton from "@/app/_components/Button/CustomButton";
import { Preloader } from "konsta/react";

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

  if (isError)
    return (
      <div className="p-6 space-y-4">
        <Typography variant="headline">Something went wrong 😢</Typography>
        <CustomButton
          variant="outline"
          onClick={() => router.back()}
        >
          Go&nbsp;back
        </CustomButton>
      </div>
    );

  /* ----- states ------------------------------------------------ */
  const { order } = data;

  if (order.state === "completed")
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Typography
          variant="title2"
          weight="bold"
          className="text-green-600"
        >
          Payment&nbsp;Success&nbsp;🎉
        </Typography>
        <Typography variant="body">Thank you! Your order&nbsp;#{order.uuid.slice(0, 8)} is confirmed.</Typography>
        <CustomButton onClick={() => router.replace(`/events/${order.event_uuid}`)}>Back&nbsp;to&nbsp;Event</CustomButton>
      </div>
    );

  if (order.state === "failed" || order.state === "cancelled")
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Typography
          variant="title2"
          weight="bold"
          className="text-red-600"
        >
          Payment&nbsp;{order.state === "failed" ? "Failed" : "Cancelled"}
        </Typography>
        <CustomButton
          variant="outline"
          onClick={() => router.replace(`/events/${order.event_uuid}`)}
        >
          Try&nbsp;again
        </CustomButton>
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
