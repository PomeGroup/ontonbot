import { Button } from "@/components/ui/button";
import { useConfig } from "@/context/ConfigContext";
import { getTimeLeft } from "@/lib/time.utils";
import { formatPadNumber } from "@/lib/utils";
import { cn } from "@/utils";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GENESIS_ONIONS_PAGE_ROUTE } from "../../GenesisOnions.constants";
import "./Banner.css";
import SVGCubes from "./SVGCubes";

import Typography from "@/components/Typography";
import "./../../_assets/genesis-onions.css";

interface Props {
  className?: string;
}

export const Banner = ({ className }: Props) => {
  return null
  const router = useRouter();
  const config = useConfig();
  const configEndDate = config["campeign_merge_date"];
  const endDate = useMemo(() => new Date(Number(configEndDate)), [configEndDate]);

  const handleOnClick = () => {
    router.push(GENESIS_ONIONS_PAGE_ROUTE);
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate, configEndDate]);

  if (endDate.getTime() <= 0) return null;
  if (!configEndDate || isNaN(timeLeft.days)) return null;

  return (
    <>
      <div
        className={cn("relative w-full max-w-md p-4 rounded-2xl overflow-hidden shadow-lg", className)}
        onClick={handleOnClick}
      >
        {/* Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
          radial-gradient(77.65% 366.78% at 77.65% 50%, rgba(21, 44, 82, 0.9) 0%, rgba(13, 31, 56, 0.9) 60.73%, rgba(5, 20, 38, 0.9) 94.1%),
          linear-gradient(83.82deg, rgba(0, 0, 0, 0) 1.52%, rgba(0, 0, 0, 0.2) 37.49%)`,
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10 flex sm:flex-row justify-between items-center gap-4">
          {/* Timer + Text */}
          <div className="text-white justify-start items-start text-center sm:text-left flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-start">
              <div className="text-2xl tracking-wider sansation-normal ">
                {formatPadNumber(timeLeft.days)}:{formatPadNumber(timeLeft.hours)}:{formatPadNumber(timeLeft.minutes)}:
                {formatPadNumber(timeLeft.seconds)}
              </div>
              <Typography variant="footnote">Merge to Platinum ONION</Typography>
            </div>
            <Button variant="outline-onion">Start Now</Button>
          </div>

          <SVGCubes />
        </div>
      </div>
    </>
  );
};
