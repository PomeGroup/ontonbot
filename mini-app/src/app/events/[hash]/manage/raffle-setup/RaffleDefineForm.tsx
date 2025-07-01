/* organiser dashboard – TON giveaway | multi-reward merch raffle */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Block, BlockTitle, List, ListInput, ListItem, Preloader, Radio } from "konsta/react";
import { Button } from "@/components/ui/button";
import { Plus, Share as ShareIcon } from "lucide-react";
import { FiUser } from "react-icons/fi";

import { trpc } from "@/app/_trpc/client";
import CustomButton from "@/app/_components/Button/CustomButton";
import { CHUNK_SIZE_RAFFLE, DEPLOY_FEE_NANO, EXT_FEE_NANO, INT_FEE_NANO, SAFETY_FLOOR_NANO } from "@/constants";

/* ───── utils ───── */
type Kind = "ton" | "merch";
const nanoFmt = (v?: string | bigint | null, d = 3) => (v ? (Number(v) / 1e9).toFixed(d) : "—");
const trunc = (s = "", m = 18) => (s.length <= m ? s : `${s.slice(0, m - 1)}…`);
const bestName = (u: any) => u.username ?? ([u.first_name, u.last_name].filter(Boolean).join(" ") || u.user_id);

const shareLink = async (url: string, txt: string) => {
  try {
    window.Telegram?.WebApp?.openTelegramLink?.(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(txt)}`
    );
    return;
  } catch {}
  if (navigator.share) {
    try {
      await navigator.share({ url, text: txt });
      return;
    } catch {}
  }
  await navigator.clipboard.writeText(url);
  toast.success("Link copied!");
};

/* ───── form schemas ───── */
const tonSchema = z.object({
  event_uuid: z.string().uuid(),
  top_n: z.coerce.number().int().min(1).max(100),
  prize_pool_ton: z.coerce.number().positive(),
});
type TonVals = z.infer<typeof tonSchema>;

const prizeSchema = z.object({
  item_name: z.string().min(3),
  item_description: z.string().optional(),
  top_n: z.coerce.number().int().min(1).max(100),
  fulfil_method: z.enum(["ship", "pickup"]),
});
type PrizeVals = z.infer<typeof prizeSchema>;

/* ───── TON giveaway form ───── */
function TonForm({
  control,
  errors,
  canEdit,
  onSave,
  saving,
}: {
  control: any;
  errors: any;
  canEdit: boolean;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <form
      onSubmit={onSave}
      className="px-4 space-y-4"
    >
      <BlockTitle>TON giveaway</BlockTitle>
      <List>
        <Controller
          control={control}
          name="top_n"
          render={({ field }) => (
            <ListInput
              {...field}
              disabled={!canEdit}
              label="Number of winners"
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
          onClick={(e) => {
            onSave();
            e.preventDefault();
          }}
        >
          Save
        </CustomButton>
      )}
    </form>
  );
}

/* ───── tiny TON summary card ───── */
function SummaryTon({ info }: { info: any }) {
  const r = info.raffle;
  const w = info.wallet ?? {};
  const batches = Math.ceil(r.top_n / CHUNK_SIZE_RAFFLE);
  const pool = BigInt(r.prize_pool_nanoton ?? 0);
  const need = pool + DEPLOY_FEE_NANO + EXT_FEE_NANO * BigInt(batches) + INT_FEE_NANO * BigInt(r.top_n) + SAFETY_FLOOR_NANO;
  const bal = BigInt(w.balanceNano ?? 0);

  return (
    <>
      <BlockTitle className="mb-2">Raffle summary</BlockTitle>
      <Block
        strong
        className="space-y-1 text-sm"
      >
        <p>
          <b>Status:</b> {r.status}
        </p>
        {w.address && (
          <p className="break-all">
            <b>Wallet:</b> {w.address}
          </p>
        )}
        <p>
          <b>Prize pool:</b> {nanoFmt(pool)} TON
        </p>
        <p>
          <b>Total needed:</b> {nanoFmt(need)} TON
        </p>
        <p>
          <b>Balance:</b> {nanoFmt(bal)} TON
        </p>
      </Block>

      {!!info.winners?.length && (
        <>
          <BlockTitle className="mt-4">Winners</BlockTitle>
          <List>
            {info.winners.map((w: any) => (
              <ListItem
                key={w.user_id}
                className="py-1"
                title={<span className="font-medium text-primary">#{w.rank}</span>}
                subtitle={
                  w.username ? (
                    <a
                      href={`https://t.me/${w.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-blue-600"
                    >
                      @{trunc(w.username)}
                    </a>
                  ) : (
                    trunc(bestName(w))
                  )
                }
                after={w.status}
                media={
                  w.photo_url ? (
                    <Image
                      src={w.photo_url}
                      width={28}
                      height={28}
                      alt=""
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <FiUser className="h-5 w-5 text-gray-400" />
                  )
                }
              />
            ))}
          </List>
        </>
      )}
    </>
  );
}

