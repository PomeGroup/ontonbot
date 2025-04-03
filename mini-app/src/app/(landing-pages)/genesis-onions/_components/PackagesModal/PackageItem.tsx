import Typography from "@/components/Typography";
import { TokenCampaignSpinPackages } from "@/db/schema";
import { SPIN_PRICE_IN_TON } from "../../GenesisOnions.constants";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { ListItem } from "./ListItem";
import Image from "next/image";

interface Props {
    pkg: TokenCampaignSpinPackages;
}

export const PackageItem = ({ pkg }: Props) => {
    const originalPrice = pkg.spinCount * SPIN_PRICE_IN_TON
    const effectivePrice = Number(pkg.price)
    const discountAmount = originalPrice - effectivePrice

    return <div className="flex flex-col gap-2 col-span-1">
        <div className="flex flex-col gap-4 bg-white/15 p-2 rounded-2lg border">
            <div className="flex gap-2">
                <div>
                    {pkg.imageUrl ? <Image src={pkg.imageUrl} alt={pkg.name} width={36} height={36} />
                        :
                        <div className="bg-slate-600 rounded-full w-9 h-9" />}
                </div>

                <div className="flex flex-col gap-1 overflow-hidden">
                    <Typography variant="subheadline2" weight="medium" className="text-nowrap text-ellipsis overflow-hidden">{pkg.description}</Typography>

                    <h3>
                        <Typography variant="caption2" weight="light">{pkg.name}</Typography>
                    </h3>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                    <Typography variant="footnote" weight="semibold" className="flex gap-1 items-end">{effectivePrice} {pkg.currency}</Typography>
                    {
                        effectivePrice < originalPrice &&
                        <Typography
                            className="line-through flex gap-1 items-end"
                            variant="caption2"
                            weight="normal">
                            <span className="line-through">{originalPrice} {pkg.currency}</span>
                        </Typography>
                    }
                </div>

                <Button variant="default" className="bg-orange hover:bg-orange/80 drop-shadow-lg">
                    <Typography variant="callout" weight="semibold">Pay & Spin</Typography>
                </Button>
            </div>
        </div>

        <ul className="list-image-none flex flex-col gap-1">
            {!discountAmount && <ListItem><Typography variant="caption1" weight="light">Spin to win</Typography></ListItem>}
            {discountAmount && <>
                <ListItem>
                    <Typography variant="caption1" weight="light" className="flex gap-1">
                        <span>Save</span>
                        <Typography variant="caption1" weight="medium">{discountAmount}</Typography>
                        <span>{pkg.currency}</span>
                    </Typography>
                </ListItem>

                <ListItem><Typography variant="caption1" weight="light">Spin faster</Typography></ListItem>
            </>}
        </ul>
    </div>
}