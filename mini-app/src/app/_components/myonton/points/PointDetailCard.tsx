import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { RewardTonSocietyStatusType } from "@/db/schema";
import useWebApp from "@/hooks/useWebApp";
import { formatDateRange, formatTime } from "@/lib/DateAndTime";
import { isTelegramUrl } from "@tonconnect/ui-react";
import { AwardIcon, CheckIcon, RefreshCcwIcon, XIcon } from "lucide-react";
import Image from "next/image";

const PointDetailCard = (props: {
  imageUrl: string | null;
  eventTitle: string;
  eventStartDate: number;
  eventEndDate: number;
  tonSocietyStatus: RewardTonSocietyStatusType | null;
  userClaimedPoints: number;
  rewardLink: string | null;
}) => {
  const webapp = useWebApp();

  return (
    <CustomCard className="p-2">
      <div className="flex items-center gap-2">
        {/* Event Image */}
        <Image
          src={props.imageUrl || "/template-images/default.webp"}
          alt={props.eventTitle}
          width={65}
          height={65}
          className="overflow-hidden object-cover rounded-md self-center aspect-square"
        />

        {/* Event Details */}
        <div className="flex flex-col flex-1 overflow-hidden items-start justify-start gap-[3.5px]">
          {/* Event Title */}
          <Typography
            variant="callout"
            className="line-clamp-1 leading-[17px]"
          >
            {props.eventTitle}
          </Typography>

          {/* Date and Time */}
          <div
            title={new Date(props.eventStartDate * 1000).toString() + " - " + new Date(props.eventEndDate * 1000).toString()}
            className="flex flex-col items-start text-gray-500"
          >
            <Typography
              variant="subheadline2"
              className="truncate"
            >
              {formatDateRange(props.eventStartDate, props.eventEndDate)} |{" "}
              {formatTime(new Date(props.eventStartDate * 1000))} - {formatTime(new Date(props.eventEndDate * 1000))}
            </Typography>
          </div>

          {/* Reward Status */}
          <>
            {props.tonSocietyStatus === "NOT_CLAIMED" && (
              <Typography
                variant="subheadline2"
                className="truncate text-brand-light-destructive flex items-center justify-center gap-1"
              >
                <XIcon className="w-4 h-4 flex-shrink-0" />
                <span>Unclaimed</span>
              </Typography>
            )}

            {(props.tonSocietyStatus === "CLAIMED" || props.tonSocietyStatus === "RECEIVED") && (
              <Typography
                variant="subheadline2"
                className="truncate text-brand-green flex items-center justify-center gap-1"
              >
                <CheckIcon className="w-4 h-4 flex-shrink-0" />
                <span>Claimed</span>
              </Typography>
            )}

            {props.tonSocietyStatus === "NOT_ELIGIBLE" && (
              <Typography
                variant="subheadline2"
                className="truncate text-brand-muted flex items-center justify-center gap-1"
              >
                <XIcon className="w-4 h-4 flex-shrink-0 opacity-50" />
                <span>Not eligible</span>
              </Typography>
            )}
          </>
        </div>

        {/* Claim Button */}
        <>
          {props.tonSocietyStatus === "NOT_CLAIMED" && (
            <Button
              variant="outline"
              className="flex items-center gap-1 rounded-md flex-1 max-w-[96px]"
              disabled={!props.rewardLink}
              onClick={() => {
                if (props.rewardLink) {
                  if (isTelegramUrl(props.rewardLink)) {
                    webapp?.openTelegramLink(props.rewardLink);
                  } else {
                    webapp?.openLink(props.rewardLink);
                  }
                }
              }}
            >
              <AwardIcon className="w-4 h-4" />
              <span>Claim</span>
            </Button>
          )}

          {(props.tonSocietyStatus === "CLAIMED" || props.tonSocietyStatus === "RECEIVED") &&
            props.userClaimedPoints !== 0 && (
              <div className="flex flex-col gap-2 items-center">
                <Typography variant="callout">{props.userClaimedPoints}</Typography>
                <Typography variant="caption2">Points</Typography>
              </div>
            )}

          {(props.tonSocietyStatus === "CLAIMED" || props.tonSocietyStatus === "RECEIVED") &&
            props.userClaimedPoints === 0 && (
              <Button
                variant="outline"
                className="flex items-center gap-1 rounded-md flex-1 max-w-[96px]"
                // onClick={() => {
                //   if (props.rewardLink) {
                //     if (isTelegramUrl(props.rewardLink)) {
                //       webapp?.openTelegramLink(props.rewardLink);
                //     } else {
                //       webapp?.openLink(props.rewardLink);
                //     }
                //   }
                // }}
              >
                <RefreshCcwIcon className="w-4 h-4 flex-shrink-0" />
                <span>Refresh</span>
              </Button>
            )}
        </>
      </div>
    </CustomCard>
  );
};

export default PointDetailCard;
