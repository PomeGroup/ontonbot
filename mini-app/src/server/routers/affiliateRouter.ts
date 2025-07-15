import { generateRandomHash } from "@/lib/generateRandomHash";
import { affiliateLinksDB } from "@/db/modules/affiliateLinks.db";
import { partnershipAffiliatePurchasesDB } from "@/db/modules/partnershipAffiliatePurchases.db";
import { initDataProtectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

export const affiliateRouter = router({
  /* ──────────────────────────────────────────────────────────────
     Get – or create – the caller’s Fairlaunch partnership link
     plus a detailed list of all purchases attributed to it.
     ────────────────────────────────────────────────────────────── */
  getFairlaunchAffiliate: initDataProtectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.user_id;
    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    /* 1️⃣  fetch or create link */
    let link = await affiliateLinksDB.getAffiliateLinkForType(userId, "fairlaunch-partnership" as const);

    if (!link) {
      const linkHash = generateRandomHash(8);
      link = await affiliateLinksDB.createAffiliateLinkByType(
        `fairlaunch-partnership-${userId}`,
        "fairlaunch-partnership",
        userId,
        linkHash,
        "fairlaunch-partnership"
      );
    }

    /* 2️⃣  fetch purchases tied to this link */
    const purchasesRaw = await partnershipAffiliatePurchasesDB.getPurchasesByLinkId(
      link.id,
      { limit: 500 } // arbitrary high; paginate if needed
    );

    /* 3️⃣  enrich rows for the UI */
    const purchases = purchasesRaw.map((p) => ({
      id: p.id,
      walletAddress: p.walletAddress,
      walletLink: `https://tonviewer.com/${p.walletAddress}`,
      telegramUserId: p.userEntry === "telegram" ? p.telegramUserId : null,
      telegramUserName: p.userEntry === "telegram" ? p.telegramUserName : null,
      telegramLink: p.userEntry === "telegram" && p.telegramUserName ? `https://t.me/${p.telegramUserName}` : null,
      usdtAmount: p.usdtAmount,
      onionAmount: p.onionAmount,
      timeOfBought: p.timeOfBought,
      userEntry: p.userEntry, // "telegram" | "web"
    }));

    /* 4️⃣  build shareable URL */
    const botUser = process.env.NEXT_PUBLIC_BOT_USERNAME || "theontonbot";
    const url = `https://t.me/${botUser}/event?startapp=fairlaunch-aff-${link.linkHash}`;

    return {
      ...link,
      url,
      purchases, // ← NEW  detailed list
    };
  }),
});
