import axios from "axios";

const tgClient = axios.create({
  baseURL: "http://telegram-bot:3333",
});

import { AxiosError } from "axios";

export const sendTelegramMessage = async (props: {
  chat_id: string | number;
  message: string;
  link?: string;
}) => {
  try {
    const response = await tgClient.post("http://127.0.0.1:3333/send-message", {
      chat_id: props.chat_id,
      custom_message: props.message,
      link: props.link,
    });

    // If the response indicates success, return the response data
    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Message sent successfully",
      };
    }

    // If the server responded but with an error, handle the error
    const errorMessage = `Error sending message sendTelegramMessage:${response.data.error || "An unknown error occurred"}`;
    console.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
      status: response.status || 500,
    };
  } catch (error: unknown) {
    // Type assertion to AxiosError
    if (error instanceof AxiosError && error.response && error.response.data) {
      // Handle errors returned from the server
      const errorMessage = `Error sending message sendTelegramMessage:${error.response.data.error || "Unknown error from server"}`;
      console.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
        status: error.response.status || 500,
      };
    }

    // For other types of errors, such as network errors
    const errorMessage = `Error sending message sendTelegramMessage:${(error as Error).message || "An unexpected error occurred"}`;
    console.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
      status: 500,
    };
  }
};

export const sendLogNotification = async (props: { message: string }) => {
  return await sendTelegramMessage({
    chat_id: process.env.TG_NOTIFICATION_CHANELL!,
    message: props.message,
  });
};
