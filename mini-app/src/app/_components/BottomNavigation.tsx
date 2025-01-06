import { Tabbar, TabbarLink } from "konsta/react";
import { Calendar1Icon, UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { PiTelegramLogo } from "react-icons/pi";

const tabs = [
  {
    title: "Events",
    icon: <Calendar1Icon />,
    url: "/",
  },
  {
    title: "Channels",
    icon: <UsersIcon />,
    url: "/channels",
  },
  {
    title: "My ONTON",
    icon: <PiTelegramLogo />,
    url: "/my",
  },
];

export default function BottomNavigation({ active }: { active: "Events" | "Channels" | "MyONTON" }) {
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
