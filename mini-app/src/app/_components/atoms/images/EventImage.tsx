import React from "react";
import Image from "next/image";
import { isValidImageUrl } from "@/lib/isValidImageUrl";

const EventImage: React.FC<{ url: string }> = ({ url }) => {
  const defaultImage = "/template-images/default.webp";
  return (
    <div className="relative rounded-[14px] overflow-hidden w-full">
      <Image
        src={isValidImageUrl(url) ? url : defaultImage}
        alt="Event Image. If you see this, something went wrong. Ensure that the image URL is correct and you have not copied the article link instead."
        width={0}
        height={0}
        sizes="100vw"
        className="w-full h-auto"
        style={{ width: "100%", height: "auto" }}
        onError={(e) => (e.currentTarget.src = defaultImage)}
        unoptimized={true}
      />
    </div>
  );
};

export default EventImage;
