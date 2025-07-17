import Typography from "@/components/Typography";
import { AlertGeneric } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventPaymentType, EventTicketType } from "@/db/schema/eventPayment";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { ChevronRight } from "lucide-react";
import ManageEventCard from "../ManageEventCard";

const MangeEventCurrency = () => {
  const { changePaymentType, errors, paidData } = useCreateEventStore((state) => {
    return {
      errors: state.paid_info_errors,
      paidData: state.eventData.paid_event,
      changePaymentType: state.changePaymentType,
    };
  });

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <div>
          <label
            className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]"
            htmlFor={"country"}
          >
            Ticket Currency
          </label>
          <Button
            variant="ghost"
            className="w-full flex-1 bg-brand-divider"
          >
            {paidData.payment_type ? (
              <p>{paidData.payment_type}</p>
            ) : (
              <p className="text-[#8f8f90]">Choose a currency for ticket prices</p>
            )}
            <ChevronRight className="ml-auto h-5.5 text-[#3C3C434D]" />
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent title="Choose Currency">
        <ScrollArea className="overflow-y-auto">
          <RadioGroup
            onValueChange={(value) => {
              changePaymentType(value.toUpperCase() as EventPaymentType);
            }}
            value={paidData.payment_type?.toLowerCase()}
            className="flex flex-col items-start"
            defaultValue="ton"
          >
            <div className="flex items-center space-x-2 flex-1">
              <RadioGroupItem
                value="ton"
                id="ton"
              />
              <label htmlFor="ton">TON</label>
            </div>
            <div className="flex items-center space-x-2 flex-1">
              <RadioGroupItem
                value="usdt"
                id="usdt"
              />
              <label htmlFor="usdt">USDT</label>
            </div>
            <div className="flex items-center space-x-2 flex-1">
              <RadioGroupItem
                value="star"
                id="star"
              />
              <label htmlFor="star">Stars</label>
            </div>
          </RadioGroup>
        </ScrollArea>

        <Button
          type="button"
          variant="primary"
          onClick={(e) => {
            e.preventDefault();
          }}
        >
          Submit
        </Button>
      </DrawerContent>
    </Drawer>
  );
};

const MangeEventTicket = () => {
  const { changeTicketType, errors, isPaidEvent, paidData, changePaymentAmount, setPaidData, togglePaidEvent } =
    useCreateEventStore((state) => {
      return {
        togglePaidEvent: state.togglePaidEvent,
        isPaidEvent: state.eventData.paid_event.has_payment,
        changeTicketType: state.changeTicketType,
        paidData: state.eventData.paid_event,
        setPaidData: state.setEventData,
        errors: state.paid_info_errors,
        changePaymentAmount: state.changePaymentAmount,
      };
    });

  return (
    <ManageEventCard
      hasSwitch
      switchState={isPaidEvent}
      onSwitch={togglePaidEvent}
      title="Ticket"
      hiddenContent={
        <AlertGeneric variant="info-light">Once set, ticket’ type, currency, and details can’t be edited.</AlertGeneric>
      }
    >
      <AlertGeneric variant="info-light">Once set, ticket’ type, currency, and details can’t be edited.</AlertGeneric>
      <MangeEventCurrency />
      <div>
        <div className="flex justify-between items-center">
          <Typography
            variant="body"
            weight="medium"
          >
            Ticket type
          </Typography>
        </div>
        <div className="mt-1 flex-1 font-normal text-[13px] leading-4 tracking-normal text-[#3C3C4399]">
          Choose the type of tickets you want to create for this event, beforehead.
        </div>
      </div>
      <div>
        <RadioGroup
          value={paidData.ticket_type}
          onValueChange={(state) => {
            changeTicketType(state as EventTicketType);
          }}
          className="flex items-center"
        >
          <div className="flex items-center space-x-2 flex-1">
            <RadioGroupItem
              value={"NFT" as const}
              id="NFT"
            />
            <label htmlFor="NFT">NFT</label>
          </div>
          <div className="flex items-center space-x-2 flex-1">
            <RadioGroupItem
              value={"TSCSBT" as const}
              id="TSCSBT"
            />
            <label htmlFor="TSCSBT">cSBT</label>
          </div>
        </RadioGroup>
      </div>
      <Input
        label="Refund wallet"
        placeholder="Wallet address for ticket pool refund"
        name="refund_wallet"
        defaultValue={paidData.payment_recipient_address}
        onBlur={(e) => {
          e.preventDefault();
          setPaidData({
            paid_event: {
              ...paidData,
              payment_recipient_address: e.target.value,
            },
          });
        }}
        errors={errors.payment_recipient_address}
      />
    </ManageEventCard>
  );
};

export default MangeEventTicket;
