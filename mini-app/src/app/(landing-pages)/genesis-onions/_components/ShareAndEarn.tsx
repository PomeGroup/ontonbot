import { InfoBox } from "./InfoBox";
import GiftBoxImage from "../_assets/images/gift-box.svg";
import ApeImage from "../_assets/images/ape.png";
import Typography from "@/components/Typography";
import CapacityProgressBar from "./CapacityProgressBar";
import { Button } from "@/components/ui/button";
import ShareIconImage from "../_assets/icons/share_2.svg";
import Image from "next/image";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";

export const ShareAndEarn = () => {
    const shareAffiliateLinkMutation = trpc.telegramInteractions.requestShareAffiliateOnionCampaign.useMutation();

    const { data, isLoading, isError } = trpc.campaign.getOnionCampaignAffiliateData.useQuery();

    const invitesCount = data?.totalSpins ?? 0;
    const shareUrl = `https://t.me/theontonbot/start?startapp=${data?.linkHash}`;
    const shareText = `${shareUrl} \nA friend has invited you to join ONTON, Join, spin and collect Genesis ONIONs`;

    const handleInviteOnTelegram = async () => {
        try {
            await shareAffiliateLinkMutation.mutateAsync();
            window.Telegram.WebApp.close();

        } catch {
            toast.error('Unable to open the invitation dialogue, please try again later.');
        }
    };

    const handleShare = async () => {
        const shareData: ShareData = {
            text: shareText,
            title: `Genesis Onions Airdrop`,
            url: shareUrl,
        };

        try {
            await navigator.share(shareData);
        } catch (err) {
            toast.error("Error sharing, please try again later.");
        }
    };

    if (isLoading) return null;
    if (isError) return <div>Error loading affiliate links, please try again later.</div>;

    return (
        <div className="multi-step-gradient-bg px-4">
            <InfoBox className="flex flex-col items-center bg-white/10">
                <div className="flex flex-col gap-1 items-center">
                    <Typography
                        variant="headline"
                        weight="semibold"
                    >
                        Share & Earn
                    </Typography>

                    <Typography variant="subheadline2">Invite your friends to earn ONIONs.</Typography>
                </div>

                <Image
                    src={GiftBoxImage}
                    width={96}
                    height={96}
                    className="w-24 h-24 my-2"
                    alt="Share to Earn"
                />

                <div className="flex flex-col gap-4">
                    <Typography
                        className="px-10 text-center"
                        variant="footnote"
                        weight="bold"
                    >
                        Get a free spin for every 5 successful invites and a Gold ONION for 20 invites!
                    </Typography>

                    <div className="flex justify-between items-center bg-white/25 rounded-2lg px-4 h-11 gap-2">
                        <input
                            type="text"
                            readOnly
                            value={data?.linkHash}
                            className="border-none bg-transparent text-white outline-none flex-1 font-normal text-lg text-ellipsis overflow-hidden"
                        />

                        <button
                            className="text-orange bg-transparent border-none outline-none"
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
                            isLoading={shareAffiliateLinkMutation.isLoading}
                            disabled={shareAffiliateLinkMutation.isLoading}
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
                            <Image
                                src={ShareIconImage}
                                width={32}
                                height={32}
                                alt="Share"
                                className="w-8 h-8"
                            />
                        </Button>
                    </div>
                </div>
            </InfoBox>
        </div>
    );
};
