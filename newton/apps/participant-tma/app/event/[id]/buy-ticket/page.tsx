"use client";
import Image from "next/image";
import { Card, CardContent } from "@ui/base/card";
import { Section } from "@ui/base/section";
import ButtonTma from "@ui/components/Button";
import PageTma from "@ui/components/Page";
import { FaMinus, FaPlus } from "react-icons/fa";

import BuyTicketForm from "~/components/event/buy-ticket/BuyTicketForm";
import { useEventData } from "~/hooks/queries/useEventData";
import QueryState from "@ui/components/blocks/QueryState";

type BuyTicketProps = {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | undefined };
};

const BuyTicket = ({ params, searchParams }: BuyTicketProps) => {
  const { data: event, isError, isLoading } = useEventData(params.id);

  const utm_tag = searchParams.utm_campaign || null;

  if (isLoading) {
    return <QueryState />;
  }

  if (utm_tag) {
    console.log("ptma_buy_ticket_page_utm", `utm_campaign = ${utm_tag}`);
  }

  if (isError || !event) {
    return <QueryState isError={isError} />;
  }

  if (!event.eventTicket || !event.ticketToCheckIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#EFEFF4] text-center">
        <h1>This event does not require ticket to Check-In</h1>
      </div>
    );
  }

  return (
    <PageTma className={"bg-telegram-secondary-bg-color flex flex-col gap-6 pt-0"}>
      <Section
        className="grid gap-4 pt-7"
        variant={"plain"}
      >
        <h2 className="type-title-3 font-bold">Checkout</h2>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                priority
                alt={"ticket image"}
                width={64}
                height={64}
                className="h-16 w-16 rounded-sm border-[0.34px]"
                src={event.eventTicket.ticketImage as string}
              />
              <div className={"flex flex-col"}>
                <h5 className="type-headline font-semibold">{event.eventTicket.price} TON</h5>
                <p className="type-subtitle-2 text-telegram-hint-color font-normal">{event.eventTicket.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ButtonTma
                buttonColor={"gray"}
                disabled
                className=" h-8 w-8 rounded-full"
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
                buttonColor={"gray"}
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
      <BuyTicketForm
        isSoldOut={event.isSoldOut}
        userHasTicket={!!event.userTicket}
        orderAlreadyPlace={event.orderAlreadyPlace}
        id={params.id}
        sendTo={event.wallet_address}
        eventTicketId={event.eventTicket.id}
        price={event.eventTicket.price}
        utm_tag={utm_tag}
        paymentType={event.eventTicket.payment_type}
      />
    </PageTma>
  );
};

export default BuyTicket;
