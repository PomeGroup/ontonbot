import { Card } from "konsta/react";
import Image from "next/image";
import Typography from "../../../components/Typography";
import { PropsWithChildren } from "react";
import xPlatformIcon from "./xplatform.svg";
import telegramIcon from "./telegram.svg";
import shareIcon from "./share.svg";
import { Channel } from "@/types";
import channelAvatar from "@/components/icons/channel-avatar.svg";

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
          {data.org_x_link && (
            <IconBg onClick={() => window.Telegram.WebApp.openLink(data.org_x_link as string, { try_instant_view: true })}>
              <Image
                src={xPlatformIcon}
                width={16}
                height={16}
                alt={`${data.org_channel_name} on X`}
              />
            </IconBg>
          )}
          {data.org_support_telegram_user_name && (
            <IconBg
              onClick={() =>
                window.Telegram.WebApp.openTelegramLink(`https://t.me/${data.org_support_telegram_user_name?.substring(1)}`)
              }
            >
              <Image
                src={telegramIcon}
                width={16}
                height={16}
                alt={`${data.org_channel_name} on Telegram`}
              />
            </IconBg>
          )}
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
      <Typography
        variant="body"
        className="font-normal"
      >
        <span dangerouslySetInnerHTML={{ __html: data.org_bio?.replaceAll("\n", "<br/>") as string }} />
      </Typography>
      {/* {user?.user_id === data.user_id && (
        <Button
          className="mt-3 py-4 rounded-[10px]"
          outline
          onClick={() => router.push(`/my/edit`)}
        >
          Edit Profile
        </Button>
      )} */}
    </Card>
  );
}

function IconBg({ onClick, children }: PropsWithChildren<{ onClick: () => void }>) {
  return (
    <button
      className="w-8 h-8 bg-[#efeff4] rounded-[10px] p-2"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
