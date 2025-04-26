import CustomButton from "@/app/_components/Button/CustomButton";
import Typography from "@/components/Typography";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { UnplugIcon } from "lucide-react";
import Image from "next/image";
import GenesisOnionHead from "./../_assets/images/onion-genesis-merge-haed.svg";

export const Header = () => (
  <div className="flex justify-between px-4 py-3 items-center gap-2 bg-navy-dark">
    <div className="text-xs">
      <Image
        src={GenesisOnionHead}
        alt="Secure Your $ONION Airdrop Now"
      />
      <div className="text-white sansation-bold text-sm">
        14 <span className="text-[9px] sansation-normal">D </span>: 13{" "}
        <span className="text-[9px] sansation-normal">H </span>: 12 <span className="text-[9px] sansation-normal">M </span>:
        27 <span className="text-[9px] sansation-normal">S</span>
      </div>
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <CustomButton
          variant="primary-onion"
          btnClassName="!w-fit"
          fontWeight="semibold"
        >
          Connect Wallet
        </CustomButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="!bg-navy rounded-2lg p-3 flex items-center gap-2 border border-solid border-brand-divider-dark text-onion-extraLight">
        <UnplugIcon />
        <Typography
          variant="body"
          weight="medium"
        >
          Disconnect
        </Typography>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

