"use client";

import React, { FormEventHandler, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useMainButton } from "@tma.js/sdk-react";
import { useTonWallet } from "@tonconnect/ui-react";
import { Card, CardContent } from "@ui/base/card";
import { Input } from "@ui/base/input";
import { Section } from "@ui/base/section";
import { toast } from "@ui/base/sonner";
import SeparatorTma from "@ui/components/Separator";
import { useAtom, useSetAtom } from "jotai";
import { createPortal } from "react-dom";

import BuyTicketTmaSettings from "~/components/event/buy-ticket/BuyTicketTmaSettings";
import { useAddOrderMutation } from "~/hooks/useAddOrderMutation";
import { isRequestingTicketAtom } from "~/store/atoms/event.atoms";
import { useUserStore } from "~/store/user.store";
import BuyTicketTxQueryState from "./BuyTicketTxQueryState";
import { useTransferTon } from "~/hooks/ton.hooks";
import { PaymentType } from "~/types/order.types";

type BuyTicketFormProps = {
  id: string;
  price: string | number;
  isSoldOut: boolean;
  userHasTicket: boolean;
  orderAlreadyPlace: boolean;
  event_uuid: string;
  sendTo: string;
  utm_tag: string | null;
  paymentType: PaymentType;
};

interface BuyTicketFormElement extends HTMLFormElement {
  full_name: HTMLInputElement;
  telegram: HTMLInputElement;
  company: HTMLInputElement;
  position: HTMLInputElement;
  owner_address: HTMLInputElement;
  event_id: HTMLInputElement;
  boc: HTMLInputElement;
  user_id: HTMLInputElement;
}

const BuyTicketForm = (params: BuyTicketFormProps) => {
  const user = useUserStore((s) => s.user);
  const form = useRef<BuyTicketFormElement>(null);
  const setIsRequestingTicket = useSetAtom(isRequestingTicketAtom);
  const wallet = useTonWallet();
  const addOrder = useAddOrderMutation();
  const mainButton = useMainButton(true);
  const transfer = useTransferTon();

  const utm = params.utm_tag || null;

  const buyTicketOnClick: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!form.current) {
      throw new Error("form is not defined");
    }
    const formdata = new FormData(form.current);
    const data = Object.fromEntries(formdata) as {
      full_name: string;
      telegram: string;
      company: string;
      position: string;
      owner_address: string;
    };

    mainButton?.hide().disable();
    mainButton?.hideLoader();
    try {
      const orderData = await addOrder.mutateAsync({
        event_uuid: params.event_uuid,
        utm,
        ...data,
      });

      console.log("transfer data", params.sendTo, Number(params.price), orderData.payment_type, {
        comment: `onton_order=${orderData.order_id}`,
      });

      try {
        await transfer(params.sendTo, Number(params.price), orderData.payment_type, {
          comment: `onton_order=${orderData.order_id}`,
        });
        setIsRequestingTicket({ state: true, orderId: orderData.order_id });
      } catch (error) {
        mainButton?.show().enable();
        console.error("Error during transfer:", error);
      }
    } catch (error) {
      toast.error("There was an error adding a new order");
      mainButton?.show().enable();
      console.error("Error adding order:", error);
    }

    // if not connected
  };

  const validateForm = useCallback(() => {
    const fields = ["full_name", "telegram", "company", "position"];
    let isValid = true;

    fields.forEach((field) => {
      if (!form.current?.[field].value) {
        toast.error(`Please fill in the information about yourself`, {
          icon: (
            <Image
              src={"/ptma/info-icon.svg"}
              alt={"info"}
              width={24}
              height={24}
            />
          ),
          id: "form-error-toast",
          duration: 5000,
        });
        isValid = false;
      }
    });

    if (isValid) {
      form.current?.requestSubmit();
    }

    return isValid;
  }, []);

  return (
    <Section
      variant={"plain"}
      className="grid gap-2"
    >
      <h4 className="text-telegram-6-10-section-header-text-color type-footnote font-normal">YOUR INFO</h4>
      <Card className="divide-y">
        <CardContent className={"py-0 pr-0"}>
          <form
            ref={form}
            onSubmit={buyTicketOnClick}
          >
            <CheckoutInput
              defaultValue={`${user?.first_name} ${user?.last_name}`}
              label="Name"
              name="full_name"
              placeholder="Full Name"
            />
            <SeparatorTma className={"m-0"} />
            <CheckoutInput
              defaultValue={`@${user?.username}`}
              label="Telegram"
              name="telegram"
              placeholder="@username"
            />
            <SeparatorTma className={"m-0"} />
            <CheckoutInput
              label="Company"
              name="company"
              placeholder="Company"
            />
            <SeparatorTma className={"m-0"} />
            <CheckoutInput
              label="Position"
              name="position"
              placeholder="Designer"
            />
            {/* other data */}
            <input
              type="hidden"
              name="owner_address"
              value={wallet?.account.address}
            />
            <FormActionLoader />
          </form>
        </CardContent>
      </Card>
      <BuyTicketTmaSettings
        isSoldOut={params.isSoldOut}
        userHasTicket={params.userHasTicket}
        orderAlreadyPlace={params.orderAlreadyPlace}
        price={params.price}
        validateForm={validateForm}
        paymentType={params.paymentType}
        eventId={params.id}
      />
      {typeof window !== "undefined" && createPortal(<BuyTicketTxQueryState />, document.body)}
    </Section>
  );
};

function FormActionLoader() {
  const [isRequestingTicket] = useAtom(isRequestingTicketAtom);

  const mainButton = useMainButton(true);

  useEffect(() => {
    mainButton?.hideLoader();

    if (isRequestingTicket) {
      mainButton?.hide().disable();
    } else {
      mainButton?.show().enable();
    }
  }, [isRequestingTicket, mainButton]);

  return <></>;
}

type CheckoutInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

function CheckoutInput({ label, name, placeholder, ...props }: CheckoutInputProps) {
  return (
    <div className="grid grid-cols-3 items-center p-2.5 px-4 pl-0">
      <div className="col-span-1">
        <label
          className={"type-body opacity-80"}
          htmlFor={name}
        >
          {label}
        </label>
      </div>
      <Input
        className="col-span-2 rounded-none"
        type="text"
        placeholder={placeholder}
        name={name}
        id={name}
        {...props}
      />
    </div>
  );
}

export default BuyTicketForm;
