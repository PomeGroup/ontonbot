import Typography from "@/components/Typography";
import { InfoBox } from "./InfoBox";
import { useMemo } from "react";
import Image from 'next/image';
import { useUserCampaign } from "../hooks/useUserCampaign";

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
                {userCollection?.map(item => (<InfoBox className="px-2 py-1 flex gap-2 flex-1 justify-between items-center" key={item.name}>
                    {item.image && <Image src={item.image} className="rounded-md" width={32} height={32} alt={`${item.name} NFT`} />}

                    <div className="flex flex-col items-center">
                        <div className="flex gap-1">
                            <span>x</span>
                            <Typography variant="headline">{item.count}</Typography>
                        </div>
                        <Typography variant="caption2">{item.name}</Typography>
                    </div>
                </InfoBox>))}
            </div>

            <InfoBox>
                {
                    nftsCount === 0 ?
                        'You haven’t earned any NFTs yet! Get spin chances or invite friends to earn GOLDs faster.'
                        : 'Spin or invite friends to claim more Gold, Silver, and Bronze ONIONs now!'
                }
            </InfoBox>
        </div>
    );
};
