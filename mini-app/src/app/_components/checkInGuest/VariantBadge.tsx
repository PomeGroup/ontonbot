import { FC } from "react";
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";

interface VariantBadgeProps {
  status: "USED" | "UNUSED" | string; // Expecting "USED", "UNUSED", or any other string for the default case
}

const VariantBadge: FC<VariantBadgeProps> = ({ status = "" }) => {
  const getBadgeStyles = () => {
    switch (status) {
      case "USED":
        return "text-[#3E88F7] bg-[#ebf5ff] border-0 rounded-sm text-xs ";
      case "UNUSED":
        return "text-[#FF9F0A] bg-[#fff7eb] border-0 rounded-sm text-xs ";
      case "VIP":
        return "text-[#2D2D2D] bg-[#ccccee] border-0 rounded-sm text-xs";
      default:
        return "text-[#2D2D2D] bg-[#cccccc] border-0 rounded-sm text-xs";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "USED":
        return "checked-In";
      case "UNUSED":
        return "waiting";
      case "":
        return "--";
      default:
        return status;
    }
  };

  return (
    <Badge
      variant="outline"
      className={clsx(getBadgeStyles())}
    >
      {getStatusText()}
    </Badge>
  );
};

export default VariantBadge;
