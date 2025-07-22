// app/api/gh/callback/route.ts
import { NextRequest } from "next/server";
import { redisTools } from "@/lib/redisTools";
import { exchangeCodeForTokenGithub, fetchGithubUser } from "@/lib/github";
import { usersGithubDB } from "@/db/modules/usersGithub.db";
import { logger } from "@/server/utils/logger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const saved = state ? await redisTools.getCache(`ghoauth:${state}`) : null;
  if (!saved || typeof saved !== "object" || !code) {
    return new Response("Invalid or expired state", { status: 400 });
  }
  const { telegramUserId, returnUrl } = saved as {
    telegramUserId: number;
    returnUrl: string;
  };

  try {
    const { access_token } = await exchangeCodeForTokenGithub(code);
    const p = await fetchGithubUser(access_token);

    await usersGithubDB.upsertGithubAccount({
      userId: telegramUserId,
      ghUserId: p.id.toString(),
      ghLogin: p.login,
      ghDisplayName: p.name ?? undefined,
      ghAvatarUrl: p.avatar_url ?? undefined,
    });

    await redisTools.deleteCache(`ghoauth:${state}`);
    return Response.redirect(returnUrl, 302);
  } catch (err) {
    logger.error("GitHub OAuth callback error", err);
    return new Response("OAuth error", { status: 500 });
  }
}
