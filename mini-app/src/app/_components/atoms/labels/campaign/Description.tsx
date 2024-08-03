import { cn } from "@/utils";
import React from "react";

const CampaignDescription: React.FC<{
  description: string;
  className?: string;
}> = ({ description, className }) => {
  return (
    <div className={cn(className, "whitespace-pre-line")}>{description}</div>
  );
};

export default CampaignDescription;
