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

const insertUser = async (initDataJson: {
    user: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        language_code: string;
    };
}) => {
    return await db
        .insert(users)
        .values({
            user_id: initDataJson.user.id,
            username: initDataJson.user.username,
            first_name: initDataJson.user.first_name,
            last_name: initDataJson.user.last_name,
            language_code: initDataJson.user.language_code,
            role: "user", // Default role as "user"
        })
        .onConflictDoNothing() // Avoid conflict on duplicate entries
        .execute();
};

const selectWalletById = async (user_id: number) => {
    return await db
        .select({ wallet: users.wallet_address })
        .from(users)
        .where(eq(users.user_id, user_id))
        .execute();
};
const updateWallet = async (
    user_id: number,
    wallet_address: string,
    updatedBy: string
) => {
    return await db
        .update(users)
        .set({
            wallet_address: wallet_address,
            updatedBy: updatedBy, // String value of the user who updated
        })
        .where(eq(users.user_id, user_id))
        .execute();
};


export const usersDB = {
    selectUserById,
    insertUser,
    selectWalletById,
    updateWallet,
};