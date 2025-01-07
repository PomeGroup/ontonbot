"use client";
import { Card } from "konsta/react";
import Image from "next/image";
import Typography from "../../_components/atoms/typography";
import ticketIcon from "./ticket.svg";
import { ArrowRight } from "lucide-react";
import { PropsWithChildren } from "react";
import Link from "next/link";
import xPlatformIcon from "./xplatform.svg";
import telegramIcon from "./telegram.svg";
import shareIcon from "./share.svg";

const data = {
  avatar: "/sq.jpg",
  title: "TON Network",
  eventCount: 223,
};

export default function ChannelPage() {
  return (
    <div className="bg-[#EFEFF4] py-4">
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
      </Card>
      <Card className="p-4 mb-0">
        <div className="flex gap-3 align-stretch">
          <div className="bg-[#efeff4] p-4 rounded-lg">
            <Image
              src={ticketIcon}
              width={48}
              height={48}
              alt="ticket icon"
            />
          </div>
          <div className="flex flex-col flex-1">
            <Typography
              bold
              variant="title3"
            >
              Events
            </Typography>
            <Typography variant="body">Visit organizer&apos;s events</Typography>
            <Typography
              variant="caption1"
              className="mt-auto"
            >
              <b>{data.eventCount}</b> Events
            </Typography>
          </div>
          <div className="self-center">
            <ArrowRight className="text-main-button-color" />
          </div>
        </div>
      </Card>
    </div>
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
