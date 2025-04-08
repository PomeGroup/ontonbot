import Typography from "@/components/Typography";
import { useConfig } from "@/context/ConfigContext";
import { cn } from "@/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { GENESIS_ONIONS_PAGE_ROUTE } from "../../GenesisOnions.constants";
import { useUserCampaign } from "../../hooks/useUserCampaign";
import { AccessRestrictedModal } from "../AccessRestrictedModal";
import { CountdownTimer } from "../CountdownTimer";
import "./Banner.css";

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
        className={cn("banner-bg text-white p-4 rounded-xl flex flex-col gap-4 cursor-pointer", className)}
        onClick={handleOnClick}
      >
        <div className="w-2/3 flex justify-start">
          <CountdownTimer className="scale-75 origin-left" />
        </div>

        <Typography>Unlock the ONION Mystery</Typography>
      </div>
    </>
  );
};
