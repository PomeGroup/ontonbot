/* RaffleDefineForm.tsx
 * organiser dashboard for one raffle
 */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";
import { z } from "zod";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiUser } from "react-icons/fi";
import { Block, BlockTitle, List, ListInput, ListItem, Preloader } from "konsta/react";

import { trpc } from "@/app/_trpc/client";
import type { RouterOutput } from "@/server";
import CustomButton from "@/app/_components/Button/CustomButton";
import { CHUNK_SIZE_RAFFLE, DEPLOY_FEE_NANO, EXT_FEE_NANO, INT_FEE_NANO, SAFETY_FLOOR_NANO } from "@/constants";

/* ─ helpers ─ */
const nanoToTonStr = (n?: bigint | string | null, d = 3) => (n ? (Number(n) / 1e9).toFixed(d) : "—");
const truncate = (s: string, m = 18) => (s.length <= m ? s : `${s.slice(0, m - 1)}…`);
const bestName = (u: { username: string | null; first_name: string | null; last_name: string | null; user_id: number }) =>
  u.username ?? ([u.first_name, u.last_name].filter(Boolean).join(" ").trim() || String(u.user_id));

/* ─ types ─ */
type OrgInfo = NonNullable<RouterOutput["raffle"]["infoForOrganizer"]>;

/* ─ form schema ─ */
const schema = z.object({
  event_uuid: z.string().uuid(),
  top_n: z.coerce.number().int().min(1).max(100),
  prize_pool_ton: z.coerce.number().positive(),
});
type FormVals = z.infer<typeof schema>;

/* ------------------------------------------------------------ */
/*                          Children                            */
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
  const { raffle } = info;
  const wallet = info.wallet as typeof info.wallet & { deployed?: boolean };

  const batches = BigInt(Math.ceil(raffle.top_n / CHUNK_SIZE_RAFFLE));
  const poolNano = BigInt(raffle.prize_pool_nanoton ?? "0");
  const gasBudget = EXT_FEE_NANO * batches + INT_FEE_NANO * BigInt(raffle.top_n) + SAFETY_FLOOR_NANO;
  const perUser = poolNano > gasBudget ? (poolNano - gasBudget) / BigInt(raffle.top_n) : BigInt(0);

  return (
    <>
      <BlockTitle>Raffle summary</BlockTitle>
      <Block
        strong
        className="space-y-1 text-sm"
      >
        <p>
          <b>Status:</b> {raffle.status}
        </p>
        <p>
          <b>Wallet:</b> {wallet.address ? <span className="break-all">{wallet.address}</span> : "—"}
        </p>
        {wallet.deployed === false && (
          <p className="text-xs text-red-500">Wallet not deployed – deposit {nanoToTonStr(DEPLOY_FEE_NANO)} TON.</p>
        )}
        {wallet.deployed && (
          <p>
            <b>On-chain balance:</b> {nanoToTonStr(wallet.balanceNano)} TON
          </p>
        )}
        <p>
          <b>Prize pool (db):</b> {nanoToTonStr(poolNano)} TON
        </p>
        <p>
          <b>Each winner (est.):</b> {nanoToTonStr(perUser)} TON
        </p>
      </Block>
    </>
  );
}

function WinnersTable({ winners, status }: { winners: OrgInfo["winners"]; status: OrgInfo["raffle"]["status"] }) {
  if (!winners.length) return null;
  return (
    <>
      <BlockTitle>Winners</BlockTitle>
      <List className="w-full">
        {winners.map((w) => (
          <ListItem
            key={w.rank}
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
            title={<span className="text-sm font-medium text-primary">#{w.rank}</span>}
            after={
              status === "completed" && w.reward_nanoton
                ? `${nanoToTonStr(w.reward_nanoton)} TON`
                : status === "completed"
                  ? "—"
                  : "eligible"
            }
            subtitle={
              w.username ? (
                <a
                  href={`https://t.me/${w.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 underline truncate max-w-[180px]"
                >
                  @{truncate(w.username)}
                </a>
              ) : (
                <span className="text-sm truncate max-w-[180px]">{truncate(bestName(w))}</span>
              )
            }
          />
        ))}
      </List>
    </>
  );
}

/* ------------------------------------------------------------ */
/*                         Main page                            */
/* ------------------------------------------------------------ */

export default function RaffleDefineForm() {
  const { hash: eventUuid } = useParams<{ hash: string }>();
  const router = useRouter();

  /* ─── hooks (MUST run every render) ───────────────────────── */
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

  const saveMut = trpc.raffle.defineOrUpdate.useMutation();
  const trigMut = trpc.raffle.trigger.useMutation();
  const summaryQ = trpc.raffle.infoForOrganizer.useQuery({ event_uuid: eventUuid }, { staleTime: 20_000 });

  /* ─── derived data (may be undefined while loading) ───────── */
  const data = summaryQ.data;
  const raffle = data?.raffle;
  const canEdit = raffle && (raffle.status === "waiting_funding" || raffle.status === "funded");

  /* ─── save & trigger handlers ─────────────────────────────── */
  const handleSave = handleSubmit((d) =>
    toast.promise(saveMut.mutateAsync(d), {
      loading: "Saving…",
      success: "Saved",
      error: (e) => e?.message ?? "Error",
    })
  );

  const onTrigger = () => {
    if (!raffle) return;
    const p = trigMut.mutateAsync({ event_uuid: eventUuid, raffle_uuid: raffle.raffle_uuid });
    toast.promise(p, {
      loading: "Starting distribution…",
      success: "Distribution started!",
      error: (e) => e?.message ?? "Failed",
    });
    p.then(() => summaryQ.refetch());
  };

  /* reset form defaults after a (successful) save */
  useEffect(() => {
    if (saveMut.isSuccess && raffle) {
      reset({
        event_uuid: eventUuid,
        top_n: saveMut.data.top_n,
        prize_pool_ton: Number(saveMut.data.prize_pool_nanoton) / 1e9,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveMut.isSuccess]);

  /* ---------------------------------------------------------- */
  /*                     Render section                         */
  /* ---------------------------------------------------------- */
  return (
    <div className="min-h-screen flex flex-col bg-[#EFEFF4] pb-24">
      <h1 className="font-bold text-2xl p-4">Raffle Setup</h1>

      {/* 1) loading / empty ******************************************* */}
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

      {/* 2) main content (only when data exists) ********************** */}
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

            {/* public page link */}
            <CustomButton
              variant="outline"
              className="w-full justify-center"
              onClick={() => router.push(`/events/${eventUuid}/raffle-ui/${raffle!.raffle_uuid}`)}
            >
              Open participant page
            </CustomButton>

            {raffle!.status === "funded" && (
              <CustomButton
                className="w-full justify-center"
                isLoading={trigMut.isLoading}
                onClick={onTrigger}
              >
                Start sending TON to users
              </CustomButton>
            )}

            <WinnersTable
              winners={data.winners}
              status={raffle!.status}
            />
          </div>
        </>
      )}
    </div>
  );
}
