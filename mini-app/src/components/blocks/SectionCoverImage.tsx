import Image from "next/image";
import React, { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type SectionCoverImageProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  children?: ReactNode;
};

const SectionCoverImage: React.FC<SectionCoverImageProps> = ({
  src,
  alt,
  className,
  imgClassName,
  children,
}) => {
  if (src)
    return (
      <div
        className={twMerge(
          "border-wallet-separator-color relative min-h-[328px] overflow-hidden rounded-lg border-[0.33px]",
          className,
        )}
      >
        {src ? <Image src={src} alt={alt} className={imgClassName} /> : children}
      </div>
    );
  return children;
};

export default SectionCoverImage;
