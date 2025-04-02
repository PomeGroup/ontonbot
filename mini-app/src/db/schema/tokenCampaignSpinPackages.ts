import { pgTable, bigint, varchar, boolean, numeric, text, serial, timestamp, index, integer } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { paymentTypes } from "@/db/schema";
import { campaignTypes } from "@/db/enum";

export const tokenCampaignSpinPackages = pgTable(
  "token_campaign_spin_packages",
  {
    id: serial("id").notNull().primaryKey(),
    campaignType: campaignTypes("campaign_type").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    imageUrl: varchar("image_url", { length: 255 }),
    active: boolean("active").notNull().default(true),
    soldItemsCount: bigint("sold_items_count", { mode: "number" }).notNull().default(0),
    autoActivationDate: bigint("auto_activation_date", { mode: "number" }),
    price: numeric("price", { precision: 10, scale: 2 }),
    currency: paymentTypes("currency").notNull(),
    autoDeactivationDate: bigint("auto_deactivation_date", { mode: "number" }),
    spinCount: integer("spin_count").notNull().default(0),
    isForSale: boolean("is_for_sale").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 }).$onUpdate(() => new Date()),
    updatedBy: text("updated_by").default("system").notNull(),
  },
  // indexes
  (table) => ({
    nameIdx: index("tcps_name_idx").on(table.name),
    activeIdx: index("tcps_active_idx").on(table.active),
    autoActivationDateIdx: index("tcps_auto_activation_date_idx").on(table.autoActivationDate),
    autoDeactivationDateIdx: index("tcps_auto_deactivation_date_idx").on(table.autoDeactivationDate),
    isForSaleIdx: index("tcps_is_for_sale_idx").on(table.isForSale),
  })
);

/**
 * SELECT type
 * Represents the shape of a row *selected* from the table.
 */
export type TokenCampaignSpinPackages = InferSelectModel<typeof tokenCampaignSpinPackages>;

/**
 * INSERT type
 * Omit columns that:
 *   1) are auto-generated (e.g., `id`).
 *   2) have default values you typically don't supply (e.g., `createdAt`, `updatedAt`).
 */
export type TokenCampaignSpinPackagesInsert = Omit<
  InferSelectModel<typeof tokenCampaignSpinPackages>,
  "id" | "createdAt" | "updatedAt"
>;
