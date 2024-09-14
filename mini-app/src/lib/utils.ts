import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function removeKey<T extends object, K extends keyof T>(
  obj: T,
  key: K
): Omit<T, K> {
  const { [key]: _, ...rest } = obj;
  return rest;
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getObjectDifference<T extends object>(
  obj1: T,
  obj2: T
): Partial<T> | null {
  const diff: Partial<T> = {};

  for (const key in obj1) {
    if (obj1.hasOwnProperty(key)) {
      if (obj1[key] !== obj2[key]) {
        diff[key] = obj2[key];
      }
    }
  }

  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (obj1[key] === undefined && obj2[key] !== undefined) {
        diff[key] = obj2[key];
      }
    }
  }

  return Object.keys(diff).length > 0 ? diff : null;
}

export const fileToBase64 = (file: Blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

export const redirectTo = (path: string) => {
  window.location.replace(path);
  return false;
};

/**
 * Converts a duration in milliseconds to a human-readable time format (HH:MM:SS.SSS).
 *
 * @param {number} duration - The duration in milliseconds.
 * @return {string} The time in the format HH:MM:SS.SSS.
 */
export function msToTime(duration: number): string {
  const milliseconds = Math.floor((duration % 1000) / 100);
  let seconds: number | string = Math.floor((duration / 1000) % 60);
  let minutes: number | string = Math.floor((duration / (1000 * 60)) % 60);
  let hours: number | string = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? `0${hours}` : hours;
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  seconds = seconds < 10 ? `0${seconds}` : seconds;

  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}
