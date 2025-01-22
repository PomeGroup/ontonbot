import { cn } from "@/utils";
import { Tabbar, TabbarLink } from "konsta/react";
import { GlobeIcon, NetworkIcon, CircleUserRoundIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const tabs = [
  {
    title: "Events",
    icon: <GlobeIcon />,
    url: "/",
  },
  {
    title: "Channels",
    icon: <NetworkIcon />,
    url: "/channels",
  },
  {
    title: "My ONTON",
    icon: <CircleUserRoundIcon />,
    url: "/my",
  },
];

export default function BottomNavigation({ active }: { active: "Events" | "Channels" | "My ONTON" }) {
  const router = useRouter();

  return (
    <Tabbar
      labels
      icons
      className={`left-0 bottom-0 fixed !h-[calc(48px+var(--tg-safe-area-inset-bottom))]`}
    >
      {tabs.map((tab) => (
        <TabbarLink
          key={tab.title}
          active={active === tab.title}
          onClick={() => router.push(tab.url)}
          icon={tab.icon}
          label={tab.title}
          linkProps={{ className: cn('pt-1 pb-[var(--tg-safe-area-inset-bottom)] h-14 before:bg-[#CCD1EA4D]') }}
        />
      ))}
    </Tabbar>
  );
}
