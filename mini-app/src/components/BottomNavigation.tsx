import PlayStationIcon from "@/app/_components/icons/play-station";
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
    title: "Play2Win",
    icon: <PlayStationIcon />,
    url: "/play-2-win",
  },
  {
    title: "My ONTON",
    icon: <UserIcon />,
    url: "/my",
  },
];

export default function BottomNavigation({ active }: { active: (typeof tabs)[number]["title"] }) {
  const router = useRouter();

  return (
    <Tabbar
      labels
      icons
      className={`left-0 bottom-0 h-[calc(48px+(var(--tg-safe-area-inset-bottom,0px)/2))] fixed`}
    >
      {tabs.map((tab) => (
        <TabbarLink
          key={tab.title}
          active={active === tab.title}
          onClick={() => router.push(tab.url)}
          icon={tab.icon}
          label={tab.title}
          linkProps={{ className: cn("pt-1 before:bg-[#CCD1EA4D]") }}
        />
      ))}
    </Tabbar>
  );
}
