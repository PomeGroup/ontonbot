import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function removeKey<T extends object, K extends keyof T>(
  obj: T,
  key: K,
): Omit<T, K> {
  const { [key]: _, ...rest } = obj;
  return rest;
}
