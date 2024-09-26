import React from "react";
import Image from "next/image";

const EventImage: React.FC<{ url: string }> = ({ url }) => {
  return (
    <div className="relative rounded-[14px] overflow-hidden w-full min-h-[200px]">
      <Image
        src={url}
        alt="Event Image. If you see this, something went wrong. Ensure that the image URL is correct and you have not copied the article link instead."
        layout="fill"
        objectFit="cover"
        unoptimized
      />
    </div>
  );
};

export default EventImage;
