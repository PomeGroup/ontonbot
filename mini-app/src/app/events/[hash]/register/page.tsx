/* app/events/[hash]/register/page.tsx */
"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { List, ListInput } from "konsta/react";
import { trpc } from "@/app/_trpc/client";
import { GuestTicketSchema } from "@/types";
import Typography from "@/components/Typography";
import CustomButton from "@/app/_components/Button/CustomButton";
import { Address } from "@ton/core";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useTransferTon from "@/hooks/useTransfer";
import { useConfig } from "@/context/ConfigContext";

/* ── helpers ─────────────────────────────────────────────── */
type CartRow = { id: number; qty: number };
type FieldErrs = Record<string, string[]>;

/* ── page ────────────────────────────────────────────────── */
export default function GuestRegisterPage() {
  const router = useRouter();
  const { hash: eventUuid } = useParams<{ hash: string }>();
  const search = useSearchParams();
  const config = useConfig();
  const transfer = useTransferTon();

  /* --- cart ------------------------------------------------ */
  const cart: CartRow[] = useMemo(
    () =>
      search
        .getAll("t")
        .map((s) => s.split(":").map(Number))
        .filter(([id, q]) => !!id && !!q)
        .map(([id, qty]) => ({ id, qty })),
    [search]
  );

  /* extras */
  const couponCode = search.get("coupon") ?? undefined;
  const affiliateId = search.get("aff") ?? undefined;
  console.log("Config:", config);
  /* --- ticket meta ---------------------------------------- */
  const { data: ticketResp } = trpc.events.getTickets.useQuery({ event_uuid: eventUuid }, { enabled: cart.length > 0 });
  const ticketMap = useMemo(
    () => Object.fromEntries((ticketResp?.tickets ?? []).map((t) => [t.id, t] as const)),
    [ticketResp?.tickets]
  );

  /* --- guests --------------------------------------------- */
  const guests = useMemo(
    () =>
      cart.flatMap(({ id, qty }) =>
        Array.from({ length: qty }, (_, i) => ({
          ticketId: id,
          key: `${id}-${i}`,
        }))
      ),
    [cart]
  );

  /* --- form state ----------------------------------------- */
  const formRef = useRef<HTMLFormElement>(null);
  const [rowErrs, setRowErrs] = useState<Record<string, FieldErrs>>({});
  const [submitting, setSubmitting] = useState(false);

  /* --- mutation - create order ---------------------------- */
  const addOrder = trpc.orders.addOrder.useMutation({
    onError: (err) => {
      toast.error(err.message);
      setSubmitting(false);
    },
    onSuccess: async (data) => {
      try {
        /* 1️⃣  trigger TON-Connect modal */
        if (!config.ONTON_WALLET_ADDRESS) {
          toast.error("TON wallet address is not configured.");
          setSubmitting(false);
          return;
        }
        console.log("Transferring TON to", config.ONTON_WALLET_ADDRESS, "for order", data.order_id);
        await transfer(config.ONTON_WALLET_ADDRESS as string, data.total_price, data.payment_type, {
          comment: `OntonOrder=${data.order_id}`,
        });

        /* 2️⃣  go to the payment-watch page */
        router.replace(`/events/${eventUuid}/payment/${data.order_id}`);
      } catch (err) {
        // user rejected or tx failed – do nothing except notify
        toast.error("Payment was cancelled.");
        setSubmitting(false);
      }
    },
  });

  /* --- submit handler ------------------------------------- */
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const fd = new FormData(formRef.current);
    const errs: Record<string, FieldErrs> = {};
    const guestsPayload: {
      event_payment_id: number;
      full_name: string;
      wallet: string;
      company?: string;
      position?: string;
    }[] = [];

    const get = (k: string) => fd.get(k)?.toString() ?? "";

    /* validate every seat */
    guests.forEach(({ key, ticketId }) => {
      const candidate = {
        event_uuid: eventUuid,
        ticket_id: ticketId,
        full_name: get(`${key}__full_name`),
        wallet: get(`${key}__wallet`),
        company: get(`${key}__company`),
        position: get(`${key}__position`),
      };

      const parsed = GuestTicketSchema.safeParse(candidate);
      if (!parsed.success) {
        errs[key] = parsed.error.flatten().fieldErrors;
        return;
      }

      try {
        Address.parse(parsed.data.wallet); // extra TON validity check
      } catch {
        errs[key] = { wallet: ["Invalid TON address"] };
        return;
      }

      guestsPayload.push({
        event_payment_id: parsed.data.ticket_id,
        full_name: parsed.data.full_name,
        wallet: parsed.data.wallet,
        company: parsed.data.company || undefined,
        position: parsed.data.position || undefined,
      });
    });

    setRowErrs(errs);
    if (Object.keys(errs).length) return;

    /* ---- create order then pay --------------------------- */
    setSubmitting(true);
    addOrder.mutate({
      event_uuid: eventUuid,
      guests: guestsPayload,
      buyer_wallet: guestsPayload[0].wallet,
      buyer_telegram: "", // fill as needed
      affiliate_id: affiliateId,
      coupon_code: couponCode,
    });
  };

  /* reset errors when guest count changes */
  useEffect(() => setRowErrs({}), [guests.length]);

  /* ========================== JSX ========================= */
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="p-4 space-y-6 pb-32"
    >
      <Typography
        variant="title3"
        weight="bold"
      >
        Guest&nbsp;Registration
      </Typography>

      {cart.map(({ id, qty }) => {
        const title = ticketMap[id]?.title ?? `Ticket ${id}`;

        return (
          <div
            key={id}
            className="bg-brand-fill-bg rounded-xl p-3 space-y-4"
          >
            <Typography
              variant="headline"
              weight="medium"
            >
              {title} ({qty})
            </Typography>

            {Array.from({ length: qty }).map((_, idx) => {
              const key = `${id}-${idx}`;
              const err = rowErrs[key] ?? {};

              return (
                <div
                  key={key}
                  className="border-t border-brand-stroke pt-3 space-y-2"
                >
                  <Typography
                    variant="subheadline1"
                    weight="medium"
                  >
                    Guest&nbsp;{idx + 1}
                  </Typography>

                  <List strongIos>
                    <ListInput
                      outline
                      label="Name"
                      name={`${key}__full_name`}
                      placeholder="Full name"
                      error={err.full_name?.[0]}
                    />
                    <ListInput
                      outline
                      label="Wallet"
                      name={`${key}__wallet`}
                      placeholder="EQ… / UQ…"
                      error={err.wallet?.[0]}
                    />
                    <ListInput
                      outline
                      label="Company"
                      name={`${key}__company`}
                      placeholder="Your Company"
                      error={err.company?.[0]}
                    />
                    <ListInput
                      outline
                      label="Position"
                      name={`${key}__position`}
                      placeholder="Your Job Position"
                      error={err.position?.[0]}
                    />
                  </List>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* footer */}
      <div className="fixed bottom-0 inset-x-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] bg-white pt-3 border-t border-brand-stroke">
        <CustomButton
          variant="primary"
          isLoading={submitting}
          onClick={() => formRef.current?.requestSubmit()}
        >
          Check&nbsp;out
        </CustomButton>
      </div>
    </form>
  );
}
