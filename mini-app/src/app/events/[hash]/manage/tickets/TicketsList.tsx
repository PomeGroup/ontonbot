"use client";

import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { useParams, useRouter } from "next/navigation";
import TicketCard from "./TicketCard";

const TicketsList = () => {
  const params = useParams<{ hash: string }>();
  const ticketsListQuery = trpc.events.getTickets.useQuery({
    event_uuid: params.hash,
  });

  const router = useRouter();

  return (
    <div className="space-y-4">
      <Typography
        variant="title3"
        weight="medium"
      >
        Tickets
      </Typography>
      {ticketsListQuery.data?.tickets?.map((ticket) => (
        <TicketCard
          ticket={ticket}
          key={ticket.id}
        />
      ))}
      <MainButton
        onClick={() => {
          router.push(`/events/${params.hash}/manage/tickets/create`);
        }}
        text="Create new ticket"
      />
    </div>
  );
};

export default TicketsList;
