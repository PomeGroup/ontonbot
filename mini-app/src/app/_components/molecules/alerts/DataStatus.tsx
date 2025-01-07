import React, { ReactNode } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/utils";

interface DataStatusProps {
  status: "pending" | "success" | "danger" | "not_found" | "approved" | "rejected" | "sent";
  title?: ReactNode;
  description?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DATA_STATUS_ANIMATIONS: Record<DataStatusProps["status"], string> = {
  not_found: "https://storage.onton.live/ontonimage/looking_duck.lottie",
  approved: "https://storage.onton.live/ontonimage/approved.lottie",
  rejected: "https://storage.onton.live/ontonimage/rejected.lottie",
  success: "https://storage.onton.live/ontonimage/assertive_duck.lottie",
  danger: "https://storage.onton.live/ontonimage/crying_duck.lottie",
  pending: "https://storage.onton.live/ontonimage/pending_duck.lottie",
  sent: "https://storage.onton.live/ontonimage/send-flying-paper-dart.lottie",
};

// @ts-expect-error
const ANIMATION_SIZES: Record<DataStatusProps["size"], number> = {
  lg: 300,
  md: 120,
  sm: 60,
};

export default function DataStatus(props: DataStatusProps) {
  return (
    <div className={cn("flex flex-col items-center mx-auto", props.className)}>
      <DotLottieReact
        loop
        autoplay
        src={DATA_STATUS_ANIMATIONS[props.status]}
        // @ts-expect-error
        height={ANIMATION_SIZES[props.size] || ANIMATION_SIZES.sm}
        // @ts-expect-error
        width={ANIMATION_SIZES[props.size] || ANIMATION_SIZES.sm}
        className={"mx-auto mb-3 lg:w-[180px]"}
      />
      <h4 className="block text-[20px] font-semibold mb-1">{props.title}</h4>
      <p className="text-center text-cn-muted-foreground">{props.description}</p>
    </div>
  );
}
