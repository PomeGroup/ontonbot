import Typography from "@/components/Typography";
import { cn } from "@/utils";
import { TimerIcon } from "lucide-react";
import React from "react";

interface BadgeProps {
  diffTime: number;
  diffValue: number;
  isLessThanOneHour: boolean;
  space?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({ diffTime, diffValue, isLessThanOneHour, space }) => {
  const oneHour = 1000 * 60 * 60;
  return (
    <div
      className={cn(
        "absolute rounded-md bg-black bg-opacity-50 backdrop-blur-[20px] flex items-center gap-1 px-2 py-1",
        diffTime <= 0
          ? "text-brand-red"
          : diffTime < oneHour
            ? "text-brand-light-destructive"
            : diffTime < oneHour * 3
              ? "text-IOS-light-wallet-accent_orange"
              : "text-white",
        {
          "top-2.5 left-2.5": space === "md" || !space,
          "top-1.5 left-1": space === "sm",
        }
      )}
    >
      {diffTime <= 0 ? (
        <Typography
          variant="subheadline1"
          weight="bold"
        >
          ended
        </Typography>
      ) : (
        <>
          <TimerIcon size={12} />
          <Typography
            variant="subheadline1"
            weight="bold"
          >
            {diffValue}
          </Typography>
          <Typography variant="footnote">{isLessThanOneHour ? "min" : "hour"}</Typography>
        </>
      )}
    </div>
  );
};
