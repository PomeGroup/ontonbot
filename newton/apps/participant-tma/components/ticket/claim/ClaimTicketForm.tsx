"use client";

import React, { FormEventHandler, useCallback, useContext, useEffect, useRef } from "react";
import Image from "next/image";
import { useMainButton } from "@tma.js/sdk-react";
import { Card, CardContent } from "@ui/base/card";
import { Input } from "@ui/base/input";
import { Section } from "@ui/base/section";
import { toast } from "@ui/base/sonner";
import SeparatorTma from "@ui/components/Separator";
import { useAtom } from "jotai";

import { isRequestingTicketAtom } from "~/store/atoms/event.atoms";
import { useUserStore } from "~/store/user.store";
import { updateTicketInfo } from "~/services/tickets.services";
import { useRouter } from "next/navigation";
import { TonProofContext } from "~/components/TonProofProvider";

type ClaimTicketFormPropsT = {
  id: string;
  event_uuid: string;
  nftaddress: string
};

interface ClaimTicketFormElement extends HTMLFormElement {
  full_name: HTMLInputElement;
  telegram: HTMLInputElement;
  company: HTMLInputElement;
  position: HTMLInputElement;
  owner_address: HTMLInputElement;
  event_id: HTMLInputElement;
  boc: HTMLInputElement;
  user_id: HTMLInputElement;
}

const ClaimTicketForm = (props: ClaimTicketFormPropsT) => {
  const user = useUserStore((s) => s.user);
  const form = useRef<ClaimTicketFormElement>(null);
  const mainButton = useMainButton(true);
  const router = useRouter()
  const { token } = useContext(TonProofContext)

  const claimTicketUpadteInfo: FormEventHandler<HTMLFormElement> = useCallback(
    async (e) => {
      e.preventDefault();
      if (!form.current) {
        throw new Error("form is not defined");
      }

      if (!token) { throw new Error("token is not provided") }

      const valid = validateForm()
      if (!valid) return

      const formdata = new FormData(form.current);
      const data = Object.fromEntries(formdata) as {
        full_name: string;
        telegram: string;
        company: string;
        position: string;
      };
      mainButton?.showLoader();
      // Send request to backend

      const res = await updateTicketInfo(props.nftaddress, { data, proof_token: token })
      if (res.status === 'success') {
        router.push(`/ticket/${props.event_uuid}`)
        mainButton?.hide().disable();
        mainButton?.hideLoader();
      }

      // if not connected
    },
    [mainButton?.isEnabled, token, form.current],
  );

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

  const submitFormMainButton = () => {
    form.current?.requestSubmit()
  }

  useEffect(() => {
    mainButton?.setText('Update Ticket').show().enable().on('click', submitFormMainButton)
    return () => {
      mainButton?.hide().off('click', submitFormMainButton)
    }
  }, [mainButton])

  return (
    <Section variant={"plain"} className="grid gap-2">
      <h4 className="text-telegram-6-10-section-header-text-color type-footnote font-normal">
        YOUR INFO
      </h4>
      <Card className="divide-y">
        <CardContent className={"py-0 pr-0"}>
          <form ref={form} onSubmit={claimTicketUpadteInfo}>
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
            <FormActionLoader />
          </form>
        </CardContent>
      </Card>
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

function CheckoutInput({
  label,
  name,
  placeholder,
  ...props
}: CheckoutInputProps) {
  return (
    <div className="grid grid-cols-3 items-center p-2.5 px-4 pl-0">
      <div className="col-span-1">
        <label className={"type-body opacity-80"} htmlFor={name}>
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

export default ClaimTicketForm;
