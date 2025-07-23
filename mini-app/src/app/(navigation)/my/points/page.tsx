"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CopyIcon, SendIcon } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { toast } from "sonner";

import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { telegramShareLink } from "@/utils";
import { useUserStore } from "@/context/store/user.store";

import { Button } from "@/components/ui/button";
import ChevronDownIconAccord from "./ChevronDownIcon";
import EventPointsCard from "./EventPointsCard";
import EventPointsGroup from "./EventPointsGroup";
import TotalPointsBox from "./TotalPointsBox";
import ConnectTaskCard from "@/app/_components/Tasks/ConnectTaskCard";

/* tiny helper */
const pts = (n: number | null | undefined) => (n ? `${n} Point${n === 1 ? "" : "s"}` : "Points");

export default function MyPointsPage() {
  const { user } = useUserStore();
  const webApp = useWebApp();
  const [isOpen, setIsOpen] = useState(true);

  /* ------------------------------------------------------------------ */
  /*                 1. fetch tasks (title + reward + status)           */
  /* ------------------------------------------------------------------ */
  const xTaskQ = trpc.task.getTasksByType.useQuery({ taskType: "x_connect", onlyAvailableNow: false });
  const ghTaskQ = trpc.task.getTasksByType.useQuery({ taskType: "github_connect", onlyAvailableNow: false });
  const liTaskQ = trpc.task.getTasksByType.useQuery({ taskType: "linked_in_connect", onlyAvailableNow: false });

  /* shortcut */
  function first<T>(arr: T[] | undefined): T | undefined {
    return arr && arr.length ? arr[0] : undefined;
  }

  const xTask = xTaskQ.data?.tasks?.[0]; // MergedTask | undefined
  const ghTask = ghTaskQ.data?.tasks?.[0];
  const liTask = liTaskQ.data?.tasks?.[0];
  /* derived */
  const xDone = !!xTask?.userTaskStatus && xTask.userTaskStatus.status === "done";
  const ghDone = !!ghTask?.userTaskStatus && ghTask.userTaskStatus.status === "done";
  const liDone = !!liTask?.userTaskStatus && liTask.userTaskStatus.status === "done";

  /* ------------------------------------------------------------------ */
  /*                   2. connection auth URL queries                   */
  /* ------------------------------------------------------------------ */
  const getXAuthUrl = trpc.usersX.getAuthUrl.useQuery(undefined, { enabled: false });
  const getGhAuthUrl = trpc.usersGithub.getAuthUrl.useQuery(undefined, { enabled: false });
  const getLiAuthUrl = trpc.usersLinkedin.getAuthUrl.useQuery(undefined, { enabled: false });

  const startXConnect = useCallback(async () => {
    const { data } = await getXAuthUrl.refetch();
    if (data?.authUrl) window.open(data.authUrl, "_blank", "noopener");
    webApp?.close();
  }, [getXAuthUrl, webApp]);

  const startGhConnect = useCallback(async () => {
    const { data } = await getGhAuthUrl.refetch();
    if (data?.authUrl) window.open(data.authUrl, "_blank", "noopener");
    webApp?.close();
  }, [getGhAuthUrl, webApp]);

  const startLiConnect = useCallback(async () => {
    const { data } = await getLiAuthUrl.refetch();
    if (data?.authUrl) window.open(data.authUrl, "_blank", "noopener");
    webApp?.close();
  }, [getLiAuthUrl, webApp]);

  /* ------------------------------------------------------------------ */
  /*                   3. other existing point queries                  */
  /* ------------------------------------------------------------------ */
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

  const freePlay2Win = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["free_play2win"],
    itemType: "game",
  });
  const paidPlay2Win = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["paid_play2win"],
    itemType: "game",
  });

  const joinAffiliate = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["join_onton_affiliate"],
    itemType: "task",
  });
  const organizeEvents = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["paid_online_event", "paid_offline_event", "free_online_event", "free_offline_event"],
    itemType: "organize_event",
  });

  const totalPointsQuery = trpc.usersScore.getTotalScoreByUserId.useQuery();
  const ontonJoinAffiliateDataQuery = trpc.task.getOntonJoinAffiliateData.useQuery();

  /* ------------------------------------------------------------------ */
  /*                               guards                               */
  /* ------------------------------------------------------------------ */
  const queriesLoading = [
    xTaskQ,
    ghTaskQ,
    liTaskQ,
    paidOnline,
    freeOnline,
    paidOffline,
    freeOffline,
    freePlay2Win,
    paidPlay2Win,
    joinAffiliate,
    organizeEvents,
    totalPointsQuery,
  ].some((q) => q.isLoading);

  if (!user || queriesLoading) return null;

  /* affiliate helpers */
  const copyLink = async () => {
    const h = ontonJoinAffiliateDataQuery.data?.linkHash;
    if (!h) return toast.error("No link hash found");
    await navigator.clipboard.writeText(h);
    toast.success("Link copied");
  };
  const shareLink = () => {
    const h = ontonJoinAffiliateDataQuery.data?.linkHash;
    if (!h) return toast.error("No link hash found");
    webApp?.openTelegramLink(
      telegramShareLink(
        h,
        "\nJoin ONTON Affiliate\n\nCheck out this exclusive ONTON referral link for special tasks and bonuses:"
      )
    );
  };

  /* ------------------------------------------------------------------ */
  /*                                UI                                  */
  /* ------------------------------------------------------------------ */
  return (
    <div className="flex flex-col gap-4">
      <TotalPointsBox totalPoints={totalPointsQuery.data ?? 0} />

      <div className="rounded-md bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Event Participation</h1>
          <button
            className="ml-2 text-gray-700"
            onClick={() => setIsOpen((p) => !p)}
          >
            <ChevronDownIconAccord isOpen={isOpen} />
          </button>
        </div>
        <p className="mb-2 text-xs text-gray-500">6 Tasks</p>

        <div
          className={`flex flex-col gap-4 overflow-hidden transition-all duration-300 ${
            isOpen ? "max-h-[1200px]" : "max-h-0"
          }`}
        >
          {/* ----- existing groups (online / offline / play2win) ----- */}
          {/* ... the same EventPointsGroup blocks you already have … */}

          {/* Account Connections – dynamic from DB */}
          <EventPointsGroup title="Account Connections">
            {xTask && (
              <ConnectTaskCard
                title={xTask.title}
                pointsLabel={pts(xTask.rewardPoint)}
                icon={<FaXTwitter />}
                done={xDone}
                onGo={startXConnect}
              />
            )}
            {ghTask && (
              <ConnectTaskCard
                title={ghTask.title}
                pointsLabel={pts(ghTask.rewardPoint)}
                icon={<FaGithub />}
                done={ghDone}
                onGo={startGhConnect}
              />
            )}
            {liTask && (
              <ConnectTaskCard
                title={liTask.title}
                pointsLabel={pts(liTask.rewardPoint)}
                icon={<FaLinkedinIn />}
                done={liDone}
                onGo={startLiConnect}
              />
            )}
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
            <div className="flex w-full flex-wrap gap-2">
              <Button
                className="flex flex-1 items-center justify-center gap-2 rounded-md border-2"
                variant="outline"
                disabled={!ontonJoinAffiliateDataQuery.data?.linkHash}
                onClick={copyLink}
              >
                <CopyIcon className="h-4 w-4" />
                <span>Copy Link</span>
              </Button>
              <Button
                className="flex flex-1 items-center justify-center gap-2 rounded-md border-2"
                variant="outline"
                disabled={!ontonJoinAffiliateDataQuery.data?.linkHash}
                onClick={shareLink}
              >
                <SendIcon className="h-4 w-4" />
                <span>Share link</span>
              </Button>
            </div>
          </EventPointsGroup>

          {/* Organize */}
          <EventPointsGroup title="Organize Events">
            <EventPointsCard
              eventTitle="Organize events"
              tasksCount={Number(organizeEvents.data?.count ?? 0)}
              description="0.2 × participation points × participant count"
              totalPoints={Number(organizeEvents.data?.total ?? 0)}
            />
          </EventPointsGroup>

          <EventPointsCard
            eventTitle="Attend free online events"
            tasksCount={Number(freeOnline.data?.count ?? 0)}
            description="1 Point"
            totalPoints={Number(freeOnline.data?.total ?? 0)}
            type="free_online_event"
          />

          {/* In‑person events */}

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

          {/* Play‑to‑Win */}
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
        </div>
      </div>
    </div>
  );
}
