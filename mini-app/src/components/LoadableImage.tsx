import { useState } from "react"
import Image from "next/image";
import { isValidImageUrl } from "@/lib/isValidImageUrl";

interface Props {
  src: string
  alt?: string | null
  width?: number
  height?: number
  size?: number
  className?: string
}

const defaultImage = "/template-images/default.webp";

export default function LoadableImage({ src, alt, width, height, size, className }: Props) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={`relative rounded-lg max-w-[${width || size}px] min-w-[${width || size}px] flex-shrink-0 ${className}`}>
      {!loaded && <div className="absolute w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />}
      <Image
        src={isValidImageUrl(src) ? src : defaultImage}
        alt={alt || ''}
        width={width || size}
        height={height || size}
        className={`w-[${width || size}] ${size && 'aspect-square'} rounded-[6px] transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        onError={(e) => (e.currentTarget.src = defaultImage)}
        onLoad={() => setLoaded(true)}
        loading="lazy"
      />
    </div>
  )
}