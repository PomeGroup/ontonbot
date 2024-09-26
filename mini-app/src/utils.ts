
import { validate } from "@telegram-apps/init-data-node";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TelegramInitDataJson, TelegramUser } from "./types";

const BOT_TOKEN = process.env.BOT_TOKEN || "";

const TONAPI_BEARER = "Bearer " + process.env.TONAPI_API_KEY;
const EXPIRATION_TIME = 86400; // 24 hours in seconds

const TON_API_AUTH_HEADER = {
  Authorization: TONAPI_BEARER,
};

export const validateMiniAppData = (rawInitData: string) => {
  const initData = new URLSearchParams(rawInitData);

  const initDataJson: TelegramInitDataJson = {} as TelegramInitDataJson;
  for (const [key, value] of initData) {
    if (key === "user") {
      initDataJson[key] = JSON.parse(value) as TelegramUser;
      continue;
    }
    initDataJson[key] = value;
  }

  try {
    // Validate the init data using Telegram's validation method
    validate(initData, BOT_TOKEN);

    // Extract the auth_date from the init data
    const authDate = parseInt(initData.get("auth_date") || "0", 10);

    // Check if auth_date is within the allowed timeframe (24 hours)
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    if (currentTime - authDate > EXPIRATION_TIME) {
      console.error("Init data expired");
      return {
        valid: false,
        message: "Init data expired",
        initDataJson,
      };
    }

    return {
      valid: true,
      initDataJson,
    };
  } catch (error) {
    console.error("Init data validation failed:", error);
    return {
      valid: false,
      message: "Init data validation failed",
      initDataJson,
    };
  }
};

export async function fetchBalance(address: string) {
  const url = `https://tonapi.io/v2/accounts/${address}`;

  try {
    const response = await fetch(url, { headers: TON_API_AUTH_HEADER });
    if (!response.ok) {
      return 0;
    }

    const jsonResponse = await response.json();
    const balance = jsonResponse.balance;
    if (!balance) {
      return 0;
    }

    return balance / 1e9;
  } catch (error: any) {
    return 0;
  }
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
export const parseDate = (utime: number) => {
  const parsedDate = new Date(utime * 1000);
  return parsedDate.toLocaleDateString();
};

export const utimeToDate = (timestamp: number | null) => {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp * 1000);
};

export const dateToUtime = (date: Date | undefined) => {
  if (!date) {
    return null;
  }

  return Math.round(date.getTime() / 1000);
};

export const getTimeFromUnix = (
  unixTimestamp: number
): { hours: string; minutes: string } => {
  const date = new Date(unixTimestamp * 1000);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return {
    hours,
    minutes,
  };
};

export const getDateFromUnix = (
  unixTimestamp: number
): { day: string; month: string; year: string } | null => {
  const date = new Date(unixTimestamp * 1000);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();

  if (year === "1970" && month === "01" && day === "01") {
    return null;
  }

  return {
    day,
    month,
    year,
  };
};

export function isEmptyObject(obj: object) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}
