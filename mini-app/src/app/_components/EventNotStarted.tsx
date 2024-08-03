"use client";
import Image from "next/image";
import { ReactNode, useEffect, useRef, useState } from "react";

type EventNotStartedProps = {
  start_date: number;
  end_date: number;
  title: ReactNode;
};

const gifUrl =
  "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/People/Eyes.webp";

const EventNotStarted = ({
  end_date,
  start_date,
  title,
}: EventNotStartedProps) => {
  const [gifSrc, setGifSrc] = useState(gifUrl);
  const [endDate] = useState(new Date(end_date).toLocaleString());
  const [startDate] = useState(new Date(start_date).toLocaleString());
  const gifRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    function setGifState() {
      setGifSrc(gifUrl);
      setTimeout(() => {
        setGifSrc("/eyes_last.png");
      }, 4000);
    }
    setTimeout(() => {
      setGifSrc("/eyes_last.png");
    }, 4000);

    gifRef.current?.addEventListener("mouseover", setGifState);
    gifRef.current?.addEventListener("touchend", setGifState);
  }, []);

  return (
    <div className="w-full flex items-center flex-col text-center py-6 space-y-4">
      <Image
        ref={gifRef}
        alt="eyes"
        src={gifSrc}
        width={100}
        height={100}
      />

      <h1 className="font-semibold text-2xl">{title}</h1>
      <p className="text-xs text-center text-muted-foreground">
        <p>
          Event starts at <time className="font-medium">{startDate}</time>
        </p>
        and
        <p>
          Ends at <time className="font-medium">{endDate}</time>
        </p>
      </p>
    </div>
  );
};

export default EventNotStarted;
