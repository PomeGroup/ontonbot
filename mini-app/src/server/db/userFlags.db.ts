import { db } from "@/db/db";
import { user_custom_flags } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function organizerTsVerified(user_id: number) {
  const result = await db.query.user_custom_flags.findFirst({
    where: and(
      eq(user_custom_flags.user_id, user_id),
      eq(user_custom_flags.user_flag, "ton_society_verified"),
      eq(user_custom_flags.enabled, true)
    ),
  });
  if (!result) return false;
  if (result) {
    return Boolean(result.value);
  }
}

export async function userHasModerationAccess(user_id: number , user_role : string) {
  if(user_role === 'admin'){
    return true; // faster response
  }
  

  const result = await db.query.user_custom_flags.findFirst({
    where: and(
      eq(user_custom_flags.user_id, user_id),
      eq(user_custom_flags.user_flag, "event_moderator"),
      eq(user_custom_flags.enabled, true)
    ),
  });
  if (!result) return false;
  if (result) {
    return Boolean(result.value);
  }
}
