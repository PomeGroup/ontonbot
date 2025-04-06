import Typography from "@/components/Typography";
import { InfoBox } from "./InfoBox";
import CapacityProgressBar from "./CapacityProgressBar";
import Image from 'next/image';
import { useSpin } from "../hooks/useSpin";

export const Capacity = () => {
    const { collections, isErrorCollections, isLoadingCollections } = useSpin()

    const filteredCollections = collections?.filter((collection) => collection.isForSale)

    if (isLoadingCollections) return null
    if (isErrorCollections) return <div>Error loading capacity data, please try again later...</div>

    return (
        <div className="flex flex-col gap-3">
            <Typography variant="subheadline2">NFT Capacity</Typography>
            <div className="flex flex-col gap-2">
                {filteredCollections?.map((item) => (
                    <InfoBox
                        className="px-2 py-1 flex gap-2 justify-between items-center border border-silverBlue-3 bg-transparent rounded-md"
                        key={item.id}
                    >
                        {item.image && <Image
                            src={item.image}
                            className="rounded-md"
                            width={32}
                            height={32}
                            alt={item.name ?? ''}
                        />}

                        {(item.salesVolume ?? 0) > -1 ? <div className="flex flex-col flex-1 gap-y-1.5">
                            <div className="flex justify-between items-end">
                                <Typography variant="footnote">{item.name}</Typography>

                                <div className="flex gap-1 items-end">
                                    <Typography variant="caption2">
                                        {item.salesCount ?? 0}/{item.salesVolume}
                                    </Typography>
                                    <Typography variant="caption2" className="text-2xs">({(item.salesVolume ?? 0) - (item.salesCount ?? 0)} left)</Typography>
                                </div>
                            </div>

                            <CapacityProgressBar total={item.salesVolume ?? 0} progress={item.salesCount ?? 0} />
                        </div>
                            :
                            <div className="flex flex-1 justify-between items-center">
                                <Typography variant="footnote">{item.name}</Typography>

                                <Typography variant="footnote">Unlimited</Typography>
                            </div>
                        }
                    </InfoBox>
                ))}
            </div>
        </div>
    );
};
