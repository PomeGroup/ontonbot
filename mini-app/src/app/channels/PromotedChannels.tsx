import { trpc } from "../_trpc/client";
import { Channel } from "@/types";
import Link from "next/link";
import channelAvatar from "@/components/icons/channel-avatar.svg";
import Typography from "@/components/Typography";
import LoadableImage from "@/components/LoadableImage";
import { isValidImageUrl } from "@/lib/isValidImageUrl";

export default function PromotedChannels() {
  const { data, isLoading } = trpc.organizers.getPromotedOrganizers.useQuery(undefined, {
    retry: false,
    staleTime: Infinity,
  })

  if (isLoading || !data?.length) return null

  return (
    <div className="flex overflow-y-auto gap-3">
      {data?.map(channel => (
        <ChannelCard data={channel} key={channel.user_id} />
      ))}
    </div>
  )
}

function ChannelCard({ data }: { data: Channel }) {
  return (
    <Link
      href={`/channels/${data.user_id}`}
      className="p-3 bg-white rounded-md max-w-40 min-w-[7rem]"
    >
      <LoadableImage className='mb-3' src={isValidImageUrl(data.org_image) ? data.org_image : channelAvatar.src} size={200} />
      <div className="text-center">
        <div
          className="font-[590] mb-2 text-[14px] leading-[19px] tracking h-9 overflow-hidden break-words line-clamp-2"
        >
          {data.org_channel_name || "Untitled channel"}
        </div>
        <div className="flex gap-[2px] justify-center text-[#8E8E93]">
          <Typography
            variant="caption1"
            className='font-semibold'
          >
            {data.hosted_event_count || "0"}
          </Typography>
          <Typography variant="caption1" className='font-light'>&nbsp;Events</Typography>
        </div>
      </div>
    </Link>
  );
}