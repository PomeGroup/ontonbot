"use client";

import PlusMinusInput from "@/app/_components/Event/PromotionCode/PlusMinusInput";
import LoadableImage from "@/components/LoadableImage";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EventPaymentSelectType } from "@/db/schema/eventPayment";
import { cn } from "@/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  console.log("totals", totalItems);

  /* called when user hits “Continue Purchasing” */
  const toCheckout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // ⬅️ block the default <button> “submit / focus‐loss” behaviour
    e.stopPropagation(); // ⬅️ optional, avoids bubbling if this drawer lives in another clickable layer

    const params = new URLSearchParams();
    Object.entries(cart).forEach(([id, qty]) => params.append("t", `${id}:${qty}`));

    router.push(`/events/${eventUuid}/checkout?${params.toString()}`);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent
        title={`
Choose your ticket for ${eventTitle}
`}
      >
        <ScrollArea className="overflow-y-auto pe-2">
          <div className="flex flex-col gap-2">
            {tickets.map((t, idx) => {
              const qty = cart[t.id] ?? 0;
              return (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-start justify-between gap-3 border-b border-brand-stroke pb-2",
                    // don't show border if last
                    idx === tickets.length - 1 && "border-b-0 pb-0"
                  )}
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
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => addToCart(t.id)}
                      >
                        Add to Cart
                      </Button>
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
        </ScrollArea>
        {/* bottom CTA */}
        {totalItems > 0 && (
          <Button
            type="button"
            className="w-full"
            variant="primary"
            onClick={toCheckout}
          >
            Continue Purchasing ({totalItems})
          </Button>
        )}
      </DrawerContent>
    </Drawer>
  );
};
