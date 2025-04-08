"use client";

import { ErrorState } from "@/app/_components/ErrorState";
import { trpc } from "@/app/_trpc/client";
import React, { createContext, useContext } from "react";

type ConfigContextType = {
  [key: string]: string | null;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const emptyObject = {};
export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, error } = trpc.config.getConfig.useQuery();

  if (error) {
    console.error("Failed to fetch config:", error);
    if (error?.data?.code === "FORBIDDEN") {
      return <ErrorState errorCode="banned" />;
    }
  }

  return <ConfigContext.Provider value={data?.config || emptyObject}>{children}</ConfigContext.Provider>;
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