/* ───── overlay prize editor ───── */
function PrizeEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<PrizeVals>;
  onSave: (v: PrizeVals) => void;
  onCancel: () => void;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PrizeVals>({
    resolver: zodResolver(prizeSchema),
    mode: "onBlur",
    defaultValues: { top_n: 1, fulfil_method: "ship", ...initial },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Block className="w-[90%] max-w-md rounded-lg bg-white p-4">
        <form className="space-y-3">
          <BlockTitle>{initial.item_name ? "Edit reward" : "Add reward"}</BlockTitle>

          <List>
            <Controller
              control={control}
              name="item_name"
              render={({ field }) => (
                <ListInput
                  {...field}
                  label="Item"
                  required
                  error={errors.item_name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="item_description"
              render={({ field }) => (
                <ListInput
                  {...field}
                  type="textarea"
                  label="Description"
                  error={errors.item_description?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="top_n"
              render={({ field }) => (
                <ListInput
                  {...field}
                  label="Winners"
                  type="number"
                  min={1}
                  max={100}
                  error={errors.top_n?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="fulfil_method"
              render={({ field }) => (
                <Block className="flex gap-6 px-4">
                  {(["ship", "pickup"] as const).map((v) => (
                    <label
                      key={v}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Radio
                        checked={field.value === v}
                        onChange={() => field.onChange(v)}
                      />
                      {v === "ship" ? "Ship" : "Pick-up"}
                    </label>
                  ))}
                </Block>
              )}
            />
          </List>

          <div className="flex gap-3">
            <CustomButton
              className="flex-1 justify-center"
              isLoading={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(onSave)();
              }}
            >
              Save
            </CustomButton>
            <Button
              variant="secondary"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Block>
    </div>
  );
}

/* ───── MAIN PAGE ───── */
export default function RaffleDefineForm() {
  const { hash: eventUuid } = useParams<{ hash: string }>();
  const router = useRouter();

  /* event (for raffleKind) */
  const eventQ = trpc.events.getEvent.useQuery({ event_uuid: eventUuid });

  /* flavour state – free until raffleKind is set in DB */
  const [kind, setKind] = useState<Kind>("ton");
  const [locked, setLocked] = useState<Kind | null>(null);

  /* prize-editor overlay */
  const [editing, setEditing] = useState<{ prizeId?: number; initial: Partial<PrizeVals> } | null>(null);

  /* TON hooks ---------------------------------------------------------------- */
  const tonForm = useForm<TonVals>({
    resolver: zodResolver(tonSchema),
    defaultValues: { event_uuid: eventUuid, top_n: 10, prize_pool_ton: 1 },
  });
  const tonQ = trpc.raffle.infoForOrganizer.useQuery({ event_uuid: eventUuid });
  const saveTon = trpc.raffle.defineOrUpdate.useMutation();
  const trigTon = trpc.raffle.trigger.useMutation();

  /* MERCH hooks -------------------------------------------------------------- */
  const merchDashQ = trpc.raffle.infoForOrganizerMerch.useQuery({ event_uuid: eventUuid });
  const ensureRaffle = trpc.raffle.ensureMerchRaffle.useMutation();
  const savePrize = trpc.raffle.saveMerchPrize.useMutation();
  const trigPrize = trpc.raffle.triggerMerchPrize.useMutation();

  /* reflect raffleKind from DB (=> lock radio once chosen) */
  useEffect(() => {
    const rk = eventQ.data?.raffleKind as Kind | null | undefined;
    if (rk === "ton" || rk === "merch") {
      setKind(rk);
      setLocked(rk); // lock after first definition saved
    }
  }, [eventQ.data?.raffleKind]);

  /* TON save */
  const handleSaveTon = tonForm.handleSubmit((v) =>
    toast.promise(
      saveTon.mutateAsync(v).then(() => tonQ.refetch()),
      {
        loading: "Saving…",
        success: "Saved",
        error: (e) => e?.message ?? "Error",
      }
    )
  );

  /* merch prize save */
  const handleSavePrize = async (vals: PrizeVals) => {
    const raffleUuid =
      merchDashQ.data?.raffle?.merchRaffleUuid ??
      (await ensureRaffle.mutateAsync({ event_uuid: eventUuid })).merchRaffleUuid;

    await toast.promise(
      savePrize
        .mutateAsync({
          event_uuid: eventUuid,
          merch_raffle_uuid: raffleUuid,
          merch_prize_id: editing?.prizeId,
          ...vals,
        })
        .then(() => merchDashQ.refetch()),
      { loading: "Saving…", success: "Saved", error: (e) => e?.message ?? "Error" }
    );
    setEditing(null);
  };

  /* share links */
  const tonUrl = useMemo(() => {
    const id = tonQ.data?.raffle?.raffle_uuid;
    return id ? `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}-raffle-${id}` : "";
  }, [tonQ.data, eventUuid]);

  const merchUrl = useMemo(() => {
    const id = merchDashQ.data?.raffle?.merchRaffleUuid;
    return id ? `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=${eventUuid}-merch-raffle-${id}` : "";
  }, [merchDashQ.data, eventUuid]);

  /* loading */
  if (eventQ.isLoading || tonQ.isLoading || merchDashQ.isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EFEFF4]">
        <Preloader />
      </div>
    );
  if (eventQ.error) return <p>{eventQ.error.message}</p>;

  /* aliases */
  const tonData = tonQ.data;
  const merchData = merchDashQ.data;

  /* ───────── render ───────── */
  return (
    <div className="flex min-h-screen flex-col bg-[#EFEFF4] pb-24">
      <h1 className="p-4 text-2xl font-bold">Raffle setup</h1>

      {/* type selector */}
      <Block className="px-4">
        <BlockTitle>Choose type</BlockTitle>
        <Block className="flex gap-6">
          {(["ton", "merch"] as const).map((v) => (
            <label
              key={v}
              className="flex items-center gap-2 text-sm"
            >
              <Radio
                checked={kind === v}
                /* only disable AFTER a type was saved */
                disabled={locked !== null && locked !== v}
                onChange={() => setKind(v)}
              />
              {v === "ton" ? "TON giveaway" : "Merch raffle"}
            </label>
          ))}
        </Block>
      </Block>

      {/* ---------- TON ---------- */}
      {kind === "ton" && (
        <>
          <TonForm
            control={tonForm.control}
            errors={tonForm.formState.errors}
            canEdit={!tonData?.raffle || ["waiting_funding", "funded"].includes(tonData.raffle.status)}
            onSave={handleSaveTon}
            saving={saveTon.isLoading}
          />

          {tonData && (
            <div className="space-y-4 px-4">
              <SummaryTon info={tonData} />

              {tonData.raffle.status === "funded" && (
                <CustomButton
                  className="w-full justify-center"
                  onClick={() =>
                    toast.promise(
                      trigTon
                        .mutateAsync({ raffle_uuid: tonData.raffle.raffle_uuid, event_uuid: eventUuid })
                        .then(() => tonQ.refetch()),
                      { loading: "Distributing…", success: "Started!", error: (e) => e?.message ?? "Error" }
                    )
                  }
                >
                  Start sending TON
                </CustomButton>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/events/${eventUuid}/raffle-ui/${tonData.raffle.raffle_uuid}`)}
              >
                Open participant page
              </Button>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => navigator.clipboard.writeText(tonUrl).then(() => toast.success("Link copied!"))}
                >
                  Copy link
                </Button>
                <Button
                  className="aspect-square"
                  onClick={() =>
                    shareLink(tonUrl, `🤞 Join the raffle and win TON! Powered by @${process.env.NEXT_PUBLIC_BOT_USERNAME}`)
                  }
                >
                  <ShareIcon size={20} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ---------- MERCH ---------- */}
      {kind === "merch" && (
        <div className="space-y-4 px-4">
          {/* prize list */}
          {merchData?.prizes?.length ? (
            merchData.prizes.map((row) => {
              if (!row) return null;
              const { prize, winners } = row;
              const list = winners ?? [];

              return (
                <Block
                  key={prize.merch_prize_id}
                  strong
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{prize.item_name}</p>
                      <p className="text-xs text-gray-500">
                        Top&nbsp;{prize.top_n} • {prize.fulfil_method}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setEditing({
                          prizeId: prize.merch_prize_id,
                          initial: {
                            item_name: prize.item_name,
                            item_description: prize.item_description ?? "",
                            top_n: prize.top_n,
                            fulfil_method: prize.fulfil_method,
                          },
                        })
                      }
                    >
                      Edit
                    </Button>
                  </div>

                  {!!list.length && (
                    <List>
                      {list.map((w) => (
                        <ListItem
                          key={w.user_id}
                          className="py-1"
                          title={<span className="font-medium text-primary">#{w.rank}</span>}
                          subtitle={bestName(w)}
                          after={w.status}
                          media={
                            w.photo_url ? (
                              <Image
                                src={w.photo_url}
                                width={28}
                                height={28}
                                alt=""
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <FiUser className="h-5 w-5 text-gray-400" />
                            )
                          }
                        />
                      ))}
                    </List>
                  )}
                </Block>
              );
            })
          ) : (
            <Block
              strong
              className="text-center text-sm"
            >
              <p>No rewards yet.</p>
              <p className="text-xs text-gray-500">Add your first merch reward below.</p>
            </Block>
          )}

          {/* pick winners button */}
          {merchData?.prizes?.some((p) => p && p.prize.status === "draft") && (
            <CustomButton
              className="w-full justify-center"
              isLoading={trigPrize.isLoading}
              onClick={() => {
                if (!merchData) return;
                const draftIds = merchData.prizes
                  .filter((p) => p && p.prize.status === "draft")
                  .map((p) => p!.prize.merch_prize_id);
                if (!draftIds.length) return;

                toast.promise(
                  Promise.all(
                    draftIds.map((id) => trigPrize.mutateAsync({ merch_prize_id: id, event_uuid: eventUuid }))
                  ).then(() => merchDashQ.refetch()),
                  { loading: "Picking winners…", success: "Winners selected!", error: (e) => e?.message ?? "Error" }
                );
              }}
            >
              Pick winners for all rewards
            </CustomButton>
          )}

          {/* public page + share */}
          {merchData?.raffle && (
            <>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/events/${eventUuid}/raffle-merch-ui/${merchData.raffle.merchRaffleUuid}`)}
              >
                Open participant page
              </Button>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => navigator.clipboard.writeText(merchUrl).then(() => toast.success("Link copied!"))}
                >
                  Copy link
                </Button>
                <Button
                  className="aspect-square"
                  onClick={() =>
                    shareLink(merchUrl, `🎁 Join the merch raffle! Powered by @${process.env.NEXT_PUBLIC_BOT_USERNAME}`)
                  }
                >
                  <ShareIcon size={20} />
                </Button>
              </div>
            </>
          )}

          {/* add reward */}
          <Button
            className="flex w-full justify-center gap-2"
            onClick={() => setEditing({ prizeId: undefined, initial: {} })}
          >
            <Plus size={16} />
            Add reward
          </Button>
        </div>
      )}

      {/* overlay */}
      {editing && (
        <PrizeEditor
          initial={editing.initial}
          onSave={handleSavePrize}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
