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

export default function BottomNavigation({ active }: { active: "Events" | "Channels" | "My ONTON" }) {
  const router = useRouter();

  return (
    <Tabbar
      labels
      icons
      className="left-0 bottom-0 fixed"
    >
      {tabs.map((tab) => (
        <TabbarLink
          key={tab.title}
          active={active === tab.title}
          onClick={() => router.push(tab.url)}
          icon={tab.icon}
          label={tab.title}
        />
      ))}
    </Tabbar>
  );
}
