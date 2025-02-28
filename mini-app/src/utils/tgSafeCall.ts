import { GrammyError } from "grammy";

type TgSafeCallResult<T> =
  | {
      error: { message: string; error: unknown };
      data: null;
    }
  | {
      data: T;
      error: null;
    };

export async function tgSafeCall<T>(fn: () => Promise<T>): Promise<TgSafeCallResult<T>> {
  let result: T | null = null;
  let error: { message: string; error: unknown } | null;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      result = await fn();
      return { data: result, error: null };
    } catch (err) {
      if (err instanceof GrammyError && err.error_code === 429) {
        const waitTime = Math.pow(2, attempts) * 1000;
        await new Promise((res) => setTimeout(res, waitTime));
        attempts++;
      } else {
        error = { error: err, message: err instanceof Error ? err.message : "An unexpected error occurred." };
        return { data: null, error };
      }
    }
  }

  error = { error: null, message: "Rate limit exceeded while accessing Telegram API." };
  return { data: null, error };
}
