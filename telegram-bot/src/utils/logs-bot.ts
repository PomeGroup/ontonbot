import { Bot } from "grammy";
import { configProtected } from "./onton-config";
import { sleep } from "./utils";

let logsBot: undefined | Bot;

const getLogsBot = async (): Promise<Bot> => {
  try {
    if (!logsBot) {
      logsBot = new Bot(configProtected["bot_token_logs"]);
    }
    return logsBot;
  } catch (error) {
    await sleep(1000);
    return await getLogsBot();
  }
};

getLogsBot();

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
    await logsBot.api.sendMessage(
      Number(configProtected["logs_group_id"]),
      text,
      {
        reply_to_message_id: Number(configProtected[topic]),
      },
    );
  } catch (error) {
    // __AUTO_GENERATED_PRINT_VAR_START__
    console.error("telegram bot sendTopicMessage error: %s", error); // __AUTO_GENERATED_PRINT_VAR_END__
  }
};
