"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import QRCodeStyling, { type Options } from "qr-code-styling";

import QrcodeTmaSettings from "~/components/ticket/qrcode/QrcodeTmaSettings";
import options from "./options.json";

type TicketParams = {
  params: {
    id: string;
  };
};

const QrcodePage = ({ params }: TicketParams) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const orderUuid = searchParams.get("orderUuid");
  const qrOptions = options as unknown as Options;
  qrOptions.data = `${orderUuid}`;


  const qrCode = new QRCodeStyling(qrOptions);

  useEffect(() => {
    if (qrRef.current) {
      qrCode.append(qrRef.current);
      // find the canvas element in the qrRef current and add width 100% to it
      const canvas = qrRef.current.querySelector("canvas");
      if (canvas) {
        canvas.style.width = "100%";
      }
    }
  }, [qrRef.current]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-[#f0f0f0] px-4">
      <h1 className={"type-title-1 mb-11 mt-10 text-center font-bold"}>
        Show the QR code to check in to the event
      </h1>
      <div
        className={
          "relative grid aspect-square w-full place-items-center rounded-[20px] bg-white p-[28px]"
        }
      >
        <Image
          priority
          src={"/ptma/TON.svg"}
          alt={"TON"}
          width={64}
          height={64}
          className={
            "absolute left-1/2 top-1/2 z-10 h-[18vw] w-[18vw] -translate-x-1/2 -translate-y-1/2"
          }
        />
        <div ref={qrRef} className={"z-5 relative w-full object-contain"} />
      </div>
      <QrcodeTmaSettings ticketId={params.id} />
    </div>
  );
};
export default QrcodePage;
