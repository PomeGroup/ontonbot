import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: "postgres://onton:8tVRRvb@postgres:5432/ontondb",
  },
} satisfies Config;
