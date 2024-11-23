"use client";

import { FaLocationDot } from "react-icons/fa6";
import Labels from "@/app/_components/atoms/labels/index";
import { cn } from "@/lib/utils";

type Props = {
  location: string;
  className?: string; // Allow passing a custom class for the Link container
};

const LocationPin = ({ location, className }: Props) => {
  return (
    <div className={cn("flex items-center", className)}>
      <FaLocationDot className="mr-2" />
      <Labels.Label className="truncate text-cn-primary font-sm max-w-xs">{location}</Labels.Label>
    </div>
  );
};

export default LocationPin;
