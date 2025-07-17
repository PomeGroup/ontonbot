/*  app/events/[hash]/checkout/page.tsx  */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/app/_trpc/client";
import CustomButton from "@/app/_components/Button/CustomButton";
import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import LoadableImage from "@/components/LoadableImage";
import Typography from "@/components/Typography";
import { toast } from "sonner";
import { MouseEvent, useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type TicketQty = { id: number; qty: number };
type Coupon = { type: "percent"; value: number } | { type: "fixed"; value: number } | null;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function CheckoutPage({ params }: { params: { hash: string } }) {
  const eventUuid = params.hash;
  const search = useSearchParams();
  const router = useRouter();

  /* ---------------- cart (?t=id:qty) ----------------------------- */
  const cart: TicketQty[] = useMemo(
    () =>
      search
        .getAll("t")
        .map((s) => s.split(":").map(Number))
        .filter(([id, q]) => id && q)
        .map(([id, qty]) => ({ id, qty })),
    [search]
  );

  /* ---------------- fetch only needed tickets ------------------- */
  const { data: tickets = [] } = trpc.events.getTickets.useQuery(
    { event_uuid: eventUuid },
    { select: (d) => d.tickets.filter((t) => cart.some((c) => c.id === t.id)) }
  );

  const round3 = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;

  /* ---------------- subtotal ------------------------------------ */
  const subTotal = useMemo(
    () =>
      round3(
        cart.reduce((sum, c) => {
          const t = tickets.find((x) => x.id === c.id);
          return sum + (t ? t.price * c.qty : 0);
        }, 0)
      ),
    [cart, tickets]
  );

  /* ---------------- coupon handling ----------------------------- */
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon>(null);
  const [busy, setBusy] = useState(false);

  const {
    refetch: checkCoupon,
    data: couponData,
    error: couponErr,
  } = trpc.coupon.checkCoupon.useQuery(
    { event_uuid: eventUuid, coupon_code: code.trim() },
    { enabled: false, retry: false }
  );

  const applyCoupon = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    checkCoupon().finally(() => setBusy(false));
  };

  /* success */
  useEffect(() => {
    if (!couponData?.success) return;
    const { cpd_type, value } = couponData.definition;
    const v = Number(value);
    if (cpd_type === "percent") {
      setCoupon({ type: "percent", value: v });
      toast.success(`Coupon applied – ${v}% off`);
    } else {
      setCoupon({ type: "fixed", value: v });
      toast.success(`Coupon applied – ${v} off per ticket`);
    }
  }, [couponData]);

  /* error */
  useEffect(() => {
    if (!couponErr) return;
    setCoupon(null);
    toast.error(couponErr.message);
  }, [couponErr]);

  /* ---------------- discount & grand total ---------------------- */
  const { discountTotal, grandTotal } = useMemo(() => {
    if (!coupon) return { discountTotal: 0, grandTotal: subTotal };

    let discount = 0;
    if (coupon.type === "percent") {
      discount = (subTotal * coupon.value) / 100;
    } else {
      discount = cart.reduce((sum, c) => {
        const t = tickets.find((x) => x.id === c.id);
        if (!t) return sum;
        const per = Math.min(coupon.value, t.price);
        return sum + per * c.qty;
      }, 0);
    }

    discount = round3(discount);
    return { discountTotal: discount, grandTotal: round3(subTotal - discount) };
  }, [coupon, subTotal, cart, tickets]);

  const cur = tickets[0]?.payment_type ?? "";

  /* ---------------- navigation to register ---------------------- */
  const goToRegister = () => {
    const q = new URLSearchParams();
    cart.forEach(({ id, qty }) => q.append("t", `${id}:${qty}`));
    if (coupon) q.append("coupon", code.trim());

    router.push(`/events/${eventUuid}/register?${q.toString()}`);
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="p-4 space-y-4">
      <Typography variant="headline">Your Tickets</Typography>

      {cart.map(({ id, qty }) => {
        const t = tickets.find((x) => x.id === id);
        if (!t) return null;

        return (
          <div
            key={id}
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
                className="text-brand-muted"
              >
                {qty} × {t.price} {t.payment_type}
              </Typography>
            </div>

            <Typography
              variant="subheadline1"
              weight="bold"
            >
              {round3(qty * t.price)} {t.payment_type}
            </Typography>
          </div>
        );
      })}

      {/* ---- price breakdown ---- */}
      <Line
        label="Subtotal"
        value={subTotal}
        cur={cur}
      />
      {coupon && (
        <Line
          label={coupon.type === "percent" ? `Discount (${coupon.value}% off)` : `Discount (${coupon.value} off / ticket)`}
          value={-discountTotal}
          cur={cur}
          negative
        />
      )}
      <Line
        label="Your Payment"
        value={grandTotal}
        cur={cur}
        bold
      />

      {/* ---- coupon input ---- */}
      <div className="space-y-1">
        <Typography variant="subheadline1">Discount Code</Typography>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.currentTarget.value)}
            placeholder="SUMMER25"
            className="flex-grow bg-brand-fill-bg p-2 rounded-md outline-none"
          />
          <CustomButton
            className="!px-4"
            isLoading={busy}
            disabled={!code.trim()}
            onClick={applyCoupon}
          >
            Apply
          </CustomButton>
        </div>
      </div>

      {/* ---- CTA ---- */}
      <MainButton
        text={`Continue • ${grandTotal} ${cur}`}
        onClick={goToRegister}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helper to render a single price row                                 */
/* ------------------------------------------------------------------ */
function Line({
  label,
  value,
  cur,
  negative = false,
  bold = false,
}: {
  label: string;
  value: number;
  cur: string;
  negative?: boolean;
  bold?: boolean;
}) {
  const rounded = Math.round((Math.abs(value) + Number.EPSILON) * 1000) / 1000;
  return (
    <div className="flex justify-between py-1">
      <Typography weight="medium">{label}</Typography>
      <Typography className={bold ? "font-semibold" : ""}>
        {negative ? "-" : ""}
        {rounded} {cur}
      </Typography>
    </div>
  );
}
