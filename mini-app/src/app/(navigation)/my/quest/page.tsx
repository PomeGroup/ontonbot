/* --------------------------- MyQuestsPage.tsx --------------------------- */
"use client";

import { useEffect, useRef, useState } from "react";
import { CopyIcon, SendIcon, Smartphone } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { toast } from "sonner";

import { trpc } from "@/app/_trpc/client";
import useWebApp from "@/hooks/useWebApp";
import { telegramShareLink } from "@/utils";
import { useUserStore } from "@/context/store/user.store";

import { Button } from "@/components/ui/button";
import TotalPointsBox from "../points/TotalPointsBox";
import EventPointsGroup from "../points/EventPointsGroup";
import ConnectTaskCard from "@/app/_components/Tasks/ConnectTaskCard";
import { RiTelegramLine } from "react-icons/ri";
import { TbBrandTelegram } from "react-icons/tb";

/* util: “1 Point” / “3 Points” / “Points” */
const pts = (n: number | null | undefined) => (n ? `${n} Point${n === 1 ? "" : "s"}` : "Points");
const isDone = (t?: { userTaskStatus: { status: string } | null }) => t?.userTaskStatus?.status === "done";

/* Task types handled by the generic quest router */
const QUEST_TYPES = [
  "start_bot",
  "x_view_post",
  "open_mini_app",
  "tg_join_channel",
  "tg_join_group",
  "tg_post_view",
] as const;

