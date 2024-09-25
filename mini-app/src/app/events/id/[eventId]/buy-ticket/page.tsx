import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import ButtonTma from "@/components/Button";
import { FaMinus, FaPlus } from "react-icons/fa";
import BuyTicketForm from "@/components/event/buy-ticket/BuyTicketForm";
import { getEventData } from "@/services/event.services";
import { Card, CardContent } from "@/components/base/card";
import PageTma from "@/components/Page";
import { Section } from "@/components/base/section";

type BuyTicketProps = {
  params: { eventId: string };
};

const BuyTicket = async ({ params }: BuyTicketProps) => {
  noStore();
  const event = await getEventData(params.eventId);

  if (!event) {
    return <div>Event not found</div>;
  }

  if (!event.eventTicket || !event.ticketToCheckIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#EFEFF4] text-center">
        <h1>This event does not require ticket to Check-In</h1>
      </div>
    );
  }

  return (
    <PageTma
      className={"bg-telegram-secondary-bg-color flex flex-col gap-6 pt-0"}
    >
      <Section
        className="greventId gap-4 pt-7"
        variant={"plain"}
      >
        <h2 className="type-title-3 font-bold">Checkout</h2>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                priority
                alt={"ticket image"}
                // weventIdth={64}
                height={64}
                className="h-16 w-16 rounded-sm border-[0.34px]"
                src={event.eventTicket.ticketImage as string}
              />
              <div className={"flex flex-col"}>
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
                buttonColor={"gray"}
                disabled
                className=" h-8 w-8 rounded-full"
              >
                <FaMinus
                  fill="#8E8E93"
                  className="h-4 w-4"
                  // weventIdth={32}
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
                  // weventIdth={32}
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
        id={params.eventId}
        sendTo={event.wallet_address}
        eventTicketId={event.eventTicket.id}
        price={event.eventTicket.price}
      />
    </PageTma>
  );
};

export default BuyTicket;
