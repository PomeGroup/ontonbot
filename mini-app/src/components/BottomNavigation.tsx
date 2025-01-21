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
    title: "My ONton",
    icon: <CircleUserRoundIcon />,
    url: "/my",
  },
];

export default function BottomNavigation({ active }: { active: "Events" | "Channels" | "My ONton" }) {
  const router = useRouter();

  return (
    <Tabbar
      labels
      icons
      className="left-0 bottom-0 fixed pt-2.5"
    >
      {tabs.map((tab) => (
        <TabbarLink
          key={tab.title}
          active={active === tab.title}
          onClick={() => router.push(tab.url)}
          icon={tab.icon}
          label={tab.title}
          linkProps={{ className: cn('pt-1 pb-safe background-blur-none rounded-t-[6px] before:bg-[#CCD1EA4D]', active === tab.title && 'bg-[#E5F2FF]') }}
        />
      ))}
    </Tabbar>
  );
}
