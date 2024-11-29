"use client";

import useWebApp from "@/hooks/useWebApp";
import { App } from "konsta/react";
import React, { ReactNode } from "react";

const KonstaAppProvider = ({ children }: { children: ReactNode }) => {
  const webApp = useWebApp();

  return (
    <App
      theme={"ios"}
      safeAreas={false}
      style={{
        minHeight: webApp?.viewportStableHeight,
      }}
    >
      {children}
    </App>
  );
};

export default KonstaAppProvider;
