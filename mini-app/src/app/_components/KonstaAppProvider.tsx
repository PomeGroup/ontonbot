"use client";

import useWebApp from "@/hooks/useWebApp";
import { App } from "konsta/react";
import React, { ReactNode } from "react";

const KonstaAppProvider = ({ children }: { children: ReactNode }) => {
  const webApp = useWebApp();

  return <App theme={webApp?.platform !== "ios" ? "ios" : "material"}>{children}</App>;
};

export default KonstaAppProvider;
