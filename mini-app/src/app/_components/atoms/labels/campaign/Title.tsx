import { cn } from "@/utils";
import React from "react";

const CampaignTitle: React.FC<{ title: string; className?: string }> = ({
  title,
  className,
}) => {
  return <div className={cn("text-xl font-semibold", className)}>{title}</div>;
};

export default CampaignTitle;
