"use client";

import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { InfoIcon, Share } from "lucide-react";
import { InfoBox } from "@/app/(landing-pages)/genesis-onions/_components/InfoBox";
import { customToast } from "@/app/(landing-pages)/genesis-onions/GenesisOnions.utils";
import { usePartnershipAffiliate } from "./usePartnershipAffiliate";

/* helpers --------------------------------------------------- */
const tonViewer = (addr: string) => `https://tonviewer.com/${addr}`;
const tgLink = (username?: string | null) => (username ? `https://t.me/${username}` : null);

/* widget ---------------------------------------------------- */
export const ShareAndEarnPartnership = () => {
  const { data, isLoading, isError } = trpc.affiliate.getFairlaunchAffiliate.useQuery();
  const { inviteOnTelegram, isSharing } = usePartnershipAffiliate();

  /* copy util */
  const copy = async (str: string) => {
    try {
      await navigator.clipboard.writeText(str);
      customToast.success("Link copied!");
    } catch {
      customToast.error("Copy failed, please try again.");
    }
  };

  /* web‑share util */
  const shareViaWebAPI = async (url: string) => {
    try {
      await navigator.share({
        title: "Fairlaunch Partnership",
        text: "Join ONTON via my link and get perks!",
        url,
      });
    } catch (err: any) {
      if (err?.name !== "AbortError" && err?.name !== "NotAllowedError") {
        await copy(url);
      }
    }
  };

  /* early states */
  if (isLoading) return null;
  if (isError) return <div className="text-center text-red-600">Failed to load affiliate link.</div>;

  /* aggregate USDT + ONION totals (2 decimals) */
  const totalUsdt = Number((data.purchases ?? []).reduce((sum: number, p: any) => sum + Number(p.usdtAmount), 0)).toFixed(2);
  const totalOnion = Number((data.purchases ?? []).reduce((sum: number, p: any) => sum + Number(p.onionAmount), 0)).toFixed(
    2
  );

  /* links */
  const telegramLink = data.url;
  const webLink = `https://onton.live/onion-fair/?affiliate=${data.linkHash}`;

  /* UI ------------------------------------------------------ */
  return (
    <div className="bg-white px-4 py-6 text-gray-900">
      <InfoBox className="flex flex-col items-center border bg-white rounded-xl shadow-sm w-full">
        {/* header */}
        <header className="flex flex-col gap-1 items-center mb-4">
          <Typography
            variant="headline"
            weight="semibold"
          >
            Partnership Link
          </Typography>
          <div className="flex gap-1 items-center text-gray-600">
            <InfoIcon size={16} />
            <Typography variant="subheadline2">Share to earn Onions.</Typography>
          </div>
        </header>

        {/* totals */}
        <section className="flex gap-3 w-full mb-6">
          <InfoBox className="flex-1 rounded-md py-3 flex flex-col items-center bg-gray-50">
            <Typography
              variant="title2"
              weight="bold"
            >
              {totalUsdt}
            </Typography>
            <Typography
              variant="caption2"
              className="text-gray-600"
            >
              Total USDT
            </Typography>
          </InfoBox>

          <InfoBox className="flex-1 rounded-md py-3 flex flex-col items-center bg-gray-50">
            <Typography
              variant="title2"
              weight="bold"
            >
              {totalOnion}
            </Typography>
            <Typography
              variant="caption2"
              className="text-gray-600"
            >
              Total ONION
            </Typography>
          </InfoBox>
        </section>

        {/* ───────── Telegram Mini‑App link ───────── */}
        <div className="w-full mb-6">
          <Typography
            variant="subheadline2"
            weight="medium"
            className="mb-2"
          >
            Telegram Mini‑App link
          </Typography>

          <div className="flex items-center bg-gray-100 rounded-lg px-4 h-11 gap-2">
            <input
              readOnly
              value={telegramLink}
              className="flex-1 bg-transparent outline-none text-gray-900 text-sm text-ellipsis overflow-hidden"
            />
            <button
              onClick={() => copy(telegramLink)}
              className="text-blue-600 font-medium"
            >
              Copy
            </button>
          </div>

          <div className="flex gap-3 h-12 w-full mt-3">
            <Button
              size="lg"
              className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              onClick={() => inviteOnTelegram(telegramLink)}
              isLoading={isSharing}
              disabled={isSharing}
            >
              Invite on Telegram
            </Button>
          </div>
        </div>

        {/* ───────── Web link (copy‑only) ───────── */}
        <div className="w-full mb-8">
          <Typography
            variant="subheadline2"
            weight="medium"
            className="mb-2"
          >
            Web link
          </Typography>

          <div className="flex items-center bg-gray-100 rounded-lg px-4 h-11 gap-2">
            <input
              readOnly
              value={webLink}
              className="flex-1 bg-transparent outline-none text-gray-900 text-sm text-ellipsis overflow-hidden"
            />
            <button
              onClick={() => copy(webLink)}
              className="text-blue-600 font-medium"
            >
              Copy
            </button>
          </div>
        </div>

        {/* purchases list */}
        {data.purchases?.length ? (
          <div className="w-full flex flex-col gap-3">
            {data.purchases.map((p) => {
              const usdt = Number(p.usdtAmount).toFixed(2);
              const onion = Number(p.onionAmount).toFixed(2);

              return (
                <InfoBox
                  key={p.id}
                  className="w-full bg-gray-50 rounded-lg p-3 flex flex-col gap-1"
                >
                  {/* wallet & buyer */}
                  <div className="flex justify-between items-center">
                    <a
                      href={tonViewer(p.walletAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {p.walletAddress.slice(0, 6)}…{p.walletAddress.slice(-4)}
                    </a>

                    {p.userEntry === "telegram" && p.telegramUserName ? (
                      <a
                        href={tgLink(p.telegramUserName)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        @{p.telegramUserName}
                      </a>
                    ) : (
                      <Typography
                        variant="caption2"
                        className="text-gray-500"
                      >
                        Web User
                      </Typography>
                    )}
                  </div>

                  {/* amounts */}
                  <div className="flex justify-between items-center text-sm">
                    <Typography variant="caption2">
                      USDT&nbsp;<span className="font-medium">{usdt}</span>
                    </Typography>
                    <Typography variant="caption2">
                      ONION&nbsp;<span className="font-medium">{onion}</span>
                    </Typography>
                  </div>

                  {/* meta */}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{new Date(p.timeOfBought).toLocaleString()}</span>
                    <span className="capitalize">{p.userEntry}</span>
                  </div>
                </InfoBox>
              );
            })}
          </div>
        ) : (
          <Typography
            variant="caption2"
            className="text-gray-500 mb-2"
          >
            No purchases yet.
          </Typography>
        )}
      </InfoBox>
    </div>
  );
};
