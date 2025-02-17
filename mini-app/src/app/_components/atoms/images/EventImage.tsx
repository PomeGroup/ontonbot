import React from "react";
import Image from "next/image";
import { isValidImageUrl } from "@/lib/isValidImageUrl";

const EventImage: React.FC<{
  url: string;
  width?: number;
  height?: number;
}> = ({ url, width = 0, height = 0 }) => {
  const defaultImage = "/template-images/default.webp";

  return (
    <div className="relative rounded-[14px] outline outline-1 outline-brand-muted/10 overflow-hidden w-full">
      <Image
        src={isValidImageUrl(url) ? url : defaultImage}
        alt="Event Image. If you see this, something went wrong. Ensure that the image URL is correct and you have not copied the article link instead."
        width={width}
        height={height}
        sizes="100vw"
        className="w-full h-auto"
        onError={(e) => (e.currentTarget.src = defaultImage)}
        unoptimized={true}
      />
    </div>
  );
};

export default EventImage;
