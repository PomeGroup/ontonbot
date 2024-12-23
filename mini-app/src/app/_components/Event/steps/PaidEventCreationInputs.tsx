import React from "react";
import ListLayout from "../../atoms/cards/ListLayout";
import { ListInput, ListItem, Segmented, SegmentedButton, Toggle } from "konsta/react";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { SiTether, SiTon } from "react-icons/si";
import { cn } from "@/utils";
import { UploadImageFile } from "@/components/ui/upload-file";
import { TonConnectButton } from "@tonconnect/ui-react";

function SelectPayment() {
  const { payment, changePaymentType } = useCreateEventStore((state) => ({
    payment: state.eventData?.paid_event,
    changePaymentType: state.changePaymentType,
  }));

  return (
    <ListItem
      title="Payment Type"
      footer={
        <>
          <p>Your ticket payment method, users will pay either TON or ton USDT.</p>
          <Segmented strong>
            <SegmentedButton
              strong
              onClick={(e) => {
                e.preventDefault();
                changePaymentType("USDT");
              }}
              active={payment.payment_type === "USDT"}
              itemType="button"
            >
              <p
                className={cn("flex gap-1 items-center text-cn-muted-foreground", {
                  "text-green-600 font-extrabold": payment.payment_type === "USDT",
                })}
              >
                <span>USDT</span> <SiTether />
              </p>
            </SegmentedButton>
            <SegmentedButton
              strong
              active={payment.payment_type === "TON"}
              onClick={(e) => {
                e.preventDefault();
                changePaymentType("TON");
              }}
              itemType="button"
            >
              <p
                className={cn("flex gap-1 items-center text-cn-muted-foreground", {
                  "text-sky-600 font-extrabold": payment.payment_type === "TON",
                })}
              >
                <span>TON</span> <SiTon />
              </p>
            </SegmentedButton>
          </Segmented>
        </>
      }
    />
  );
}

function PaymentAmount() {
  const { payment, changePaymentAmount, paid_info_errors } = useCreateEventStore((state) => ({
    payment: state.eventData?.paid_event,
    changePaymentAmount: state.changePaymentAmount,
    paid_info_errors: state.paid_info_errors,
  }));

  return (
    <>
      <ListInput
        outline
        required
        title="Price"
        type="number"
        inputMode="number"
        placeholder={`Payment amount in ${payment.payment_type}`}
        value={payment.payment_amount}
        onChange={(e) => changePaymentAmount(Number(e.target.value))}
        error={paid_info_errors.payment_amount?.[0]}
      />
    </>
  );
}

function PaymentsRecepient() {
  const { recepient_error_messages } = useCreateEventStore((state) => ({
    recepient_error_messages: state.paid_info_errors.payment_recipient_address,
  }));

  return (
    <ListItem
      title="Recepient"
      footer={
        <>
          {/* The Current Connected Wallet will be used as the Recepient */}
          <div className="flex justify-center items-center py-1">
            <TonConnectButton />
          </div>
          {/* Error masseges will be showen bellow */}
          {recepient_error_messages?.length && <p className="text-red-500">{recepient_error_messages[0]}</p>}
        </>
      }
    />
  );
}

function NFTImage() {
  const { changeNFTImage, paid_info_errors, nft_image, isEdit } = useCreateEventStore((state) => ({
    changeNFTImage: state.changeNFTImage,
    paid_info_errors: state.paid_info_errors,
    nft_image: state.eventData.paid_event.nft_image_url,
    isEdit: Boolean(state.edit?.eventHash),
  }));

  return (
    <div className="p-4">
      <UploadImageFile
        infoText="This image is used as the NFT ticket"
        changeText="Change Ticket Image"
        disabled={isEdit}
        triggerText="Upload Ticket Image"
        onImageChange={changeNFTImage}
        defaultImage={nft_image}
        isError={Boolean(paid_info_errors.nft_image_url?.[0])}
      />
    </div>
  );
}

function NFTInfo() {
  const { payment, changeTitle, changeDescription, paid_info_errors, isEdit } = useCreateEventStore((state) => ({
    payment: state.eventData?.paid_event,
    changeTitle: state.changeNFTTitle,
    changeDescription: state.changeNFTDescription,
    paid_info_errors: state.paid_info_errors,
    isEdit: Boolean(state.edit?.eventHash),
  }));

  return (
    <>
      <ListInput
        outline
        required
        placeholder="Title used for NFT ticket"
        title="NFT Title"
        inputClassName={cn(isEdit && "cursor-not-allowed opacity-50")}
        value={payment.nft_title}
        onChange={(e) => {
          changeTitle(e.target.value);
        }}
        info="You will not be able to change this information about your nft collection later after event creation."
        disabled={isEdit}
        error={paid_info_errors.nft_title?.[0]}
      />
      <ListInput
        outline
        required
        placeholder="Description used for NFT ticket"
        inputClassName={cn(isEdit && "cursor-not-allowed opacity-50")}
        info="You will not be able to change this information about your nft collection later after event creation."
        title="NFT Description"
        value={payment.nft_description}
        onChange={(e) => {
          changeDescription(e.target.value);
        }}
        disabled={isEdit}
        error={paid_info_errors.nft_description?.[0]}
      />
    </>
  );
}

function Capacity() {
  const { capacity, setEventData, paid_info_errors, isEdit, bought_capacity } = useCreateEventStore((state) => ({
    capacity: state.eventData?.capacity,
    setEventData: state.setEventData,
    paid_info_errors: state.paid_info_errors,
    isEdit: Boolean(state.edit?.eventHash),
    bought_capacity: state.eventData.paid_event.bought_capacity,
  }));

  return (
    <>
      <ListInput
        outline
        inputMode="number"
        type="number"
        error={paid_info_errors.capacity?.[0]}
        value={capacity}
        onChange={(e) => {
          const value = e.target.value;
          const numValue = Number(value);
          setEventData({ capacity: value === "" ? undefined : numValue >= 1 ? numValue : 1 });
        }}
        label="Capacity"
        required
        info="Number users who can buy your NFT, 0.055 TON for each NFT (minting fee)"
      />

      {isEdit && (
        <ListItem
          title="Bought Capacity"
          footer="The maximum capacity you can change without extra payment is the bought capacity. If the input capacity exceeds this, you'll need to pay for the extra."
          after={<b className="font-extrabold">{bought_capacity}</b>}
        />
      )}
    </>
  );
}

/* ---------------------------------
 * ----- ☀️  MAIN COMPONENT ☀️  ------
 * ---------------------------------
 * The default export and this is used to combine all other above ones
 */
const PaidEventCreationInputs = () => {
  const { payment, toggleIsPaidEvent, isEdit } = useCreateEventStore((state) => ({
    payment: state.eventData?.paid_event,
    toggleIsPaidEvent: state.togglePaidEvent,
    isEdit: Boolean(state.edit?.eventHash),
  }));

  return (
    <ListLayout title="Paid Event">
      <ListItem
        title="Is Paid"
        className={cn({
          "opacity-50": isEdit,
        })}
        after={
          <Toggle
            checked={payment?.has_payment}
            onChange={() => {
              toggleIsPaidEvent();
            }}
          />
        }
      />
      {payment.has_payment && (
        <>
          <SelectPayment />
          <PaymentAmount />
          <PaymentsRecepient />
          <NFTImage />
          <NFTInfo />
          <Capacity />
        </>
      )}
    </ListLayout>
  );
};

export default PaidEventCreationInputs;
