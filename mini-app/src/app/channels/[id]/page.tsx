"use client";

import { Card } from "konsta/react";
import Image from "next/image";
import Typography from "../../../components/Typography";
import ticketIcon from "@/app/_components/icons/ticket.svg";
import { ArrowRight } from "lucide-react";
import ChannelInfoCard from "@/app/_components/channels/ChannelInfoCard";

const data = {
  id: 15,
  avatar: "/sq.jpg",
  title: "TON Network",
  eventCount: 223,
};

export default function ChannelPage() {
  return (
    <div className="bg-[#EFEFF4] py-4">
      <ChannelInfoCard data={data} />
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
