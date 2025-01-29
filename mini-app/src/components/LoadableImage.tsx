import { DetailedHTMLProps, ImgHTMLAttributes, SyntheticEvent, useCallback, useState } from "react"
import Image from "next/image";
import { cn } from "@/utils";

type Props = (
  Omit<
    DetailedHTMLProps<
      ImgHTMLAttributes<HTMLImageElement>,
      HTMLImageElement
    >,
    "src" | "alt" | "width" | "height" | "loading" | "ref" | "srcSet"
  >) & {
    src: string
    alt?: string | null
    width?: number
    height?: number
    className?: string
    wrapperClassName?: string
  }

const defaultImage = "/template-images/default.webp";

export default function LoadableImage({
  src,
  alt,
  width,
  height,
  className,
  wrapperClassName,
  ...props
}: Props) {
  const [loaded, setLoaded] = useState(false)

  const onError = useCallback((e: SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = defaultImage
  }, [])
  const onLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <div className={cn(
      `relative rounded-lg flex-shrink-0`,
      wrapperClassName,
      (width) && `min-w-[${width}px])`)}>
      {!loaded && <div className={cn(
        "absolute w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg",
        className
      )} />}
      <Image
        src={src || defaultImage}
        alt={alt || ''}
        width={width}
        height={height}
        className={cn(`w-[${width}] rounded-[6px] transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`, className)}
        onError={onError}
        onLoad={onLoad}
        loading="lazy"
        {...props}
      />
    </div>
  )
}
