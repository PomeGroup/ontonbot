import { useState, useEffect, useCallback } from "react";
import { Orbitron } from "next/font/google";
import Typography from "@/components/Typography";
import { cn } from "@/utils";
import { useConfig } from "@/context/ConfigContext";

const orbitron = Orbitron({ subsets: ["latin"], weight: "500" });

interface Props {
    className?: string;
    title?: string;
}

export const CountdownTimer = ({ className, title }: Props) => {
    const config = useConfig();
    const targetDate = (Number(config?.ONION1_EDN_DATE) || 1745269200) * 1000;

    const calculateTimeLeft = useCallback(() => {
        const difference = new Date(targetDate).getTime() - new Date().getTime();
        if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [calculateTimeLeft, targetDate]);

    return (
        <div className={cn("flex flex-col gap-y-1.5", className)}>
            {title && (
                <Typography
                    variant="caption2"
                    className="text-center"
                >
                    {title}
                </Typography>
            )}
            <div className={`flex items-center justify-center gap-2`}>
                <div className="flex flex-col items-center">
                    <span className={cn("text-4xl", orbitron.className)}>{timeLeft.days}</span>
                    <small className="text-[8px] uppercase text-gray-400">Day</small>
                </div>
                <span className="text-3xl place-self-start">:</span>
                <div className="flex flex-col items-center">
                    <span className={cn("text-4xl", orbitron.className)}>{timeLeft.hours.toString().padStart(2, "0")}</span>
                    <small className="text-[8px] uppercase text-gray-400">Hour</small>
                </div>
                <span className="text-3xl place-self-start">:</span>
                <div className="flex flex-col items-center">
                    <span className={cn("text-4xl", orbitron.className)}>{timeLeft.minutes.toString().padStart(2, "0")}</span>
                    <small className="text-[8px] uppercase text-gray-400">Minute</small>
                </div>
                <span className="text-3xl place-self-start">:</span>
                <div className="flex flex-col items-center">
                    <span className={cn("text-4xl", orbitron.className)}>{timeLeft.seconds.toString().padStart(2, "0")}</span>
                    <small className="text-[8px] uppercase text-gray-400">Second</small>
                </div>
            </div>
        </div>
    );
};
