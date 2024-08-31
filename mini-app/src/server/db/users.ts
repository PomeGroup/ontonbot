import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Function to get a user by user ID
export const selectUserById = async (userId: number) => {
     const userInfo =await db
        .select({
            user_id: users.user_id,
            username: users.username,
            first_name: users.first_name,
            last_name: users.last_name,
            wallet_address: users.wallet_address,
            language_code: users.language_code,
            role: users.role,
            created_at: users.created_at,
            updated_at: users.updatedAt,
            updated_by: users.updatedBy,
        })
        .from(users)
        .where(eq(users.user_id, userId))
        .execute();
    return userInfo[0];
};