export default function MyQuestsPage() {
  const { user } = useUserStore();
  const webApp = useWebApp();

  /* ─────────────────────────── TASK QUERIES ─────────────────────────── */
  /* Connect‑account tasks (unchanged) */
  const xTaskQ = trpc.task.getTasksByType.useQuery({ taskType: "x_connect", onlyAvailableNow: false });
  const ghTaskQ = trpc.task.getTasksByType.useQuery({ taskType: "github_connect", onlyAvailableNow: false });
  const liTaskQ = trpc.task.getTasksByType.useQuery({ taskType: "linked_in_connect", onlyAvailableNow: false });

  /* -------- generic quest tasks -------- */
  /* One useQuery per instant‑quest type */
  const questQueries = QUEST_TYPES.map((tt) => trpc.task.getTasksByType.useQuery({ taskType: tt, onlyAvailableNow: false }));

  /* merge all quest arrays */
  const questTasks = questQueries.flatMap((q) => q.data?.tasks ?? []);

  /* ─────────────────── ACCOUNT‑CONNECT HELPERS ─────────────────── */
  const getXAuth = trpc.usersX.getAuthUrl.useQuery(undefined, { enabled: false });
  const getGhAuth = trpc.usersGithub.getAuthUrl.useQuery(undefined, { enabled: false });
  const getLiAuth = trpc.usersLinkedin.getAuthUrl.useQuery(undefined, { enabled: false });

  const openTab = (url?: string) => url && window.open(url, "_blank", "noopener");
  const closeMini = () => {
    if (webApp?.platform !== "tdesktop") {
      webApp?.close();
    }
  };
  const startX = () =>
    getXAuth.refetch().then((r) => {
      openTab(r.data?.authUrl);
      closeMini();
    });
  const startGh = () =>
    getGhAuth.refetch().then((r) => {
      openTab(r.data?.authUrl);
      closeMini();
    });
  const startLi = () =>
    getLiAuth.refetch().then((r) => {
      openTab(r.data?.authUrl);
      closeMini();
    });

  /* ───────────────────── GENERIC QUEST BEGIN / CHECK ─────────────────── */
  const [pendingId, setPendingId] = useState<number | null>(null);
  const pollRef = useRef<NodeJS.Timeout>();

  /* if server already shows an in‑progress quest → show spinner */
  useEffect(() => {
    if (pendingId !== null) return;
    const firstPending = questTasks.find((t) => t.userTaskStatus?.status === "in_progress");
    if (firstPending) setPendingId(firstPending.id);
  }, [questTasks, pendingId]);

  /* begin */
  const beginQuest = trpc.quest.begin.useMutation({
    onSuccess: ({ startBotLink }, vars) => {
      openTab(startBotLink);
      setPendingId(vars.taskId);
      closeMini();
    },
    onError: () => toast.error("Could not start the quest – try again later."),
  });

  /* check */
  const checkQuest = trpc.quest.check.useQuery(
    { taskId: pendingId as number },
    { enabled: false, retry: false, refetchOnWindowFocus: false }
  );

  /* polling while pending */
  useEffect(() => {
    if (pendingId === null) {
      pollRef.current && clearInterval(pollRef.current);
      return;
    }
    const poll = () =>
      checkQuest.refetch().then((res) => {
        if (res.data?.status === "done") {
          setPendingId(null);
          questQueries.forEach((q) => q.refetch());
          toast.success("Quest completed – points added!");
        }
      });
    poll();
    pollRef.current = setInterval(poll, 10_000);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [pendingId]);

  /* ───────────────────── affiliate & score hooks ────────────────── */
  const affDataQ = trpc.task.getOntonJoinAffiliateData.useQuery();
  const joinScore = trpc.usersScore.getTotalScoreByActivityTypesAndUserId.useQuery({
    activityTypes: ["join_onton_affiliate"],
    itemType: "task",
  });
  const totalPtsQ = trpc.usersScore.getTotalScoreByUserId.useQuery();

  const copyLink = async () => {
    if (!affDataQ.data?.linkHash) return toast.error("No link");
    await navigator.clipboard.writeText(affDataQ.data.linkHash);
    toast.success("Copied!");
  };
  const shareLink = () => {
    if (!affDataQ.data?.linkHash) return toast.error("No link");

    webApp?.openTelegramLink(telegramShareLink(affDataQ.data.linkHash, "Join me on ONTON and earn points!"));
  };

  /* ───────────────────────── loading guard ──────────────────────── */
  const loading = [xTaskQ, ghTaskQ, liTaskQ, ...questQueries, affDataQ, joinScore, totalPtsQ].some((q) => q.isLoading);

  if (!user || loading) return null;

  /* ───────────────────────────── UI ─────────────────────────────── */
  return (
    <div className="flex flex-col gap-4 px-4">
      <TotalPointsBox totalPoints={totalPtsQ.data ?? 0} />

      {/* ---------- Quick Quests ---------- */}
      {questTasks.length > 0 && (
        <EventPointsGroup title="Quick Quests">
          {questTasks.map((task) => {
            const loading = pendingId === task.id || beginQuest.isLoading;
            const finished = isDone(task);

            /* icon selection */
            let icon;
            if (task.taskType.startsWith("x_")) icon = <FaXTwitter className="text-xl" />;
            else if (task.taskType === "tg_join_channel") icon = <RiTelegramLine className="h-5 w-5" />;
            else if (task.taskType === "tg_join_group") icon = <TbBrandTelegram className="h-5 w-5" />;
            else if (task.taskType.startsWith("tg_")) {
              icon = (
                <svg
                  className="h-5 w-5 text-[#0088cc]"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2Zm4.28 6.36l-1.37 6.48c-.11.5-.4.62-.82.39l-2.3-1.7-1.11 1.07c-.12.12-.23.23-.46.23l.16-2.27 4.15-3.75c.18-.16-.04-.25-.28-.09l-5.13 3.22-2.21-.69c-.48-.15-.49-.48.1-.71l8.66-3.34c.4-.15.75.09.62.67Z"
                  />
                </svg>
              );
            } else if (task.taskType === "open_mini_app") icon = <Smartphone className="h-5 w-5" />;
            else icon = <Smartphone className="h-5 w-5" />; /* fallback */

            return (
              <ConnectTaskCard
                key={task.id}
                description={task.description}
                title={task.title}
                pointsLabel={pts(task.rewardPoint)}
                icon={icon}
                done={finished}
                loading={loading}
                onGo={() => beginQuest.mutate({ taskId: task.id })}
              />
            );
          })}
        </EventPointsGroup>
      )}

      {/* ---------- Connect Accounts ---------- */}
      <EventPointsGroup title="Connect Your Accounts">
        {xTaskQ.data?.tasks?.[0] && (
          <ConnectTaskCard
            title={xTaskQ.data.tasks[0].title}
            description={xTaskQ.data.tasks[0].description}
            pointsLabel={pts(xTaskQ.data.tasks[0].rewardPoint)}
            icon={<FaXTwitter />}
            done={isDone(xTaskQ.data.tasks[0])}
            onGo={startX}
          />
        )}
        {ghTaskQ.data?.tasks?.[0] && (
          <ConnectTaskCard
            title={ghTaskQ.data.tasks[0].title}
            description={ghTaskQ.data.tasks[0].description}
            pointsLabel={pts(ghTaskQ.data.tasks[0].rewardPoint)}
            icon={<FaGithub />}
            done={isDone(ghTaskQ.data.tasks[0])}
            onGo={startGh}
          />
        )}
        {liTaskQ.data?.tasks?.[0] && (
          <ConnectTaskCard
            title={liTaskQ.data.tasks[0].title}
            description={liTaskQ.data.tasks[0].description}
            pointsLabel={pts(liTaskQ.data.tasks[0].rewardPoint)}
            icon={<FaLinkedinIn />}
            done={isDone(liTaskQ.data.tasks[0])}
            onGo={startLi}
          />
        )}
      </EventPointsGroup>

      {/* ---------- Affiliate Quest ---------- */}
      <EventPointsGroup title="Invite Friends – ONTON Affiliate">
        <p className="text-sm">{affDataQ.data ? "Share your link and earn!" : "No affiliate quest right now."}</p>

        <div className="mt-3 flex w-full flex-wrap gap-2">
          <Button
            className="flex flex-1 items-center justify-center gap-2 rounded-md border-2"
            variant="outline"
            disabled={!affDataQ.data?.linkHash}
            onClick={copyLink}
          >
            <CopyIcon className="h-4 w-4" /> Copy Link
          </Button>
          <Button
            className="flex flex-1 items-center justify-center gap-2 rounded-md border-2"
            variant="outline"
            disabled={!affDataQ.data?.linkHash}
            onClick={shareLink}
          >
            <SendIcon className="h-4 w-4" /> Share
          </Button>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {joinScore.data?.count ?? 0} referral
          {(joinScore.data?.count ?? 0) === 1 ? "" : "s"} • {pts(joinScore.data?.total)}
        </p>
      </EventPointsGroup>
    </div>
  );
}
