"use client";
import ticketIcon from "@/app/_components/icons/ticket.svg";
import ChannelInfoCard from "@/app/_components/channels/ChannelInfoCard";
import { trpc } from "@/app/_trpc/client";
import { useRouter } from "next/navigation";
import ActionCard from "@/ActionCard";

type Props = { params: { id: string } };

export default function ChannelPage({ params }: Props) {
  const { data, isLoading, isError } = trpc.organizers.getOrganizer.useQuery({ user_id: Number(params.id) });

  const router = useRouter();

  if (isLoading) return "loading...";
  if (isError) return "something went wrong...";

  return (
    <div className="bg-[#EFEFF4] py-4">
      <ChannelInfoCard data={data} />
      <ActionCard
        onClick={() => router.push(`/channels/${params.id}/events`)}
        iconSrc={ticketIcon}
        subtitle="Visit organizer events"
        title="Events"
        footerTexts={[{ count: data.hosted_event_count || 0, items: 'Events' }]}
      />
    </div>
  );
}
