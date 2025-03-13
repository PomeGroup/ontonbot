"use client";

import { useUtils } from "@tma.js/sdk-react";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";

interface Props {
  collection_address: string | null;
  rewardImage?: string | null;
  title: string;
}

export default function SBTCollectionSection({ collection_address, rewardImage, title }: Props) {
  const tmaUtils = useUtils(true);

  return (
    <div
      onClick={() => {
        tmaUtils?.openLink(`https://getgems.io/collection/${collection_address}`);
        (tmaUtils as any)?.close();
      }}
      className={"text-telegram-text-color grid gap-2 cursor-pointer truncate"}
    >
      <h2 className={"type-title-3 font-bold mb-1"}>Ticket Collection</h2>
      <div className="flex gap-3 items-stretch w-full truncate">
        {rewardImage && (
          <Image
            className="rounded-[10px] object-contain"
            alt={"sbt reward badge"}
            src={rewardImage}
            width={48}
            height={48}
          />
        )}
        <div className="flex flex-col truncate">
          <div className="text-[18px] leading-[22px] font-medium truncate">{title}</div>
          <div className="text-[18px] leading-[22px] text-[#007AFF] font-medium truncate">{collection_address}</div>
        </div>
        <div className="self-center">
          <FaArrowRight className="text-[#007AFF]" />
        </div>
      </div>
    </div>
  );
}
