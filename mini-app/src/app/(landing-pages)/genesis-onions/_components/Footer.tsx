
import Image from 'next/image';
import OnionsCollectionImage from '../_assets/images/collection-heading.svg';
import { ShareAndEarn } from "./ShareAndEarn";
import Typography from "@/components/Typography";
import { Bronze, Gold, Silver } from "../GenesisOnions.constants";
import { InfoBox } from "./InfoBox";

export const Footer = () => (<>
    <ShareAndEarn />

    <Image src={OnionsCollectionImage} alt="Genesis Onions Collection" className="mt-8 mx-auto" width={390} />

    <div className="flex flex-col gap-5 px-4 bg-[url('/bg-pattern.svg')] bg-left-top bg-cover">
        <Typography variant="footnote" weight="normal" className="text-center">Genesis ONIONs are your key to the $ONION airdrop. The more you hold, the more you earn. Keep collecting before time runs out!</Typography>

        <div className="flex justify-between">
            {[Gold, Silver, Bronze].map(item => <div key={item.name} className="flex flex-col gap-2 items-center">
                <div className="px-3">

                    <Image src={item.image.src} alt={item.name} width={80} height={80} className='rounded-2lg' />
                </div>
                <Typography variant="subheadline2" weight="bold">{item.title}</Typography>
            </div>)}
        </div>

        <InfoBox>
            <Typography variant="callout" weight="semibold" className='inline'>Maximize Your Airdrop:</Typography>
            <Typography variant="subheadline1" weight="medium" className='inline ms-1'>Collect all three tiers to receive an ultra-rare Diamond ONION that boosts your entire airdrop!</Typography>
        </InfoBox>
    </div></>)