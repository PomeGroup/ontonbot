"use client";

import { Block } from "konsta/react";
import Image from "next/image";
import Typography from "../_components/atoms/typography";
import BottomNavigation from "../_components/BottomNavigation";
import Link from "next/link";
import { Channel } from "@/types";

let lastId = 1;

const channels = [
  {
    id: lastId++,
    avatar: "/sq.jpg",
    title: "Test",
    eventCount: 12,
  },
  {
    id: lastId++,
    avatar: "/sq.jpg",
    title: "Test",
    eventCount: 12,
  },
  {
    id: lastId++,
    avatar: "/sq.jpg",
    title: "Test",
    eventCount: 12,
  },
  {
    id: lastId++,
    avatar: "/sq.jpg",
    title: "Test",
    eventCount: 12,
  },
  {
    id: lastId++,
    avatar: "/sq.jpg",
    title: "Test",
    eventCount: 12,
  },
  {
    id: lastId++,
    avatar: "/sq.jpg",
    title: "Test",
    eventCount: 12,
  },
  {
    id: lastId++,
    avatar: "/sq.jpg",
    title: "Test",
    eventCount: 12,
  },
  {
    id: lastId++,
    avatar: "/sq.jpg",
    title: "Test",
    eventCount: 12,
  },
  {
    id: lastId++,
    avatar: "/sq.jpg",
    title: "Test",
    eventCount: 12,
  },
  {
    id: lastId++,
    avatar: "/sq.jpg",
    title: "Test",
    eventCount: 12,
  },
];

export default function ChannelsPage() {
  return (
    <Block
      margin="0"
      className="flex flex-wrap gap-4 bg-[rgba(239,239,244,1)] pt-8"
    >
      {channels.map((channel) => (
        <ChannelCard
          key={channel.id}
          data={channel}
        />
      ))}
      <BottomNavigation active="Channels" />
    </Block>
  );
}

interface ChannelCardProps {
  data: Channel;
}

function ChannelCard({ data }: ChannelCardProps) {
  return (
    <Link
      href={`/channels/${data.id}`}
      className="p-4 bg-white rounded-md flex-1 min-w-[40%]"
    >
      <Image
        className="rounded-md mb-3"
        src={data.avatar}
        width={300}
        height={300}
        alt={data.title}
      />
      <div className="text-center">
        <div className="font-[590] mb-2 text-[17px] leading-[22px] tracking">{data.title}</div>
        <div>
          <Typography
            variant="subheadline2"
            bold
          >
            {data.eventCount}
          </Typography>
          <Typography variant="subheadline2">&nbsp;Events</Typography>
        </div>
      </div>
    </Link>
  );
}
