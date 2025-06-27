/* RaffleDefineForm.tsx — organiser dashboard (share & copy ready) */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiUser } from "react-icons/fi";
import { Block, BlockTitle, List, ListInput, ListItem, Preloader } from "konsta/react";
import { Button } from "@/components/ui/button";
import { Share as ShareIcon } from "lucide-react";

import { trpc } from "@/app/_trpc/client";
import type { RouterOutput } from "@/server";
import CustomButton from "@/app/_components/Button/CustomButton";
import { CHUNK_SIZE_RAFFLE, DEPLOY_FEE_NANO, EXT_FEE_NANO, INT_FEE_NANO, SAFETY_FLOOR_NANO } from "@/constants";

/* ───────────────────────── helpers ────────────────────────── */
const fmtNano = (n?: bigint | string | null, d = 3) => (n ? (Number(n) / 1e9).toFixed(d) : "—");
const trunc = (s: string, m = 18) => (s.length <= m ? s : `${s.slice(0, m - 1)}…`);
const bestName = (u: { username?: string | null; first_name?: string | null; last_name?: string | null; user_id: number }) =>
  u.username ?? ([u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.user_id);

/* ───────────────────────── types / schema ─────────────────── */
type OrgInfo = NonNullable<RouterOutput["raffle"]["infoForOrganizer"]>;

const schema = z.object({
  event_uuid: z.string().uuid(),
  top_n: z.coerce.number().int().min(1).max(100),
  prize_pool_ton: z.coerce.number().positive(),
});
type FormVals = z.infer<typeof schema>;

/* ------------------------------------------------------------ */
/*                         sub-components                       */
/* ------------------------------------------------------------ */

function RaffleForm({
  control,
  errors,
  canEdit,
  onSave,
  saving,
}: {
  control: ReturnType<typeof useForm<FormVals>>["control"];
  errors: ReturnType<typeof useForm<FormVals>>["formState"]["errors"];
  canEdit: boolean;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <form
      onSubmit={onSave}
      className="px-4 space-y-4"
    >
      <BlockTitle>Define raffle</BlockTitle>
      <List>
        <Controller
          control={control}
          name="top_n"
          render={({ field }) => (
            <ListInput
              {...field}
              disabled={!canEdit}
              label="Number of winners (Top-N)"
              type="number"
              min={1}
              max={100}
              required
              error={errors.top_n?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="prize_pool_ton"
          render={({ field }) => (
            <ListInput
              {...field}
              disabled={!canEdit}
              label="Prize pool (TON)"
              type="number"
              step="0.001"
              required
              error={errors.prize_pool_ton?.message}
            />
          )}
        />
      </List>

      {canEdit && (
        <CustomButton
          className="w-full justify-center"
          isLoading={saving}
          onClick={onSave}
        >
          Save
        </CustomButton>
      )}
    </form>
  );
}

function SummaryCard({ info }: { info: OrgInfo }) {
  const r = info.raffle;
  const wallet = info.wallet as typeof info.wallet & { deployed?: boolean };

  /* fee maths */
  const batches = Math.ceil(r.top_n / CHUNK_SIZE_RAFFLE);
  const pool = BigInt(r.prize_pool_nanoton ?? "0");
  const feeExt = EXT_FEE_NANO * BigInt(batches);
  const feeInt = INT_FEE_NANO * BigInt(r.top_n);
  const deploy = DEPLOY_FEE_NANO;
  const floor = SAFETY_FLOOR_NANO;

  const need = pool + deploy + feeExt + feeInt + floor;
  const bal = BigInt(wallet.balanceNano ?? "0");
  const short = need > bal ? need - bal : BigInt(0);

  const perWinner = pool > feeExt + feeInt + floor ? (pool - feeExt - feeInt - floor) / BigInt(r.top_n) : BigInt(0);

  const showHints = r.status === "waiting_funding" || r.status === "funded";

  const f = (x: bigint) => (Number(x) / 1e9).toFixed(3);

  return (
    <>
      <BlockTitle className="mb-3">Raffle summary</BlockTitle>
      <Block
        strong
        className="space-y-2 text-sm"
      >
        <p>
          <b>Status:</b> {r.status}
        </p>

        {wallet.address && (
          <p>
            <b>Wallet:</b> <span className="break-all">{wallet.address}</span>
          </p>
        )}

        <Block className="space-y-1 text-xs bg-[#F8F9FB] p-2 rounded-lg">
          <p>
            <b>Prize pool:</b> {f(pool)} TON
          </p>
          <p>
            <b>Wallet deploy:</b> {f(deploy)} TON
          </p>
          <p>
            <b>Ext. tx gas:</b> {batches} × {f(EXT_FEE_NANO)} = {f(feeExt)} TON
          </p>
          <p>
            <b>Int. tx gas:</b> {r.top_n} × {f(INT_FEE_NANO)} = {f(feeInt)} TON
          </p>
          <p>
            <b>Safety floor:</b> {f(floor)} TON
          </p>
        </Block>

        <p>
          <b>Total needed:</b> {f(need)} TON
          {showHints && short > BigInt(0) && (
            <>
              {" "}
              – <span className="text-red-600 font-medium">add {f(short)} TON more</span>
            </>
          )}
        </p>

        {wallet.deployed ? (
          <p>
            <b>On-chain balance:</b> {f(bal)} TON
          </p>
        ) : (
          showHints && <p className="text-red-500 text-xs">Wallet not deployed – deposit {f(deploy)} TON first.</p>
        )}

        <p>
          <b>Each winner (est.):</b> {f(perWinner)} TON
        </p>
      </Block>
    </>
  );
}

function WinnersTable({ winners }: { winners: OrgInfo["winners"] }) {
  if (!winners.length) return null;
  return (
    <>
      <BlockTitle>Winners</BlockTitle>
      <List className="w-full">
        {winners.map((w) => (
          <ListItem
            key={w.score}
            className="py-1"
            media={
              w.photo_url ? (
                <Image
                  src={w.photo_url}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <FiUser className="w-6 h-6 text-gray-400" />
              )
            }
            title={<span className="text-sm font-medium text-primary">#{w.score}</span>}
            after={w.status === "paid" && w.reward_nanoton ? `${fmtNano(w.reward_nanoton)} TON` : w.status}
            subtitle={
              w.username ? (
                <a
                  href={`https://t.me/${w.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 underline truncate max-w-[180px]"
                >
                  @{trunc(w.username)}
                </a>
              ) : (
                <span className="text-sm truncate max-w-[180px]">{trunc(bestName(w).toString())}</span>
              )
            }
          />
        ))}
      </List>
    </>
  );
}

/* ------------------------------------------------------------ */
/*                           page                               */
/* ------------------------------------------------------------ */

export default function RaffleDefineForm() {
  const { hash: eventUuid } = useParams<{ hash: string }>();
  const router = useRouter();

  /* form -------------------- */
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormVals>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { event_uuid: eventUuid, top_n: 10, prize_pool_ton: 1 },
  });

  /* queries & mutations */
  const saveMut = trpc.raffle.defineOrUpdate.useMutation();
  const trigMut = trpc.raffle.trigger.useMutation();
  const summaryQ = trpc.raffle.infoForOrganizer.useQuery({ event_uuid: eventUuid }, { staleTime: 20_000 });
  const eventQ = trpc.events.getEvent.useQuery({ event_uuid: eventUuid }); // 🆕 fetch event meta
  const data = summaryQ.data;
  const raffle = data?.raffle;
  const canEdit = raffle && (raffle.status === "waiting_funding" || raffle.status === "funded");

  /* initialise form with DB values */
  useEffect(() => {
    if (data) {
      reset({
        event_uuid: eventUuid,
        top_n: data.raffle.top_n,
        prize_pool_ton: Number(data.raffle.prize_pool_nanoton) / 1e9,
      });
    }
  }, [data, eventUuid, reset]);

  /* save action */
  const handleSave = handleSubmit((d) =>
    toast.promise(
      saveMut.mutateAsync(d).then(() => summaryQ.refetch()),
      {
        loading: "Saving…",
        success: "Raffle saved",
        error: (e) => e?.message ?? "Error",
      }
    )
  );

  /* distribution trigger */
  const triggerPayout = () => {
    if (!raffle) return;
    toast.promise(
      trigMut.mutateAsync({ event_uuid: eventUuid, raffle_uuid: raffle.raffle_uuid }).then(() => summaryQ.refetch()),
      {
        loading: "Starting distribution…",
        success: "Distribution started!",
        error: (e) => e?.message ?? "Failed",
      }
    );
  };

  /* ---------- public participant link ---------- */
  /* ---------------- public URL ----------------------------- */
  const publicUrl = useMemo(() => {
    if (!raffle) return "";
    const payload = `${eventUuid}-raffle-${raffle.raffle_uuid}`;
    return `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${payload}`;
  }, [eventUuid, raffle]);

  /* ---------------- share / copy --------------------------- */
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link copied!");
    } catch {
      toast.error("Couldn’t copy – please try again.");
    }
  };

  const shareUrl = async () => {
    const title = eventQ.data?.title ?? "Join this event raffle"; // 🆕
    const text = `\n${title}\n\n🤞 Join the raffle and win TON! 🤞\n\n${publicUrl} \n\nPowered by @${process.env.NEXT_PUBLIC_BOT_USERNAME}`;

    /* 1️⃣ Telegram “share” dialog */
    try {
      window.Telegram?.WebApp?.openTelegramLink?.(
        `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(text)}`
      );
      return;
    } catch {
      /* fall back */
    }

    /* 2️⃣ Web-Share API */
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: publicUrl });
        return;
      } catch (err: any) {
        if (["AbortError", "NotAllowedError"].includes(err?.name)) return;
      }
    }

    /* 3️⃣ clipboard */
    await copyUrl();
  };

  /* ---------------- render ---------------- */
  return (
    <div className="min-h-screen flex flex-col bg-[#EFEFF4] pb-24">
      <h1 className="font-bold text-2xl p-4">Raffle Setup</h1>

      {summaryQ.isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <Preloader />
        </div>
      )}

      {!summaryQ.isLoading && !data && (
        <div className="flex flex-1 items-center justify-center text-center px-6">
          <p>No raffle defined for this event yet.</p>
        </div>
      )}

      {data && (
        <>
          <RaffleForm
            control={control}
            errors={errors}
            canEdit={Boolean(canEdit)}
            onSave={handleSave}
            saving={saveMut.isLoading}
          />

          <div className="px-4 pt-6 space-y-4">
            <SummaryCard info={data} />

            {/* public page + share */}
            <div className="space-y-2">
              <CustomButton
                variant="outline"
                className="w-full justify-center"
                onClick={() => router.push(`/events/${eventUuid}/raffle-ui/${raffle!.raffle_uuid}`)}
              >
                Open participant page
              </CustomButton>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={copyUrl}
                >
                  Copy link
                </Button>
                <Button
                  className="aspect-square"
                  variant="default"
                  onClick={shareUrl}
                >
                  <ShareIcon size={20} />
                </Button>
              </div>
            </div>

            {raffle!.status === "funded" && (
              <CustomButton
                className="w-full justify-center"
                isLoading={trigMut.isLoading}
                onClick={triggerPayout}
              >
                Start sending TON to users
              </CustomButton>
            )}

            <WinnersTable winners={data.winners} />
          </div>
        </>
      )}
    </div>
  );
}
