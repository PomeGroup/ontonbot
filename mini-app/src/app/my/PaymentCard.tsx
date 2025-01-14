import { Block, Button, Card, Page, Popup, Sheet } from "konsta/react";
import { useState } from "react";
import Typography from "../../components/Typography";
import OntonDialog from "@/components/OntonDialog";
import Image from "next/image";
import greenCheckIcon from "./green-check.svg";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/utils";
import useDisableScrollbar from "@/hooks/ui/useDisableScrollbar";

export default function PaymentCard({ visible, onPayFinished }: { visible: boolean; onPayFinished: () => void }) {
  const [confirmPayDialogOpen, setConfirmPayDialogOpen] = useState(false);
  const [loadingPopupOpen, setLoadingPopupOpen] = useState(false);
  const [congratsDrawerOpen, setCongratsDrawerOpen] = useState(false);
  // const api = useAddOrder();
  // const transfer = useTransferTon();

  const handlePay = async () => {
    setConfirmPayDialogOpen(false);
    setTimeout(() => {
      setLoadingPopupOpen(true);
      setTimeout(() => {
        setLoadingPopupOpen(false);
        onPayFinished();
        setTimeout(() => {
          setCongratsDrawerOpen(true);
        }, 300);
      }, 3000);
    }, 300);

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
    <>
      <Card className={cn("mb-12 hidden", visible && "!block")}>
        <Typography
          bold
          variant="headline"
          className="mb-4"
        >
          Organizer Payment
        </Typography>
        <Button
          onClick={() => setConfirmPayDialogOpen(true)}
          className="py-6 rounded-[10px]"
        >
          Pay 10 TON
        </Button>
      </Card>
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
      <LoadingPopup open={loadingPopupOpen} />
    </>
  );
}

function LoadingPopup({ open }: { open: boolean }) {
  useDisableScrollbar(open);

  return (
    <Popup opened={open}>
      <Page className="flex flex-col h-full justify-center">
        <Block className="overscroll-contain">
          <Typography
            variant="title2"
            className="font-semibold text-center mb-15"
          >
            Checking your payment
          </Typography>
          <DotLottieReact
            loop
            autoplay
            src="/thinking-duck.json"
            height={112}
            width={112}
            className="mx-auto w-[112px] mb-[68px]"
          />
          <Typography
            variant="body"
            className="font-normal mb-7 mx-7 text-center"
          >
            Hold on a second, we need to make sure the payment went through successfully.
          </Typography>
          <Typography
            variant="body"
            className="font-normal text-center text-primary"
          >
            Contact Support
          </Typography>
        </Block>
      </Page>
    </Popup>
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
        variant="body"
        className="text-center mb-6 font-normal"
      >
        <b>You are becoming an ONTON organizer.</b>
        <br />
        In order to create your channel you need to pay 10 tons so that you can create your first event afterwards.
      </Typography>
      <Button
        className="py-6 rounded-[10px] mb-3"
        onClick={onPay}
      >
        Pay 10 TON
      </Button>
      <Button
        className="py-6 rounded-[10px]"
        outline
        onClick={onClose}
      >
        Maybe Later
      </Button>
    </OntonDialog>
  );
}

function CongratsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useDisableScrollbar(open);

  return (
    <Sheet
      className="w-full"
      opened={open}
      onBackdropClick={onClose}
    >
      <Block className="mt-11 mb-8">
        <Image
          src={greenCheckIcon}
          width={72}
          height={72}
          className="mx-auto mb-3"
          alt="Success"
        />
        <Typography
          variant="title1"
          bold
          className="mb-2 text-center"
        >
          Congratulations!
        </Typography>
        <Typography
          variant="body"
          className="mb-4 text-center font-medium text-[#6A7785]"
        >
          You’re now a valuable ONTON organizer, you can create events, sell tickets and enjoy the journey!
        </Typography>
        <Button
          outline
          onClick={onClose}
          className="w-auto py-5 rounded-[10px] mx-auto px-6"
        >
          Let’s Go!
        </Button>
      </Block>
    </Sheet>
  );
}
