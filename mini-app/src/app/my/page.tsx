"use client";
import { Button, Card } from "konsta/react";
import ChannelInfoCard from "../_components/channels/ChannelInfoCard";
import ticketIcon from "@/app/_components/icons/ticket.svg";
import calendarStarIcon from "./calendar-star.svg";
import Image from "next/image";
import Typography from "../_components/atoms/typography";
import { ArrowRight } from "lucide-react";
import BottomNavigation from "../_components/BottomNavigation";

const data = {
  id: 15,
  avatar: "/sq.jpg",
  title: "TON Network",
  eventCount: 223,
};

export default function ProfilePage() {
  return (
    <div className="bg-[#EFEFF4] py-4">
      <ChannelInfoCard data={data}>
        <Button
          outline
          className="mt-4 py-4"
          color="primary"
        >
          Edit Profile
        </Button>
      </ChannelInfoCard>
      <Card>
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
              Participated
            </Typography>
            <Typography variant="body">Your Activity</Typography>
            <Typography
              variant="caption1"
              className="mt-auto flex gap-4"
            >
              <div>
                <b>{data.eventCount}</b> Events
              </div>
              <div>
                <b>{data.eventCount}</b> SBTs
              </div>
            </Typography>
          </div>
          <div className="self-center">
            <ArrowRight className="text-main-button-color" />
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex gap-3 align-stretch">
          <div className="bg-[#efeff4] p-4 rounded-lg">
            <Image
              src={calendarStarIcon}
              width={48}
              height={48}
              alt="Calendar icon"
            />
          </div>
          <div className="flex flex-col flex-1">
            <Typography
              bold
              variant="title3"
            >
              Hosted
            </Typography>
            <Typography variant="body">You Created</Typography>
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
      <Button className="mb-12 mx-4 w-[calc(100%-2rem)] py-6">Create New Event</Button>
      <BottomNavigation active="MyONTON" />
    </div>
  );
}
