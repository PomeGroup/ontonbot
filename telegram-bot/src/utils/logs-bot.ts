import { Bot } from "grammy";
import { configProtected } from "./onton-config";

export const logsBot = new Bot(configProtected["bot_token_logs"]);

const logs_topics = [
  "events_topic",
  "general",
  "tickets_topic",
  "organizers_topic",
  "system_topic",
] as const;

export const sendTopicMessage = async (
  topic: (typeof logs_topics)[number],
  text: string,
) => {
  try {
    await logsBot.api.sendMessage(configProtected["bot_token_logs"], text, {
      reply_to_message_id: Number(configProtected[topic]),
    });
  } catch (error) {
    // __AUTO_GENERATED_PRINT_VAR_START__
    console.error("telegram bot sendTopicMessage error: %s", error); // __AUTO_GENERATED_PRINT_VAR_END__
  }
};
