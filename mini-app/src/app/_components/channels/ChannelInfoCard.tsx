import { Card } from "konsta/react";
import Image from "next/image";
import Typography from "../atoms/typography";
import { PropsWithChildren } from "react";
import Link from "next/link";
import xPlatformIcon from "./xplatform.svg";
import telegramIcon from "./telegram.svg";
import shareIcon from "./share.svg";
import { Channel } from "@/types";

export default function ChannelInfoCard({ data, children }: PropsWithChildren<{ data: Channel }>) {
  return (
    <Card className="mt-0">
      <Image
        className="mb-4 rounded"
        src={data.avatar}
        width={500}
        height={500}
        alt={data.title}
      />
      <div className="flex justify-between align-center mb-4">
        <Typography
          bold
          variant="title2"
          className="self-center"
        >
          {data.title}
        </Typography>
        <div className="flex gap-3">
          <IconBg>
            <Image
              src={xPlatformIcon}
              width={16}
              height={16}
              alt={`${data.title} on X`}
            />
          </IconBg>
          <IconBg>
            <Image
              src={telegramIcon}
              width={16}
              height={16}
              alt={`${data.title} on Telegram`}
            />
          </IconBg>
          <IconBg>
            <Image
              src={shareIcon}
              width={16}
              height={16}
              alt={`Share ${data.title}'s channel`}
            />
          </IconBg>
        </div>
      </div>
      <Typography variant="body">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid blanditiis placeat voluptatibus rem soluta, in
        cumque alias quia quos fugiat iste laborum saepe sequi facilis at amet laudantium recusandae iure!
      </Typography>
      {children}
    </Card>
  );
}

function IconBg({ url = "https://test.com", children }: PropsWithChildren<{ url?: string }>) {
  return (
    <Link
      href={url}
      className="bg-[#efeff4] rounded-lg p-4"
    >
      {children}
    </Link>
  );
}
