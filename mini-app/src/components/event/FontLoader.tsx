"use client";

import { PropsWithChildren, useEffect } from "react";
import { Roboto } from "next/font/google";
import local from "next/font/local";
import { useLaunchParams } from "@telegram-apps/sdk-react";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

const sfPro = local({
  src: [
    {
      path: "./../public/SF-Pro.ttf",
    },
  ],
});

const FontLoader = ({ children }: PropsWithChildren) => {
  const launchParams = useLaunchParams();

  useEffect(() => {
    if (
      launchParams?.platform === "ios" ||
      launchParams?.platform === "macos"
    ) {
      document.body.classList.add(sfPro.className);
      document.body.classList.remove(roboto.className);
    } else {
      document.body.classList.remove(sfPro.className);
      document.body.classList.add(roboto.className);
    }
  }, [launchParams?.platform]);

  return <>{children}</>;
};

export default FontLoader;
