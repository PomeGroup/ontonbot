import Typography from "@/components/Typography";
import { getDiffValueAndSuffix } from "@/lib/time.utils";
import { cn } from "@/utils";
import { TimerIcon } from "lucide-react";
import React from "react";
import { FloatingBadge } from "../Badge/FloatingBadge";

export const TournamentTimeRemaining: React.FC<{
  endDate: string;
  closeOnly?: boolean;
  space?: "sm" | "md";
}> = (props) => {
  const { diffValue, suffix } = getDiffValueAndSuffix(new Date(), new Date(props.endDate));

  return (
    <FloatingBadge
      position={`tl-${props.space || "md"}`}
      className={cn(
        diffValue <= 0
          ? "text-brand-red"
          : suffix === "min"
            ? "text-brand-light-destructive"
            : diffValue < 3
              ? "text-IOS-light-wallet-accent_orange"
              : "text-white"
      )}
    >
      {diffValue <= 0 ? (
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
          <Typography variant="footnote">{suffix}</Typography>
        </>
      )}
    </FloatingBadge>
  );
};
