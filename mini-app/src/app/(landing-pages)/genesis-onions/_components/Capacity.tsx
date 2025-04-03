import Typography from "@/components/Typography";
import { InfoBox } from "./InfoBox";
import LoadableImage from "@/components/LoadableImage";
import { Gold, Silver, Bronze } from "../GenesisOnions.constants";
import { useMemo } from "react";
import CapacityProgressBar from "./CapacityProgressBar";
import Image from 'next/image'

export const Capacity = () => {
    const items = useMemo(() => {
        return [
            {
                total: 5000,
                filled: 2000,
                label: Gold.name,
                image: Gold.image.src,
            },
            {
                total: 15000,
                filled: 2000,
                label: Silver.name,
                image: Silver.image.src,
            },
            {
                total: Infinity,
                label: Bronze.name,
                image: Bronze.image.src,
            },
        ];
    }, []);

    return (
        <div className="flex flex-col gap-3">
            <Typography variant="subheadline2">NFT Capacity</Typography>
            <div className="flex flex-col gap-2">
                {items.map((item) => (
                    <InfoBox
                        className="px-2 py-1 flex gap-2 justify-between items-center"
                        key={item.label}
                    >
                        <Image
                            src={item.image}
                            className="rounded-md"
                            width={32}
                            height={32}
                        />

                        {item.filled ? <div className="flex flex-col flex-1 gap-y-1.5">
                            <div className="flex justify-between items-end">
                                <Typography variant="footnote">{item.label}</Typography>

                                <div className="flex gap-1">
                                    <Typography variant="caption2">
                                        {item.filled}/{item.total}
                                    </Typography>
                                    <Typography variant="caption2" className="text-2xs">({item.total - item.filled} left)</Typography>
                                </div>
                            </div>

                            <CapacityProgressBar total={item.total} progress={item.filled} />
                        </div>
                            : <Typography variant="footnote">Unlimited</Typography>
                        }
                    </InfoBox>
                ))}
            </div>
        </div>
    );
};
