"use client";

import { App } from "konsta/react";
import React, { ReactNode } from "react";

const KonstaAppProvider = ({ children }: { children: ReactNode }) => {
  return <App theme={"ios"}>{children}</App>;
};

export default KonstaAppProvider;
