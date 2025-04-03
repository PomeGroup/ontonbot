import Typography from "@/components/Typography"
import Image from "next/image"
import prizeImage from '../_assets/images/nfts/nft-silver.png'
import Confetti from 'react-confetti';
import { cn } from "@/utils";

interface Props {
    isOpen: boolean
}

export const Prize = ({ isOpen }: Props) => {
    return (
        <div className={cn(
            "w-screen h-screen fixed top-0 left-0 grid place-items-center bg-navy/85 z-50 text-white transition-opacity duration-500",
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
            <Confetti
                width={window.innerWidth - 20}
                numberOfPieces={100}
                className="place-self-center z-[1000] absolute top-0"
            />

            <div className={cn(
                "flex flex-col gap-3 transition-all duration-500 items-center transform",
                isOpen ? "scale-100 opacity-100" : "scale-50 opacity-0"
            )}>
                <Image
                    src={prizeImage}
                    width={300}
                    height={300}
                    alt="Prize!"
                    className="rounded-2lg"
                />

                <Typography variant="title3" weight="bold">
                    Silver @ONION
                </Typography>
            </div>
        </div>
    );
};
