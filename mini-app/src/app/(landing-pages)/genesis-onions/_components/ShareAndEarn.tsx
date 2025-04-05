import { InfoBox } from "./InfoBox";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { trpc } from "@/app/_trpc/client";
import { useAffiliate } from "../hooks/useAffiliate";
import { customToast } from "../GenesisOnions.utils";
import { Share } from "lucide-react";

const rewardsGuide = [
    {
        title: '1 Free Spin',
        subtitle: 'Every 5 invites'
    },
    {
        title: '1 Gold ONION',
        subtitle: 'Every 20 invites'
    },

]

export const ShareAndEarn = () => {
    const { inviteOnTelegram, isLoading: isLoadingInviteOnTelegram } = useAffiliate()

    const { data, isLoading, isError } = trpc.campaign.getOnionCampaignAffiliateData.useQuery();

    const shareUrl = `https://t.me/theontonbot/start?startapp=${data?.linkHash}`;
    const shareText = `${shareUrl} \nA friend has invited you to join ONTON, Join, spin and collect Genesis ONIONs`;

    const handleInviteOnTelegram = () => {
        try {
            inviteOnTelegram();
        } catch (error) {
            customToast.error("Unable to open the invitation dialogue, please try again later.");
        }
    }

    const handleShare = async () => {
        const shareData: ShareData = {
            text: shareText,
            title: `Genesis Onions Airdrop`,
            url: shareUrl,
        };

        try {
            await navigator.share(shareData);
        } catch (err) {
            customToast.error("Error sharing, please try again later.");
        }
    };

    if (isLoading) return null;
    if (isError) return <div>Error loading affiliate links, please try again later.</div>;

    return (
        <div className="multi-step-gradient-bg px-4">
            <InfoBox className="flex flex-col items-center bg-white/10">
                <div className="flex flex-col gap-1 items-center mb-2">
                    <Typography
                        variant="headline"
                        weight="semibold"
                    >
                        Share & Earn
                    </Typography>

                    <Typography variant="subheadline2">Invite your friends to earn ONIONs.</Typography>
                </div>


                <div className="w-24 h-24 bg-[url('/orange-cards.svg')] bg-no-repeat bg-center flex flex-col gap-1 justify-center items-center mb-4">
                    <Typography variant="title2" weight="bold">
                        {data.totalSpins}
                    </Typography>

                    <Typography variant="caption2" weight="normal">invites</Typography>
                </div>


                <div className="flex flex-col gap-4 w-full">
                    <div className="flex gap-3 w-full">
                        {rewardsGuide.map(item => <div key={item.title} className="border rounded-md py-2 px-3 flex flex-col gap-2 flex-1 items-center">
                            <Typography variant="subheadline2" weight="medium">{item.title}</Typography>
                            <Typography variant="caption2">{item.subtitle}</Typography>
                        </div>)}
                    </div>

                    <div className="flex justify-between items-center bg-white/25 rounded-2lg px-4 h-11 gap-2">
                        <input
                            type="text"
                            readOnly
                            value={data?.linkHash}
                            className="border-none bg-transparent text-white outline-none flex-1 font-normal text-lg text-ellipsis overflow-hidden"
                        />

                        <button
                            className="text-orange bg-transparent border-none outline-none hidden"
                            onClick={() => navigator.clipboard.writeText(shareText)}
                        >
                            <Typography
                                variant="body"
                                weight="medium"
                            >
                                Copy
                            </Typography>
                        </button>
                    </div>

                    <div className="flex gap-3 h-12">
                        <Button
                            type="button"
                            size="lg"
                            className="rounded-2lg h-full flex flex-1 items-center justify-center bg-orange hover:bg-orange/80 overflow-hidden drop-shadow-md"
                            onClick={handleInviteOnTelegram}
                            isLoading={isLoadingInviteOnTelegram}
                            disabled={isLoadingInviteOnTelegram}
                        >
                            <Typography
                                variant="body"
                                weight="medium"
                            >
                                Invite on Telegram
                            </Typography>
                        </Button>

                        <Button
                            variant="default"
                            className="bg-white hover:bg-white/80 h-full aspect-square p-0 drop-shadow-md"
                            onClick={handleShare}
                        >
                            <Share size={24} className="text-orange" />
                        </Button>
                    </div>
                </div>
            </InfoBox>
        </div>
    );
};
