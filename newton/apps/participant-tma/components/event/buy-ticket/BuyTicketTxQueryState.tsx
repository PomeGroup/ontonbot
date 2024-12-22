import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMainButton, useMiniApp, useUtils } from "@tma.js/sdk-react";
import { toast } from "@ui/base/sonner";
import { useAtom, useSetAtom } from "jotai";

import { useGetOrder } from "~/hooks/useGetOrderQuery";
import { isRequestingTicketAtom } from "~/store/atoms/event.atoms";

const BuyTicketTxQueryState = () => {
  const mainButton = useMainButton(true);
  const tma = useMiniApp(true);
  const [isRequestingTicket] = useAtom(isRequestingTicketAtom);
  const order = useGetOrder(isRequestingTicket.state ? isRequestingTicket.orderId : "");
  const tmaUtils = useUtils(true);
  const isError = order.data?.state === "failed";
  const isPending = order.isPending || order.data?.state === "new" || order.data?.state === "processing";

  // BG color
  useEffect(() => {
    tma?.setBgColor("#ffffff");
    tma?.setHeaderColor("#ffffff");
  }, [tma?.bgColor]);

  // Main Button
  useEffect(() => {
    mainButton?.hideLoader();
    if (isPending) {
      mainButton?.hide().disable();
    }
  }, [mainButton, order.data?.state]);

  // State
  useEffect(() => {
    if (order.data?.state === "confirming") {
      toast.success("Transaction Validated soon your ticket will be minted", {
        duration: 5_000,
      });
    }
  }, [order.data?.state]);

  if (!isRequestingTicket.state) {
    return <></>;
  }

  if (isError) {
    return (
      <div className="absolute top-0 z-50 flex h-screen w-screen flex-col items-center justify-center space-y-2.5 bg-white px-7 text-center">
        <Image
          priority
          className="h-28 w-28"
          width={112}
          height={112}
          src={"/ptma/duck-not-allowed.gif"}
          alt="event image"
        />
        <div>
          <h2 className="type-title-2 text-telegram-text-color mb-2 font-semibold">Invalid transaction</h2>
          <p className="type-body mb-7">Your payment method was rejected, try again later or contact our support.</p>
          <Link
            href={"#"}
            onClick={() => tmaUtils?.openTelegramLink("https://t.me/challenquizer")}
            className="text-telegram-6-10-accent-text-color type-body mt-5 block"
          >
            Contact Support
          </Link>
        </div>
        <ErrorMainButton />
      </div>
    );
  }

  if (order.data?.state === "completed") {
    return (
      <div className="absolute top-0 z-50 flex h-screen w-screen flex-col items-center justify-center space-y-2.5 bg-white px-7 text-center">
        <Image
          priority
          className="h-28 w-28"
          width={112}
          height={112}
          src={"/ptma/success.gif"}
          alt="event image"
        />
        <div className="space-y-2">
          <h2 className="text-[22px] font-semibold">Ticket successfully paid!</h2>
          <p className="text-[17px]">
            The purchase was completed successfully, your ticket is available by clicking the button below or in your wallet.
          </p>
        </div>
        <SuccessMainButton id={order.data?.uuid as string} />
      </div>
    );
  }

  return (
    <div className="absolute top-0 z-50 flex h-screen w-screen flex-col items-center justify-center space-y-2.5 bg-white px-7 text-center">
      <Image
        priority
        className="h-28 w-28"
        width={112}
        height={112}
        src={"/ptma/duck-thinking.gif"}
        alt="Processing Payment"
      />
      <div className="space-y-2">
        <h2 className="type-title-2 text-telegram-text-color mb-2 font-semibold">Payment in process</h2>
        <p className="type-body">Hold on a second, we need to make sure the payment went through successfully.</p>
      </div>
    </div>
  );
};

export default BuyTicketTxQueryState;

/**
 * Success button
 * @param props ticket_id, order_uuid or event_uuid
 */
function SuccessMainButton({ id }: { id: string | number }) {
  const router = useRouter();
  const mainButton = useMainButton(true);

  useEffect(() => {
    router.refresh();
    mainButton?.setText("Open Ticket");
    mainButton?.on("click", () => {
      router.push(`/ticket/${id}`);
    });
    mainButton?.show().enable();
    mainButton?.hideLoader();
  }, [mainButton]);

  return <></>;
}

/**
 * Error button
 * @param props ticket_id, order_uuid or event_uuid
 */
function ErrorMainButton() {
  const mainButton = useMainButton(true);
  const setIsRequestingTicket = useSetAtom(isRequestingTicketAtom);

  useEffect(() => {
    mainButton?.show().enable();
    mainButton?.setText("Try Again");
    mainButton?.on("click", () => {
      setIsRequestingTicket({ state: false });
    });
    mainButton?.hideLoader();
  }, [mainButton]);

  return <></>;
}
