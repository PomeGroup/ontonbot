import { Card } from "konsta/react";
import { MouseEventHandler } from "react";
import { ArrowRight } from "lucide-react";
import Typography from "./Typography";
import Image from "next/image";
import { cn } from "@/utils";

interface Props {
  onClick: MouseEventHandler<HTMLElement>;
  iconSrc: string;
  title: string;
  subtitle: string;
  className?: string;
  footerTexts: {
    count?: number;
    items: string;
    variant?: "error";
  }[];
}

export default function ActionCard({ onClick, iconSrc, title, subtitle, className, footerTexts }: Props) {

  return (
    <Card
      onClick={onClick}
      className={cn(className, !!onClick && "cursor-pointer")}
    >
      <div className="flex gap-3 align-stretch">
        <div className="bg-[#efeff4] p-4 rounded-[10px]">
          <Image
            src={iconSrc}
            width={48}
            height={48}
            alt=""
          />
        </div>
        <div className="flex flex-col flex-1 gap-1">
          <Typography
            bold
            variant="title3"
          >
            {title}
          </Typography>
          <Typography variant="body">{subtitle}</Typography>
          <Typography
            variant="caption1"
            className="mt-auto flex gap-4"
          >
            {footerTexts.map((text, index) => (
              <div key={index}>
                {text.count && <b>{text.count} </b>}
                {text.items}
              </div>
            ))}
          </Typography>
        </div>
        <div className="self-center">
          <ArrowRight className="text-main-button-color" />
        </div>
      </div>
    </Card>
  );
}