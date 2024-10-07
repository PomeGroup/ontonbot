import { cn } from "@/utils";
import React from "react";
import DOMPurify from "dompurify";

const CampaignDescription: React.FC<{
  description: string;
  className?: string;
}> = ({ description, className }) => {
  return (
    <div
      className={cn(className, "whitespace-pre-line")}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(description),
      }}
    />
  );
};

export default CampaignDescription;
