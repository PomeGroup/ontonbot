import React from "react";
import Image from "next/image";
import {isValidImageUrl} from "@/lib/isValidImageUrl";

const EventImage: React.FC<{ url: string }> = ({ url }) => {
    const defaultImage = "/template-images/default.webp";
  return (
    <div className="relative rounded-[14px] overflow-hidden w-full min-h-[200px]">
      <Image

        src={isValidImageUrl(url) ? url : defaultImage}
        alt="Event Image. If you see this, something went wrong. Ensure that the image URL is correct and you have not copied the article link instead."
        layout="fill"
        objectFit="cover"
        onError={(e) => (e.currentTarget.src = defaultImage)}
        unoptimized={true}
      />
    </div>
  );
};

export default EventImage;
