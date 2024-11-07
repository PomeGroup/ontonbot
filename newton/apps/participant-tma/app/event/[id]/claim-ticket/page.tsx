'use client';

import { Card, CardContent } from "@ui/base/card";
import { Section } from "@ui/base/section";
import Image from 'next/image';
import PageTma from "@ui/components/Page";
import ButtonTma from "@ui/components/Button";
import { FaMinus, FaPlus } from "react-icons/fa";
import ClaimTicketForm from "~/components/ticket/claim/ClaimTicketForm";
import { useRouter } from "next/navigation";
import QueryState from "@ui/components/blocks/QueryState";
import { useEventData } from "~/hooks/queries/useEventData";

function ClaimTicket({ params: { id } }: { params: { id: string } }) {
  const router = useRouter();
  const { data: event, isLoading, isError } = useEventData(id)

  if (isLoading || !event) return <QueryState />
  if (isError) return <QueryState isError />

  // Handle navigation based on the event data
  if (!event?.userHasTicket) {
    router.push(`/event/${event?.event_uuid}`);
    return null;
  }

  if (!event.needToUpdateTicket) {
    router.push(`/event/${event.event_uuid}/claim-ticket`);
    return null;
  }

  if (!event.eventTicket || !event.ticketToCheckIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#EFEFF4] text-center">
        <h1>This event does not require a ticket to Check-In</h1>
      </div>
    );
  }

  return (
    <div>
      <PageTma className="bg-telegram-secondary-bg-color flex flex-col gap-6 pt-0">
        <Section className="grid gap-4 pt-7" variant="plain">
          <h2 className="type-title-3 font-bold">Update Ticket Information</h2>
          <Card>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image
                  priority
                  alt="ticket image"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-sm border-[0.34px]"
                  src={event.eventTicket.ticketImage as string}
                />
                <div className="flex flex-col">
                  <h5 className="type-headline font-semibold">
                    {event.eventTicket.price} TON
                  </h5>
                  <p className="type-subtitle-2 text-telegram-hint-color font-normal">
                    {event.eventTicket.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ButtonTma
                  buttonColor="gray"
                  disabled
                  className="h-8 w-8 rounded-full"
                >
                  <FaMinus
                    fill="#8E8E93"
                    className="h-4 w-4"
                    width={32}
                    height={32}
                  />
                </ButtonTma>
                <span className="text-[17px] font-semibold">1</span>
                <ButtonTma
                  buttonColor="gray"
                  disabled
                  className="h-8 w-8 rounded-full"
                >
                  <FaPlus
                    fill="#8E8E93"
                    className="h-4 w-4"
                    width={32}
                    height={32}
                  />
                </ButtonTma>
              </div>
            </CardContent>
          </Card>
        </Section>
        <ClaimTicketForm
          id={id}
          event_uuid={event.event_uuid}
          nftaddress={event.chosenNFTaddress}
        />
      </PageTma>
    </div>
  );
}

export default ClaimTicket;
