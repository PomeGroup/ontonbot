import { NextRequest } from "next/server";
import { redisTools } from "@/lib/redisTools";
import { exchangeCodeForTokenLinkedin, fetchLinkedinUserInfo } from "@/lib/linkedin";
import { usersLinkedinDB } from "@/db/modules/usersLinkedin.db";
import { logger } from "@/server/utils/logger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  /* 1️⃣  Restore the state entry from Redis -------------------------------- */
  const cached = state ? await redisTools.getCache(`lioauth:${state}`) : null;
  if (!cached || typeof cached !== "object" || !code) {
    return new Response("Invalid or expired state", { status: 400 });
  }
  const { telegramUserId, returnUrl } = cached as {
    telegramUserId: number;
    returnUrl: string;
  };

  try {
    /* 2️⃣  Code ➜ access_token (+ id_token) -------------------------------- */
    const { access_token } = await exchangeCodeForTokenLinkedin(code);

    /* 3️⃣  Fetch OIDC userinfo (profile + email) --------------------------- */
    const ui = await fetchLinkedinUserInfo(access_token);
    // ui = { sub, name, given_name, family_name, email, picture }

    /* 4️⃣  Persist the mapping -------------------------------------------- */
    await usersLinkedinDB.upsertLinkedinAccount({
      userId: telegramUserId,
      liUserId: ui.sub,
      liFirstName: ui.given_name,
      liLastName: ui.family_name,
      liAvatarUrl: ui.picture ?? undefined,
      liEmail: ui.email ?? undefined,
    });

    /* 5️⃣  Cleanup & redirect --------------------------------------------- */
    await redisTools.deleteCache(`lioauth:${state}`);
    return Response.redirect(returnUrl, 302);
  } catch (err) {
    logger.error("LinkedIn OIDC callback error", err);
    return new Response("OAuth error", { status: 500 });
  }
}
