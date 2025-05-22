"use client";

import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import Typography from "@/components/Typography";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@mui/material";
import { Calendar } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { IoInformationCircle } from "react-icons/io5";

const MyPointsDetailsPage = () => {
  const { type } = useParams();

  return (
    <div className="p-4 flex flex-col gap-4">
      <Typography variant="title3">Participated {decodeURI(type as string)}</Typography>
      <div>
        <Alert variant={"info"}>
          <IoInformationCircle
            size={24}
            className="text-info-dark flex-shrink-0"
          />
          <p>
            Your points refresh every 3 hour for 3 weeks. If your event has just wrapped up, hang tight—you'll see your
            points credited soon!
          </p>
        </Alert>
      </div>
      <CustomCard className="p-2">
        <div className="grid grid-cols-[100px_1fr] gap-4">
          {/* Event Image */}
          <Image
            src={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJxo2NFiYcR35GzCk5T3nxA7rGlSsXvIfJwg&s"}
            alt={"title"}
            width={100}
            height={100}
            className="overflow-hidden object-cover !w-[100px] h-[100px] rounded-md self-center aspect-square"
          />

          {/* Event Details */}
          <div className="flex flex-col overflow-hidden">
            {/* Event Title */}
            <div className="flex items-center justify-between gap-4">
              <Typography
                variant="callout"
                className="mb-[5.5px] h-8 line-clamp-2 leading-[17px]"
              >
                {"title"}
              </Typography>
              {/* {afterTitle} */}
            </div>

            {/* Date and Time */}
            <div
              title={"formattedDate"}
              className="flex items-center text-gray-500 mb-1"
            >
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <Typography
                variant="subheadline2"
                className="truncate"
              >
                {"formattedDate"}
              </Typography>
            </div>
          </div>
        </div>
      </CustomCard>
      <div className="flex flex-col gap-4">
        <Skeleton
          variant="rounded"
          height={100}
        />
        <Skeleton
          variant="rounded"
          height={100}
        />
        <Skeleton
          variant="rounded"
          height={100}
        />
      </div>
    </div>
  );
};

export default MyPointsDetailsPage;
