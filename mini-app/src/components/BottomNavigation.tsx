import PlayStationIcon from "@/app/_components/icons/play-station"
import { useUserStore } from "@/context/store/user.store"
import { cn } from "@/utils"
import { Page, Tabbar, TabbarLink } from "konsta/react"
import { Calendar, UserIcon, Users } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { ReactNode } from "react"

interface Tab {
  title: string;
  icon: JSX.Element;
  urls: string[];
}

const tabs: Tab[] = [
  {
    title: "Events",
    icon: <Calendar />,
    urls: ["/"],
  },
  {
    title: "Channels",
    icon: <Users />,
    urls: ["/channels"],
  },
  {
    title: "Play2Win",
    icon: <PlayStationIcon />,
    urls: ["/play-2-win"],
  },
  {
    title: "My ONTON",
    icon: <UserIcon />,
    urls: ["/my", "/my/points"],
  },
  {
    title: "Genesis Onions",
    icon: <UserIcon />,
    urls: ["/genesis-onions"],
  }
];

export default function BottomNavigation(props: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserStore();

  // Return children if current pathname doesn't exist in any tab's urls
  if (!tabs.some((tab) => tab.urls.includes(pathname))) {
    return <>{props.children}</>;
  }

  return (
    <Page>
      <div className="p-4 flex flex-col gap-2 mb-12">
        {props.children}
        <Tabbar
          labels
          icons
          className={`left-0 bottom-0 h-[calc(48px+(var(--tg-safe-area-inset-bottom,0px)/2))] fixed`}
        >
          {tabs
            .map((tab) => (
              <TabbarLink
                key={tab.title}
                active={tab.urls.includes(pathname)}
                onClick={() => router.push(tab.urls[0])}
                icon={tab.icon}
                label={tab.title}
                linkProps={{ className: cn("pt-1 before:bg-[#CCD1EA4D]") }}
              />
            ))}
        </Tabbar>
      </div>
    </Page>
  );
}
