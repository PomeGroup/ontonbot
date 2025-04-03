import Typography from "@/components/Typography";
import { InfoBox } from "./InfoBox";
import LoadableImage from "@/components/LoadableImage";
import { Gold, Silver, Bronze } from "../GenesisOnions.constants";
import { useMemo } from "react";
import Image from 'next/image'

export const YourNFTs = () => {
    const items = useMemo(() => {
        return [
            {
                count: 0,
                label: "ONION",
                image: <div className="h-8 aspect-square rounded-md grid place-items-center bg-gradient-radial from-gray-600 to-black">?</div>
            },
            {
                count: 0,
                label: Gold.name,
                image: Gold.image.src
            },
            {
                count: 0,
                label: Silver.name,
                image: Silver.image.src
            },
            {
                count: 0,
                label: Bronze.name,
                image: Bronze.image.src
            }
        ]
    }, [])

    const nftsCount = useMemo(() => {
        return items.reduce((acc, item) => acc + item.count, 0)
    }, [items])

    return (
        <div className="flex flex-col gap-3">
            <Typography variant="subheadline2">Your NFTs</Typography>
            <div className="flex gap-3">
                {items.map(item => (<InfoBox className="px-2 py-1 flex gap-2 flex-1 justify-between items-center" key={item.label}>
                    {
                        typeof item.image === "string" ?
                            <Image src={item.image} className="rounded-md" width={32} height={32} />
                            : item.image
                    }

                    <div className="flex flex-col items-center">
                        <div className="flex gap-1">
                            <span>x</span>
                            <Typography variant="headline">{item.count}</Typography>
                        </div>
                        <Typography variant="caption2">{item.label}</Typography>
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
