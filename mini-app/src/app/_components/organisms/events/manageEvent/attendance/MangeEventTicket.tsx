import Typography from "@/components/Typography";
import { AlertGeneric } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import ManageEventCard from "../ManageEventCard";

const MangeEventCurrency = () => {
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
            {/* Placeholder text */}
            <p className="text-[#8f8f90]">Choose a currency for ticket prices</p>
            <ChevronRight className="ml-auto h-5.5 text-[#3C3C434D]" />
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent title="Choose Currency">
        <ScrollArea className="overflow-y-auto">wow</ScrollArea>

        <Button variant="primary">Submit</Button>
      </DrawerContent>
    </Drawer>
  );
};

const MangeEventTicket = () => {
  return (
    <ManageEventCard
      hasSwitch
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
        <RadioGroup className="flex items-center">
          <div className="flex items-center space-x-2 flex-1">
            <RadioGroupItem
              value="nft"
              id="nft"
            />
            <label htmlFor="option-one">NFT</label>
          </div>
          <div className="flex items-center space-x-2 flex-1">
            <RadioGroupItem
              value="csbt"
              id="csbt"
            />
            <label htmlFor="csbt">cSBT</label>
          </div>
        </RadioGroup>
      </div>
      <Input
        label="Refund wallet"
        placeholder="Wallet address for ticket pool refund"
        name="refund_wallet"
      />
    </ManageEventCard>
  );
};

export default MangeEventTicket;
