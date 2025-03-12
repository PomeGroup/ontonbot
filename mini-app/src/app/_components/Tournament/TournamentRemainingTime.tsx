import Typography from "@/components/Typography";
import { cn } from "@/utils";
import { TimerIcon } from "lucide-react";
import React from "react";

export const TournamentTimeRemaining: React.FC<{ endDate: string }> = (props) => {
  const now = new Date();
  const end = new Date(props.endDate);
  const diffTime = end.getTime() - now.getTime();
  const oneHour = 1000 * 60 * 60;
  const isLessThanOneHour = diffTime < oneHour;
  const diffValue = isLessThanOneHour ? Math.ceil(diffTime / (1000 * 60)) : Math.ceil(diffTime / oneHour);

  return (
    <div
      className={cn(
        "absolute top-2.5 left-2.5 rounded-md bg-black bg-opacity-50 backdrop-blur-[20px] flex items-center gap-1 px-2 py-1",
        diffTime <= 0
          ? "text-brand-red"
          : diffTime < oneHour
            ? "text-brand-light-destructive"
            : diffTime < oneHour * 3
              ? "IOS-light-wallet-accent_orange"
              : "text-white"
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
