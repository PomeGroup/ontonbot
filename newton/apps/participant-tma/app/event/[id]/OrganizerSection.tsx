'use client'

import Image from "next/image"
import { OrganizerType } from "~/types/event.types"
import channelAvatar from './channel-avatar.svg';
import { FaArrowRight } from "react-icons/fa";
import { useUtils } from "@tma.js/sdk-react";
import { env } from "~/env.mjs"


interface Props {
  data: OrganizerType
}

export default function OrganizerSection({ data }: Props) {
  const tmaUtils = useUtils(true);

  return (
    <div
      onClick={() => {
        tmaUtils?.openTelegramLink(`https://t.me/${env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=channels_${data.user_id}`)

      }}
      className={"text-telegram-text-color grid gap-2 cursor-pointer"}>
      <h2 className={"type-title-3 font-bold mb-1"}>Organizer</h2>
      <div className="flex gap-3 items-stretch">
        <Image
          className="rounded-[10px] object-contain"
          alt={data.org_channel_name || "Untitled organizer"}
          src={data.org_image || channelAvatar.src}
          width={48}
          height={48}
        />
        <div className="flex flex-col grow justify-between">
          <div
            className="text-[18px] leading-[22px] text-[#007AFF] font-medium line-clamp-2"
          >
            {data.org_channel_name || "Untitled organizer"}
          </div>
          <div className="text-[#8E8E93] text-[14px] font-light leading-[20px]">
            <b>{data.hosted_event_count || "1"}</b>
            &nbsp; events
          </div>
        </div>
        <div className="self-center">
          <FaArrowRight className="text-[#007AFF]" />
        </div>
      </div>
    </div>
  )
}
