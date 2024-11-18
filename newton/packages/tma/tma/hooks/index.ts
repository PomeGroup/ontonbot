import { useLaunchParams } from "./useLunchParams";

export * from "./useLunchParams";

type PlatformCallbacks = {
  ios?: () => void;
  android?: () => void;
  default?: () => void;
};

export function usePlatformSwitch(callbacks: PlatformCallbacks) {
  const launchParams = useLaunchParams();

  if (
    (launchParams?.platform.search("ios") !== -1 ||
      launchParams.platform.search("macos") !== -1 ||
      launchParams.platform.search("tdesktop")) &&
    callbacks.ios
  ) {
    callbacks.ios();
  } else if (
    launchParams?.platform.search("android") !== -1 &&
    callbacks.android
  ) {
    callbacks.android();
  } else if (callbacks.default) {
    callbacks.default();
  }
}
