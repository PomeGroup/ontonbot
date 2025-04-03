import { useState, useEffect, useCallback } from "react";
import { Orbitron } from "next/font/google";
import Typography from "@/components/Typography";

const orbitron = Orbitron({ subsets: ["latin"], weight: "500" });

interface CountdownProps {
    targetDate: string; // Format: YYYY-MM-DDTHH:mm:ss (ISO format)
};

export const CountdownTimer = ({ targetDate }: CountdownProps) => {
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
        <div className="flex flex-col gap-y-1.5">
            <Typography variant="caption2" className="text-center">Limited Time Offer! Ends in</Typography>
            <div className={`${orbitron.className} flex items-center justify-center gap-2`}>
                <div className="flex flex-col items-center">
                    <span className="text-4xl">{timeLeft.days}</span>
                    <small className="text-sm uppercase text-gray-400">Day</small>
                </div>
                <span className="text-3xl place-self-start">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-4xl">{timeLeft.hours.toString().padStart(2, "0")}</span>
                    <small className="text-sm uppercase text-gray-400">Hour</small>
                </div>
                <span className="text-3xl place-self-start">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-4xl">{timeLeft.minutes.toString().padStart(2, "0")}</span>
                    <small className="text-sm uppercase text-gray-400">Minute</small>
                </div>
                <span className="text-3xl place-self-start">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-4xl">{timeLeft.seconds.toString().padStart(2, "0")}</span>
                    <small className="text-sm uppercase text-gray-400">Second</small>
                </div>
            </div>
        </div>
    );
};

