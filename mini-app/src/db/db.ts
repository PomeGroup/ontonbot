import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as schema from './schema'

export const queryClient = postgres(process.env.DATABASE_URL!)
export const db = drizzle(queryClient, { schema })

// migrate(db, {
//     migrationsFolder: "drizzle",
// });
