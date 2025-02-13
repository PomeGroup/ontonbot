import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { SQL, sql } from "drizzle-orm";

const isProduction = process.env.NODE_ENV === "production";

// PostgresSQL Connection Pool Configuration
export const queryClient = postgres(process.env.DATABASE_URL!, {
  max: 30, // in production, we run 12 instances, so we can have 30 connections per instance (360 connections)
  idle_timeout: 5, // Close idle connections after 5 seconds of inactivity
  connect_timeout: 10, // Fail connection attempts after 10 seconds
  ssl: process.env.DATABASE_SSL === "true" ? "require" : false, // Enable SSL if needed
  prepare: true, // Use prepared statements for performance
  debug: !isProduction, // Enable debugging in development mode
});

export const db = drizzle(queryClient, { schema });

/**
 * Convert text to lowercase using SQL.
 */
export function dbLower(text: string): SQL {
  return sql`lower
      (${text})`;
}

/**
 * Gracefully close the database connection (for server shutdown or process exit).
 */
export async function closeDB() {
  console.log("Closing database connection...");
  await queryClient.end();
}
