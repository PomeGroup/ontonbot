import {EventType, EventTypeSecure, RewardType, VisitorsType} from "@/types/event.types";
import {sendTelegramMessage} from "@/lib/tgBot";
import {rewardLinkZod} from "@/types/user.types";

const sendRewardNotification = async (
  reward: RewardType,
  visitor: VisitorsType,
  event: EventTypeSecure
) => {
  await sendTelegramMessage({
    link: rewardLinkZod.parse(reward.data).reward_link,
    chat_id: visitor.user_id as number,
    message: `Hey there, you just received your reward for ${event.title} event. Please click on the link below to claim it`,
  });
};

/****** export telegramService ******/

const telegramService = {
    sendRewardNotification
}
export default telegramService;