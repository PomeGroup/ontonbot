"use client";

import { Block } from "konsta/react";
import Typography from "../../components/Typography";
import BottomNavigation from "../../components/BottomNavigation";
import Link from "next/link";
import { Channel } from "@/types";
import usePaginatedChannels from "./usePaginatedChannels";
import channelAvatar from "@/components/icons/channel-avatar.svg";
import { ForwardedRef, forwardRef, Fragment, useCallback, useRef } from "react";
import { noop } from "lodash";
import PromotedChannels from "./PromotedChannels";
import LoadableImage from "@/components/LoadableImage";

export default function ChannelsPage() {
  const { data, isFetchingNextPage, fetchNextPage, hasNextPage, status } = usePaginatedChannels();

  const observer = useRef<IntersectionObserver>();
  const lastItemRef = useCallback(
    (node: HTMLDivElement) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  if (status === "loading") return <p>Loading...</p>;
  if (status === "error") return <p>Error fetching data</p>;

  return (
    <Block
      margin="0"
      className="bg-[rgba(239,239,244,1)] pt-4 pb-16"
    >
      <PromotedChannels />
      <div className="flex flex-wrap gap-4 mt-4">
        {data?.pages.map((page, pageIndex) => (
          <Fragment key={pageIndex}>
            {page.items.map((item, index) => {
              const isLastItem = pageIndex === data.pages.length - 1 && index === page.items.length - 1;
              return (
                <ChannelCard
                  key={item.user_id}
                  data={item}
                  ref={isLastItem ? lastItemRef : noop}
                />
              );
            })}
          </Fragment>
        ))}
      </div>

      <BottomNavigation active="Channels" />
    </Block>
  );
}

interface ChannelCardProps {
  data: Channel;
}

const ChannelCard = forwardRef(UnforwardedChannelCard);

function UnforwardedChannelCard({ data }: ChannelCardProps, ref: ForwardedRef<HTMLAnchorElement> | null) {
  return (
    <Link
      ref={ref}
      href={`/channels/${data.user_id}`}
      className={`p-4 bg-white rounded-md grow min-w-[calc(50%-0.5rem)] max-w-[calc(50%-0.5rem)]`}
    >
      <LoadableImage
        src={data.org_image || channelAvatar.src}
        width={300}
        height={300}
        alt={data.org_channel_name}
        wrapperClassName='mb-3'
      />
      <div className="text-center">
        <div
          className="font-[590] mb-2 text-[17px] leading-[22px] tracking h-11 overflow-hidden line-clamp-2 break-all"
        >
          {data.org_channel_name || "Untitled Organizer"}
        </div>
        <div className="flex gap-1 justify-center">
          <Typography
            variant="subheadline2"
            bold
          >
            {data.hosted_event_count || "0"}
          </Typography>
          <Typography variant="subheadline2">&nbsp;Events</Typography>
        </div>
      </div>
    </Link>
  );
}
