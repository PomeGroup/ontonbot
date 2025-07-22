"use client";

import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { Input } from "@/components/ui/input";
import { useConfig } from "@/context/ConfigContext";
import useTransferTon from "@/hooks/useTransfer";
import { zodResolver } from "@hookform/resolvers/zod";
import { Address } from "@ton/core";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// schema
const guestSchema = z.object({
  ticketId: z.number(),
  full_name: z.string().min(1, "Name is required"),
  wallet: z.string().refine((v) => {
    try {
      Address.parse(v);
      return true;
    } catch {
      return false;
    }
  }, "Invalid TON address"),
  company: z.string().optional(),
  position: z.string().optional(),
});

const formSchema = z.object({
  guests: z.array(guestSchema),
});

type FormValues = z.infer<typeof formSchema>;

/* ── page ────────────────────────────────────────────────── */
export default function GuestRegisterPage() {
  const router = useRouter();
  const { hash: eventUuid } = useParams<{ hash: string }>();
  const search = useSearchParams();
  const config = useConfig();
  const transfer = useTransferTon();

  /* --- cart ------------------------------------------------ */
  const cart = useMemo(
    () =>
      search
        .getAll("t")
        .map((s) => s.split(":").map(Number))
        .filter(([id, q]) => !!id && !!q)
        .map(([id, qty]) => ({ id, qty: qty! })),
    [search]
  );

  /* extras */
  const couponCode = search.get("coupon") ?? undefined;
  const affiliateId = search.get("aff") ?? undefined;

  /* --- ticket meta ---------------------------------------- */
  const { data: ticketResp } = trpc.events.getTickets.useQuery({ event_uuid: eventUuid }, { enabled: cart.length > 0 });
  const ticketMap = useMemo(
    () => Object.fromEntries((ticketResp?.tickets ?? []).map((t) => [t.id, t] as const)),
    [ticketResp?.tickets]
  );

  /* --- form state ----------------------------------------- */
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    const defaultGuests = cart.flatMap(({ id, qty }) =>
      Array.from({ length: qty }, () => ({
        ticketId: id,
        full_name: "",
        wallet: "",
        company: "",
        position: "",
      }))
    );
    form.reset({ guests: defaultGuests });
  }, [cart, form.reset]);

  /* --- mutation - create order ---------------------------- */
  const addOrder = trpc.orders.addOrder.useMutation({
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: async (data) => {
      try {
        if (!config.ONTON_WALLET_ADDRESS) {
          toast.error("TON wallet address is not configured.");
          return;
        }
        await transfer(config.ONTON_WALLET_ADDRESS as string, data.total_price, data.payment_type, {
          comment: `OntonOrder=${data.order_id}`,
        });
        router.replace(`/events/${eventUuid}/payment/${data.order_id}`);
      } catch (err) {
        toast.error("Payment was cancelled.");
      }
    },
  });

  /* --- submit handler ------------------------------------- */
  const onSubmit = (data: FormValues) => {
    const guestsPayload = data.guests.map((guest) => ({
      event_payment_id: guest.ticketId,
      full_name: guest.full_name,
      wallet: guest.wallet,
      company: guest.company || undefined,
      position: guest.position || undefined,
    }));

    addOrder.mutate({
      event_uuid: eventUuid,
      guests: guestsPayload,
      buyer_wallet: guestsPayload[0].wallet,
      buyer_telegram: "", // fill as needed
      affiliate_id: affiliateId,
      coupon_code: couponCode,
    });
  };

  let guestIndex = 0;

  /* ========================== JSX ========================= */
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="p-4 space-y-6"
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
          <CustomCard
            key={id}
            className="rounded-xl p-3 space-y-4"
          >
            <Typography
              variant="headline"
              weight="medium"
            >
              {title} ({qty})
            </Typography>

            {Array.from({ length: qty }).map((_, idx) => {
              const currentIndex = guestIndex++;
              return (
                <div
                  key={currentIndex}
                  className="border-t border-brand-stroke pt-3 space-y-2"
                >
                  <Typography
                    variant="subheadline1"
                    weight="medium"
                  >
                    Guest&nbsp;{idx + 1}
                  </Typography>

                  <div className="space-y-4">
                    <Input
                      label="Name"
                      placeholder="Full name"
                      {...form.register(`guests.${currentIndex}.full_name`)}
                      errors={form.formState.errors.guests?.[currentIndex]?.full_name?.message}
                    />
                    <Input
                      label="Wallet"
                      placeholder="EQ… / UQ…"
                      {...form.register(`guests.${currentIndex}.wallet`)}
                      errors={form.formState.errors.guests?.[currentIndex]?.wallet?.message}
                    />
                    <Input
                      label="Company"
                      placeholder="Your Company"
                      {...form.register(`guests.${currentIndex}.company`)}
                      errors={form.formState.errors.guests?.[currentIndex]?.company?.message}
                    />
                    <Input
                      label="Position"
                      placeholder="Your Job Position"
                      {...form.register(`guests.${currentIndex}.position`)}
                      errors={form.formState.errors.guests?.[currentIndex]?.position?.message}
                    />
                  </div>
                </div>
              );
            })}
          </CustomCard>
        );
      })}

      {/* footer */}
      <MainButton
        text="Check&nbsp;out"
        disabled={addOrder.isPending || addOrder.isSuccess}
        onClick={form.handleSubmit(onSubmit)}
      />
    </form>
  );
}
