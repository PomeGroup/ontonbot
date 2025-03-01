import axios, { AxiosResponse } from "axios";
import { logger } from "@/server/utils/logger";

/**
 * Send an HTTP request using Axios.
 *
 * @param method - HTTP method (e.g. GET, POST)
 * @param url - The request URL
 * @param headers - An object with header key-value pairs
 * @param data - The request body (for non-GET methods)
 *
 * @returns An object with shape { success: boolean, data: any }
 */
export const sendHttpRequest = async (
  method: string,
  url: string,
  headers: Record<string, string> = {},
  data?: any
): Promise<{ success: boolean; data: any }> => {
  try {
    const resp: AxiosResponse = await axios.request({
      method: method,
      url: url,
      headers: headers,
      data: method === "GET" ? undefined : data,
      timeout: 10000,
    });
    logger.log(`HTTP ${method} ${url} response:`, resp.data ?? resp.status, data);
    // Consider 2xx responses as success
    const success = resp.status >= 200 && resp.status < 300;
    return { success, data: resp.data };
  } catch (error: any) {
    // If request fails or throws an exception
    const data = error?.response?.data ?? { error: error.message };
    return { success: false, data };
  }
};
