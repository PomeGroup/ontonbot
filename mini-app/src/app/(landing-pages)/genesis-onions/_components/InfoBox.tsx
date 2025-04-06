import { cn } from "@/utils";
import { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
    className?: string
}

export const InfoBox = ({ children, className }: Props) => {
    return <div className={cn("bg-white/10 rounded-2lg p-3 backdrop-blur-md", className)}>{children}</div>
}