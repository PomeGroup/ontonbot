import { index, integer, pgTable, text } from "drizzle-orm/pg-core";

export const giataCity = pgTable(
  "giata_city",
  {
    id: integer("id").primaryKey(),
    title: text("title").notNull(),
    parentId: integer("parent_id").notNull(),
    insertDate: integer("insert_date").notNull(),
    abbreviatedCode: text("abbreviated_code").notNull(),
    giataCode: integer("giata_code").notNull(),
  },
  (table) => ({
    titleIdx: index("giata_city_title_idx").on(table.title),
    parentIdIdx: index("giata_city_parent_id_idx").on(table.parentId),
    insertDateIdx: index("giata_city_insert_date_idx").on(table.insertDate),
    abbreviatedCodeIdx: index("giata_city_abbreviated_code_idx").on(
      table.abbreviatedCode
    ),
    giataCodeIdx: index("giata_city_giata_code_idx").on(table.giataCode),
  })
);
