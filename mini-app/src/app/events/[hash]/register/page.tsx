/* app/events/[hash]/register/page.tsx */
"use client";

import { useParams, useSearchParams } from "next/navigation";
import { List, ListInput } from "konsta/react";
import { trpc } from "@/app/_trpc/client";
import { GuestTicketSchema } from "@/types";
import Typography from "@/components/Typography";
import CustomButton from "@/app/_components/Button/CustomButton";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { RouterOutput } from "@/server";

/* ────────────────────────── helpers ─────────────────────────── */
type CartRow = { id: number; qty: number };
type FieldErrs = Record<string, string[]>;

interface GuestSeat {
  ticketId: number;
  key: string; //  "99-0"  (ticket-id + seat index)
  ordinal: number; //  1-based ordinal inside that ticket block
}

/* ───────────────────────── component ────────────────────────── */
export default function GuestRegisterPage() {
  /* ------ 1. route / search params -------------------------------- */
  const { hash: eventUuid } = useParams<{ hash: string }>();
  const search = useSearchParams();

  /* ------ 2. cart (?t=id:qty) ------------------------------------- */
  const cart: CartRow[] = useMemo(() => {
    return search
      .getAll("t") // ["99:2","98:1",…]
      .map((s) => s.split(":").map(Number))
      .filter(([id, q]) => !!id && !!q)
      .map(([id, qty]) => ({ id, qty }));
  }, [search]);

  /* ------ 3. ticket rows (one query, cached by tRPC) -------------- */
  type TicketRowClient = RouterOutput["events"]["getTickets"]["tickets"][number]; // ✅ strings for dates

  /* --------------------------------------------------------
   *  2)  query + map use the new type
   * ----------------------------------------------------- */
  const { data: ticketResp } = trpc.events.getTickets.useQuery({ event_uuid: eventUuid }, { enabled: cart.length > 0 });

  const ticketRows: TicketRowClient[] = ticketResp?.tickets ?? [];

  /* fast lookup without red squiggles */
  const ticketMap = useMemo(() => Object.fromEntries(ticketRows.map((r) => [r.id, r] as const)), [ticketRows]);

  /* ------ 4. expand “3 × Ticket A” into three GuestSeat objects --- */
  const guests: GuestSeat[] = useMemo(() => {
    return cart.flatMap(({ id, qty }) =>
      Array.from({ length: qty }, (_, i) => ({
        ticketId: id,
        key: `${id}-${i}`,
        ordinal: i + 1,
      }))
    );
  }, [cart]);

  /* ------ 5. form plumbing --------------------------------------- */
  const formRef = useRef<HTMLFormElement>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, FieldErrs>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const fd = new FormData(formRef.current);
    const ok: unknown[] = [];
    const errs: Record<string, FieldErrs> = {};

    /* validate row-by-row with Zod */
    guests.forEach(({ key, ticketId }) => {
      const get = (name: string) => fd.get(`${key}__${name}`)?.toString() ?? "";

      const candidate = {
        event_uuid: eventUuid,
        ticket_id: ticketId,
        full_name: get("full_name"),
        wallet: get("wallet"),
        company: get("company"),
        position: get("position"),
      };

      const parsed = GuestTicketSchema.safeParse(candidate);
      if (parsed.success) ok.push(parsed.data);
      else errs[key] = parsed.error.flatten().fieldErrors;
    });

    setRowErrors(errs);

    /* everything valid → you can now call your tRPC mutation */
    if (Object.keys(errs).length === 0) {
      console.log("✅ ready to send:", ok);
      toast.success("Guests validated – integrate your mutation here.");
      // TODO: trpc.registrant.guestRegister.mutate(ok)
    }
  };

  /* clear errors if cart shape changes (rare) */
  useEffect(() => setRowErrors({}), [guests.length]);

  /* =========================== JSX ============================== */
  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="p-4 space-y-6 pb-32"
    >
      <Typography
        variant="title3"
        weight="bold"
      >
        Guest&nbsp;Registration
      </Typography>

      {cart.map(({ id, qty }) => {
        const ticket = ticketMap[id];
        const title = ticket?.title ?? `Ticket ${id}`;

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
              const err = rowErrors[key] ?? {};

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
                      label="Wallet Address"
                      name={`${key}__wallet`}
                      placeholder="EQ… / UQ… / …"
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

      {/* ---------- sticky footer ---------- */}
      <div className="fixed bottom-0 inset-x-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] bg-white pt-3 border-t border-brand-stroke">
        <CustomButton
          variant="primary"
          onClick={() => formRef.current?.requestSubmit()}
        >
          Check&nbsp;out
        </CustomButton>
      </div>
    </form>
  );
}
