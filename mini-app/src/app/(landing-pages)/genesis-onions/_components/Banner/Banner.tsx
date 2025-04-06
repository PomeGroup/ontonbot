import "./Banner.css";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import OnionImage from "./title-onton.svg";
import Typography from "@/components/Typography";
import Link from "next/link";
import { GENESIS_ONIONS_PAGE_ROUTE } from "../../GenesisOnions.constants";
import { useConfig } from "@/context/ConfigContext";
import { cn } from "@/utils";
import { useUserCampaign } from "../../hooks/useUserCampaign";
import { AccessRestrictedModal } from "../AccessRestrictedModal";
import { useRouter } from "next/navigation";

interface Props {
  className?: string;
}

export const Banner = ({ className }: Props) => {
  const router = useRouter();
  const [showAccessRestrictedModal, setShowAccessRestrictedModal] = useState(false);
  const { isEligible, isLoadingEligibility, isErrorEligibility } = useUserCampaign();
  const config = useConfig();
  const targetDate = (Number(config?.ONION1_EDN_DATE) || 1745269200) * 1000;

  const remainingDays = useMemo(() => {
    const difference = new Date(targetDate).getTime() - new Date().getTime();
    if (difference <= 0) return 0;

    return Math.floor(difference / (1000 * 60 * 60 * 24));
  }, [targetDate]);

  const items = useMemo(
    () => [
      {
        title: "Players",
        value: "+10,000",
      },
      {
        title: "NFTs",
        value: "+25,000",
      },
      {
        title: "Remaining",
        value: `${remainingDays} Days`,
      },
    ],
    [remainingDays]
  );

  const handleOnClick = () => {
    if (isEligible) router.push(GENESIS_ONIONS_PAGE_ROUTE);
    else setShowAccessRestrictedModal(true);
  };

  if (remainingDays <= 0) return null;

  if (isLoadingEligibility || isErrorEligibility) return null;

  return (
    <>
      <AccessRestrictedModal
        open={showAccessRestrictedModal}
        onClose={() => setShowAccessRestrictedModal(false)}
      />
      <div
        className={cn("banner-bg flex flex-col justify-center gap-2 text-center text-white p-4 rounded-xl", className)}
        onClick={handleOnClick}
      >
        <Image
          src={OnionImage}
          width={179}
          height={39}
          alt="Secure Your $ONION Airdrop Now"
          className="mb-3"
        />

        <div className="flex gap-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center col-span-1"
            >
              <Typography
                variant="subheadline1"
                weight="medium"
              >
                {item.value}
              </Typography>
              <Typography
                variant="caption2"
                weight="light"
                className="text-nowrap"
              >
                {item.title}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
