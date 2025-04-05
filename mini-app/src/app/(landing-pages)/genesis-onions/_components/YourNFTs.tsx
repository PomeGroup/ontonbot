import Typography from "@/components/Typography";
import { InfoBox } from "./InfoBox";
import { useMemo } from "react";
import Image from 'next/image';
import { useUserCampaign } from "../hooks/useUserCampaign";
import { cn } from "@/utils";

export const YourNFTs = () => {
    const { userCollection, isLoadingUserCollection, isErrorUserCollection } = useUserCampaign()

    const nftsCount = useMemo(() => {
        return userCollection?.reduce((acc, item) => acc + item.count, 0)
    }, [userCollection])

    if (isLoadingUserCollection) return null
    if (isErrorUserCollection) return <div>Error loading your NFTs! Please try again.</div>

    return (
        <div className="flex flex-col gap-3">
            <Typography variant="subheadline2">Your NFTs</Typography>
            <div className="flex gap-3">
                {userCollection?.map(item => (<InfoBox className="p-1 flex gap-2 flex-1 justify-between items-center bg-white/10" key={item.name}>
                    {item.image && <Image src={item.image} className="rounded-md" width={32} height={32} alt={`${item.name} NFT`} />}

                    <div className="flex flex-col items-center">
                        <div className="flex gap-1">
                            <span>x</span>
                            <Typography variant="headline">{item.count}</Typography>
                        </div>
                        <Typography
                            variant="caption2"
                            className={cn({
                                'text-gold': item.name?.toLowerCase().includes('gold'),
                                'text-silver': item.name?.toLowerCase().includes('silver'),
                                'text-bronze': item.name?.toLowerCase().includes('bronze'),
                                'text-silverBlue-1':
                                    !item.name?.toLowerCase().includes('gold') &&
                                    !item.name?.toLowerCase().includes('silver') &&
                                    !item.name?.toLowerCase().includes('bronze'),
                            })}
                        >
                            {item.name}
                        </Typography>

                    </div>
                </InfoBox>))}
            </div>

            <InfoBox className="bg-white/5">
                <Typography variant="footnote" weight="normal">

                    {
                        nftsCount === 0 ?
                            'You have 0 Genesis Onions. Spin or invite friends to claim Gold, Silver, and Bronze ONIONs now!'
                            : 'Spin or invite friends to claim more Gold, Silver, and Bronze ONIONs now!'
                    }
                </Typography>
            </InfoBox>
        </div>
    );
};
