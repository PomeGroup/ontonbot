"use client";

import useWebApp from "@/hooks/useWebApp";
import { App } from "konsta/react";
import React, { ReactNode } from "react";

const KonstaAppProvider = ({ children }: { children: ReactNode }) => {
  const webApp = useWebApp();

  return <App theme={"ios"}>{children}</App>;
};

export default KonstaAppProvider;
