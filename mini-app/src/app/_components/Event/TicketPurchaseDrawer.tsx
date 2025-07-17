"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KSheet } from "@/components/ui/drawer";
import CustomButton from "@/app/_components/Button/CustomButton";
import LoadableImage from "@/components/LoadableImage";
import Typography from "@/components/Typography";
import PlusMinusInput from "@/app/_components/Event/PromotionCode/PlusMinusInput";
import { EventPaymentSelectType } from "@/db/schema/eventPayment";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tickets: EventPaymentSelectType[];
  eventTitle: string;
  /** needed for the checkout URL */
  eventUuid: string;
};

export const TicketPurchaseDrawer: React.FC<Props> = ({ open, onOpenChange, tickets, eventTitle, eventUuid }) => {
  const router = useRouter();

  /* ───── simple cart state { ticketId → qty } ───── */
  const [cart, setCart] = useState<Record<number, number>>({});

  const addToCart = (id: number) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));

  const setQty = (id: number, qty: number) =>
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  /* total tickets selected */
  const totalItems = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  /* called when user hits “Continue Purchasing” */
  const toCheckout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // ⬅️ block the default <button> “submit / focus‐loss” behaviour
    e.stopPropagation(); // ⬅️ optional, avoids bubbling if this drawer lives in another clickable layer

    const params = new URLSearchParams();
    Object.entries(cart).forEach(([id, qty]) => params.append("t", `${id}:${qty}`));

    router.push(`/events/${eventUuid}/checkout?${params.toString()}`);
  };

  return (
    <KSheet
      hideTrigger
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="p-4 space-y-4">
        <Typography variant="headline">
          Choose your ticket for <b>{eventTitle}</b>:
        </Typography>

        {tickets.map((t) => {
          const qty = cart[t.id] ?? 0;
          return (
            <div
              key={t.id}
              className="flex items-start justify-between gap-3 border-b border-brand-stroke pb-4"
            >
              <LoadableImage
                src={t.ticketImage || "/placeholder.png"}
                alt={t.title}
                width={64}
                height={64}
                className="rounded-md flex-shrink-0"
              />

              <div className="flex flex-col flex-grow min-w-0">
                <Typography
                  variant="subheadline1"
                  weight="medium"
                  truncate
                >
                  {t.title}
                </Typography>
                <Typography
                  variant="body"
                  className="text-brand-muted line-clamp-2"
                >
                  {t.description}
                </Typography>
              </div>

              <div className="flex flex-col items-end gap-1 pl-1">
                <Typography
                  variant="subheadline1"
                  weight="bold"
                >
                  {t.price} {t.payment_type}
                </Typography>

                {qty === 0 ? (
                  <CustomButton
                    className="!py-1 !px-3"
                    variant="outline"
                    onClick={() => addToCart(t.id)}
                  >
                    Add to Cart
                  </CustomButton>
                ) : (
                  <PlusMinusInput
                    label={`${qty} Ticket${qty > 1 ? "s" : ""}`}
                    value={qty}
                    onChange={(val) => setQty(t.id, val)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* bottom CTA */}
      {totalItems > 0 && (
        <div className="p-4 pt-0">
          <CustomButton
            className="w-full"
            onClick={toCheckout}
          >
            Continue Purchasing ({totalItems})
          </CustomButton>
        </div>
      )}
    </KSheet>
  );
};
