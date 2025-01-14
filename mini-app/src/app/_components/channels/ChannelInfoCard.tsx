import { Card } from "konsta/react";
import Image from "next/image";
import Typography from "../../../components/Typography";
import { PropsWithChildren } from "react";
import xPlatformIcon from "./xplatform.svg";
import telegramIcon from "./telegram.svg";
import shareIcon from "./share.svg";
import { Channel } from "@/types";
import channelAvatar from "@/components/icons/channel-avatar.svg";
import { useRouter } from "next/navigation";

export default function ChannelInfoCard({ data }: { data: Channel }) {
  const share = () => {};

  return (
    <Card className="mt-0">
      {data.org_image ? (
        <Image
          className="mb-4 rounded"
          src={data.org_image}
          width={500}
          height={500}
          alt={data.org_channel_name || ""}
        />
      ) : (
        <div className="bg-[#EFEFF4] rounded-md p-1">
          <Image
            className="rounded-md"
            src={channelAvatar}
            width={500}
            height={500}
            alt={data.org_channel_name || ""}
          />
        </div>
      )}

      <div className="flex justify-between align-center mb-4">
        <Typography
          bold
          variant="title2"
          className="self-center"
        >
          {data.org_channel_name}
        </Typography>
        <div className="flex gap-3">
          <IconBg url={`https://x.com/${data.org_x_link}`}>
            <Image
              src={xPlatformIcon}
              width={16}
              height={16}
              alt={`${data.org_channel_name} on X`}
            />
          </IconBg>
          <IconBg url={`https://t.me/@${data.org_support_telegram_user_name}`}>
            <Image
              src={telegramIcon}
              width={16}
              height={16}
              alt={`${data.org_channel_name} on Telegram`}
            />
          </IconBg>
          <IconBg onClick={share}>
            <Image
              src={shareIcon}
              width={16}
              height={16}
              alt={`Share ${data.org_channel_name}'s channel`}
            />
          </IconBg>
        </div>
      </div>
      <Typography variant="body">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid blanditiis placeat voluptatibus rem soluta, in
        cumque alias quia quos fugiat iste laborum saepe sequi facilis at amet laudantium recusandae iure!
      </Typography>
    </Card>
  );
}

function IconBg({ url, onClick, children }: PropsWithChildren<{ onClick?: () => void; url?: string | null }>) {
  const router = useRouter();
  const handleClick = () => {
    if (onClick) return onClick();

    if (url) router.push(url);
  };
  return (
    <button
      className="w-8 h-8 bg-[#efeff4] rounded-[10px] p-2"
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
