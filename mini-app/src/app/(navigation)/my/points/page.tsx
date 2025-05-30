"use client";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/context/store/user.store";
import useWebApp from "@/hooks/useWebApp";
import { telegramShareLink } from "@/utils";
import { CopyIcon, SendIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import ChevronDownIconAccord from "./ChevronDownIcon";
import EventPointsCard from "./EventPointsCard";
import EventPointsGroup from "./EventPointsGroup";
import TotalPointsBox from "./TotalPointsBox";

export default function MyPointsPage() {
  const { user } = useUserStore();
  const webapp = useWebApp();

  const [isOpen, setIsOpen] = useState(true);

  /* ---------- data hooks ---------- */
  const ontonJoinAffiliateDataQuery = trpc.task.getOntonJoinAffiliateData.useQuery();

  const paidOnline = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["paid_online_event"],
    itemType: "event",
  });
  const freeOnline = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["free_online_event"],
    itemType: "event",
  });
  const paidOffline = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["paid_offline_event"],
    itemType: "event",
  });
  const freeOffline = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["free_offline_event"],
    itemType: "event",
  });
  const joinAffiliate = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["join_onton_affiliate"],
    itemType: "task",
  });
  const organizeEvents = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["paid_online_event", "paid_offline_event", "free_online_event", "free_offline_event"],
    itemType: "organize_event",
  });

  // NEW: Play‑to‑Win activity types ----------------
  const freePlay2Win = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["free_play2win"],
    itemType: "game",
  });
  const paidPlay2Win = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["paid_play2win"],
    itemType: "game",
  });

  const totalPointsQuery = trpc.usersScore.getTotalScoreByUserId.useQuery();

  /* ---------- loading guard ---------- */
  const anyLoading = [
    paidOnline,
    freeOnline,
    paidOffline,
    freeOffline,
    joinAffiliate,
    organizeEvents,
    freePlay2Win,
    paidPlay2Win,
    totalPointsQuery,
  ].some((q) => q.isLoading);

  if (!user || anyLoading) return null;

  /* ---------- helpers ---------- */
  const copyLink = async () => {
    if (ontonJoinAffiliateDataQuery.data?.linkHash) {
      await navigator.clipboard.writeText(ontonJoinAffiliateDataQuery.data.linkHash);
      toast.success("Link copied to clipboard");
    } else {
      toast.error("No link hash found");
    }
  };

  const shareLink = () => {
    if (ontonJoinAffiliateDataQuery.data?.linkHash) {
      webapp?.openTelegramLink(
        telegramShareLink(
          ontonJoinAffiliateDataQuery.data.linkHash,
          `\nJoin ONTON Affiliate\n\nCheck out this exclusive ONTON referral link for special tasks and bonuses:\n\nGood luck and see you in the ONTON world! 🏆`
        )
      );
    } else {
      toast.error("No link hash found");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <TotalPointsBox totalPoints={totalPointsQuery.data ?? 0} />

      <div className="bg-white rounded-md p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Event Participation</h1>
          <button
            className="ml-2 text-gray-700"
            onClick={() => setIsOpen((p) => !p)}
          >
            <ChevronDownIconAccord isOpen={isOpen} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-2">6 Tasks</p>

        <div
          className={`overflow-hidden flex flex-col gap-4 transition-all duration-300 ${
            isOpen ? "max-h-[1000px]" : "max-h-0"
          }`}
        >
          {/* Online events */}
          <EventPointsGroup title="Online Events">
            <Link
              href="/my/points/paid_online_event/details"
              className="w-full"
            >
              <EventPointsCard
                eventTitle="Attend paid online events"
                tasksCount={Number(paidOnline.data?.count ?? 0)}
                description="10 Points"
                totalPoints={Number(paidOnline.data?.total ?? 0)}
                type="paid_online_event"
              />
            </Link>
            <Link
              href="/my/points/free_online_event/details"
              className="w-full"
            >
              <EventPointsCard
                eventTitle="Attend free online events"
                tasksCount={Number(freeOnline.data?.count ?? 0)}
                description="1 Point"
                totalPoints={Number(freeOnline.data?.total ?? 0)}
                type="free_online_event"
              />
            </Link>
          </EventPointsGroup>

          {/* In‑person events */}
          <EventPointsGroup title="In‑Person Events">
            <Link
              href="/my/points/paid_offline_event/details"
              className="w-full"
            >
              <EventPointsCard
                eventTitle="Attend paid in‑person events"
                tasksCount={Number(paidOffline.data?.count ?? 0)}
                description="20 Points"
                totalPoints={Number(paidOffline.data?.total ?? 0)}
                type="paid_offline_event"
              />
            </Link>
            <Link
              href="/my/points/free_offline_event/details"
              className="w-full"
            >
              <EventPointsCard
                eventTitle="Attend free in‑person events"
                tasksCount={Number(freeOffline.data?.count ?? 0)}
                description="10 Points"
                totalPoints={Number(freeOffline.data?.total ?? 0)}
                type="free_offline_event"
              />
            </Link>
          </EventPointsGroup>

          {/* Play‑to‑Win games (NEW) */}
          <EventPointsGroup title="Play‑to‑Win Points">
            <EventPointsCard
              eventTitle="Paid play‑to‑win games"
              tasksCount={Number(paidPlay2Win.data?.count ?? 0)}
              description="10 Points"
              totalPoints={Number(paidPlay2Win.data?.total ?? 0)}
            />

            <EventPointsCard
              eventTitle="Free play‑to‑win games"
              tasksCount={Number(freePlay2Win.data?.count ?? 0)}
              description="1 Point"
              totalPoints={Number(freePlay2Win.data?.total ?? 0)}
            />
          </EventPointsGroup>

          {/* Referrals */}
          <EventPointsGroup title="Referrals">
            <Link
              href="/my/points/join_onton_affiliate/details"
              className="w-full"
            >
              <EventPointsCard
                eventTitle="Join ONTON Affiliate"
                tasksCount={Number(joinAffiliate.data?.count ?? 0)}
                description="0.2 Points"
                totalPoints={Number(joinAffiliate.data?.total ?? 0)}
                type="join_onton_affiliate"
              />
            </Link>
            <div className="flex w-full gap-2 flex-wrap">
              <Button
                className="flex-1 rounded-md border-2 flex items-center justify-center gap-2"
                variant="outline"
                disabled={!ontonJoinAffiliateDataQuery.data?.linkHash}
                onClick={copyLink}
              >
                <CopyIcon className="w-4 h-4" />
                <span>Copy Link</span>
              </Button>
              <Button
                className="flex-1 rounded-md border-2 flex items-center justify-center gap-2"
                variant="outline"
                disabled={!ontonJoinAffiliateDataQuery.data?.linkHash}
                onClick={shareLink}
              >
                <SendIcon className="w-4 h-4" />
                <span>Share link</span>
              </Button>
            </div>
          </EventPointsGroup>

          {/* Organize events */}
          <EventPointsGroup title="Organize Events">
            <EventPointsCard
              eventTitle="Organize events"
              tasksCount={Number(organizeEvents.data?.count ?? 0)}
              description="0.2 × participation points × participant count"
              totalPoints={Number(organizeEvents.data?.total ?? 0)}
            />
          </EventPointsGroup>
        </div>
      </div>
    </div>
  );
}
