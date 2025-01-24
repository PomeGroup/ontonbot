import { cn } from "@/utils";
import { Tabbar, TabbarLink } from "konsta/react";
import { Calendar, UserIcon, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const tabs = [
  {
    title: "Events",
    icon: <Calendar />,
    url: "/",
  },
  {
    title: "Channels",
    icon: <Users />,
    url: "/channels",
  },
  {
    title: "My ONTON",
    icon: <UserIcon />,
    url: "/my",
  },
];

export default function BottomNavigation({ active }: { active: "Events" | "Channels" | "My ONTON" }) {
  const router = useRouter();

  return (
    <Tabbar
      labels
      icons
      className={`left-0 !bottom-safe fixed !h-[calc(48px+var(--tg-safe-area-inset-bottom))]`}
    >
      {tabs.map((tab) => (
        <TabbarLink
          key={tab.title}
          active={active === tab.title}
          onClick={() => router.push(tab.url)}
          icon={tab.icon}
          label={tab.title}
          linkProps={{ className: cn('pt-1 before:bg-[#CCD1EA4D]') }}
        />
      ))}
    </Tabbar>
  );
}
