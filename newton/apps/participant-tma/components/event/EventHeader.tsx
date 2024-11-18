"use client";

import Image from "next/image";
import { useUtils } from "@tma.js/sdk-react";
import ButtonTma from "@ui/components/Button";
import { RiLoader4Line } from "react-icons/ri";

import { env } from "~/env.mjs";
import { useShareEvent } from "~/hooks/useShareEvent";
import { useUserStore } from "~/store/user.store";

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
      <h1 className="type-title-1 type-headline-5 col-span-6">{props.title}</h1>
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
                `https://t.me/${env.NEXT_PUBLIC_BOT_USERNAME}`,
              );
            });
        }}
        disabled={shareEvent.isPending}
      >
        {shareEvent.isPending ? (
          <RiLoader4Line className="animate-spin" />
        ) : (
          <Image
            src={"/ptma/share-icon.svg"}
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
