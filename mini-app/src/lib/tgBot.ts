import axios from "axios";

const tgClient = axios.create({
  baseURL: "http://telegram-bot:3333",
});

export const sendTelegramMessage = async (props: {
  chat_id: string | number;
  message: string;
  link?: string;
}) => {
  return await tgClient.post("http://127.0.0.1:3333/send-message", {
    chat_id: props.chat_id,
    custom_message: props.message,
    link: props.link,
  });
};

export const sendLogNotification = async(props: { message: string }) => {
  return await sendTelegramMessage({
    chat_id: process.env.TG_NOTIFICATION_CHANELL!,
    message: props.message,
  });
};
