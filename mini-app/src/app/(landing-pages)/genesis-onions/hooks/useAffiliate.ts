import { trpc } from "@/app/_trpc/client";

export const useAffiliate = () => {
    const { mutateAsync: inviteAsync, isLoading, isError } = trpc.telegramInteractions.requestShareAffiliateOnionCampaign.useMutation();

    const inviteOnTelegram = async () => {
        try {
            await inviteAsync();
            window.Telegram.WebApp.close();

        } catch {
            throw new Error("Unable to open the invitation dialogue, please try again later.");
        }
    };

    return {
        inviteOnTelegram,
        isLoading,
        isError
    };
}