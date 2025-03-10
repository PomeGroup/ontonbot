"use client";

import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import Typography from "@/components/Typography";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type React from "react";

interface Participant {
  id: number;
  name: string;
  points: number;
  avatar: string;
  position: number;
}

interface LeaderboardProps {
  bestScore: number;
  timesPlayed: number;
  position: string;
  participants: Participant[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  bestScore = 121,
  timesPlayed = 2,
  position = "1: 2",
  participants = [],
}) => {
  const topThreeParticipants = participants.slice(0, 3);
  const remainingParticipants = participants.slice(3);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Assessment Section */}
      <CustomCard className="mb-6">
        <div className="p-4">
          <Typography
            variant="title3"
            weight="semibold"
            className="mb-4"
          >
            Your Assessment
          </Typography>

          <div className="flex justify-between items-center">
            {/* Times Played */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500 flex items-center justify-center">
                <div className="text-center">
                  <Typography
                    variant="title3"
                    weight="bold"
                  >
                    {timesPlayed}x
                  </Typography>
                  <Typography
                    variant="caption1"
                    weight="light"
                    className="text-gray-500"
                  >
                    Played
                  </Typography>
                </div>
              </div>
            </div>

            {/* Best Score */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-4 border-blue-500 flex items-center justify-center">
                <div className="text-center">
                  <Typography
                    variant="title1"
                    weight="normal"
                  >
                    {bestScore}
                  </Typography>
                  <Typography
                    variant="caption1"
                    weight="light"
                    className="text-gray-500"
                  >
                    Best Score
                  </Typography>
                </div>
              </div>
            </div>

            {/* Position */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500 flex items-center justify-center">
                <div className="text-center">
                  <Typography
                    variant="title3"
                    weight="semibold"
                  >
                    {position}
                  </Typography>
                  <Typography
                    variant="caption1"
                    weight="light"
                    className="text-gray-500"
                  >
                    Position
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CustomCard>

      {/* Leaderboard Section */}
      <CustomCard className="mb-6">
        <div className="p-4">
          <Typography
            variant="title3"
            weight="semibold"
            className="mb-2"
          >
            LeaderBoard
          </Typography>

          <Typography
            variant="body"
            weight="normal"
            className="text-gray-500 mb-4"
          >
            Points and Places each participant (Including you) claimed in this quest
          </Typography>

          {/* Top 3 Participants */}
          <div className="flex justify-between items-end mb-6 bg-[#C8C7CB33] rounded-[30px] p-4">
            {topThreeParticipants.map((participant, index) => {
              const isWinner = index === 1; // Middle position (index 1) is the winner

              return (
                <div
                  key={participant.id}
                  className="flex flex-col items-center isolate relative"
                >
                  {isWinner && <div className="-top-4 z-10 absolute -rotate-[35deg] -left-0.5 text-2xl">👑</div>}

                  <div
                    className={cn(
                      "relative rounded-full overflow-hidden border-2",
                      isWinner ? "w-16 h-16 border-blue-500" : "w-14 h-14 border-transparent"
                    )}
                  >
                    <Image
                      src={participant.avatar || "/placeholder.svg?height=60&width=60"}
                      alt={participant.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div
                    className={cn(
                      "mt-1 px-3 py-0.5 rounded-full text-center",
                      isWinner ? "bg-blue-500 text-white" : "text-black"
                    )}
                  >
                    <Typography
                      variant="caption1"
                      weight="medium"
                    >
                      {participant.points} Points
                    </Typography>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remaining Participants */}
          <div className="space-y-3">
            {remainingParticipants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Typography
                    variant="footnote"
                    weight="medium"
                    className="text-gray-500 text-nowrap"
                  >
                    {participant.position}
                    <sup>th</sup>
                  </Typography>

                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    {participant.avatar.includes("AK") || participant.avatar.includes("PD") ? (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-full">
                        <Typography
                          variant="body"
                          weight="medium"
                        >
                          {participant.avatar}
                        </Typography>
                      </div>
                    ) : (
                      <Image
                        src={participant.avatar || "/placeholder.svg?height=32&width=32"}
                        alt={participant.name}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    )}
                  </div>

                  <Typography
                    variant="body"
                    weight="medium"
                  >
                    {participant.name}
                  </Typography>
                </div>

                <div className="flex flex-col items-center">
                  <Typography
                    variant="caption1"
                    weight="light"
                    className="text-gray-500"
                  >
                    Points
                  </Typography>
                  <Typography
                    variant="headline"
                    weight="semibold"
                  >
                    {participant.points}
                  </Typography>
                </div>
              </div>
            ))}

            {/* Reward Zone Indicator */}
            <div className="flex justify-center items-center py-2">
              <div className="flex items-center gap-2 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
                <Typography
                  variant="footnote"
                  weight="normal"
                >
                  Reward Zone
                </Typography>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </CustomCard>
    </div>
  );
};

export default function LeaderboardPage() {
  // Sample data for the leaderboard
  const participants = [
    { id: 1, name: "User 1", points: 100, avatar: "/placeholder.svg?height=60&width=60", position: 1 },
    { id: 2, name: "User 2", points: 89, avatar: "/placeholder.svg?height=60&width=60", position: 2 },
    { id: 3, name: "User 3", points: 54, avatar: "/placeholder.svg?height=60&width=60", position: 3 },
    { id: 4, name: "Jack Sem", points: 45, avatar: "/placeholder.svg?height=32&width=32", position: 4 },
    { id: 5, name: "Sara_234", points: 23, avatar: "/placeholder.svg?height=32&width=32", position: 5 },
    { id: 6, name: "Ashley Kane", points: 8, avatar: "AK", position: 6 },
    { id: 7, name: "NharaMi", points: 7, avatar: "/placeholder.svg?height=32&width=32", position: 7 },
    { id: 8, name: "Anitakia", points: 3, avatar: "/placeholder.svg?height=32&width=32", position: 8 },
    { id: 9, name: "Pia-Deli", points: 1, avatar: "PD", position: 9 },
    { id: 10, name: "Mike0chaw", points: 1, avatar: "/placeholder.svg?height=32&width=32", position: 10 },
    { id: 11, name: "Mike0chaw", points: 1, avatar: "/placeholder.svg?height=32&width=32", position: 11 },
    { id: 12, name: "Mike0chaw", points: 1, avatar: "/placeholder.svg?height=32&width=32", position: 12 },
  ];

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <Leaderboard
        bestScore={121}
        timesPlayed={2}
        position="1: 2"
        participants={participants}
      />
    </div>
  );
}
