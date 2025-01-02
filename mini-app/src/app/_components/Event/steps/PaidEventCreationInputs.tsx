import ListLayout from "../../atoms/cards/ListLayout";
import { Segmented, SegmentedButton, Toggle } from "konsta/react";
import { SiTether, SiTon } from "react-icons/si";
import { cn } from "@/utils";
import { UploadImageFile } from "@/components/ui/upload-file";
import { ListInput, ListItem } from "konsta/react";
import { useCreateEventStore } from "@/zustand/createEventStore";

function SelectPayment() {
  const { payment, changePaymentType, isEdit } = useCreateEventStore((state) => ({
    payment: state.eventData?.paid_event,
    changePaymentType: state.changePaymentType,
    isEdit: Boolean(state.edit?.eventHash),
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
                !isEdit && changePaymentType("USDT");
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
                !isEdit && changePaymentType("TON");
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
        inputMode="decimal" // Allows decimals on mobile devices
        step="0.001"
        placeholder={`Payment amount in ${payment.payment_type}`}
        value={payment.payment_amount?.toString() || ""} // Display as a string
        onChange={(e) => {
          const inputValue = e.target.value;

          // Match up to 3 decimal places using regex
          const formattedValue = inputValue.match(/^\d*\.?\d{0,3}/)?.[0] || "";

          // Parse as a float if valid; otherwise, 0
          const parsedValue = formattedValue ? parseFloat(formattedValue) : 0;

          changePaymentAmount(parsedValue);
        }}
        error={paid_info_errors.payment_amount?.[0]}
      />
    </>
  );
}

function PaymentsRecepient() {
  const { eventData, setEventData, recepient_error_messages } = useCreateEventStore((state) => ({
    eventData: state.eventData,
    setEventData: state.setEventData,
    recepient_error_messages: state.paid_info_errors.payment_recipient_address,
  }));

  const handleInputChange = (value: string) => {
    console.log("valuevaluevalue", value);
    setEventData({
      paid_event: {
        ...eventData.paid_event,
        payment_recipient_address: value || undefined,
      },
    });
  };

  return (
    <ListItem
      title="Recipient"
      footer={
        <>
          {/* Text Input for Wallet Address */}
          <ListInput
            outline
            required
            label="Wallet Address"
            placeholder="Enter wallet address"
            value={eventData.paid_event?.payment_recipient_address || ""}
            onChange={(e) => handleInputChange(e.target.value)}
            error={recepient_error_messages?.length  && recepient_error_messages?.[0]}
          />
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
  const { payment, toggleIsPaidEvent, editOptions } = useCreateEventStore((state) => ({
    payment: state.eventData?.paid_event,
    toggleIsPaidEvent: state.togglePaidEvent,
     editOptions: state.edit,
  }));

  return (
    <ListLayout title="Paid Event">
      <ListItem
        title="Is Paid"
        after={
          <Toggle
            checked={payment?.has_payment}
            onChange={() => {
              toggleIsPaidEvent();
            }}
            disabled={Boolean(editOptions?.eventHash)}
            colors={{
              checkedBgIos: editOptions?.eventHash ? "bg-blue-300" : "primary",
              checkedBgMaterial: editOptions?.eventHash ? "bg-blue-300" : "primary",
            }}
          />
        }
        footer={<p >Cannot be changed after the event is created.</p>}
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
