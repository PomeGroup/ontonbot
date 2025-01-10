import { Block, Button, Card, Sheet } from "konsta/react";
import { useState } from "react";
import Typography from "../../components/Typography";
import OntonDialog from "@/components/OntonDialog";
import Image from "next/image";
import greenCheckIcon from "./green-check.svg";

export default function PaymentCard({ onPayFinished }: { onPayFinished: () => void }) {
  const [confirmPayDialogOpen, setConfirmPayDialogOpen] = useState(false);
  const [congratsDrawerOpen, setCongratsDrawerOpen] = useState(false);
  // const api = useAddOrder();
  // const transfer = useTransferTon();

  const handlePay = async () => {
    setConfirmPayDialogOpen(false);
    setTimeout(() => {
      setCongratsDrawerOpen(true);
    }, 300);
    // onPayFinished();
    // const sendTo = "";
    // const price = "";
    // try {
    //   const orderData = await api.mutateAsync();
    //   console.log("transfer data", sendTo, Number(price), orderData.payment_type, {
    //     comment: `onton_order=${orderData.order_id}`,
    //   });
    //   try {
    //     await transfer(sendTo, Number(price), orderData.payment_type, {
    //       comment: `onton_order=${orderData.order_id}`,
    //     });
    //     setIsRequestingTicket({ state: true, orderId: orderData.order_id });
    //   } catch (error) {
    //     mainButton?.show().enable();
    //     console.error("Error during transfer:", error);
    //   }
    // } catch (error) {
    //   toast.error("There was an error adding a new order");
    //   mainButton?.show().enable();
    //   console.error("Error adding order:", error);
    // }
  };

  return (
    <Card className="mb-12">
      <Typography
        bold
        variant="headline"
        className="mb-4"
      >
        Organizer Payment
      </Typography>
      <Button
        onClick={() => setConfirmPayDialogOpen(true)}
        className="py-6 rounded-lg"
      >
        Pay 10 TON
      </Button>
      <ConfirmPayDialog
        open={confirmPayDialogOpen}
        onClose={() => setConfirmPayDialogOpen(false)}
        onPay={handlePay}
      />
      <CongratsDrawer
        open={congratsDrawerOpen}
        onClose={() => {
          setCongratsDrawerOpen(false);
          onPayFinished();
        }}
      />
    </Card>
  );
}

function ConfirmPayDialog({ open, onClose, onPay }: { open: boolean; onClose: () => void; onPay: () => void }) {
  return (
    <OntonDialog
      open={open}
      onClose={onClose}
      title="Organizer Payment"
    >
      <Typography
        variant="footnote"
        className="text-[#8E8E93] text-center mb-6 font-normal"
      >
        <b>You are becoming an ONTON organizer.</b>
        In order to create your channel you need to pay 10 tons so that you can create your first event afterwards.
      </Typography>
      <Button
        className="py-6 rounded-lg mb-3"
        onClick={onPay}
      >
        Pay 10 TON
      </Button>
      <Button
        className="py-6 rounded-lg"
        outline
        onClick={onClose}
      >
        Maybe Later
      </Button>
    </OntonDialog>
  );
}

function CongratsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet
      className="w-full"
      opened={open}
      onBackdropClick={onClose}
    >
      <Block>
        <Image
          src={greenCheckIcon}
          width={72}
          height={72}
          className="mx-auto mb-4"
          alt="Success"
        />
        <Typography
          variant="title1"
          className="mb-2 text-center"
        >
          Congratulations!
        </Typography>
        <Typography
          variant="body"
          className="mb-4 text-center"
        >
          You’re now a valuable ONTON organizer, you can create events, sell tickets and enjoy the journey!
        </Typography>
        <Button
          outline
          onClick={onClose}
          className="w-auto py-6 rounded-lg mx-auto px-6"
        >
          Let’s Go!
        </Button>
      </Block>
    </Sheet>
  );
}
