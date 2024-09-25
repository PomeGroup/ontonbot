import { Platform } from "@telegram-apps/sdk-react";

type PlatformCallbacks = {
  ios?: () => any;
  android?: () => any;
  default?: () => any;
};

export function platformSwitch(
  platform: Platform | undefined,
  callbacks: PlatformCallbacks
) {
  if (!platform)
    throw new Error("Please provide platform to load components from.");

  if (callbacks.ios) {
    return callbacks.ios();
  } else if (callbacks.default) {
    return callbacks.default();
  }
}
