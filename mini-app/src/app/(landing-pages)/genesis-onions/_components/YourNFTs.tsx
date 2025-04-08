import Typography from "@/components/Typography";
import { InfoBox } from "./InfoBox";
import { useMemo } from "react";
import Image from 'next/image';
import { useUserCampaign } from "../hooks/useUserCampaign";
import { cn } from "@/utils";
import { Info } from "lucide-react";

export const YourNFTs = () => {
    const { userCollection, isLoadingUserCollection, isErrorUserCollection } = useUserCampaign()

    const nftsCount = useMemo(() => {
        return userCollection?.reduce((acc, item) => acc + item.count, 0) ?? 0
    }, [userCollection])

    if (isLoadingUserCollection) return null
    if (isErrorUserCollection) return <div>Error loading your NFTs! Please try again.</div>

    return (
        <div className="flex flex-col gap-3">
            <Typography variant="subheadline2">Your NFTs</Typography>
            <div className="flex gap-2">
                {userCollection?.map(item => (<InfoBox className="p-1 flex overflow-hidden flex-1 justify-between items-center border" key={item.name}>
                    {item.image && <Image src={item.image} className="rounded-md" width={32} height={32} alt={`${item.name} NFT`} />}

                    <div className="flex flex-col items-center">
                        <div className="flex gap-1">
                            <span>x</span>
                            <Typography variant="headline">{item.count}</Typography>
                        </div>
                        <Typography
                            variant="caption2"
                            className={cn({
                                'text-silverBlue-1': true, // default
                                'text-gold': item.name?.toLowerCase().includes('gold'),
                                'text-silver': item.name?.toLowerCase().includes('silver'),
                                'text-bronze': item.name?.toLowerCase().includes('bronze'),
                            })}
                        >
                            {item.name}
                        </Typography>

                    </div>
                </InfoBox>))}
            </div>

            {nftsCount > 0 && <div className="flex gap-1 items-center px-1.5">
                <Info size={16} />
                <Typography variant="caption1" weight="normal">NFTs will be minted and sent to your wallet on April 22nd.</Typography>
            </div>}

            <InfoBox className="bg-white/10 border-0">
                <Typography variant="footnote" weight="normal">

                    {
                        nftsCount === 0 ?
                            'You have 0 Genesis Onions. Spin or invite friends to claim Gold, Silver, and Bronze ONIONs now!'
                            : <div>
                                <span className="font-bold">Spin</span> or <span className="font-bold">invite friends</span> to claim more <span className="font-bold">Gold</span>, <span className="font-bold">Silver</span>, and <span className="font-bold">Bronze ONIONs</span> now!
                            </div>
                    }
                </Typography>
            </InfoBox>
        </div>
    );
};
