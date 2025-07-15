/* RaffleUiPage.tsx – spin-button now appears in both waiting_funding & funded */
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

/* ───────── helpers ───────── */
const random6 = () =>
  Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
const truncate = (s: string, m = 18) => (s.length <= m ? s : `${s.slice(0, m - 1)}…`);
const bestName = (u: { username: string | null; first_name: string | null; last_name: string | null; user_id: number }) =>
  u.username ?? ([u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.user_id);
const ton = (n?: string | bigint | null) => (n ? (Number(n) / 1e9).toFixed(3) : "—");
const toBounce = (raw: string) => Address.parse(raw).toString({ bounceable: true, urlSafe: true });

/* ───────── small memo bits ───────── */
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

/* fixed-height split-flap wrapper */
const ScoreDisplay = memo(({ value }: { value: string }) => {
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (inner.current && h === null) setH(inner.current.getBoundingClientRect().height);
  }, [h]);

  return (
    <div style={{ height: h ?? "auto", overflow: "hidden", display: "flex", justifyContent: "center" }}>
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

/* Telegram main-button wrapper */
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
TGButton.displayName = "TGButton";

/* ───────── page component ───────── */
export default function RaffleUiPage() {
  /* params */
  const { hash: eventUuid, "raffle-uuid": raffleUuid } = useParams<{ hash: string; "raffle-uuid": string }>();
  if (!eventUuid || !raffleUuid) return <p className="text-center mt-10 text-red-500">Bad URL</p>;

  /* queries */
  const eventQ = trpc.events.getEvent.useQuery({ event_uuid: eventUuid });
  const viewQ = trpc.raffle.view.useQuery({ raffle_uuid: raffleUuid }, { refetchOnWindowFocus: false });
  const spinMut = trpc.raffle.spinTon.useMutation();

  /* wallet */
  const wallet = useTonAddress();
  const hasWallet = !!wallet;
  const modal = useTonConnectModal();

  /* split-flap state */
  const [score, setScore] = useState("000000");
  const [rolling, setRoll] = useState(false);
  const finalScore = useRef("000000");

  /* random loop */
  useEffect(() => {
    const id = setInterval(() => rolling && setScore(random6()), 100);
    return () => clearInterval(id);
  }, [rolling]);

  /* show stored score if user already spun */
  useEffect(() => {
    if (viewQ.data?.my?.score !== undefined) {
      finalScore.current = viewQ.data.my.score.toString().padStart(6, "0");
      setScore(finalScore.current);
    }
  }, [viewQ.data?.my?.score]);

  /* aliases */
  const raffle = viewQ.data?.raffle;
  const my = viewQ.data?.my;
  const winners = viewQ.data?.winners ?? [];

  /* wallet display */
  const rawAddr = my?.wallet_address || (hasWallet ? Address.parse(wallet).toRawString() : undefined);
  const walletB = rawAddr ? toBounce(rawAddr) : null;

  /* prize maths */
  const pool = BigInt(raffle?.prize_pool_nanoton ?? 0);
  const batches = BigInt(Math.ceil((raffle?.top_n ?? 1) / CHUNK_SIZE_RAFFLE));
  const gas = EXT_FEE_NANO * batches + INT_FEE_NANO * BigInt(raffle?.top_n ?? 1) + SAFETY_FLOOR_NANO;
  const perPrize = pool > gas ? (pool - gas) / BigInt(raffle?.top_n ?? 1) : BigInt(0);

  /* spin handler */
  const spin = useCallback(() => {
    if (!hasWallet) {
      modal.open();
      return;
    }

    setRoll(true); // start eye-candy immediately

    toast.promise(spinMut.mutateAsync({ raffle_uuid: raffleUuid, wallet_address: wallet }), {
      loading: "Spinning…",
      success: (res) => {
        finalScore.current = res.score.toString().padStart(6, "0");
        /* slow-down */
        const p = [150, 200, 300, 450, 700];
        let i = 0;
        const tick = () => {
          setScore(random6());
          if (i < p.length) setTimeout(tick, p[i++]);
          else {
            setRoll(false);
            setScore(finalScore.current);
            viewQ.refetch();
          }
        };
        tick();
        return `Your score: ${res.score}`;
      },
      error: (e) => {
        setRoll(false);
        setScore("000000");
        return e?.message ?? "Spin failed";
      },
    });
  }, [hasWallet, modal, spinMut, raffleUuid, wallet, viewQ]);

  /* WHEN to show the button?
     – user hasn’t spun yet       ( !my )
     – raffle is either waiting_funding OR funded
     – request not in-flight      ( !spinMut.isLoading )
  */
  const canSpin = raffle && !my && ["waiting_funding", "funded"].includes(raffle.status);
  const btnVisible = canSpin && !spinMut.isLoading;

  /* loading states */
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
        visible={btnVisible ?? false}
        label={hasWallet ? "Spin" : "Connect wallet"}
        busy={spinMut.isLoading}
        onClick={spin}
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
            🏆 Pool {ton(pool)} TON • Top&nbsp;{raffle?.top_n} get {ton(perPrize)} TON each
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
