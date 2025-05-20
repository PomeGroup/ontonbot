"use client";

import CustomCard from "@/app/_components/atoms/cards/CustomCard";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { useConfigDate } from "@/hooks/useConfigDate";
import useWebApp from "@/hooks/useWebApp";
import { isTelegramUrl } from "@tonconnect/ui-react";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type DateCardProps = {
  iconSrc: string;
  title: string;
  endDateKey?: string;
  date?: string;
  description?: string;
  link?: string;
  linkText?: string;
  showCountdown?: boolean;
  status?: React.ReactNode;
};

const DateCard = ({
  iconSrc,
  title,
  endDateKey,
  date,
  description,
  link,
  linkText = "More",
  showCountdown = false,
  status,
}: DateCardProps) => {
  const webapp = useWebApp();
  const router = useRouter();

  const timeLeft = endDateKey ? useConfigDate(endDateKey) : null;
  const formattedDate =
    timeLeft?.endDate?.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) || date;

  const openLink = () => {
    if (!link) return;

    if (link?.startsWith("/")) {
      router.push(link);
    } else {
      if (isTelegramUrl(link)) {
        webapp?.openTelegramLink(link);
      } else {
        webapp?.openLink(link, {
          try_instant_view: true,
        });
      }
    }
  };

  useEffect(() => {
    if (link?.startsWith("/")) {
      router.prefetch(link);
    }
  }, [webapp, link]);

  return (
    <CustomCard defaultPadding>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <div className="flex gap-2 items-start">
              <div className="h-10 w-10">
                <Image
                  src={iconSrc}
                  width={40}
                  height={40}
                  alt={title}
                />
              </div>
              <div className="flex flex-col">
                <Typography variant="title3">{title}</Typography>
                {formattedDate && (
                  <Typography
                    variant="footnote"
                    weight="medium"
                  >
                    {formattedDate}
                  </Typography>
                )}
              </div>
            </div>
            {link && (
              <Button
                variant="link"
                onClick={openLink}
                className="flex items-center gap-1 align-middle text-primary p-0"
              >
                <Typography weight="medium">{linkText}</Typography>
                <ArrowRightIcon />
              </Button>
            )}
          </div>
          {description && (
            <Typography
              variant="footnote"
              weight="medium"
            >
              {description}
            </Typography>
          )}
        </div>
        {showCountdown && timeLeft && (
          <div className="flex items-center justify-center gap-1 bg-brand-bg">
            <span className="text-lg">⏳</span>
            <Typography
              variant="headline"
              weight="semibold"
            >
              {timeLeft.days || timeLeft.hours || timeLeft.minutes || timeLeft.seconds}
            </Typography>
            <Typography
              variant="caption2"
              weight="medium"
            >
              {timeLeft.days ? "Days" : timeLeft.hours ? "Hours" : timeLeft.minutes ? "Minutes" : "Seconds"} Left
            </Typography>
          </div>
        )}
        {status && <div className="flex items-center justify-center gap-1 bg-[#EFEFF4] py-1">{status}</div>}
      </div>
    </CustomCard>
  );
};

export default DateCard;
