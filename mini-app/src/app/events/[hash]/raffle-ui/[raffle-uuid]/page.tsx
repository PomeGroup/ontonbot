/* RaffleUiPage.tsx – stable & simple scenario 🚀 */
"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { SplitFlap, Presets } from "react-split-flap";
import { useTonAddress, useTonConnectModal } from "@tonconnect/ui-react";
import { Address } from "@ton/core";
import { Block, BlockTitle, List, ListItem, Preloader } from "konsta/react";
import Image from "next/image";
import { FiUser } from "react-icons/fi";
import { toast } from "sonner";

import Images from "@/app/_components/atoms/images";
import Typography from "@/components/Typography";
import Divider from "@/components/Divider";
import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import { trpc } from "@/app/_trpc/client";
import { CHUNK_SIZE_RAFFLE, EXT_FEE_NANO, INT_FEE_NANO, SAFETY_FLOOR_NANO } from "@/constants";

/* ───────────────── helpers ───────────────── */
const random6 = () =>
  Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");

const truncate = (s: string, m = 18) => (s.length <= m ? s : `${s.slice(0, m - 1)}…`);

const bestName = (u: { username: string | null; first_name: string | null; last_name: string | null; user_id: number }) =>
  u.username ?? ([u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.user_id);

const ton = (n?: string | bigint | null) => (n ? (Number(n) / 1e9).toFixed(3) : "—");

const toBounce = (raw: string) => Address.parse(raw).toString({ bounceable: true, urlSafe: true });

/* ───────────────── memo bits ───────────────── */
const EventImage = memo(({ url }: { url: string }) => (
  <Images.Event
    width={300}
    height={300}
    url={url}
  />
));

const EventTitle = memo(({ t }: { t: string }) => (
  <Typography
    variant="title2"
    weight="bold"
  >
    {t}
  </Typography>
));

/* split-flap whose outer height never changes */
const ScoreDisplay = memo(({ value }: { value: string }) => {
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (inner.current && h === null) {
      setH(inner.current.getBoundingClientRect().height);
    }
  }, [h]);

  return (
    <div
      style={{
        height: h ?? "auto",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div ref={inner}>
        <SplitFlap
          value={value}
          length={6}
          chars={Presets.NUM}
          size="large"
          hinge
        />
      </div>
    </div>
  );
});
ScoreDisplay.displayName = "ScoreDisplay";

/* MainButton wrapper (only mounts when visible) */
const TGButton = memo(
  ({ visible, label, busy, onClick }: { visible: boolean; label: string; busy: boolean; onClick: () => void }) =>
    visible ? (
      <MainButton
        text={label}
        progress={busy}
        onClick={onClick}
      />
    ) : null
);

/* ───────────────── component ───────────────── */
export default function RaffleUiPage() {
  /* URL params */
  const { hash: eventUuid, "raffle-uuid": raffleUuid } = useParams<{
    hash: string;
    "raffle-uuid": string;
  }>();

  if (!eventUuid || !raffleUuid) return <p className="text-center mt-10 text-red-500">Bad URL</p>;

  /* queries */
  const eventQ = trpc.events.getEvent.useQuery({ event_uuid: eventUuid });
  const viewQ = trpc.raffle.view.useQuery({ raffle_uuid: raffleUuid }, { refetchOnWindowFocus: false });
  const spinMut = trpc.raffle.spin.useMutation();

  /* wallet */
  const liveWallet = useTonAddress();
  const modal = useTonConnectModal();
  const hasWallet = !!liveWallet;

  /* split-flap value */
  const [score, setScore] = useState("000000"); // static until spin
  const [rolling, setRolling] = useState(false);
  const final = useRef<string>("000000");

  /* start/stop rolling helpers */
  const startRolling = () => {
    setRolling(true);
  };
  const stopRolling = () => setRolling(false);

  /* random generator loop */
  useEffect(() => {
    const id = setInterval(() => {
      if (rolling) setScore(random6());
    }, 100);
    return () => clearInterval(id);
  }, [rolling]);

  /* if already spun earlier → show stored score */
  useEffect(() => {
    if (viewQ.data?.my?.score !== undefined) {
      final.current = viewQ.data.my.score.toString().padStart(6, "0");
      setScore(final.current);
    }
  }, [viewQ.data?.my?.score]);

  /* shorthand refs */
  const raffle = viewQ.data?.raffle;
  const my = viewQ.data?.my;
  const winners = viewQ.data?.winners ?? [];

  /* wallet to display */
  const raw = my?.wallet_address || (hasWallet ? Address.parse(liveWallet).toRawString() : undefined);
  const walletB = raw ? toBounce(raw) : null;

  /* prize maths */
  const pool = BigInt(raffle?.prize_pool_nanoton ?? "0");
  const batches = BigInt(Math.ceil((raffle?.top_n ?? 1) / CHUNK_SIZE_RAFFLE));
  const gas = EXT_FEE_NANO * batches + INT_FEE_NANO * BigInt(raffle?.top_n ?? 1) + SAFETY_FLOOR_NANO;
  const perWinner = pool > gas ? (pool - gas) / BigInt(raffle?.top_n ?? 1) : BigInt(0);

  /* click handler */
  const handleClick = useCallback(() => {
    if (!hasWallet) {
      modal.open();
      return;
    }

    /* hide button immediately by making it no longer visible */
    startRolling();

    toast.promise(
      spinMut.mutateAsync({
        raffle_uuid: raffleUuid,
        wallet_address: liveWallet,
      }),
      {
        loading: "Spinning…",
        success: (d) => {
          // Slow-down & land on real score
          final.current = d.score.toString().padStart(6, "0");
          const pace = [150, 200, 300, 450, 700];
          let i = 0;
          const tick = () => {
            setScore(random6());
            if (i < pace.length) setTimeout(tick, pace[i++]);
            else {
              stopRolling();
              setScore(final.current);
              viewQ.refetch();
            }
          };
          tick();
          return `Your score: ${d.score}`;
        },
        error: (e) => {
          stopRolling();
          setScore("000000");
          return e?.message ?? "Spin failed";
        },
      }
    );
  }, [hasWallet, modal, spinMut, raffleUuid, liveWallet, viewQ]);

  /* MainButton visibility */
  const btnVisible = !my && raffle?.status === "waiting_funding" && !spinMut.isLoading;

  /* loading */
  if (eventQ.isLoading || viewQ.isLoading)
    return (
      <div className="flex justify-center pt-20">
        <Preloader />
      </div>
    );
  if (eventQ.error) return <p>{eventQ.error.message}</p>;
  if (viewQ.error) return <p>{viewQ.error.message}</p>;

  const event = eventQ.data!;

  /* ───────── render ───────── */
  return (
    <>
      <TGButton
        visible={btnVisible}
        label={hasWallet ? "Spin" : "Connect wallet"}
        busy={spinMut.isLoading}
        onClick={handleClick}
      />

      <div className="min-h-screen bg-[#EFEFF4] pb-24 px-4">
        <EventImage url={event.image_url ?? ""} />
        <EventTitle t={event.title ?? ""} />
        <Divider margin="medium" />

        <Block
          strong
          className="bg-white p-4 rounded-lg space-y-4 mb-8"
        >
          <div className="flex justify-center">
            <ScoreDisplay value={score} />
          </div>

          {walletB && (
            <p>
              <b>Your wallet:</b> <span className="break-all">{walletB}</span>
            </p>
          )}

          <p className="text-center font-semibold text-lg">
            🏆 Pool {ton(pool)} TON • Top&nbsp;
            {raffle?.top_n} get {ton(perWinner)} TON each
          </p>

          {my?.reward_nanoton && (
            <p className="text-green-600 font-semibold text-center">🎉 You received {ton(my.reward_nanoton)} TON!</p>
          )}
        </Block>

        {raffle?.status === "completed" && winners.length > 0 && (
          <>
            <BlockTitle className="mt-6">Winners</BlockTitle>
            <List inset>
              {winners.map((w: any) => (
                <ListItem
                  key={w.rank}
                  className="py-1"
                  media={
                    w.photo_url ? (
                      <Image
                        src={w.photo_url}
                        width={32}
                        height={32}
                        alt=""
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <FiUser className="w-6 h-6 text-gray-400" />
                    )
                  }
                  title={<span className="font-medium">#{w.rank}</span>}
                  after={w.reward_nanoton ? `${ton(w.reward_nanoton)} TON` : "—"}
                  subtitle={
                    w.username ? (
                      <a
                        href={`https://t.me/${w.username}`}
                        target="_blank"
                        className="text-blue-600 underline truncate max-w-[160px]"
                      >
                        @{truncate(w.username)}
                      </a>
                    ) : (
                      <span className="truncate max-w-[160px]">{truncate(bestName(w).toString())}</span>
                    )
                  }
                />
              ))}
            </List>
          </>
        )}
      </div>
    </>
  );
}
