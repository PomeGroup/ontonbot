"use client";

import { App } from "konsta/react";
import React, { ReactNode } from "react";

const KonstaAppProvider = ({ children }: { children: ReactNode }) => {
  return (
    <App
      theme={"ios"}
      className="min-h-full overflow-y-auto "
    >
      {children}
    </App>
  );
};

export default KonstaAppProvider;
