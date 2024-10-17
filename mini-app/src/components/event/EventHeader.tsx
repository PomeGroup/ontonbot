"use client";

import Image from "next/image";
import { useUtils } from "@telegram-apps/sdk-react";
import ButtonTma from "@/components/Button";
import { RiLoader4Line } from "react-icons/ri";

import { env } from "../../env";
import { useShareEvent } from "@/hooks/useShareEvent";
import { useUserStore } from "@/store/user.store";
import ShareIcon from "../../../public/share-icon.svg";

type EventHeaderProps = {
  title: string;
  description: string;
  event_uuid: string;
};

const EventHeader = (props: EventHeaderProps) => {
  const shareEvent = useShareEvent();
  const user = useUserStore((s) => s.user);
  const tmaUtils = useUtils(true);

  return (
    <div className="grid grid-cols-7 items-start justify-start gap-y-1.5 pt-4">
      <h1 className="type-title-1 type-headline-1 text-xl font-bold col-span-6">{props.title}</h1>
      <ButtonTma
        variant="icon"
        buttonColor="tinted"
        className="relative col-span-1 aspect-square w-9 justify-self-end"
        onClick={() => {
          shareEvent
            .mutateAsync({
              event_uuid: props.event_uuid,
              user_id: `${user?.user_id}`,
            })
            .then(() => {
              tmaUtils?.openTelegramLink(
                `https://t.me/${env.NEXT_PUBLIC_BOT_USERNAME}`
              );
            });
        }}
        disabled={shareEvent.isLoading}
      >
        {shareEvent.isLoading ? (
          <RiLoader4Line className="animate-spin" />
        ) : (
          <Image
            src={ShareIcon}
            alt={"share"}
            width={24}
            height={24}
            className={"object-contain"}
          />
        )}
      </ButtonTma>
      <p className="type-callout type-subtitle-1 col-span-full">
        {props.description}
      </p>
    </div>
  );
};

export default EventHeader;
