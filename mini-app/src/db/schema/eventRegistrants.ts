import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  json,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uuid,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { users } from "@/db/schema/users";
import { orders } from "@/db/schema/orders";
import { eventPayment } from "@/db/schema/eventPayment";

/* ───── enums ───── */
export const eventRegistrantStatus = pgEnum("registrant_status", ["pending", "rejected", "approved", "checkedin"]);

export const eventRegistrants = pgTable(
  "event_registrants",
  {
    id: serial("id").primaryKey(),

    /* which event & which ticket type this registrant owns */
    event_uuid: uuid("event_uuid").notNull(),
    event_payment_id: integer("event_payment_id").references(() => eventPayment.id),
    order_uuid: uuid("order_uuid").references(() => orders.uuid),

    /* who will *use* the ticket             */
    user_id: bigint("user_id", { mode: "number" })
      .references(() => users.user_id)
      .notNull(),

    /* who actually *paid* for it (can equal user_id) */
    buyer_user_id: bigint("buyer_user_id", { mode: "number" }).references(() => users.user_id),

    status: eventRegistrantStatus("status").default("pending").notNull(),

    /* per-ticket registration form answers */
    register_info: json("register_info").notNull().default({}).$type<Record<string, string | null>>(),

    /* per-ticket price data */
    default_price: real("default_price"), // BEFORE discount
    final_price: real("final_price"), // AFTER coupon/discount

    /* minting fields */
    mint_wallet_address: text("mint_wallet_address"),
    minted_token_address: text("minted_token_address"),

    registrant_uuid: uuid("registrant_uuid")
      .unique()
      .notNull()
      .default(sql`gen_random_uuid()`),

    telegram_invite_link: text("telegram_invite_link").default(""),

    /* meta */
    created_at: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  (t) => ({
    /* ⚠️ old unique (event_uuid, user_id) removed to allow multiple tickets */
    eventIdx: index("registrants_event_uuid_idx").on(t.event_uuid),
    userIdx: index("registrants_user_id_idx").on(t.user_id),
    orderIdx: index("registrants_order_uuid_idx").on(t.order_uuid),
    eventPaymentIdx: index("registrants_event_payment_idx").on(t.event_payment_id),
    statusCheck: check("valid_status", sql`${t.status} IN ('pending','rejected','approved','checkedin')`),
  })
);

export type EventRegistrantStatusType = "pending" | "rejected" | "approved" | "checkedin";
