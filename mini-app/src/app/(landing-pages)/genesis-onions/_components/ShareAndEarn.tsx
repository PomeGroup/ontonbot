import { InfoBox } from "./InfoBox";
import GiftBoxImage from '../_assets/images/gift-box.svg';
import ApeImage from '../_assets/images/ape.png';
import Typography from "@/components/Typography";
import CapacityProgressBar from "./CapacityProgressBar";
import { Button } from "@/components/ui/button";
import ShareIconImage from '../_assets/icons/share_2.svg';
import Image from 'next/image';

export const ShareAndEarn = () => {
    const invitesCount = 3
    const invitationCode = 'nad9dy-ajss'
    // TODO: set proper text
    const clipboardText = `Invite your friends to earn ONIONs. https://onions.t.me .\n Use my invitation code: ${invitationCode}`

    return <InfoBox className="flex flex-col items-center mx-4">
        <Image src={GiftBoxImage} width={96} height={96} className="w-24 h-24 mb-2" alt="Share to Earn" />

        <div className="flex flex-col gap-1 items-center">
            <Typography variant="headline" weight="semibold">Share & Earn</Typography>

            <Typography variant="subheadline2">Invite your friends to earn ONIONs.</Typography>
        </div>

        <div className="flex justify-between w-full items-end pt-5">
            <div className="flex flex-col gap-1 flex-1">
                <Typography variant="footnote" weight="normal">Successful invites</Typography>

                <div className="flex relative">
                    <CapacityProgressBar total={20} progress={invitesCount} />
                    <Image src={ApeImage.src} width={45} height={56} className="grayscale absolute right-0 bottom-0 w-10 h-13 translate-x-3 -translate-y-px" alt="Target!" />
                </div>

                <Typography variant="caption2" weight="normal">{invitesCount}/20</Typography>
            </div>
        </div>

        <div className="flex flex-col gap-4 mt-2">
            <Typography className="px-10 text-center" variant="footnote" weight="bold">Get a free spin for every 5 successful invites and a Gold ONION for 20 invites!</Typography>

            <div className="flex justify-between items-center bg-white/25 rounded-2lg px-4 h-11">
                <input type="text" readOnly value={invitationCode} className="border-none bg-transparent text-white outline-none flex-1 font-normal text-lg" />

                <button className="text-orange bg-transparent border-none outline-none"
                    onClick={() => navigator.clipboard.writeText(clipboardText)}
                >
                    <Typography variant="body" weight="medium">Copy</Typography>
                </button>
            </div>

            <div className="flex gap-3 h-12">
                <Button
                    type="button"
                    size="lg"
                    className="rounded-2lg h-full flex flex-1 items-center justify-center bg-orange hover:bg-orange/80 overflow-hidden"
                >
                    <Typography
                        variant="body"
                        weight="medium"
                    >
                        Invite on Telegram
                    </Typography>
                </Button>

                <Button variant="default" className="bg-white hover:bg-white/80 h-full aspect-square p-0">
                    <Image src={ShareIconImage} width={32} height={32} alt="Share" className="w-8 h-8" />
                </Button>
            </div>
        </div>
    </InfoBox>
}