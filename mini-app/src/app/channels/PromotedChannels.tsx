import { trpc } from "../_trpc/client";
import { Channel } from "@/types";
import Link from "next/link";
import Image from "next/image";
import channelAvatar from "@/components/icons/channel-avatar.svg";
import Typography from "@/components/Typography";

export default function PromotedChannels() {
  const { data, isLoading } = trpc.organizers.getPromotedOrganizers.useQuery()

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
      {data.org_image ? (
        <Image
          className="rounded-[6px] mb-3 w-full"
          src={data.org_image}
          width={200}
          height={200}
          alt={data.org_channel_name || ""}
        />
      ) : (
        <div className="bg-[#EFEFF4] rounded-[6px]">
          <Image
            className="rounded-md mb-3"
            src={channelAvatar}
            width={200}
            height={200}
            alt={data.org_channel_name || ""}
          />
        </div>
      )}
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