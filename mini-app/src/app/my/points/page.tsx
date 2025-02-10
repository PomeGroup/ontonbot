"use client";
import ticketIcon from "@/app/_components/icons/ticket.svg";
import { useUserStore } from "@/context/store/user.store";
import { useRouter } from "next/navigation";
import ActionCard from "@/ActionCard";

export default function MyPointsPage() {
  const { user } = useUserStore();
  const router = useRouter();
  if (!user) return null;

  return (
    <div className="bg-[#EFEFF4] py-4 min-h-screen mb-[calc(-1*var(--tg-safe-area-inset-bottom))]">
      <ActionCard
        onClick={() => router.push("/my/participated")}
        iconSrc={ticketIcon}
        title="Participated"
        subtitle="Your Activity"
        footerTexts={[
          {
            count: user?.participated_event_count || 0,
            items: "Events",
          },
        ]}
      />
    </div>
  );
}
