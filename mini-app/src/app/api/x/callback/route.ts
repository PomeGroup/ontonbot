import { redisTools } from "@/lib/redisTools";
import { exchangeCodeForToken, fetchMe } from "@/lib/twitter";
import { usersXDB } from "@/db/modules/usersX.db";
import { NextRequest } from "next/server";
import { logger } from "@/server/utils/logger";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  /* ---------- ❶ Pull verifier & tgUser from Redis ---------- */
  const saved = (state ? await redisTools.getCache(`xoauth:${state}`) : null) as {
    codeVerifier: string;
    telegramUserId: number;
    returnUrl: string;
  } | null;

  if (!saved || !code) {
    return new Response("Invalid or expired state", { status: 400 });
  }

  const { codeVerifier, telegramUserId } = saved;

  /* ---------- ❷ Exchange code → token ---------- */
  try {
    const { access_token } = await exchangeCodeForToken(code, codeVerifier);
    const profile = await fetchMe(access_token);

    /* ---------- ❸ Persist mapping ---------- */
    await usersXDB.upsertXAccount({
      userId: telegramUserId,
      xUserId: profile.id,
      xUsername: profile.username,
      xDisplayName: profile.name,
      xProfileImageUrl: profile.profile_image_url,
    });

    /* ---------- ❹ Clean up Redis ---------- */
    await redisTools.deleteCache(`xoauth:${state}`);

    /* ---------- ❺ Notify opener & close ---------- */
    return Response.redirect(saved.returnUrl, 302);
  } catch (err) {
    logger.log(err);
    return new Response("OAuth error", { status: 500 });
  }
}
