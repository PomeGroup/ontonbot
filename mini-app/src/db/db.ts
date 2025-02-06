import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { SQL, sql } from "drizzle-orm";

export const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient, { schema });

// migrate(db, {
//     migrationsFolder: "drizzle",
// });

export function dbLower(text: string): SQL {
  return sql`lower(${text})`;
}
